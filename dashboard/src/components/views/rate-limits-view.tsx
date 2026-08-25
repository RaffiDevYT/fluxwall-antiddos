"use client";

import React from "react";
import { Gauge, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface RateLimitsViewProps {
  t: any;
}

export default function RateLimitsView({ t }: RateLimitsViewProps) {
  return (
    <Card className="border-primary/20 bg-card/85">
      <CardHeader className="border-b border-border/80 pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" /> {t.rateScalerTitle}
        </CardTitle>
        <CardDescription className="text-[11px]">{t.rateScalerDesc}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-2">
            <div className="text-xs font-bold text-white">Default IP Rate Limit</div>
            <div className="text-[11px] text-muted-foreground">Requests allowed per second per IP</div>
            <Input defaultValue="30" type="number" className="text-xs font-mono" />
          </div>

          <div className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-2">
            <div className="text-xs font-bold text-white">Burst Allowance</div>
            <div className="text-[11px] text-muted-foreground">Maximum burst bucket capacity</div>
            <Input defaultValue="50" type="number" className="text-xs font-mono" />
          </div>

          <div className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-2">
            <div className="text-xs font-bold text-white">Under Attack Mode Multiplier</div>
            <div className="text-[11px] text-muted-foreground">Strict threshold when mode is active</div>
            <Input defaultValue="5" type="number" className="text-xs font-mono" />
          </div>
        </div>

        <Button variant="cyber" className="text-xs font-bold gap-1.5">
          <Check className="w-3.5 h-3.5" /> Save Rate Limiting Policies
        </Button>
      </CardContent>
    </Card>
  );
}
