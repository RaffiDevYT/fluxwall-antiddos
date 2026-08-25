"use client";

import React from "react";
import { ShieldCheck, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface WhitelistViewProps {
  t: any;
  whitelist: string[];
  whitelistIp: string;
  setWhitelistIp: (v: string) => void;
  handleAddWhitelist: (e: React.FormEvent) => void;
  handleRemoveWhitelist: (ip: string) => void;
}

export default function WhitelistView({
  t,
  whitelist,
  whitelistIp,
  setWhitelistIp,
  handleAddWhitelist,
  handleRemoveWhitelist,
}: WhitelistViewProps) {
  return (
            <Card className="border-primary/20 bg-card/85">
              <CardHeader className="border-b border-border/80 pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" /> {t.navWhitelist}
                </CardTitle>
                <CardDescription className="text-[11px]">{t.statWhitelistSub}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <form onSubmit={handleAddWhitelist} className="flex gap-2 max-w-lg">
                  <Input
                    placeholder={t.trustedIpPlaceholder}
                    aria-label="Whitelist IP Address"
                    value={whitelistIp}
                    onChange={(e) => setWhitelistIp(e.target.value)}
                    required
                  />
                  <Button type="submit" variant="cyber" aria-label="Add IP to Whitelist" className="gap-1.5 shrink-0 font-bold">
                    <Plus className="w-4 h-4" /> {t.btnAddWhitelist}
                  </Button>
                </form>

                <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden">
                  {whitelist.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground text-xs">
                      {t.noWhitelist}
                    </div>
                  ) : (
                    whitelist.map((ip) => (
                      <div key={ip} className="flex items-center justify-between py-2.5 px-4 hover:bg-accent/30 transition">
                        <span className="font-mono text-primary font-bold text-xs">{ip}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Remove IP ${ip} from whitelist`}
                          onClick={() => handleRemoveWhitelist(ip)}
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