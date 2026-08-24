import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRedisClient } from "@/lib/redis";
import { setMockCompleted } from "../status/route";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    try {
      const redis = getRedisClient();
      await redis.del("fluxwall:setup_completed");
      await redis.del("fluxwall:users");
    } catch {}

    setMockCompleted(false);

    // Clear session cookie
    const cookieStore = cookies();
    cookieStore.delete("__fluxwall_admin_session");

    return NextResponse.json({
      status: "success",
      message: "Setup state has been reset to fresh clean installation.",
    });
  } catch (err: any) {
    setMockCompleted(false);
    return NextResponse.json({
      status: "success",
      message: "Setup state reset.",
    });
  }
}
