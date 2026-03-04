'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import {
  AcademicSession,
  CreateAcademicSessionData,
  UpdateAcademicSessionData,
  SessionStatistics,
} from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BarChart2,
  CalendarDays,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Archive,
  Trash2,
} from 'lucide-react'
import { getItemsFromResponse } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ErrorState } from '@/components/state/error-state'

export default function AcademicSessionsPage() {
  const { isAuthenticated, isAdmin } = useAuth()
  const { toast } = useToast()

  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [activeSession, setActiveSession] = useState<AcademicSession | null>(null)
  const [sessionStats, setSessionStats] = useState<Record<string, SessionStatistics>>({})
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editSession, setEditSession] = useState<AcademicSession | null>(null)
  const [statsSession, setStatsSession] = useState<AcademicSession | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsData, setStatsData] = useState<SessionStatistics | null>(null)
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    action: 'activate' | 'archive' | 'delete'
    session: AcademicSession | null
  }>({ open: false, action: 'activate', session: null })
  const [actionLoading, setActionLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateAcademicSessionData>({
    name: '',
    startDate: '',
    endDate: '',
  })

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      setFetchError(null)
      const [listRes, activeRes] = await Promise.all([
        apiClient.getAcademicSessions({ page: 1, limit: 50 }),
        apiClient.getActiveAcademicSession(),
      ])

      const listResult = getItemsFromResponse<AcademicSession>(listRes)
      const items = (listResult?.items ?? []) as AcademicSession[]
      setSessions(items)

      if (activeRes.success && activeRes.data != null) {
        setActiveSession(activeRes.data as AcademicSession)
      } else {
        setActiveSession(null)
      }

      // Fetch stats for each session (for card display)
      const stats: Record<string, SessionStatistics> = {}
      await Promise.all(
        items.map(async (s) => {
          try {
            const res = await apiClient.getSessionStatistics(s.id)
            if (res.success && res.data) stats[s.id] = res.data as SessionStatistics
          } catch {
            // ignore per-session failures
          }
        })
      )
      setSessionStats(stats)
    } catch (error) {
      console.error('Failed to fetch academic sessions:', error)
      setFetchError('Failed to load academic sessions')
      toast({ title: 'Failed to load academic sessions', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (isAuthenticated && isAdmin) fetchSessions()
  }, [isAuthenticated, isAdmin, fetchSessions])

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name?.trim() || !formData.startDate || !formData.endDate) {
      toast({ title: 'Please fill name, start date and end date', variant: 'destructive' })
      return
    }
    try {
      setCreating(true)
      const res = await apiClient.createAcademicSession({
        ...formData,
        startDate: new Date(formData.startDate).toISOString().split('T')[0],
        endDate: new Date(formData.endDate).toISOString().split('T')[0],
      })
      if (res.success) {
        toast({ title: 'Session created.' })
        setIsCreateDialogOpen(false)
        setFormData({ name: '', startDate: '', endDate: '' })
        fetchSessions()
      } else {
        toast({ title: (res as any).error || 'Failed to create', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to create session', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editSession) return
    const d = formData
    if (!d.name?.trim() || !d.startDate || !d.endDate) {
      toast({ title: 'Please fill all fields', variant: 'destructive' })
      return
    }
    try {
      setCreating(true)
      const res = await apiClient.updateAcademicSession(editSession.id, {
        name: d.name,
        startDate: new Date(d.startDate).toISOString().split('T')[0],
        endDate: new Date(d.endDate).toISOString().split('T')[0],
      })
      if (res.success) {
        toast({ title: 'Session updated.' })
        setEditSession(null)
        fetchSessions()
      } else {
        toast({ title: (res as any).error || 'Failed to update', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const openStatsModal = async (session: AcademicSession) => {
    setStatsSession(session)
    setStatsData(null)
    setStatsLoading(true)
    try {
      const res = await apiClient.getSessionStatistics(session.id)
      if (res.success && res.data) setStatsData(res.data as SessionStatistics)
    } catch {
      toast({ title: 'Failed to load statistics', variant: 'destructive' })
    } finally {
      setStatsLoading(false)
    }
  }

  const handleConfirmAction = async (): Promise<boolean> => {
    const { session, action } = confirmState
    if (!session) return false
    try {
      setActionLoading(true)
      let res: { success?: boolean }
      if (action === 'activate') res = await apiClient.activateAcademicSession(session.id)
      else if (action === 'archive') res = await apiClient.archiveAcademicSession(session.id)
      else res = await apiClient.deleteAcademicSession(session.id)

      if (res.success) {
        if (action === 'activate') toast({ title: `${session.name} is now the active session.` })
        else if (action === 'archive') toast({ title: 'Session archived.', variant: 'default' })
        else toast({ title: 'Session deleted.' })
        fetchSessions()
        return true
      }
      toast({ title: (res as any).error || 'Action failed', variant: 'destructive' })
      return false
    } catch {
      toast({ title: 'Action failed', variant: 'destructive' })
      return false
    } finally {
      setActionLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-semibold mb-4">Access Denied</h1>
        <p className="text-gray-500">You need admin privileges to manage academic sessions.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 5.1 Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Academic Sessions</h1>
        <Button size="default" className="h-10" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* Sessions list - 5.2 */}
      {fetchError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ErrorState title={fetchError} onRetry={() => { setFetchError(null); fetchSessions(); }} />
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl border bg-white animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-gray-200 p-8 text-center">
          <CalendarDays className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No academic sessions have been created yet.</p>
          <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isActive = activeSession?.id === session.id || session.isActive
            const stats = sessionStats[session.id]
            const schedCount = stats?.totalSchedules ?? '—'
            const examCount = stats?.totalExams ?? '—'

            return (
              <div
                key={session.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-green-600' : ''}>
                        {isActive ? 'Active' : 'Archived'}
                      </Badge>
                      <span className="text-xl font-semibold">{session.name}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="hidden md:flex items-center gap-1">
                        {!isActive && (
                          <Button size="sm" variant="outline" className="h-9" onClick={() => setConfirmState({ open: true, action: 'activate', session })} disabled={actionLoading}>
                            Activate
                          </Button>
                        )}
                        {isActive && (
                          <Button size="sm" variant="outline" className="h-9" onClick={() => setConfirmState({ open: true, action: 'archive', session })} disabled={actionLoading}>
                            Archive
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-11 w-11 touch-manipulation" onClick={() => openStatsModal(session)}>
                          <BarChart2 className="h-5 w-5" />
                          <span className="sr-only">Statistics</span>
                        </Button>
                        <Button size="icon" variant="ghost" className="h-11 w-11 touch-manipulation" onClick={() => { setEditSession(session); setFormData({ name: session.name, startDate: session.startDate.split('T')[0], endDate: session.endDate.split('T')[0] }); }}>
                          <Pencil className="h-5 w-5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button size="icon" variant="ghost" className="h-11 w-11 text-red-600 hover:text-red-700 touch-manipulation" onClick={() => setConfirmState({ open: true, action: 'delete', session })} disabled={actionLoading}>
                          <Trash2 className="h-5 w-5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-11 w-11 md:hidden touch-manipulation">
                            <MoreVertical className="h-5 w-5" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {!isActive && <DropdownMenuItem onClick={() => setConfirmState({ open: true, action: 'activate', session })}>Activate</DropdownMenuItem>}
                          {isActive && <DropdownMenuItem onClick={() => setConfirmState({ open: true, action: 'archive', session })}>Archive</DropdownMenuItem>}
                          <DropdownMenuItem onClick={() => openStatsModal(session)}>Statistics</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditSession(session); setFormData({ name: session.name, startDate: session.startDate.split('T')[0], endDate: session.endDate.split('T')[0] }); }}>Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => setConfirmState({ open: true, action: 'delete', session })}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDate(session.startDate)} → {formatDate(session.endDate)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {schedCount} schedules · {examCount} exams
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 5.3 Create Modal */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Create Academic Session</DialogTitle>
            <DialogDescription>Define the academic year and its start/end dates.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="create-name">Session name</Label>
              <Input
                id="create-name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. 2024/2025"
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="create-start">Start date</Label>
              <Input
                id="create-start"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="create-end">End date</Label>
              <Input
                id="create-end"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                className="mt-1.5"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={creating}>
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

      {/* 5.3 Edit Modal */}
      <Dialog open={!!editSession} onOpenChange={(o) => !o && setEditSession(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>Update the academic session details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Session name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. 2024/2025"
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-start">Start date</Label>
              <Input
                id="edit-start"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-end">End date</Label>
              <Input
                id="edit-end"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                className="mt-1.5"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditSession(null)} disabled={creating}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5.4 Statistics Modal */}
      <Dialog open={!!statsSession} onOpenChange={(o) => !o && setStatsSession(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Statistics — {statsSession?.name ?? ''}</DialogTitle>
          </DialogHeader>
          {statsLoading ? (
            <div className="grid grid-cols-2 gap-4 py-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : statsData ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-gray-500">Total Schedules</p>
                <p className="text-2xl font-bold">{statsData.totalSchedules}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-gray-500">First Semester Schedules</p>
                <p className="text-2xl font-bold">{statsData.schedulesBySemester?.FIRST ?? 0}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-gray-500">Second Semester Schedules</p>
                <p className="text-2xl font-bold">{statsData.schedulesBySemester?.SECOND ?? 0}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-gray-500">Total Exams</p>
                <p className="text-2xl font-bold">{statsData.totalExams}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 py-4">Failed to load statistics.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation dialogs */}
      <ConfirmDialog
        open={confirmState.open && confirmState.action === 'activate'}
        onOpenChange={(o) => !o && setConfirmState({ open: false, action: 'activate', session: null })}
        title="Activate session?"
        description={`Make "${confirmState.session?.name}" the active academic session?`}
        icon={CalendarDays}
        confirmLabel="Activate"
        onConfirm={handleConfirmAction}
        loading={actionLoading}
      />
      <ConfirmDialog
        open={confirmState.open && confirmState.action === 'archive'}
        onOpenChange={(o) => !o && setConfirmState({ open: false, action: 'archive', session: null })}
        title="Archive session?"
        description="This will archive the session. You can activate it again later."
        icon={Archive}
        iconClassName="bg-amber-500 text-white"
        confirmLabel="Archive"
        confirmVariant="outline"
        onConfirm={handleConfirmAction}
        loading={actionLoading}
      />
      <ConfirmDialog
        open={confirmState.open && confirmState.action === 'delete'}
        onOpenChange={(o) => !o && setConfirmState({ open: false, action: 'delete', session: null })}
        title="Delete session?"
        description={`This will permanently delete "${confirmState.session?.name}". Sessions with linked schedules or exams cannot be deleted.`}
        icon={Trash2}
        iconClassName="bg-red-500 text-white"
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={handleConfirmAction}
        loading={actionLoading}
      />
    </div>
  )
}
