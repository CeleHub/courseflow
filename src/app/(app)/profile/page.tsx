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
import { Lock, Loader2 } from "lucide-react";

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
  const [passwordResetSent, setPasswordResetSent] = useState(false);

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
      setPasswordResetSent(true);
    } catch (err) {
      toast({ title: "Error", description: "Failed to send reset link", variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-[640px] mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* Section 1 — Identity card */}
      <Card className="rounded-xl border p-6">
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold ${AVATAR_COLORS[0]}`}>
            {getInitials(user.name, user.email)}
          </div>
          <p className="text-[22px] font-bold mt-4">{user.name || user.email}</p>
          <Badge variant="secondary" className="mt-2">{user.role}</Badge>
          <p className="text-sm text-gray-500 mt-2">{user.email}</p>
        </div>
      </Card>

      {/* Section 2 — Personal Information */}
      <Card className="rounded-xl border mt-4 p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleSave} className={`space-y-4 transition-opacity ${saving ? "opacity-60" : ""}`}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={saving} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2" title="Email cannot be changed here.">
                <Lock className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500">{user.email}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={saving} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Section 3 — Password Reset */}
      <Card className="rounded-xl border mt-4 p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle>Change Password</CardTitle>
          <p className="text-sm text-gray-500 mt-1">We&apos;ll send a reset link to your email address.</p>
        </CardHeader>
        <CardContent className="p-0">
          {passwordResetSent ? (
            <p className="text-sm text-green-600">A password reset link has been sent to {user.email}.</p>
          ) : (
            <Button variant="outline" onClick={handlePasswordReset} className="w-full md:w-auto">
              Send Reset Link
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Section 4 — Account Details */}
      <Card className="rounded-xl border mt-4 p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-2 text-sm">
          <p><span className="text-gray-500">Department:</span> {user.departmentCode || "—"}</p>
          <p><span className="text-gray-500">Matric/Staff No:</span> {user.matricNO}</p>
          <p><span className="text-gray-500">Account created:</span> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</p>
          <p><span className="text-gray-500">Last login:</span> {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
