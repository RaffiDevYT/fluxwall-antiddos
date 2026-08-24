import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";

export const dynamic = "force-dynamic";

// In-memory state tracking if Redis is offline
let mockSetupCompleted = false;

export async function GET() {
  try {
    const redis = getRedisClient();
    const isCompleted = await redis.get("fluxwall:setup_completed");
    const userCount = await redis.hlen("fluxwall:users");

    const completed = isCompleted === "1" || userCount > 0 || mockSetupCompleted;

    return NextResponse.json({
      status: "success",
      completed: !!completed,
    });
  } catch {
    // If Redis is offline locally, respect mockSetupCompleted (defaults to false for fresh setup experience)
    return NextResponse.json({
      status: "success",
      completed: mockSetupCompleted,
    });
  }
}

export function setMockCompleted(val: boolean) {
  mockSetupCompleted = val;
}
