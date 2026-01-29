"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Search,
  Filter,
  Clock,
  Building2,
  GraduationCap,
  RefreshCw,
  Upload,
  Download,
  FileText,
  Plus,
  User as UserIcon,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import { Course, Department, Level, Semester } from "@/types";

export default function CoursesPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLecturer, isHod } = useAuth();
  const { toast } = useToast();

  const isStaff = isAdmin || isLecturer || isHod;
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const levelOptions = [
    { value: Level.LEVEL_100, label: "100 Level" },
    { value: Level.LEVEL_200, label: "200 Level" },
    { value: Level.LEVEL_300, label: "300 Level" },
    { value: Level.LEVEL_400, label: "400 Level" },
    { value: Level.LEVEL_500, label: "500 Level" },
  ];

  const semesterOptions = [
    { value: Semester.FIRST, label: "First Semester" },
    { value: Semester.SECOND, label: "Second Semester" },
  ];

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await apiClient.getDepartments({ limit: 100 });
        const result = getItemsFromResponse(response);
        if (result) setDepartments(result.items);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1); // Reset to page 1 when searching
    }, 500);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 12,
      };

      if (searchTerm) params.searchTerm = searchTerm;

      if (selectedDepartment && selectedDepartment !== "all")
        params.departmentCode = selectedDepartment;
      if (selectedLevel && selectedLevel !== "all")
        params.level = selectedLevel;
      if (selectedSemester && selectedSemester !== "all")
        params.semester = selectedSemester;

      const response = await apiClient.getCourses(params);
      const result = getItemsFromResponse(response);
      if (result) {
        setCourses(result.items);
        setTotalPages(result.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    searchTerm,
    selectedDepartment,
    selectedLevel,
    selectedSemester,
    toast,
  ]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleReset = () => {
    setSearchTerm("");
    setSelectedDepartment("all");
    setSelectedLevel("all");
    setSelectedSemester("all");
    setCurrentPage(1);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const response = await apiClient.uploadCoursesBulk(selectedFile);

      if (response.success) {
        toast({
          title: "Upload Successful",
          description: "Courses have been uploaded successfully",
        });
        setIsUploadDialogOpen(false);
        setSelectedFile(null);
        fetchCourses();
      } else {
        toast({
          title: "Upload Failed",
          description: response.error || "Failed to upload courses",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Bulk upload failed:", error);
      toast({
        title: "Upload Error",
        description: "An error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await apiClient.getCoursesBulkTemplate();
      if (response.success && typeof response.data === "string") {
        const blob = new Blob([response.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "courses_template.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        toast({
          title: "Download Failed",
          description: "Failed to download template",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Template download failed:", error);
      toast({
        title: "Download Error",
        description: "An error occurred while downloading template",
        variant: "destructive",
      });
    }
  };

  const getLevelBadgeColor = (level: Level) => {
    switch (level) {
      case Level.LEVEL_100:
        return "bg-green-100 text-green-800";
      case Level.LEVEL_200:
        return "bg-blue-100 text-blue-800";
      case Level.LEVEL_300:
        return "bg-yellow-100 text-yellow-800";
      case Level.LEVEL_400:
        return "bg-orange-100 text-orange-800";
      case Level.LEVEL_500:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0">
                <BookOpen className="h-8 w-8 md:h-10 md:w-10 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Course Catalog
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  Explore comprehensive course listings with detailed
                  information
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8 border-2 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Filter className="h-5 w-5 text-primary" />
              </div>
              Search & Filter Courses
            </CardTitle>
            <CardDescription>
              Find courses by name, code, department, or level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or code..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.code} value={dept.code}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {levelOptions.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedSemester}
                onValueChange={setSelectedSemester}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {semesterOptions.map((semester) => (
                    <SelectItem key={semester.value} value={semester.value}>
                      {semester.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2 lg:col-span-1">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>

              {isAuthenticated && isStaff && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleDownloadTemplate}
                    className="lg:col-span-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Template
                  </Button>

                  <Dialog
                    open={isUploadDialogOpen}
                    onOpenChange={setIsUploadDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" className="lg:col-span-2">
                        <Upload className="h-4 w-4 mr-2" />
                        Bulk Upload
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Bulk Upload Courses</DialogTitle>
                        <DialogDescription>
                          Upload a CSV file to create multiple courses at once
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              {selectedFile
                                ? selectedFile.name
                                : "Select a CSV file"}
                            </p>
                            <Input
                              type="file"
                              accept=".csv"
                              onChange={handleFileSelect}
                              className="cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>
                            • CSV file should contain: code, name, level,
                            credits, departmentCode, lecturerEmail
                          </p>
                          <p>• Download the template for the correct format</p>
                          <p>• Maximum file size: 5MB</p>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsUploadDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleBulkUpload}
                          disabled={!selectedFile || isUploading}
                        >
                          {isUploading ? "Uploading..." : "Upload"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="default"
                    onClick={() => router.push("/courses/create")}
                    className="lg:col-span-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Course
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-base font-medium text-muted-foreground">
                Showing{" "}
                <span className="text-foreground font-semibold">
                  {courses.length}
                </span>{" "}
                courses
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card
                  key={course.id}
                  className="transition-all hover:shadow-xl hover:scale-[1.02] border-2 hover:border-primary/20 group"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={getLevelBadgeColor(course.level)}>
                            {course.level.replace("LEVEL_", "")}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {course.code}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg font-semibold leading-tight line-clamp-2">
                          {course.name}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-muted-foreground truncate">
                          {course.department?.name || course.departmentCode}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 bg-green-50 dark:bg-green-950/30 rounded-lg">
                          <GraduationCap className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {course.credits}
                          </span>{" "}
                          Credit{course.credits !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {course.lecturer ? (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              {course.lecturer.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {course.lecturer.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="p-1.5 bg-gray-50 dark:bg-gray-950/30 rounded-lg">
                            <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <span className="text-muted-foreground text-xs">
                            No lecturer assigned
                          </span>
                        </div>
                      )}

                      {course.schedules && course.schedules.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="p-1.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                            <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {course.schedules.length}
                            </span>{" "}
                            Schedule{course.schedules.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {courses.length === 0 && (
              <Card className="border-2 border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="p-4 bg-muted/50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    No courses found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    We couldn&apos;t find any courses matching your search
                    criteria
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search terms or filters
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {[...Array(Math.min(5, totalPages))].map((_, index) => {
                    const page = index + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
