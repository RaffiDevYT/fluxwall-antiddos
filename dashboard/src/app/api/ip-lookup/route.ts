import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";
import { getBlacklistIps, getWhitelistIps } from "@/lib/packet-store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ip = searchParams.get("ip");

    if (!ip || !ip.trim()) {
      return NextResponse.json({ error: "Missing IP address" }, { status: 400 });
    }

    const cleanIp = ip.trim();
    const redis = getRedisClient();

    // 1. Check Gateway & Quarantine Status in Redis
    let isBanned = false;
    let banTtl = 0;
    let violations = 0;

    try {
      const isIpBan = (await redis.exists(`ip:ban:${cleanIp}`)) === 1;
      const isBlacklistKey = (await redis.exists(`blacklist:${cleanIp}`)) === 1;
      isBanned = isIpBan || isBlacklistKey;

      if (isBanned) {
        const ttl1 = isIpBan ? await redis.ttl(`ip:ban:${cleanIp}`) : 0;
        const ttl2 = isBlacklistKey ? await redis.ttl(`blacklist:${cleanIp}`) : 0;
        banTtl = Math.max(ttl1, ttl2);
        if (banTtl < 0) banTtl = 86400; // permanent / default 24h
      }

      violations = parseInt((await redis.get(`ip:violations:${cleanIp}`)) || "0", 10);
    } catch {}

    const blacklistIps = await getBlacklistIps();
    const whitelistIps = await getWhitelistIps();
    const isBlacklisted = blacklistIps.includes(cleanIp);
    const isWhitelisted = whitelistIps.includes(cleanIp);

    if (isBlacklisted) {
      isBanned = true;
    }

    // 2. Query GeoIP & ASN Info
    let geoInfo: any = { country: "UNKNOWN", org: "Unknown ASN", city: "Unknown City" };

    try {
      const cachedGeo = await redis.get(`ip:geo:${cleanIp}`);
      if (cachedGeo) {
        try {
          geoInfo = JSON.parse(cachedGeo);
        } catch {}
      } else {
        const res = await fetch(`https://ipinfo.io/${cleanIp}/json`, {
          headers: { "User-Agent": "FluxWall-Dashboard/1.0" },
          next: { revalidate: 3600 },
        });
        if (res.ok) {
          const data = await res.json();
          geoInfo = {
            country: data.country || "UNKNOWN",
            org: data.org || "Unknown Org",
            city: data.city || "Unknown City",
            region: data.region || "",
          };
          await redis.setex(`ip:geo:${cleanIp}`, 604800, JSON.stringify(geoInfo));
        }
      }
    } catch {}

    const isDatacenter =
      geoInfo.org &&
      /amazon|aws|digitalocean|hetzner|ovh|linode|google|azure|alibaba|vultr|contabo/i.test(
        geoInfo.org
      );

    return NextResponse.json({
      status: "success",
      ip: cleanIp,
      geo: {
        country: geoInfo.country,
        city: geoInfo.city,
        region: geoInfo.region,
        org: geoInfo.org,
        is_datacenter: !!isDatacenter,
      },
      defense_status: {
        is_banned: isBanned,
        ban_ttl_seconds: banTtl,
        is_whitelisted: isWhitelisted,
        is_blacklisted: isBlacklisted,
        strike_violations: violations,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
