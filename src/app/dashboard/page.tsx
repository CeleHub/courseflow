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
  Activity
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
          isAuthenticated ? apiClient.getComplaints({ limit: 1 }) : Promise.resolve({ success: false })
        ])

        setStats({
          totalCourses: (coursesRes.success && 'data' in coursesRes && coursesRes.data?.data?.pagination?.total) || 0,
          totalDepartments: (departmentsRes.success && 'data' in departmentsRes && departmentsRes.data?.data?.pagination?.total) || 0,
          totalComplaints: (complaintsRes.success && 'data' in complaintsRes && complaintsRes.data?.data?.pagination?.total) || 0,
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">Here's what's happening with your academic journey.</p>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="secondary">
              {user?.role}
            </Badge>
            <Badge variant="outline">
              {user?.matricNO}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">Available courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.totalDepartments}</div>
              <p className="text-xs text-muted-foreground">Academic departments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Complaints</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.myComplaints}</div>
              <p className="text-xs text-muted-foreground">Submitted complaints</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Access</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">Available actions</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card key={index} className="transition-all hover:shadow-lg cursor-pointer">
                <Link href={action.href}>
                  <CardHeader className="pb-2">
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-2`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{action.description}</CardDescription>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Admin Actions */}
        {(isAdmin || isLecturer) && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">
              {isAdmin ? 'Admin' : 'Lecturer'} Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminActions.filter(action => isAdmin).map((action, index) => (
                <Card key={index} className="transition-all hover:shadow-lg cursor-pointer">
                  <Link href={action.href}>
                    <CardHeader className="pb-2">
                      <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-2`}>
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{action.description}</CardDescription>
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
