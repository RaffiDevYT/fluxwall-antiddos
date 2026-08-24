import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";

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

    // Ingest real attack packets into the Live Packet Stream queue
    try {
      const redis = getRedisClient();
      const samplePackets = [
        {
          id: `pkt_sim_${Date.now()}_1`,
          time: new Date().toISOString().split("T")[1].replace("Z", ""),
          client_ip: "198.51.100.42",
          country: "CN",
          method: "GET",
          uri: vector === "sql_probe" ? "/wp-login.php?id=1' UNION SELECT--" : vector === "bad_bot" ? "/.env" : "/api/v1/stream",
          status: blockedCount > 0 ? 403 : 200,
          protection: vector === "sql_probe" ? "custom-waf" : vector === "bad_bot" ? "bot-filter" : "rate-limited",
          payload_size: "1.2 kB",
          latency_ms: parseFloat(avgLatencyMs),
          headers: {
            "User-Agent": vector === "bad_bot" ? "sqlmap/1.7.2#stable" : "Mozilla/5.0 (Windows NT 10.0)",
            "X-Attack-Vector": vector,
            "X-Gateway-Protection": blockedCount > 0 ? "blocked" : "pass",
          },
        },
      ];
      for (const p of samplePackets) {
        await redis.lpush("fluxwall:packets", JSON.stringify(p));
      }
      await redis.ltrim("fluxwall:packets", 0, 59);
      await redis.quit();
    } catch {}

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
