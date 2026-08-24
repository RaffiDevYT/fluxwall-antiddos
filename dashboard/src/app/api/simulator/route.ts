import { NextResponse } from "next/server";
import { recordPacket, recordLog } from "@/lib/packet-store";

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
    let eventName = "HTTP_FLOOD_DEFLECTED";

    switch (vector) {
      case "http_flood":
        blockedCount = Math.floor(totalPackets * 0.94);
        allowedCount = totalPackets - blockedCount;
        simulatedReason = "RATE_LIMIT_EXCEEDED: Sliding Window Bucket Depleted (429)";
        eventName = "RATE_LIMIT_EXCEEDED";
        break;

      case "sql_probe":
        blockedCount = Math.floor(totalPackets * 0.98);
        allowedCount = totalPackets - blockedCount;
        simulatedReason = "WAF_EXPLOIT_PAYLOAD_DETECTED: 'UNION SELECT' & Path Traversal (403)";
        eventName = "WAF_EXPLOIT_BLOCKED";
        break;

      case "bad_bot":
        blockedCount = totalPackets;
        allowedCount = 0;
        simulatedReason = "BAD_BOT_DETECTED: Suspicious automated user-agent drop (403)";
        eventName = "BAD_BOT_BLOCKED";
        break;

      case "pow_challenge":
        blockedCount = Math.floor(totalPackets * 0.88);
        allowedCount = totalPackets - blockedCount;
        simulatedReason = "POW_CHALLENGE_ENFORCED: Non-browser client failed SHA-256 PoW (403)";
        eventName = "POW_CHALLENGE_FAILED";
        break;

      default:
        blockedCount = Math.floor(totalPackets * 0.92);
        allowedCount = totalPackets - blockedCount;
        simulatedReason = "EDGE_DEFENSE_TRIGGERED: Attack packet dropped";
        eventName = "ATTACK_DEFLECTED";
    }

    const elapsedMs = Math.max(Date.now() - startTime + Math.floor(Math.random() * 80 + 40), 50);
    const avgLatencyMs = (elapsedMs / totalPackets).toFixed(2);
    const deflectionRate = ((blockedCount / totalPackets) * 100).toFixed(1);

    // Ingest generated attack incidents into Logs and Packet Stream
    const now = Date.now();
    const timeFormatted = new Date(now).toLocaleTimeString();
    const sampleOrigins = [
      { ip: "198.51.100.42", country: "CN" },
      { ip: "203.0.113.19", country: "RU" },
      { ip: "45.154.255.89", country: "US" },
      { ip: "177.54.12.8", country: "BR" },
    ];

    for (let i = 0; i < Math.min(blockedCount, 6); i++) {
      const origin = sampleOrigins[i % sampleOrigins.length];
      const targetUri = vector === "sql_probe" ? "/wp-login.php?id=1' UNION SELECT--" : vector === "bad_bot" ? "/.env" : "/api/v1/checkout";
      
      // 1. Record in Attack Logs
      await recordLog({
        id: `log_sim_${now}_${i}`,
        time: Math.floor((now - i * 1000) / 1000),
        time_formatted: timeFormatted,
        client_ip: origin.ip,
        event: eventName,
        reason: simulatedReason,
        uri: targetUri,
      });

      // 2. Record in Live Packet Stream
      await recordPacket({
        id: `pkt_sim_${now}_${i}`,
        time: new Date(now - i * 800).toISOString().split("T")[1].replace("Z", ""),
        client_ip: origin.ip,
        country: origin.country,
        method: "GET",
        uri: targetUri,
        status: 403,
        protection: vector === "sql_probe" ? "custom-waf" : vector === "bad_bot" ? "bot-filter" : "rate-limited",
        payload_size: `${Math.floor(Math.random() * 800 + 400)} B`,
        latency_ms: parseFloat(avgLatencyMs),
        headers: {
          "User-Agent": vector === "bad_bot" ? "sqlmap/1.7.2#stable" : "Mozilla/5.0 (Windows NT 10.0)",
          "X-Attack-Vector": vector,
          "X-Gateway-Protection": "blocked",
          "X-Forwarded-For": origin.ip,
          "Connection": "close",
        },
      });
    }

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
