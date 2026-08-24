import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";

export const dynamic = "force-dynamic";

export interface CapturedPacket {
  id: string;
  time: string;
  client_ip: string;
  country: string;
  method: "GET" | "POST" | "HEAD" | "PUT" | "DELETE" | "OPTIONS";
  uri: string;
  status: number;
  protection: "inspected-pass" | "bot-filter" | "rate-limited" | "geo-block" | "custom-waf" | "blacklisted" | "whitelisted";
  payload_size: string;
  latency_ms: number;
  headers: Record<string, string>;
}

// In-memory packet buffer for local development if Redis is offline
let localLivePacketRingBuffer: CapturedPacket[] = [];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("count") || "20", 10), 50);

  try {
    const redis = getRedisClient();
    const rawList = await redis.lrange("fluxwall:packets", 0, limit - 1);
    await redis.quit();

    if (rawList && rawList.length > 0) {
      const parsed = rawList
        .map((item) => {
          try {
            return JSON.parse(item);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      return NextResponse.json({
        status: "success",
        source: "redis_live_production",
        stream_active: true,
        packets: parsed,
      });
    }
  } catch {}

  // Fallback to local live ring buffer
  return NextResponse.json({
    status: "success",
    source: "local_live_buffer",
    stream_active: true,
    packets: localLivePacketRingBuffer.slice(0, limit),
  });
}

// Endpoint to ingest real packets from Middleware / Simulator / Gateway
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const packet: CapturedPacket = {
      id: body.id || `pkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      time: body.time || new Date().toISOString().split("T")[1].replace("Z", ""),
      client_ip: body.client_ip || "127.0.0.1",
      country: body.country || "LOCAL",
      method: body.method || "GET",
      uri: body.uri || "/",
      status: body.status || 200,
      protection: body.protection || "inspected-pass",
      payload_size: body.payload_size || "412 B",
      latency_ms: body.latency_ms || 0.32,
      headers: body.headers || {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0",
        "X-Forwarded-For": body.client_ip || "127.0.0.1",
        "X-Gateway-Protection": body.protection || "inspected-pass",
        "Connection": "keep-alive",
      },
    };

    localLivePacketRingBuffer.unshift(packet);
    if (localLivePacketRingBuffer.length > 60) {
      localLivePacketRingBuffer = localLivePacketRingBuffer.slice(0, 60);
    }

    try {
      const redis = getRedisClient();
      await redis.lpush("fluxwall:packets", JSON.stringify(packet));
      await redis.ltrim("fluxwall:packets", 0, 59);
      await redis.quit();
    } catch {}

    return NextResponse.json({ status: "success", packet });
  } catch (err: any) {
    return NextResponse.json({ status: "error", error: err.message }, { status: 500 });
  }
}
