"use client";

import React from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WafSignaturesViewProps {
  t: any;
}

export default function WafSignaturesView({ t }: WafSignaturesViewProps) {
  return (
            <Card className="border-primary/20 bg-card/85">
              <CardHeader className="border-b border-border/80 pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-primary" /> {t.wafTitle}
                </CardTitle>
                <CardDescription className="text-[11px]">{t.wafDesc}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-secondary/30 border border-primary/20 rounded-xl flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{t.sqliTitle}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">UNION SELECT, OR 1=1, sys.tables, sleep()</div>
                    </div>
                    <Badge variant="default" className="text-[9px]">{t.enforcedBadge}</Badge>
                  </div>

                  <div className="p-3.5 bg-secondary/30 border border-primary/20 rounded-xl flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{t.xssTitle}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">&lt;script&gt;, javascript:, onerror=, document.cookie</div>
                    </div>
                    <Badge variant="default" className="text-[9px]">{t.enforcedBadge}</Badge>
                  </div>

                  <div className="p-3.5 bg-secondary/30 border border-primary/20 rounded-xl flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{t.scannersTitle}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">sqlmap, nikto, dirbuster, masscan, nmap, zgrab</div>
                    </div>
                    <Badge variant="default" className="text-[9px]">{t.enforcedBadge}</Badge>
                  </div>

                  <div className="p-3.5 bg-secondary/30 border border-primary/20 rounded-xl flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{t.rceTitle}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">eval(), system(), exec(), base64_decode, /bin/sh</div>
                    </div>
                    <Badge variant="default" className="text-[9px]">{t.enforcedBadge}</Badge>
                  </div>

                  <div className="p-3.5 bg-secondary/30 border border-primary/20 rounded-xl flex items-start justify-between md:col-span-2">
                    <div>
                      <div className="font-bold text-white text-xs">{t.slowlorisTitle}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">Multi-part HTTP Range headers (bytes=0-,5-0,5-1...)</div>
                    </div>
                    <Badge variant="default" className="text-[9px]">{t.enforcedBadge}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
  );
}