import { NextResponse } from "next/server";
import { recordPacket, recordLog, recordForensicIncident } from "@/lib/packet-store";

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
      case "canary_trap":
        blockedCount = totalPackets;
        allowedCount = 0;
        simulatedReason = "IDS [CANARY_TRAP_ENDPOINT] matched: Canary Decoy: WordPress Admin Probe Trap (/wp-admin/phpinfo/)";
        eventName = "IDS_CANARY_TRAP";
        break;

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

    const now = Date.now();
    const timeFormatted = new Date(now).toLocaleTimeString();
    const sampleOrigins = [
      { ip: "13.61.104.165", country: "US" },
      { ip: "198.51.100.42", country: "CN" },
      { ip: "203.0.113.19", country: "RU" },
      { ip: "177.54.12.8", country: "BR" },
    ];

    if (vector === "canary_trap") {
      const incidentId = `#${Math.floor(Math.random() * 8000 + 1000)}`;
      await recordForensicIncident({
        id: incidentId,
        recorded: new Date().toISOString().replace("T", " ").substring(0, 19),
        severity: "CRITICAL",
        type: "IDS CANARY TRAP",
        action_taken: "IP_BANNED",
        attacker_ip: "13.61.104.165",
        method: "GET",
        signed_in_as: "Not authenticated",
        request_uri: "/wp-admin/phpinfo/",
        user_agent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        payload_match: "IDS [CANARY_TRAP_ENDPOINT] matched: Canary Decoy: WordPress Admin Probe Trap",
      });
    }

    for (let i = 0; i < Math.min(blockedCount, 6); i++) {
      const origin = sampleOrigins[i % sampleOrigins.length];
      const targetUri =
        vector === "canary_trap"
          ? "/wp-admin/phpinfo/"
          : vector === "sql_probe"
          ? "/wp-login.php?id=1' UNION SELECT--"
          : vector === "bad_bot"
          ? "/.env"
          : "/api/v1/checkout";

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
        protection: vector === "canary_trap" ? "canary-trap-banned" : vector === "sql_probe" ? "custom-waf" : vector === "bad_bot" ? "bot-filter" : "rate-limited",
        payload_size: `${Math.floor(Math.random() * 800 + 400)} B`,
        latency_ms: parseFloat(avgLatencyMs),
        headers: {
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0.0.0",
          "X-Attack-Vector": vector,
          "X-Gateway-Protection": "canary-trap-banned",
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
