"use client";

import React, { useState } from "react";
import { Shield, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface CustomWafViewProps {
  t: any;
  customWafRules: any[];
  onAddRule: (rule: any) => void;
  onDeleteRule: (id: string) => void;
}

export default function CustomWafView({ t, customWafRules, onAddRule, onDeleteRule }: CustomWafViewProps) {
  const [ruleName, setRuleName] = useState("");
  const [rulePattern, setRulePattern] = useState("");
  const [ruleTarget, setRuleTarget] = useState("uri");
  const [ruleAction, setRuleAction] = useState("block");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName || !rulePattern) return;
    onAddRule({
      name: ruleName,
      pattern: rulePattern,
      target: ruleTarget,
      action: ruleAction,
    });
    setRuleName("");
    setRulePattern("");
  };

  return (
    <Card className="border-primary/20 bg-card/85">
      <CardHeader className="border-b border-border/80 pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> {t.customWafTitle}
        </CardTitle>
        <CardDescription className="text-[11px]">{t.customWafDesc}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-6">
        <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-3">
          <div className="text-xs font-bold text-white">{t.btnAddRule}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Rule Name</label>
              <Input
                placeholder="e.g. Block WP-Login"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                required
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Regex Pattern</label>
              <Input
                placeholder="e.g. /wp-login\.php"
                value={rulePattern}
                onChange={(e) => setRulePattern(e.target.value)}
                required
                className="text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Inspect Target</label>
              <select
                value={ruleTarget}
                onChange={(e) => setRuleTarget(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-card/80 px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="uri">Request URI</option>
                <option value="user_agent">User-Agent Header</option>
                <option value="query_string">Query String</option>
                <option value="headers">All Headers</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Action</label>
              <select
                value={ruleAction}
                onChange={(e) => setRuleAction(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-card/80 px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="block">403 Forbidden Drop</option>
                <option value="challenge">JS Challenge PoW</option>
                <option value="ban">Instant 1-Hour Ban</option>
              </select>
            </div>
          </div>
          <Button type="submit" variant="cyber" className="text-xs font-bold gap-1.5 mt-2">
            <Plus className="w-3.5 h-3.5" /> {t.btnAddRule}
          </Button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
              <tr>
                <th className="py-2.5 px-4">Rule Name</th>
                <th className="py-2.5 px-4">Target</th>
                <th className="py-2.5 px-4">Regex Pattern</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {customWafRules.map((r) => (
                <tr key={r.id} className="hover:bg-accent/40 transition">
                  <td className="py-2.5 px-4 text-white font-sans font-semibold">{r.name}</td>
                  <td className="py-2.5 px-4 text-primary uppercase text-[10px]">{r.target}</td>
                  <td className="py-2.5 px-4 text-sky-400">{r.pattern}</td>
                  <td className="py-2.5 px-4">
                    <Badge variant="destructive" className="text-[9px] py-0 uppercase">
                      {r.action}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteRule(r.id)}
                      className="text-destructive hover:bg-destructive/10 text-xs h-7"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {customWafRules.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground font-sans">
                    {t.noCustomRules}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
