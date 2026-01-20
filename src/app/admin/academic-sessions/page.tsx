'use client'

import { useCallback, useEffect, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import {
  AcademicSession,
  CreateAcademicSessionData,
  UpdateAcademicSessionData,
} from '@/types'
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
  CalendarDays,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AcademicSessionsPage() {
  const { isAuthenticated, isAdmin } = useAuth()
  const { toast } = useToast()

  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [activeSession, setActiveSession] = useState<AcademicSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState<CreateAcademicSessionData>({
    name: '',
    startDate: '',
    endDate: '',
  })

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)

      const [listRes, activeRes] = await Promise.all([
        apiClient.getAcademicSessions({ page: 1, limit: 20 }),
        apiClient.getActiveAcademicSession(),
      ])

      if (listRes.success && listRes.data && 'data' in listRes.data) {
        const items =
          (listRes.data as any).data?.items ??
          (Array.isArray((listRes.data as any).data) ? (listRes.data as any).data : [])
        setSessions(items as AcademicSession[])
      }

      if (activeRes.success && activeRes.data) {
        setActiveSession(activeRes.data as AcademicSession)
      } else {
        setActiveSession(null)
      }
    } catch (error) {
      console.error('Failed to fetch academic sessions:', error)
      toast({
        title: 'Error',
        description: 'Failed to load academic sessions',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchSessions()
    }
  }, [isAuthenticated, isAdmin, fetchSessions])

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">
            You need admin privileges to manage academic sessions.
          </p>
        </div>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.startDate || !formData.endDate) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in name, start date and end date',
        variant: 'destructive',
      })
      return
    }

    try {
      setCreating(true)
      const payload: CreateAcademicSessionData = {
        ...formData,
        // ensure ISO strings if the API expects them
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      }

      const res = await apiClient.createAcademicSession(payload)
      if (res.success) {
        toast({
          title: 'Session Created',
          description: 'Academic session created successfully.',
        })
        setIsCreateDialogOpen(false)
        setFormData({ name: '', startDate: '', endDate: '' })
        fetchSessions()
      } else {
        toast({
          title: 'Error',
          description: res.error || 'Failed to create session',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Create session failed:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const handleActivate = async (id: string) => {
    try {
      setActivatingId(id)
      const res = await apiClient.activateAcademicSession(id)
      if (res.success) {
        toast({
          title: 'Session Activated',
          description: 'Active academic session updated.',
        })
        fetchSessions()
      } else {
        toast({
          title: 'Error',
          description: res.error || 'Failed to activate session',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Activate session failed:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setActivatingId(null)
    }
  }

  const handleUpdateDates = async (id: string, patch: UpdateAcademicSessionData) => {
    try {
      setUpdatingId(id)
      const res = await apiClient.updateAcademicSession(id, patch)
      if (res.success) {
        toast({
          title: 'Session Updated',
          description: 'Academic session updated successfully.',
        })
        fetchSessions()
      } else {
        toast({
          title: 'Error',
          description: res.error || 'Failed to update session',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Update session failed:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return

    try {
      setDeletingId(id)
      const res = await apiClient.deleteAcademicSession(id)
      if (res.success) {
        toast({
          title: 'Session Deleted',
          description: 'Academic session deleted successfully.',
        })
        fetchSessions()
      } else {
        toast({
          title: 'Error',
          description:
            res.error ||
            'Failed to delete session. It may have linked schedules or exams.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Delete session failed:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarDays className="h-7 w-7 text-primary" />
              Academic Sessions
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage academic years and control which session is currently active.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchSessions}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Session
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Academic Session</DialogTitle>
                  <DialogDescription>
                    Define the academic year and its start/end dates.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., 2024/2025"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        name="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
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
                      Create Session
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {activeSession && (
          <Card className="mb-8 border-2 border-primary/30 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Active Session: {activeSession.name}
                </CardTitle>
                <CardDescription>
                  {formatDate(activeSession.startDate)} –{' '}
                  {formatDate(activeSession.endDate)}
                </CardDescription>
              </div>
              <Badge variant="secondary">Active</Badge>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Sessions</CardTitle>
            <CardDescription>
              Only one session can be active at a time. You cannot delete sessions
              that have linked schedules or exams.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No academic sessions have been created yet.
              </p>
            ) : (
              <div className="space-y-4">
                {sessions.map(session => {
                  const isActive = activeSession?.id === session.id || session.isActive
                  return (
                    <div
                      key={session.id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 border rounded-lg p-4 bg-background"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base">
                            {session.name}
                          </span>
                          {isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(session.startDate)} –{' '}
                          {formatDate(session.endDate)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleActivate(session.id)}
                            disabled={activatingId === session.id}
                          >
                            {activatingId === session.id && (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Set Active
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleUpdateDates(session.id, {
                              endDate: new Date(session.endDate).toISOString(),
                            })
                          }
                          disabled={updatingId === session.id}
                        >
                          {updatingId === session.id && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Save Dates
                        </Button>
                        {!isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(session.id)}
                            disabled={deletingId === session.id}
                          >
                            {deletingId === session.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Delete
                          </Button>
                        )}
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


