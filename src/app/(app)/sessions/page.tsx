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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
  const [mobileSheetSession, setMobileSheetSession] = useState<AcademicSession | null>(null)

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
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast({ title: 'End date must be after start date', variant: 'destructive' })
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
    if (new Date(d.endDate) <= new Date(d.startDate)) {
      toast({ title: 'End date must be after start date', variant: 'destructive' })
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
        <Button size="default" className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setIsCreateDialogOpen(true)}>
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
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm animate-pulse">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16" />
                  <div className="h-7 bg-gray-200 rounded w-40" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-48" />
              </div>
              <div className="h-9 bg-gray-200 rounded w-24 shrink-0" />
            </div>
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
                className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-green-600' : ''}>
                        {isActive ? 'Active' : 'Archived'}
                      </Badge>
                      <span className="text-xl font-semibold">{session.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="hidden md:flex items-center gap-2">
                        {!isActive && (
                          <Button size="sm" variant="outline" className="h-9 border-indigo-600 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700" onClick={() => setConfirmState({ open: true, action: 'activate', session })} disabled={actionLoading}>
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
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-11 w-11 md:hidden touch-manipulation"
                        onClick={() => setMobileSheetSession(session)}
                        aria-label="Actions"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
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

      {/* 5.2 Mobile overflow — bottom sheet */}
      <Sheet open={!!mobileSheetSession} onOpenChange={(o) => !o && setMobileSheetSession(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{mobileSheetSession?.name ?? 'Session actions'}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 py-4">
            {mobileSheetSession && (() => {
              const s = mobileSheetSession
              const isActive = activeSession?.id === s.id || s.isActive
              return (
                <>
                  {!isActive && (
                    <button
                      type="button"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left w-full min-h-[44px] font-medium text-indigo-600"
                      onClick={() => { setConfirmState({ open: true, action: 'activate', session: s }); setMobileSheetSession(null); }}
                    >
                      Activate
                    </button>
                  )}
                  {isActive && (
                    <button
                      type="button"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left w-full min-h-[44px] font-medium"
                      onClick={() => { setConfirmState({ open: true, action: 'archive', session: s }); setMobileSheetSession(null); }}
                    >
                      Archive
                    </button>
                  )}
                  <button
                    type="button"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left w-full min-h-[44px] font-medium"
                    onClick={() => { openStatsModal(s); setMobileSheetSession(null); }}
                  >
                    <BarChart2 className="h-5 w-5" />
                    Statistics
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left w-full min-h-[44px] font-medium"
                    onClick={() => { setEditSession(s); setFormData({ name: s.name, startDate: s.startDate.split('T')[0], endDate: s.endDate.split('T')[0] }); setMobileSheetSession(null); }}
                  >
                    <Pencil className="h-5 w-5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 text-left w-full min-h-[44px] font-medium"
                    onClick={() => { setConfirmState({ open: true, action: 'delete', session: s }); setMobileSheetSession(null); }}
                  >
                    <Trash2 className="h-5 w-5" />
                    Delete
                  </button>
                </>
              )
            })()}
          </div>
        </SheetContent>
      </Sheet>

      {/* 5.3 Create Modal */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[480px]" onSwipeDown={() => setIsCreateDialogOpen(false)}>
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
        <DialogContent className="sm:max-w-[480px]" onSwipeDown={() => setEditSession(null)}>
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
        <DialogContent className="sm:max-w-[440px]" onSwipeDown={() => setStatsSession(null)}>
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
        confirmClassName="bg-amber-600 hover:bg-amber-700 text-white"
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
