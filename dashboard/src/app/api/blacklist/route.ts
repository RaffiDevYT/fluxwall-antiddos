import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";

export const dynamic = "force-dynamic";

// GET /admin/api/blacklist
export async function GET() {
  try {
    const redis = getRedisClient();
    const ips = await redis.smembers("ip:blacklist");
    return NextResponse.json({ status: "success", count: ips.length, blacklist: ips });
  } catch (err: any) {
    return NextResponse.json({ status: "error", message: err.message, blacklist: [] }, { status: 500 });
  }
}

// POST /admin/api/blacklist
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ip } = body;
    if (!ip) return NextResponse.json({ error: "Missing IP" }, { status: 400 });

    const redis = getRedisClient();
    await redis.sadd("ip:blacklist", ip);
    return NextResponse.json({ status: "success", message: `IP ${ip} added to permanent blacklist` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /admin/api/blacklist
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ip = searchParams.get("ip");
    if (!ip) return NextResponse.json({ error: "Missing IP" }, { status: 400 });

    const redis = getRedisClient();
    await redis.srem("ip:blacklist", ip);
    return NextResponse.json({ status: "success", message: `IP ${ip} removed from blacklist` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
