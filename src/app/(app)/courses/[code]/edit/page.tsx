"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, ArrowLeft, Loader2 } from "lucide-react";
import { ErrorState } from "@/components/state/error-state";
import { LecturerCombobox } from "@/components/courses/lecturer-combobox";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import { Course, Department, Level, Semester } from "@/types";

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const { isAdmin, isHod, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    level: "",
    credits: "",
    semester: "FIRST",
    departmentCode: "",
    lecturerId: "",
    overview: "",
    isGeneral: false,
    isLocked: false,
  });

  const isStaff = isAdmin || isHod;

  const fetchData = useCallback(async () => {
    if (!code || !isStaff) return;
    setFetchError(null);
    setLoading(true);
    try {
      const [courseRes, deptRes] = await Promise.all([
        apiClient.getCourseByCode(code),
        apiClient.getDepartments({ limit: 100 }),
      ]);
      if (courseRes.success && courseRes.data) {
        const c = courseRes.data as Course;
        setCourse(c);
        setFormData({
          name: c.name,
          level: c.level,
          credits: String(c.credits),
          semester: c.semester,
          departmentCode: c.departmentCode,
          lecturerId: c.lecturerId ?? "",
          overview: c.overview ?? "",
          isGeneral: c.isGeneral,
          isLocked: c.isLocked,
        });
        const d = getItemsFromResponse<Department>(deptRes);
        if (d) setDepartments(d.items);
      } else {
        setFetchError("Course not found");
      }
    } catch {
      setFetchError("Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [code, isStaff]);

  useEffect(() => {
    if (code && isStaff) fetchData();
  }, [code, isStaff, fetchData]);

  if (!isStaff) {
    router.push("/courses");
    return null;
  }

  if (fetchError) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <ErrorState title={fetchError} onRetry={fetchData} />
      </div>
    );
  }

  if (loading || !course) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (isHod && user?.departmentCode !== course.departmentCode) {
    toast({ title: "You can only edit courses in your department", variant: "destructive" });
    router.push("/courses");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const credits = parseInt(formData.credits);
    if (isNaN(credits) || credits < 1 || credits > 6) {
      toast({ title: "Credits must be 1–6", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const res = await apiClient.updateCourse(code, {
        name: formData.name.trim(),
        level: formData.level as Level,
        credits,
        semester: formData.semester as Semester,
        departmentCode: formData.departmentCode,
        lecturerId: formData.lecturerId || undefined,
        overview: formData.overview.trim() || undefined,
        isGeneral: formData.isGeneral,
        isLocked: formData.isLocked,
      });
      if (res.success) {
        toast({ title: `Course ${code} updated.` });
        router.push("/courses");
      } else {
        toast({ title: (res as any).error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const levelOptions = [
    { value: Level.LEVEL_100, label: "100 Level" },
    { value: Level.LEVEL_200, label: "200 Level" },
    { value: Level.LEVEL_300, label: "300 Level" },
    { value: Level.LEVEL_400, label: "400 Level" },
    { value: Level.LEVEL_500, label: "500 Level" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Edit Course — {code}
        </h1>
      </div>

      <Card className="max-w-[560px]">
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
          <CardDescription>Update course details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Course Code</Label>
                <Input value={code} disabled className="font-mono bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Course Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  required
                  maxLength={200}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Level *</Label>
                <Select value={formData.level} onValueChange={(v) => setFormData((p) => ({ ...p, level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {levelOptions.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Credits *</Label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={formData.credits}
                  onChange={(e) => setFormData((p) => ({ ...p, credits: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Semester *</Label>
                <Select value={formData.semester} onValueChange={(v) => setFormData((p) => ({ ...p, semester: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Semester.FIRST}>First Semester</SelectItem>
                    <SelectItem value={Semester.SECOND}>Second Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select value={formData.departmentCode} onValueChange={(v) => setFormData((p) => ({ ...p, departmentCode: v, lecturerId: '' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lecturer</Label>
              <LecturerCombobox
                value={formData.lecturerId}
                onChange={(id) => setFormData((p) => ({ ...p, lecturerId: id }))}
                departmentCode={formData.departmentCode || undefined}
                placeholder="Search by name or email..."
              />
            </div>
            <div className="space-y-2">
              <Label>Overview</Label>
              <Textarea
                value={formData.overview}
                onChange={(e) => setFormData((p) => ({ ...p, overview: e.target.value }))}
                rows={4}
                maxLength={2000}
              />
            </div>
            {isAdmin && (
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isGeneral}
                    onChange={(e) => setFormData((p) => ({ ...p, isGeneral: e.target.checked }))}
                  />
                  <span>General Course</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isLocked}
                    onChange={(e) => setFormData((p) => ({ ...p, isLocked: e.target.checked }))}
                  />
                  <span>Locked</span>
                </label>
              </div>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
