import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const redis = getRedisClient();
    let apiKey = await redis.get("config:admin_api_key");
    if (!apiKey) {
      apiKey = "fw_live_" + crypto.randomBytes(16).toString("hex");
      await redis.set("config:admin_api_key", apiKey);
    }

    return NextResponse.json({
      status: "success",
      profile: {
        username: "admin",
        role: "Super Administrator (Root)",
        email: "admin@fluxwall.security",
        api_key: apiKey,
        session_created: new Date().toLocaleDateString(),
        two_factor_enabled: false,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, current_password, new_password } = await req.json();
    const redis = getRedisClient();

    if (action === "regenerate_key") {
      const newKey = "fw_live_" + crypto.randomBytes(16).toString("hex");
      await redis.set("config:admin_api_key", newKey);
      return NextResponse.json({
        status: "success",
        message: "API Key regenerated successfully",
        api_key: newKey,
      });
    }

    if (action === "change_password") {
      if (!new_password || new_password.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
      }

      // Update in Redis
      const newHash = crypto.createHash("sha256").update(new_password).digest("hex");
      const rootUser = {
        id: "root-1",
        username: "admin",
        role: "super_admin",
        created_at: new Date().toISOString(),
        password_hash: newHash,
      };
      await redis.hset("fluxwall:users", "admin", JSON.stringify(rootUser));
      await redis.set("config:admin_password", new_password);

      return NextResponse.json({
        status: "success",
        message: "Administrator passkey updated successfully!",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
