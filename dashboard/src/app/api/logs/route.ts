import { NextResponse } from "next/server";
import { getLogs } from "@/lib/packet-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const logs = await getLogs(50);

  return NextResponse.json({
    status: "success",
    count: logs.length,
    logs,
  });
}
