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
  Calendar,
  Search,
  Filter,
  Clock,
  MapPin,
  BookOpen,
  RefreshCw,
  Upload,
  Download,
  FileText,
  Plus
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { Schedule, Department, Level, DayOfWeek, ClassType } from '@/types'

export default function SchedulePage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isLecturer } = useAuth()
  const { toast } = useToast()

  // Check if user is staff (admin or lecturer)
  const isStaff = isAdmin || isLecturer
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const dayOptions = [
    { value: DayOfWeek.MONDAY, label: 'Monday' },
    { value: DayOfWeek.TUESDAY, label: 'Tuesday' },
    { value: DayOfWeek.WEDNESDAY, label: 'Wednesday' },
    { value: DayOfWeek.THURSDAY, label: 'Thursday' },
    { value: DayOfWeek.FRIDAY, label: 'Friday' },
    { value: DayOfWeek.SATURDAY, label: 'Saturday' },
    { value: DayOfWeek.SUNDAY, label: 'Sunday' },
  ]

  const levelOptions = [
    { value: Level.LEVEL_100, label: '100 Level' },
    { value: Level.LEVEL_200, label: '200 Level' },
    { value: Level.LEVEL_300, label: '300 Level' },
    { value: Level.LEVEL_400, label: '400 Level' },
    { value: Level.LEVEL_500, label: '500 Level' },
  ]

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit: 20,
      }

      if (selectedDepartment && selectedDepartment !== 'all') params.departmentCode = selectedDepartment
      if (selectedLevel && selectedLevel !== 'all') params.level = selectedLevel
      if (selectedDay && selectedDay !== 'all') params.dayOfWeek = selectedDay

      const response = await apiClient.getSchedules(params)

      if (response.success && response.data) {
        setSchedules(response.data.data.items)
        setTotalPages(response.data.data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
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
    fetchSchedules()
  }, [currentPage, selectedDepartment, selectedLevel, selectedDay])

  const filteredSchedules = schedules.filter(schedule =>
    schedule.course?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.course?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.venue.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleReset = () => {
    setSearchTerm('')
    setSelectedDepartment('all')
    setSelectedLevel('all')
    setSelectedDay('all')
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
      const response = await apiClient.uploadSchedulesBulk(selectedFile)

      if (response.success) {
        toast({
          title: "Upload Successful",
          description: "Schedules have been uploaded successfully",
        })
        setIsUploadDialogOpen(false)
        setSelectedFile(null)
        fetchSchedules()
      } else {
        toast({
          title: "Upload Failed",
          description: response.error || "Failed to upload schedules",
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
      const response = await apiClient.getSchedulesBulkTemplate()
      if (response.success && response.data) {
        // Create a download link for the template
        const blob = new Blob([response.data as string], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'schedules_template.csv'
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

  const getClassTypeBadgeColor = (type: ClassType) => {
    switch (type) {
      case ClassType.LECTURE: return 'bg-blue-100 text-blue-800'
      case ClassType.SEMINAR: return 'bg-green-100 text-green-800'
      case ClassType.LAB: return 'bg-purple-100 text-purple-800'
      case ClassType.TUTORIAL: return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes} ${ampm}`
    } catch {
      return time
    }
  }

  // Group schedules by day
  const schedulesByDay = filteredSchedules.reduce((acc, schedule) => {
    const day = schedule.dayOfWeek
    if (!acc[day]) acc[day] = []
    acc[day].push(schedule)
    return acc
  }, {} as Record<string, Schedule[]>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0">
                <Calendar className="h-8 w-8 md:h-10 md:w-10 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Academic Timetable
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  View your class schedules organized by day with detailed time and venue information
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
              Filter Timetable
            </CardTitle>
            <CardDescription>
              Refine your schedule view by department, level, or day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search schedules..."
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

              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger>
                  <SelectValue placeholder="All Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {dayOptions.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
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
                        <DialogTitle>Bulk Upload Schedules</DialogTitle>
                        <DialogDescription>
                          Upload a CSV file to create multiple schedules at once
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
                          <p>• CSV file should contain columns: courseCode, dayOfWeek, startTime, endTime, venue, type</p>
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

                  <Button variant="default" onClick={() => router.push('/schedule/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Schedule
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

        {/* Schedule Content */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredSchedules.length} of {schedules.length} schedules
              </p>
            </div>

            {Object.keys(schedulesByDay).length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="p-4 bg-muted/50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <Calendar className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No schedules found</h3>
                  <p className="text-muted-foreground mb-4">
                    We couldn&apos;t find any schedules matching your search criteria
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters or search terms
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {dayOptions.map((dayOption) => {
                  const daySchedules = schedulesByDay[dayOption.value]
                  if (!daySchedules || daySchedules.length === 0) return null

                  return (
                    <Card key={dayOption.value} className="border-2 shadow-sm">
                      <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-2xl font-bold">{dayOption.label}</CardTitle>
                            <CardDescription className="text-base mt-1">
                              {daySchedules.length} class{daySchedules.length !== 1 ? 'es' : ''} scheduled for this day
                            </CardDescription>
                          </div>
                          <div className="p-3 bg-primary/10 rounded-xl">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {daySchedules
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((schedule) => (
                              <Card 
                                key={schedule.id} 
                                className="border-l-4 border-l-primary hover:shadow-lg transition-all group"
                              >
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge className={getClassTypeBadgeColor(schedule.type)}>
                                          {schedule.type}
                                        </Badge>
                                        <Badge variant="outline" className="font-mono text-xs">
                                          {schedule.course?.code}
                                        </Badge>
                                      </div>
                                      <CardTitle className="text-base font-semibold leading-tight">
                                        {schedule.course?.name}
                                      </CardTitle>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-3 border-t">
                                  <div className="flex items-center gap-2 text-sm">
                                    <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-muted-foreground">
                                      <span className="font-semibold text-foreground">
                                        {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                      </span>
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 text-sm">
                                    <div className="p-1.5 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                      <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="text-muted-foreground">
                                      <span className="font-semibold text-foreground">{schedule.venue}</span>
                                    </span>
                                  </div>

                                  {schedule.course && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <div className="p-1.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                                        <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                      </div>
                                      <span className="text-muted-foreground">
                                        <span className="font-semibold text-foreground">{schedule.course.credits}</span> Credits
                                      </span>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
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
