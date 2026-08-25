import { NextResponse } from "next/server";
import { getCanaryTraps, saveCanaryTraps, CanaryDecoyTrap } from "@/lib/packet-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const traps = await getCanaryTraps();
  return NextResponse.json({
    status: "success",
    count: traps.length,
    traps,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, path, action = "IP_BANNED" } = body;

    if (!name || !path) {
      return NextResponse.json({ status: "error", error: "Name and path are required" }, { status: 400 });
    }

    const current = await getCanaryTraps();
    const newTrap: CanaryDecoyTrap = {
      id: `trap-${Date.now()}`,
      name,
      path: path.startsWith("/") ? path : `/${path}`,
      hits: 0,
      enabled: true,
      action: action as any,
      created_at: new Date().toISOString(),
    };

    const updated = [newTrap, ...current];
    await saveCanaryTraps(updated);

    return NextResponse.json({ status: "success", trap: newTrap, traps: updated });
  } catch (err: any) {
    return NextResponse.json({ status: "error", error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ status: "error", error: "Trap ID required" }, { status: 400 });
  }

  const current = await getCanaryTraps();
  const updated = current.filter((t) => t.id !== id);
  await saveCanaryTraps(updated);

  return NextResponse.json({ status: "success", traps: updated });
}
