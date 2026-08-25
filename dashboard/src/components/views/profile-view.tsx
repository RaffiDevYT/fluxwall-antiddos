"use client";

import React from "react";
import { Key, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProfileViewProps {
  t: any;
  profileData: any;
  onRegenApiKey: () => void;
}

export default function ProfileView({ t, profileData, onRegenApiKey }: ProfileViewProps) {
  return (
    <Card className="border-primary/20 bg-card/85">
      <CardHeader className="border-b border-border/80 pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" /> {t.profileTitle}
        </CardTitle>
        <CardDescription className="text-[11px]">{t.profileDesc}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-6">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">REST API Gateway Master Key</span>
              <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400">
                ACTIVE
              </Badge>
            </div>
            <div className="p-3 rounded-lg bg-black/60 border border-border/60 font-mono text-xs text-sky-400 break-all select-all">
              {profileData?.api_key || "fw_live_master_secops_884920485902"}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenApiKey}
              className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              <RefreshCw className="w-3 h-3" /> Regenerate API Key
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
