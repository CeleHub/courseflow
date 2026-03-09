'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { usePageLoadReporter } from '@/contexts/PageLoadContext'
import { useToast } from '@/hooks/use-toast'
import { Calendar, ArrowLeft, Loader2 } from 'lucide-react'
import { ErrorState } from '@/components/state/error-state'
import { apiClient } from '@/lib/api'
import { getItemsFromResponse } from '@/lib/utils'
import { Course, DayOfWeek } from '@/types'

export default function CreateSchedulePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isAdmin, isLecturer, isHod } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  usePageLoadReporter(loadingData)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [formData, setFormData] = useState({
    courseCode: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    isFixed: false,
  })

  const canCreate = isAdmin || isHod /* LECTURER is read-only per 0.1 */

  const dayOptions = [
    { value: DayOfWeek.MONDAY, label: 'Monday' },
    { value: DayOfWeek.TUESDAY, label: 'Tuesday' },
    { value: DayOfWeek.WEDNESDAY, label: 'Wednesday' },
    { value: DayOfWeek.THURSDAY, label: 'Thursday' },
    { value: DayOfWeek.FRIDAY, label: 'Friday' },
    { value: DayOfWeek.SATURDAY, label: 'Saturday' },
    { value: DayOfWeek.SUNDAY, label: 'Sunday' },
  ]

  const fetchCourses = useCallback(async () => {
    setFetchError(null)
    setLoadingData(true)
    try {
      const response = await apiClient.getCourses({ limit: 100 })
      const result = getItemsFromResponse<Course>(response)
      if (result) setCourses(result.items)
    } catch {
      setFetchError('Failed to load courses')
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !canCreate) {
      router.replace(!isAuthenticated ? '/login' : '/dashboard')
      return
    }
    fetchCourses()
  }, [isAuthenticated, canCreate, router, fetchCourses])

  const courseFromQuery = searchParams.get('course')
  useEffect(() => {
    if (courseFromQuery && isAuthenticated && canCreate) {
      router.replace(`/schedules?create=1&course=${encodeURIComponent(courseFromQuery)}`)
    }
  }, [courseFromQuery, isAuthenticated, canCreate, router])

  if (!isAuthenticated || !canCreate) {
    return null
  }

  if (courseFromQuery) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-500">Redirecting...</div></div>
  }

  if (fetchError && !loadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <ErrorState title={fetchError} onRetry={fetchCourses} />
      </div>
    )
  }

  if (loadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
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
        !formData.endTime) {
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
        isFixed: formData.isFixed,
      })

      if (response.success) {
        toast({
          title: "Success",
          description: "Schedule created successfully",
        })
        router.push('/schedules')
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
            <form onSubmit={handleSubmit} className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="courseCode">Course *</Label>
                  <Select value={formData.courseCode} onValueChange={(value) => handleSelectChange('courseCode', value)} disabled={loading}>
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
                  <Select value={formData.dayOfWeek} onValueChange={(value) => handleSelectChange('dayOfWeek', value)} disabled={loading}>
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
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
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
                    disabled={loading}
                  />
                </div>

              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isFixed"
                  checked={formData.isFixed}
                  onChange={(e) => setFormData(prev => ({ ...prev, isFixed: e.target.checked }))}
                  className="rounded border-gray-300"
                  disabled={loading}
                />
                <Label htmlFor="isFixed" className="cursor-pointer">Pin this slot (isFixed) — so auto-generation never moves it</Label>
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
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Schedule'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
