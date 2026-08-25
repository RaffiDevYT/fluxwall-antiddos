"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Activity, Zap, Lock, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TelemetryChart = dynamic(() => import("@/components/charts/telemetry-chart"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full flex items-center justify-center bg-secondary/10 rounded-xl border border-primary/20 animate-pulse">
      <span className="text-xs text-muted-foreground font-mono">Loading Real-Time QPS Canvas...</span>
    </div>
  ),
});

interface OverviewViewProps {
  stats: any;
  t: any;
  liveLogs: any[];
  onSelectNav: (nav: any) => void;
}

export default function OverviewView({ stats, t, liveLogs, onSelectNav }: OverviewViewProps) {
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);

  useEffect(() => {
    const now = new Date().toLocaleTimeString([], { hour12: false });
    setChartLabels((prev) => [...prev.slice(-19), now]);
    setChartData((prev) => [...prev.slice(-19), stats.live_qps || 0]);
  }, [stats.live_qps]);

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
              {stats.live_qps} <span className="text-xs font-normal text-muted-foreground">req/sec</span>
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
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-destructive">{stats.threats_total}</div>
            <p className="text-[11px] text-muted-foreground mt-1">{t.statThreatsSub}</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Chart Section */}
      <Card className="border-primary/20 bg-card/85 p-4">
        <CardHeader className="pb-2 px-0 pt-0">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Live Traffic QPS & Surge Telemetry
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TelemetryChart labels={chartLabels} dataPoints={chartData} label="Incoming QPS" />
        </CardContent>
      </Card>

      {/* Recent Blocked Attacks Table */}
      <Card className="border-primary/20 bg-card/85">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-wider">{t.liveAttackEvents}</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">{t.liveAttackEventsSub}</p>
          </div>
          <button
            onClick={() => onSelectNav("logs")}
            className="text-xs text-primary hover:underline font-semibold cursor-pointer"
          >
            {t.viewAllLogs}
          </button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                <tr>
                  <th className="py-2.5 px-3">{t.tableTime}</th>
                  <th className="py-2.5 px-3">{t.tableIp}</th>
                  <th className="py-2.5 px-3">{t.tableEvent}</th>
                  <th className="py-2.5 px-3">{t.tableTargetUri}</th>
                  <th className="py-2.5 px-3 text-right">{t.tableAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {liveLogs.slice(0, 5).map((log) => (
                  <tr key={log.id} className="hover:bg-accent/40 transition">
                    <td className="py-2.5 px-3 text-muted-foreground text-[11px]">{log.time_formatted || "Just now"}</td>
                    <td className="py-2.5 px-3 text-sky-400 font-semibold">{log.client_ip}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="destructive" className="text-[9px] py-0">
                        {log.event}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[150px]">{log.uri || "/"}</td>
                    <td className="py-2.5 px-3 text-right">
                      <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive">
                        BLOCKED
                      </Badge>
                    </td>
                  </tr>
                ))}
                {liveLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground font-sans">
                      {t.noEventsLogged}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
