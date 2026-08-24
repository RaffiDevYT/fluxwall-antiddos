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
let inMemoryUpstreams: Array<{
  id: string;
  host: string;
  port: number;
  protocol: "http" | "https";
  weight: number;
  status: "healthy" | "degraded" | "down";
  latency_ms: number;
  last_checked: string;
}> = [
  {
    id: "upstream_primary",
    host: "127.0.0.1",
    port: 3000,
    protocol: "http",
    weight: 10,
    status: "healthy",
    latency_ms: 1.2,
    last_checked: new Date().toISOString(),
  },
  {
    id: "upstream_failover",
    host: "10.0.0.15",
    port: 8080,
    protocol: "http",
    weight: 5,
    status: "healthy",
    latency_ms: 4.8,
    last_checked: new Date().toISOString(),
  },
];

let currentAlgorithm = "round_robin";

export async function GET() {
  const redis = getRedisClient();
  try {
    const raw = await redis.get("config:upstreams");
    const algo = await redis.get("config:lb_algorithm");
    await redis.quit();

    if (raw) {
      const parsed = JSON.parse(raw);
      return NextResponse.json({
        status: "success",
        algorithm: algo || currentAlgorithm,
        upstreams: parsed,
      });
    }
  } catch {}

  return NextResponse.json({
    status: "success",
    algorithm: currentAlgorithm,
    upstreams: inMemoryUpstreams,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "update_algorithm") {
      currentAlgorithm = body.algorithm || "round_robin";
      const redis = getRedisClient();
      try {
        await redis.set("config:lb_algorithm", currentAlgorithm);
        await redis.quit();
      } catch {}
      return NextResponse.json({
        status: "success",
        message: `Load balancing algorithm changed to ${currentAlgorithm}`,
      });
    }

    const { host, port, protocol = "http", weight = 1 } = body;

    if (!host || !port) {
      return NextResponse.json(
        { status: "error", error: "Host and Port are required" },
        { status: 400 }
      );
    }

    const newUpstream = {
      id: `ups_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      host,
      port: parseInt(port, 10),
      protocol: protocol as "http" | "https",
      weight: parseInt(weight, 10) || 1,
      status: "healthy" as const,
      latency_ms: parseFloat((Math.random() * 3 + 1).toFixed(1)),
      last_checked: new Date().toISOString(),
    };

    inMemoryUpstreams.push(newUpstream);

    const redis = getRedisClient();
    try {
      await redis.set("config:upstreams", JSON.stringify(inMemoryUpstreams));
      await redis.quit();
    } catch {}

    return NextResponse.json({
      status: "success",
      message: `Upstream target ${host}:${port} registered!`,
      upstream: newUpstream,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", error: err.message || "Failed to add upstream" },
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
        { status: "error", error: "Upstream ID required" },
        { status: 400 }
      );
    }

    inMemoryUpstreams = inMemoryUpstreams.filter((u) => u.id !== id);

    const redis = getRedisClient();
    try {
      await redis.set("config:upstreams", JSON.stringify(inMemoryUpstreams));
      await redis.quit();
    } catch {}

    return NextResponse.json({
      status: "success",
      message: `Upstream target removed`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", error: err.message || "Failed to remove upstream" },
      { status: 500 }
    );
  }
}
