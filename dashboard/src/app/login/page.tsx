"use client";

import React, { useState } from "react";
import { ShieldAlert, Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        window.location.href = "/admin";
      } else {
        setError(data.message || "Invalid administrator credentials");
      }
    } catch (err: any) {
      setError("Failed to connect to authentication server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-grid-cyber flex items-center justify-center p-4 bg-[#080b11]">
      <Card className="max-w-md w-full border-primary/30 shadow-2xl bg-card/90 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-3 shadow-inner shadow-primary/20">
            <ShieldAlert className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl font-extrabold tracking-tight text-white">
            FluxWall Access Portal
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Cyber Defense & Edge Telemetry Control Center
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5 uppercase tracking-wider">
                Admin Security Passkey
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Enter administrator passkey..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 text-xs h-10 border-primary/20 focus:border-primary"
                  required
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="cyber"
              disabled={loading}
              className="w-full h-10 gap-2 font-bold text-xs"
            >
              {loading ? (
                "Authenticating..."
              ) : (
                <>
                  Enter Control Panel <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            <div className="text-center pt-2">
              <p className="text-[10px] text-muted-foreground">
                Default password: <span className="font-mono text-primary font-bold">fluxwall2026!</span> (or configured via <code className="text-primary">ADMIN_PASSWORD</code>)
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
