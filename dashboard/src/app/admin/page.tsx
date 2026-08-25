"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Shield,
  Zap,
  Power,
  Activity,
  Menu,
  X,
  Languages,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ConfirmDialog from "@/components/confirm-dialog";
import { translations, Language } from "@/lib/i18n";

// Modular Views
import SidebarNav, { NavSection } from "@/components/views/sidebar-nav";
import OverviewView from "@/components/views/overview-view";
import AnalyticsView from "@/components/views/analytics-view";
import SimulatorView from "@/components/views/simulator-view";
import LogsView from "@/components/views/logs-view";
import IpLookupView from "@/components/views/ip-lookup-view";
import BansView from "@/components/views/bans-view";
import WhitelistView from "@/components/views/whitelist-view";
import BlacklistView from "@/components/views/blacklist-view";
import GeoIpView from "@/components/views/geoip-view";
import CustomWafView from "@/components/views/custom-waf-view";
import WafSignaturesView from "@/components/views/waf-signatures-view";
import RateLimitsView from "@/components/views/rate-limits-view";
import UpstreamsView from "@/components/views/upstreams-view";
import SslView from "@/components/views/ssl-view";
import UsersView from "@/components/views/users-view";
import ProfileView from "@/components/views/profile-view";
import MaintenanceView from "@/components/views/maintenance-view";
import DiagnosticsModal from "@/components/views/diagnostics-modal";

// Dynamic Views for Heavy Graphics / Live SSE
const ThreatMap = dynamic(() => import("@/components/charts/cyber-threat-map"), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full flex items-center justify-center bg-secondary/10 rounded-xl border border-primary/20 animate-pulse">
      <span className="text-xs text-muted-foreground font-mono">Loading Threat Map Coordinates...</span>
    </div>
  ),
});

const PacketStream = dynamic(() => import("@/components/packet-inspector"), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full flex items-center justify-center bg-secondary/10 rounded-xl border border-primary/20 animate-pulse">
      <span className="text-xs text-muted-foreground font-mono">Connecting Real-Time Kernel Packet Stream...</span>
    </div>
  ),
});

const IncidentForensics = dynamic(() => import("@/components/incident-forensics"), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full flex items-center justify-center bg-secondary/10 rounded-xl border border-primary/20 animate-pulse">
      <span className="text-xs text-muted-foreground font-mono">Initializing SOC Forensics Engine...</span>
    </div>
  ),
});

export default function EnterpriseAdminDashboard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Localization & State
  const [lang, setLang] = useState<Language>("id");
  const t = translations[lang];

  const [stats, setStats] = useState({
    live_qps: 0,
    active_bans: 0,
    whitelist_count: 0,
    blacklist_count: 0,
    threats_total: 0,
    threats_breakdown: { bad_bot: 0, rate_limited: 0, geo_blocked: 0 },
    surge_mode: false,
  });

  const [currentNav, setCurrentNav] = useState<NavSection>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    monitoring: false,
    policies: false,
    edge: false,
    admin: false,
  });

  const toggleSection = (sec: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Data lists
  const [liveLogs, setLiveLogs] = useState<any[]>([]);
  const [bans, setBans] = useState<any[]>([]);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [blockedCountries, setBlockedCountries] = useState<string[]>([]);
  const [customWafRules, setCustomWafRules] = useState<any[]>([]);
  const [upstreams, setUpstreams] = useState<any[]>([]);
  const [sslDomains, setSslDomains] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);

  // IP Lookup & Diagnostics
  const [lookupTargetIp, setLookupTargetIp] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [diagModalOpen, setDiagModalOpen] = useState(false);
  const [health, setHealth] = useState<any>(null);

  // Simulator
  const [simRunning, setSimRunning] = useState(false);
  const [simVector, setSimVector] = useState("canary_trap");
  const [simIntensity, setSimIntensity] = useState(3);
  const [simPackets, setSimPackets] = useState<any[]>([]);

  // Feedback Toast & Confirm Dialog
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: "danger" | "primary" | "warning";
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    variant: "danger",
    confirmLabel: "Confirm",
    onConfirm: () => {},
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Polling Fetchers
  const refreshTelemetry = useCallback(async () => {
    try {
      const [resStats, resLogs, resHealth] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/logs?limit=20"),
        fetch("/api/health"),
      ]);

      if (resStats.ok) {
        const data = await resStats.json();
        setStats({
          live_qps: data.live_qps || 0,
          active_bans: data.active_bans || 0,
          whitelist_count: data.whitelist_count || 0,
          blacklist_count: data.blacklist_count || 0,
          threats_total: data.threats_total || 0,
          threats_breakdown: data.threats_breakdown || { bad_bot: 0, rate_limited: 0, geo_blocked: 0 },
          surge_mode: Boolean(data.surge_mode),
        });
      }

      if (resLogs.ok) {
        const data = await resLogs.json();
        setLiveLogs(data.logs || []);
      }

      if (resHealth.ok) {
        const data = await resHealth.json();
        setHealth(data);
      }
    } catch {
      // Ignore network hiccup
    }
  }, []);

  const refreshPolicies = useCallback(async () => {
    try {
      const [resBans, resWl, resBl, resGeo, resWaf, resUps, resSsl, resUsers, resProf] = await Promise.all([
        fetch("/api/bans"),
        fetch("/api/whitelist"),
        fetch("/api/blacklist"),
        fetch("/api/geoip"),
        fetch("/api/waf/custom-rules"),
        fetch("/api/upstreams"),
        fetch("/api/ssl"),
        fetch("/api/users"),
        fetch("/api/profile"),
      ]);

      if (resBans.ok) {
        const d = await resBans.json();
        setBans(d.bans || []);
      }
      if (resWl.ok) {
        const d = await resWl.json();
        setWhitelist(d.whitelist || []);
      }
      if (resBl.ok) {
        const d = await resBl.json();
        setBlacklist(d.blacklist || []);
      }
      if (resGeo.ok) {
        const d = await resGeo.json();
        setBlockedCountries(d.blocked_countries || []);
      }
      if (resWaf.ok) {
        const d = await resWaf.json();
        setCustomWafRules(d.rules || []);
      }
      if (resUps.ok) {
        const d = await resUps.json();
        setUpstreams(d.upstreams || []);
      }
      if (resSsl.ok) {
        const d = await resSsl.json();
        setSslDomains(d.domains || []);
      }
      if (resUsers.ok) {
        const d = await resUsers.json();
        setAdminUsers(d.users || []);
      }
      if (resProf.ok) {
        const d = await resProf.json();
        setProfileData(d);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    refreshTelemetry();
    refreshPolicies();
    const interval = setInterval(refreshTelemetry, 2500);
    return () => clearInterval(interval);
  }, [refreshTelemetry, refreshPolicies]);

  // Action Handlers
  const handleToggleUnderAttack = async () => {
    try {
      const nextMode = !stats.surge_mode;
      const res = await fetch("/api/toggle-attack-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextMode }),
      });
      if (res.ok) {
        setStats((prev) => ({ ...prev, surge_mode: nextMode }));
        showToast(nextMode ? "EMERGENCY UNDER ATTACK MODE ACTIVATED" : "Under Attack Mode Disengaged");
      }
    } catch {
      showToast("Failed to toggle attack mode");
    }
  };

  const handleManualBan = async (ip: string, duration: number, reason: string) => {
    try {
      const res = await fetch("/api/bans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, duration, reason }),
      });
      if (res.ok) {
        showToast(`IP ${ip} quarantined successfully`);
        refreshPolicies();
      }
    } catch {
      showToast("Failed to ban IP");
    }
  };

  const handleUnban = (ip: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Pardon & Unban IP",
      message: `Are you sure you want to completely unban and pardon IP ${ip}? All active violation tokens and canary blacklists will be cleared.`,
      variant: "primary",
      confirmLabel: "Unban & Pardon",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/bans?ip=${encodeURIComponent(ip)}`, { method: "DELETE" });
          if (res.ok) {
            showToast(`IP ${ip} has been pardoned and unbanned`);
            refreshPolicies();
            if (lookupResult && lookupResult.ip === ip) {
              handleExecuteLookup(ip);
            }
          }
        } catch {
          showToast("Failed to unban IP");
        }
      },
    });
  };

  const handleAddWhitelist = async (ip: string) => {
    try {
      const res = await fetch("/api/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
      });
      if (res.ok) {
        showToast(`IP ${ip} added to Whitelist`);
        refreshPolicies();
      }
    } catch {
      showToast("Failed to whitelist IP");
    }
  };

  const handleRemoveWhitelist = async (ip: string) => {
    try {
      const res = await fetch(`/api/whitelist?ip=${encodeURIComponent(ip)}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`IP ${ip} removed from Whitelist`);
        refreshPolicies();
      }
    } catch {
      showToast("Failed to remove whitelist IP");
    }
  };

  const handleAddBlacklist = async (ip: string) => {
    try {
      const res = await fetch("/api/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
      });
      if (res.ok) {
        showToast(`IP ${ip} permanently blacklisted`);
        refreshPolicies();
      }
    } catch {
      showToast("Failed to blacklist IP");
    }
  };

  const handleRemoveBlacklist = async (ip: string) => {
    try {
      const res = await fetch(`/api/blacklist?ip=${encodeURIComponent(ip)}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`IP ${ip} removed from Blacklist`);
        refreshPolicies();
      }
    } catch {
      showToast("Failed to remove blacklist IP");
    }
  };

  const handleAddCountry = async (code: string) => {
    try {
      const res = await fetch("/api/geoip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: code }),
      });
      if (res.ok) {
        showToast(`Country ${code} blocked successfully`);
        refreshPolicies();
      }
    } catch {
      showToast("Failed to block country");
    }
  };

  const handleRemoveCountry = async (code: string) => {
    try {
      const res = await fetch(`/api/geoip?country=${encodeURIComponent(code)}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`Country ${code} unblocked`);
        refreshPolicies();
      }
    } catch {
      showToast("Failed to unblock country");
    }
  };

  const handleAddWafRule = async (rule: any) => {
    try {
      const res = await fetch("/api/waf/custom-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule),
      });
      if (res.ok) {
        showToast("Custom WAF Rule deployed");
        refreshPolicies();
      }
    } catch {
      showToast("Failed to deploy WAF rule");
    }
  };

  const handleDeleteWafRule = async (id: string) => {
    try {
      const res = await fetch(`/api/waf/custom-rules?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Custom WAF Rule deleted");
        refreshPolicies();
      }
    } catch {
      showToast("Failed to delete WAF rule");
    }
  };

  const handleAddUpstream = async (target: string, port: number, weight: number) => {
    try {
      const res = await fetch("/api/upstreams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, port, weight }),
      });
      if (res.ok) {
        showToast("Upstream proxy server added");
        refreshPolicies();
      }
    } catch {
      showToast("Failed to add upstream");
    }
  };

  const handleDeleteUpstream = async (id: string) => {
    try {
      const res = await fetch(`/api/upstreams?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Upstream proxy server removed");
        refreshPolicies();
      }
    } catch {
      showToast("Failed to remove upstream");
    }
  };

  const handleAddDomain = async (domain: string, issuer: string) => {
    try {
      const res = await fetch("/api/ssl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, issuer }),
      });
      if (res.ok) {
        showToast(`Domain ${domain} configured`);
        refreshPolicies();
      }
    } catch {
      showToast("Failed to add domain");
    }
  };

  const handleDeleteDomain = async (id: string) => {
    try {
      const res = await fetch(`/api/ssl?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Domain removed from SSL policy");
        refreshPolicies();
      }
    } catch {
      showToast("Failed to remove domain");
    }
  };

  const handleToggleSslFlag = async (id: string, flag: "force_https" | "hsts" | "tls13_strict") => {
    try {
      const res = await fetch("/api/ssl", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, flag }),
      });
      if (res.ok) {
        showToast("SSL security flag updated");
        refreshPolicies();
      }
    } catch {
      showToast("Failed to update SSL flag");
    }
  };

  const handleIssueLetsEncrypt = async (domainName: string) => {
    showToast(`Requesting Let's Encrypt SSL certificate for ${domainName}...`);
    try {
      const res = await fetch("/api/ssl/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainName }),
      });
      const data = await res.json();
      if (res.ok && data.status === "ok") {
        showToast(`✅ Let's Encrypt SSL certificate active for ${domainName}!`);
        refreshPolicies();
      } else {
        showToast(`⚠️ SSL Issue notice: ${data.message || "Ready in certbot directory"}`);
      }
    } catch {
      showToast("Error requesting Let's Encrypt SSL");
    }
  };

  const handleAddUser = async (username: string, email: string, role: string, pass: string) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, role, password: pass }),
      });
      if (res.ok) {
        showToast(`Admin user ${username} registered`);
        refreshPolicies();
      }
    } catch {
      showToast("Failed to add user");
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        showToast("User account deleted");
        refreshPolicies();
      }
    } catch {
      showToast("Failed to delete user");
    }
  };

  const handleRegenApiKey = async () => {
    try {
      const res = await fetch("/api/profile/regen-key", { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        setProfileData((prev: any) => ({ ...prev, api_key: d.api_key }));
        showToast("New Master API Key generated");
      }
    } catch {
      showToast("Failed to regenerate key");
    }
  };

  const handleFlushState = async () => {
    setConfirmDialog({
      isOpen: true,
      title: "Flush Transient Redis Cache",
      message: "Are you sure you want to flush temporary rate limit buckets and packet buffers?",
      variant: "danger",
      confirmLabel: "Flush Cache",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/maintenance/flush-state", { method: "POST" });
          if (res.ok) {
            showToast("Redis transient cache flushed successfully");
            refreshTelemetry();
          }
        } catch {
          showToast("Failed to flush state");
        }
      },
    });
  };

  const handleExecuteLookup = async (ipTarget?: string) => {
    const ip = ipTarget || lookupTargetIp;
    if (!ip) return;
    setLookupLoading(true);
    try {
      const res = await fetch(`/api/ip-lookup?ip=${encodeURIComponent(ip)}`);
      if (res.ok) {
        const data = await res.json();
        setLookupResult(data);
      } else {
        showToast("IP not found or invalid format");
      }
    } catch {
      showToast("Lookup request failed");
    } finally {
      setLookupLoading(false);
    }
  };

  // Simulator
  const handleStartSim = async () => {
    setSimRunning(true);
    showToast(`Simulating ${simVector} attack at ${simIntensity * 50} QPS`);
    try {
      const res = await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vector: simVector, intensity: simIntensity }),
      });
      if (res.ok) {
        const data = await res.json();
        setSimPackets(data.packets || []);
      }
    } catch {
      //
    }
  };

  const handleStopSim = () => {
    setSimRunning(false);
    showToast("Simulation stopped");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-[99999] bg-primary text-primary-foreground font-mono text-xs px-4 py-2.5 rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMsg}
        </div>
      )}

      {/* Global Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Terminus Diagnostics Modal */}
      <DiagnosticsModal
        isOpen={diagModalOpen}
        onClose={() => setDiagModalOpen(false)}
        health={health}
        t={t}
      />

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 border-r border-border/80 bg-card/40 flex-shrink-0 flex flex-col justify-between hidden md:flex">
        <div className="overflow-y-auto">
          {/* Logo & Brand Header */}
          <div className="p-4 border-b border-border/80 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/30 text-primary">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-sm tracking-wider text-white uppercase">{t.brandTitle}</div>
              <div className="text-[10px] font-mono text-primary font-bold">{t.brandSubtitle}</div>
            </div>
          </div>

          <SidebarNav
            currentNav={currentNav}
            onSelectNav={setCurrentNav}
            t={t}
            collapsedSections={collapsedSections}
            onToggleSection={toggleSection}
            counts={{
              forensics: 0,
              logs: liveLogs.length,
              bans: bans.length,
              whitelist: whitelist.length,
              blacklist: blacklist.length,
              blockedCountries: blockedCountries.length,
              customWafRules: customWafRules.length,
              upstreams: upstreams.length,
              sslDomains: sslDomains.length,
              adminUsers: adminUsers.length,
            }}
          />
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-border/80 space-y-2">
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLang(lang === "en" ? "id" : "en")}
              className="text-[11px] h-7 gap-1.5 border-border/80 text-muted-foreground hover:text-white"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{lang === "en" ? "ID" : "EN"}</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleLogout}
              className="text-[11px] h-7 text-destructive hover:bg-destructive/10 gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.logout}</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-14 border-b border-border/80 bg-card/60 px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden h-8 w-8 text-muted-foreground"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>

            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="text-white">{t.dashboardBreadcrumb}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-primary uppercase">{currentNav.replace("_", " ")}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              variant={stats.surge_mode ? "destructive" : "outline"}
              onClick={handleToggleUnderAttack}
              className="text-[11px] font-bold h-7 gap-1.5"
            >
              <Power className="w-3 h-3" />
              <span>{stats.surge_mode ? t.underAttackOn : t.underAttackOff}</span>
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDiagModalOpen(true)}
              className="text-[11px] font-mono h-7 gap-1.5"
            >
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>{t.terminusHealthy}</span>
            </Button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border/80 bg-card p-4 space-y-4">
            <SidebarNav
              currentNav={currentNav}
              onSelectNav={(n) => {
                setCurrentNav(n);
                setMobileMenuOpen(false);
              }}
              t={t}
              collapsedSections={collapsedSections}
              onToggleSection={toggleSection}
              counts={{
                forensics: 0,
                logs: liveLogs.length,
                bans: bans.length,
                whitelist: whitelist.length,
                blacklist: blacklist.length,
                blockedCountries: blockedCountries.length,
                customWafRules: customWafRules.length,
                upstreams: upstreams.length,
                sslDomains: sslDomains.length,
                adminUsers: adminUsers.length,
              }}
            />
          </div>
        )}

        {/* Dynamic Route View Containers */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          {currentNav === "overview" && (
            <OverviewView
              stats={stats}
              t={t}
              liveLogs={liveLogs}
              onSelectNav={setCurrentNav}
            />
          )}

          {currentNav === "threat_map" && <ThreatMap />}
          {currentNav === "packet_stream" && <PacketStream />}
          {currentNav === "forensics" && <IncidentForensics />}
          {currentNav === "analytics" && <AnalyticsView stats={stats} />}

          {currentNav === "simulator" && (
            <SimulatorView
              t={t}
              simRunning={simRunning}
              simVector={simVector}
              setSimVector={setSimVector}
              simIntensity={simIntensity}
              setSimIntensity={setSimIntensity}
              onStartSim={handleStartSim}
              onStopSim={handleStopSim}
              simPackets={simPackets}
            />
          )}

          {currentNav === "logs" && <LogsView t={t} liveLogs={liveLogs} />}

          {currentNav === "lookup" && (
            <IpLookupView
              t={t}
              lookupTargetIp={lookupTargetIp}
              setLookupTargetIp={setLookupTargetIp}
              lookupLoading={lookupLoading}
              lookupResult={lookupResult}
              onExecuteLookup={handleExecuteLookup}
              onQuickBan={(ip) => handleManualBan(ip, 600, "10-Min Quick Ban")}
              onQuickUnban={handleUnban}
              onAddBlacklist={handleAddBlacklist}
            />
          )}

          {currentNav === "bans" && (
            <BansView
              t={t}
              bans={bans}
              onManualBan={handleManualBan}
              onUnban={handleUnban}
            />
          )}

          {currentNav === "whitelist" && (
            <WhitelistView
              t={t}
              whitelist={whitelist}
              onAddWhitelist={handleAddWhitelist}
              onRemoveWhitelist={handleRemoveWhitelist}
            />
          )}

          {currentNav === "blacklist" && (
            <BlacklistView
              t={t}
              blacklist={blacklist}
              onAddBlacklist={handleAddBlacklist}
              onRemoveBlacklist={handleRemoveBlacklist}
            />
          )}

          {currentNav === "geoip" && (
            <GeoIpView
              t={t}
              blockedCountries={blockedCountries}
              onAddCountry={handleAddCountry}
              onRemoveCountry={handleRemoveCountry}
            />
          )}

          {currentNav === "custom_waf" && (
            <CustomWafView
              t={t}
              customWafRules={customWafRules}
              onAddRule={handleAddWafRule}
              onDeleteRule={handleDeleteWafRule}
            />
          )}

          {currentNav === "waf" && <WafSignaturesView t={t} />}
          {currentNav === "ratelimits" && <RateLimitsView t={t} />}

          {currentNav === "upstreams" && (
            <UpstreamsView
              t={t}
              upstreams={upstreams}
              onAddUpstream={handleAddUpstream}
              onDeleteUpstream={handleDeleteUpstream}
            />
          )}

          {currentNav === "ssl" && (
            <SslView
              t={t}
              sslDomains={sslDomains}
              onAddDomain={handleAddDomain}
              onDeleteDomain={handleDeleteDomain}
              onToggleSslFlag={handleToggleSslFlag}
              onIssueLetsEncrypt={handleIssueLetsEncrypt}
            />
          )}

          {currentNav === "users" && (
            <UsersView
              t={t}
              adminUsers={adminUsers}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {currentNav === "profile" && (
            <ProfileView
              t={t}
              profileData={profileData}
              onRegenApiKey={handleRegenApiKey}
            />
          )}

          {currentNav === "maintenance" && (
            <MaintenanceView
              t={t}
              onFlushState={handleFlushState}
              onToggleUnderAttack={handleToggleUnderAttack}
              underAttackMode={stats.surge_mode}
            />
          )}
        </div>
      </main>
    </div>
  );
}
