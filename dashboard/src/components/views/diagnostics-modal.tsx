"use client";

import React from "react";
import { Activity, X, HardDrive, Server, Cpu, Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: any;
  t: any;
}

export default function DiagnosticsModal({ isOpen, onClose, health, t }: DiagnosticsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="max-w-md w-full border-primary/40 shadow-2xl animate-in zoom-in-95 duration-200 bg-[#0c101c] border">
        <CardHeader className="border-b border-border/80 pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-primary animate-pulse" />
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider">{t.diagTitle}</CardTitle>
              <span className="text-[10px] text-muted-foreground font-mono">
                Socket Status: /healthz
              </span>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-4 space-y-3 font-mono text-xs">
          {/* Redis Health */}
          <div className="p-3 bg-secondary/30 rounded-xl border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-primary" />
              <div>
                <div className="font-bold text-white">{t.redisMemoryHealth}</div>
                <div className="text-muted-foreground text-[11px]">
                  Memory Used: {health?.info?.redis?.used_memory_human || "N/A"}
                </div>
              </div>
            </div>
            <Badge variant={health?.info?.redis?.status === "ok" ? "default" : "destructive"}>
              {health?.info?.redis?.status?.toUpperCase() || "OK"}
            </Badge>
          </div>

          {/* Node Heap Health */}
          <div className="p-3 bg-secondary/30 rounded-xl border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-primary" />
              <div>
                <div className="font-bold text-white">{t.memoryHeapHealth}</div>
                <div className="text-muted-foreground text-[11px]">
                  Heap Used: {health?.info?.memory_heap?.used_mb} MB / Alloc: {health?.info?.memory_heap?.allocated_mb} MB
                </div>
              </div>
            </div>
            <Badge variant="default">
              {health?.info?.memory_heap?.status?.toUpperCase() || "UP"}
            </Badge>
          </div>

          {/* Memory RSS Indicator */}
          <div className="p-3 bg-secondary/30 rounded-xl border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-primary" />
              <div>
                <div className="font-bold text-white">{t.processRssHealth}</div>
                <div className="text-muted-foreground text-[11px]">
                  Resident Size: {health?.info?.memory_rss?.used_mb} MB
                </div>
              </div>
            </div>
            <Badge variant="default">UP</Badge>
          </div>

          {/* Gateway Socket Check */}
          <div className="p-3 bg-secondary/30 rounded-xl border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Network className="w-4 h-4 text-primary" />
              <div>
                <div className="font-bold text-white">{t.gatewaySocketHealth}</div>
                <div className="text-muted-foreground text-[11px]">Socket Status: /healthz</div>
              </div>
            </div>
            <Badge variant="default">
              {health?.info?.gateway?.status?.toUpperCase() || "UP"}
            </Badge>
          </div>
        </CardContent>
        <div className="p-4 border-t border-border/80 flex justify-end">
          <Button variant="secondary" size="sm" aria-label="Close diagnostics inspector" onClick={onClose}>
            {t.btnCloseDiag}
          </Button>
        </div>
      </Card>
    </div>
  );
}
