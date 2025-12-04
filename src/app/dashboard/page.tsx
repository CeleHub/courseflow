'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Calendar,
  MessageCircle,
  Building2,
  Users,
  Clock,
  TrendingUp,
  Activity,
  GraduationCap
} from 'lucide-react'
import Link from 'next/link'
import { apiClient } from '@/lib/api'

export default function DashboardPage() {
  const { user, isAuthenticated, isAdmin, isLecturer } = useAuth()
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalDepartments: 0,
    totalComplaints: 0,
    myComplaints: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        // Fetch dashboard statistics
        const [coursesRes, departmentsRes, complaintsRes] = await Promise.all([
          apiClient.getCourses({ limit: 1 }),
          apiClient.getDepartments({ limit: 1 }),
          isAuthenticated ? apiClient.getComplaints({ limit: 1 }) : Promise.resolve({ 
            success: false, 
            data: null,
            error: 'Not authenticated',
            statusCode: 401,
            timestamp: new Date().toISOString()
          })
        ])

        setStats({
          totalCourses: (coursesRes.success && coursesRes.data?.data?.pagination?.total) || 0,
          totalDepartments: (departmentsRes.success && departmentsRes.data?.data?.pagination?.total) || 0,
          totalComplaints: (complaintsRes.success && complaintsRes.data?.data?.pagination?.total) || 0,
          myComplaints: 0, // This would need a separate endpoint
          recentActivity: [] // This would need a separate endpoint
        })
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8">Please log in to access the dashboard.</p>
          <Button asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      title: 'Browse Courses',
      description: 'Explore available courses',
      href: '/courses',
      icon: BookOpen,
      color: 'bg-blue-500',
    },
    {
      title: 'View Schedule',
      description: 'Check class schedules',
      href: '/schedule',
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      title: 'Departments',
      description: 'Browse departments',
      href: '/departments',
      icon: Building2,
      color: 'bg-purple-500',
    },
    {
      title: 'Submit Complaint',
      description: 'File a complaint',
      href: '/complaints',
      icon: MessageCircle,
      color: 'bg-orange-500',
    },
  ]

  const adminActions = [
    {
      title: 'Manage Users',
      description: 'View and manage users',
      href: '/admin/users',
      icon: Users,
      color: 'bg-red-500',
    },
    {
      title: 'Verification Codes',
      description: 'Manage verification codes',
      href: '/admin/verification-codes',
      icon: Activity,
      color: 'bg-indigo-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Welcome back, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-lg text-muted-foreground">
                Here&apos;s an overview of your academic journey
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm px-4 py-1.5">
                <GraduationCap className="h-3 w-3 mr-1.5" />
                {user?.role}
              </Badge>
              <Badge variant="outline" className="text-sm px-4 py-1.5 font-mono">
                {user?.matricNO}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="border-2 hover:border-primary/20 transition-all hover:shadow-lg group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Courses</CardTitle>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg group-hover:scale-110 transition-transform">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{loading ? '...' : stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">Available courses</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/20 transition-all hover:shadow-lg group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Departments</CardTitle>
              <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg group-hover:scale-110 transition-transform">
                <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{loading ? '...' : stats.totalDepartments}</div>
              <p className="text-xs text-muted-foreground">Academic departments</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/20 transition-all hover:shadow-lg group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">My Complaints</CardTitle>
              <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg group-hover:scale-110 transition-transform">
                <MessageCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{loading ? '...' : stats.myComplaints}</div>
              <p className="text-xs text-muted-foreground">Submitted complaints</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/20 transition-all hover:shadow-lg group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Quick Access</CardTitle>
              <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{quickActions.length}</div>
              <p className="text-xs text-muted-foreground">Available actions</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card 
                key={index} 
                className="transition-all hover:shadow-xl hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/20 group"
              >
                <Link href={action.href}>
                  <CardHeader className="pb-3">
                    <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg font-semibold">{action.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">{action.description}</CardDescription>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Admin Actions */}
        {(isAdmin || isLecturer) && (
          <div className="mb-10">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {isAdmin ? 'Administrative' : 'Lecturer'} Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminActions.filter(action => isAdmin).map((action, index) => (
                <Card 
                  key={index} 
                  className="transition-all hover:shadow-xl hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/20 group"
                >
                  <Link href={action.href}>
                    <CardHeader className="pb-3">
                      <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-lg font-semibold">{action.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm leading-relaxed">{action.description}</CardDescription>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
          <Card>
            <CardContent className="py-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No recent activity to display</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your activity will appear here as you interact with the system
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
