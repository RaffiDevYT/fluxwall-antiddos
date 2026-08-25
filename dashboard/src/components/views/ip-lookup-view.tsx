"use client";

import React from "react";
import { Fingerprint, Search, Globe, Server, Shield, Lock, Unlock, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface IpLookupViewProps {
  t: any;
  lookupTargetIp: string;
  setLookupTargetIp: (ip: string) => void;
  lookupLoading: boolean;
  lookupResult: any;
  onExecuteLookup: (ip?: string) => void;
  onQuickBan: (ip: string) => void;
  onQuickUnban: (ip: string) => void;
  onAddBlacklist: (ip: string) => void;
}

export default function IpLookupView({
  t,
  lookupTargetIp,
  setLookupTargetIp,
  lookupLoading,
  lookupResult,
  onExecuteLookup,
  onQuickBan,
  onQuickUnban,
  onAddBlacklist,
}: IpLookupViewProps) {
  return (
    <Card className="border-primary/20 bg-card/85">
      <CardHeader className="border-b border-border/80 pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-primary" /> {t.ipIntelTitle}
        </CardTitle>
        <CardDescription className="text-[11px]">{t.ipIntelDesc}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onExecuteLookup();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder={t.placeholderIpIntel}
            value={lookupTargetIp}
            onChange={(e) => setLookupTargetIp(e.target.value)}
            required
            className="text-xs font-mono"
          />
          <Button type="submit" variant="cyber" disabled={lookupLoading} className="text-xs font-bold gap-1.5 px-4">
            <Search className="w-3.5 h-3.5" /> {lookupLoading ? "Inspecting..." : t.btnInspectIp}
          </Button>
        </form>

        {lookupResult && (
          <div className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-primary/20 pb-3 gap-2">
              <div>
                <span className="font-mono text-base font-bold text-white">{lookupResult.ip}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {lookupResult.geo?.city ? `${lookupResult.geo.city}, ${lookupResult.geo.country}` : lookupResult.geo?.country}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {lookupResult.defense_status?.is_banned ? (
                  <Badge variant="destructive" className="text-[10px]">
                    BANNED ({lookupResult.defense_status.ban_ttl_seconds}s TTL)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
                    CLEAN
                  </Badge>
                )}
                {lookupResult.defense_status?.is_blacklisted && (
                  <Badge variant="destructive" className="text-[10px]">
                    BLACKLISTED
                  </Badge>
                )}
                {lookupResult.defense_status?.is_whitelisted && (
                  <Badge variant="outline" className="text-[10px] border-sky-500/40 text-sky-400">
                    WHITELISTED
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/60 space-y-1">
                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-primary" /> {t.intelGeoOrigin}
                </div>
                <div className="font-semibold text-white">{lookupResult.geo?.country || "Unknown"}</div>
                <div className="text-[10px] text-muted-foreground">{lookupResult.geo?.region || "N/A"}</div>
              </div>

              <div className="p-3 rounded-lg bg-secondary/30 border border-border/60 space-y-1">
                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <Server className="w-3 h-3 text-primary" /> {t.intelNetworkAsn}
                </div>
                <div className="font-semibold text-white truncate">{lookupResult.geo?.org || "N/A"}</div>
                <div className="text-[10px] text-muted-foreground">
                  {lookupResult.geo?.is_datacenter ? "Hosting / Cloud Node" : "Residential / ISP"}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-secondary/30 border border-border/60 space-y-1">
                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-primary" /> {t.intelBehaviorStrikes}
                </div>
                <div className="font-semibold text-destructive">{lookupResult.defense_status?.strike_violations || 0} infractions</div>
                <div className="text-[10px] text-muted-foreground">Gateway Violation History</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
              {!lookupResult.defense_status?.is_banned ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onQuickBan(lookupResult.ip)}
                  className="text-xs h-8 gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" /> 10-Min Quick Ban
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="cyber"
                  onClick={() => onQuickUnban(lookupResult.ip)}
                  className="text-xs h-8 gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" /> Unban IP
                </Button>
              )}

              {!lookupResult.defense_status?.is_blacklisted && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAddBlacklist(lookupResult.ip)}
                  className="text-xs h-8 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <Ban className="w-3.5 h-3.5" /> Permanent Blacklist
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
