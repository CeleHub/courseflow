"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const AVATAR_COLORS = ["bg-indigo-500", "bg-violet-500", "bg-blue-500", "bg-emerald-500"] as const;

function getInitials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (parts[0][0] || "").toUpperCase();
  }
  return (email[0] || "?").toUpperCase();
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const response = await apiClient.updateUser(user.id, { name: name.trim() || undefined, phone: phone.trim() || undefined });
      if (response.success) {
        toast({ title: "Saved", description: "Profile updated successfully" });
      } else {
        toast({ title: "Error", description: response.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await apiClient.forgotPassword(user.email);
      toast({ title: "Reset link sent", description: `A password reset link has been sent to ${user.email}` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to send reset link", variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold ${AVATAR_COLORS[0]}`}>
              {getInitials(user.name, user.email)}
            </div>
            <div>
              <CardTitle className="text-xl">{user.name || user.email}</CardTitle>
              <Badge variant="secondary" className="mt-1">{user.role}</Badge>
              <p className="text-sm text-gray-500 mt-1">{user.email}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <p className="text-sm text-gray-500">Email cannot be changed here.</p>
              <Input value={user.email} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button type="submit" disabled={saving}>Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <p className="text-sm text-gray-500">We&apos;ll send a reset link to your email address.</p>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handlePasswordReset}>Send Reset Link</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-gray-500">Department:</span> {user.departmentCode || "—"}</p>
          <p><span className="text-gray-500">Matric/Staff No:</span> {user.matricNO}</p>
          <p><span className="text-gray-500">Last login:</span> {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
