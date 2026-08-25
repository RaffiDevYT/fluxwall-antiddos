"use client";

import React from "react";
import { RadioTower, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LogsViewProps {
  t: any;
  liveLogs: any[];
  exportLogsAsJson: () => void;
}

export default function LogsView({ t, liveLogs, exportLogsAsJson }: LogsViewProps) {
  return (
    <Card className="border-primary/20 bg-card/85">
      <CardHeader className="border-b border-border/80 pb-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <RadioTower className="w-4 h-4 text-primary" /> {t.navAttackLogs}
          </CardTitle>
          <CardDescription className="text-[11px]">{t.noThreatsRecorded}</CardDescription>
        </div>
        <Button size="sm" variant="outline" aria-label="Export audit logs to JSON" onClick={exportLogsAsJson} className="gap-1.5 text-xs text-primary border-primary/30">
          <Download className="w-3.5 h-3.5" /> {t.btnExportJson}
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-2 font-mono text-xs">
        {liveLogs.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <RadioTower className="w-6 h-6 text-primary animate-pulse" />
            <span>{t.noThreatsRecorded}</span>
          </div>
        ) : (
          liveLogs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-card/40 border border-primary/10 gap-2 hover:bg-accent/20 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-[10px]">
                  {log.time_formatted || new Date(log.time * 1000).toLocaleTimeString()}
                </span>
                <Badge variant="default" className="text-[9px]">
                  {log.event}
                </Badge>
                <span className="font-bold text-white">{log.client_ip}</span>
              </div>
              <span className="text-muted-foreground text-[11px] truncate max-w-md">
                {log.reason} {log.uri ? `(${log.uri})` : ""}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
