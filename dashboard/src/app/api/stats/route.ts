import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const redis = getRedisClient();

    // 1. Fetch active ban keys
    const banKeys = await redis.keys("ip:ban:*");
    const activeBansCount = banKeys.length;

    // 2. Fetch Whitelist and Blacklist set sizes
    const whitelistCount = await redis.scard("ip:whitelist");
    const blacklistCount = await redis.scard("ip:blacklist");

    // 3. Fetch Surge mode indicator
    const surgeActive = await redis.get("surge_active");
    const isSurge = surgeActive === "1";

    // 4. Fetch Real Cumulative Threat Counters
    const threatsTotal = parseInt((await redis.get("fluxwall:stats:threats_total")) || "0", 10);
    const threatsBot = parseInt((await redis.get("fluxwall:stats:threats:bad_bot_blocked")) || "0", 10);
    const threatsRate = parseInt((await redis.get("fluxwall:stats:threats:rate_limit_exceeded")) || "0", 10);
    const threatsGeo = parseInt((await redis.get("fluxwall:stats:threats:geo_blocked")) || "0", 10);

    // 5. Fetch Real Current Second QPS
    const now = Math.floor(Date.now() / 1000);
    const rawQps = await redis.get(`g_qps:${now}`);
    const rawQpsPrev = await redis.get(`g_qps:${now - 1}`);
    const liveQps = parseInt(rawQps || rawQpsPrev || "0", 10);

    return NextResponse.json({
      status: "success",
      data: {
        live_qps: liveQps,
        active_bans: activeBansCount,
        whitelist_count: whitelistCount,
        blacklist_count: blacklistCount,
        threats_total: threatsTotal,
        threats_breakdown: {
          bad_bot: threatsBot,
          rate_limited: threatsRate,
          geo_blocked: threatsGeo,
        },
        surge_mode: isSurge,
        server_time: now,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        message: err?.message || "Failed to query Redis stats",
        data: {
          live_qps: 0,
          active_bans: 0,
          whitelist_count: 0,
          blacklist_count: 0,
          threats_total: 0,
          threats_breakdown: { bad_bot: 0, rate_limited: 0, geo_blocked: 0 },
          surge_mode: false,
          server_time: Math.floor(Date.now() / 1000),
        },
      },
      { status: 200 }
    );
  }
}
