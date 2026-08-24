import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("__fluxwall_admin_session");
  const isAuthenticated = session?.value === "authenticated";

  return NextResponse.json({ authenticated: isAuthenticated });
}
