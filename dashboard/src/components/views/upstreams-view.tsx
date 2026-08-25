"use client";

import React from "react";
import { Server, Plus, Trash2, CheckCircle2, Sliders } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface UpstreamsViewProps {
  t: any;
  upstreams: any[];
  newUpsHost: string;
  setNewUpsHost: (v: string) => void;
  newUpsPort: string;
  setNewUpsPort: (v: string) => void;
  newUpsProtocol: "http" | "https";
  setNewUpsProtocol: (v: "http" | "https") => void;
  newUpsWeight: string;
  setNewUpsWeight: (v: string) => void;
  handleAddUpstream: (e: React.FormEvent) => void;
  handleDeleteUpstream: (id: string) => void;
  }

export default function UpstreamsView({
  t,
  upstreams,
  newUpsHost,
  setNewUpsHost,
  newUpsPort,
  setNewUpsPort,
  newUpsProtocol,
  setNewUpsProtocol,
  newUpsWeight,
  setNewUpsWeight,
  handleAddUpstream,
  handleDeleteUpstream,
  }: UpstreamsViewProps) {
  return (
            <Card className="border-primary/20 bg-card/85">
              <CardHeader className="border-b border-border/80 pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary" /> {t.upstreamTitle}
                </CardTitle>
                <CardDescription className="text-[11px]">{t.upstreamDesc}</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                {/* Add Upstream Form */}
                <form onSubmit={handleAddUpstream} className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-3">
                  <div className="text-xs font-bold text-white">{t.btnAddUpstream}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label htmlFor="ups-host-input" className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t.upstreamHostLabel}
                      </label>
                      <Input
                        id="ups-host-input"
                        placeholder="e.g. 192.168.1.100"
                        value={newUpsHost}
                        onChange={(e) => setNewUpsHost(e.target.value)}
                        required
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label htmlFor="ups-port-input" className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t.upstreamPortLabel}
                      </label>
                      <Input
                        id="ups-port-input"
                        type="number"
                        placeholder="80"
                        value={newUpsPort}
                        onChange={(e) => setNewUpsPort(e.target.value)}
                        required
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label htmlFor="ups-protocol-select" className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t.upstreamProtocolLabel}
                      </label>
                      <select
                        id="ups-protocol-select"
                        value={newUpsProtocol}
                        onChange={(e: any) => setNewUpsProtocol(e.target.value)}
                        className="w-full h-9 rounded-lg border border-input bg-card/80 px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="http">HTTP</option>
                        <option value="https">HTTPS</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="ups-weight-input" className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t.upstreamWeightLabel}
                      </label>
                      <Input
                        id="ups-weight-input"
                        type="number"
                        placeholder="1"
                        value={newUpsWeight}
                        onChange={(e) => setNewUpsWeight(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="cyber" className="text-xs font-bold gap-1.5 mt-2" aria-label="Add upstream server">
                    <Plus className="w-3.5 h-3.5" /> {t.btnAddUpstream}
                  </Button>
                </form>

                {/* Upstream Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                      <tr>
                        <th className="py-3 px-4">{t.tableTarget}</th>
                        <th className="py-3 px-4">{t.tableHealth}</th>
                        <th className="py-3 px-4">{t.tableWeight}</th>
                        <th className="py-3 px-4">{t.tableLatency}</th>
                        <th className="py-3 px-4 text-right">{t.tableAction}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {upstreams.map((ups) => (
                        <tr key={ups.id} className="hover:bg-accent/40 transition">
                          <td className="py-3 px-4 font-mono font-bold text-white flex items-center gap-2">
                            <Server className="w-3.5 h-3.5 text-primary" />
                            <span>{ups.protocol}://{ups.host}:{ups.port}</span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="default" className="text-[10px]">
                              {t.statusHealthy}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-mono text-muted-foreground">weight: {ups.weight}</td>
                          <td className="py-3 px-4 font-mono text-emerald-400">{ups.latency_ms} ms</td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={`Delete upstream ${ups.host}`}
                              onClick={() => handleDeleteUpstream(ups.id)}
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