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

// In-memory fallback
let inMemoryDomains: Array<{
  id: string;
  domain: string;
  issuer: "letsencrypt" | "custom";
  force_https: boolean;
  hsts: boolean;
  tls13_strict: boolean;
  expires_at: string;
  days_remaining: number;
  status: "active" | "pending";
}> = [
  {
    id: "dom_edge_primary",
    domain: "fluxwall.defense.local",
    issuer: "letsencrypt",
    force_https: true,
    hsts: true,
    tls13_strict: true,
    expires_at: new Date(Date.now() + 85 * 86400000).toISOString(),
    days_remaining: 85,
    status: "active",
  },
];

export async function GET() {
  const redis = getRedisClient();
  try {
    const raw = await redis.get("config:ssl_domains");
    await redis.quit();

    if (raw) {
      const parsed = JSON.parse(raw);
      return NextResponse.json({
        status: "success",
        domains: parsed,
      });
    }
  } catch {}

  return NextResponse.json({
    status: "success",
    domains: inMemoryDomains,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, action, domain, issuer = "letsencrypt", force_https = true, hsts = true, tls13_strict = true } = body;

    // Toggle specific flag
    if (action === "toggle_flag" && id) {
      const target = inMemoryDomains.find((d) => d.id === id);
      if (target) {
        if (body.flag === "force_https") target.force_https = !target.force_https;
        if (body.flag === "hsts") target.hsts = !target.hsts;
        if (body.flag === "tls13_strict") target.tls13_strict = !target.tls13_strict;

        const redis = getRedisClient();
        try {
          await redis.set("config:ssl_domains", JSON.stringify(inMemoryDomains));
          await redis.quit();
        } catch {}

        return NextResponse.json({
          status: "success",
          message: `Domain ${target.domain} security settings updated!`,
          domain: target,
        });
      }
    }

    if (!domain) {
      return NextResponse.json(
        { status: "error", error: "Domain name is required" },
        { status: 400 }
      );
    }

    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "");
    const newDomainItem = {
      id: `dom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      domain: cleanDomain,
      issuer: issuer as "letsencrypt" | "custom",
      force_https: Boolean(force_https),
      hsts: Boolean(hsts),
      tls13_strict: Boolean(tls13_strict),
      expires_at: new Date(Date.now() + 90 * 86400000).toISOString(),
      days_remaining: 90,
      status: "active" as const,
    };

    inMemoryDomains.push(newDomainItem);

    const redis = getRedisClient();
    try {
      await redis.set("config:ssl_domains", JSON.stringify(inMemoryDomains));
      await redis.quit();
    } catch {}

    return NextResponse.json({
      status: "success",
      message: `Domain ${cleanDomain} registered with SSL protection!`,
      domain: newDomainItem,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", error: err.message || "Failed to add domain" },
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
        { status: "error", error: "Domain ID required" },
        { status: 400 }
      );
    }

    inMemoryDomains = inMemoryDomains.filter((d) => d.id !== id);

    const redis = getRedisClient();
    try {
      await redis.set("config:ssl_domains", JSON.stringify(inMemoryDomains));
      await redis.quit();
    } catch {}

    return NextResponse.json({
      status: "success",
      message: `Domain configuration removed`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", error: err.message || "Failed to remove domain" },
      { status: 500 }
    );
  }
}
