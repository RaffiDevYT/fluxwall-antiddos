import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export interface AdminUser {
  id: string;
  username: string;
  role: "super_admin" | "security_analyst" | "auditor";
  created_at: string;
  last_login?: string;
  password_hash: string;
}

const DEFAULT_ADMIN: AdminUser = {
  id: "root-1",
  username: "admin",
  role: "super_admin",
  created_at: new Date().toISOString(),
  last_login: new Date().toISOString(),
  password_hash: crypto.createHash("sha256").update(process.env.ADMIN_PASSWORD || "fluxwall2026!").digest("hex"),
};

export async function GET() {
  try {
    const redis = getRedisClient();
    const rawUsers = await redis.hgetall("fluxwall:users");

    let users: AdminUser[] = [];
    if (!rawUsers || Object.keys(rawUsers).length === 0) {
      // Seed default root admin in Redis
      await redis.hset("fluxwall:users", DEFAULT_ADMIN.username, JSON.stringify(DEFAULT_ADMIN));
      users = [DEFAULT_ADMIN];
    } else {
      users = Object.values(rawUsers).map((str) => JSON.parse(str));
    }

    // Mask passwords in response
    const sanitizedUsers = users.map(({ password_hash, ...rest }) => rest);

    return NextResponse.json({ status: "success", users: sanitizedUsers });
  } catch (err: any) {
    return NextResponse.json({
      status: "success",
      users: [{ id: "root-1", username: "admin", role: "super_admin", created_at: new Date().toISOString() }],
    });
  }
}

export async function POST(req: Request) {
  try {
    const { username, password, role } = await req.json();

    if (!username || !password || username.trim().length < 3) {
      return NextResponse.json({ error: "Username and password must be at least 3 characters" }, { status: 400 });
    }

    const redis = getRedisClient();
    const cleanUsername = username.trim().toLowerCase();

    // Check if user already exists
    const exists = await redis.hexists("fluxwall:users", cleanUsername);
    if (exists) {
      return NextResponse.json({ error: "Administrator username already exists" }, { status: 400 });
    }

    const newUser: AdminUser = {
      id: "usr-" + crypto.randomBytes(4).toString("hex"),
      username: cleanUsername,
      role: role || "security_analyst",
      created_at: new Date().toISOString(),
      password_hash: crypto.createHash("sha256").update(password).digest("hex"),
    };

    await redis.hset("fluxwall:users", cleanUsername, JSON.stringify(newUser));

    return NextResponse.json({
      status: "success",
      message: `Admin user ${cleanUsername} created successfully`,
      user: { id: newUser.id, username: newUser.username, role: newUser.role },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Missing username parameter" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername === "admin" || cleanUsername === "root") {
      return NextResponse.json({ error: "Root administrator cannot be deleted" }, { status: 403 });
    }

    const redis = getRedisClient();
    await redis.hdel("fluxwall:users", cleanUsername);

    return NextResponse.json({
      status: "success",
      message: `Administrator ${cleanUsername} deleted`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
