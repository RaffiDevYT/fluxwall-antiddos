"use client";

import React from "react";
import { Crosshair, Play, StopCircle, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SimulatorViewProps {
  t: any;
  simRunning: boolean;
  simVector: string;
  setSimVector: (v: string) => void;
  simIntensity: number;
  setSimIntensity: (i: number) => void;
  onStartSim: () => void;
  onStopSim: () => void;
  simPackets: any[];
}

export default function SimulatorView({
  t,
  simRunning,
  simVector,
  setSimVector,
  simIntensity,
  setSimIntensity,
  onStartSim,
  onStopSim,
  simPackets,
}: SimulatorViewProps) {
  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-card/85">
        <CardHeader className="border-b border-border/80 pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-primary" /> {t.simulatorTitle}
          </CardTitle>
          <CardDescription className="text-[11px]">{t.simulatorDesc}</CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  {t.simVectorLabel}
                </label>
                <select
                  value={simVector}
                  onChange={(e) => setSimVector(e.target.value)}
                  disabled={simRunning}
                  className="w-full h-10 rounded-lg border border-input bg-card/80 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                >
                  <option value="canary_trap">{t.simVectorCanary}</option>
                  <option value="http_flood">{t.simVectorHttpFlood}</option>
                  <option value="slowloris">{t.simVectorSlowloris}</option>
                  <option value="sql_injection">{t.simVectorSqli}</option>
                  <option value="bad_bots">{t.simVectorBadBot}</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t.simIntensityLabel}
                  </label>
                  <span className="text-xs font-mono font-bold text-primary">
                    {simIntensity * 50} QPS
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={simIntensity}
                  onChange={(e) => setSimIntensity(Number(e.target.value))}
                  disabled={simRunning}
                  className="w-full accent-primary cursor-pointer disabled:opacity-50"
                />
              </div>

              <div className="pt-2">
                {!simRunning ? (
                  <Button
                    variant="cyber"
                    onClick={onStartSim}
                    className="w-full text-xs font-bold gap-2"
                  >
                    <Play className="w-4 h-4" /> {t.btnLaunchSim}
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={onStopSim}
                    className="w-full text-xs font-bold gap-2"
                  >
                    <StopCircle className="w-4 h-4" /> {t.btnStopSim}
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-black/40 p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-primary" /> {t.simTerminalStream}
                </span>
                <Badge
                  variant={simRunning ? "default" : "outline"}
                  className="text-[9px] py-0 font-mono"
                >
                  {simRunning ? "SIMULATING" : "IDLE"}
                </Badge>
              </div>

              <div className="h-48 overflow-y-auto font-mono text-[11px] space-y-1.5 p-1">
                {simPackets.map((pkt) => (
                  <div
                    key={pkt.id}
                    className="flex items-center justify-between text-muted-foreground hover:text-white"
                  >
                    <span>[{pkt.time}]</span>
                    <span className="text-sky-400 font-semibold">{pkt.ip}</span>
                    <span className="text-destructive font-bold">{pkt.action}</span>
                  </div>
                ))}
                {simPackets.length === 0 && (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                    {t.simWaiting}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
