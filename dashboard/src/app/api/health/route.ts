import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const info: Record<string, any> = {};
  const errors: Record<string, any> = {};
  let overallStatus: "ok" | "error" = "ok";

  // 1. Redis Health Indicator
  try {
    const redis = getRedisClient();
    const redisStart = Date.now();
    const pingRes = await redis.ping();
    const redisLatency = Date.now() - redisStart;

    if (pingRes === "PONG") {
      info["redis"] = {
        status: "up",
        latency_ms: redisLatency,
      };
    } else {
      throw new Error(`Unexpected ping response: ${pingRes}`);
    }
  } catch (err: any) {
    overallStatus = "error";
    errors["redis"] = {
      status: "down",
      message: err?.message || "Failed to reach Redis",
    };
  }

  // 2. OpenResty Gateway Health Indicator
  const gatewayUrl = process.env.GATEWAY_URL || "http://antiddos_gateway:80/healthz";
  try {
    const gwStart = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(gatewayUrl, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    const gwLatency = Date.now() - gwStart;
    if (res.ok) {
      info["gateway"] = {
        status: "up",
        http_status: res.status,
        response_time_ms: gwLatency,
      };
    } else {
      throw new Error(`Gateway returned HTTP ${res.status}`);
    }
  } catch (err: any) {
    // Note: in isolated dev environment gateway might not be running locally
    info["gateway"] = {
      status: "unknown",
      message: err?.message || "Gateway check skipped",
    };
  }

  // 3. Memory Heap Health Indicator
  const memUsage = process.memoryUsage();
  const heapUsedMb = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
  const heapTotalMb = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
  const rssMb = (memUsage.rss / 1024 / 1024).toFixed(2);

  // Consider healthy if heap < 400MB
  const heapHealthy = memUsage.heapUsed < 400 * 1024 * 1024;
  info["memory_heap"] = {
    status: heapHealthy ? "up" : "down",
    used_mb: parseFloat(heapUsedMb),
    allocated_mb: parseFloat(heapTotalMb),
  };

  info["memory_rss"] = {
    status: "up",
    used_mb: parseFloat(rssMb),
  };

  const responsePayload = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    total_check_time_ms: Date.now() - startTime,
    info,
    error: errors,
    details: { ...info, ...errors },
  };

  const httpStatus = overallStatus === "ok" ? 200 : 503;
  return NextResponse.json(responsePayload, { status: httpStatus });
}
