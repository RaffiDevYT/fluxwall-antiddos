"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Radio,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Terminal,
  Plus,
  Trash2,
  Lock,
  Unlock,
  ExternalLink,
  Search,
  Bug,
  Shield,
  Layers,
  CheckCircle2,
  Fingerprint,
  Globe,
  Server,
  AlertOctagon,
  Clock,
  Ban,
  UserCheck,
  Radar,
  Send,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ForensicIncident, CanaryDecoyTrap } from "@/lib/packet-store";
import ConfirmDialog from "@/components/confirm-dialog";

interface IncidentForensicsProps {
  onInvestigateIp?: (ip: string) => void;
}

interface AttackerGeoData {
  ip: string;
  geo: {
    country: string;
    city?: string;
    region?: string;
    org?: string;
    is_datacenter: boolean;
  };
  defense_status: {
    is_banned: boolean;
    ban_ttl_seconds: number;
    is_whitelisted: boolean;
    is_blacklisted: boolean;
    strike_violations: number;
  };
}

export default function IncidentForensics({ onInvestigateIp }: IncidentForensicsProps) {
  const [incidents, setIncidents] = useState<ForensicIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<ForensicIncident | null>(null);
  const [traps, setTraps] = useState<CanaryDecoyTrap[]>([]);
  const [showAttackerDetail, setShowAttackerDetail] = useState(false);
  const [geoData, setGeoData] = useState<AttackerGeoData | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: "danger" | "warning" | "primary";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const openConfirm = (opts: {
    title?: string;
    message?: string;
    variant?: "danger" | "warning" | "primary";
    onConfirm: () => void;
  }) => {
    setConfirmState({
      isOpen: true,
      title: opts.title || "Konfirmasi Tindakan",
      message: opts.message || "Apakah Anda yakin ingin memproses tindakan ini?",
      variant: opts.variant || "warning",
      onConfirm: () => {
        opts.onConfirm();
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Form state for adding new decoy trap
  const [trapName, setTrapName] = useState("");
  const [trapPath, setTrapPath] = useState("");
  const [trapAction, setTrapAction] = useState<"IP_BANNED" | "CHALLENGE" | "LOG">("IP_BANNED");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

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

  const fetchAttackerGeo = async (ip: string) => {
    if (!ip) return;
    setGeoLoading(true);
    try {
      const res = await fetch(`/api/ip-lookup?ip=${encodeURIComponent(ip)}`);
      const data = await res.json();
      if (data.status === "success") {
        setGeoData(data);
      }
    } catch {}
    setGeoLoading(false);
  };

  const handleOpenDetail = (incident: ForensicIncident) => {
    setSelectedIncident(incident);
    setShowAttackerDetail(false);
    setGeoData(null);
  };

  const handleCloseDetail = () => {
    setSelectedIncident(null);
    setShowAttackerDetail(false);
    setGeoData(null);
  };

  const handleToggleAttackerDetail = () => {
    const nextState = !showAttackerDetail;
    setShowAttackerDetail(nextState);
    if (nextState && selectedIncident && (!geoData || geoData.ip !== selectedIncident.attacker_ip)) {
      fetchAttackerGeo(selectedIncident.attacker_ip);
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
        showToast(`Canary Trap "${trapName}" deployed!`);
        fetchTraps();
      }
    } catch {}
  };

  const handleDeleteTrap = async (id: string) => {
    try {
      await fetch(`/api/canary-traps?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      showToast("Canary Trap removed");
      fetchTraps();
    } catch {}
  };

  const handleBlacklistAttacker = async (ip: string) => {
    try {
      await fetch("/api/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
      });
      showToast(`IP ${ip} permanently blacklisted!`);
      if (selectedIncident) fetchAttackerGeo(selectedIncident.attacker_ip);
    } catch {}
  };

  const handleUnbanAttacker = async (ip: string) => {
    try {
      await fetch(`/api/bans?ip=${encodeURIComponent(ip)}`, { method: "DELETE" });
      showToast(`IP ${ip} unbanned and restored!`);
      if (selectedIncident) fetchAttackerGeo(selectedIncident.attacker_ip);
    } catch {}
  };

  const handleTriggerTestSimulation = async () => {
    try {
      const res = await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vector: "canary_trap", intensity: 1 }),
      });
      const json = await res.json();
      if (json.status === "success") {
        showToast("⚡ Honeypot probe test simulated! Incident recorded.");
        fetchForensics();
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Security Verification Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-primary/20 border border-primary text-sky-200 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <span className="font-semibold text-xs tracking-wide">{toastMsg}</span>
        </div>
      )}

      {/* 1. Forensics Incidents Log Summary Table */}
      <Card className="border-primary/20 bg-card/85 glow-primary">
        <CardHeader className="border-b border-border/80 pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-wider text-white">
                Incident Forensics Log
              </CardTitle>
              <CardDescription className="text-[10px]">
                Click "View Detail" on any incident row to inspect deep Layer-7 payload matches and attacker profiles
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="cyber"
              onClick={handleTriggerTestSimulation}
              className="text-[11px] font-bold gap-1.5 h-7 px-2.5"
            >
              <Send className="w-3 h-3" /> Test Honeypot Probe
            </Button>
            <Badge variant="outline" className="text-[9px] font-mono border-red-500/40 text-red-400 bg-red-500/10">
              {incidents.length} INCIDENTS
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                <tr>
                  <th className="py-2.5 px-3.5">Incident ID</th>
                  <th className="py-2.5 px-3.5">Timestamp</th>
                  <th className="py-2.5 px-3.5">Severity</th>
                  <th className="py-2.5 px-3.5">Incident Type</th>
                  <th className="py-2.5 px-3.5">Attacker IP</th>
                  <th className="py-2.5 px-3.5">Probed URI</th>
                  <th className="py-2.5 px-3.5">Action Taken</th>
                  <th className="py-2.5 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Radar className="w-6 h-6 text-primary animate-pulse" />
                        <span className="font-bold text-white text-xs">No Critical Incidents Recorded Yet</span>
                        <span className="text-[11px] text-muted-foreground max-w-sm">
                          Honeypot Decoys are armed in Redis. Click "Test Honeypot Probe" above to simulate an attack incident.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-accent/40 transition">
                      <td className="py-2.5 px-3.5 font-mono font-black text-white text-xs">{inc.id}</td>
                      <td className="py-2.5 px-3.5 font-mono text-[11px] text-muted-foreground">{inc.recorded}</td>
                      <td className="py-2.5 px-3.5">
                        <Badge
                          variant="destructive"
                          className="text-[9px] font-black py-0 px-1.5 bg-red-500/20 border border-red-500 text-red-400 uppercase"
                        >
                          {inc.severity}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-white text-xs">{inc.type}</td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-sky-400 text-xs">{inc.attacker_ip}</td>
                      <td className="py-2.5 px-3.5 font-mono text-sky-200 truncate max-w-[130px] text-xs">
                        {inc.request_uri}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-primary text-xs">{inc.action_taken}</td>
                      <td className="py-2.5 px-3.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDetail(inc)}
                          className="text-[11px] h-6 px-2.5 gap-1 border-primary/30 text-primary hover:bg-primary/20 font-bold"
                        >
                          <Eye className="w-3 h-3" /> View Detail
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 2. COMPACT, SLEEK INCIDENT FORENSICS DETAIL MODAL */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="max-w-xl w-full max-h-[90vh] flex flex-col rounded-2xl border border-primary/40 bg-[#090d16] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-primary/20 bg-[#06080f] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    Incident Forensics Report
                  </h2>
                  <p className="text-[10px] text-muted-foreground">
                    Deep Layer-7 Payload & Honeypot Canary Decoy Inspector
                  </p>
                </div>
              </div>

              <Button
                size="icon"
                variant="ghost"
                onClick={handleCloseDetail}
                className="h-7 w-7 text-muted-foreground hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto max-h-[calc(90vh-100px)]">
              {/* Row 1: Key Summary Stats */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-secondary/20 border border-primary/15 text-xs">
                <div>
                  <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                    INCIDENT
                  </div>
                  <div className="text-base font-black font-mono text-white mt-0.5">{selectedIncident.id}</div>
                </div>

                <div>
                  <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                    RECORDED
                  </div>
                  <div className="text-[11px] font-mono font-bold text-sky-200 mt-1">{selectedIncident.recorded}</div>
                </div>

                <div className="text-right">
                  <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">
                    SEVERITY
                  </div>
                  <Badge
                    variant="destructive"
                    className="text-[9px] font-black px-2 py-0 bg-red-500/20 border border-red-500 text-red-400 uppercase"
                  >
                    {selectedIncident.severity}
                  </Badge>
                </div>
              </div>

              {/* Row 2: Type, Action, Attacker IP, Method */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2 rounded-lg bg-secondary/15 border border-border/50">
                  <div className="text-[9px] uppercase font-bold text-muted-foreground">TYPE</div>
                  <div className="text-[11px] font-bold text-white mt-0.5 truncate">{selectedIncident.type}</div>
                </div>

                <div className="p-2 rounded-lg bg-secondary/15 border border-border/50">
                  <div className="text-[9px] uppercase font-bold text-muted-foreground">ACTION TAKEN</div>
                  <div className="text-[11px] font-mono font-bold text-primary mt-0.5">{selectedIncident.action_taken}</div>
                </div>

                <div className="p-2 rounded-lg bg-secondary/15 border border-border/50">
                  <div className="text-[9px] uppercase font-bold text-muted-foreground">ATTACKER IP</div>
                  <div className="text-[11px] font-mono font-bold text-sky-400 mt-0.5">{selectedIncident.attacker_ip}</div>
                </div>

                <div className="p-2 rounded-lg bg-secondary/15 border border-border/50">
                  <div className="text-[9px] uppercase font-bold text-muted-foreground">METHOD / AUTH</div>
                  <div className="text-[11px] font-mono font-bold text-white mt-0.5">
                    {selectedIncident.method} <span className="text-[10px] font-normal text-muted-foreground">(Guest)</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Request URI */}
              <div>
                <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                  REQUEST URI
                </div>
                <div className="p-2 rounded-lg bg-black/50 border border-primary/20 font-mono text-[11px] font-bold text-sky-300">
                  {selectedIncident.request_uri}
                </div>
              </div>

              {/* Row 4: User Agent */}
              <div>
                <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                  USER AGENT
                </div>
                <div className="p-2 rounded-lg bg-black/50 border border-primary/20 font-mono text-[10px] text-muted-foreground leading-relaxed break-all">
                  {selectedIncident.user_agent}
                </div>
              </div>

              {/* Terminal Box: Payload Match */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-300">
                  <Terminal className="w-3.5 h-3.5 text-primary" />
                  <span>PAYLOAD MATCH</span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#04060a] border border-primary/30 font-mono text-[11px] text-amber-300 leading-relaxed shadow-inner">
                  <span className="text-amber-400 font-bold">IDS [CANARY_TRAP_ENDPOINT] matched: </span>
                  <span className="text-white">
                    {selectedIncident.payload_match.replace("IDS [CANARY_TRAP_ENDPOINT] matched: ", "")}
                  </span>
                </div>
              </div>

              {/* 🔍 COMPACT ATTACKER PROFILE */}
              <div className="pt-2 border-t border-primary/20 space-y-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleAttackerDetail}
                  className="w-full flex items-center justify-between text-[11px] font-bold border-primary/30 text-sky-300 hover:bg-primary/10 py-1.5 h-8"
                >
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-3.5 h-3.5 text-primary" />
                    <span>
                      {showAttackerDetail
                        ? `Hide Attacker Profile (${selectedIncident.attacker_ip})`
                        : `Inspect Attacker Profile Intelligence (${selectedIncident.attacker_ip})`}
                    </span>
                  </div>
                  {showAttackerDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </Button>

                {showAttackerDetail && (
                  <div className="p-3 rounded-xl bg-[#06080f] border border-primary/30 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                      <div className="text-[11px] font-black uppercase text-white flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-red-400" />
                        <span>Live Intel — {selectedIncident.attacker_ip}</span>
                      </div>
                      <Badge variant="destructive" className="text-[8px] font-mono py-0">
                        HOSTILE BOTNET THREAT
                      </Badge>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-secondary/30 border border-primary/20 space-y-0.5">
                        <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5 text-primary" /> Geolocation
                        </div>
                        <div className="font-bold text-white text-[11px]">
                          {geoData?.geo?.country || (selectedIncident.attacker_ip.startsWith("13.") ? "United States (US)" : "Global Origin")}
                        </div>
                        <div className="text-[9px] text-muted-foreground truncate">
                          {geoData?.geo?.city || "Ashburn Data Node"}, {geoData?.geo?.region || "VA"}
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-secondary/30 border border-primary/20 space-y-0.5">
                        <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                          <Server className="w-2.5 h-2.5 text-primary" /> ASN / Network
                        </div>
                        <div className="font-bold text-amber-400 text-[11px] truncate">
                          {geoData?.geo?.org || "Amazon AWS (AS16509)"}
                        </div>
                        <div className="text-[9px] text-red-400 flex items-center gap-0.5">
                          <AlertOctagon className="w-2.5 h-2.5" /> Datacenter Proxy
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-secondary/30 border border-primary/20 space-y-0.5">
                        <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-primary" /> Defense Status
                        </div>
                        <div className="font-bold text-red-400 text-[11px]">
                          {geoData?.defense_status?.is_banned ? `Banned (${geoData.defense_status.ban_ttl_seconds}s TTL)` : "Quarantine TTL: 24h"}
                        </div>
                        <div className="text-[9px] text-muted-foreground truncate">
                          blacklist:{selectedIncident.attacker_ip}
                        </div>
                      </div>
                    </div>

                    {/* Direct SOC Action Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-primary/10">
                      <Button
                        size="sm"
                        variant="cyber"
                        onClick={() => {
                          handleCloseDetail();
                          onInvestigateIp?.(selectedIncident.attacker_ip);
                        }}
                        className="text-[10px] h-6 px-2 gap-1 font-bold"
                      >
                        <Search className="w-3 h-3" /> Investigate IP
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          openConfirm({
                            title: "Blacklist IP Penyerang",
                            message: `Apakah Anda yakin ingin memasukkan ${selectedIncident.attacker_ip} ke Blacklist Permanen?`,
                            variant: "danger",
                            onConfirm: () => handleBlacklistAttacker(selectedIncident.attacker_ip),
                          })
                        }
                        className="text-[10px] h-6 px-2 gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                      >
                        <Ban className="w-3 h-3" /> Permanent Blacklist
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          openConfirm({
                            title: "Buka Blokir IP",
                            message: `Apakah Anda yakin ingin membuka blokir (pardon) untuk ${selectedIncident.attacker_ip}?`,
                            variant: "warning",
                            onConfirm: () => handleUnbanAttacker(selectedIncident.attacker_ip),
                          })
                        }
                        className="text-[10px] h-6 px-2 gap-1 border-primary/30 text-primary hover:bg-primary/10"
                      >
                        <Unlock className="w-3 h-3" /> Remove Ban
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-2.5 border-t border-primary/20 bg-[#06080f] flex justify-end flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handleCloseDetail} className="text-[11px] h-7 px-3">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Canary Decoy Trap Manager */}
      <Card className="border-primary/20 bg-card/85">
        <CardHeader className="border-b border-border/80 pb-3">
          <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Bug className="w-3.5 h-3.5 text-primary" /> Canary Honeypot Decoy Endpoints
          </CardTitle>
          <CardDescription className="text-[10px]">
            Deploy fake decoy endpoints that instantly trigger a 24-hour IP quarantine and critical incident alert when probed.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Add Trap Form */}
          <form onSubmit={handleAddTrap} className="p-3 rounded-xl bg-secondary/30 border border-primary/20 space-y-2.5">
            <div className="text-xs font-bold text-white">Deploy New Canary Honeypot Trap</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground block mb-1">
                  Trap Name / Decoy Type
                </label>
                <Input
                  placeholder="e.g. WordPress Admin Probe Trap"
                  value={trapName}
                  onChange={(e) => setTrapName(e.target.value)}
                  required
                  className="text-xs h-8"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-muted-foreground block mb-1">
                  Decoy Request URI / Path
                </label>
                <Input
                  placeholder="e.g. /wp-admin/phpinfo/ or /.env"
                  value={trapPath}
                  onChange={(e) => setTrapPath(e.target.value)}
                  required
                  className="text-xs font-mono h-8"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-muted-foreground block mb-1">
                  Enforcement Action
                </label>
                <select
                  value={trapAction}
                  onChange={(e: any) => setTrapAction(e.target.value)}
                  className="w-full h-8 rounded-lg border border-input bg-card/80 px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="IP_BANNED">IP_BANNED (24-Hour Instant Ban)</option>
                  <option value="CHALLENGE">CHALLENGE (JS Proof-of-Work)</option>
                  <option value="LOG">LOG ONLY (Silent Forensic Mode)</option>
                </select>
              </div>
            </div>

            <Button type="submit" variant="cyber" className="text-xs font-bold gap-1.5 h-7 px-3 mt-1">
              <Plus className="w-3 h-3" /> Deploy Canary Decoy
            </Button>
          </form>

          {/* Traps Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                <tr>
                  <th className="py-2 px-3">Decoy Trap Name</th>
                  <th className="py-2 px-3">Target Decoy URI</th>
                  <th className="py-2 px-3">Enforcement Action</th>
                  <th className="py-2 px-3">Attacker Hits</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {traps.map((trap) => (
                  <tr key={trap.id} className="hover:bg-accent/40 transition">
                    <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5 text-xs">
                      <Bug className="w-3 h-3 text-red-400" />
                      <span>{trap.name}</span>
                    </td>
                    <td className="py-2 px-3 font-mono text-sky-300">
                      <code className="bg-black/40 px-1.5 py-0.5 rounded text-[10px]">{trap.path}</code>
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant="destructive" className="text-[9px] py-0">
                        {trap.action}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-red-400 text-xs">{trap.hits} blocked</td>
                    <td className="py-2 px-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTrap(trap.id)}
                        className="text-destructive hover:bg-destructive/10 text-xs h-6 px-1.5"
                      >
                        <Trash2 className="w-3 h-3" />
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
