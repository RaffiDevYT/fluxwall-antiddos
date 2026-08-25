"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Activity, Zap, Lock, ShieldCheck, Ban, Radio } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TelemetryChart = dynamic(() => import("@/components/charts/telemetry-chart"), {
  ssr: false,
  loading: () => (
    <div className="h-56 w-full flex items-center justify-center bg-secondary/10 rounded-xl border border-primary/10">
      <span className="text-xs text-muted-foreground font-mono">Loading telemetry canvas...</span>
    </div>
  ),
});

interface OverviewViewProps {
  stats: any;
  t: any;
  chartLabels: string[];
  chartPoints: number[];
  banIp: string;
  setBanIp: (v: string) => void;
  banDuration: string;
  setBanDuration: (v: string) => void;
  handleManualBan: (e: React.FormEvent) => void;
}

export default function OverviewView({
  stats,
  t,
  chartLabels,
  chartPoints,
  banIp,
  setBanIp,
  banDuration,
  setBanDuration,
  handleManualBan,
}: OverviewViewProps) {
  return (
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
                <label htmlFor="quick-ban-ip" className="text-[11px] font-medium text-muted-foreground block mb-1">
                  {t.targetIp}
                </label>
                <Input
                  id="quick-ban-ip"
                  placeholder="e.g. 198.51.100.44"
                  value={banIp}
                  onChange={(e) => setBanIp(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="quick-ban-duration" className="text-[11px] font-medium text-muted-foreground block mb-1">
                  {t.banDuration}
                </label>
                <select
                  id="quick-ban-duration"
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
              <Button type="submit" variant="cyber" className="w-full mt-2 gap-2 font-bold" aria-label="Execute Quick IP Quarantine">
                <Ban className="w-3.5 h-3.5" /> {t.executeBan}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
