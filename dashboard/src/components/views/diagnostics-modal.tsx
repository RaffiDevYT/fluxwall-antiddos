"use client";

import React from "react";
import { Activity, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card className="max-w-lg w-full border-primary/40 shadow-2xl animate-in zoom-in-95 duration-200 bg-[#0c101c] border">
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
        <CardContent className="p-5 space-y-4 text-xs font-mono">
          <div className="p-3 rounded-lg bg-secondary/30 border border-border/60 flex items-center justify-between">
            <span className="text-muted-foreground">Redis Memory Engine</span>
            <Badge variant={health?.info?.redis?.status === "ok" ? "default" : "destructive"}>
              {health?.info?.redis?.status?.toUpperCase() || "OK"}
            </Badge>
          </div>

          <div className="p-3 rounded-lg bg-secondary/30 border border-border/60 flex items-center justify-between">
            <span className="text-muted-foreground">OpenResty Gateway Gateway</span>
            <Badge variant="default">
              {health?.info?.gateway?.status?.toUpperCase() || "UP"}
            </Badge>
          </div>
        </CardContent>
        <div className="p-4 border-t border-border/80 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t.btnCloseDiag}
          </Button>
        </div>
      </Card>
    </div>
  );
}
