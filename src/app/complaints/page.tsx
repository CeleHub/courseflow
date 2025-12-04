'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MessageCircle,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { Complaint, ComplaintStatus, Department } from '@/types'
import { useToast } from '@/hooks/use-toast'

export default function ComplaintsPage() {
  const { user, isAuthenticated, isAdmin } = useAuth()
  const { toast } = useToast()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: '',
    subject: '',
    message: ''
  })

  const statusColors = {
    [ComplaintStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [ComplaintStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [ComplaintStatus.RESOLVED]: 'bg-green-100 text-green-800',
    [ComplaintStatus.CLOSED]: 'bg-gray-100 text-gray-800',
  }

  const statusIcons = {
    [ComplaintStatus.PENDING]: Clock,
    [ComplaintStatus.IN_PROGRESS]: AlertCircle,
    [ComplaintStatus.RESOLVED]: CheckCircle,
    [ComplaintStatus.CLOSED]: XCircle,
  }

  const fetchComplaints = async () => {
    try {
      setLoading(true)

      if (isAdmin) {
        const response = await apiClient.getComplaints()
        if (response.success && response.data) {
          setComplaints(response.data.data?.items || [])
        }
      } else {
        const response = await apiClient.getMyComplaints()
        if (response.success && response.data) {
          setComplaints(Array.isArray(response.data) ? response.data : [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch complaints:', error)
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
    if (isAuthenticated) {
      fetchComplaints()
    }
    fetchDepartments()
  }, [isAuthenticated, isAdmin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await apiClient.createComplaint(formData)

      if (response.success) {
        toast({
          title: "Complaint Submitted",
          description: "Your complaint has been submitted successfully.",
        })

        // Reset form
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          department: '',
          subject: '',
          message: ''
        })

        // Refresh complaints list
        fetchComplaints()
      } else {
        toast({
          title: "Submission Failed",
          description: response.error || "Failed to submit complaint",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const updateComplaintStatus = async (complaintId: string, status: ComplaintStatus) => {
    try {
      const response = await apiClient.updateComplaintStatus(complaintId, status)

      if (response.success) {
        toast({
          title: "Status Updated",
          description: `Complaint status updated to ${status.toLowerCase().replace('_', ' ')}`,
        })
        fetchComplaints()
      } else {
        toast({
          title: "Update Failed",
          description: response.error || "Failed to update status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8">Please log in to access complaints.</p>
          <Button>
            <a href="/auth/login">Sign In</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <MessageCircle className="h-8 w-8" />
            Complaints
          </h1>
          <p className="text-muted-foreground">
            Submit and track your complaints with a transparent status system
          </p>
        </div>

        <Tabs defaultValue="submit" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submit" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Submit Complaint
            </TabsTrigger>
            <TabsTrigger value="view" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              {isAdmin ? 'All Complaints' : 'My Complaints'}
            </TabsTrigger>
          </TabsList>

          {/* Submit Complaint Tab */}
          <TabsContent value="submit">
            <Card>
              <CardHeader>
                <CardTitle>Submit a Complaint</CardTitle>
                <CardDescription>
                  Fill out the form below to submit your complaint. We&apos;ll review it and get back to you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.code} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="Brief description of your complaint"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Describe your complaint in detail..."
                      className="min-h-[120px]"
                      required
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Complaint
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* View Complaints Tab */}
          <TabsContent value="view">
            <Card>
              <CardHeader>
                <CardTitle>{isAdmin ? 'All Complaints' : 'My Complaints'}</CardTitle>
                <CardDescription>
                  {isAdmin
                    ? 'View and manage all submitted complaints'
                    : 'Track the status of your submitted complaints'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : complaints.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No complaints found</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {isAdmin ? 'No complaints have been submitted yet' : 'You haven&apos;t submitted any complaints yet'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {complaints.map((complaint) => {
                      const StatusIcon = statusIcons[complaint.status]
                      return (
                        <Card key={complaint.id} className="border-l-4 border-l-primary">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{complaint.subject}</CardTitle>
                                <CardDescription>
                                  {complaint.name} • {complaint.email} • {complaint.department}
                                </CardDescription>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge className={statusColors[complaint.status]}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {complaint.status.replace('_', ' ')}
                                </Badge>
                                {complaint.createdAt && (
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(complaint.createdAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                              {complaint.message}
                            </p>

                            {isAdmin && (
                              <div className="flex gap-2 flex-wrap">
                                {Object.values(ComplaintStatus).map((status) => (
                                  <Button
                                    key={status}
                                    variant={complaint.status === status ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => updateComplaintStatus(complaint.id, status)}
                                    disabled={complaint.status === status}
                                  >
                                    {status.replace('_', ' ')}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
