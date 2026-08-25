"use client";

import React from "react";
import { Fingerprint, Search, Globe, Server, RadioTower, ShieldAlert, ShieldCheck, Ban, Lock, Unlock, Plus, AlertOctagon, UserCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface IpLookupViewProps {
  t: any;
  lang: string;
  lookupTargetIp: string;
  setLookupTargetIp: (v: string) => void;
  lookupResult: any;
  lookupLoading: boolean;
  handleExecuteLookup: (overrideIp?: string) => void;
  handleUnban: (ip: string) => void;
  openConfirm: (opts: any) => void;
  showToast: (msg: string) => void;
}

export default function IpLookupView({
  t,
  lang,
  lookupTargetIp,
  setLookupTargetIp,
  lookupResult,
  lookupLoading,
  handleExecuteLookup,
  handleUnban,
  openConfirm,
  showToast,
}: IpLookupViewProps) {
  return (
            <div className="space-y-6">
              <Card className="border-primary/20 bg-card/85">
                <CardHeader className="border-b border-border/80 pb-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-primary" /> {t.lookupTitle}
                  </CardTitle>
                  <CardDescription className="text-[11px]">{t.lookupDesc}</CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="flex gap-2 max-w-xl">
                    <Input
                      placeholder={t.searchIpPlaceholder}
                      aria-label="Search IP Address"
                      value={lookupTargetIp}
                      onChange={(e) => setLookupTargetIp(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleExecuteLookup()}
                      className="text-xs"
                    />
                    <Button
                      variant="cyber"
                      aria-label="Execute IP Lookup"
                      onClick={() => handleExecuteLookup()}
                      disabled={lookupLoading}
                      className="gap-2 shrink-0 text-xs font-bold"
                    >
                      <Search className="w-3.5 h-3.5" />
                      {lookupLoading ? "Investigating..." : t.btnLookup}
                    </Button>
                  </div>

                  {/* Lookup Result Card */}
                  {lookupResult && (
                    <div className="mt-6 p-5 rounded-xl bg-[#090d16] border border-primary/30 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 border border-primary/30 rounded-xl">
                            <Globe className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-mono font-bold text-white flex items-center gap-2">
                              {lookupResult.ip}
                              <Badge variant="outline" className="font-mono text-[10px] border-primary/30 text-primary">
                                {lookupResult.geo.country}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {lookupResult.geo.city ? `${lookupResult.geo.city}, ` : ""}{lookupResult.geo.region || ""}
                            </div>
                          </div>
                        </div>

                        {/* Defense Status Badges */}
                        <div className="flex items-center gap-2">
                          {lookupResult.defense_status.is_banned && (
                            <Badge variant="destructive" className="text-[10px]">
                              BANNED ({lookupResult.defense_status.ban_ttl_seconds}s remaining)
                            </Badge>
                          )}
                          {lookupResult.defense_status.is_whitelisted && (
                            <Badge variant="default" className="text-[10px]">WHITELISTED</Badge>
                          )}
                          {lookupResult.defense_status.is_blacklisted && (
                            <Badge variant="destructive" className="text-[10px]">BLACKLISTED</Badge>
                          )}
                          {!lookupResult.defense_status.is_banned &&
                            !lookupResult.defense_status.is_whitelisted &&
                            !lookupResult.defense_status.is_blacklisted && (
                              <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
                                CLEAN IP
                              </Badge>
                            )}
                        </div>
                      </div>

                      {/* Detail Metrics */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-secondary/30 border border-primary/10">
                          <div className="text-muted-foreground text-[10px]">{t.asnOrg}</div>
                          <div className="font-semibold text-white mt-0.5 truncate">{lookupResult.geo.org}</div>
                        </div>

                        <div className="p-3 rounded-lg bg-secondary/30 border border-primary/10">
                          <div className="text-muted-foreground text-[10px]">Hosting Category</div>
                          <div className="font-semibold mt-0.5">
                            {lookupResult.geo.is_datacenter ? (
                              <span className="text-amber-400 flex items-center gap-1">
                                <AlertOctagon className="w-3.5 h-3.5" /> Datacenter / Cloud Botnet
                              </span>
                            ) : (
                              <span className="text-primary flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5" /> Residential / Clean ISP
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-secondary/30 border border-primary/10">
                          <div className="text-muted-foreground text-[10px]">{t.strikeCount}</div>
                          <div className="font-semibold text-white mt-0.5">
                            {lookupResult.defense_status.strike_violations} / 5 strikes
                          </div>
                        </div>
                      </div>

                      {/* 1-Click Action Buttons */}
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        {lookupResult.defense_status.is_banned ? (
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={`Unban IP ${lookupResult.ip}`}
                            onClick={() => handleUnban(lookupResult.ip)}
                            className="text-xs border-primary/30 text-primary hover:bg-primary/20 gap-1.5"
                          >
                            <Unlock className="w-3.5 h-3.5" /> {t.btnUnban}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="cyber"
                            aria-label={`Ban IP ${lookupResult.ip}`}
                            onClick={() => {
                              openConfirm({
                                title: t.quickBanTitle,
                                message: `${t.confirmBan} (${lookupResult.ip}) for 15m?`,
                                variant: "danger",
                                onConfirm: async () => {
                                  await fetch("/api/bans", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ ip: lookupResult.ip, duration_sec: 900 }),
                                  });
                                  showToast(`IP ${lookupResult.ip} banned for 15m!`);
                                  handleExecuteLookup(lookupResult.ip);
                                },
                              });
                            }}
                            className="text-xs gap-1.5"
                          >
                            <Lock className="w-3.5 h-3.5" /> {t.btnQuickBan}
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`Whitelist IP ${lookupResult.ip}`}
                          onClick={() => {
                            openConfirm({
                              title: t.navWhitelist,
                              message: `${lang === "id" ? "Tambahkan ke whitelist" : "Add to whitelist"}: ${lookupResult.ip}?`,
                              variant: "primary",
                              onConfirm: async () => {
                                await fetch("/api/whitelist", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ ip: lookupResult.ip }),
                                });
                                showToast(`IP ${lookupResult.ip} whitelisted!`);
                                handleExecuteLookup(lookupResult.ip);
                              },
                            });
                          }}
                          className="text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> {t.btnQuickWhitelist}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`Blacklist IP ${lookupResult.ip}`}
                          onClick={() => {
                            openConfirm({
                              title: t.navBlacklist,
                              message: `${lang === "id" ? "Blacklist permanen IP" : "Permanently blacklist IP"}: ${lookupResult.ip}?`,
                              variant: "danger",
                              onConfirm: async () => {
                                await fetch("/api/blacklist", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ ip: lookupResult.ip }),
                                });
                                showToast(`IP ${lookupResult.ip} added to permanent blacklist!`);
                                handleExecuteLookup(lookupResult.ip);
                              },
                            });
                          }}
                          className="text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
                        >
                          <Ban className="w-3.5 h-3.5" /> {t.btnQuickBlacklist}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
  );
}