import { NextResponse } from "next/server";
import Redis from "ioredis";

export const dynamic = "force-dynamic";

function getRedisClient() {
  const host = process.env.REDIS_HOST || "127.0.0.1";
  const port = parseInt(process.env.REDIS_PORT || "6379", 10);
  const password = process.env.REDIS_PASSWORD || undefined;

  return new Redis({
    host,
    port,
    password,
    connectTimeout: 2000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });
}

// In-memory fallback if Redis is not running locally
let inMemoryCustomRules: Array<{
  id: string;
  name: string;
  field: "uri" | "user_agent" | "header" | "query";
  operator: "contains" | "equals" | "regex";
  value: string;
  action: "DROP" | "CHALLENGE" | "LOG";
  enabled: boolean;
  created_at: string;
}> = [
  {
    id: "rule_wp_admin",
    name: "Block WordPress Scanners",
    field: "uri",
    operator: "contains",
    value: "/wp-login.php",
    action: "DROP",
    enabled: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "rule_curl_pow",
    name: "Challenge Python & Headless UA",
    field: "user_agent",
    operator: "contains",
    value: "python-requests",
    action: "CHALLENGE",
    enabled: true,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

export async function GET() {
  const redis = getRedisClient();
  try {
    const raw = await redis.get("waf:custom_rules");
    await redis.quit();

    if (raw) {
      const parsed = JSON.parse(raw);
      return NextResponse.json({ status: "success", rules: parsed });
    }
  } catch {}

  return NextResponse.json({ status: "success", rules: inMemoryCustomRules });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, field, operator, value, action, enabled } = body;

    if (!name || !field || !operator || !value || !action) {
      return NextResponse.json(
        { status: "error", error: "Missing required rule attributes" },
        { status: 400 }
      );
    }

    const ruleId = id || `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRule = {
      id: ruleId,
      name,
      field,
      operator,
      value,
      action,
      enabled: enabled ?? true,
      created_at: new Date().toISOString(),
    };

    // Update in-memory fallback
    const existingIndex = inMemoryCustomRules.findIndex((r) => r.id === ruleId);
    if (existingIndex >= 0) {
      inMemoryCustomRules[existingIndex] = newRule;
    } else {
      inMemoryCustomRules.unshift(newRule);
    }

    // Save to Redis
    const redis = getRedisClient();
    try {
      await redis.set("waf:custom_rules", JSON.stringify(inMemoryCustomRules));
      await redis.quit();
    } catch {}

    return NextResponse.json({
      status: "success",
      message: `WAF Rule "${name}" successfully deployed!`,
      rule: newRule,
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", error: e.message || "Failed to save rule" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { status: "error", error: "Rule ID required" },
        { status: 400 }
      );
    }

    inMemoryCustomRules = inMemoryCustomRules.filter((r) => r.id !== id);

    const redis = getRedisClient();
    try {
      await redis.set("waf:custom_rules", JSON.stringify(inMemoryCustomRules));
      await redis.quit();
    } catch {}

    return NextResponse.json({
      status: "success",
      message: `Rule ${id} removed from WAF policy`,
    });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", error: e.message || "Failed to delete rule" },
      { status: 500 }
    );
  }
}
