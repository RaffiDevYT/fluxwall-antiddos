"use client";

import React, { useState } from "react";
import { ShieldCheck, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface WhitelistViewProps {
  t: any;
  whitelist: string[];
  onAddWhitelist: (ip: string) => void;
  onRemoveWhitelist: (ip: string) => void;
}

export default function WhitelistView({ t, whitelist, onAddWhitelist, onRemoveWhitelist }: WhitelistViewProps) {
  const [wlIp, setWlIp] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wlIp) return;
    onAddWhitelist(wlIp);
    setWlIp("");
  };

  return (
    <Card className="border-primary/20 bg-card/85">
      <CardHeader className="border-b border-border/80 pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> {t.whitelistTitle}
        </CardTitle>
        <CardDescription className="text-[11px]">{t.whitelistDesc}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-6">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            placeholder={t.placeholderWhitelist}
            value={wlIp}
            onChange={(e) => setWlIp(e.target.value)}
            required
            className="text-xs font-mono"
          />
          <Button type="submit" variant="cyber" className="text-xs font-bold gap-1.5 px-4">
            <Plus className="w-3.5 h-3.5" /> {t.btnAddWhitelist}
          </Button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
              <tr>
                <th className="py-2.5 px-4">{t.tableIp}</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">{t.tableAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {whitelist.map((ip) => (
                <tr key={ip} className="hover:bg-accent/40 transition">
                  <td className="py-2.5 px-4 text-sky-400 font-semibold">{ip}</td>
                  <td className="py-2.5 px-4 text-emerald-400 font-sans font-bold text-[11px]">Bypasses Rate Limits & WAF</td>
                  <td className="py-2.5 px-4 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveWhitelist(ip)}
                      className="text-destructive hover:bg-destructive/10 text-xs h-7"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {whitelist.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted-foreground font-sans">
                    {t.noWhitelistedIps}
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
