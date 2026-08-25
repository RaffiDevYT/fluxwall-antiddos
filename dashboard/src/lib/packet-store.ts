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
  id: string; // e.g. "#4186"
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
}

if (!global.fluxwallPacketBuffer) {
  global.fluxwallPacketBuffer = [];
}

if (!global.fluxwallLogBuffer) {
  global.fluxwallLogBuffer = [];
}

if (!global.fluxwallForensicsBuffer) {
  global.fluxwallForensicsBuffer = [
    {
      id: "#4186",
      recorded: new Date().toISOString().replace("T", " ").substring(0, 19),
      severity: "CRITICAL",
      type: "IDS CANARY TRAP",
      action_taken: "IP_BANNED",
      attacker_ip: "13.61.104.165",
      method: "GET",
      signed_in_as: "Not authenticated",
      request_uri: "/wp-admin/phpinfo/",
      user_agent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      payload_match: "IDS [CANARY_TRAP_ENDPOINT] matched: Canary Decoy: WordPress Admin Probe Trap",
    },
  ];
}

if (!global.fluxwallCanaryTrapsBuffer) {
  global.fluxwallCanaryTrapsBuffer = [
    {
      id: "trap-wp-phpinfo",
      name: "WordPress Admin Probe Trap",
      path: "/wp-admin/phpinfo/",
      hits: 42,
      enabled: true,
      action: "IP_BANNED",
      created_at: "2026-08-20T00:00:00.000Z",
    },
    {
      id: "trap-env-leak",
      name: "Environment Secret Leak Probe",
      path: "/.env",
      hits: 89,
      enabled: true,
      action: "IP_BANNED",
      created_at: "2026-08-20T00:00:00.000Z",
    },
    {
      id: "trap-git-head",
      name: "Git Repository Exposure Probe",
      path: "/.git/HEAD",
      hits: 31,
      enabled: true,
      action: "IP_BANNED",
      created_at: "2026-08-20T00:00:00.000Z",
    },
    {
      id: "trap-db-backup",
      name: "Database Backup File Probe",
      path: "/admin/config.bak",
      hits: 15,
      enabled: true,
      action: "IP_BANNED",
      created_at: "2026-08-20T00:00:00.000Z",
    },
    {
      id: "trap-pma-gui",
      name: "Database GUI Exploit Probe",
      path: "/phpmyadmin/index.php",
      hits: 64,
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
