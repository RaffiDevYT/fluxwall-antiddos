"use client";

import React, { useState } from "react";
import { Globe, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface GeoIpViewProps {
  t: any;
  blockedCountries: string[];
  onAddCountry: (code: string) => void;
  onRemoveCountry: (code: string) => void;
}

export default function GeoIpView({ t, blockedCountries, onAddCountry, onRemoveCountry }: GeoIpViewProps) {
  const [countryCode, setCountryCode] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryCode) return;
    onAddCountry(countryCode.toUpperCase().trim());
    setCountryCode("");
  };

  return (
    <Card className="border-primary/20 bg-card/85">
      <CardHeader className="border-b border-border/80 pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" /> {t.geoipTitle}
        </CardTitle>
        <CardDescription className="text-[11px]">{t.geoipDesc}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-6">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            placeholder={t.placeholderGeoip}
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            maxLength={2}
            required
            className="text-xs font-mono uppercase w-48"
          />
          <Button type="submit" variant="cyber" className="text-xs font-bold gap-1.5 px-4">
            <Plus className="w-3.5 h-3.5" /> {t.btnAddCountry}
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {blockedCountries.map((c) => (
            <Badge
              key={c}
              variant="destructive"
              className="text-xs py-1.5 px-3 flex items-center gap-2 font-mono font-bold"
            >
              <span>{c}</span>
              <button
                type="button"
                onClick={() => onRemoveCountry(c)}
                className="hover:text-white transition cursor-pointer"
              >
                &times;
              </button>
            </Badge>
          ))}
          {blockedCountries.length === 0 && (
            <div className="text-xs text-muted-foreground py-4">{t.noCountriesBlocked}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
