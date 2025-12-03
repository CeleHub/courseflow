'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
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
  Plus
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { Course, Department, Level } from '@/types'

export default function CoursesPage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isLecturer } = useAuth()
  const { toast } = useToast()

  // Check if user is staff (admin or lecturer)
  const isStaff = isAdmin || isLecturer
  const [courses, setCourses] = useState<Course[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const levelOptions = [
    { value: Level.LEVEL_100, label: '100 Level' },
    { value: Level.LEVEL_200, label: '200 Level' },
    { value: Level.LEVEL_300, label: '300 Level' },
    { value: Level.LEVEL_400, label: '400 Level' },
    { value: Level.LEVEL_500, label: '500 Level' },
  ]

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit: 12,
      }

      if (selectedDepartment && selectedDepartment !== 'all') params.departmentCode = selectedDepartment
      if (selectedLevel && selectedLevel !== 'all') params.level = selectedLevel

      const response = await apiClient.getCourses(params)

      if (response.success && response.data) {
        setCourses(response.data.data.items)
        setTotalPages(response.data.data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await apiClient.getDepartments({ limit: 100 })
      if (response.success && response.data) {
        setDepartments(response.data.data.items)
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [currentPage, selectedDepartment, selectedLevel])

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleReset = () => {
    setSearchTerm('')
    setSelectedDepartment('all')
    setSelectedLevel('all')
    setCurrentPage(1)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setSelectedFile(file)
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      })
    }
  }

  const handleBulkUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)
      const response = await apiClient.uploadCoursesBulk(selectedFile)

      if (response.success) {
        toast({
          title: "Upload Successful",
          description: "Courses have been uploaded successfully",
        })
        setIsUploadDialogOpen(false)
        setSelectedFile(null)
        fetchCourses()
      } else {
        toast({
          title: "Upload Failed",
          description: response.error || "Failed to upload courses",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Bulk upload failed:', error)
      toast({
        title: "Upload Error",
        description: "An error occurred during upload",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await apiClient.getCoursesBulkTemplate()
      if (response.success && response.data) {
        // Create a download link for the template
        const blob = new Blob([response.data as string], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'courses_template.csv'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        toast({
          title: "Download Failed",
          description: "Failed to download template",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Template download failed:', error)
      toast({
        title: "Download Error",
        description: "An error occurred while downloading template",
        variant: "destructive",
      })
    }
  }

  const getLevelBadgeColor = (level: Level) => {
    switch (level) {
      case Level.LEVEL_100: return 'bg-green-100 text-green-800'
      case Level.LEVEL_200: return 'bg-blue-100 text-blue-800'
      case Level.LEVEL_300: return 'bg-yellow-100 text-yellow-800'
      case Level.LEVEL_400: return 'bg-orange-100 text-orange-800'
      case Level.LEVEL_500: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Courses
          </h1>
          <p className="text-muted-foreground">
            Browse and explore all available courses across departments
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
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

              {isAuthenticated && isStaff && (
                <>
                  <Button variant="outline" onClick={handleDownloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Template
                  </Button>

                  <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
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
                              {selectedFile ? selectedFile.name : 'Select a CSV file'}
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
                          <p>• CSV file should contain columns: code, name, level, credits, departmentCode</p>
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
                          {isUploading ? 'Uploading...' : 'Upload'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button variant="default" onClick={() => router.push('/courses/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Course
                  </Button>
                </>
              )}

              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
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
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredCourses.length} of {courses.length} courses
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{course.code}</CardTitle>
                        <CardDescription className="font-medium text-foreground">
                          {course.name}
                        </CardDescription>
                      </div>
                      <Badge className={getLevelBadgeColor(course.level)}>
                        {course.level.replace('LEVEL_', '')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{course.department?.name || course.departmentCode}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="h-4 w-4" />
                        <span>{course.credits} Credit{course.credits !== 1 ? 's' : ''}</span>
                      </div>

                      {course.schedules && course.schedules.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{course.schedules.length} Schedule{course.schedules.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No courses found matching your criteria</p>
                  <p className="text-sm text-muted-foreground mt-2">
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
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {[...Array(Math.min(5, totalPages))].map((_, index) => {
                    const page = index + 1
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
  )
}
