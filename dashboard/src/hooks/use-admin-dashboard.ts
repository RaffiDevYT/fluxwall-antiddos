"use client";

import React, { useState, useEffect, useCallback } from "react";
import { translations, Language } from "@/lib/i18n";
import { NavSection } from "@/components/views/sidebar-nav";

export interface HealthData {
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

export interface BanItem {
  ip: string;
  remaining_ttl: number;
  reason: string;
}

export interface LogEvent {
  id: string;
  time: number;
  time_formatted?: string;
  client_ip: string;
  event: string;
  reason?: string;
  uri?: string;
}

export interface IpLookupResult {
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

export interface AdminUserItem {
  id: string;
  username: string;
  role: "super_admin" | "security_analyst" | "auditor";
  created_at: string;
}

export interface CustomWafRule {
  id: string;
  name: string;
  field: "uri" | "user_agent" | "header" | "query";
  operator: "contains" | "equals" | "regex";
  value: string;
  action: "DROP" | "CHALLENGE" | "LOG";
  enabled: boolean;
  created_at: string;
}

export interface UpstreamServer {
  id: string;
  host: string;
  port: number;
  protocol: "http" | "https";
  weight: number;
  status: "healthy" | "degraded" | "down";
  latency_ms: number;
  last_checked: string;
}

export interface SslDomain {
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

export interface SimulationReport {
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

export function useAdminDashboard() {
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
    confirmLabel?: string;
    cancelLabel?: string;
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

  

  return {
    lang,
    t,
    stats,
    currentNav,
    setCurrentNav,
    mobileMenuOpen,
    setMobileMenuOpen,
    collapsedSections,
    toggleSection,
    underAttackMode,
    health,
    showHealthModal,
    setShowHealthModal,
    bans,
    whitelist,
    blacklist,
    blockedCountries,
    liveLogs,
    adminUsers,
    customWafRules,
    upstreams,
    lbAlgorithm,
    setLbAlgorithm,
    sslDomains,
    confirmDialog,
    setConfirmDialog,
    banIp,
    setBanIp,
    banDuration,
    setBanDuration,
    whitelistIp,
    setWhitelistIp,
    blacklistIp,
    setBlacklistIp,
    newCountryCode,
    setNewCountryCode,
    rateLimitGeneral,
    setRateLimitGeneral,
    rateLimitBurst,
    setRateLimitBurst,
    ruleName,
    setRuleName,
    ruleField,
    setRuleField,
    ruleOp,
    setRuleOp,
    ruleVal,
    setRuleVal,
    ruleAction,
    setRuleAction,
    newUpsHost,
    setNewUpsHost,
    newUpsPort,
    setNewUpsPort,
    newUpsProtocol,
    setNewUpsProtocol,
    newUpsWeight,
    setNewUpsWeight,
    newDomain,
    setNewDomain,
    newIssuer,
    setNewIssuer,
    newUsername,
    setNewUsername,
    newUserPassword,
    setNewUserPassword,
    newUserRole,
    setNewUserRole,
    profileApiKey,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showApiKey,
    setShowApiKey,
    lookupTargetIp,
    setLookupTargetIp,
    lookupLoading,
    lookupResult,
    chartLabels,
    chartPoints,
    simVector,
    setSimVector,
    simIntensity,
    setSimIntensity,
    simRunning,
    simReport,
    searchFilter,
    setSearchFilter,
    threatVectorData,
    topCountriesData,
    handleLogout,
    changeLanguage,
    toggleUnderAttackMode,
    fetchHealth,
    handleNavSelect,
    openConfirm,
    showToast,
    handleManualBan,
    handleUnban,
    handleAddWhitelist,
    handleRemoveWhitelist,
    handleAddBlacklist,
    handleRemoveBlacklist,
    handleAddCountry,
    handleRemoveCountry,
    handleCreateCustomRule,
    handleDeleteCustomRule,
    handleAddUpstream,
    handleDeleteUpstream,
    handleAddDomain,
    handleDeleteDomain,
    handleToggleSslFlag,
    handleIssueLetsEncrypt,
    handleExecuteLookup,
    handleAddUser,
    handleDeleteUser,
    handleRegenerateApiKey,
    handleChangePassword,
    handleLaunchSimulation,
    handleGatewayAction,
    exportLogsAsJson,
  };
}
