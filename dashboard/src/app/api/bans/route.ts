import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";

export const dynamic = "force-dynamic";

// GET /admin/api/bans -> List all active bans
export async function GET() {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys("ip:ban:*");
    const bans: Array<{ ip: string; remaining_ttl: number; reason: string }> = [];

    if (keys.length > 0) {
      const pipeline = redis.pipeline();
      keys.forEach((k) => pipeline.ttl(k));
      keys.forEach((k) => pipeline.get(k));
      const results = await pipeline.exec();

      if (results) {
        for (let i = 0; i < keys.length; i++) {
          const ip = keys[i].replace("ip:ban:", "");
          const ttl = (results[i]?.[1] as number) || 0;
          const reason = (results[i + keys.length]?.[1] as string) || "Manual Ban";

          if (ttl > 0) {
            bans.push({
              ip,
              remaining_ttl: ttl,
              reason: reason === "1" ? "Auto-Ban / Rate Limit Exceeded" : reason,
            });
          }
        }
      }
    }

    bans.sort((a, b) => b.remaining_ttl - a.remaining_ttl);
    return NextResponse.json({ status: "success", count: bans.length, bans });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message, bans: [] },
      { status: 500 }
    );
  }
}

// POST /admin/api/bans -> Ban an IP
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ip, duration_sec = 600, reason = "Manual Dashboard Ban" } = body;

    if (!ip) {
      return NextResponse.json({ error: "Missing IP address" }, { status: 400 });
    }

    const redis = getRedisClient();
    await redis.setex(`ip:ban:${ip}`, duration_sec, reason);

    return NextResponse.json({
      status: "success",
      message: `IP ${ip} banned for ${duration_sec} seconds`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /admin/api/bans?ip=1.2.3.4 -> Unban an IP
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ip = searchParams.get("ip");

    if (!ip) {
      return NextResponse.json({ error: "Missing IP parameter" }, { status: 400 });
    }

    const redis = getRedisClient();
    await redis.del(`ip:ban:${ip}`);

    return NextResponse.json({
      status: "success",
      message: `IP ${ip} unbanned successfully`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
