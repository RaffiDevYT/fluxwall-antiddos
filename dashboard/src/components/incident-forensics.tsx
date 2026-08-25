"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Radio,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Plus,
  Trash2,
  Lock,
  ExternalLink,
  Search,
  Bug,
  Shield,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ForensicIncident, CanaryDecoyTrap } from "@/lib/packet-store";

interface IncidentForensicsProps {
  onInvestigateIp?: (ip: string) => void;
}

export default function IncidentForensics({ onInvestigateIp }: IncidentForensicsProps) {
  const [incidents, setIncidents] = useState<ForensicIncident[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [traps, setTraps] = useState<CanaryDecoyTrap[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state for adding new decoy trap
  const [trapName, setTrapName] = useState("");
  const [trapPath, setTrapPath] = useState("");
  const [trapAction, setTrapAction] = useState<"IP_BANNED" | "CHALLENGE" | "LOG">("IP_BANNED");

  const fetchForensics = async () => {
    try {
      const res = await fetch("/api/forensics", { cache: "no-store" });
      const data = await res.json();
      if (data.status === "success" && data.incidents) {
        setIncidents(data.incidents);
      }
    } catch {}
  };

  const fetchTraps = async () => {
    try {
      const res = await fetch("/api/canary-traps", { cache: "no-store" });
      const data = await res.json();
      if (data.status === "success" && data.traps) {
        setTraps(data.traps);
      }
    } catch {}
  };

  useEffect(() => {
    fetchForensics();
    fetchTraps();
    const interval = setInterval(fetchForensics, 4000);
    return () => clearInterval(interval);
  }, []);

  const currentIncident = incidents[currentIndex] || incidents[0] || {
    id: "#4186",
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
  };

  const handleNext = () => {
    if (currentIndex < incidents.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAddTrap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trapName || !trapPath) return;

    try {
      const res = await fetch("/api/canary-traps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trapName, path: trapPath, action: trapAction }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setTrapName("");
        setTrapPath("");
        fetchTraps();
      }
    } catch {}
  };

  const handleDeleteTrap = async (id: string) => {
    try {
      await fetch(`/api/canary-traps?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      fetchTraps();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* 1. Incident Forensics Display Card (Styled exactly after Forensic SOC Inspector) */}
      <Card className="border-primary/30 bg-[#090d16]/95 backdrop-blur-xl shadow-2xl overflow-hidden glow-primary">
        {/* Forensics Header */}
        <div className="px-6 py-4 border-b border-primary/20 bg-[#070a12] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                Incident Forensics
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Deep Layer-7 Payload & Honeypot Canary Decoy Inspector
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono border-red-500/40 text-red-400 bg-red-500/10">
              HONEYPOT ACTIVE
            </Badge>
          </div>
        </div>

        {/* Forensics Body Grid */}
        <CardContent className="p-6 space-y-6">
          {/* Top Key Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-primary/10">
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                INCIDENT
              </div>
              <div className="text-xl font-black font-mono text-white">{currentIncident.id}</div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                RECORDED
              </div>
              <div className="text-xs font-mono font-bold text-sky-200 mt-1">{currentIncident.recorded}</div>
            </div>

            <div className="sm:text-right">
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                SEVERITY
              </div>
              <Badge
                variant="destructive"
                className="text-xs font-black tracking-wider px-3 py-0.5 bg-red-500/20 border border-red-500 text-red-400 shadow-lg shadow-red-500/20 uppercase"
              >
                {currentIncident.severity}
              </Badge>
            </div>
          </div>

          {/* Row 2: Type, Action, Attacker IP */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-primary/10">
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                TYPE
              </div>
              <div className="text-xs font-black uppercase text-white tracking-wide">
                {currentIncident.type}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                ACTION TAKEN
              </div>
              <div className="text-xs font-mono font-bold text-primary">
                {currentIncident.action_taken}
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                ATTACKER IP
              </div>
              <button
                onClick={() => onInvestigateIp?.(currentIncident.attacker_ip)}
                className="text-sm font-mono font-black text-sky-400 hover:text-sky-200 transition cursor-pointer underline underline-offset-2"
              >
                {currentIncident.attacker_ip}
              </button>
            </div>
          </div>

          {/* Row 3: Method, Auth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-primary/10">
            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                METHOD
              </div>
              <div className="text-xs font-mono font-bold text-white uppercase">{currentIncident.method}</div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                SIGNED IN AS
              </div>
              <div className="text-xs font-medium text-muted-foreground">{currentIncident.signed_in_as}</div>
            </div>
          </div>

          {/* Row 4: Request URI */}
          <div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
              REQUEST URI
            </div>
            <div className="p-2.5 rounded-lg bg-black/50 border border-primary/20 font-mono text-xs font-bold text-sky-300">
              {currentIncident.request_uri}
            </div>
          </div>

          {/* Row 5: User Agent */}
          <div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
              USER AGENT
            </div>
            <div className="p-2.5 rounded-lg bg-black/50 border border-primary/20 font-mono text-[11px] text-muted-foreground leading-relaxed">
              {currentIncident.user_agent}
            </div>
          </div>

          {/* Terminal Box: Payload Match */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-300">
              <Terminal className="w-4 h-4 text-primary" />
              <span>PAYLOAD MATCH</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#04060a] border border-primary/30 font-mono text-xs text-amber-300 leading-relaxed shadow-inner">
              <span className="text-amber-400 font-bold">IDS [CANARY_TRAP_ENDPOINT] matched: </span>
              <span className="text-white">{currentIncident.payload_match.replace("IDS [CANARY_TRAP_ENDPOINT] matched: ", "")}</span>
            </div>
          </div>

          {/* Carousel Pagination Controls */}
          {incidents.length > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                size="icon"
                variant="outline"
                disabled={currentIndex === 0}
                onClick={handlePrev}
                className="h-8 w-8 rounded-full border-primary/30 text-primary hover:bg-primary/10"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-1.5">
                {incidents.slice(0, 8).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentIndex === idx ? "w-6 bg-primary" : "bg-muted-foreground/30 hover:bg-primary/50"
                    }`}
                  />
                ))}
              </div>

              <Button
                size="icon"
                variant="outline"
                disabled={currentIndex >= incidents.length - 1}
                onClick={handleNext}
                className="h-8 w-8 rounded-full border-primary/30 text-primary hover:bg-primary/10"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Canary Decoy Trap Manager */}
      <Card className="border-primary/20 bg-card/85">
        <CardHeader className="border-b border-border/80 pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Bug className="w-4 h-4 text-primary" /> Canary Honeypot Decoy Endpoints
          </CardTitle>
          <CardDescription className="text-[11px]">
            Deploy fake decoy endpoints that instantly trigger a 24-hour IP quarantine and critical incident alert when probed.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-6">
          {/* Add Trap Form */}
          <form onSubmit={handleAddTrap} className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-3">
            <div className="text-xs font-bold text-white">Deploy New Canary Honeypot Trap</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Trap Name / Decoy Type
                </label>
                <Input
                  placeholder="e.g. WordPress Admin Probe Trap"
                  value={trapName}
                  onChange={(e) => setTrapName(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Decoy Request URI / Path
                </label>
                <Input
                  placeholder="e.g. /wp-admin/phpinfo/ or /.env"
                  value={trapPath}
                  onChange={(e) => setTrapPath(e.target.value)}
                  required
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Enforcement Action
                </label>
                <select
                  value={trapAction}
                  onChange={(e: any) => setTrapAction(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card/80 px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="IP_BANNED">IP_BANNED (24-Hour Instant Ban)</option>
                  <option value="CHALLENGE">CHALLENGE (JS Proof-of-Work)</option>
                  <option value="LOG">LOG ONLY (Silent Forensic Mode)</option>
                </select>
              </div>
            </div>

            <Button type="submit" variant="cyber" className="text-xs font-bold gap-1.5 mt-2">
              <Plus className="w-3.5 h-3.5" /> Deploy Canary Decoy
            </Button>
          </form>

          {/* Traps Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                <tr>
                  <th className="py-3 px-4">Decoy Trap Name</th>
                  <th className="py-3 px-4">Target Decoy URI</th>
                  <th className="py-3 px-4">Enforcement Action</th>
                  <th className="py-3 px-4">Attacker Hits</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {traps.map((trap) => (
                  <tr key={trap.id} className="hover:bg-accent/40 transition">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <Bug className="w-3.5 h-3.5 text-red-400" />
                      <span>{trap.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-sky-300">
                      <code className="bg-black/40 px-1.5 py-0.5 rounded text-[11px]">{trap.path}</code>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="destructive" className="text-[10px]">
                        {trap.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-red-400">{trap.hits} blocked</td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTrap(trap.id)}
                        className="text-destructive hover:bg-destructive/10 text-xs h-7"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
