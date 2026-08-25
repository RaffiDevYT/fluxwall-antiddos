"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WafSignaturesViewProps {
  t: any;
}

export default function WafSignaturesView({ t }: WafSignaturesViewProps) {
  const signatures = [
    { id: "SIG-SQLI-01", name: "SQL Injection: UNION SELECT / OR 1=1 Injection", target: "Query / Body", action: "BLOCK", active: true },
    { id: "SIG-XSS-02", name: "Cross-Site Scripting (XSS): <script> & SVG Payloads", target: "URI / Params", action: "BLOCK", active: true },
    { id: "SIG-LFI-03", name: "Path Traversal & Local File Inclusion (../../etc/passwd)", target: "URI Path", action: "BLOCK", active: true },
    { id: "SIG-RCE-04", name: "Remote Code Execution: /bin/sh / eval() php wrapper", target: "Body / Headers", action: "BLOCK", active: true },
    { id: "SIG-SCAN-05", name: "Automated Recon: Nessus / Nikto / sqlmap / ZAP probes", target: "User-Agent", action: "BAN 24H", active: true },
    { id: "SIG-ENV-06", name: "Secret Leaks Probe: /.env, /.git/config, /id_rsa", target: "Canary URI", action: "BAN 24H", active: true },
  ];

  return (
    <Card className="border-primary/20 bg-card/85">
      <CardHeader className="border-b border-border/80 pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-primary" /> {t.wafTitle}
        </CardTitle>
        <CardDescription className="text-[11px]">{t.wafDesc}</CardDescription>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {signatures.map((sig) => (
            <div key={sig.id} className="p-3.5 rounded-xl bg-secondary/30 border border-primary/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-sky-400">{sig.id}</span>
                <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400">
                  ENFORCED
                </Badge>
              </div>
              <div className="font-bold text-xs text-white">{sig.name}</div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                <span>Target: {sig.target}</span>
                <span className="text-destructive font-mono font-bold">{sig.action}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
