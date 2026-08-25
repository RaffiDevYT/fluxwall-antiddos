"use client";

import React from "react";
import { Shield, Plus, Trash2, Sliders } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CustomWafViewProps {
  t: any;
  customWafRules: any[];
  ruleName: string;
  setRuleName: (v: string) => void;
  ruleField: string;
  setRuleField: (v: any) => void;
  ruleOp: string;
  setRuleOp: (v: any) => void;
  ruleVal: string;
  setRuleVal: (v: string) => void;
  ruleAction: string;
  setRuleAction: (v: any) => void;
  handleCreateCustomRule: (e: React.FormEvent) => void;
  handleDeleteCustomRule: (id: string) => void;
}

export default function CustomWafView({
  t,
  customWafRules,
  ruleName,
  setRuleName,
  ruleField,
  setRuleField,
  ruleOp,
  setRuleOp,
  ruleVal,
  setRuleVal,
  ruleAction,
  setRuleAction,
  handleCreateCustomRule,
  handleDeleteCustomRule,
}: CustomWafViewProps) {
  return (
          
            <Card className="border-primary/20 bg-card/85">
              <CardHeader className="border-b border-border/80 pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> {t.customWafTitle}
                </CardTitle>
                <CardDescription className="text-[11px]">{t.customWafDesc}</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                {/* Add Rule Form */}
                <form onSubmit={handleCreateCustomRule} className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-3">
                  <div className="text-xs font-bold text-white">{t.btnAddRule}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label htmlFor="custom-waf-name" className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t.ruleNameLabel}
                      </label>
                      <Input
                        id="custom-waf-name"
                        placeholder="e.g. Block WP Scanners"
                        value={ruleName}
                        onChange={(e) => setRuleName(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>

                    <div>
                      <label htmlFor="custom-waf-field" className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t.ruleFieldLabel}
                      </label>
                      <select
                        id="custom-waf-field"
                        value={ruleField}
                        onChange={(e: any) => setRuleField(e.target.value)}
                        className="w-full h-9 rounded-lg border border-input bg-card/80 px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="uri">{t.fieldUri}</option>
                        <option value="user_agent">{t.fieldUserAgent}</option>
                        <option value="query">{t.fieldQuery}</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="custom-waf-op" className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t.ruleOperatorLabel}
                      </label>
                      <select
                        id="custom-waf-op"
                        value={ruleOp}
                        onChange={(e: any) => setRuleOp(e.target.value)}
                        className="w-full h-9 rounded-lg border border-input bg-card/80 px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="contains">{t.opContains}</option>
                        <option value="equals">{t.opEquals}</option>
                        <option value="regex">{t.opRegex}</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="custom-waf-action" className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t.ruleActionLabel}
                      </label>
                      <select
                        id="custom-waf-action"
                        value={ruleAction}
                        onChange={(e: any) => setRuleAction(e.target.value)}
                        className="w-full h-9 rounded-lg border border-input bg-card/80 px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="DROP">{t.actDrop}</option>
                        <option value="CHALLENGE">{t.actChallenge}</option>
                        <option value="LOG">{t.actLog}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="custom-waf-val" className="text-[11px] font-medium text-muted-foreground block mb-1">
                      {t.ruleValueLabel}
                    </label>
                    <Input
                      id="custom-waf-val"
                      placeholder="e.g. /wp-login.php or python-requests"
                      value={ruleVal}
                      onChange={(e) => setRuleVal(e.target.value)}
                      required
                      className="text-xs font-mono"
                    />
                  </div>

                  <Button type="submit" variant="cyber" className="text-xs font-bold gap-1.5 mt-2" aria-label="Deploy WAF rule">
                    <Plus className="w-3.5 h-3.5" /> {t.btnAddRule}
                  </Button>
                </form>

                {/* Rules Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                      <tr>
                        <th className="py-3 px-4">{t.tableRuleName}</th>
                        <th className="py-3 px-4">{t.tableRuleCondition}</th>
                        <th className="py-3 px-4">{t.tableRuleAction}</th>
                        <th className="py-3 px-4 text-right">{t.tableAction}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {customWafRules.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-muted-foreground">
                            {t.noCustomRules}
                          </td>
                        </tr>
                      ) : (
                        customWafRules.map((rule) => (
                          <tr key={rule.id} className="hover:bg-accent/40 transition">
                            <td className="py-3 px-4 font-bold text-white">{rule.name}</td>
                            <td className="py-3 px-4 font-mono text-muted-foreground">
                              <span className="text-primary font-bold uppercase text-[10px] mr-1">{rule.field}</span>
                              <span className="text-[10px] mr-1">({rule.operator})</span>
                              <code className="text-sky-300 bg-black/40 px-1.5 py-0.5 rounded text-[11px]">{rule.value}</code>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={rule.action === "DROP" ? "destructive" : "default"} className="text-[10px]">
                                {rule.action}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                aria-label={`Delete rule ${rule.name}`}
                                onClick={() => handleDeleteCustomRule(rule.id)}
                                className="text-destructive hover:bg-destructive/10 text-xs h-7 gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
  );
}