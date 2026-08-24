"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 min-h-screen bg-grid-cyber flex items-center justify-center p-4 bg-[#080b11]">
      <Card className="max-w-md w-full border-primary/30 shadow-2xl bg-card/90 backdrop-blur-xl text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-3">
            <AlertTriangle className="w-7 h-7 text-primary" />
          </div>
          <div className="text-4xl font-black text-white tracking-widest font-mono">500</div>
          <CardTitle className="text-base font-bold tracking-tight text-white mt-1">
            System Telemetry Exception
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            An unexpected error occurred while rendering the cyber defense control panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Button variant="cyber" size="sm" onClick={() => reset()} className="gap-2 text-xs">
              <RotateCcw className="w-4 h-4" /> Retry Connection
            </Button>
            <Link href="/admin">
              <Button variant="outline" size="sm" className="gap-2 text-xs border-primary/30 text-primary">
                <Home className="w-4 h-4" /> Home Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
