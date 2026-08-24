import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { action } = await req.json();
    const redis = getRedisClient();

    if (action === "flush_violations") {
      // Clear rate limit violation strike keys
      const keys = await redis.keys("ip:violations:*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return NextResponse.json({
        status: "success",
        message: `Cleared ${keys.length} active rate limit violation trackers`,
      });
    }

    if (action === "reset_threat_counter") {
      await redis.set("fluxwall:stats:threats_total", "0");
      return NextResponse.json({
        status: "success",
        message: "Threat counter reset to 0",
      });
    }

    if (action === "clear_logs") {
      await redis.del("fluxwall:logs");
      return NextResponse.json({
        status: "success",
        message: "Security incident audit log history cleared",
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
