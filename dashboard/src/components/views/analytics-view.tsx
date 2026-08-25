"use client";

import React from "react";
import dynamic from "next/dynamic";

const ThreatVectorChart = dynamic(
  () => import("@/components/charts/analytics-charts").then((mod) => mod.ThreatVectorChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full flex items-center justify-center bg-secondary/10 rounded-xl border border-primary/20 animate-pulse">
        <span className="text-xs text-muted-foreground font-mono">Loading Threat Vector Canvas...</span>
      </div>
    ),
  }
);

const TopCountriesChart = dynamic(
  () => import("@/components/charts/analytics-charts").then((mod) => mod.TopCountriesChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full flex items-center justify-center bg-secondary/10 rounded-xl border border-primary/20 animate-pulse">
        <span className="text-xs text-muted-foreground font-mono">Loading Geographic Telemetry...</span>
      </div>
    ),
  }
);

interface AnalyticsViewProps {
  stats: any;
}

export default function AnalyticsView({ stats }: AnalyticsViewProps) {
  const vectorData = {
    labels: ["Bad Bots", "Rate Limited", "Geo-Blocked", "Signature WAF"],
    data: [
      stats.threats_breakdown?.bad_bot || 1,
      stats.threats_breakdown?.rate_limited || 1,
      stats.threats_breakdown?.geo_blocked || 1,
      Math.max(
        1,
        (stats.threats_total || 0) -
          (stats.threats_breakdown?.bad_bot || 0) -
          (stats.threats_breakdown?.rate_limited || 0) -
          (stats.threats_breakdown?.geo_blocked || 0)
      ),
    ],
  };

  const countryData = {
    labels: ["CN", "RU", "US", "ID", "DE", "BR"],
    data: [45, 30, 22, 18, 12, 8],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ThreatVectorChart vectorData={vectorData} />
        <TopCountriesChart countryData={countryData} />
      </div>
    </div>
  );
}
