import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete({
    name: "__fluxwall_admin_session",
    path: "/",
  });
  return NextResponse.json({ status: "success", message: "Logged out successfully" });
}
