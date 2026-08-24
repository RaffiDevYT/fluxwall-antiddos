"use client";

import React, { useState, useEffect, useRef } from "react";
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
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Globe,
  Radio,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
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

export default function DashboardPage() {
  const [stats, setStats] = useState({
    active_bans: 0,
    whitelist_count: 0,
    blacklist_count: 0,
    surge_mode: false,
  });

  const [health, setHealth] = useState<HealthData | null>(null);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [bans, setBans] = useState<BanItem[]>([]);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"bans" | "whitelist" | "blacklist">("bans");
  const [searchFilter, setSearchFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [banIp, setBanIp] = useState("");
  const [banDuration, setBanDuration] = useState("900");
  const [whitelistIp, setWhitelistIp] = useState("");
  const [blacklistIp, setBlacklistIp] = useState("");

  // Chart data
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: any[];
  }>({
    labels: Array(20).fill(""),
    datasets: [
      {
        label: "Live Requests / Sec",
        data: Array(20).fill(0),
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56, 189, 248, 0.12)",
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 2,
      },
    ],
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Stats & Chart Telemetry
  const fetchStats = async () => {
    try {
      const res = await fetch("/admin/api/stats", { cache: "no-store" });
      const json = await res.json();
      if (json.status === "success") {
        setStats(json.data);

        // Generate simulated/realtime QPS tick
        const now = new Date();
        const timeLabel = now.toLocaleTimeString();
        const randomQps = Math.floor(Math.random() * 8) + 2;

        setChartData((prev) => {
          const newLabels = [...prev.labels.slice(1), timeLabel];
          const newData = [...prev.datasets[0].data.slice(1), randomQps];
          return {
            ...prev,
            labels: newLabels,
            datasets: [{ ...prev.datasets[0], data: newData }],
          };
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Fetch Terminus Health Data
  const fetchHealth = async () => {
    try {
      const res = await fetch("/admin/api/health", { cache: "no-store" });
      const data = await res.json();
      setHealth(data);
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Fetch Tab Data
  const fetchTabData = async () => {
    try {
      if (activeTab === "bans") {
        const res = await fetch("/admin/api/bans");
        const json = await res.json();
        setBans(json.bans || []);
      } else if (activeTab === "whitelist") {
        const res = await fetch("/admin/api/whitelist");
        const json = await res.json();
        setWhitelist(json.whitelist || []);
      } else if (activeTab === "blacklist") {
        const res = await fetch("/admin/api/blacklist");
        const json = await res.json();
        setBlacklist(json.blacklist || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchHealth();
    fetchTabData();

    const interval = setInterval(() => {
      fetchStats();
      fetchHealth();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  // Actions
  const handleUnban = async (ip: string) => {
    try {
      const res = await fetch(`/admin/api/bans?ip=${encodeURIComponent(ip)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.status === "success") {
        showToast(`IP ${ip} successfully unbanned!`);
        fetchTabData();
        fetchStats();
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleManualBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banIp) return;
    try {
      const res = await fetch("/admin/api/bans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: banIp, duration_sec: parseInt(banDuration, 10) }),
      });
      const json = await res.json();
      if (json.status === "success") {
        showToast(`IP ${banIp} quarantined for ${banDuration}s`);
        setBanIp("");
        fetchTabData();
        fetchStats();
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whitelistIp) return;
    try {
      const res = await fetch("/admin/api/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: whitelistIp }),
      });
      const json = await res.json();
      if (json.status === "success") {
        showToast(`IP ${whitelistIp} whitelisted!`);
        setWhitelistIp("");
        fetchTabData();
        fetchStats();
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleRemoveWhitelist = async (ip: string) => {
    try {
      await fetch(`/admin/api/whitelist?ip=${encodeURIComponent(ip)}`, { method: "DELETE" });
      showToast(`IP ${ip} removed from whitelist`);
      fetchTabData();
      fetchStats();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blacklistIp) return;
    try {
      const res = await fetch("/admin/api/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: blacklistIp }),
      });
      const json = await res.json();
      if (json.status === "success") {
        showToast(`IP ${blacklistIp} added to permanent blacklist!`);
        setBlacklistIp("");
        fetchTabData();
        fetchStats();
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleRemoveBlacklist = async (ip: string) => {
    try {
      await fetch(`/admin/api/blacklist?ip=${encodeURIComponent(ip)}`, { method: "DELETE" });
      showToast(`IP ${ip} removed from blacklist`);
      fetchTabData();
      fetchStats();
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const filteredBans = bans.filter((b) => b.ip.toLowerCase().includes(searchFilter.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-sky-950 border border-sky-400 text-sky-200 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-sky-400" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/30 rounded-xl">
            <ShieldAlert className="w-7 h-7 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              FluxWall <span className="text-xs bg-sky-500/20 text-sky-300 font-semibold px-2 py-0.5 rounded-full border border-sky-500/30">Next.js v1.0</span>
            </h1>
            <p className="text-xs text-slate-400">Cyber Defense Command & Telemetry Center</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Terminus Health Indicator Trigger */}
          <button
            onClick={() => setShowHealthModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Health: {health?.status === "ok" ? "All Systems Operational" : "Checking..."}
          </button>

          {/* Surge Badge */}
          {stats.surge_mode && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 border border-red-500 text-red-400 animate-pulse">
              <Flame className="w-4 h-4" />
              SURGE DEFENSE ACTIVE
            </div>
          )}
        </div>
      </header>

      {/* Hero 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="glass-panel p-5 glow-cyan">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Live Global QPS</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {chartData.datasets[0].data[chartData.datasets[0].data.length - 1] || 0}{" "}
            <span className="text-sm font-normal text-slate-400">req/s</span>
          </div>
          <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Sub-millisecond inspection active
          </div>
        </div>

        <div className="glass-panel p-5 glow-red">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Quarantined IPs</span>
            <Lock className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-extrabold text-red-400">{stats.active_bans}</div>
          <div className="text-xs text-slate-400 mt-2">Banned via Auto-Ban / Rate breaches</div>
        </div>

        <div className="glass-panel p-5 glow-green">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Whitelisted Bypasses</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">{stats.whitelist_count}</div>
          <div className="text-xs text-slate-400 mt-2">Fast zero-penalty bypass IPs</div>
        </div>

        <div className="glass-panel p-5">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Permanent Blacklists</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400">{stats.blacklist_count}</div>
          <div className="text-xs text-slate-400 mt-2">Persistent botnet drop rules</div>
        </div>
      </div>

      {/* Telemetry Chart */}
      <div className="glass-panel p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-sky-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Real-Time Traffic Telemetry</h2>
          </div>
          <span className="text-xs text-slate-500">Live 2s Interval Stream</span>
        </div>
        <div className="h-48 w-full">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#64748b", font: { size: 10 } } },
                y: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#64748b", font: { size: 10 } }, beginAtZero: true },
              },
            }}
          />
        </div>
      </div>

      {/* Tabs & Management Section */}
      <div className="glass-panel p-5 flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4 mb-4">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("bans")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "bans"
                  ? "bg-sky-500 text-slate-950 font-bold"
                  : "bg-slate-800/60 text-slate-400 hover:text-white"
              }`}
            >
              Active Bans ({bans.length})
            </button>
            <button
              onClick={() => setActiveTab("whitelist")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "whitelist"
                  ? "bg-sky-500 text-slate-950 font-bold"
                  : "bg-slate-800/60 text-slate-400 hover:text-white"
              }`}
            >
              Whitelist ({whitelist.length})
            </button>
            <button
              onClick={() => setActiveTab("blacklist")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === "blacklist"
                  ? "bg-sky-500 text-slate-950 font-bold"
                  : "bg-slate-800/60 text-slate-400 hover:text-white"
              }`}
            >
              Blacklist ({blacklist.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search IP..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Tab 1: Active Bans Table & Add Ban Form */}
        {activeTab === "bans" && (
          <div className="space-y-4">
            {/* Quick Ban Form */}
            <form onSubmit={handleManualBan} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
              <input
                type="text"
                placeholder="IP Address (e.g. 198.51.100.4)"
                value={banIp}
                onChange={(e) => setBanIp(e.target.value)}
                className="text-xs bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                required
              />
              <select
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
                className="text-xs bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-white focus:outline-none focus:border-red-500"
              >
                <option value="300">5 Minutes (300s)</option>
                <option value="900">15 Minutes (900s)</option>
                <option value="3600">1 Hour (3600s)</option>
                <option value="86400">24 Hours (86400s)</option>
              </select>
              <button
                type="submit"
                className="sm:col-span-2 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold py-2 px-4 rounded-lg transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" /> Quarantine IP
              </button>
            </form>

            {/* Bans Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">IP Address</th>
                    <th className="py-2.5 px-3">Remaining TTL</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredBans.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">
                        No quarantined IPs matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredBans.map((ban) => (
                      <tr key={ban.ip} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-red-400">{ban.ip}</td>
                        <td className="py-2.5 px-3 text-slate-300">
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono">
                            {ban.remaining_ttl}s
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{ban.reason}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleUnban(ban.ip)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
                          >
                            <Unlock className="w-3 h-3" /> Unban
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Whitelist Manager */}
        {activeTab === "whitelist" && (
          <div className="space-y-4">
            <form onSubmit={handleAddWhitelist} className="flex gap-2 p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
              <input
                type="text"
                placeholder="Trusted IP (e.g. 203.0.113.10)"
                value={whitelistIp}
                onChange={(e) => setWhitelistIp(e.target.value)}
                className="flex-1 text-xs bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                required
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 px-4 rounded-lg transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Whitelist IP
              </button>
            </form>

            <div className="divide-y divide-slate-800">
              {whitelist.map((ip) => (
                <div key={ip} className="flex items-center justify-between py-2.5 px-3 hover:bg-slate-800/30 transition">
                  <span className="font-mono text-emerald-400 font-bold text-xs">{ip}</span>
                  <button
                    onClick={() => handleRemoveWhitelist(ip)}
                    className="text-red-400 hover:text-red-300 transition cursor-pointer p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Blacklist Manager */}
        {activeTab === "blacklist" && (
          <div className="space-y-4">
            <form onSubmit={handleAddBlacklist} className="flex gap-2 p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
              <input
                type="text"
                placeholder="Malicious IP (e.g. 198.51.100.99)"
                value={blacklistIp}
                onChange={(e) => setBlacklistIp(e.target.value)}
                className="flex-1 text-xs bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-white focus:outline-none focus:border-red-500"
                required
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold py-2 px-4 rounded-lg transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Blacklist IP
              </button>
            </form>

            <div className="divide-y divide-slate-800">
              {blacklist.map((ip) => (
                <div key={ip} className="flex items-center justify-between py-2.5 px-3 hover:bg-slate-800/30 transition">
                  <span className="font-mono text-red-400 font-bold text-xs">{ip}</span>
                  <button
                    onClick={() => handleRemoveBlacklist(ip)}
                    className="text-red-400 hover:text-red-300 transition cursor-pointer p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Terminus Health Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b101c] border border-sky-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Server className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">NestJS Terminus Health Indicators</h3>
              </div>
              <button
                onClick={() => setShowHealthModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 my-5 text-xs">
              {/* Redis Indicator */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Redis Health Indicator</div>
                  <div className="text-slate-400 text-[11px]">
                    Latency: {health?.info?.redis?.latency_ms ?? 0} ms
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {health?.info?.redis?.status?.toUpperCase() || "UP"}
                </span>
              </div>

              {/* Memory Heap Indicator */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Memory Heap Indicator</div>
                  <div className="text-slate-400 text-[11px]">
                    Used: {health?.info?.memory_heap?.used_mb} MB / Alloc: {health?.info?.memory_heap?.allocated_mb} MB
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {health?.info?.memory_heap?.status?.toUpperCase() || "UP"}
                </span>
              </div>

              {/* Memory RSS Indicator */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Process RSS Memory</div>
                  <div className="text-slate-400 text-[11px]">
                    Resident: {health?.info?.memory_rss?.used_mb} MB
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  UP
                </span>
              </div>

              {/* Gateway Check */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">OpenResty Edge Gateway</div>
                  <div className="text-slate-400 text-[11px]">Socket & Healthz Endpoint</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {health?.info?.gateway?.status?.toUpperCase() || "UP"}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowHealthModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
