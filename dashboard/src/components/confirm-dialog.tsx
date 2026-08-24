"use client";

import React from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  variant = "warning",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="max-w-md w-full border-primary/40 shadow-2xl animate-in zoom-in-95 duration-200 bg-[#0c101c] border">
        <CardHeader className="border-b border-primary/20 pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              variant === "danger"
                ? "bg-destructive/10 border-destructive/30 text-destructive"
                : "bg-primary/10 border-primary/30 text-primary"
            }`}>
              {variant === "danger" ? <AlertTriangle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-white">
                {title}
              </CardTitle>
              <Badge variant={variant === "danger" ? "destructive" : "default"} className="text-[9px] mt-0.5">
                VERIFIKASI KEAMANAN
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {message}
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-xs border-primary/20 text-muted-foreground hover:text-white"
            >
              {cancelLabel}
            </Button>

            <Button
              type="button"
              variant={variant === "danger" ? "destructive" : "cyber"}
              size="sm"
              onClick={onConfirm}
              className="text-xs font-bold"
            >
              {confirmLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
