"use client";

import React from "react";
import { Gauge, Sliders } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RateLimitsViewProps {
  t: any;
  lang: string;
  rateLimitGeneral: string;
  setRateLimitGeneral: (v: string) => void;
  rateLimitBurst: string;
  setRateLimitBurst: (v: string) => void;
  openConfirm: (opts: any) => void;
  showToast: (msg: string) => void;
}

export default function RateLimitsView({
  t,
  lang,
  rateLimitGeneral,
  setRateLimitGeneral,
  rateLimitBurst,
  setRateLimitBurst,
  openConfirm,
  showToast,
}: RateLimitsViewProps) {
  return (
    <Card className="border-primary/20 bg-card/85">
      <CardHeader className="border-b border-border/80 pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" /> {t.rateLimitTitle}
        </CardTitle>
        <CardDescription className="text-[11px]">{t.rateLimitDesc}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-4 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label htmlFor="ratelimit-general-input" className="text-xs font-semibold text-white block mb-1">
              {t.perIpLimit}: <span className="font-mono text-primary font-bold">{rateLimitGeneral} req/sec</span>
            </label>
            <Input
              id="ratelimit-general-input"
              type="number"
              value={rateLimitGeneral}
              onChange={(e) => setRateLimitGeneral(e.target.value)}
              className="text-xs max-w-xs"
            />
          </div>

          <div>
            <label htmlFor="ratelimit-burst-input" className="text-xs font-semibold text-white block mb-1">
              {t.maxBurstBucket}: <span className="font-mono text-primary font-bold">{rateLimitBurst} tokens</span>
            </label>
            <Input
              id="ratelimit-burst-input"
              type="number"
              value={rateLimitBurst}
              onChange={(e) => setRateLimitBurst(e.target.value)}
              className="text-xs max-w-xs"
            />
          </div>

          <Button
            variant="cyber"
            aria-label="Save Rate Limit policies"
            onClick={() => {
              openConfirm({
                title: t.rateLimitTitle,
                message: `${lang === "id" ? "Simpan kebijakan batas kecepatan" : "Update rate limit policy"}: ${rateLimitGeneral} req/s (Burst: ${rateLimitBurst})?`,
                variant: "warning",
                onConfirm: () => {
                  showToast(`Rate Limit policy updated: ${rateLimitGeneral} req/s (Burst: ${rateLimitBurst})`);
                },
              });
            }}
            className="gap-2 text-xs font-bold mt-2"
          >
            <Sliders className="w-3.5 h-3.5" /> {t.btnSaveRateLimit}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
