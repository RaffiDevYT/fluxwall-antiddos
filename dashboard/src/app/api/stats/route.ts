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
    const surgeActive = await redis.get("g_surge_active");
    const isSurge = surgeActive === "1";

    return NextResponse.json({
      status: "success",
      data: {
        active_bans: activeBansCount,
        whitelist_count: whitelistCount,
        blacklist_count: blacklistCount,
        surge_mode: isSurge,
        server_time: Math.floor(Date.now() / 1000),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        message: err?.message || "Failed to query Redis stats",
        data: {
          active_bans: 0,
          whitelist_count: 0,
          blacklist_count: 0,
          surge_mode: false,
          server_time: Math.floor(Date.now() / 1000),
        },
      },
      { status: 200 } // Graceful fallback
    );
  }
}
