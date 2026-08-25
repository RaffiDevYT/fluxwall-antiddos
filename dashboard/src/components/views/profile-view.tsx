"use client";

import React, { useState } from "react";
import { Key, Copy, User, UserCheck, RefreshCw, CheckCircle2, RotateCcw, Lock, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ProfileViewProps {
  t: any;
  profileApiKey: string;
  handleRegenerateApiKey: () => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showApiKey: boolean;
  setShowApiKey: (v: boolean | ((p: boolean) => boolean)) => void;
  handleChangePassword: (e: React.FormEvent) => void;
  showToast: (msg: string) => void;
}

export default function ProfileView({
  t,
  profileApiKey,
  handleRegenerateApiKey,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showApiKey,
  setShowApiKey,
  handleChangePassword,
  showToast,
}: ProfileViewProps) {
  const [copiedKey, setCopiedKey] = useState(false);

  return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Card & API Key */}
              <Card className="border-primary/20 bg-card/85">
                <CardHeader className="border-b border-border/80 pb-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> {t.profileTitle}
                  </CardTitle>
                  <CardDescription className="text-[11px]">{t.profileDesc}</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-primary/20">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">admin</div>
                      <div className="text-muted-foreground text-[11px]">{t.roleSuperAdmin}</div>
                      <Badge variant="default" className="text-[9px] mt-1">SESSION ACTIVE</Badge>
                    </div>
                  </div>

                  {/* REST API Key */}
                  <div className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-primary" /> {t.apiKeyTitle}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Toggle API Key visibility"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="h-6 w-6 text-muted-foreground hover:text-white"
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={profileApiKey}
                        readOnly
                        aria-label="API Key value"
                        className="font-mono text-xs text-primary bg-[#070a12]"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label="Copy API Key to clipboard"
                        onClick={() => {
                          navigator.clipboard.writeText(profileApiKey);
                          showToast("API Key copied to clipboard!");
                        }}
                        className="shrink-0 text-xs border-primary/30 text-primary gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="Regenerate REST API Key"
                      onClick={handleRegenerateApiKey}
                      className="text-[11px] border-primary/30 text-muted-foreground hover:text-primary mt-1 gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" /> {t.btnRegenKey}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Change Password Form */}
              <Card className="border-primary/20 bg-card/85">
                <CardHeader className="border-b border-border/80 pb-4">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" /> {t.changePassTitle}
                  </CardTitle>
                  <CardDescription className="text-[11px]">Update your administrator access credentials</CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label htmlFor="new-admin-password-field" className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t.newPassLabel}
                      </label>
                      <Input
                        id="new-admin-password-field"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirm-admin-password-field" className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t.confirmPassLabel}
                      </label>
                      <Input
                        id="confirm-admin-password-field"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>
                    <Button type="submit" variant="cyber" className="w-full text-xs font-bold gap-2" aria-label="Save new administrator password">
                      <Lock className="w-3.5 h-3.5" /> {t.btnSavePass}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
  );
}