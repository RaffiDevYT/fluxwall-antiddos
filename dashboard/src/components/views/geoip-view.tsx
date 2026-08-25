"use client";

import React from "react";
import { Globe, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface GeoIpViewProps {
  t: any;
  blockedCountries: string[];
  newCountryCode: string;
  setNewCountryCode: (v: string) => void;
  handleAddCountry: (e: React.FormEvent) => void;
  handleRemoveCountry: (code: string) => void;
}

export default function GeoIpView({
  t,
  blockedCountries,
  newCountryCode,
  setNewCountryCode,
  handleAddCountry,
  handleRemoveCountry,
}: GeoIpViewProps) {
  return (
          
            <Card className="border-primary/20 bg-card/85">
              <CardHeader className="border-b border-border/80 pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> {t.navGeoip}
                </CardTitle>
                <CardDescription className="text-[11px]">{t.countryCodePlaceholder}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <form onSubmit={handleAddCountry} className="flex gap-2 max-w-lg">
                  <Input
                    placeholder={t.countryCodePlaceholder}
                    aria-label="Country ISO code to block"
                    value={newCountryCode}
                    onChange={(e) => setNewCountryCode(e.target.value.toUpperCase())}
                    maxLength={2}
                    required
                  />
                  <Button type="submit" variant="cyber" aria-label="Block country code" className="gap-1.5 shrink-0 font-bold">
                    <Plus className="w-4 h-4" /> {t.btnBlockCountry}
                  </Button>
                </form>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                  {blockedCountries.map((code) => (
                    <div
                      key={code}
                      className="p-3 bg-secondary/40 border border-primary/20 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        <span className="font-mono font-bold text-white text-sm">{code}</span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Unblock country ${code}`}
                        onClick={() => handleRemoveCountry(code)}
                        className="text-muted-foreground hover:text-primary h-6 w-6"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
  );
}