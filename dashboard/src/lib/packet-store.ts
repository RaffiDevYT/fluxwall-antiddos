import { getRedisClient } from "./redis";

export interface CapturedPacket {
  id: string;
  time: string;
  client_ip: string;
  country: string;
  method: "GET" | "POST" | "HEAD" | "PUT" | "DELETE" | "OPTIONS";
  uri: string;
  status: number;
  protection: "inspected-pass" | "bot-filter" | "rate-limited" | "geo-block" | "custom-waf" | "blacklisted" | "whitelisted" | "canary-trap-banned";
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

export interface ForensicIncident {
  id: string;
  recorded: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  type: string;
  action_taken: string;
  attacker_ip: string;
  method: string;
  signed_in_as: string;
  request_uri: string;
  user_agent: string;
  payload_match: string;
}

export interface CanaryDecoyTrap {
  id: string;
  name: string;
  path: string;
  hits: number;
  enabled: boolean;
  action: "IP_BANNED" | "CHALLENGE" | "LOG";
  created_at: string;
}

declare global {
  // eslint-disable-next-line no-var
  var fluxwallPacketBuffer: CapturedPacket[] | undefined;
  // eslint-disable-next-line no-var
  var fluxwallLogBuffer: LogEvent[] | undefined;
  // eslint-disable-next-line no-var
  var fluxwallForensicsBuffer: ForensicIncident[] | undefined;
  // eslint-disable-next-line no-var
  var fluxwallCanaryTrapsBuffer: CanaryDecoyTrap[] | undefined;
  // eslint-disable-next-line no-var
  var fluxwallBlacklistSet: Set<string> | undefined;
  // eslint-disable-next-line no-var
  var fluxwallWhitelistSet: Set<string> | undefined;
}

if (!global.fluxwallPacketBuffer) {
  global.fluxwallPacketBuffer = [];
}

if (!global.fluxwallLogBuffer) {
  global.fluxwallLogBuffer = [];
}

if (!global.fluxwallForensicsBuffer) {
  global.fluxwallForensicsBuffer = [];
}

if (!global.fluxwallBlacklistSet) {
  global.fluxwallBlacklistSet = new Set<string>();
}

if (!global.fluxwallWhitelistSet) {
  global.fluxwallWhitelistSet = new Set<string>();
}

if (!global.fluxwallCanaryTrapsBuffer) {
  global.fluxwallCanaryTrapsBuffer = [
    {
      id: "trap-wp-phpinfo",
      name: "WordPress Admin Probe Trap",
      path: "/wp-admin/phpinfo/",
      hits: 0,
      enabled: true,
      action: "IP_BANNED",
      created_at: "2026-08-20T00:00:00.000Z",
    },
    {
      id: "trap-env-leak",
      name: "Environment Secret Leak Probe",
      path: "/.env",
      hits: 0,
      enabled: true,
      action: "IP_BANNED",
      created_at: "2026-08-20T00:00:00.000Z",
    },
    {
      id: "trap-git-head",
      name: "Git Repository Exposure Probe",
      path: "/.git/HEAD",
      hits: 0,
      enabled: true,
      action: "IP_BANNED",
      created_at: "2026-08-20T00:00:00.000Z",
    },
    {
      id: "trap-db-backup",
      name: "Database Backup File Probe",
      path: "/admin/config.bak",
      hits: 0,
      enabled: true,
      action: "IP_BANNED",
      created_at: "2026-08-20T00:00:00.000Z",
    },
    {
      id: "trap-pma-gui",
      name: "Database GUI Exploit Probe",
      path: "/phpmyadmin/index.php",
      hits: 0,
      enabled: true,
      action: "IP_BANNED",
      created_at: "2026-08-20T00:00:00.000Z",
    },
  ];
}

export async function recordPacket(packet: CapturedPacket) {
  global.fluxwallPacketBuffer!.unshift(packet);
  if (global.fluxwallPacketBuffer!.length > 80) {
    global.fluxwallPacketBuffer = global.fluxwallPacketBuffer!.slice(0, 80);
  }

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
  global.fluxwallLogBuffer!.unshift(log);
  if (global.fluxwallLogBuffer!.length > 80) {
    global.fluxwallLogBuffer = global.fluxwallLogBuffer!.slice(0, 80);
  }

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

export async function recordForensicIncident(incident: ForensicIncident) {
  global.fluxwallForensicsBuffer!.unshift(incident);
  if (global.fluxwallForensicsBuffer!.length > 50) {
    global.fluxwallForensicsBuffer = global.fluxwallForensicsBuffer!.slice(0, 50);
  }

  try {
    const redis = getRedisClient();
    await redis.lpush("fluxwall:forensics", JSON.stringify(incident));
    await redis.ltrim("fluxwall:forensics", 0, 49);
    await redis.setex(`blacklist:${incident.attacker_ip}`, 86400, `IDS_CANARY_TRAP: ${incident.payload_match}`);
    await redis.setex(`ip:ban:${incident.attacker_ip}`, 86400, "Honeypot Canary Trap Instant Ban");
    await redis.incr("fluxwall:stats:threats_total");
  } catch {}
}

export async function getForensics(): Promise<ForensicIncident[]> {
  try {
    const redis = getRedisClient();
    const raw = await redis.lrange("fluxwall:forensics", 0, 49);
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

  return global.fluxwallForensicsBuffer!;
}

export async function getCanaryTraps(): Promise<CanaryDecoyTrap[]> {
  try {
    const redis = getRedisClient();
    const raw = await redis.get("waf:canary_traps");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  return global.fluxwallCanaryTrapsBuffer!;
}

export async function saveCanaryTraps(traps: CanaryDecoyTrap[]) {
  global.fluxwallCanaryTrapsBuffer = traps;
  try {
    const redis = getRedisClient();
    await redis.set("waf:canary_traps", JSON.stringify(traps));
  } catch {}
}

export async function addBlacklistIp(ip: string) {
  global.fluxwallBlacklistSet!.add(ip);
  try {
    const redis = getRedisClient();
    await redis.sadd("ip:blacklist", ip);
    await redis.set(`blacklist:${ip}`, "PERMANENT_BLACKLIST");
    await redis.set(`ip:ban:${ip}`, "PERMANENT_BLACKLIST");
  } catch {}
}

export async function removeBlacklistIp(ip: string) {
  global.fluxwallBlacklistSet!.delete(ip);
  try {
    const redis = getRedisClient();
    await redis.srem("ip:blacklist", ip);
    await redis.del(`blacklist:${ip}`);
    await redis.del(`ip:ban:${ip}`);
  } catch {}
}

export async function unbanAndPardonIp(ip: string) {
  global.fluxwallBlacklistSet!.delete(ip);
  try {
    const redis = getRedisClient();
    await Promise.all([
      redis.del(`ip:ban:${ip}`),
      redis.del(`blacklist:${ip}`),
      redis.srem("ip:blacklist", ip),
      redis.del(`ip:violations:${ip}`),
    ]);
  } catch {}
}

export async function getBlacklistIps(): Promise<string[]> {
  try {
    const redis = getRedisClient();
    const ips = await redis.smembers("ip:blacklist");
    if (ips && ips.length > 0) {
      ips.forEach((ip) => global.fluxwallBlacklistSet!.add(ip));
      return Array.from(global.fluxwallBlacklistSet!);
    }
  } catch {}

  return Array.from(global.fluxwallBlacklistSet!);
}

export async function addWhitelistIp(ip: string) {
  global.fluxwallWhitelistSet!.add(ip);
  try {
    const redis = getRedisClient();
    await redis.sadd("ip:whitelist", ip);
  } catch {}
}

export async function removeWhitelistIp(ip: string) {
  global.fluxwallWhitelistSet!.delete(ip);
  try {
    const redis = getRedisClient();
    await redis.srem("ip:whitelist", ip);
  } catch {}
}

export async function getWhitelistIps(): Promise<string[]> {
  try {
    const redis = getRedisClient();
    const ips = await redis.smembers("ip:whitelist");
    if (ips && ips.length > 0) {
      ips.forEach((ip) => global.fluxwallWhitelistSet!.add(ip));
      return Array.from(global.fluxwallWhitelistSet!);
    }
  } catch {}

  return Array.from(global.fluxwallWhitelistSet!);
}
