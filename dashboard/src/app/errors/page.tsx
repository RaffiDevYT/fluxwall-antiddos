"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Lock,
  Clock,
  ServerCrash,
  FileQuestion,
  ArrowLeft,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ErrorTemplatesShowcasePage() {
  const [activeCode, setActiveCode] = useState<"403" | "429" | "503" | "404">("403");

  const errorSpecs = {
    "403": {
      code: 403,
      title: "403 Forbidden - Security Policy Violation",
      reason: "IP Quarantined by WAF / Bad Bot Signature / Malicious Probing",
      mitigation: "Check the Admin Dashboard bans table or wait for TTL expiration.",
      icon: Lock,
      sampleJson: {
        status: 403,
        error: "Forbidden",
        message: "Your request was blocked by FluxWall Layer-7 Security Policy.",
        incident_id: "sec-9812-f01a",
        client_ip: "198.51.100.42",
      },
    },
    "429": {
      code: 429,
      title: "429 Too Many Requests - Sliding Window Exceeded",
      reason: "Client exceeded the configured request rate quota (e.g. > 20 req/s).",
      mitigation: "Back off and retry after the sliding window expires.",
      icon: Clock,
      sampleJson: {
        status: 429,
        error: "Too Many Requests",
        message: "Rate limit threshold breached. Please slow down.",
        retry_after_seconds: 5,
        client_ip: "203.0.113.19",
      },
    },
    "503": {
      code: 503,
      title: "503 Service Unavailable - Adaptive Surge Protection",
      reason: "Global gateway traffic spike threshold reached; aggressive rate-scaling is active.",
      mitigation: "Gateway is actively shedding load to protect backend services.",
      icon: ServerCrash,
      sampleJson: {
        status: 503,
        error: "Service Unavailable",
        message: "Adaptive Surge Defense Mode actively mitigating traffic flood.",
        surge_active: true,
      },
    },
    "404": {
      code: 404,
      title: "404 Not Found - Route Unavailable",
      reason: "Target URI is not registered in upstream routing tables.",
      mitigation: "Verify request URL or routing configuration in Nginx conf.",
      icon: FileQuestion,
      sampleJson: {
        status: 404,
        error: "Not Found",
        message: "Requested edge endpoint does not exist.",
      },
    },
  };

  const selected = errorSpecs[activeCode];
  const IconComponent = selected.icon;

  return (
    <div className="flex-1 min-h-screen bg-grid-cyber p-4 md:p-8 bg-[#080b11] max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 border border-primary/30 rounded-xl">
            <ShieldAlert className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">FluxWall Edge Error Inspector</h1>
            <p className="text-xs text-muted-foreground">Standardized L7 Edge Mitigation & Threat Intercept Templates</p>
          </div>
        </div>
        <Link href="/admin">
          <Button variant="outline" size="sm" className="gap-2 text-xs border-primary/30 text-primary hover:bg-primary/10">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Code Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(["403", "429", "503", "404"] as const).map((code) => (
          <Button
            key={code}
            variant={activeCode === code ? "cyber" : "outline"}
            onClick={() => setActiveCode(code)}
            className="h-12 flex items-center justify-between px-4 border-primary/20 text-xs font-bold"
          >
            <span className="font-mono text-sm">{code}</span>
            <Badge variant="default" className="text-[9px]">
              {code === "403"
                ? "Forbidden"
                : code === "429"
                ? "Rate Limit"
                : code === "503"
                ? "Surge Mode"
                : "Not Found"}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Error Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-primary/30 bg-card/85 glow-primary lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-2">
              <IconComponent className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-base text-white">{selected.title}</CardTitle>
            <CardDescription className="text-xs">{selected.reason}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-secondary/40 border border-primary/10">
              <div className="font-semibold text-white mb-1">Trigger Condition</div>
              <p className="text-muted-foreground text-[11px]">{selected.mitigation}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/40 border border-primary/10">
              <div className="font-semibold text-white mb-1">Edge Engine Action</div>
              <p className="text-muted-foreground text-[11px]">
                Nginx Lua terminates the TCP connection or serves JSON response without passing payload to upstream backend.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* JSON Payload Inspector */}
        <Card className="border-primary/20 bg-card/85 lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-border/80">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-primary">
                <Terminal className="w-4 h-4" /> Edge Response Payload (JSON)
              </CardTitle>
              <CardDescription className="text-[11px]">Format returned to API consumers and HTTP clients</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-[10px] border-primary/30 text-primary">
              Content-Type: application/json
            </Badge>
          </CardHeader>
          <CardContent className="p-4">
            <pre className="p-4 rounded-xl bg-[#06080d] border border-primary/20 text-sky-300 font-mono text-xs overflow-x-auto leading-relaxed">
              {JSON.stringify(selected.sampleJson, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
