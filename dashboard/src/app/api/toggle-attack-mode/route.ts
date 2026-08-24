import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const redis = getRedisClient();
    const state = await redis.get("config:under_attack_mode");
    return NextResponse.json({ enabled: state === "1" });
  } catch (err: any) {
    return NextResponse.json({ enabled: false, error: err.message });
  }
}

export async function POST(req: Request) {
  try {
    const { enabled } = await req.json();
    const redis = getRedisClient();
    if (enabled) {
      await redis.set("config:under_attack_mode", "1");
    } else {
      await redis.del("config:under_attack_mode");
    }
    return NextResponse.json({ status: "success", enabled });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
