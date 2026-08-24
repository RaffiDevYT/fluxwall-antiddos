import { getRedisClient } from "./redis";

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

export interface LogEvent {
  id: string;
  time: number;
  time_formatted?: string;
  client_ip: string;
  event: string;
  reason?: string;
  uri?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var fluxwallPacketBuffer: CapturedPacket[] | undefined;
  // eslint-disable-next-line no-var
  var fluxwallLogBuffer: LogEvent[] | undefined;
}

if (!global.fluxwallPacketBuffer) {
  global.fluxwallPacketBuffer = [];
}

if (!global.fluxwallLogBuffer) {
  global.fluxwallLogBuffer = [];
}

export async function recordPacket(packet: CapturedPacket) {
  // 1. Ingest into global in-memory buffer
  global.fluxwallPacketBuffer!.unshift(packet);
  if (global.fluxwallPacketBuffer!.length > 80) {
    global.fluxwallPacketBuffer = global.fluxwallPacketBuffer!.slice(0, 80);
  }

  // 2. Try persisting to Redis
  try {
    const redis = getRedisClient();
    await redis.lpush("fluxwall:packets", JSON.stringify(packet));
    await redis.ltrim("fluxwall:packets", 0, 79);
  } catch {}
}

export async function getPackets(limit = 40): Promise<CapturedPacket[]> {
  try {
    const redis = getRedisClient();
    const raw = await redis.lrange("fluxwall:packets", 0, limit - 1);
    if (raw && raw.length > 0) {
      const parsed = raw
        .map((r) => {
          try {
            return JSON.parse(r);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
  } catch {}

  return global.fluxwallPacketBuffer!.slice(0, limit);
}

export async function recordLog(log: LogEvent) {
  // 1. Ingest into global in-memory buffer
  global.fluxwallLogBuffer!.unshift(log);
  if (global.fluxwallLogBuffer!.length > 80) {
    global.fluxwallLogBuffer = global.fluxwallLogBuffer!.slice(0, 80);
  }

  // 2. Try persisting to Redis
  try {
    const redis = getRedisClient();
    await redis.lpush("fluxwall:logs", JSON.stringify(log));
    await redis.ltrim("fluxwall:logs", 0, 79);
    await redis.incr("fluxwall:stats:threats_total");
  } catch {}
}

export async function getLogs(limit = 50): Promise<LogEvent[]> {
  try {
    const redis = getRedisClient();
    const raw = await redis.lrange("fluxwall:logs", 0, limit - 1);
    if (raw && raw.length > 0) {
      const parsed = raw
        .map((r) => {
          try {
            return JSON.parse(r);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
  } catch {}

  return global.fluxwallLogBuffer!.slice(0, limit);
}
