'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Lock,
  Unlock,
  User,
  Mail,
  BookOpen,
  Eye,
  Pencil,
  Trash2,
  MoreVertical,
  Plus,
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { Course, Department, Level, College, Semester } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { ErrorState } from '@/components/state/error-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { HodCombobox } from '@/components/departments/hod-combobox'

const LEVEL_PILL: Record<Level, string> = {
  [Level.LEVEL_100]: 'bg-slate-100 text-slate-700',
  [Level.LEVEL_200]: 'bg-blue-100 text-blue-700',
  [Level.LEVEL_300]: 'bg-violet-100 text-violet-700',
  [Level.LEVEL_400]: 'bg-orange-100 text-orange-700',
  [Level.LEVEL_500]: 'bg-red-100 text-red-700',
}

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0]! + parts[parts.length - 1]![0]!).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function DepartmentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { isAdmin, isHod, user } = useAuth()
  const code = params.code as string
  const [department, setDepartment] = useState<Department | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', code: '', description: '', college: College.CBAS, hodId: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [lockLoading, setLockLoading] = useState(false)
  const [detailCourse, setDetailCourse] = useState<Course | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const canLockUnlock = department && (isAdmin || (isHod && user?.departmentCode === department.code))
  const canAddCourse = isAdmin || (isHod && user?.departmentCode === code)
  const canEditCourse = (c: Course) => isAdmin || (isHod && user?.departmentCode === c.departmentCode)

  const fetchDetails = useCallback(() => {
    if (!code) return
    setFetchError(null)
    setLoading(true)
    apiClient.getDepartmentFullDetails(code)
      .then((response) => {
        if (response.success && response.data) {
          const raw = response.data as { data?: Department } | Department
          const dept = (raw as { data?: Department }).data ?? (raw as Department)
          if (!dept?.name) {
            setFetchError('Invalid department data')
            return
          }
          setDepartment(dept)
          const deptWithCourses = dept as Department & { courses?: Course[] }
          setCourses(Array.isArray(deptWithCourses.courses) ? deptWithCourses.courses : [])
        } else {
          setFetchError(response.error || 'Failed to fetch department details')
        }
      })
      .catch((error) => {
        setFetchError(error instanceof Error ? error.message : 'Failed to fetch department details')
      })
      .finally(() => setLoading(false))
  }, [code])

  useEffect(() => {
    if (code) fetchDetails()
  }, [code, fetchDetails])

  const openEdit = useCallback(() => {
    if (!department) return
    setEditForm({
      name: department.name,
      code: department.code,
      description: department.description ?? '',
      college: department.college,
      hodId: department.hodId ?? '',
    })
    setEditOpen(true)
  }, [department])

  const openDetail = async (course: Course) => {
    setDetailCourse(course)
    setDetailLoading(true)
    try {
      const res = await apiClient.getCourseByCode(course.code)
      if (res.success && res.data) setDetailCourse(res.data as Course)
    } catch {
      toast({ title: 'Failed to load course', variant: 'destructive' })
    } finally {
      setDetailLoading(false)
    }
  }

  const handleLockToggle = async () => {
    if (!department) return
    setLockLoading(true)
    try {
      const fn = department.isScheduleLocked ? apiClient.unlockDepartmentSchedule : apiClient.lockDepartmentSchedule
      const res = await fn(department.code)
      if (res.success) {
        setDepartment((d) => (d ? { ...d, isScheduleLocked: !d.isScheduleLocked } : null))
        toast({ title: department.isScheduleLocked ? 'Schedule unlocked' : 'Schedule locked' })
      } else {
        toast({ title: (res as { error?: string }).error ?? 'Failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed', variant: 'destructive' })
    } finally {
      setLockLoading(false)
    }
  }

  const handleDeleteCourse = async (): Promise<boolean> => {
    if (!deleteCourse) return false
    try {
      setDeleteLoading(true)
      const res = await apiClient.deleteCourse(deleteCourse.code)
      if (res.success) {
        toast({ title: `Course ${deleteCourse.code} deleted.` })
        setDeleteCourse(null)
        fetchDetails()
        return true
      }
      toast({ title: (res as { error?: string }).error ?? 'Failed', variant: 'destructive' })
      return false
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' })
      return false
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/departments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Departments
          </Link>
        </Button>
        <ErrorState title={fetchError} onRetry={fetchDetails} />
      </div>
    )
  }

  if (!department) {
    return (
      <div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Department not found</p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/departments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Departments
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-8">
        {/* Back navigation */}
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/departments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Departments
          </Link>
        </Button>

        {/* Page title section: 28px bold + college badge + lock status badge */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] font-bold">{department.name}</h1>
          <Badge variant="outline" className={department.college === College.CBAS ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-purple-100 text-purple-700 border-purple-200'}>
            {department.college}
          </Badge>
          {department.isScheduleLocked ? (
            <Badge className="bg-amber-100 text-amber-700"><Lock className="h-3 w-3 mr-1" />Locked</Badge>
          ) : (
            <Badge className="bg-green-100 text-green-700"><Unlock className="h-3 w-3 mr-1" />Unlocked</Badge>
          )}
        </div>

        {/* Info grid: 2 columns desktop, stacked mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Left card — Head of Department */}
          <Card>
            <CardHeader>
              <CardTitle>Head of Department</CardTitle>
            </CardHeader>
            <CardContent>
              {department.hod ? (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-base font-medium text-indigo-700 shrink-0">
                    {getInitials(department.hod.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold">{department.hod.name}</p>
                    {department.hod.email && (
                      <p className="text-sm text-gray-500 mt-0.5">{department.hod.email}</p>
                    )}
                    {department.hod.role && (
                      <Badge variant="secondary" className="mt-2 text-xs">{department.hod.role}</Badge>
                    )}
                    {isAdmin && (
                      <Button variant="ghost" size="sm" className="mt-2 h-8 text-xs" onClick={openEdit}>Edit</Button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-400 italic">Not assigned</p>
                  {isAdmin && (
                    <Button variant="outline" size="sm" className="mt-2" onClick={openEdit}>
                      Assign HOD
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right card — Department Info */}
          <Card>
            <CardHeader>
              <CardTitle>Department Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Code</p>
                <p className="font-mono text-sm">{department.code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">College</p>
                <p className="text-sm">{department.college}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="secondary" className={department.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                  {department.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Schedule lock</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm">{department.isScheduleLocked ? 'Locked' : 'Unlocked'}</span>
                  {canLockUnlock && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={lockLoading}
                      onClick={handleLockToggle}
                    >
                      {department.isScheduleLocked ? 'Unlock' : 'Lock'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses section: margin-top 32px */}
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold">Courses in this Department</h2>
            {canAddCourse && (
              <Button size="sm" onClick={() => router.push(`/courses/create?department=${code}`)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            )}
          </div>

          {courses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No courses in this department</p>
                {canAddCourse && (
                  <Button className="mt-4" onClick={() => router.push(`/courses/create?department=${code}`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Course
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop: Table */}
              <div className="hidden md:block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white border-b sticky top-0 z-10">
                      <tr className="text-left text-sm text-gray-500">
                        <th className="p-3 w-[100px]">Code</th>
                        <th className="p-3">Name</th>
                        <th className="p-3 w-[100px]">Level</th>
                        <th className="p-3 w-[80px] hidden lg:table-cell">Semester</th>
                        <th className="p-3 w-[70px] hidden lg:table-cell text-center">Credits</th>
                        <th className="p-3 w-[160px]">Lecturer</th>
                        <th className="p-3 w-[120px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((c) => (
                        <tr key={c.id} className="border-t hover:bg-gray-50">
                          <td className="p-3">
                            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{c.code}</span>
                          </td>
                          <td className="p-3 text-sm">{c.name}</td>
                          <td className="p-3">
                            <Badge variant="secondary" className={LEVEL_PILL[c.level] ?? ''}>{c.level.replace('LEVEL_', '')}</Badge>
                          </td>
                          <td className="p-3 text-sm hidden lg:table-cell">{c.semester === Semester.FIRST ? 'First' : 'Second'}</td>
                          <td className="p-3 text-center text-sm hidden lg:table-cell">{c.credits}</td>
                          <td className="p-3 text-sm">
                            {c.lecturer ? c.lecturer.name ?? c.lecturer.email : <span className="italic text-gray-400">Unassigned</span>}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => openDetail(c)}><Eye className="h-5 w-5" /><span className="sr-only">View</span></Button>
                              {canEditCourse(c) && (
                                <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => router.push(`/courses/${c.code}/edit`)}><Pencil className="h-5 w-5" /><span className="sr-only">Edit</span></Button>
                              )}
                              {isAdmin && (
                                <Button size="icon" variant="ghost" className="h-11 w-11 text-red-600" onClick={() => setDeleteCourse(c)}><Trash2 className="h-5 w-5" /><span className="sr-only">Delete</span></Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile: §7 card list */}
              <div className="md:hidden space-y-3">
                {courses.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    onClick={() => openDetail(c)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-semibold">{c.code}</p>
                        <p className="text-sm text-gray-600 truncate">{c.name}</p>
                      </div>
                      <Badge variant="secondary" className={LEVEL_PILL[c.level] ?? ''}>{c.level.replace('LEVEL_', '')}</Badge>
                      <div data-menu>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button size="icon" variant="ghost" className="h-11 w-11 shrink-0">
                              <MoreVertical className="h-5 w-5" />
                              <span className="sr-only">Menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetail(c)}>View Details</DropdownMenuItem>
                            {canEditCourse(c) && <DropdownMenuItem onClick={() => router.push(`/courses/${c.code}/edit`)}>Edit Course</DropdownMenuItem>}
                            {isAdmin && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => setDeleteCourse(c)}>Delete Course</DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{c.lecturer?.name ?? 'Unassigned'} · {c.department?.name ?? c.departmentCode}</p>
                    <p className="text-xs text-gray-500">{c.semester === Semester.FIRST ? 'First' : 'Second'} Semester · {c.credits} Credits</p>
                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                      {c.isLocked ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700"><Lock className="h-3 w-3 mr-1" />Locked</Badge>
                      ) : c.isActive ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">Inactive</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Department Modal */}
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditOpen(false)}>
        <DialogContent className="sm:max-w-[520px]" onSwipeDown={() => setEditOpen(false)}>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>Update department details and assign HOD.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!department) return
              try {
                setEditSaving(true)
                const res = await apiClient.updateDepartment(department.code, {
                  name: editForm.name,
                  code: editForm.code,
                  description: editForm.description || undefined,
                  college: editForm.college,
                  hodId: editForm.hodId || undefined,
                })
                if (res.success) {
                  toast({ title: 'Department updated.' })
                  setEditOpen(false)
                  fetchDetails()
                } else toast({ title: (res as { error?: string }).error, variant: 'destructive' })
              } catch {
                toast({ title: 'Update failed', variant: 'destructive' })
              } finally {
                setEditSaving(false)
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label>Department name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="mt-1.5" required maxLength={100} />
            </div>
            <div>
              <Label>Department code</Label>
              <Input value={editForm.code} onChange={(e) => setEditForm((p) => ({ ...p, code: e.target.value.toUpperCase().slice(0, 4) }))} className="mt-1.5 font-mono" required />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="mt-1.5" maxLength={1000} />
            </div>
            <div>
              <Label>College</Label>
              <Select value={editForm.college} onValueChange={(v) => setEditForm((p) => ({ ...p, college: v as College }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={College.CBAS}>CBAS</SelectItem>
                  <SelectItem value={College.CHMS}>CHMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Head of Department (Optional)</Label>
              <div className="mt-1.5">
                <HodCombobox
                  value={editForm.hodId}
                  onChange={(v) => setEditForm((p) => ({ ...p, hodId: v }))}
                  placeholder="Search by name..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={editSaving}>{editSaving ? 'Saving…' : 'Save Changes'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Course Detail Sheet */}
      <Sheet open={!!detailCourse} onOpenChange={(o) => !o && setDetailCourse(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto">
          <SheetHeader className="sr-only md:not-sr-only">
            <Button variant="ghost" size="icon" className="md:hidden absolute left-4 top-4" onClick={() => setDetailCourse(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </SheetHeader>
          {detailLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          ) : detailCourse ? (
            <div className="pt-12 md:pt-0 space-y-6">
              <div>
                <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{detailCourse.code}</span>
                <h2 className="text-xl font-semibold mt-2">{detailCourse.name}</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p><span className="text-gray-500">Level</span><br />{detailCourse.level.replace('LEVEL_', '')}</p>
                <p><span className="text-gray-500">Semester</span><br />{detailCourse.semester === Semester.FIRST ? 'First' : 'Second'}</p>
                <p><span className="text-gray-500">Credits</span><br />{detailCourse.credits}</p>
                <p><span className="text-gray-500">Department</span><br />{detailCourse.department?.name ?? detailCourse.departmentCode}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {detailCourse.isActive ? <Badge className="bg-green-100 text-green-700">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                {detailCourse.isGeneral ? <Badge variant="secondary">General</Badge> : <Badge variant="secondary">Specific</Badge>}
                {detailCourse.isLocked ? <Badge className="bg-amber-100 text-amber-700"><Lock className="h-3 w-3 mr-1" />Locked</Badge> : <Badge variant="outline">Unlocked</Badge>}
              </div>
              <div>
                <h3 className="font-medium mb-2">Overview</h3>
                <p className="text-sm text-gray-600">{detailCourse.overview || <span className="italic text-gray-400">No overview provided.</span>}</p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">Lecturer</h3>
                {detailCourse.lecturer ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-700">
                      {getInitials(detailCourse.lecturer.name)}
                    </div>
                    <div>
                      <p className="font-medium">{detailCourse.lecturer.name ?? detailCourse.lecturer.email}</p>
                      <p className="text-sm text-gray-500">{detailCourse.lecturer.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No lecturer assigned</p>
                )}
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">Schedule</h3>
                {detailCourse.schedules && detailCourse.schedules.length > 0 ? (
                  <p className="text-sm">{detailCourse.schedules[0]?.dayOfWeek}, {detailCourse.schedules[0]?.startTime} – {detailCourse.schedules[0]?.endTime}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">Not yet scheduled</p>
                )}
              </div>
              {(isAdmin || isHod) && canEditCourse(detailCourse) && (
                <Button variant="outline" className="w-full" onClick={() => { setDetailCourse(null); router.push(`/courses/${detailCourse.code}/edit`); }}>
                  Edit Course
                </Button>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Delete course confirmation */}
      <ConfirmDialog
        open={!!deleteCourse}
        onOpenChange={(o) => !o && setDeleteCourse(null)}
        title="Delete course?"
        description={deleteCourse ? `This will permanently delete ${deleteCourse.code}. This action cannot be undone.` : ''}
        icon={Trash2}
        iconClassName="bg-red-500 text-white"
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={handleDeleteCourse}
        loading={deleteLoading}
      />
    </div>
  )
}
