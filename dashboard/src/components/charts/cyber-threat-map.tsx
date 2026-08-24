"use client";

import React, { useState, useEffect } from "react";
import { Globe, Radio, Shield, Zap, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ThreatNode {
  id: string;
  country: string;
  country_name: string;
  lat: number;
  lng: number;
  qps: number;
  threat_type: string;
}

interface ThreatArc {
  id: string;
  from: { lat: number; lng: number; country: string };
  to: { lat: number; lng: number; label: string };
  intensity: "high" | "medium" | "critical";
  color: string;
}

// Convert Geo Latitude/Longitude to 2D SVG canvas (Equirectangular Projection)
function project(lat: number, lng: number, width: number, height: number) {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

export default function CyberThreatMap() {
  const [nodes, setNodes] = useState<ThreatNode[]>([]);
  const [arcs, setArcs] = useState<ThreatArc[]>([]);
  const [target, setTarget] = useState({ lat: -6.2088, lng: 106.8456, label: "FluxWall Gateway Primary Node (ID)" });
  const [selectedNode, setSelectedNode] = useState<ThreatNode | null>(null);
  const [totalThreats, setTotalThreats] = useState(0);

  const mapWidth = 900;
  const mapHeight = 440;

  const fetchThreatMapData = async () => {
    try {
      const res = await fetch("/api/threat-map", { cache: "no-store" });
      const data = await res.json();
      if (data.status === "success") {
        setNodes(data.nodes || []);
        setArcs(data.arcs || []);
        if (data.target) setTarget(data.target);
        setTotalThreats(data.total_active_threats || 0);
      }
    } catch {}
  };

  useEffect(() => {
    fetchThreatMapData();
    const interval = setInterval(fetchThreatMapData, 3500);
    return () => clearInterval(interval);
  }, []);

  const targetPos = project(target.lat, target.lng, mapWidth, mapHeight);

  return (
    <div className="relative w-full rounded-2xl bg-[#060910] border border-primary/30 overflow-hidden shadow-2xl p-4 sm:p-6">
      {/* Header Overlay */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/20 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 border border-primary/30 rounded-xl">
            <Globe className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-white tracking-wider uppercase">
                Global Cyber Threat Trajectory Map
              </span>
              <Badge variant="default" className="text-[9px] font-mono">
                LIVE LASER INTERCEPTION
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Real-time Layer-7 attack origins deflected by FluxWall Edge Gateway
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase">Aggregated Threat QPS</div>
            <div className="text-base font-black text-primary font-mono">{totalThreats} req/s</div>
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={fetchThreatMapData}
            aria-label="Refresh threat trajectory map"
            className="h-8 w-8 border-primary/30 text-primary hover:bg-primary/10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full aspect-[2/1] min-h-[300px] bg-[#04060b] rounded-xl border border-primary/20 flex items-center justify-center overflow-hidden">
        {/* World Map Graticules / Grid Lines */}
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-full select-none"
          style={{ filter: "drop-shadow(0 0 10px rgba(56,189,248,0.1))" }}
        >
          <defs>
            {/* Cyan Arc Laser Gradient */}
            <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
            </linearGradient>

            {/* Target Node Glow Filter */}
            <filter id="glowTarget" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Coordinates Grid */}
          <g stroke="rgba(56,189,248,0.08)" strokeWidth="1" strokeDasharray="3 3">
            {[...Array(9)].map((_, i) => (
              <line key={`h_${i}`} x1="0" y1={(i + 1) * (mapHeight / 10)} x2={mapWidth} y2={(i + 1) * (mapHeight / 10)} />
            ))}
            {[...Array(11)].map((_, i) => (
              <line key={`v_${i}`} x1={(i + 1) * (mapWidth / 12)} y1="0" x2={(i + 1) * (mapWidth / 12)} y2={mapHeight} />
            ))}
          </g>

          {/* Continents Simplified Stylized Silhouettes */}
          <g fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.18)" strokeWidth="0.8">
            {/* North America */}
            <path d="M 120 70 Q 240 60 260 130 T 210 200 T 150 160 Z" />
            {/* South America */}
            <path d="M 230 220 Q 300 240 280 340 T 220 380 T 200 260 Z" />
            {/* Europe */}
            <path d="M 440 60 Q 520 50 510 110 T 430 120 Z" />
            {/* Africa */}
            <path d="M 430 140 Q 530 150 510 280 T 440 300 T 400 180 Z" />
            {/* Asia */}
            <path d="M 540 60 Q 750 40 760 170 T 630 220 T 520 130 Z" />
            {/* Australia */}
            <path d="M 720 280 Q 820 270 800 350 T 710 340 Z" />
          </g>

          {/* Animated Laser Trajectory Arcs */}
          {nodes.map((node) => {
            const originPos = project(node.lat, node.lng, mapWidth, mapHeight);
            const dx = targetPos.x - originPos.x;
            const dy = targetPos.y - originPos.y;
            const cx = (originPos.x + targetPos.x) / 2 - dy * 0.25;
            const cy = (originPos.y + targetPos.y) / 2 + dx * 0.25;
            const pathData = `M ${originPos.x} ${originPos.y} Q ${cx} ${cy} ${targetPos.x} ${targetPos.y}`;

            return (
              <g key={`arc_${node.id}`}>
                {/* Arc Path Base */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="rgba(56,189,248,0.25)"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />

                {/* Animated Glowing Laser Pulse */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="url(#laserGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="30 180"
                  className="animate-laser"
                  style={{ filter: "drop-shadow(0 0 6px #38bdf8)" }}
                />
              </g>
            );
          })}

          {/* Origin Threat Nodes */}
          {nodes.map((node) => {
            const pos = project(node.lat, node.lng, mapWidth, mapHeight);
            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer group"
                onClick={() => setSelectedNode(node)}
              >
                {/* Pulsing Radar Circle */}
                <circle r="12" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.4" className="animate-ping" />
                <circle r="5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                {/* Text Label */}
                <text
                  x="8"
                  y="3"
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                  className="group-hover:fill-sky-300 transition"
                >
                  {node.country} ({node.qps} qps)
                </text>
              </g>
            );
          })}

          {/* Central Target Node (Protected Gateway) */}
          <g transform={`translate(${targetPos.x}, ${targetPos.y})`} filter="url(#glowTarget)">
            <circle r="18" fill="none" stroke="#38bdf8" strokeWidth="1.5" className="animate-pulse opacity-75" />
            <circle r="7" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
            <text x="12" y="4" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="900">
              TARGET NODE
            </text>
          </g>
        </svg>

        {/* Selected Node Tooltip Overlay */}
        {selectedNode && (
          <div className="absolute top-4 left-4 p-3.5 bg-[#090d16]/95 border border-primary/40 rounded-xl backdrop-blur-md shadow-2xl text-xs space-y-1 z-10 animate-in fade-in">
            <div className="flex items-center justify-between gap-4 border-b border-primary/20 pb-1.5">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" /> {selectedNode.country_name} ({selectedNode.country})
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                aria-label="Close country details tooltip"
                className="text-muted-foreground hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Vektor Serangan: <span className="font-mono text-sky-300 font-bold">{selectedNode.threat_type}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Intensitas Flood: <span className="font-mono text-primary font-bold">{selectedNode.qps} req/sec</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-1">
              <Shield className="w-3 h-3" /> Status: 100% Intercepted & Deflected
            </div>
          </div>
        )}
      </div>

      {/* Hotspots Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-4">
        {nodes.map((node) => (
          <div
            key={node.id}
            onClick={() => setSelectedNode(node)}
            className="p-2.5 bg-secondary/20 border border-primary/15 rounded-xl hover:border-primary/50 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-white">{node.country}</span>
              <Badge variant="default" className="text-[9px] py-0 px-1 font-mono">
                {node.qps} QPS
              </Badge>
            </div>
            <div className="text-[10px] text-muted-foreground truncate mt-0.5">{node.threat_type}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
