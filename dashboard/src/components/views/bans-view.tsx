"use client";

import React, { useState } from "react";
import { Lock, Plus, Unlock, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface BansViewProps {
  t: any;
  bans: any[];
  banIp: string;
  setBanIp: (v: string) => void;
  banDuration: string;
  setBanDuration: (v: string) => void;
  handleManualBan: (e: React.FormEvent) => void;
  handleUnban: (ip: string) => void;
}

export default function BansView({
  t,
  bans,
  banIp,
  setBanIp,
  banDuration,
  setBanDuration,
  handleManualBan,
  handleUnban,
}: BansViewProps) {
  const [searchFilter, setSearchFilter] = useState("");
  const filteredBans = bans.filter((b) => b.ip?.toLowerCase().includes(searchFilter.toLowerCase()));
  return (
            <Card className="border-primary/20 bg-card/85">
              <CardHeader className="border-b border-border/80 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" /> {t.navBans}
                  </CardTitle>
                  <CardDescription className="text-[11px]">{t.noActiveBans}</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder={t.searchOffender}
                    aria-label="Search Quarantined IP"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-8 text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                      <tr>
                        <th className="py-3 px-4">{t.tableOffenderIp}</th>
                        <th className="py-3 px-4">{t.tableRemainingTtl}</th>
                        <th className="py-3 px-4">{t.tableReason}</th>
                        <th className="py-3 px-4 text-right">{t.tableAction}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredBans.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-muted-foreground">
                            {t.noActiveBans}
                          </td>
                        </tr>
                      ) : (
                        filteredBans.map((ban) => (
                          <tr key={ban.ip} className="hover:bg-accent/40 transition">
                            <td className="py-3 px-4 font-mono font-bold text-primary">{ban.ip}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="font-mono text-[11px] border-primary/30 text-primary bg-primary/5">
                                {ban.remaining_ttl}s remaining
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground font-medium">{ban.reason}</td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                aria-label={`Unban IP ${ban.ip}`}
                                onClick={() => handleUnban(ban.ip)}
                                className="gap-1.5 text-[11px] h-7 border-primary/30 text-primary hover:bg-primary/20"
                              >
                                <Unlock className="w-3 h-3" /> {t.btnUnban}
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
  );
}