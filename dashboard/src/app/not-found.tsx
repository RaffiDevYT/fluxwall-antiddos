"use client";

import Link from "next/link";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex-1 min-h-screen bg-grid-cyber flex items-center justify-center p-4 bg-[#080b11]">
      <Card className="max-w-md w-full border-primary/30 shadow-2xl bg-card/90 backdrop-blur-xl text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-3 shadow-inner shadow-primary/20">
            <ShieldAlert className="w-7 h-7 text-primary" />
          </div>
          <div className="text-4xl font-black text-white tracking-widest font-mono">404</div>
          <CardTitle className="text-base font-bold tracking-tight text-white mt-1">
            Endpoint Not Located
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            The requested cyber defense route or resource does not exist on this edge gateway.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Link href="/admin">
              <Button variant="cyber" size="sm" className="gap-2 text-xs">
                <Home className="w-4 h-4" /> Go to Dashboard
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm" className="gap-2 text-xs border-primary/30 text-primary">
                <ArrowLeft className="w-4 h-4" /> Portal Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
