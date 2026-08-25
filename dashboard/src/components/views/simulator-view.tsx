"use client";

import React from "react";
import { Crosshair, Send, ServerCrash } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SimulatorViewProps {
  t: any;
  simVector: string;
  setSimVector: (v: string) => void;
  simIntensity: string;
  setSimIntensity: (v: string) => void;
  simRunning: boolean;
  handleLaunchSimulation: () => void;
  simReport: any;
}

export default function SimulatorView({
  t,
  simVector,
  setSimVector,
  simIntensity,
  setSimIntensity,
  simRunning,
  handleLaunchSimulation,
  simReport,
}: SimulatorViewProps) {
  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-card/85 glow-primary">
        <CardHeader className="border-b border-border/80 pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-primary">
            <Crosshair className="w-4 h-4" /> {t.simTitle}
          </CardTitle>
          <CardDescription className="text-[11px]">{t.simDesc}</CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-6">
          {/* Simulation Controls Form */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sim-vector-select" className="text-xs font-semibold text-white block mb-1.5">
                  {t.simVectorLabel}
                </label>
                <select
                  id="sim-vector-select"
                  value={simVector}
                  onChange={(e) => setSimVector(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card/80 px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="http_flood">{t.simVectorHttpFlood}</option>
                  <option value="sql_probe">{t.simVectorSqlProbe}</option>
                  <option value="bad_bot">{t.simVectorBadBot}</option>
                  <option value="pow_challenge">{t.simVectorPowChallenge}</option>
                </select>
              </div>

              <div>
                <label htmlFor="sim-intensity-select" className="text-xs font-semibold text-white block mb-1.5">
                  {t.simDurationLabel}
                </label>
                <select
                  id="sim-intensity-select"
                  value={simIntensity}
                  onChange={(e) => setSimIntensity(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card/80 px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="25">Light Test: 25 requests</option>
                  <option value="50">Standard Burst: 50 requests</option>
                  <option value="100">Intense Flood: 100 requests</option>
                  <option value="200">Stress Spike: 200 requests</option>
                </select>
              </div>
            </div>

            <Button
              variant="cyber"
              onClick={handleLaunchSimulation}
              disabled={simRunning}
              aria-label="Launch Attack Simulation"
              className="w-full sm:w-auto text-xs font-bold gap-2"
            >
              <Send className={`w-3.5 h-3.5 ${simRunning ? "animate-spin" : ""}`} />
              {simRunning ? t.simRunning : t.btnLaunchSim}
            </Button>
          </div>

          {/* Simulation Results Report */}
          {simReport && (
            <div className="p-5 rounded-xl bg-[#090d16] border border-primary/30 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                <div className="flex items-center gap-2">
                  <ServerCrash className="w-5 h-5 text-primary" />
                  <span className="font-bold text-sm text-white">{t.simResultsTitle}</span>
                </div>
                <Badge variant="default" className="font-mono text-xs">
                  {simReport.deflection_rate} DEFLECTED
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-secondary/30 rounded-lg border border-primary/10">
                  <div className="text-[10px] text-muted-foreground">{t.simTotalSent}</div>
                  <div className="text-base font-black text-white mt-0.5">{simReport.total_packets} reqs</div>
                </div>

                <div className="p-3 bg-secondary/30 rounded-lg border border-primary/10">
                  <div className="text-[10px] text-muted-foreground">{t.simDeflected}</div>
                  <div className="text-base font-black text-primary mt-0.5">{simReport.packets_blocked} dropped</div>
                </div>

                <div className="p-3 bg-secondary/30 rounded-lg border border-primary/10">
                  <div className="text-[10px] text-muted-foreground">{t.simAvgLatency}</div>
                  <div className="text-base font-black text-emerald-400 mt-0.5">{simReport.avg_packet_latency_ms}</div>
                </div>

                <div className="p-3 bg-secondary/30 rounded-lg border border-primary/10">
                  <div className="text-[10px] text-muted-foreground">{t.simDeflectionRate}</div>
                  <div className="text-base font-black text-primary mt-0.5">{simReport.deflection_rate}</div>
                </div>
              </div>

              <div className="p-3 bg-[#070a12] rounded-lg border border-primary/20 font-mono text-xs text-muted-foreground">
                <span className="text-primary font-bold">Defense Reaction: </span>
                {simReport.mitigation_reason}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
