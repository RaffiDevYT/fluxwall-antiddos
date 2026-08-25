"use client";

import React from "react";
import dynamic from "next/dynamic";
import { PieChart, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

interface AnalyticsViewProps {
  t: any;
  threatVectorData: any;
  topCountriesData: any;
}

export default function AnalyticsView({ t, threatVectorData, topCountriesData }: AnalyticsViewProps) {
  return (
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
  );
}
