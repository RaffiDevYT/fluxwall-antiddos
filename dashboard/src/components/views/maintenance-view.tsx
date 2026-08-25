"use client";

import React from "react";
import { Settings, RotateCcw, RefreshCw, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MaintenanceViewProps {
  t: any;
  handleGatewayAction: (action: "flush_violations" | "reset_threat_counter" | "clear_logs", label: string) => void;
}

export default function MaintenanceView({
  t,
  handleGatewayAction,
}: MaintenanceViewProps) {
  return (
    <Card className="border-primary/20 bg-card/85">
      <CardHeader className="border-b border-border/80 pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" /> {t.maintTitle}
        </CardTitle>
        <CardDescription className="text-[11px]">{t.maintDesc}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-primary/20 bg-secondary/30 p-4">
            <h4 className="font-bold text-white text-xs mb-1">{t.maintClearViolations}</h4>
            <p className="text-[11px] text-muted-foreground mb-3">{t.maintClearViolationsDesc}</p>
            <Button
              size="sm"
              variant="outline"
              aria-label="Flush violations cache"
              onClick={() => handleGatewayAction("flush_violations", t.btnClearViolations)}
              className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" /> {t.btnClearViolations}
            </Button>
          </Card>

          <Card className="border-primary/20 bg-secondary/30 p-4">
            <h4 className="font-bold text-white text-xs mb-1">{t.maintResetThreats}</h4>
            <p className="text-[11px] text-muted-foreground mb-3">{t.maintResetThreatsDesc}</p>
            <Button
              size="sm"
              variant="outline"
              aria-label="Reset global threat counter"
              onClick={() => handleGatewayAction("reset_threat_counter", t.btnResetThreats)}
              className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> {t.btnResetThreats}
            </Button>
          </Card>

          <Card className="border-primary/20 bg-secondary/30 p-4">
            <h4 className="font-bold text-white text-xs mb-1">{t.maintPurgeLogs}</h4>
            <p className="text-[11px] text-muted-foreground mb-3">{t.maintPurgeLogsDesc}</p>
            <Button
              size="sm"
              variant="outline"
              aria-label="Purge real-time attack logs"
              onClick={() => handleGatewayAction("clear_logs", t.btnPurgeLogs)}
              className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" /> {t.btnPurgeLogs}
            </Button>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
