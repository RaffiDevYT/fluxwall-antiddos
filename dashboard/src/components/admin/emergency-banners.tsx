"use client";

import React from "react";
import { Flame, Zap } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface EmergencyBannersProps {
  t: any;
  underAttackMode: boolean;
  surgeMode: boolean;
}

export default function EmergencyBanners({
  t,
  underAttackMode,
  surgeMode,
}: EmergencyBannersProps) {
  if (underAttackMode) {
    return (
      <Alert variant="cyber" className="border-primary/40 animate-pulse">
        <Flame className="h-4 w-4 text-primary" />
        <AlertTitle>{t.underAttackAlertTitle}</AlertTitle>
        <AlertDescription>{t.underAttackAlertDesc}</AlertDescription>
      </Alert>
    );
  }

  if (surgeMode) {
    return (
      <Alert variant="cyber" className="border-primary/40">
        <Zap className="h-4 w-4 text-primary" />
        <AlertTitle>{t.surgeAlertTitle}</AlertTitle>
        <AlertDescription>{t.surgeAlertDesc}</AlertDescription>
      </Alert>
    );
  }

  return null;
}
