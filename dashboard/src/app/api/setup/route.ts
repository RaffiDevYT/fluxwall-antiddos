import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRedisClient } from "@/lib/redis";
import { setMockCompleted } from "./status/route";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { username, password, email } = await req.json();

    if (!username || !password || username.trim().length < 3 || password.length < 6) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters and password at least 6 characters" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const passwordHash = crypto.createHash("sha256").update(password).digest("hex");

    const rootAdmin = {
      id: "root-1",
      username: cleanUsername,
      role: "super_admin",
      email: email?.trim() || `${cleanUsername}@fluxwall.security`,
      created_at: new Date().toISOString(),
      password_hash: passwordHash,
    };

    // Try saving to Redis if running
    try {
      const redis = getRedisClient();
      await redis.hset("fluxwall:users", cleanUsername, JSON.stringify(rootAdmin));
      await redis.set("config:admin_password", password);
      await redis.set("fluxwall:setup_completed", "1");
    } catch {}

    // Mark completed in memory
    setMockCompleted(true);

    // Auto-login session cookie
    const token = "authenticated";
    const cookieStore = cookies();
    cookieStore.set("__fluxwall_admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({
      status: "success",
      message: "Root Administrator account configured successfully!",
      redirect: "/admin",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
