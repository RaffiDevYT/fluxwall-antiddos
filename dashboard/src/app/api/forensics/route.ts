import { NextResponse } from "next/server";
import { getForensics, recordForensicIncident } from "@/lib/packet-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const incidents = await getForensics();
  return NextResponse.json({
    status: "success",
    count: incidents.length,
    incidents,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await recordForensicIncident(body);
    return NextResponse.json({ status: "success", incident: body });
  } catch (err: any) {
    return NextResponse.json({ status: "error", error: err.message }, { status: 500 });
  }
}
