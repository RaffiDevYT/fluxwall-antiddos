"use client";

import React from "react";
import { Menu, ChevronRight, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Language } from "@/lib/i18n";
import { HealthData } from "@/hooks/use-admin-dashboard";

interface AdminHeaderProps {
  t: any;
  lang: Language;
  currentNav: string;
  underAttackMode: boolean;
  health: HealthData | null;
  setMobileMenuOpen: (v: boolean) => void;
  changeLanguage: (lang: Language) => void;
  toggleUnderAttackMode: () => void;
  fetchHealth: () => void;
  setShowHealthModal: (v: boolean) => void;
}

export default function AdminHeader({
  t,
  lang,
  currentNav,
  underAttackMode,
  health,
  setMobileMenuOpen,
  changeLanguage,
  toggleUnderAttackMode,
  fetchHealth,
  setShowHealthModal,
}: AdminHeaderProps) {
  return (
    <header className="h-16 border-b border-primary/20 bg-[#090d16]/85 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Mobile Hamburger & Breadcrumbs */}
      <div className="flex items-center gap-2.5">
        {/* Hamburger Button (Mobile Only) */}
        <Button
          size="icon"
          variant="outline"
          aria-label="Open mobile navigation menu"
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden h-8 w-8 border-primary/30 text-primary hover:bg-primary/10 shrink-0"
        >
          <Menu className="w-4 h-4" />
        </Button>

        <span className="text-muted-foreground font-medium hidden sm:inline text-xs">{t.dashboardBreadcrumb}</span>
        <ChevronRight className="w-3 h-3 text-muted-foreground hidden sm:inline" />
        <span className="text-white font-bold uppercase tracking-wider font-mono text-[11px] text-primary truncate max-w-[120px] sm:max-w-none">
          {currentNav}
        </span>
      </div>

      {/* Master Under Attack Toggle, Language Selector & Diagnostics */}
      <div className="flex items-center gap-2">
        {/* Language Switcher (ID / EN) */}
        <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-primary/20">
          <button
            onClick={() => changeLanguage("id")}
            aria-label="Ganti bahasa ke Bahasa Indonesia"
            className={`px-2 py-1 text-[11px] font-bold rounded-md transition ${
              lang === "id" ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
            }`}
          >
            ID
          </button>
          <button
            onClick={() => changeLanguage("en")}
            aria-label="Switch language to English"
            className={`px-2 py-1 text-[11px] font-bold rounded-md transition ${
              lang === "en" ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
            }`}
          >
            EN
          </button>
        </div>

        {/* 1-Click Under Attack Mode Master Switch with Confirm */}
        <Button
          size="sm"
          variant={underAttackMode ? "cyber" : "outline"}
          aria-label="Toggle Under Attack Mode"
          onClick={toggleUnderAttackMode}
          className={`gap-1.5 text-xs font-bold ${
            underAttackMode
              ? "shadow-lg shadow-primary/30 animate-pulse border-primary"
              : "border-primary/30 text-primary hover:bg-primary/10"
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{underAttackMode ? t.underAttackOn : t.underAttackOff}</span>
          <span className="sm:hidden">{underAttackMode ? "ATTACK ON" : "NORMAL"}</span>
        </Button>

        {/* Terminus Health Inspector Button */}
        <Button
          variant="outline"
          size="sm"
          aria-label="Open Terminus diagnostics inspector"
          onClick={() => {
            fetchHealth();
            setShowHealthModal(true);
          }}
          className="gap-2 border-primary/30 text-primary hover:bg-primary/10 px-2.5"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="font-medium text-xs hidden lg:inline">
            {health?.status === "ok" ? t.terminusHealthy : t.terminusDiagnostics}
          </span>
        </Button>
      </div>
    </header>
  );
}
