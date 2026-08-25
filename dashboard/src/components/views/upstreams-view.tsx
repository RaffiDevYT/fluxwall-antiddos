"use client";

import React, { useState } from "react";
import { Server, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface UpstreamsViewProps {
  t: any;
  upstreams: any[];
  onAddUpstream: (target: string, port: number, weight: number) => void;
  onDeleteUpstream: (id: string) => void;
}

export default function UpstreamsView({ t, upstreams, onAddUpstream, onDeleteUpstream }: UpstreamsViewProps) {
  const [targetHost, setTargetHost] = useState("");
  const [targetPort, setTargetPort] = useState("80");
  const [targetWeight, setTargetWeight] = useState("1");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetHost) return;
    onAddUpstream(targetHost, parseInt(targetPort, 10), parseInt(targetWeight, 10));
    setTargetHost("");
  };

  return (
    <Card className="border-primary/20 bg-card/85">
      <CardHeader className="border-b border-border/80 pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" /> {t.upstreamsTitle}
        </CardTitle>
        <CardDescription className="text-[11px]">{t.upstreamsDesc}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-6">
        <form onSubmit={handleAdd} className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-3">
          <div className="text-xs font-bold text-white">{t.btnAddUpstream}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Target Host / IP</label>
              <Input
                placeholder="e.g. 10.0.0.5 or app-backend"
                value={targetHost}
                onChange={(e) => setTargetHost(e.target.value)}
                required
                className="text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Port</label>
              <Input
                type="number"
                value={targetPort}
                onChange={(e) => setTargetPort(e.target.value)}
                required
                className="text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Weight</label>
              <Input
                type="number"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                required
                className="text-xs font-mono"
              />
            </div>
          </div>
          <Button type="submit" variant="cyber" className="text-xs font-bold gap-1.5 mt-2">
            <Plus className="w-3.5 h-3.5" /> {t.btnAddUpstream}
          </Button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
              <tr>
                <th className="py-2.5 px-4">Upstream Target</th>
                <th className="py-2.5 px-4">Port</th>
                <th className="py-2.5 px-4">Weight</th>
                <th className="py-2.5 px-4">Health State</th>
                <th className="py-2.5 px-4 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {upstreams.map((ups) => (
                <tr key={ups.id} className="hover:bg-accent/40 transition">
                  <td className="py-2.5 px-4 text-white font-semibold">{ups.target}</td>
                  <td className="py-2.5 px-4 text-sky-400">{ups.port}</td>
                  <td className="py-2.5 px-4 text-muted-foreground">{ups.weight}</td>
                  <td className="py-2.5 px-4">
                    <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400">
                      HEALTHY
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteUpstream(ups.id)}
                      className="text-destructive hover:bg-destructive/10 text-xs h-7"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
