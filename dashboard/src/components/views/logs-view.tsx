"use client";

import React, { useState } from "react";
import { Radio, Search, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface LogsViewProps {
  t: any;
  liveLogs: any[];
}

export default function LogsView({ t, liveLogs }: LogsViewProps) {
  const [filterQuery, setFilterQuery] = useState("");

  const filteredLogs = liveLogs.filter(
    (log) =>
      log.client_ip?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      log.event?.toLowerCase().includes(filterQuery.toLowerCase()) ||
      log.uri?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <Card className="border-primary/20 bg-card/85">
      <CardHeader className="border-b border-border/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" /> {t.navAttackLogs}
          </CardTitle>
          <CardDescription className="text-[11px]">{t.logsAuditDesc}</CardDescription>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search IP, event, URI..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="text-xs pl-8 h-8 font-mono"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
              <tr>
                <th className="py-2.5 px-4">{t.tableTime}</th>
                <th className="py-2.5 px-4">{t.tableIp}</th>
                <th className="py-2.5 px-4">{t.tableEvent}</th>
                <th className="py-2.5 px-4">{t.tableTargetUri}</th>
                <th className="py-2.5 px-4 text-right">{t.tableAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-accent/40 transition">
                  <td className="py-2.5 px-4 text-muted-foreground text-[11px]">
                    {log.time_formatted || "Just now"}
                  </td>
                  <td className="py-2.5 px-4 text-sky-400 font-semibold">{log.client_ip}</td>
                  <td className="py-2.5 px-4">
                    <Badge variant="destructive" className="text-[9px] py-0">
                      {log.event}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground truncate max-w-[180px]">{log.uri || "/"}</td>
                  <td className="py-2.5 px-4 text-right">
                    <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive">
                      BLOCKED
                    </Badge>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground font-sans">
                    {t.noEventsLogged}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
