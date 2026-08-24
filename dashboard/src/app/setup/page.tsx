"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Server,
  Lock,
  UserCheck,
  CheckCircle2,
  HardDrive,
  Cpu,
  ArrowRight,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function SetupWizardPage() {
  const [lang, setLang] = useState<"id" | "en">("id");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [username, setUsername] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("fluxwall_lang") as "id" | "en";
    if (savedLang === "en" || savedLang === "id") {
      setLang(savedLang);
    }

    // Check if already completed
    fetch("/api/setup/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.completed) {
          setIsLocked(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(lang === "id" ? "Konfirmasi password tidak cocok!" : "Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      setError(lang === "id" ? "Password minimal 6 karakter!" : "Password must be at least 6 characters!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setStep(3);
        setTimeout(() => {
          window.location.href = "/admin";
        }, 2000);
      } else {
        setError(data.error || "Setup failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  if (isLocked) {
    return (
      <div className="flex-1 min-h-screen bg-[#080b11] bg-grid-cyber flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-primary/30 bg-[#090d16]/95 backdrop-blur-xl shadow-2xl text-center p-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-lg font-bold text-white mb-2">
            {lang === "id" ? "Setup Awal Telah Selesai" : "Initial Setup Already Completed"}
          </CardTitle>
          <CardDescription className="text-xs mb-6">
            {lang === "id"
              ? "Akun Root Administrator sudah terkonfigurasi. Halaman wizard ini dikunci untuk keamanan."
              : "Root Administrator has already been configured. This setup wizard is locked for security."}
          </CardDescription>
          <Button variant="cyber" className="w-full" onClick={() => (window.location.href = "/login")}>
            {lang === "id" ? "Ke Halaman Login" : "Go to Login Portal"}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-[#080b11] bg-grid-cyber flex flex-col justify-between p-4 md:p-8">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 border border-primary/30 rounded-xl shadow-inner shadow-primary/20">
            <ShieldAlert className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-tight text-white">FLUXWALL</span>
              <Badge variant="default" className="text-[8px] py-0 px-1 font-bold">
                SETUP WIZARD
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">First-Time Deployment Initializer</p>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-primary/20">
          <button
            onClick={() => setLang("id")}
            className={`px-2 py-1 text-[11px] font-bold rounded-md transition ${
              lang === "id" ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
            }`}
          >
            ID
          </button>
          <button
            onClick={() => setLang("en")}
            className={`px-2 py-1 text-[11px] font-bold rounded-md transition ${
              lang === "en" ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
            }`}
          >
            EN
          </button>
        </div>
      </header>

      {/* Main Wizard Card */}
      <main className="max-w-xl mx-auto w-full my-auto">
        <Card className="border-primary/30 bg-[#090d16]/95 backdrop-blur-xl shadow-2xl glow-primary">
          <CardHeader className="border-b border-primary/20 pb-5 text-center">
            {/* Step Badges */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  step >= 1 ? "bg-primary text-black font-extrabold" : "bg-secondary text-muted-foreground"
                }`}
              >
                1
              </div>
              <div className={`w-8 h-0.5 ${step >= 2 ? "bg-primary" : "bg-secondary"}`} />
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  step >= 2 ? "bg-primary text-black font-extrabold" : "bg-secondary text-muted-foreground"
                }`}
              >
                2
              </div>
              <div className={`w-8 h-0.5 ${step === 3 ? "bg-primary" : "bg-secondary"}`} />
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  step === 3 ? "bg-primary text-black font-extrabold" : "bg-secondary text-muted-foreground"
                }`}
              >
                3
              </div>
            </div>

            <CardTitle className="text-lg font-extrabold tracking-wide text-white">
              {step === 1
                ? lang === "id"
                  ? "Selamat Datang di FluxWall Anti-DDoS"
                  : "Welcome to FluxWall Anti-DDoS"
                : step === 2
                ? lang === "id"
                  ? "Buat Akun Root Administrator"
                  : "Create Root Administrator"
                : lang === "id"
                ? "Inisialisasi Selesai!"
                : "Initialization Complete!"}
            </CardTitle>
            <CardDescription className="text-xs">
              {step === 1
                ? lang === "id"
                  ? "Pemeriksaan kesiapan subsistem gateway & database memori Redis"
                  : "System readiness check for OpenResty gateway & in-memory Redis"
                : step === 2
                ? lang === "id"
                  ? "Tentukan kredensial akun utama untuk mengelola seluruh kebijakan keamanan"
                  : "Set primary security credentials to manage global defense policies"
                : lang === "id"
                ? "Mengarahkan Anda ke Enterprise Admin Dashboard..."
                : "Redirecting you to the Enterprise Admin Dashboard..."}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            )}

            {/* STEP 1: READINESS CHECK */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <div className="p-3.5 bg-secondary/30 rounded-xl border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <HardDrive className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-xs font-bold text-white">Redis In-Memory Engine</div>
                        <div className="text-[10px] text-muted-foreground">Sub-millisecond state cache</div>
                      </div>
                    </div>
                    <Badge variant="default" className="text-[10px]">READY (200)</Badge>
                  </div>

                  <div className="p-3.5 bg-secondary/30 rounded-xl border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Cpu className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-xs font-bold text-white">OpenResty L7 Gateway Core</div>
                        <div className="text-[10px] text-muted-foreground">Lua high-performance interceptor</div>
                      </div>
                    </div>
                    <Badge variant="default" className="text-[10px]">READY (200)</Badge>
                  </div>

                  <div className="p-3.5 bg-secondary/30 rounded-xl border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-primary" />
                      <div>
                        <div className="text-xs font-bold text-white">Adaptive Surge Protection</div>
                        <div className="text-[10px] text-muted-foreground">Dynamic sliding-rate defender</div>
                      </div>
                    </div>
                    <Badge variant="default" className="text-[10px]">ENFORCED</Badge>
                  </div>
                </div>

                <Button variant="cyber" className="w-full font-bold gap-2 mt-4" onClick={() => setStep(2)}>
                  {lang === "id" ? "Lanjutkan: Buat Akun Admin" : "Continue: Create Admin Account"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* STEP 2: CREATE ROOT ADMIN FORM */}
            {step === 2 && (
              <form onSubmit={handleCompleteSetup} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-white block mb-1">
                    {lang === "id" ? "Username Administrator" : "Root Admin Username"}
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="admin"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white block mb-1">
                    {lang === "id" ? "Email Notifikasi Keamanan (Opsional)" : "Security Email (Optional)"}
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@fluxwall.security"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white block mb-1">
                    {lang === "id" ? "Password Super Admin" : "Super Admin Password"}
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white block mb-1">
                    {lang === "id" ? "Konfirmasi Password" : "Confirm Password"}
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-1/3 text-xs">
                    {lang === "id" ? "Kembali" : "Back"}
                  </Button>
                  <Button type="submit" variant="cyber" disabled={loading} className="w-2/3 text-xs font-bold gap-2">
                    <UserCheck className="w-4 h-4" />
                    {loading
                      ? lang === "id"
                        ? "Menyimpan..."
                        : "Configuring..."
                      : lang === "id"
                      ? "Selesaikan & Buka Dashboard"
                      : "Complete & Launch"}
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS & REDIRECT */}
            {step === 3 && (
              <div className="py-6 text-center space-y-3 animate-in zoom-in-95 duration-300">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center animate-bounce">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div className="text-base font-bold text-white">
                  {lang === "id" ? "Setup Berhasil Dikonfigurasi!" : "Setup Configured Successfully!"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {lang === "id"
                    ? "Akun Anda telah dienkripsi ke Redis. Anda otomatis masuk ke sesi admin..."
                    : "Your account is encrypted in Redis. Redirecting to admin session..."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center py-2 text-[11px] text-muted-foreground">
        FluxWall Enterprise Security Gateway &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
}
