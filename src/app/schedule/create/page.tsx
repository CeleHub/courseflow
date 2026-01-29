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
import { getItemsFromResponse } from '@/lib/utils'
import { Course, DayOfWeek, VenueType } from '@/types'

const VENUE_OPTIONS: { value: VenueType; label: string }[] = [
  { value: VenueType.UNIVERSITY_ICT_CENTER, label: 'University ICT Center' },
  { value: VenueType.ICT_LAB_1, label: 'ICT Lab 1' },
  { value: VenueType.ICT_LAB_2, label: 'ICT Lab 2' },
  { value: VenueType.LECTURE_HALL_1, label: 'Lecture Hall 1' },
  { value: VenueType.LECTURE_HALL_2, label: 'Lecture Hall 2' },
  { value: VenueType.LECTURE_HALL_3, label: 'Lecture Hall 3' },
  { value: VenueType.AUDITORIUM_A, label: 'Auditorium A' },
  { value: VenueType.AUDITORIUM_B, label: 'Auditorium B' },
  { value: VenueType.SEMINAR_ROOM_A, label: 'Seminar Room A' },
  { value: VenueType.SEMINAR_ROOM_B, label: 'Seminar Room B' },
  { value: VenueType.ROOM_101, label: 'Room 101' },
  { value: VenueType.ROOM_102, label: 'Room 102' },
  { value: VenueType.ROOM_201, label: 'Room 201' },
  { value: VenueType.ROOM_202, label: 'Room 202' },
  { value: VenueType.ROOM_301, label: 'Room 301' },
  { value: VenueType.ROOM_302, label: 'Room 302' },
  { value: VenueType.COMPUTER_LAB, label: 'Computer Lab' },
  { value: VenueType.SCIENCE_LAB_1, label: 'Science Lab 1' },
  { value: VenueType.SCIENCE_LAB_2, label: 'Science Lab 2' },
]

export default function CreateSchedulePage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isLecturer, isHod } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [formData, setFormData] = useState({
    courseCode: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    venue: '' as VenueType | '',
  })

  const isStaff = isAdmin || isLecturer || isHod

  const dayOptions = [
    { value: DayOfWeek.MONDAY, label: 'Monday' },
    { value: DayOfWeek.TUESDAY, label: 'Tuesday' },
    { value: DayOfWeek.WEDNESDAY, label: 'Wednesday' },
    { value: DayOfWeek.THURSDAY, label: 'Thursday' },
    { value: DayOfWeek.FRIDAY, label: 'Friday' },
    { value: DayOfWeek.SATURDAY, label: 'Saturday' },
    { value: DayOfWeek.SUNDAY, label: 'Sunday' },
  ]

  useEffect(() => {
    if (!isAuthenticated || !isStaff) {
      router.push('/auth/login')
      return
    }

    const fetchCourses = async () => {
      try {
        const response = await apiClient.getCourses({ limit: 100 })
        const result = getItemsFromResponse(response)
        if (result) setCourses(result.items)
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
        !formData.endTime || !formData.venue) {
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
        venue: formData.venue as VenueType,
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
                  <Label htmlFor="venue">Venue *</Label>
                  <Select value={formData.venue} onValueChange={(value) => handleSelectChange('venue', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select venue" />
                    </SelectTrigger>
                    <SelectContent>
                      {VENUE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
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
