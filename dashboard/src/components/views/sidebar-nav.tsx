"use client";

import React from "react";
import {
  LayoutDashboard,
  ShieldAlert,
  MapPin,
  Terminal,
  PieChart,
  Crosshair,
  Radio,
  Fingerprint,
  Lock,
  ShieldCheck,
  Ban,
  Globe,
  Shield,
  Gauge,
  Server,
  Layers,
  Users,
  Key,
  Wrench,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type NavSection =
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

interface SidebarNavProps {
  currentNav: NavSection;
  onSelectNav: (nav: NavSection) => void;
  t: any;
  collapsedSections: Record<string, boolean>;
  onToggleSection: (sec: string) => void;
  counts: {
    forensics: number;
    logs: number;
    bans: number;
    whitelist: number;
    blacklist: number;
    blockedCountries: number;
    customWafRules: number;
    upstreams: number;
    sslDomains: number;
    adminUsers: number;
  };
}

export default function SidebarNav({
  currentNav,
  onSelectNav,
  t,
  collapsedSections,
  onToggleSection,
  counts,
}: SidebarNavProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Section 1: Monitoring & Telemetry */}
      <div>
        <button
          type="button"
          onClick={() => onToggleSection("monitoring")}
          className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-muted-foreground hover:text-white uppercase tracking-wider transition mb-1 cursor-pointer rounded-md hover:bg-secondary/20"
        >
          <span>{t.navMonitoring}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              collapsedSections.monitoring ? "-rotate-90 text-muted-foreground" : "rotate-0 text-primary"
            }`}
          />
        </button>
        {!collapsedSections.monitoring && (
          <div className="space-y-1 animate-in fade-in-50 duration-150">
            <button
              onClick={() => onSelectNav("overview")}
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
              onClick={() => onSelectNav("forensics")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentNav === "forensics"
                  ? "bg-red-500/20 text-white border border-red-500/40 shadow-sm"
                  : "text-muted-foreground hover:text-white hover:bg-red-500/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
                <span className="text-red-300 font-bold">{t.navForensics}</span>
              </div>
              <Badge variant="destructive" className="text-[8px] py-0 px-1 font-black bg-red-500/30 text-red-300">
                SOC
              </Badge>
            </button>

            <button
              onClick={() => onSelectNav("threat_map")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentNav === "threat_map"
                  ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                  : "text-muted-foreground hover:text-white hover:bg-primary/5"
              }`}
            >
              <MapPin className="w-4 h-4 text-primary animate-pulse" />
              <span>{t.navThreatMap}</span>
            </button>

            <button
              onClick={() => onSelectNav("packet_stream")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentNav === "packet_stream"
                  ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                  : "text-muted-foreground hover:text-white hover:bg-primary/5"
              }`}
            >
              <Terminal className="w-4 h-4 text-primary" />
              <span>{t.navPacketInspector}</span>
            </button>

            <button
              onClick={() => onSelectNav("analytics")}
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
              onClick={() => onSelectNav("simulator")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentNav === "simulator"
                  ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                  : "text-muted-foreground hover:text-white hover:bg-primary/5"
              }`}
            >
              <Crosshair className="w-4 h-4 text-primary" />
              <span>{t.navSimulator}</span>
            </button>

            <button
              onClick={() => onSelectNav("logs")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentNav === "logs"
                  ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                  : "text-muted-foreground hover:text-white hover:bg-primary/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Radio className="w-4 h-4 text-primary" />
                <span>{t.navAttackLogs}</span>
              </div>
              <Badge variant="outline" className="text-[9px] border-primary/30 text-primary py-0">
                {counts.logs}
              </Badge>
            </button>
          </div>
        )}
      </div>

      {/* Section 2: Security Policies (Collapsible Dropdown Accordion) */}
      <div>
        <button
          type="button"
          onClick={() => onToggleSection("policies")}
          className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-muted-foreground hover:text-white uppercase tracking-wider transition mb-1 cursor-pointer rounded-md hover:bg-secondary/20"
        >
          <span>{t.navPolicies}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              collapsedSections.policies ? "-rotate-90 text-muted-foreground" : "rotate-0 text-primary"
            }`}
          />
        </button>
        {!collapsedSections.policies && (
          <div className="space-y-1 animate-in fade-in-50 duration-150">
            <button
              onClick={() => onSelectNav("lookup")}
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
              onClick={() => onSelectNav("bans")}
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
                {counts.bans}
              </Badge>
            </button>

            <button
              onClick={() => onSelectNav("whitelist")}
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
                {counts.whitelist}
              </Badge>
            </button>

            <button
              onClick={() => onSelectNav("blacklist")}
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
                {counts.blacklist}
              </Badge>
            </button>

            <button
              onClick={() => onSelectNav("geoip")}
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
                {counts.blockedCountries}
              </Badge>
            </button>

            <button
              onClick={() => onSelectNav("custom_waf")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentNav === "custom_waf"
                  ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                  : "text-muted-foreground hover:text-white hover:bg-primary/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-primary" />
                <span>{t.navCustomWaf}</span>
              </div>
              <Badge variant="outline" className="text-[9px] border-primary/30 text-primary py-0">
                {counts.customWafRules}
              </Badge>
            </button>

            <button
              onClick={() => onSelectNav("waf")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentNav === "waf"
                  ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                  : "text-muted-foreground hover:text-white hover:bg-primary/5"
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-primary" />
              <span>{t.navWaf}</span>
            </button>

            <button
              onClick={() => onSelectNav("ratelimits")}
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
        )}
      </div>

      {/* Section 3: Infrastructure & Edge */}
      <div>
        <button
          type="button"
          onClick={() => onToggleSection("edge")}
          className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-muted-foreground hover:text-white uppercase tracking-wider transition mb-1 cursor-pointer rounded-md hover:bg-secondary/20"
        >
          <span>{t.navInfrastructure}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              collapsedSections.edge ? "-rotate-90 text-muted-foreground" : "rotate-0 text-primary"
            }`}
          />
        </button>
        {!collapsedSections.edge && (
          <div className="space-y-1 animate-in fade-in-50 duration-150">
            <button
              onClick={() => onSelectNav("upstreams")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentNav === "upstreams"
                  ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                  : "text-muted-foreground hover:text-white hover:bg-primary/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Server className="w-4 h-4 text-primary" />
                <span>{t.navUpstreams}</span>
              </div>
              <Badge variant="outline" className="text-[9px] border-primary/30 text-primary py-0">
                {counts.upstreams}
              </Badge>
            </button>

            <button
              onClick={() => onSelectNav("ssl")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentNav === "ssl"
                  ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                  : "text-muted-foreground hover:text-white hover:bg-primary/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-primary" />
                <span>{t.navSsl}</span>
              </div>
              <Badge variant="outline" className="text-[9px] border-primary/30 text-primary py-0">
                {counts.sslDomains}
              </Badge>
            </button>
          </div>
        )}
      </div>

      {/* Section 4: Access & Administration */}
      <div>
        <button
          type="button"
          onClick={() => onToggleSection("admin")}
          className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-muted-foreground hover:text-white uppercase tracking-wider transition mb-1 cursor-pointer rounded-md hover:bg-secondary/20"
        >
          <span>{t.navAdministration}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              collapsedSections.admin ? "-rotate-90 text-muted-foreground" : "rotate-0 text-primary"
            }`}
          />
        </button>
        {!collapsedSections.admin && (
          <div className="space-y-1 animate-in fade-in-50 duration-150">
            <button
              onClick={() => onSelectNav("users")}
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
                {counts.adminUsers}
              </Badge>
            </button>

            <button
              onClick={() => onSelectNav("profile")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentNav === "profile"
                  ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                  : "text-muted-foreground hover:text-white hover:bg-primary/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-primary" />
                <span>{t.navProfile}</span>
              </div>
              <Badge variant="outline" className="text-[9px] border-primary/30 text-primary py-0">
                Active
              </Badge>
            </button>

            <button
              onClick={() => onSelectNav("maintenance")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentNav === "maintenance"
                  ? "bg-primary/20 text-white border border-primary/40 shadow-sm"
                  : "text-muted-foreground hover:text-white hover:bg-primary/5"
              }`}
            >
              <Wrench className="w-4 h-4 text-primary" />
              <span>{t.navMaintenance}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
