import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { vector, intensity = 50 } = body;

    const totalPackets = Math.min(Math.max(parseInt(intensity, 10) || 50, 10), 200);
    const startTime = Date.now();

    let blockedCount = 0;
    let allowedCount = 0;
    let simulatedReason = "";

    switch (vector) {
      case "http_flood":
        // Simulates rapid Layer-7 HTTP Flood hitting Rate Limiter & Surge Protector
        blockedCount = Math.floor(totalPackets * 0.94);
        allowedCount = totalPackets - blockedCount;
        simulatedReason = "RATE_LIMIT_EXCEEDED: Sliding Window Bucket Depleted (429)";
        break;

      case "sql_probe":
        // Simulates SQL Injection & Traversal Scanners hitting WAF Signatures
        blockedCount = Math.floor(totalPackets * 0.98);
        allowedCount = totalPackets - blockedCount;
        simulatedReason = "WAF_EXPLOIT_PAYLOAD_DETECTED: 'UNION SELECT' & Path Traversal (403)";
        break;

      case "bad_bot":
        // Simulates Headless Scrapers hitting Bot Filter
        blockedCount = totalPackets;
        allowedCount = 0;
        simulatedReason = "BAD_BOT_DETECTED: Suspicious automated user-agent drop (403)";
        break;

      case "pow_challenge":
        // Simulates Under Attack PoW Challenge solving
        blockedCount = Math.floor(totalPackets * 0.88);
        allowedCount = totalPackets - blockedCount;
        simulatedReason = "POW_CHALLENGE_ENFORCED: Non-browser client failed SHA-256 PoW (403)";
        break;

      default:
        blockedCount = Math.floor(totalPackets * 0.92);
        allowedCount = totalPackets - blockedCount;
        simulatedReason = "EDGE_DEFENSE_TRIGGERED: Attack packet dropped";
    }

    const elapsedMs = Math.max(Date.now() - startTime + Math.floor(Math.random() * 80 + 40), 50);
    const avgLatencyMs = (elapsedMs / totalPackets).toFixed(2);
    const deflectionRate = ((blockedCount / totalPackets) * 100).toFixed(1);

    return NextResponse.json({
      status: "success",
      report: {
        vector,
        total_packets: totalPackets,
        packets_blocked: blockedCount,
        packets_allowed: allowedCount,
        deflection_rate: `${deflectionRate}%`,
        elapsed_time_ms: elapsedMs,
        avg_packet_latency_ms: `${avgLatencyMs}ms`,
        mitigation_reason: simulatedReason,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", error: err.message || "Simulation failed" },
      { status: 500 }
    );
  }
}
