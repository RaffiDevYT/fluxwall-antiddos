import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface CapturedPacket {
  id: string;
  time: string;
  client_ip: string;
  country: string;
  method: "GET" | "POST" | "HEAD" | "PUT" | "DELETE" | "OPTIONS";
  uri: string;
  status: number;
  protection: "inspected-pass" | "bot-filter" | "rate-limited" | "geo-block" | "custom-waf" | "blacklisted" | "whitelisted";
  payload_size: string;
  latency_ms: number;
  headers: Record<string, string>;
}

const SAMPLE_URIS = [
  "/api/auth/login",
  "/admin/dashboard",
  "/wp-login.php",
  "/api/v1/products?limit=50",
  "/.env",
  "/graphql",
  "/api/stats",
  "/static/css/main.css",
  "/phpmyadmin/index.php",
  "/api/users",
];

const SAMPLE_IPS = [
  { ip: "198.51.100.42", country: "CN" },
  { ip: "203.0.113.19", country: "RU" },
  { ip: "185.220.101.5", country: "DE" },
  { ip: "103.245.38.12", country: "ID" },
  { ip: "45.154.255.89", country: "US" },
  { ip: "177.54.12.8", country: "BR" },
  { ip: "127.0.0.1", country: "LOCAL" },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const count = Math.min(parseInt(searchParams.get("count") || "6", 10), 20);

  const packets: CapturedPacket[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const origin = SAMPLE_IPS[Math.floor(Math.random() * SAMPLE_IPS.length)];
    const uri = SAMPLE_URIS[Math.floor(Math.random() * SAMPLE_URIS.length)];
    const isThreat = uri.includes(".php") || uri.includes(".env") || origin.country === "CN" || origin.country === "RU";
    
    let status = 200;
    let protection: CapturedPacket["protection"] = "inspected-pass";

    if (uri.includes(".php") || uri.includes(".env")) {
      status = 403;
      protection = "bot-filter";
    } else if (isThreat && Math.random() > 0.4) {
      status = 429;
      protection = "rate-limited";
    } else if (origin.ip === "127.0.0.1") {
      protection = "whitelisted";
    }

    packets.push({
      id: `pkt_${now}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      time: new Date(now - i * 1200).toISOString().split("T")[1].replace("Z", ""),
      client_ip: origin.ip,
      country: origin.country,
      method: (Math.random() > 0.85 ? "POST" : "GET") as "GET" | "POST",
      uri,
      status,
      protection,
      payload_size: `${Math.floor(Math.random() * 1200 + 120)} B`,
      latency_ms: parseFloat((Math.random() * 0.8 + 0.1).toFixed(2)),
      headers: {
        "User-Agent": uri.includes(".php") ? "Mozilla/5.0 (compatible; Nmap Scripting Engine)" : "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9",
        "X-Forwarded-For": origin.ip,
        "X-Gateway-Protection": protection,
        "Connection": "keep-alive",
      },
    });
  }

  return NextResponse.json({
    status: "success",
    stream_active: true,
    packets,
  });
}
