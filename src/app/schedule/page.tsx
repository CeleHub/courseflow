'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Calendar,
  Search,
  Filter,
  Clock,
  MapPin,
  BookOpen,
  RefreshCw
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { Schedule, Department, Level, DayOfWeek, ClassType } from '@/types'

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Class Schedule
          </h1>
          <p className="text-muted-foreground">
            View detailed schedules for all courses with time, venue, and type information
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <Card>
                <CardContent className="py-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No schedules found matching your criteria</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your search terms or filters
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {dayOptions.map((dayOption) => {
                  const daySchedules = schedulesByDay[dayOption.value]
                  if (!daySchedules || daySchedules.length === 0) return null

                  return (
                    <Card key={dayOption.value}>
                      <CardHeader>
                        <CardTitle className="text-xl">{dayOption.label}</CardTitle>
                        <CardDescription>
                          {daySchedules.length} class{daySchedules.length !== 1 ? 'es' : ''} scheduled
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {daySchedules
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((schedule) => (
                              <Card key={schedule.id} className="border-l-4 border-l-primary">
                                <CardHeader className="pb-2">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <CardTitle className="text-base">
                                        {schedule.course?.code}
                                      </CardTitle>
                                      <CardDescription className="font-medium">
                                        {schedule.course?.name}
                                      </CardDescription>
                                    </div>
                                    <Badge className={getClassTypeBadgeColor(schedule.type)}>
                                      {schedule.type}
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{schedule.venue}</span>
                                  </div>

                                  {schedule.course && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                                      <span>{schedule.course.credits} Credits</span>
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
