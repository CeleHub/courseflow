"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, Lock, Eye, EyeOff, User, IdCard, Shield } from "lucide-react";
import { Role } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import type { Department } from "@/types";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    matricNO: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    role: Role.STUDENT,
    verificationCode: "",
    departmentCode: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [deptError, setDeptError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { register } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const needsDepartment = formData.role !== Role.ADMIN;
  const needsVerificationCode = [Role.LECTURER, Role.HOD, Role.ADMIN].includes(formData.role);

  const fetchDepartments = async () => {
    setDeptError(null);
    setDeptLoading(true);
    try {
      const response = await apiClient.getDepartments({ limit: 100 });
      const result = getItemsFromResponse<Department>(response);
      if (result) setDepartments(result.items);
    } catch {
      setDeptError("Failed to load departments. Retry.");
    } finally {
      setDeptLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (needsDepartment && !formData.departmentCode?.trim()) {
      toast({ title: "Please select your department", variant: "destructive" });
      return;
    }
    if (needsVerificationCode && !formData.verificationCode?.trim()) {
      toast({ title: "Verification code is required", variant: "destructive" });
      return;
    }
    setSubmitError(null);
    setIsLoading(true);
    try {
      const payload: any = {
        matricNO: formData.matricNO.trim(),
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim() || undefined,
        role: formData.role,
        verificationCode: needsVerificationCode ? formData.verificationCode.trim() : undefined,
        departmentCode: needsDepartment ? formData.departmentCode : undefined,
        phone: formData.phone.trim() || undefined,
      };
      const result = await register(payload);
      if (result.success) router.push("/dashboard");
      else setSubmitError(result.error || "Registration failed");
    } catch (err) {
      setSubmitError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "role") {
        if (value === Role.ADMIN) next.departmentCode = "";
        next.verificationCode = "";
        next.phone = "";
      }
      return next;
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in your details to get started</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {submitError && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {submitError}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="text-base min-h-[44px]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="matricNO">Matric / Staff number *</Label>
          <Input
            id="matricNO"
            placeholder="CS/2023/001"
            value={formData.matricNO}
            onChange={(e) => handleChange("matricNO", e.target.value)}
            className="text-base min-h-[44px]"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@university.edu"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="text-base min-h-[44px]"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className="text-base min-h-[44px] pr-12"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-0 h-full min-w-[44px] flex items-center justify-center text-gray-500"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password *</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            className="text-base min-h-[44px]"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={formData.role} onValueChange={(v) => handleChange("role", v)}>
            <SelectTrigger className="text-base min-h-[44px]">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Role.STUDENT}>Student</SelectItem>
              <SelectItem value={Role.LECTURER}>Lecturer</SelectItem>
              <SelectItem value={Role.HOD}>HOD</SelectItem>
              <SelectItem value={Role.ADMIN}>Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div
          className="grid transition-[grid-template-rows] duration-300 ease-in-out"
          style={{ gridTemplateRows: needsDepartment ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="space-y-2 pt-0">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={formData.departmentCode}
                onValueChange={(v) => {
                  if (v === "__retry__") {
                    fetchDepartments();
                    return;
                  }
                  handleChange("departmentCode", v);
                }}
                disabled={deptLoading}
              >
                <SelectTrigger className="text-base min-h-[44px]">
                  {deptLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      Loading departments…
                    </span>
                  ) : (
                    <SelectValue placeholder={deptError ? "Failed to load departments. Retry." : "Select department..."} />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {deptLoading ? (
                    <SelectItem value="" disabled>
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                        Loading departments…
                      </span>
                    </SelectItem>
                  ) : deptError ? (
                    <SelectItem value="__retry__" className="text-indigo-600 font-medium cursor-pointer">
                      Failed to load departments. Retry.
                    </SelectItem>
                  ) : (
                    departments.map((d) => (
                      <SelectItem key={d.code} value={d.code}>
                        {d.name} ({d.code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div
          className="grid transition-[grid-template-rows] duration-300 ease-in-out"
          style={{ gridTemplateRows: needsVerificationCode ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="space-y-2 pt-0">
              <Label htmlFor="verificationCode">Verification code *</Label>
              <Input
                id="verificationCode"
                placeholder="XXXX-XXXX"
                value={formData.verificationCode}
                onChange={(e) => handleChange("verificationCode", e.target.value)}
                className="text-base min-h-[44px]"
              />
            </div>
          </div>
        </div>

        <div
          className="grid transition-[grid-template-rows] duration-300 ease-in-out"
          style={{
            gridTemplateRows: formData.role === Role.LECTURER || formData.role === Role.HOD ? "1fr" : "0fr",
          }}
        >
          <div className="overflow-hidden">
            <div className="space-y-2 pt-0">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                placeholder="+234 800 000 0000"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="text-base min-h-[44px]"
              />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
