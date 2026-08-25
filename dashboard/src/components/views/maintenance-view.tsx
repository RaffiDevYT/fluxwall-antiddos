"use client";

import React from "react";
import { Wrench, Trash2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MaintenanceViewProps {
  t: any;
  onFlushState: () => void;
  onToggleUnderAttack: () => void;
  underAttackMode: boolean;
}

export default function MaintenanceView({
  t,
  onFlushState,
  onToggleUnderAttack,
  underAttackMode,
}: MaintenanceViewProps) {
  return (
    <Card className="border-primary/20 bg-card/85">
      <CardHeader className="border-b border-border/80 pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" /> {t.maintTitle}
        </CardTitle>
        <CardDescription className="text-[11px]">{t.maintDesc}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-2">
            <div className="text-xs font-bold text-white">Flush Transient Redis State</div>
            <div className="text-[11px] text-muted-foreground">
              Clear temporary packet buffers, IP violation rate tokens, and surge metrics without deleting permanent blacklists.
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onFlushState}
              className="text-xs gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 mt-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> Flush Transient Cache
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-2">
            <div className="text-xs font-bold text-white">Emergency Under Attack Mode</div>
            <div className="text-[11px] text-muted-foreground">
              Forces aggressive JavaScript Proof-of-Work challenge verification on 100% of incoming visitors.
            </div>
            <Button
              variant={underAttackMode ? "destructive" : "cyber"}
              size="sm"
              onClick={onToggleUnderAttack}
              className="text-xs font-bold gap-1.5 mt-2"
            >
              <Power className="w-3.5 h-3.5" />
              {underAttackMode ? "Disable Emergency Mode" : "Activate Emergency Mode"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
