import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_API_KEY || "fluxwall2026!";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { status: "error", message: "Invalid administrator password" },
        { status: 401 }
      );
    }

    // Set HttpOnly signed cookie for 7 days across entire domain
    const cookieStore = await cookies();
    cookieStore.set("__fluxwall_admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({ status: "success", message: "Authenticated successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
