import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const redis = getRedisClient();
    const rawLogs = await redis.lrange("fluxwall:logs", 0, 49);
    const logs = rawLogs
      .map((item) => {
        try {
          return JSON.parse(item);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return NextResponse.json({
      status: "success",
      count: logs.length,
      logs,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        message: err.message,
        logs: [],
      },
      { status: 200 }
    );
  }
}
