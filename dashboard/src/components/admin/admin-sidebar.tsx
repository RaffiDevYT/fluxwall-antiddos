"use client";

import React from "react";
import { ShieldAlert, UserCheck, LogOut, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SidebarNav, { NavSection } from "@/components/views/sidebar-nav";

interface AdminSidebarProps {
  t: any;
  currentNav: NavSection;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  handleNavSelect: (nav: NavSection) => void;
  collapsedSections: Record<string, boolean>;
  toggleSection: (sec: string) => void;
  handleLogout: () => void;
  liveLogs: any[];
  bans: any[];
  whitelist: any[];
  blacklist: any[];
  blockedCountries: any[];
  customWafRules: any[];
  upstreams: any[];
  sslDomains: any[];
  adminUsers: any[];
}

export default function AdminSidebar({
  t,
  currentNav,
  mobileMenuOpen,
  setMobileMenuOpen,
  handleNavSelect,
  collapsedSections,
  toggleSection,
  handleLogout,
  liveLogs,
  bans,
  whitelist,
  blacklist,
  blockedCountries,
  customWafRules,
  upstreams,
  sslDomains,
  adminUsers,
}: AdminSidebarProps) {
  const renderNav = () => (
    <SidebarNav
      currentNav={currentNav}
      handleNavSelect={handleNavSelect}
      t={t}
      collapsedSections={collapsedSections}
      toggleSection={toggleSection}
      liveLogs={liveLogs}
      bans={bans}
      whitelist={whitelist}
      blacklist={blacklist}
      blockedCountries={blockedCountries}
      customWafRules={customWafRules}
      upstreams={upstreams}
      sslDomains={sslDomains}
      adminUsers={adminUsers}
    />
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Navigation */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-[#090d16] border-r border-primary/20 z-50 transform transition-transform duration-300 md:hidden flex flex-col justify-between ${
          mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="h-16 px-5 border-b border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary/10 border border-primary/30 rounded-xl">
                <ShieldAlert className="w-5 h-5 text-primary" />
              </div>
              <span className="font-black text-sm tracking-tight text-white">{t.brandTitle}</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Close mobile navigation drawer"
              onClick={() => setMobileMenuOpen(false)}
              className="text-muted-foreground hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="p-2 overflow-y-auto max-h-[calc(100vh-140px)]">
            {renderNav()}
          </div>
        </div>

        <div className="p-4 border-t border-primary/20 bg-[#070a12]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-tight">{t.adminPortal}</div>
                <div className="text-[10px] text-primary">{t.authenticated}</div>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Log out of admin session"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Sleek Enterprise Sidebar */}
      <aside className="w-64 border-r border-primary/20 bg-[#090d16]/95 backdrop-blur-xl flex flex-col justify-between shrink-0 hidden md:flex min-h-screen sticky top-0">
        {/* Brand Header */}
        <div>
          <div className="h-16 px-6 border-b border-primary/20 flex items-center gap-3">
            <div className="p-2 bg-primary/10 border border-primary/30 rounded-xl shadow-inner shadow-primary/20">
              <ShieldAlert className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white">{t.brandTitle}</span>
                <Badge variant="default" className="text-[8px] py-0 px-1 font-bold">
                  v1.0.1
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">{t.brandSubtitle}</p>
            </div>
          </div>

          {/* Navigation Links */}
          {renderNav()}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-primary/20 bg-[#070a12]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-tight">{t.adminPortal}</div>
                <div className="text-[10px] text-primary">{t.authenticated}</div>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Log out of admin session"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-7 w-7"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
