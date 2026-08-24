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
  UserCheck,
  Languages,
  PieChart,
  Fingerprint,
  Users,
  User,
  Key,
  Copy,
  AlertOctagon,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { translations, Language } from "@/lib/i18n";

// Lazy-load heavy Chart.js modules asynchronously (Huge Lighthouse Performance Boost)
const TelemetryChart = dynamic(() => import("@/components/charts/telemetry-chart"), {
  ssr: false,
  loading: () => (
    <div className="h-56 w-full flex items-center justify-center bg-secondary/10 rounded-xl border border-primary/10 animate-pulse">
      <Activity className="w-6 h-6 text-primary/40 animate-spin" />
    </div>
  ),
});

const ThreatVectorChart = dynamic(
  () => import("@/components/charts/analytics-charts").then((m) => m.ThreatVectorChart),
  {
    ssr: false,
    loading: () => <div className="h-56 w-56 bg-secondary/20 rounded-full animate-pulse" />,
  }
);

const TopCountriesChart = dynamic(
  () => import("@/components/charts/analytics-charts").then((m) => m.TopCountriesChart),
  {
    ssr: false,
    loading: () => <div className="h-56 w-full bg-secondary/20 rounded-xl animate-pulse" />,
  }
);

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

  const [currentNav, setCurrentNav] = useState<
    | "overview"
    | "analytics"
    | "bans"
    | "whitelist"
    | "blacklist"
    | "geoip"
    | "lookup"
    | "waf"
    | "ratelimits"
    | "users"
    | "profile"
    | "logs"
    | "maintenance"
  >("overview");

  const [underAttackMode, setUnderAttackMode] = useState(false);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [bans, setBans] = useState<BanItem[]>([]);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [blockedCountries, setBlockedCountries] = useState<string[]>([]);
  const [liveLogs, setLiveLogs] = useState<LogEvent[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Forms & Settings
  const [banIp, setBanIp] = useState("");
  const [banDuration, setBanDuration] = useState("900");
  const [whitelistIp, setWhitelistIp] = useState("");
  const [blacklistIp, setBlacklistIp] = useState("");
  const [newCountryCode, setNewCountryCode] = useState("");
  const [rateLimitGeneral, setRateLimitGeneral] = useState("20");
  const [rateLimitBurst, setRateLimitBurst] = useState("50");

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

  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Lightweight Telemetry Data Points
  const [chartLabels, setChartLabels] = useState<string[]>(() => Array(20).fill(""));
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

  // Auth Check
  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/check");
      const json = await res.json();
      if (!json.authenticated) {
        setIsAuthenticated(false);
        window.location.href = "/login";
      } else {
        setIsAuthenticated(true);
      }
    } catch {
      setIsAuthenticated(false);
      window.location.href = "/login";
    } finally {
      setIsAuthChecking(false);
    }
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

  const toggleUnderAttackMode = async () => {
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
      if (currentNav === "users") {
        fetchUsers();
      }
      if (currentNav === "profile") {
        fetchProfile();
      }
    } catch {}
  }, [currentNav]);

  useEffect(() => {
    checkAuth();
    fetchStats();
    fetchAttackMode();
    fetchNavData();

    // 3s Debounced Polling for smoother main thread
    const interval = setInterval(() => {
      fetchStats();
      if (currentNav === "overview" || currentNav === "logs" || currentNav === "analytics") {
        fetchLogs();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentNav, fetchStats, fetchNavData]);

  // Actions
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const handleUnban = async (ip: string) => {
    try {
      const res = await fetch(`/api/bans?ip=${encodeURIComponent(ip)}`, { method: "DELETE" });
      const json = await res.json();
      if (json.status === "success") {
        showToast(`IP ${ip} unbanned!`);
        fetchNavData();
        fetchStats();
        if (lookupResult && lookupResult.ip === ip) {
          handleExecuteLookup(ip);
        }
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleManualBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banIp) return;
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

  const handleDeleteUser = async (username: string) => {
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
  };

  const handleRegenerateApiKey = async () => {
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

  const handleRemoveWhitelist = async (ip: string) => {
    try {
      await fetch(`/api/whitelist?ip=${encodeURIComponent(ip)}`, { method: "DELETE" });
      showToast(`IP ${ip} removed from whitelist`);
      fetchNavData();
      fetchStats();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
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

  const handleRemoveBlacklist = async (ip: string) => {
    try {
      await fetch(`/api/blacklist?ip=${encodeURIComponent(ip)}`, { method: "DELETE" });
      showToast(`IP ${ip} removed from blacklist`);
      fetchNavData();
      fetchStats();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
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

  const handleRemoveCountry = async (country: string) => {
    try {
      await fetch(`/api/geoip?country=${encodeURIComponent(country)}`, { method: "DELETE" });
      showToast(`Country ${country} unblocked`);
      fetchNavData();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleGatewayAction = async (action: string, label: string) => {
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

  if (isAuthChecking || !isAuthenticated) {
    return (
      <div className="flex-1 min-h-screen bg-[#080b11] bg-grid-cyber flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-primary/10 border border-primary/30 rounded-2xl animate-pulse">
            <ShieldAlert className="w-8 h-8 text-primary animate-spin" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            {lang === "id" ? "Memverifikasi Sesi Admin..." : "Verifying Admin Session..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#080b11] text-foreground bg-grid-cyber">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-primary/20 border border-primary text-sky-200 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <span className="font-semibold text-xs tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* 1. Sleek Enterprise Sidebar (Left Column) */}
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
          <div className="p-4 space-y-6">
            {/* Section 1: Monitoring */}
            <div>
              <span className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                {t.navMonitoring}
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => setCurrentNav("overview")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentNav === "overview"
                      ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                      : "text-muted-foreground hover:text-white hover:bg-primary/5"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-primary" />
                  <span>{t.navOverview}</span>
                </button>

                <button
                  onClick={() => setCurrentNav("analytics")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentNav === "analytics"
                      ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                      : "text-muted-foreground hover:text-white hover:bg-primary/5"
                  }`}
                >
                  <PieChart className="w-4 h-4 text-primary" />
                  <span>{t.navAnalytics}</span>
                </button>

                <button
                  onClick={() => setCurrentNav("logs")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentNav === "logs"
                      ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                      : "text-muted-foreground hover:text-white hover:bg-primary/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <RadioTower className="w-4 h-4 text-primary" />
                    <span>{t.navAttackLogs}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-primary/30 text-primary py-0">
                    {liveLogs.length}
                  </Badge>
                </button>
              </div>
            </div>

            {/* Section 2: Security Policies */}
            <div>
              <span className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                {t.navPolicies}
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => setCurrentNav("lookup")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentNav === "lookup"
                      ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                      : "text-muted-foreground hover:text-white hover:bg-primary/5"
                  }`}
                >
                  <Fingerprint className="w-4 h-4 text-primary" />
                  <span>{t.navIpLookup}</span>
                </button>

                <button
                  onClick={() => setCurrentNav("bans")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentNav === "bans"
                      ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                      : "text-muted-foreground hover:text-white hover:bg-primary/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-primary" />
                    <span>{t.navBans}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-primary/30 text-primary py-0">
                    {bans.length}
                  </Badge>
                </button>

                <button
                  onClick={() => setCurrentNav("whitelist")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentNav === "whitelist"
                      ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                      : "text-muted-foreground hover:text-white hover:bg-primary/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span>{t.navWhitelist}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-primary/30 text-primary py-0">
                    {whitelist.length}
                  </Badge>
                </button>

                <button
                  onClick={() => setCurrentNav("blacklist")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentNav === "blacklist"
                      ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                      : "text-muted-foreground hover:text-white hover:bg-primary/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Ban className="w-4 h-4 text-primary" />
                    <span>{t.navBlacklist}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-primary/30 text-primary py-0">
                    {blacklist.length}
                  </Badge>
                </button>

                <button
                  onClick={() => setCurrentNav("geoip")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentNav === "geoip"
                      ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                      : "text-muted-foreground hover:text-white hover:bg-primary/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-primary" />
                    <span>{t.navGeoip}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-primary/30 text-primary py-0">
                    {blockedCountries.length}
                  </Badge>
                </button>

                <button
                  onClick={() => setCurrentNav("waf")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentNav === "waf"
                      ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                      : "text-muted-foreground hover:text-white hover:bg-primary/5"
                  }`}
                >
                  <Shield className="w-4 h-4 text-primary" />
                  <span>{t.navWaf}</span>
                </button>

                <button
                  onClick={() => setCurrentNav("ratelimits")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentNav === "ratelimits"
                      ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                      : "text-muted-foreground hover:text-white hover:bg-primary/5"
                  }`}
                >
                  <Gauge className="w-4 h-4 text-primary" />
                  <span>{t.navRateLimits}</span>
                </button>
              </div>
            </div>

            {/* Section 3: Access & Administration */}
            <div>
              <span className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                {t.navAdministration}
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => setCurrentNav("users")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentNav === "users"
                      ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                      : "text-muted-foreground hover:text-white hover:bg-primary/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-primary" />
                    <span>{t.navUsers}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-primary/30 text-primary py-0">
                    {adminUsers.length || 1}
                  </Badge>
                </button>

                <button
                  onClick={() => setCurrentNav("profile")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentNav === "profile"
                      ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                      : "text-muted-foreground hover:text-white hover:bg-primary/5"
                  }`}
                >
                  <User className="w-4 h-4 text-primary" />
                  <span>{t.navProfile}</span>
                </button>
              </div>
            </div>

            {/* Section 4: System */}
            <div>
              <span className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                {t.navSystem}
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => setCurrentNav("maintenance")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentNav === "maintenance"
                      ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                      : "text-muted-foreground hover:text-white hover:bg-primary/5"
                  }`}
                >
                  <Settings className="w-4 h-4 text-primary" />
                  <span>{t.navMaintenance}</span>
                </button>

                <Link href="/errors">
                  <div className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-white hover:bg-primary/5 transition cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FileCode2 className="w-4 h-4 text-primary" />
                      <span>{t.navErrorShowcase}</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
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
              onClick={handleLogout}
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-7 w-7"
              title={t.logout}
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
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium hidden sm:inline">{t.dashboardBreadcrumb}</span>
            <ChevronRight className="w-3 h-3 text-muted-foreground hidden sm:inline" />
            <span className="text-white font-bold uppercase tracking-wider font-mono text-[11px] text-primary">
              {currentNav}
            </span>
          </div>

          {/* Master Under Attack Toggle, Language Selector & Diagnostics */}
          <div className="flex items-center gap-2.5">
            {/* Language Switcher (ID / EN) */}
            <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-primary/20">
              <button
                onClick={() => changeLanguage("id")}
                className={`px-2 py-1 text-[11px] font-bold rounded-md transition ${
                  lang === "id" ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
                }`}
              >
                ID
              </button>
              <button
                onClick={() => changeLanguage("en")}
                className={`px-2 py-1 text-[11px] font-bold rounded-md transition ${
                  lang === "en" ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
                }`}
              >
                EN
              </button>
            </div>

            {/* 1-Click Under Attack Mode Master Switch */}
            <Button
              size="sm"
              variant={underAttackMode ? "cyber" : "outline"}
              onClick={toggleUnderAttackMode}
              className={`gap-1.5 text-xs font-bold ${
                underAttackMode
                  ? "shadow-lg shadow-primary/30 animate-pulse border-primary"
                  : "border-primary/30 text-primary hover:bg-primary/10"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {underAttackMode ? t.underAttackOn : t.underAttackOff}
            </Button>

            {/* Terminus Health Inspector Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchHealth();
                setShowHealthModal(true);
              }}
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="font-medium text-xs hidden sm:inline">
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
            <div className="space-y-6">
              {/* 4 Hero Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glow-primary border-primary/30 bg-card/85">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                      {t.statTraffic}
                    </CardTitle>
                    <Activity className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black text-white">
                      {stats.live_qps}{" "}
                      <span className="text-xs font-normal text-muted-foreground">req/sec</span>
                    </div>
                    <p className="text-[11px] text-primary mt-1 flex items-center gap-1 font-medium">
                      <Zap className="w-3 h-3" /> {t.statLatency}
                    </p>
                  </CardContent>
                </Card>

                <Card className="glow-primary border-primary/20 bg-card/85">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                      {t.statBans}
                    </CardTitle>
                    <Lock className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black text-primary">{stats.active_bans}</div>
                    <p className="text-[11px] text-muted-foreground mt-1">{t.statBansSub}</p>
                  </CardContent>
                </Card>

                <Card className="glow-primary border-primary/20 bg-card/85">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                      {t.statWhitelist}
                    </CardTitle>
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black text-white">{stats.whitelist_count}</div>
                    <p className="text-[11px] text-muted-foreground mt-1">{t.statWhitelistSub}</p>
                  </CardContent>
                </Card>

                <Card className="glow-primary border-primary/20 bg-card/85">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                      {t.statThreats}
                    </CardTitle>
                    <Ban className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-black text-primary">{stats.threats_total}</div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {t.statThreatsSub}: {stats.blacklist_count} IPs
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Telemetry Chart & Quick Quarantine Form */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-primary/20 bg-card/85 glow-primary">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <Radio className="w-4 h-4 text-primary animate-pulse" /> {t.chartTitle}
                      </CardTitle>
                      <CardDescription className="text-[11px]">{t.chartDesc}</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                      {t.pollingEngine}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <TelemetryChart
                      labels={chartLabels}
                      dataPoints={chartPoints}
                      label={t.chartReqSec}
                    />
                  </CardContent>
                </Card>

                {/* Quick Quarantine Form Card */}
                <Card className="border-primary/20 bg-card/85 flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-primary">
                      <Lock className="w-4 h-4" /> {t.quickBanTitle}
                    </CardTitle>
                    <CardDescription className="text-[11px]">{t.quickBanDesc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleManualBan} className="space-y-3">
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">{t.targetIp}</label>
                        <Input
                          placeholder="e.g. 198.51.100.44"
                          value={banIp}
                          onChange={(e) => setBanIp(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">{t.banDuration}</label>
                        <select
                          value={banDuration}
                          onChange={(e) => setBanDuration(e.target.value)}
                          className="w-full h-9 rounded-lg border border-input bg-card/60 px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="300">{t.dur5Min}</option>
                          <option value="900">{t.dur15Min}</option>
                          <option value="3600">{t.dur1Hour}</option>
                          <option value="86400">{t.dur24Hours}</option>
                        </select>
                      </div>
                      <Button type="submit" variant="cyber" className="w-full mt-2 gap-2 font-bold">
                        <Ban className="w-3.5 h-3.5" /> {t.executeBan}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* VIEW: THREAT ANALYTICS */}
          {currentNav === "analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attack Vector Doughnut Chart */}
                <Card className="border-primary/20 bg-card/85 glow-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-primary" /> {t.threatBreakdownTitle}
                    </CardTitle>
                    <CardDescription className="text-[11px]">{t.threatBreakdownDesc}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <ThreatVectorChart vectorData={threatVectorData} />
                  </CardContent>
                </Card>

                {/* Top Countries Bar Chart */}
                <Card className="border-primary/20 bg-card/85 glow-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" /> {t.topCountriesTitle}
                    </CardTitle>
                    <CardDescription className="text-[11px]">{t.topCountriesDesc}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <TopCountriesChart countryData={topCountriesData} />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* VIEW: IP INTELLIGENCE LOOKUP */}
          {currentNav === "lookup" && (
            <div className="space-y-6">
              <Card className="border-primary/20 bg-card/85">
                <CardHeader className="border-b border-border/80 pb-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-primary" /> {t.lookupTitle}
                  </CardTitle>
                  <CardDescription className="text-[11px]">{t.lookupDesc}</CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="flex gap-2 max-w-xl">
                    <Input
                      placeholder={t.searchIpPlaceholder}
                      value={lookupTargetIp}
                      onChange={(e) => setLookupTargetIp(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleExecuteLookup()}
                      className="text-xs"
                    />
                    <Button
                      variant="cyber"
                      onClick={() => handleExecuteLookup()}
                      disabled={lookupLoading}
                      className="gap-2 shrink-0 text-xs font-bold"
                    >
                      <Search className="w-3.5 h-3.5" />
                      {lookupLoading ? "Investigating..." : t.btnLookup}
                    </Button>
                  </div>

                  {/* Lookup Result Card */}
                  {lookupResult && (
                    <div className="mt-6 p-5 rounded-xl bg-[#090d16] border border-primary/30 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 border border-primary/30 rounded-xl">
                            <Globe className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-mono font-bold text-white flex items-center gap-2">
                              {lookupResult.ip}
                              <Badge variant="outline" className="font-mono text-[10px] border-primary/30 text-primary">
                                {lookupResult.geo.country}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {lookupResult.geo.city ? `${lookupResult.geo.city}, ` : ""}{lookupResult.geo.region || ""}
                            </div>
                          </div>
                        </div>

                        {/* Defense Status Badges */}
                        <div className="flex items-center gap-2">
                          {lookupResult.defense_status.is_banned && (
                            <Badge variant="destructive" className="text-[10px]">
                              BANNED ({lookupResult.defense_status.ban_ttl_seconds}s remaining)
                            </Badge>
                          )}
                          {lookupResult.defense_status.is_whitelisted && (
                            <Badge variant="default" className="text-[10px]">WHITELISTED</Badge>
                          )}
                          {lookupResult.defense_status.is_blacklisted && (
                            <Badge variant="destructive" className="text-[10px]">BLACKLISTED</Badge>
                          )}
                          {!lookupResult.defense_status.is_banned &&
                            !lookupResult.defense_status.is_whitelisted &&
                            !lookupResult.defense_status.is_blacklisted && (
                              <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
                                CLEAN IP
                              </Badge>
                            )}
                        </div>
                      </div>

                      {/* Detail Metrics */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-secondary/30 border border-primary/10">
                          <div className="text-muted-foreground text-[10px]">{t.asnOrg}</div>
                          <div className="font-semibold text-white mt-0.5 truncate">{lookupResult.geo.org}</div>
                        </div>

                        <div className="p-3 rounded-lg bg-secondary/30 border border-primary/10">
                          <div className="text-muted-foreground text-[10px]">Hosting Category</div>
                          <div className="font-semibold mt-0.5">
                            {lookupResult.geo.is_datacenter ? (
                              <span className="text-amber-400 flex items-center gap-1">
                                <AlertOctagon className="w-3.5 h-3.5" /> Datacenter / Cloud Botnet
                              </span>
                            ) : (
                              <span className="text-primary flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5" /> Residential / Clean ISP
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-secondary/30 border border-primary/10">
                          <div className="text-muted-foreground text-[10px]">{t.strikeCount}</div>
                          <div className="font-semibold text-white mt-0.5">
                            {lookupResult.defense_status.strike_violations} / 5 strikes
                          </div>
                        </div>
                      </div>

                      {/* 1-Click Action Buttons */}
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        {lookupResult.defense_status.is_banned ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnban(lookupResult.ip)}
                            className="text-xs border-primary/30 text-primary hover:bg-primary/20 gap-1.5"
                          >
                            <Unlock className="w-3.5 h-3.5" /> {t.btnUnban}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="cyber"
                            onClick={async () => {
                              await fetch("/api/bans", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ip: lookupResult.ip, duration_sec: 900 }),
                              });
                              showToast(`IP ${lookupResult.ip} banned for 15m!`);
                              handleExecuteLookup(lookupResult.ip);
                            }}
                            className="text-xs gap-1.5"
                          >
                            <Lock className="w-3.5 h-3.5" /> {t.btnQuickBan}
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await fetch("/api/whitelist", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ ip: lookupResult.ip }),
                            });
                            showToast(`IP ${lookupResult.ip} whitelisted!`);
                            handleExecuteLookup(lookupResult.ip);
                          }}
                          className="text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> {t.btnQuickWhitelist}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await fetch("/api/blacklist", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ ip: lookupResult.ip }),
                            });
                            showToast(`IP ${lookupResult.ip} added to permanent blacklist!`);
                            handleExecuteLookup(lookupResult.ip);
                          }}
                          className="text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
                        >
                          <Ban className="w-3.5 h-3.5" /> {t.btnQuickBlacklist}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* VIEW: ADMIN USER MANAGEMENT */}
          {currentNav === "users" && (
            <Card className="border-primary/20 bg-card/85">
              <CardHeader className="border-b border-border/80 pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> {t.usersTitle}
                </CardTitle>
                <CardDescription className="text-[11px]">{t.usersDesc}</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                {/* Add User Form */}
                <form onSubmit={handleAddUser} className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-3">
                  <div className="text-xs font-bold text-white">{t.btnAddUser}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">{t.usernameLabel}</label>
                      <Input
                        placeholder="e.g. security_lead"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">{t.passwordLabel}</label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">{t.roleLabel}</label>
                      <select
                        value={newUserRole}
                        onChange={(e: any) => setNewUserRole(e.target.value)}
                        className="w-full h-9 rounded-lg border border-input bg-card/60 px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="security_analyst">{t.roleAnalyst}</option>
                        <option value="super_admin">{t.roleSuperAdmin}</option>
                        <option value="auditor">{t.roleAuditor}</option>
                      </select>
                    </div>
                  </div>
                  <Button type="submit" variant="cyber" className="text-xs gap-1.5 font-bold mt-2">
                    <Plus className="w-3.5 h-3.5" /> {t.btnAddUser}
                  </Button>
                </form>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                      <tr>
                        <th className="py-3 px-4">{t.tableUser}</th>
                        <th className="py-3 px-4">{t.tableRole}</th>
                        <th className="py-3 px-4">{t.tableCreated}</th>
                        <th className="py-3 px-4 text-right">{t.tableAction}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {adminUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-accent/40 transition">
                          <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center text-[10px] text-primary">
                              {user.username.substring(0, 2).toUpperCase()}
                            </div>
                            <span>{user.username}</span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={user.role === "super_admin" ? "default" : "outline"} className="text-[10px]">
                              {user.role === "super_admin"
                                ? "Super Admin"
                                : user.role === "security_analyst"
                                ? "Security Analyst"
                                : "Auditor"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {user.username === "admin" ? (
                              <span className="text-[10px] text-muted-foreground italic">Protected Root</span>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteUser(user.username)}
                                className="text-destructive hover:bg-destructive/10 text-xs h-7 gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> {t.btnDeleteUser}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* VIEW: SECURITY PROFILE & KEYS */}
          {currentNav === "profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Card & API Key */}
              <Card className="border-primary/20 bg-card/85">
                <CardHeader className="border-b border-border/80 pb-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> {t.profileTitle}
                  </CardTitle>
                  <CardDescription className="text-[11px]">{t.profileDesc}</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-primary/20">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">admin</div>
                      <div className="text-muted-foreground text-[11px]">{t.roleSuperAdmin}</div>
                      <Badge variant="default" className="text-[9px] mt-1">SESSION ACTIVE</Badge>
                    </div>
                  </div>

                  {/* REST API Key */}
                  <div className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-primary" /> {t.apiKeyTitle}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="h-6 w-6 text-muted-foreground hover:text-white"
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={profileApiKey}
                        readOnly
                        className="font-mono text-xs text-primary bg-[#070a12]"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(profileApiKey);
                          showToast("API Key copied to clipboard!");
                        }}
                        className="shrink-0 text-xs border-primary/30 text-primary gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateApiKey}
                      className="text-[11px] border-primary/30 text-muted-foreground hover:text-primary mt-1 gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" /> {t.btnRegenKey}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Change Password Form */}
              <Card className="border-primary/20 bg-card/85">
                <CardHeader className="border-b border-border/80 pb-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" /> {t.changePassTitle}
                  </CardTitle>
                  <CardDescription className="text-[11px]">Update your administrator access credentials</CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t.newPassLabel}
                      </label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t.confirmPassLabel}
                      </label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>
                    <Button type="submit" variant="cyber" className="w-full text-xs font-bold gap-2">
                      <Lock className="w-3.5 h-3.5" /> {t.btnSavePass}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* VIEW: IP QUARANTINE & BANS */}
          {currentNav === "bans" && (
            <Card className="border-primary/20 bg-card/85">
              <CardHeader className="border-b border-border/80 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" /> {t.navBans}
                  </CardTitle>
                  <CardDescription className="text-[11px]">{t.noActiveBans}</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder={t.searchOffender}
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-8 text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                      <tr>
                        <th className="py-3 px-4">{t.tableOffenderIp}</th>
                        <th className="py-3 px-4">{t.tableRemainingTtl}</th>
                        <th className="py-3 px-4">{t.tableReason}</th>
                        <th className="py-3 px-4 text-right">{t.tableAction}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredBans.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-muted-foreground">
                            {t.noActiveBans}
                          </td>
                        </tr>
                      ) : (
                        filteredBans.map((ban) => (
                          <tr key={ban.ip} className="hover:bg-accent/40 transition">
                            <td className="py-3 px-4 font-mono font-bold text-primary">{ban.ip}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="font-mono text-[11px] border-primary/30 text-primary bg-primary/5">
                                {ban.remaining_ttl}s remaining
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground font-medium">{ban.reason}</td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnban(ban.ip)}
                                className="gap-1.5 text-[11px] h-7 border-primary/30 text-primary hover:bg-primary/20"
                              >
                                <Unlock className="w-3 h-3" /> {t.btnUnban}
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
          )}

          {/* VIEW: WHITELIST */}
          {currentNav === "whitelist" && (
            <Card className="border-primary/20 bg-card/85">
              <CardHeader className="border-b border-border/80 pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" /> {t.navWhitelist}
                </CardTitle>
                <CardDescription className="text-[11px]">{t.statWhitelistSub}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <form onSubmit={handleAddWhitelist} className="flex gap-2 max-w-lg">
                  <Input
                    placeholder={t.trustedIpPlaceholder}
                    value={whitelistIp}
                    onChange={(e) => setWhitelistIp(e.target.value)}
                    required
                  />
                  <Button type="submit" variant="cyber" className="gap-1.5 shrink-0 font-bold">
                    <Plus className="w-4 h-4" /> {t.btnAddWhitelist}
                  </Button>
                </form>

                <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden">
                  {whitelist.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground text-xs">
                      {t.noWhitelist}
                    </div>
                  ) : (
                    whitelist.map((ip) => (
                      <div key={ip} className="flex items-center justify-between py-2.5 px-4 hover:bg-accent/30 transition">
                        <span className="font-mono text-primary font-bold text-xs">{ip}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveWhitelist(ip)}
                          className="text-muted-foreground hover:text-primary h-7 w-7"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* VIEW: BLACKLIST */}
          {currentNav === "blacklist" && (
            <Card className="border-primary/20 bg-card/85">
              <CardHeader className="border-b border-border/80 pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Ban className="w-4 h-4 text-primary" /> {t.navBlacklist}
                </CardTitle>
                <CardDescription className="text-[11px]">{t.statThreatsSub}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <form onSubmit={handleAddBlacklist} className="flex gap-2 max-w-lg">
                  <Input
                    placeholder={t.maliciousIpPlaceholder}
                    value={blacklistIp}
                    onChange={(e) => setBlacklistIp(e.target.value)}
                    required
                  />
                  <Button type="submit" variant="cyber" className="gap-1.5 shrink-0 font-bold">
                    <Plus className="w-4 h-4" /> {t.btnAddBlacklist}
                  </Button>
                </form>

                <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden">
                  {blacklist.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground text-xs">
                      {t.noBlacklist}
                    </div>
                  ) : (
                    blacklist.map((ip) => (
                      <div key={ip} className="flex items-center justify-between py-2.5 px-4 hover:bg-accent/30 transition">
                        <span className="font-mono text-primary font-bold text-xs">{ip}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveBlacklist(ip)}
                          className="text-muted-foreground hover:text-primary h-7 w-7"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* VIEW: GEOIP COUNTRIES */}
          {currentNav === "geoip" && (
            <Card className="border-primary/20 bg-card/85">
              <CardHeader className="border-b border-border/80 pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> {t.navGeoip}
                </CardTitle>
                <CardDescription className="text-[11px]">{t.countryCodePlaceholder}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <form onSubmit={handleAddCountry} className="flex gap-2 max-w-lg">
                  <Input
                    placeholder={t.countryCodePlaceholder}
                    value={newCountryCode}
                    onChange={(e) => setNewCountryCode(e.target.value.toUpperCase())}
                    maxLength={2}
                    required
                  />
                  <Button type="submit" variant="cyber" className="gap-1.5 shrink-0 font-bold">
                    <Plus className="w-4 h-4" /> {t.btnBlockCountry}
                  </Button>
                </form>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                  {blockedCountries.map((code) => (
                    <div
                      key={code}
                      className="p-3 bg-secondary/40 border border-primary/20 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        <span className="font-mono font-bold text-white text-sm">{code}</span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveCountry(code)}
                        className="text-muted-foreground hover:text-primary h-6 w-6"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* VIEW: WAF RULES */}
          {currentNav === "waf" && (
            <Card className="border-primary/20 bg-card/85">
              <CardHeader className="border-b border-border/80 pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> {t.wafTitle}
                </CardTitle>
                <CardDescription className="text-[11px]">{t.wafDesc}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-secondary/30 border border-primary/20 rounded-xl flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{t.sqliTitle}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">UNION SELECT, OR 1=1, sys.tables, sleep()</div>
                    </div>
                    <Badge variant="default" className="text-[9px]">{t.enforcedBadge}</Badge>
                  </div>

                  <div className="p-3.5 bg-secondary/30 border border-primary/20 rounded-xl flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{t.xssTitle}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">&lt;script&gt;, javascript:, onerror=, document.cookie</div>
                    </div>
                    <Badge variant="default" className="text-[9px]">{t.enforcedBadge}</Badge>
                  </div>

                  <div className="p-3.5 bg-secondary/30 border border-primary/20 rounded-xl flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{t.scannersTitle}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">sqlmap, nikto, dirbuster, masscan, nmap, zgrab</div>
                    </div>
                    <Badge variant="default" className="text-[9px]">{t.enforcedBadge}</Badge>
                  </div>

                  <div className="p-3.5 bg-secondary/30 border border-primary/20 rounded-xl flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{t.rceTitle}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">eval(), system(), exec(), base64_decode, /bin/sh</div>
                    </div>
                    <Badge variant="default" className="text-[9px]">{t.enforcedBadge}</Badge>
                  </div>

                  <div className="p-3.5 bg-secondary/30 border border-primary/20 rounded-xl flex items-start justify-between md:col-span-2">
                    <div>
                      <div className="font-bold text-white text-xs">{t.slowlorisTitle}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">Multi-part HTTP Range headers (bytes=0-,5-0,5-1...)</div>
                    </div>
                    <Badge variant="default" className="text-[9px]">{t.enforcedBadge}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* VIEW: RATE LIMIT SCALER */}
          {currentNav === "ratelimits" && (
            <Card className="border-primary/20 bg-card/85">
              <CardHeader className="border-b border-border/80 pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-primary" /> {t.rateLimitTitle}
                </CardTitle>
                <CardDescription className="text-[11px]">{t.rateLimitDesc}</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4 max-w-2xl">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-white block mb-1">
                      {t.perIpLimit}: <span className="font-mono text-primary font-bold">{rateLimitGeneral} req/sec</span>
                    </label>
                    <Input
                      type="number"
                      value={rateLimitGeneral}
                      onChange={(e) => setRateLimitGeneral(e.target.value)}
                      className="text-xs max-w-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white block mb-1">
                      {t.maxBurstBucket}: <span className="font-mono text-primary font-bold">{rateLimitBurst} tokens</span>
                    </label>
                    <Input
                      type="number"
                      value={rateLimitBurst}
                      onChange={(e) => setRateLimitBurst(e.target.value)}
                      className="text-xs max-w-xs"
                    />
                  </div>

                  <Button
                    variant="cyber"
                    onClick={() => showToast(`Rate Limit policy updated: ${rateLimitGeneral} req/s (Burst: ${rateLimitBurst})`)}
                    className="gap-2 text-xs font-bold mt-2"
                  >
                    <Sliders className="w-3.5 h-3.5" /> {t.btnSaveRateLimit}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* VIEW: ATTACK LOGS */}
          {currentNav === "logs" && (
            <Card className="border-primary/20 bg-card/85">
              <CardHeader className="border-b border-border/80 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <RadioTower className="w-4 h-4 text-primary" /> {t.navAttackLogs}
                  </CardTitle>
                  <CardDescription className="text-[11px]">{t.noThreatsRecorded}</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={exportLogsAsJson} className="gap-1.5 text-xs text-primary border-primary/30">
                  <Download className="w-3.5 h-3.5" /> {t.btnExportJson}
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-2 font-mono text-xs">
                {liveLogs.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <RadioTower className="w-6 h-6 text-primary animate-pulse" />
                    <span>{t.noThreatsRecorded}</span>
                  </div>
                ) : (
                  liveLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-card/40 border border-primary/10 gap-2 hover:bg-accent/20 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-[10px]">
                          {log.time_formatted || new Date(log.time * 1000).toLocaleTimeString()}
                        </span>
                        <Badge variant="default" className="text-[9px]">
                          {log.event}
                        </Badge>
                        <span className="font-bold text-white">{log.client_ip}</span>
                      </div>
                      <span className="text-muted-foreground text-[11px] truncate max-w-md">
                        {log.reason} {log.uri ? `(${log.uri})` : ""}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* VIEW: MAINTENANCE CONTROLS */}
          {currentNav === "maintenance" && (
            <Card className="border-primary/20 bg-card/85">
              <CardHeader className="border-b border-border/80 pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" /> {t.maintTitle}
                </CardTitle>
                <CardDescription className="text-[11px]">{t.maintDesc}</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="border-primary/20 bg-secondary/30 p-4">
                    <h4 className="font-bold text-white text-xs mb-1">{t.maintClearViolations}</h4>
                    <p className="text-[11px] text-muted-foreground mb-3">{t.maintClearViolationsDesc}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGatewayAction("flush_violations", t.btnClearViolations)}
                      className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10 text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> {t.btnClearViolations}
                    </Button>
                  </Card>

                  <Card className="border-primary/20 bg-secondary/30 p-4">
                    <h4 className="font-bold text-white text-xs mb-1">{t.maintResetThreats}</h4>
                    <p className="text-[11px] text-muted-foreground mb-3">{t.maintResetThreatsDesc}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGatewayAction("reset_threat_counter", t.btnResetThreats)}
                      className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10 text-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> {t.btnResetThreats}
                    </Button>
                  </Card>

                  <Card className="border-primary/20 bg-secondary/30 p-4">
                    <h4 className="font-bold text-white text-xs mb-1">{t.maintPurgeLogs}</h4>
                    <p className="text-[11px] text-muted-foreground mb-3">{t.maintPurgeLogsDesc}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGatewayAction("clear_logs", t.btnPurgeLogs)}
                      className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {t.btnPurgeLogs}
                    </Button>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Terminus Healthcheck Inspector Dialog */}
      {showHealthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full border-primary/30 shadow-2xl animate-in fade-in zoom-in-95 duration-200 bg-[#0b101c]">
            <CardHeader className="border-b border-border/80 pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-sm">{t.diagTitle}</CardTitle>
                  <CardDescription className="text-[11px]">{t.diagDesc}</CardDescription>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setShowHealthModal(false)} className="h-7 w-7">
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 p-5 text-xs">
              {/* Redis Indicator */}
              <div className="p-3 bg-secondary/30 rounded-xl border border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <HardDrive className="w-4 h-4 text-primary" />
                  <div>
                    <div className="font-bold text-white">{t.redisHealth}</div>
                    <div className="text-muted-foreground text-[11px]">
                      Ping Latency: {health?.info?.redis?.latency_ms ?? 0} ms
                    </div>
                  </div>
                </div>
                <Badge variant="default">
                  {health?.info?.redis?.status?.toUpperCase() || "UP"}
                </Badge>
              </div>

              {/* Memory Heap Indicator */}
              <div className="p-3 bg-secondary/30 rounded-xl border border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-primary" />
                  <div>
                    <div className="font-bold text-white">{t.memoryHeapHealth}</div>
                    <div className="text-muted-foreground text-[11px]">
                      Heap Used: {health?.info?.memory_heap?.used_mb} MB / Alloc: {health?.info?.memory_heap?.allocated_mb} MB
                    </div>
                  </div>
                </div>
                <Badge variant="default">
                  {health?.info?.memory_heap?.status?.toUpperCase() || "UP"}
                </Badge>
              </div>

              {/* Memory RSS Indicator */}
              <div className="p-3 bg-secondary/30 rounded-xl border border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-primary" />
                  <div>
                    <div className="font-bold text-white">{t.processRssHealth}</div>
                    <div className="text-muted-foreground text-[11px]">
                      Resident Size: {health?.info?.memory_rss?.used_mb} MB
                    </div>
                  </div>
                </div>
                <Badge variant="default">UP</Badge>
              </div>

              {/* Gateway Socket Check */}
              <div className="p-3 bg-secondary/30 rounded-xl border border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Network className="w-4 h-4 text-primary" />
                  <div>
                    <div className="font-bold text-white">{t.gatewaySocketHealth}</div>
                    <div className="text-muted-foreground text-[11px]">Socket Status: /healthz</div>
                  </div>
                </div>
                <Badge variant="default">
                  {health?.info?.gateway?.status?.toUpperCase() || "UP"}
                </Badge>
              </div>
            </CardContent>
            <div className="p-4 border-t border-border/80 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setShowHealthModal(false)}>
                {t.btnCloseDiag}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
