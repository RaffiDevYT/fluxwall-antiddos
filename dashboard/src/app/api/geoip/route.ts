import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";

export const dynamic = "force-dynamic";

// Default blocked country codes
const DEFAULT_BLOCKED = ["CN", "RU", "KP"];

export async function GET() {
  try {
    const redis = getRedisClient();
    let blocked = await redis.smembers("geoip:blocked_countries");
    if (!blocked || blocked.length === 0) {
      blocked = DEFAULT_BLOCKED;
    }
    return NextResponse.json({ status: "success", blocked });
  } catch (err: any) {
    return NextResponse.json({ status: "success", blocked: DEFAULT_BLOCKED });
  }
}

export async function POST(req: Request) {
  try {
    const { country } = await req.json();
    if (!country || country.length !== 2) {
      return NextResponse.json({ error: "Invalid 2-letter ISO Country Code" }, { status: 400 });
    }

    const redis = getRedisClient();
    const code = country.toUpperCase();
    await redis.sadd("geoip:blocked_countries", code);

    return NextResponse.json({ status: "success", message: `Country ${code} added to blocklist` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country");
    if (!country) {
      return NextResponse.json({ error: "Missing country parameter" }, { status: 400 });
    }

    const redis = getRedisClient();
    const code = country.toUpperCase();
    await redis.srem("geoip:blocked_countries", code);

    return NextResponse.json({ status: "success", message: `Country ${code} unblocked` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
