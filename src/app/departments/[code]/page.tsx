'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Building2, User, BookOpen, GraduationCap, Mail, Users } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { Course, Department, Level } from '@/types'
import { useToast } from '@/hooks/use-toast'

export default function DepartmentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const code = params.code as string
  const [department, setDepartment] = useState<Department | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true)
        const response = await apiClient.getDepartmentFullDetails(code)

        if (response.success && response.data) {
          const dept = response.data as Department
          if (!dept?.name) {
            throw new Error('Invalid department data')
          }
          setDepartment(dept)
          setCourses(Array.isArray(dept.courses) ? dept.courses : [])
        } else {
          toast({
            title: "Error",
            description: response.error || "Failed to fetch department details",
            variant: "destructive",
          })
          router.push('/departments')
        }
      } catch (error) {
        console.error('Failed to fetch department details:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch department details",
          variant: "destructive",
        })
        router.push('/departments')
      } finally {
        setLoading(false)
      }
    }

    if (code) {
      fetchDetails()
    }
  }, [code, router, toast])

  const getLevelBadgeColor = (level: Level) => {
    switch (level) {
      case Level.LEVEL_100:
        return "bg-green-100 text-green-800"
      case Level.LEVEL_200:
        return "bg-blue-100 text-blue-800"
      case Level.LEVEL_300:
        return "bg-yellow-100 text-yellow-800"
      case Level.LEVEL_400:
        return "bg-orange-100 text-orange-800"
      case Level.LEVEL_500:
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!department) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Department not found</p>
            <Button
              variant="outline"
              onClick={() => router.push('/departments')}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Departments
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950">
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
            Back to Departments
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">{department.name}</h1>
              <p className="text-lg text-muted-foreground">
                Department Code: <span className="font-mono font-semibold">{department.code}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {department.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{department.description}</p>
                  </div>
                )}

                {department.hod && department.hod.name && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Head of Department</p>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{department.hod.name}</p>
                        {department.hod.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Mail className="h-3 w-3" />
                            <span>{department.hod.email}</span>
                          </div>
                        )}
                        {department.hod.role && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {department.hod.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Total Courses:</span>
                    <span className="font-semibold">{courses.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Courses List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Courses</CardTitle>
                <CardDescription>
                  {courses.length} course{courses.length !== 1 ? 's' : ''} available in this department
                </CardDescription>
              </CardHeader>
              <CardContent>
                {courses.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No courses found in this department</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courses.map((course) => (
                      <Card key={course.id} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge className={getLevelBadgeColor(course.level)}>
                                  {course.level.replace("LEVEL_", "")}
                                </Badge>
                                <Badge variant="outline" className="font-mono text-xs">
                                  {course.code}
                                </Badge>
                                {course.isGeneral && (
                                  <Badge variant="secondary">General (GST)</Badge>
                                )}
                              </div>
                              <CardTitle className="text-lg font-semibold leading-tight">
                                {course.name}
                              </CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-3 border-t">
                          {course.overview && (
                            <p className="text-sm text-muted-foreground">{course.overview}</p>
                          )}

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

                          {course.lecturer && course.lecturer.name && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                  {course.lecturer.name}
                                </p>
                                {course.lecturer.email && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {course.lecturer.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {course.schedules && course.schedules.length > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="p-1.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              <span className="text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                  {course.schedules.length}
                                </span>{" "}
                                Schedule{course.schedules.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

