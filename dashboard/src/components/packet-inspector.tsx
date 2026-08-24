"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Radio,
  Play,
  Pause,
  Trash2,
  Search,
  ChevronDown,
  ChevronRight,
  Shield,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CapturedPacket {
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

export default function PacketInspector() {
  const [packets, setPackets] = useState<CapturedPacket[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [expandedPacketId, setExpandedPacketId] = useState<string | null>(null);

  const fetchPackets = async () => {
    if (!isStreaming) return;
    try {
      const res = await fetch("/api/packet-stream?count=4", { cache: "no-store" });
      const data = await res.json();
      if (data.status === "success" && data.packets) {
        setPackets((prev) => {
          const combined = [...data.packets, ...prev];
          return combined.slice(0, 40); // Keep latest 40 packets in ring buffer
        });
      }
    } catch {}
  };

  useEffect(() => {
    fetchPackets();
    const interval = setInterval(fetchPackets, 2000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  const toggleExpand = (id: string) => {
    setExpandedPacketId(expandedPacketId === id ? null : id);
  };

  const filteredPackets = packets.filter((p) => {
    const query = searchFilter.toLowerCase();
    return (
      p.client_ip.toLowerCase().includes(query) ||
      p.uri.toLowerCase().includes(query) ||
      p.method.toLowerCase().includes(query) ||
      p.protection.toLowerCase().includes(query) ||
      p.status.toString().includes(query)
    );
  });

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (status === 429) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-destructive bg-destructive/10 border-destructive/30";
  };

  const getProtectionBadge = (protection: CapturedPacket["protection"]) => {
    switch (protection) {
      case "inspected-pass":
      case "whitelisted":
        return <Badge variant="default" className="text-[9px] py-0 px-1.5">{protection}</Badge>;
      case "bot-filter":
      case "custom-waf":
      case "blacklisted":
        return <Badge variant="destructive" className="text-[9px] py-0 px-1.5">{protection}</Badge>;
      case "rate-limited":
        return <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-amber-500/40 text-amber-400">{protection}</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px] py-0 px-1.5">{protection}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Sniffer Stream Toolbar */}
      <div className="p-4 rounded-2xl bg-[#090d16] border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 border border-primary/30 rounded-xl">
            <Radio className={`w-4 h-4 text-primary ${isStreaming ? "animate-pulse" : ""}`} />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Deep Packet Inspection (DPI) Stream</span>
              <span className="relative flex h-2 w-2">
                {isStreaming && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isStreaming ? "bg-primary" : "bg-muted"}`}></span>
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Live HTTP Layer-7 socket sniffer & frame inspector
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Filter IP, URI, Method..."
              aria-label="Filter captured packets"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>

          {/* Pause / Resume */}
          <Button
            size="sm"
            variant={isStreaming ? "outline" : "cyber"}
            onClick={() => setIsStreaming(!isStreaming)}
            aria-label={isStreaming ? "Pause Packet Stream" : "Resume Packet Stream"}
            className="text-xs h-8 gap-1.5 shrink-0"
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Resume
              </>
            )}
          </Button>

          {/* Clear Buffer */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setPackets([])}
            aria-label="Clear packet buffer"
            className="h-8 w-8 text-muted-foreground hover:text-white shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Packet Table */}
      <div className="rounded-2xl bg-[#090d16] border border-primary/20 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
              <tr>
                <th className="py-3 px-3 w-8"></th>
                <th className="py-3 px-3">Time</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-4">Client IP</th>
                <th className="py-3 px-4">Request URI / Path</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Defense</th>
                <th className="py-3 px-3">Payload</th>
                <th className="py-3 px-3 text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredPackets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    Waiting for incoming gateway packets... Stream is active.
                  </td>
                </tr>
              ) : (
                filteredPackets.map((pkt) => {
                  const isExpanded = expandedPacketId === pkt.id;
                  return (
                    <React.Fragment key={pkt.id}>
                      <tr
                        onClick={() => toggleExpand(pkt.id)}
                        className={`hover:bg-accent/40 transition cursor-pointer ${
                          isExpanded ? "bg-accent/30" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground text-[11px]">{pkt.time}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                            pkt.method === "POST" ? "bg-sky-500/20 text-sky-300 border border-sky-500/30" : "bg-secondary text-white"
                          }`}>
                            {pkt.method}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-bold text-white flex items-center gap-1.5">
                          <span>{pkt.client_ip}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">({pkt.country})</span>
                        </td>
                        <td className="py-2.5 px-4 text-sky-200 truncate max-w-xs">{pkt.uri}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(pkt.status)}`}>
                            {pkt.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{getProtectionBadge(pkt.protection)}</td>
                        <td className="py-2.5 px-3 text-muted-foreground text-[11px]">{pkt.payload_size}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-400">{pkt.latency_ms} ms</td>
                      </tr>

                      {/* Expandable Deep Header Inspector */}
                      {isExpanded && (
                        <tr className="bg-[#06080e] border-t border-primary/20">
                          <td colSpan={9} className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-primary/20 pb-2">
                              <Layers className="w-3.5 h-3.5 text-primary" />
                              <span>Decoded HTTP Request Headers ({pkt.id})</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              {Object.entries(pkt.headers).map(([key, val]) => (
                                <div key={key} className="p-2 bg-secondary/20 rounded border border-primary/10 flex items-start gap-2">
                                  <span className="font-bold text-primary shrink-0">{key}:</span>
                                  <span className="text-muted-foreground break-all">{val}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
