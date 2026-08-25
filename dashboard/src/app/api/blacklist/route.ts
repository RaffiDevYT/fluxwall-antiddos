import { NextResponse } from "next/server";
import { getBlacklistIps, addBlacklistIp, removeBlacklistIp } from "@/lib/packet-store";

export const dynamic = "force-dynamic";

// GET /api/blacklist
export async function GET() {
  try {
    const ips = await getBlacklistIps();
    return NextResponse.json({ status: "success", count: ips.length, blacklist: ips });
  } catch (err: any) {
    return NextResponse.json({ status: "error", message: err.message, blacklist: [] }, { status: 500 });
  }
}

// POST /api/blacklist
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ip } = body;
    if (!ip) return NextResponse.json({ error: "Missing IP" }, { status: 400 });

    await addBlacklistIp(ip);
    return NextResponse.json({ status: "success", message: `IP ${ip} added to permanent blacklist` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/blacklist
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ip = searchParams.get("ip");
    if (!ip) return NextResponse.json({ error: "Missing IP" }, { status: 400 });

    await removeBlacklistIp(ip);
    return NextResponse.json({ status: "success", message: `IP ${ip} removed from blacklist` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
