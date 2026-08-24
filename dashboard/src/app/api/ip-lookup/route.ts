import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";

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

    // 1. Check Gateway Status in Redis
    const isBanned = (await redis.exists(`ip:ban:${cleanIp}`)) === 1;
    const banTtl = isBanned ? await redis.ttl(`ip:ban:${cleanIp}`) : 0;
    const isWhitelisted = (await redis.sismember("ip:whitelist", cleanIp)) === 1;
    const isBlacklisted = (await redis.sismember("ip:blacklist", cleanIp)) === 1;
    const violations = parseInt((await redis.get(`ip:violations:${cleanIp}`)) || "0", 10);

    // 2. Query GeoIP & ASN Info (from Redis Cache or ipinfo.io)
    let geoInfo: any = { country: "UNKNOWN", org: "Unknown ASN", city: "Unknown City" };

    const cachedGeo = await redis.get(`ip:geo:${cleanIp}`);
    if (cachedGeo) {
      try {
        geoInfo = JSON.parse(cachedGeo);
      } catch {}
    } else {
      try {
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
          // Cache in Redis for 7 days
          await redis.setex(`ip:geo:${cleanIp}`, 604800, JSON.stringify(geoInfo));
        }
      } catch {}
    }

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
