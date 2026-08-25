"use client";

import React, { useState } from "react";
import { Lock, Unlock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface BansViewProps {
  t: any;
  bans: any[];
  onManualBan: (ip: string, duration: number, reason: string) => void;
  onUnban: (ip: string) => void;
}

export default function BansView({ t, bans, onManualBan, onUnban }: BansViewProps) {
  const [banIp, setBanIp] = useState("");
  const [banDuration, setBanDuration] = useState("600");
  const [banReason, setBanReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!banIp) return;
    onManualBan(banIp, parseInt(banDuration, 10), banReason || "Manual Ban via Dashboard");
    setBanIp("");
    setBanReason("");
  };

  return (
    <Card className="border-primary/20 bg-card/85">
      <CardHeader className="border-b border-border/80 pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" /> {t.bansTitle}
        </CardTitle>
        <CardDescription className="text-[11px]">{t.bansDesc}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-6">
        {/* Manual Ban Form */}
        <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-3">
          <div className="text-xs font-bold text-white">{t.btnAddBan}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Target IP</label>
              <Input
                placeholder="e.g. 198.51.100.4"
                value={banIp}
                onChange={(e) => setBanIp(e.target.value)}
                required
                className="text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Duration</label>
              <select
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-card/80 px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="300">5 Minutes</option>
                <option value="600">10 Minutes</option>
                <option value="3600">1 Hour</option>
                <option value="86400">24 Hours</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Reason</label>
              <Input
                placeholder="e.g. Hostile Scanner"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <Button type="submit" variant="destructive" className="text-xs font-bold gap-1.5 mt-2">
            <Plus className="w-3.5 h-3.5" /> Enforce Ban
          </Button>
        </form>

        {/* Active Bans Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
              <tr>
                <th className="py-2.5 px-4">{t.tableIp}</th>
                <th className="py-2.5 px-4">{t.tableReason}</th>
                <th className="py-2.5 px-4">Expires In</th>
                <th className="py-2.5 px-4 text-right">{t.tableAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {bans.map((b) => (
                <tr key={b.ip} className="hover:bg-accent/40 transition">
                  <td className="py-2.5 px-4 text-sky-400 font-semibold">{b.ip}</td>
                  <td className="py-2.5 px-4 text-muted-foreground font-sans">{b.reason || "Automatic Protection"}</td>
                  <td className="py-2.5 px-4 text-destructive font-bold">{b.remaining_ttl}s</td>
                  <td className="py-2.5 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUnban(b.ip)}
                      className="text-xs h-7 gap-1 border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Unlock className="w-3 h-3" /> Unban
                    </Button>
                  </td>
                </tr>
              ))}
              {bans.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground font-sans">
                    {t.noBansActive}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
