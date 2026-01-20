"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { BookOpen, ArrowLeft, User as UserIcon } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Department, Level, User } from "@/types";

export default function CreateCoursePage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLecturer } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    level: "",
    credits: "",
    departmentCode: "",
    lecturerEmail: "",
    overview: "",
    isGeneral: false,
    isLocked: false,
  });

  const isStaff = isAdmin || isLecturer;

  const levelOptions = [
    { value: Level.LEVEL_100, label: "100 Level" },
    { value: Level.LEVEL_200, label: "200 Level" },
    { value: Level.LEVEL_300, label: "300 Level" },
    { value: Level.LEVEL_400, label: "400 Level" },
    { value: Level.LEVEL_500, label: "500 Level" },
  ];

  useEffect(() => {
    if (!isAuthenticated || !isStaff) {
      router.push("/auth/login");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch departments
        const deptResponse = await apiClient.getDepartments({ limit: 100 });
        if (deptResponse.success && deptResponse.data) {
          setDepartments(deptResponse.data.data.items);
        }

        // Fetch lecturers
        const lecturerResponse = await apiClient.getUsers({
          limit: 100,
          role: "LECTURER",
        });
        if (lecturerResponse.success && lecturerResponse.data) {
          setLecturers(lecturerResponse.data.data.items);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, [isAuthenticated, isStaff, router]);

  if (!isAuthenticated || !isStaff) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.code.trim() ||
      !formData.name.trim() ||
      !formData.level ||
      !formData.credits.trim() ||
      !formData.departmentCode
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const credits = parseInt(formData.credits);
    if (isNaN(credits) || credits < 1 || credits > 10) {
      toast({
        title: "Validation Error",
        description: "Credits must be a number between 1 and 10",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.createCourse({
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        level: formData.level as Level,
        credits: credits,
        departmentCode: formData.departmentCode,
        lecturerEmail: formData.lecturerEmail || undefined,
        overview: formData.overview.trim() || undefined,
        isGeneral: formData.isGeneral,
        isLocked: formData.isLocked,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Course created successfully",
        });
        router.push("/courses");
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create course",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Create course failed:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Create Course
          </h1>
          <p className="text-muted-foreground">
            Add a new course to the system with complete details
          </p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
            <CardDescription>
              Enter all details for the new course including lecturer assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="code">
                    Course Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="code"
                    name="code"
                    type="text"
                    placeholder="e.g., CS101"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    maxLength={20}
                    style={{ textTransform: "uppercase" }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique identifier (e.g., CS101, MTH201)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credits">
                    Credits <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="credits"
                    name="credits"
                    type="number"
                    placeholder="e.g., 3"
                    value={formData.credits}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="10"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">
                    Course Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="e.g., Introduction to Computer Science"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">
                    Level <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) =>
                      handleSelectChange("level", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levelOptions.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departmentCode">
                    Department <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.departmentCode}
                    onValueChange={(value) =>
                      handleSelectChange("departmentCode", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.code} value={dept.code}>
                          {dept.name} ({dept.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="lecturerEmail">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Assigned Lecturer (Optional)
                    </div>
                  </Label>
                  <Select
                    value={formData.lecturerEmail}
                    onValueChange={(value) =>
                      handleSelectChange("lecturerEmail", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lecturer (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No lecturer assigned</SelectItem>
                      {lecturers.map((lecturer) => (
                        <SelectItem key={lecturer.id} value={lecturer.email}>
                          {lecturer.name} ({lecturer.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Assign a lecturer to this course
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="overview">Course Overview (Optional)</Label>
                  <Textarea
                    id="overview"
                    name="overview"
                    placeholder="Enter course description/overview..."
                    value={formData.overview}
                    onChange={(e) => handleInputChange(e)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isGeneral"
                      name="isGeneral"
                      checked={formData.isGeneral}
                      onChange={(e) => setFormData(prev => ({ ...prev, isGeneral: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="isGeneral" className="cursor-pointer">
                      General Course (GST) - University-wide course
                    </Label>
                  </div>
                </div>

                {isAdmin && (
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isLocked"
                        name="isLocked"
                        checked={formData.isLocked}
                        onChange={(e) => setFormData(prev => ({ ...prev, isLocked: e.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="isLocked" className="cursor-pointer">
                        Lock Course (Prevent deletion)
                      </Label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Course"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
