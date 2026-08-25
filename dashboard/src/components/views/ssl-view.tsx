"use client";

import React, { useState } from "react";
import { Layers, Plus, Trash2, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface SslViewProps {
  t: any;
  sslDomains: any[];
  onAddDomain: (domain: string, issuer: string) => void;
  onDeleteDomain: (id: string) => void;
  onToggleSslFlag: (id: string, flag: "force_https" | "hsts" | "tls13_strict") => void;
  onIssueLetsEncrypt: (domainName: string) => void;
}

export default function SslView({
  t,
  sslDomains,
  onAddDomain,
  onDeleteDomain,
  onToggleSslFlag,
  onIssueLetsEncrypt,
}: SslViewProps) {
  const [newDomain, setNewDomain] = useState("");
  const [newIssuer, setNewIssuer] = useState("letsencrypt");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;
    onAddDomain(newDomain, newIssuer);
    setNewDomain("");
  };

  return (
    <Card className="border-primary/20 bg-card/85">
      <CardHeader className="border-b border-border/80 pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" /> {t.sslTitle}
        </CardTitle>
        <CardDescription className="text-[11px]">{t.sslDesc}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-6">
        <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-3">
          <div className="text-xs font-bold text-white">{t.btnAddDomain}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                {t.domainNameLabel}
              </label>
              <Input
                placeholder="e.g. defense.example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                required
                className="text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                {t.sslIssuerLabel}
              </label>
              <select
                value={newIssuer}
                onChange={(e) => setNewIssuer(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-card/80 px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="letsencrypt">{t.sslIssuerLetsEncrypt}</option>
                <option value="custom">{t.sslIssuerCustom}</option>
              </select>
            </div>
          </div>
          <Button type="submit" variant="cyber" className="text-xs font-bold gap-1.5 mt-2">
            <Plus className="w-3.5 h-3.5" /> {t.btnAddDomain}
          </Button>
        </form>

        <div className="space-y-3">
          {sslDomains.map((dom) => (
            <div
              key={dom.id}
              className="p-4 rounded-xl bg-secondary/20 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="font-mono font-bold text-white text-sm">{dom.domain}</span>
                  <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400">
                    SSL ACTIVE ({dom.days_remaining}d left)
                  </Badge>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Issuer: {dom.issuer === "letsencrypt" ? "Let's Encrypt Authority" : "Custom Certificate"}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="cyber"
                  onClick={() => onIssueLetsEncrypt(dom.domain)}
                  className="text-[10px] h-7 px-2.5 font-bold gap-1"
                  title="Trigger Zero-Touch Let's Encrypt HTTP-01 ACME Certificate Issuance"
                >
                  <Lock className="w-3 h-3" /> Auto-Renew SSL
                </Button>
                <Button
                  size="sm"
                  variant={dom.force_https ? "cyber" : "outline"}
                  onClick={() => onToggleSslFlag(dom.id, "force_https")}
                  className="text-[10px] h-7 px-2"
                >
                  HTTPS Force: {dom.force_https ? "ON" : "OFF"}
                </Button>
                <Button
                  size="sm"
                  variant={dom.tls13_strict ? "cyber" : "outline"}
                  onClick={() => onToggleSslFlag(dom.id, "tls13_strict")}
                  className="text-[10px] h-7 px-2"
                >
                  TLS 1.3: {dom.tls13_strict ? "ON" : "OFF"}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDeleteDomain(dom.id)}
                  className="text-destructive hover:bg-destructive/10 h-7 w-7"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
