import { NextResponse } from "next/server";
import { getWhitelistIps, addWhitelistIp, removeWhitelistIp } from "@/lib/packet-store";

export const dynamic = "force-dynamic";

// GET /api/whitelist
export async function GET() {
  try {
    const ips = await getWhitelistIps();
    return NextResponse.json({ status: "success", count: ips.length, whitelist: ips });
  } catch (err: any) {
    return NextResponse.json({ status: "error", message: err.message, whitelist: [] }, { status: 500 });
  }
}

// POST /api/whitelist
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ip } = body;
    if (!ip) return NextResponse.json({ error: "Missing IP" }, { status: 400 });

    await addWhitelistIp(ip);
    return NextResponse.json({ status: "success", message: `IP ${ip} added to whitelist` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/whitelist
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ip = searchParams.get("ip");
    if (!ip) return NextResponse.json({ error: "Missing IP" }, { status: 400 });

    await removeWhitelistIp(ip);
    return NextResponse.json({ status: "success", message: `IP ${ip} removed from whitelist` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
