import { NextResponse } from "next/server";
import { getPackets, recordPacket, CapturedPacket } from "@/lib/packet-store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("count") || "40", 10), 80);

  const packets = await getPackets(limit);

  return NextResponse.json({
    status: "success",
    stream_active: true,
    count: packets.length,
    packets,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const packet: CapturedPacket = {
      id: body.id || `pkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      time: body.time || new Date().toISOString().split("T")[1].replace("Z", ""),
      client_ip: body.client_ip || "127.0.0.1",
      country: body.country || "LOCAL",
      method: body.method || "GET",
      uri: body.uri || "/",
      status: body.status || 200,
      protection: body.protection || "inspected-pass",
      payload_size: body.payload_size || "412 B",
      latency_ms: body.latency_ms || 0.32,
      headers: body.headers || {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0",
        "X-Forwarded-For": body.client_ip || "127.0.0.1",
        "X-Gateway-Protection": body.protection || "inspected-pass",
        "Connection": "keep-alive",
      },
    };

    await recordPacket(packet);

    return NextResponse.json({ status: "success", packet });
  } catch (err: any) {
    return NextResponse.json({ status: "error", error: err.message }, { status: 500 });
  }
}
