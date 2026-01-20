'use client'

import { useCallback, useEffect, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import { Course, Exam, Venue, CreateExamData, College, Semester } from '@/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertTriangle,
  CalendarClock,
  FileText,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ExamsPage() {
  const { isAuthenticated, isAdmin } = useAuth()
  const { toast } = useToast()

  const [exams, setExams] = useState<Exam[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedSemester, setSelectedSemester] = useState<string>('all')

  const semesterOptions = [
    { value: Semester.FIRST, label: 'First Semester' },
    { value: Semester.SECOND, label: 'Second Semester' },
  ]
  const [formData, setFormData] = useState<CreateExamData>({
    courseCode: '',
    venueId: '',
    date: '',
    startTime: '',
    endTime: '',
    studentCount: 0,
    invigilators: '',
    targetCollege: undefined,
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const examParams: any = { page: 1, limit: 50 }
      if (selectedSemester && selectedSemester !== 'all') {
        examParams.semester = selectedSemester
      }

      const [examsRes, coursesRes, venuesRes] = await Promise.all([
        apiClient.getExams(examParams),
        apiClient.getCourses({ limit: 200 }),
        apiClient.getVenues({ page: 1, limit: 100 }),
      ])

      if (examsRes.success && examsRes.data && 'data' in examsRes.data) {
        const items =
          (examsRes.data as any).data?.items ??
          (Array.isArray((examsRes.data as any).data) ? (examsRes.data as any).data : [])
        setExams(items as Exam[])
      }

      if (coursesRes.success && coursesRes.data && 'data' in coursesRes.data) {
        const items =
          (coursesRes.data as any).data?.items ??
          (Array.isArray((coursesRes.data as any).data) ? (coursesRes.data as any).data : [])
        setCourses(items as Course[])
      }

      if (venuesRes.success && venuesRes.data && 'data' in venuesRes.data) {
        const items =
          (venuesRes.data as any).data?.items ??
          (Array.isArray((venuesRes.data as any).data) ? (venuesRes.data as any).data : [])
        setVenues(items as Venue[])
      }
    } catch (error) {
      console.error('Failed to fetch exams data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load exams',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast, selectedSemester])

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchData()
    }
  }, [isAuthenticated, isAdmin, fetchData])

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            You need admin privileges to manage exams.
          </p>
        </div>
      </div>
    )
  }

  const handleCreateChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'studentCount'
          ? Number(value) || 0
          : value,
    }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.courseCode ||
      !formData.venueId ||
      !formData.date ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.invigilators.trim() ||
      !formData.studentCount
    ) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      setCreating(true)
      const payload: CreateExamData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
      }

      const res = await apiClient.createExam(payload)
      if (res.success) {
        toast({
          title: 'Exam Scheduled',
          description: 'Exam scheduled successfully.',
        })
        setIsCreateDialogOpen(false)
        setFormData({
          courseCode: '',
          venueId: '',
          date: '',
          startTime: '',
          endTime: '',
          studentCount: 0,
          invigilators: '',
          targetCollege: undefined,
        })
        fetchData()
      } else {
        toast({
          title: 'Error',
          description:
            res.error ||
            'Failed to schedule exam. Check conflicts like capacity or ICT venue.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Create exam failed:', error)
      toast({
        title: 'Error',
        description:
          'Unexpected error. Make sure course/venue are valid and check conflicts.',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this exam?')) return

    try {
      setDeletingId(id)
      const res = await apiClient.deleteExam(id)
      if (res.success) {
        toast({
          title: 'Exam Cancelled',
          description: 'Exam deleted successfully.',
        })
        fetchData()
      } else {
        toast({
          title: 'Error',
          description: res.error || 'Failed to cancel exam',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Delete exam failed:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const formatDateTime = (iso: string, time?: string) => {
    if (time) {
      return `${new Date(iso).toLocaleDateString()} • ${time}`
    }
    return new Date(iso).toLocaleString()
  }

  const collegeOptions = [
    { value: College.CBAS, label: 'CBAS' },
    { value: College.CHMS, label: 'CHMS' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarClock className="h-7 w-7 text-primary" />
              Exams
            </h1>
            <p className="text-muted-foreground mt-1">
              Schedule exams with conflict checks on venue capacity and ICT usage.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-[180px]">
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
            <Button
              variant="outline"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Exam
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Schedule Exam</DialogTitle>
                  <DialogDescription>
                    Select a course, venue and time. The backend will enforce capacity
                    and ICT constraints.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <Select
                      value={formData.courseCode}
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, courseCode: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map(course => (
                          <SelectItem key={course.code} value={course.code}>
                            {course.code} — {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Venue</Label>
                    <Select
                      value={formData.venueId}
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, venueId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select venue" />
                      </SelectTrigger>
                      <SelectContent>
                        {venues.map(venue => (
                          <SelectItem key={venue.id} value={venue.id}>
                            {venue.name} (Cap: {venue.capacity}
                            {venue.isIct ? ', ICT' : ''})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleCreateChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        name="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={handleCreateChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        name="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={handleCreateChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentCount">Student Count</Label>
                      <Input
                        id="studentCount"
                        name="studentCount"
                        type="number"
                        min={1}
                        value={formData.studentCount || ''}
                        onChange={handleCreateChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Target College (optional, for GST)</Label>
                      <Select
                        value={formData.targetCollege || ''}
                        onValueChange={value =>
                          setFormData(prev => ({
                            ...prev,
                            targetCollege: value as College,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select college (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {collegeOptions.map(college => (
                            <SelectItem key={college.value} value={college.value}>
                              {college.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invigilators">Invigilators</Label>
                    <Input
                      id="invigilators"
                      name="invigilators"
                      placeholder="e.g. Dr. Smith, Prof. Doe"
                      value={formData.invigilators}
                      onChange={handleCreateChange}
                      required
                    />
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md p-3">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <p>
                      The backend will reject invalid schedules with errors like capacity
                      overflow, non-ICT venue for 100L/general courses, or college
                      conflicts. Surface any error messages returned to the user.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={creating}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Schedule Exam
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Exam Schedule</CardTitle>
            <CardDescription>
              List of all scheduled exams. Use this to monitor venue usage and
              detect clashes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : exams.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No exams have been scheduled yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {exams.map(exam => {
                  const course = exam.course || courses.find(c => c.code === exam.courseCode)
                  const venue = exam.venue || venues.find(v => v.id === exam.venueId)
                  return (
                    <div
                      key={exam.id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 border rounded-lg p-4 bg-background"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base">
                            {course ? `${course.code} — ${course.name}` : exam.courseCode}
                          </span>
                          {course?.level && (
                            <Badge variant="outline" className="text-[10px]">
                              {course.level.replace('LEVEL_', '')}L
                            </Badge>
                          )}
                          {course?.isGeneral && (
                            <Badge variant="secondary" className="text-[10px]">
                              General
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          {formatDateTime(exam.date, `${exam.startTime} - ${exam.endTime}`)}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {venue
                            ? `${venue.name} • Cap ${venue.capacity}${
                                venue.isIct ? ' • ICT' : ''
                              }`
                            : '—'}
                          <span className="mx-1">•</span>
                          {exam.studentCount} students
                          {exam.targetCollege && (
                            <>
                              <span className="mx-1">•</span>
                              Target: {exam.targetCollege}
                            </>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Invigilators: {exam.invigilators}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(exam.id)}
                          disabled={deletingId === exam.id}
                        >
                          {deletingId === exam.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


