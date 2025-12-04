'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Calendar, ArrowLeft } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { Course, DayOfWeek, ClassType } from '@/types'

export default function CreateSchedulePage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isLecturer } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [formData, setFormData] = useState({
    courseCode: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    venue: '',
    type: '',
  })

  const isStaff = isAdmin || isLecturer

  const dayOptions = [
    { value: DayOfWeek.MONDAY, label: 'Monday' },
    { value: DayOfWeek.TUESDAY, label: 'Tuesday' },
    { value: DayOfWeek.WEDNESDAY, label: 'Wednesday' },
    { value: DayOfWeek.THURSDAY, label: 'Thursday' },
    { value: DayOfWeek.FRIDAY, label: 'Friday' },
    { value: DayOfWeek.SATURDAY, label: 'Saturday' },
    { value: DayOfWeek.SUNDAY, label: 'Sunday' },
  ]

  const typeOptions = [
    { value: ClassType.LECTURE, label: 'Lecture' },
    { value: ClassType.SEMINAR, label: 'Seminar' },
    { value: ClassType.LAB, label: 'Lab' },
    { value: ClassType.TUTORIAL, label: 'Tutorial' },
  ]

  useEffect(() => {
    if (!isAuthenticated || !isStaff) {
      router.push('/auth/login')
      return
    }

    const fetchCourses = async () => {
      try {
        const response = await apiClient.getCourses({ limit: 100 })
        if (response.success && response.data) {
          setCourses(response.data.data.items)
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      }
    }

    fetchCourses()
  }, [isAuthenticated, isStaff, router])

  // Redirect if not authenticated or not staff
  if (!isAuthenticated || !isStaff) {
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateTime = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return false

    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)

    return end > start
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.courseCode || !formData.dayOfWeek || !formData.startTime ||
        !formData.endTime || !formData.venue.trim() || !formData.type) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!validateTime(formData.startTime, formData.endTime)) {
      toast({
        title: "Validation Error",
        description: "End time must be after start time",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.createSchedule({
        courseCode: formData.courseCode,
        dayOfWeek: formData.dayOfWeek as DayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        venue: formData.venue.trim(),
        type: formData.type as ClassType,
      })

      if (response.success) {
        toast({
          title: "Success",
          description: "Schedule created successfully",
        })
        router.push('/schedule')
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create schedule",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Create schedule failed:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
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
            <Calendar className="h-8 w-8" />
            Create Schedule
          </h1>
          <p className="text-muted-foreground">
            Add a new class schedule to the system
          </p>
        </div>

        {/* Form */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Schedule Information</CardTitle>
            <CardDescription>
              Enter the details for the new class schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="courseCode">Course *</Label>
                  <Select value={formData.courseCode} onValueChange={(value) => handleSelectChange('courseCode', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.code} value={course.code}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dayOfWeek">Day of Week *</Label>
                  <Select value={formData.dayOfWeek} onValueChange={(value) => handleSelectChange('dayOfWeek', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOptions.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Class Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="venue">Venue *</Label>
                  <Input
                    id="venue"
                    name="venue"
                    type="text"
                    placeholder="e.g., Room 101, Lab A"
                    value={formData.venue}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Schedule'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
