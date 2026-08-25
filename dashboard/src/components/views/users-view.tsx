"use client";

import React from "react";
import { Users, Plus, Trash2, UserCheck, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface UsersViewProps {
  t: any;
  adminUsers: any[];
  newUsername: string;
  setNewUsername: (v: string) => void;
  newUserPassword: string;
  setNewUserPassword: (v: string) => void;
  newUserRole: "super_admin" | "security_analyst" | "auditor";
  setNewUserRole: (v: "super_admin" | "security_analyst" | "auditor") => void;
  handleAddUser: (e: React.FormEvent) => void;
  handleDeleteUser: (id: string) => void;
}

export default function UsersView({
  t,
  adminUsers,
  newUsername,
  setNewUsername,
  newUserPassword,
  setNewUserPassword,
  newUserRole,
  setNewUserRole,
  handleAddUser,
  handleDeleteUser,
}: UsersViewProps) {
  return (
            <Card className="border-primary/20 bg-card/85">
              <CardHeader className="border-b border-border/80 pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> {t.usersTitle}
                </CardTitle>
                <CardDescription className="text-[11px]">{t.usersDesc}</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                {/* Add User Form */}
                <form onSubmit={handleAddUser} className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-3">
                  <div className="text-xs font-bold text-white">{t.btnAddUser}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="new-admin-user" className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t.usernameLabel}
                      </label>
                      <Input
                        id="new-admin-user"
                        placeholder="e.g. security_lead"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label htmlFor="new-admin-pass" className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t.passwordLabel}
                      </label>
                      <Input
                        id="new-admin-pass"
                        type="password"
                        placeholder="••••••••"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>
                    <div>
                      <label htmlFor="new-admin-role" className="text-[11px] font-medium text-muted-foreground block mb-1">
                        {t.roleLabel}
                      </label>
                      <select
                        id="new-admin-role"
                        value={newUserRole}
                        onChange={(e: any) => setNewUserRole(e.target.value)}
                        className="w-full h-9 rounded-lg border border-input bg-card/60 px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="security_analyst">{t.roleAnalyst}</option>
                        <option value="super_admin">{t.roleSuperAdmin}</option>
                        <option value="auditor">{t.roleAuditor}</option>
                      </select>
                    </div>
                  </div>
                  <Button type="submit" variant="cyber" className="text-xs gap-1.5 font-bold mt-2" aria-label="Add new admin user">
                    <Plus className="w-3.5 h-3.5" /> {t.btnAddUser}
                  </Button>
                </form>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                      <tr>
                        <th className="py-3 px-4">{t.tableUser}</th>
                        <th className="py-3 px-4">{t.tableRole}</th>
                        <th className="py-3 px-4">{t.tableCreated}</th>
                        <th className="py-3 px-4 text-right">{t.tableAction}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {adminUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-accent/40 transition">
                          <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center text-[10px] text-primary">
                              {user.username.substring(0, 2).toUpperCase()}
                            </div>
                            <span>{user.username}</span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={user.role === "super_admin" ? "default" : "outline"} className="text-[10px]">
                              {user.role === "super_admin"
                                ? "Super Admin"
                                : user.role === "security_analyst"
                                ? "Security Analyst"
                                : "Auditor"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {user.username === "admin" ? (
                              <span className="text-[10px] text-muted-foreground italic">Protected Root</span>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                aria-label={`Delete user ${user.username}`}
                                onClick={() => handleDeleteUser(user.username)}
                                className="text-destructive hover:bg-destructive/10 text-xs h-7 gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> {t.btnDeleteUser}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
  );
}