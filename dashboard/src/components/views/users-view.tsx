"use client";

import React, { useState } from "react";
import { Users, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface UsersViewProps {
  t: any;
  adminUsers: any[];
  onAddUser: (username: string, email: string, role: string, pass: string) => void;
  onDeleteUser: (id: string) => void;
}

export default function UsersView({ t, adminUsers, onAddUser, onDeleteUser }: UsersViewProps) {
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("analyst");
  const [newPass, setNewPass] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newEmail || !newPass) return;
    onAddUser(newUsername, newEmail, newRole, newPass);
    setNewUsername("");
    setNewEmail("");
    setNewPass("");
  };

  return (
    <Card className="border-primary/20 bg-card/85">
      <CardHeader className="border-b border-border/80 pb-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> {t.usersTitle}
        </CardTitle>
        <CardDescription className="text-[11px]">{t.usersDesc}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-6">
        <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-secondary/30 border border-primary/20 space-y-3">
          <div className="text-xs font-bold text-white">{t.btnAddUser}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Username</label>
              <Input
                placeholder="e.g. secops_admin"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Email</label>
              <Input
                type="email"
                placeholder="secops@defense.local"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-card/80 px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="superadmin">Super Admin</option>
                <option value="analyst">Security Analyst</option>
                <option value="auditor">Auditor (Read-Only)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
                className="text-xs"
              />
            </div>
          </div>
          <Button type="submit" variant="cyber" className="text-xs font-bold gap-1.5 mt-2">
            <Plus className="w-3.5 h-3.5" /> {t.btnAddUser}
          </Button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
              <tr>
                <th className="py-2.5 px-4">Username</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {adminUsers.map((u) => (
                <tr key={u.id} className="hover:bg-accent/40 transition">
                  <td className="py-2.5 px-4 text-white font-sans font-bold">{u.username}</td>
                  <td className="py-2.5 px-4 text-muted-foreground">{u.email}</td>
                  <td className="py-2.5 px-4">
                    <Badge variant="outline" className="text-[9px] border-primary/30 text-primary uppercase">
                      {u.role}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4 text-emerald-400 font-sans text-[11px]">ACTIVE</td>
                  <td className="py-2.5 px-4 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteUser(u.id)}
                      className="text-destructive hover:bg-destructive/10 text-xs h-7"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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
