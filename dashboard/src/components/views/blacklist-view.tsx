"use client";

import React from "react";
import { Ban, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface BlacklistViewProps {
  t: any;
  blacklist: string[];
  blacklistIp: string;
  setBlacklistIp: (v: string) => void;
  handleAddBlacklist: (e: React.FormEvent) => void;
  handleRemoveBlacklist: (ip: string) => void;
}

export default function BlacklistView({
  t,
  blacklist,
  blacklistIp,
  setBlacklistIp,
  handleAddBlacklist,
  handleRemoveBlacklist,
}: BlacklistViewProps) {
  return (
            <Card className="border-primary/20 bg-card/85">
              <CardHeader className="border-b border-border/80 pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Ban className="w-4 h-4 text-primary" /> {t.navBlacklist}
                </CardTitle>
                <CardDescription className="text-[11px]">{t.statThreatsSub}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <form onSubmit={handleAddBlacklist} className="flex gap-2 max-w-lg">
                  <Input
                    placeholder={t.maliciousIpPlaceholder}
                    aria-label="Blacklist IP Address"
                    value={blacklistIp}
                    onChange={(e) => setBlacklistIp(e.target.value)}
                    required
                  />
                  <Button type="submit" variant="cyber" aria-label="Add IP to Blacklist" className="gap-1.5 shrink-0 font-bold">
                    <Plus className="w-4 h-4" /> {t.btnAddBlacklist}
                  </Button>
                </form>

                <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden">
                  {blacklist.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground text-xs">
                      {t.noBlacklist}
                    </div>
                  ) : (
                    blacklist.map((ip) => (
                      <div key={ip} className="flex items-center justify-between py-2.5 px-4 hover:bg-accent/30 transition">
                        <span className="font-mono text-primary font-bold text-xs">{ip}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Remove IP ${ip} from blacklist`}
                          onClick={() => handleRemoveBlacklist(ip)}
                          className="text-muted-foreground hover:text-primary h-7 w-7"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
  );
}