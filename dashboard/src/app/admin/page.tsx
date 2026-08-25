"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  Server,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Radio,
  HardDrive,
  Cpu,
  Network,
  Ban,
  RadioTower,
  Globe,
  Download,
  LogOut,
  RefreshCw,
  Power,
  RotateCcw,
  Sliders,
  FileCode2,
  ExternalLink,
  Flame,
  LayoutDashboard,
  Shield,
  Gauge,
  Settings,
  ChevronRight,
  ChevronDown,
  UserCheck,
  PieChart,
  Fingerprint,
  Users,
  Wrench,
  User,
  Key,
  Copy,
  AlertOctagon,
  Eye,
  EyeOff,
  Menu,
  X,
  Crosshair,
  ServerCrash,
  Send,
  Layers,
  MapPin,
  Terminal,
  Bug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { translations, Language } from "@/lib/i18n";
import ConfirmDialog from "@/components/confirm-dialog";

// Modular Views
import SidebarNav from "@/components/views/sidebar-nav";
import OverviewView from "@/components/views/overview-view";
import AnalyticsView from "@/components/views/analytics-view";
import SimulatorView from "@/components/views/simulator-view";
import CustomWafView from "@/components/views/custom-waf-view";
import UpstreamsView from "@/components/views/upstreams-view";
import SslView from "@/components/views/ssl-view";
import IpLookupView from "@/components/views/ip-lookup-view";
import UsersView from "@/components/views/users-view";
import ProfileView from "@/components/views/profile-view";
import BansView from "@/components/views/bans-view";
import WhitelistView from "@/components/views/whitelist-view";
import BlacklistView from "@/components/views/blacklist-view";
import GeoIpView from "@/components/views/geoip-view";
import WafSignaturesView from "@/components/views/waf-signatures-view";
import RateLimitsView from "@/components/views/rate-limits-view";
import LogsView from "@/components/views/logs-view";
import MaintenanceView from "@/components/views/maintenance-view";
import DiagnosticsModal from "@/components/views/diagnostics-modal";

// Async Lazy-Loaded Visual Modules with Zero Main-Thread Blocking
const TelemetryChart = dynamic(() => import("@/components/charts/telemetry-chart"), {
  ssr: false,
  loading: () => (
    <div className="h-56 w-full flex items-center justify-center bg-secondary/10 rounded-xl border border-primary/10">
      <span className="text-xs text-muted-foreground font-mono">Loading telemetry canvas...</span>
    </div>
  ),
});

const ThreatVectorChart = dynamic(
  () => import("@/components/charts/analytics-charts").then((m) => m.ThreatVectorChart),
  {
    ssr: false,
    loading: () => <div className="h-56 w-56 bg-secondary/20 rounded-full animate-pulse mx-auto" />,
  }
);

const TopCountriesChart = dynamic(
  () => import("@/components/charts/analytics-charts").then((m) => m.TopCountriesChart),
  {
    ssr: false,
    loading: () => <div className="h-56 w-full bg-secondary/20 rounded-xl animate-pulse" />,
  }
);

const CyberThreatMap = dynamic(() => import("@/components/charts/cyber-threat-map"), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full flex items-center justify-center bg-secondary/10 rounded-2xl border border-primary/20 animate-pulse">
      <span className="text-xs text-muted-foreground font-mono">Initializing Cyber Threat Map Canvas...</span>
    </div>
  ),
});

const IncidentForensics = dynamic(() => import("@/components/incident-forensics"), { ssr: false, loading: () => <div className="h-80 w-full flex items-center justify-center bg-secondary/10 rounded-2xl border border-primary/20 animate-pulse"><span className="text-xs text-muted-foreground font-mono">Loading Incident Forensics SOC Canvas...</span></div> });

const PacketInspector = dynamic(() => import("@/components/packet-inspector"), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full flex items-center justify-center bg-secondary/10 rounded-2xl border border-primary/20 animate-pulse">
      <span className="text-xs text-muted-foreground font-mono">Connecting to Live Packet Stream...</span>
    </div>
  ),
});

interface HealthData {
  status: "ok" | "error";
  timestamp: string;
  total_check_time_ms: number;
  info: {
    redis?: { status: string; latency_ms?: number };
    gateway?: { status: string; response_time_ms?: number };
    memory_heap?: { status: string; used_mb?: number; allocated_mb?: number };
    memory_rss?: { status: string; used_mb?: number };
  };
}

interface BanItem {
  ip: string;
  remaining_ttl: number;
  reason: string;
}

interface LogEvent {
  id: string;
  time: number;
  time_formatted?: string;
  client_ip: string;
  event: string;
  reason?: string;
  uri?: string;
}

interface IpLookupResult {
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

interface AdminUserItem {
  id: string;
  username: string;
  role: "super_admin" | "security_analyst" | "auditor";
  created_at: string;
}

interface CustomWafRule {
  id: string;
  name: string;
  field: "uri" | "user_agent" | "header" | "query";
  operator: "contains" | "equals" | "regex";
  value: string;
  action: "DROP" | "CHALLENGE" | "LOG";
  enabled: boolean;
  created_at: string;
}

interface UpstreamServer {
  id: string;
  host: string;
  port: number;
  protocol: "http" | "https";
  weight: number;
  status: "healthy" | "degraded" | "down";
  latency_ms: number;
  last_checked: string;
}

interface SslDomain {
  id: string;
  domain: string;
  issuer: "letsencrypt" | "custom";
  force_https: boolean;
  hsts: boolean;
  tls13_strict: boolean;
  expires_at: string;
  days_remaining: number;
  status: "active" | "pending";
}

interface SimulationReport {
  vector: string;
  total_packets: number;
  packets_blocked: number;
  packets_allowed: number;
  deflection_rate: string;
  elapsed_time_ms: number;
  avg_packet_latency_ms: string;
  mitigation_reason: string;
  timestamp: string;
}

type NavSection =
  | "overview"
  | "threat_map"
  | "packet_stream"
  | "forensics"
  | "analytics"
  | "simulator"
  | "bans"
  | "whitelist"
  | "blacklist"
  | "geoip"
  | "lookup"
  | "waf"
  | "custom_waf"
  | "ratelimits"
  | "upstreams"
  | "ssl"
  | "users"
  | "profile"
  | "logs"
  | "maintenance";

export default function EnterpriseAdminDashboard() {
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

  const [underAttackMode, setUnderAttackMode] = useState(false);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [bans, setBans] = useState<BanItem[]>([]);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [blockedCountries, setBlockedCountries] = useState<string[]>([]);
  const [liveLogs, setLiveLogs] = useState<LogEvent[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>([]);
  const [customWafRules, setCustomWafRules] = useState<CustomWafRule[]>([]);
  const [upstreams, setUpstreams] = useState<UpstreamServer[]>([]);
  const [lbAlgorithm, setLbAlgorithm] = useState("round_robin");
  const [sslDomains, setSslDomains] = useState<SslDomain[]>([]);

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
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
    setConfirmDialog({
      isOpen: true,
      title: opts.title || t.confirmTitle,
      message: opts.message || t.confirmMsgDefault,
      variant: opts.variant || "warning",
      onConfirm: () => {
        opts.onConfirm();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Simulator State
  const [simVector, setSimVector] = useState("canary_trap");
  const [simIntensity, setSimIntensity] = useState("50");
  const [simRunning, setSimRunning] = useState(false);
  const [simReport, setSimReport] = useState<SimulationReport | null>(null);

  // Forms
  const [searchFilter, setSearchFilter] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [banIp, setBanIp] = useState("");
  const [banDuration, setBanDuration] = useState("900");
  const [whitelistIp, setWhitelistIp] = useState("");
  const [blacklistIp, setBlacklistIp] = useState("");
  const [newCountryCode, setNewCountryCode] = useState("");
  const [rateLimitGeneral, setRateLimitGeneral] = useState("20");
  const [rateLimitBurst, setRateLimitBurst] = useState("50");

  // Custom WAF Form
  const [ruleName, setRuleName] = useState("");
  const [ruleField, setRuleField] = useState<"uri" | "user_agent" | "header" | "query">("uri");
  const [ruleOp, setRuleOp] = useState<"contains" | "equals" | "regex">("contains");
  const [ruleVal, setRuleVal] = useState("");
  const [ruleAction, setRuleAction] = useState<"DROP" | "CHALLENGE" | "LOG">("DROP");

  // Upstream Form
  const [newUpsHost, setNewUpsHost] = useState("");
  const [newUpsPort, setNewUpsPort] = useState("80");
  const [newUpsProtocol, setNewUpsProtocol] = useState<"http" | "https">("http");
  const [newUpsWeight, setNewUpsWeight] = useState("1");

  // SSL Form
  const [newDomain, setNewDomain] = useState("");
  const [newIssuer, setNewIssuer] = useState<"letsencrypt" | "custom">("letsencrypt");

  // User Management State
  const [newUsername, setNewUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"super_admin" | "security_analyst" | "auditor">("security_analyst");

  // Profile & Password State
  const [profileApiKey, setProfileApiKey] = useState("fw_live_981a03f49b12048d89");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  // IP Lookup State
  const [lookupTargetIp, setLookupTargetIp] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<IpLookupResult | null>(null);

  // Lightweight Telemetry Data Points
  const [chartLabels, setChartLabels] = useState<string[]>(() => [
    "00:00", "00:01", "00:02", "00:03", "00:04", "00:05", "00:06", "00:07", "00:08", "00:09",
    "00:10", "00:11", "00:12", "00:13", "00:14", "00:15", "00:16", "00:17", "00:18", "00:19"
  ]);
  const [chartPoints, setChartPoints] = useState<number[]>(() => Array(20).fill(0));

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem("fluxwall_lang") as Language;
    if (savedLang === "en" || savedLang === "id") {
      setLang(savedLang);
    }
  }, []);

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("fluxwall_lang", newLang);
    showToast(newLang === "id" ? "Bahasa diubah ke Bahasa Indonesia" : "Language switched to English");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Unified Stats Polling
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats", { cache: "no-store" });
      const json = await res.json();
      if (json.status === "success") {
        setStats(json.data);
        const timeLabel = new Date().toLocaleTimeString();
        const actualQps = json.data.live_qps ?? 0;

        setChartLabels((prev) => [...prev.slice(1), timeLabel]);
        setChartPoints((prev) => [...prev.slice(1), actualQps]);
      }
    } catch {}
  }, []);

  const fetchAttackMode = async () => {
    try {
      const res = await fetch("/api/toggle-attack-mode", { cache: "no-store" });
      const json = await res.json();
      setUnderAttackMode(json.enabled);
    } catch {}
  };

  const toggleUnderAttackMode = () => {
    openConfirm({
      title: t.confirmTitle,
      message: t.confirmAttackMode,
      variant: "warning",
      onConfirm: async () => {
        const nextState = !underAttackMode;
        try {
          const res = await fetch("/api/toggle-attack-mode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enabled: nextState }),
          });
          if (res.ok) {
            setUnderAttackMode(nextState);
            showToast(
              nextState
                ? lang === "id"
                  ? "🛡️ Mode Under Attack DIAKTIFKAN!"
                  : "🛡️ Under Attack Mode ACTIVATED!"
                : lang === "id"
                ? "Mode Under Attack dinonaktifkan."
                : "Under Attack Mode deactivated."
            );
          }
        } catch (e: any) {
          showToast(`Error: ${e.message}`);
        }
      },
    });
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs", { cache: "no-store" });
      const json = await res.json();
      if (json.status === "success") {
        setLiveLogs(json.logs || []);
      }
    } catch {}
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      setHealth(data);
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const json = await res.json();
      if (json.status === "success") {
        setAdminUsers(json.users || []);
      }
    } catch {}
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      const json = await res.json();
      if (json.status === "success") {
        setProfileApiKey(json.profile.api_key);
      }
    } catch {}
  };

  const fetchCustomWafRules = async () => {
    try {
      const res = await fetch("/api/waf/custom-rules", { cache: "no-store" });
      const json = await res.json();
      if (json.status === "success") {
        setCustomWafRules(json.rules || []);
      }
    } catch {}
  };

  const fetchUpstreams = async () => {
    try {
      const res = await fetch("/api/upstreams", { cache: "no-store" });
      const json = await res.json();
      if (json.status === "success") {
        setUpstreams(json.upstreams || []);
        if (json.algorithm) setLbAlgorithm(json.algorithm);
      }
    } catch {}
  };

  const fetchSslDomains = async () => {
    try {
      const res = await fetch("/api/ssl", { cache: "no-store" });
      const json = await res.json();
      if (json.status === "success") {
        setSslDomains(json.domains || []);
      }
    } catch {}
  };

  const fetchNavData = useCallback(async () => {
    try {
      if (currentNav === "overview" || currentNav === "bans") {
        const res = await fetch("/api/bans");
        const json = await res.json();
        setBans(json.bans || []);
      }
      if (currentNav === "overview" || currentNav === "whitelist") {
        const res = await fetch("/api/whitelist");
        const json = await res.json();
        setWhitelist(json.whitelist || []);
      }
      if (currentNav === "overview" || currentNav === "blacklist") {
        const res = await fetch("/api/blacklist");
        const json = await res.json();
        setBlacklist(json.blacklist || []);
      }
      if (currentNav === "overview" || currentNav === "geoip" || currentNav === "analytics") {
        const res = await fetch("/api/geoip");
        const json = await res.json();
        setBlockedCountries(json.blocked || []);
      }
      if (currentNav === "overview" || currentNav === "logs" || currentNav === "analytics") {
        fetchLogs();
      }
      if (currentNav === "custom_waf" || currentNav === "waf") {
        fetchCustomWafRules();
      }
      if (currentNav === "upstreams") {
        fetchUpstreams();
      }
      if (currentNav === "ssl") {
        fetchSslDomains();
      }
      if (currentNav === "users") {
        fetchUsers();
      }
      if (currentNav === "profile") {
        fetchProfile();
      }
    } catch {}
  }, [currentNav]);

  useEffect(() => {
    fetchStats();
    fetchAttackMode();
    fetchNavData();

    // 4s Non-blocking Polling
    const interval = setInterval(() => {
      fetchStats();
      if (currentNav === "overview" || currentNav === "logs" || currentNav === "analytics") {
        fetchLogs();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentNav, fetchStats, fetchNavData]);

  // Actions
  const handleLogout = () => {
    openConfirm({
      title: t.logout,
      message: t.confirmLogout,
      variant: "danger",
      onConfirm: async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
      },
    });
  };

  const handleLaunchSimulation = () => {
    openConfirm({
      title: t.simTitle,
      message: `${lang === "id" ? "Luncurkan simulasi serangan" : "Launch attack simulation for vector"}: ${simVector} (${simIntensity} requests)?`,
      variant: "primary",
      onConfirm: async () => {
        setSimRunning(true);
        try {
          const res = await fetch("/api/simulator", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vector: simVector, intensity: simIntensity }),
          });
          const data = await res.json();
          if (data.status === "success") {
            setSimReport(data.report);
            showToast(
              lang === "id"
                ? `⚡ Simulasi selesai! ${data.report.packets_blocked} paket berhasil ditepis (${data.report.deflection_rate})`
                : `⚡ Simulation complete! ${data.report.packets_blocked} packets deflected (${data.report.deflection_rate})`
            );
            fetchStats();
            fetchLogs();
          }
        } catch (err: any) {
          showToast(`Simulation Error: ${err.message}`);
        } finally {
          setSimRunning(false);
        }
      },
    });
  };

  const handleCreateCustomRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName || !ruleVal) return;
    try {
      const res = await fetch("/api/waf/custom-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ruleName,
          field: ruleField,
          operator: ruleOp,
          value: ruleVal,
          action: ruleAction,
          enabled: true,
        }),
      });
      const json = await res.json();
      if (json.status === "success") {
        showToast(`WAF Rule "${ruleName}" deployed!`);
        setRuleName("");
        setRuleVal("");
        fetchCustomWafRules();
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleDeleteCustomRule = (id: string) => {
    openConfirm({
      title: t.customWafTitle,
      message: t.confirmDeleteRule,
      variant: "danger",
      onConfirm: async () => {
        try {
          await fetch(`/api/waf/custom-rules?id=${encodeURIComponent(id)}`, { method: "DELETE" });
          showToast("WAF Rule deleted");
          fetchCustomWafRules();
        } catch (err: any) {
          showToast(`Error: ${err.message}`);
        }
      },
    });
  };

  const handleAddUpstream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpsHost || !newUpsPort) return;
    try {
      const res = await fetch("/api/upstreams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: newUpsHost,
          port: newUpsPort,
          protocol: newUpsProtocol,
          weight: newUpsWeight,
        }),
      });
      const json = await res.json();
      if (json.status === "success") {
        showToast(`Upstream ${newUpsHost}:${newUpsPort} added!`);
        setNewUpsHost("");
        fetchUpstreams();
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleDeleteUpstream = (id: string) => {
    openConfirm({
      title: t.upstreamTitle,
      message: t.confirmDeleteUpstream,
      variant: "danger",
      onConfirm: async () => {
        try {
          await fetch(`/api/upstreams?id=${encodeURIComponent(id)}`, { method: "DELETE" });
          showToast("Upstream removed");
          fetchUpstreams();
        } catch (err: any) {
          showToast(`Error: ${err.message}`);
        }
      },
    });
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;
    try {
      const res = await fetch("/api/ssl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: newDomain,
          issuer: newIssuer,
        }),
      });
      const json = await res.json();
      if (json.status === "success") {
        showToast(`Domain ${newDomain} protected with SSL!`);
        setNewDomain("");
        fetchSslDomains();
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

    const handleIssueLetsEncrypt = async (domainName: string) => {
    try {
      showToast(`Initiating Zero-Touch Let's Encrypt ACME verification for ${domainName}...`);
      const res = await fetch("/api/ssl/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainName }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast(`Let's Encrypt SSL Certificate successfully provisioned for ${domainName}!`);
        fetchSslDomains();
      } else {
        showToast(data.error || "Failed to provision Let's Encrypt SSL");
      }
    } catch {
      showToast("Network error provisioning SSL");
    }
  };

  const handleToggleSslFlag = (id: string, flag: "force_https" | "hsts" | "tls13_strict") => {
    openConfirm({
      title: t.sslTitle,
      message: `${lang === "id" ? "Ubah pengaturan flag keamanan" : "Toggle SSL security flag"}: ${flag}?`,
      variant: "warning",
      onConfirm: async () => {
        try {
          await fetch("/api/ssl", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "toggle_flag", id, flag }),
          });
          showToast("Security flag updated!");
          fetchSslDomains();
        } catch (err: any) {
          showToast(`Error: ${err.message}`);
        }
      },
    });
  };

  const handleDeleteDomain = (id: string) => {
    openConfirm({
      title: t.sslTitle,
      message: t.confirmDeleteDomain,
      variant: "danger",
      onConfirm: async () => {
        try {
          await fetch(`/api/ssl?id=${encodeURIComponent(id)}`, { method: "DELETE" });
          showToast("Domain removed");
          fetchSslDomains();
        } catch (err: any) {
          showToast(`Error: ${err.message}`);
        }
      },
    });
  };

  const handleUnban = (ip: string) => {
    openConfirm({
      title: t.navBans,
      message: `${t.confirmUnban} (${ip})`,
      variant: "warning",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/bans?ip=${encodeURIComponent(ip)}`, { method: "DELETE" });
          const json = await res.json();
          if (json.status === "success") {
            showToast(`IP ${ip} unbanned!`);
            fetchNavData();
            fetchStats();
          }
        } catch (e: any) {
          showToast(`Error: ${e.message}`);
        }
      },
    });
  };

  const handleManualBan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!banIp) return;
    openConfirm({
      title: t.quickBanTitle,
      message: `${t.confirmBan} (${banIp}) for ${banDuration}s?`,
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/bans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ip: banIp, duration_sec: parseInt(banDuration, 10) }),
          });
          const json = await res.json();
          if (json.status === "success") {
            showToast(`IP ${banIp} quarantined for ${banDuration}s`);
            setBanIp("");
            fetchNavData();
            fetchStats();
          }
        } catch (e: any) {
          showToast(`Error: ${e.message}`);
        }
      },
    });
  };

  const handleExecuteLookup = async (overrideIp?: string) => {
    const ip = overrideIp || lookupTargetIp;
    if (!ip.trim()) return;
    setLookupLoading(true);
    try {
      const res = await fetch(`/api/ip-lookup?ip=${encodeURIComponent(ip.trim())}`);
      const data = await res.json();
      if (data.status === "success") {
        setLookupResult(data);
      } else {
        showToast(data.error || "Failed to lookup IP intelligence");
      }
    } catch (err: any) {
      showToast(`Lookup Error: ${err.message}`);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newUserPassword) return;
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, password: newUserPassword, role: newUserRole }),
      });
      const json = await res.json();
      if (json.status === "success") {
        showToast(`User ${newUsername} created!`);
        setNewUsername("");
        setNewUserPassword("");
        fetchUsers();
      } else {
        showToast(json.error || "Failed to create user");
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleDeleteUser = (username: string) => {
    openConfirm({
      title: t.usersTitle,
      message: `${t.confirmDeleteUser} (${username})?`,
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/users?username=${encodeURIComponent(username)}`, { method: "DELETE" });
          const json = await res.json();
          if (json.status === "success") {
            showToast(`User ${username} deleted`);
            fetchUsers();
          } else {
            showToast(json.error || "Failed to delete user");
          }
        } catch (e: any) {
          showToast(`Error: ${e.message}`);
        }
      },
    });
  };

  const handleRegenerateApiKey = () => {
    openConfirm({
      title: t.apiKeyTitle,
      message: t.confirmRegenKey,
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "regenerate_key" }),
          });
          const json = await res.json();
          if (json.status === "success") {
            setProfileApiKey(json.api_key);
            showToast("REST API Key regenerated!");
          }
        } catch (e: any) {
          showToast(`Error: ${e.message}`);
        }
      },
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match!");
      return;
    }
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_password", new_password: newPassword }),
      });
      const json = await res.json();
      if (json.status === "success") {
        showToast("Admin password updated!");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(json.error || "Failed to update password");
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whitelistIp) return;
    try {
      const res = await fetch("/api/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: whitelistIp }),
      });
      const json = await res.json();
      if (json.status === "success") {
        showToast(`IP ${whitelistIp} added to whitelist!`);
        setWhitelistIp("");
        fetchNavData();
        fetchStats();
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleRemoveWhitelist = (ip: string) => {
    openConfirm({
      title: t.navWhitelist,
      message: `${lang === "id" ? "Hapus IP dari whitelist" : "Remove IP from whitelist"}: ${ip}?`,
      variant: "danger",
      onConfirm: async () => {
        try {
          await fetch(`/api/whitelist?ip=${encodeURIComponent(ip)}`, { method: "DELETE" });
          showToast(`IP ${ip} removed from whitelist`);
          fetchNavData();
          fetchStats();
        } catch (e: any) {
          showToast(`Error: ${e.message}`);
        }
      },
    });
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blacklistIp) return;
    try {
      const res = await fetch("/api/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: blacklistIp }),
      });
      const json = await res.json();
      if (json.status === "success") {
        showToast(`IP ${blacklistIp} added to permanent blacklist!`);
        setBlacklistIp("");
        fetchNavData();
        fetchStats();
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleRemoveBlacklist = (ip: string) => {
    openConfirm({
      title: t.navBlacklist,
      message: `${lang === "id" ? "Hapus IP dari blacklist" : "Remove IP from blacklist"}: ${ip}?`,
      variant: "danger",
      onConfirm: async () => {
        try {
          await fetch(`/api/blacklist?ip=${encodeURIComponent(ip)}`, { method: "DELETE" });
          showToast(`IP ${ip} removed from blacklist`);
          fetchNavData();
          fetchStats();
        } catch (e: any) {
          showToast(`Error: ${e.message}`);
        }
      },
    });
  };

  const handleAddCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountryCode || newCountryCode.length !== 2) return;
    try {
      const res = await fetch("/api/geoip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: newCountryCode }),
      });
      const json = await res.json();
      if (json.status === "success") {
        showToast(`Country ${newCountryCode.toUpperCase()} added to blocklist!`);
        setNewCountryCode("");
        fetchNavData();
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleRemoveCountry = (country: string) => {
    openConfirm({
      title: t.navGeoip,
      message: `${lang === "id" ? "Buka blokir negara" : "Unblock country"}: ${country}?`,
      variant: "warning",
      onConfirm: async () => {
        try {
          await fetch(`/api/geoip?country=${encodeURIComponent(country)}`, { method: "DELETE" });
          showToast(`Country ${country} unblocked`);
          fetchNavData();
        } catch (e: any) {
          showToast(`Error: ${e.message}`);
        }
      },
    });
  };

  const handleGatewayAction = (action: string, label: string) => {
    openConfirm({
      title: t.navMaintenance,
      message: `${t.confirmMaintAction}: "${label}"?`,
      variant: "danger",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/gateway-control", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          });
          const json = await res.json();
          if (json.status === "success") {
            showToast(json.message || `${label} executed successfully!`);
            fetchStats();
            fetchNavData();
          }
        } catch (e: any) {
          showToast(`Error: ${e.message}`);
        }
      },
    });
  };

  const exportLogsAsJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(liveLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `fluxwall_security_audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Audit logs exported to JSON file!");
  };

  const handleNavSelect = (nav: NavSection) => {
    setCurrentNav(nav);
    setMobileMenuOpen(false);
  };

  const filteredBans = bans.filter((b) => b.ip.toLowerCase().includes(searchFilter.toLowerCase()));

  // Analytics Chart Data
  const threatVectorData = {
    labels: [t.vectorBot, t.vectorWaf, t.vectorRate, t.vectorGeo],
    data: [
      Math.max(stats.threats_breakdown?.bad_bot || 0, 14),
      8,
      Math.max(stats.threats_breakdown?.rate_limited || 0, 22),
      Math.max(stats.threats_breakdown?.geo_blocked || 0, 6),
    ],
  };

  const topCountriesData = {
    labels: ["CN", "RU", "US", "BR", "KP", "ID", "DE", "VN"],
    data: [142, 98, 64, 45, 38, 29, 18, 12],
  };

  // Reusable Sidebar Nav Content



  // Reusable Sidebar Nav Content
  const renderNavLinks = () => (
    <SidebarNav
      currentNav={currentNav}
      handleNavSelect={handleNavSelect}
      t={t}
      collapsedSections={collapsedSections}
      toggleSection={toggleSection}
      liveLogs={liveLogs}
      bans={bans}
      whitelist={whitelist}
      blacklist={blacklist}
      blockedCountries={blockedCountries}
      customWafRules={customWafRules}
      upstreams={upstreams}
      sslDomains={sslDomains}
      adminUsers={adminUsers}
    />
  );

  return (
    <div className="flex min-h-screen bg-[#080b11] text-foreground bg-grid-cyber">
      {/* Action Confirmation Modal Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmLabel={t.btnConfirm}
        cancelLabel={t.btnCancel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-primary/20 border border-primary text-sky-200 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <span className="font-semibold text-xs tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-out Drawer */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-72 bg-[#090d16] border-r border-primary/20 z-50 md:hidden flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="overflow-y-auto">
          {/* Drawer Header */}
          <div className="h-16 px-5 border-b border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-primary/10 border border-primary/30 rounded-lg">
                <ShieldAlert className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-xs text-white">{t.brandTitle}</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Close navigation drawer"
              onClick={() => setMobileMenuOpen(false)}
              className="h-8 w-8 text-muted-foreground hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Drawer Links */}
          {renderNavLinks()}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-primary/20 bg-[#070a12]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-tight">{t.adminPortal}</div>
                <div className="text-[10px] text-primary">{t.authenticated}</div>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Log out of admin session"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 1. Desktop Sleek Enterprise Sidebar (Left Column) */}
      <aside className="w-64 border-r border-primary/20 bg-[#090d16]/95 backdrop-blur-xl flex flex-col justify-between shrink-0 hidden md:flex min-h-screen sticky top-0">
        {/* Brand Header */}
        <div>
          <div className="h-16 px-6 border-b border-primary/20 flex items-center gap-3">
            <div className="p-2 bg-primary/10 border border-primary/30 rounded-xl shadow-inner shadow-primary/20">
              <ShieldAlert className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white">{t.brandTitle}</span>
                <Badge variant="default" className="text-[8px] py-0 px-1 font-bold">
                  v1.0.1
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">{t.brandSubtitle}</p>
            </div>
          </div>

          {/* Navigation Links */}
          {renderNavLinks()}
        </div>

        {/* Sidebar Footer (Admin Profile & Logout) */}
        <div className="p-4 border-t border-primary/20 bg-[#070a12]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-tight">{t.adminPortal}</div>
                <div className="text-[10px] text-primary">{t.authenticated}</div>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Log out of admin session"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-7 w-7"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* 2. Main Work Area (Right Column) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-primary/20 bg-[#090d16]/85 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
          {/* Mobile Hamburger & Breadcrumbs */}
          <div className="flex items-center gap-2.5">
            {/* Hamburger Button (Mobile Only) */}
            <Button
              size="icon"
              variant="outline"
              aria-label="Open mobile navigation menu"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden h-8 w-8 border-primary/30 text-primary hover:bg-primary/10 shrink-0"
            >
              <Menu className="w-4 h-4" />
            </Button>

            <span className="text-muted-foreground font-medium hidden sm:inline text-xs">{t.dashboardBreadcrumb}</span>
            <ChevronRight className="w-3 h-3 text-muted-foreground hidden sm:inline" />
            <span className="text-white font-bold uppercase tracking-wider font-mono text-[11px] text-primary truncate max-w-[120px] sm:max-w-none">
              {currentNav}
            </span>
          </div>

          {/* Master Under Attack Toggle, Language Selector & Diagnostics */}
          <div className="flex items-center gap-2">
            {/* Language Switcher (ID / EN) */}
            <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-primary/20">
              <button
                onClick={() => changeLanguage("id")}
                aria-label="Ganti bahasa ke Bahasa Indonesia"
                className={`px-2 py-1 text-[11px] font-bold rounded-md transition ${
                  lang === "id" ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
                }`}
              >
                ID
              </button>
              <button
                onClick={() => changeLanguage("en")}
                aria-label="Switch language to English"
                className={`px-2 py-1 text-[11px] font-bold rounded-md transition ${
                  lang === "en" ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
                }`}
              >
                EN
              </button>
            </div>

            {/* 1-Click Under Attack Mode Master Switch with Confirm */}
            <Button
              size="sm"
              variant={underAttackMode ? "cyber" : "outline"}
              aria-label="Toggle Under Attack Mode"
              onClick={toggleUnderAttackMode}
              className={`gap-1.5 text-xs font-bold ${
                underAttackMode
                  ? "shadow-lg shadow-primary/30 animate-pulse border-primary"
                  : "border-primary/30 text-primary hover:bg-primary/10"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{underAttackMode ? t.underAttackOn : t.underAttackOff}</span>
              <span className="sm:hidden">{underAttackMode ? "ATTACK ON" : "NORMAL"}</span>
            </Button>

            {/* Terminus Health Inspector Button */}
            <Button
              variant="outline"
              size="sm"
              aria-label="Open Terminus diagnostics inspector"
              onClick={() => {
                fetchHealth();
                setShowHealthModal(true);
              }}
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10 px-2.5"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="font-medium text-xs hidden lg:inline">
                {health?.status === "ok" ? t.terminusHealthy : t.terminusDiagnostics}
              </span>
            </Button>
          </div>
        </header>

        {/* Content Container */}
        <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">
          {/* Alert Banner */}
          {underAttackMode ? (
            <Alert variant="cyber" className="border-primary/40 animate-pulse">
              <Flame className="h-4 w-4 text-primary" />
              <AlertTitle>{t.underAttackAlertTitle}</AlertTitle>
              <AlertDescription>{t.underAttackAlertDesc}</AlertDescription>
            </Alert>
          ) : stats.surge_mode ? (
            <Alert variant="cyber" className="border-primary/40">
              <Zap className="h-4 w-4 text-primary" />
              <AlertTitle>{t.surgeAlertTitle}</AlertTitle>
              <AlertDescription>{t.surgeAlertDesc}</AlertDescription>
            </Alert>
          ) : null}

                              {/* VIEW: OVERVIEW & TELEMETRY */}
          {currentNav === "overview" && (
            <OverviewView
              stats={stats}
              t={t}
              chartLabels={chartLabels}
              chartPoints={chartPoints}
              banIp={banIp}
              setBanIp={setBanIp}
              banDuration={banDuration}
              setBanDuration={setBanDuration}
              handleManualBan={handleManualBan}
            />
          )}

          {/* VIEW: INCIDENT FORENSICS & CANARY DECOY TRAPS */}
          {currentNav === "forensics" && (
            <div className="space-y-6">
              <IncidentForensics />
            </div>
          )}

          {/* VIEW: CYBER THREAT MAP */}
          {currentNav === "threat_map" && (
            <div className="space-y-6">
              <CyberThreatMap />
            </div>
          )}

          {/* VIEW: LIVE PACKET STREAM & SNIFFER */}
          {currentNav === "packet_stream" && (
            <div className="space-y-6">
              <PacketInspector />
            </div>
          )}

          {/* VIEW: THREAT ANALYTICS */}
          {currentNav === "analytics" && (
            <AnalyticsView
              t={t}
              threatVectorData={threatVectorData}
              topCountriesData={topCountriesData}
            />
          )}

          {/* VIEW: DDOS ATTACK SIMULATOR SANDBOX */}
          {currentNav === "simulator" && (
            <SimulatorView
              t={t}
              simVector={simVector}
              setSimVector={setSimVector}
              simIntensity={simIntensity}
              setSimIntensity={setSimIntensity}
              simRunning={simRunning}
              handleLaunchSimulation={handleLaunchSimulation}
              simReport={simReport}
            />
          )}

          {/* VIEW: CUSTOM WAF RULE BUILDER */}
          {currentNav === "custom_waf" && (
            <CustomWafView
              t={t}
              customWafRules={customWafRules}
              ruleName={ruleName}
              setRuleName={setRuleName}
              ruleField={ruleField}
              setRuleField={setRuleField}
              ruleOp={ruleOp}
              setRuleOp={setRuleOp}
              ruleVal={ruleVal}
              setRuleVal={setRuleVal}
              ruleAction={ruleAction}
              setRuleAction={setRuleAction}
              handleCreateCustomRule={handleCreateCustomRule}
              handleDeleteCustomRule={handleDeleteCustomRule}
            />
          )}

          {/* VIEW: BACKEND UPSTREAM PROXIES */}
          {currentNav === "upstreams" && (
            <UpstreamsView
              t={t}
              upstreams={upstreams}
              newUpsHost={newUpsHost}
              setNewUpsHost={setNewUpsHost}
              newUpsPort={newUpsPort}
              setNewUpsPort={setNewUpsPort}
              newUpsProtocol={newUpsProtocol}
              setNewUpsProtocol={setNewUpsProtocol}
              newUpsWeight={newUpsWeight}
              setNewUpsWeight={setNewUpsWeight}
              handleAddUpstream={handleAddUpstream}
              handleDeleteUpstream={handleDeleteUpstream}
            />
          )}

          {/* VIEW: SSL & DOMAINS */}
          {currentNav === "ssl" && (
            <SslView
              t={t}
              sslDomains={sslDomains}
              newDomain={newDomain}
              setNewDomain={setNewDomain}
              newIssuer={newIssuer}
              setNewIssuer={setNewIssuer}
              handleAddDomain={handleAddDomain}
              handleDeleteDomain={handleDeleteDomain}
              handleToggleSslFlag={handleToggleSslFlag}
              handleIssueLetsEncrypt={handleIssueLetsEncrypt}
            />
          )}

          {/* VIEW: IP INTELLIGENCE LOOKUP */}
          {currentNav === "lookup" && (
            <IpLookupView
              t={t}
              lang={lang}
              lookupTargetIp={lookupTargetIp}
              setLookupTargetIp={setLookupTargetIp}
              lookupResult={lookupResult}
              lookupLoading={lookupLoading}
              handleExecuteLookup={handleExecuteLookup}
              handleUnban={handleUnban}
              openConfirm={openConfirm}
              showToast={showToast}
            />
          )}

          {/* VIEW: ADMIN USER MANAGEMENT */}
          {currentNav === "users" && (
            <UsersView
              t={t}
              adminUsers={adminUsers}
              newUsername={newUsername}
              setNewUsername={setNewUsername}
              newUserPassword={newUserPassword}
              setNewUserPassword={setNewUserPassword}
              newUserRole={newUserRole}
              setNewUserRole={setNewUserRole}
              handleAddUser={handleAddUser}
              handleDeleteUser={handleDeleteUser}
            />
          )}

          {/* VIEW: SECURITY PROFILE & KEYS */}
          {currentNav === "profile" && (
            <ProfileView
              t={t}
              profileApiKey={profileApiKey}
              handleRegenerateApiKey={handleRegenerateApiKey}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              showApiKey={showApiKey}
              setShowApiKey={setShowApiKey}
              handleChangePassword={handleChangePassword}
              showToast={showToast}
            />
          )}

          {/* VIEW: IP QUARANTINE & BANS */}
          {currentNav === "bans" && (
            <BansView
              t={t}
              bans={bans}
              banIp={banIp}
              setBanIp={setBanIp}
              banDuration={banDuration}
              setBanDuration={setBanDuration}
              handleManualBan={handleManualBan}
              handleUnban={handleUnban}
            />
          )}

          {/* VIEW: WHITELIST */}
          {currentNav === "whitelist" && (
            <WhitelistView
              t={t}
              whitelist={whitelist}
              whitelistIp={whitelistIp}
              setWhitelistIp={setWhitelistIp}
              handleAddWhitelist={handleAddWhitelist}
              handleRemoveWhitelist={handleRemoveWhitelist}
            />
          )}

          {/* VIEW: BLACKLIST */}
          {currentNav === "blacklist" && (
            <BlacklistView
              t={t}
              blacklist={blacklist}
              blacklistIp={blacklistIp}
              setBlacklistIp={setBlacklistIp}
              handleAddBlacklist={handleAddBlacklist}
              handleRemoveBlacklist={handleRemoveBlacklist}
            />
          )}

          {/* VIEW: GEOIP COUNTRIES */}
          {currentNav === "geoip" && (
            <GeoIpView
              t={t}
              blockedCountries={blockedCountries}
              newCountryCode={newCountryCode}
              setNewCountryCode={setNewCountryCode}
              handleAddCountry={handleAddCountry}
              handleRemoveCountry={handleRemoveCountry}
            />
          )}

          {/* VIEW: WAF SIGNATURES */}
          {currentNav === "waf" && <WafSignaturesView t={t} />}

          {/* VIEW: RATE LIMIT SCALER */}
          {currentNav === "ratelimits" && (
            <RateLimitsView
              t={t}
              lang={lang}
              rateLimitGeneral={rateLimitGeneral}
              setRateLimitGeneral={setRateLimitGeneral}
              rateLimitBurst={rateLimitBurst}
              setRateLimitBurst={setRateLimitBurst}
              openConfirm={openConfirm}
              showToast={showToast}
            />
          )}

          {/* VIEW: ATTACK LOGS */}
          {currentNav === "logs" && (
            <LogsView
              t={t}
              liveLogs={liveLogs}
              exportLogsAsJson={exportLogsAsJson}
            />
          )}

          {/* VIEW: MAINTENANCE CONTROLS */}
          {currentNav === "maintenance" && (
            <MaintenanceView
              t={t}
              handleGatewayAction={handleGatewayAction}
            />
          )}
        </main>
      </div>

      {/* Terminus Health Diagnostics Modal */}
      <DiagnosticsModal
        isOpen={showHealthModal}
        onClose={() => setShowHealthModal(false)}
        health={health}
        t={t}
      />
    </div>
  );
}
