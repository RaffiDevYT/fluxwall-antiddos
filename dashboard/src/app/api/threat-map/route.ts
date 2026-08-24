import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface ThreatNode {
  id: string;
  country: string;
  country_name: string;
  lat: number;
  lng: number;
  qps: number;
  threat_type: string;
  last_pulse: number;
}

export interface ThreatArc {
  id: string;
  from: { lat: number; lng: number; country: string };
  to: { lat: number; lng: number; label: string };
  intensity: "high" | "medium" | "critical";
  color: string;
}

const GLOBAL_THREAT_NODES: ThreatNode[] = [
  { id: "node_cn", country: "CN", country_name: "China", lat: 35.8617, lng: 104.1954, qps: 142, threat_type: "HTTP_FLOOD", last_pulse: Date.now() },
  { id: "node_ru", country: "RU", country_name: "Russia", lat: 61.524, lng: 105.3188, qps: 98, threat_type: "SYN_FLOOD", last_pulse: Date.now() },
  { id: "node_us", country: "US", country_name: "United States", lat: 37.0902, lng: -95.7129, qps: 64, threat_type: "BAD_BOT_PROBE", last_pulse: Date.now() },
  { id: "node_br", country: "BR", country_name: "Brazil", lat: -14.235, lng: -51.9253, qps: 45, threat_type: "SQLI_SCANNER", last_pulse: Date.now() },
  { id: "node_kp", country: "KP", country_name: "North Korea", lat: 40.3399, lng: 127.5101, qps: 38, threat_type: "RCE_PROBE", last_pulse: Date.now() },
  { id: "node_de", country: "DE", country_name: "Germany", lat: 51.1657, lng: 10.4515, qps: 18, threat_type: "CRAWLER_BURST", last_pulse: Date.now() },
  { id: "node_vn", country: "VN", country_name: "Vietnam", lat: 14.0583, lng: 108.2772, qps: 12, threat_type: "RATE_BURST", last_pulse: Date.now() },
];

const TARGET_COORDS = { lat: -6.2088, lng: 106.8456, label: "FluxWall Gateway Primary Node (ID)" };

export async function GET() {
  // Generate real-time random arc pulses for visualization
  const activeArcs: ThreatArc[] = GLOBAL_THREAT_NODES.slice(0, 5).map((node, i) => ({
    id: `arc_${node.country}_${Date.now()}_${i}`,
    from: { lat: node.lat, lng: node.lng, country: node.country },
    to: TARGET_COORDS,
    intensity: node.qps > 80 ? "critical" : node.qps > 30 ? "high" : "medium",
    color: node.qps > 80 ? "#38bdf8" : "#0284c7",
  }));

  return NextResponse.json({
    status: "success",
    target: TARGET_COORDS,
    nodes: GLOBAL_THREAT_NODES,
    arcs: activeArcs,
    total_active_threats: GLOBAL_THREAT_NODES.reduce((acc, n) => acc + n.qps, 0),
    timestamp: new Date().toISOString(),
  });
}
