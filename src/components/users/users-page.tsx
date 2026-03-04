'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import { getItemsFromResponse } from '@/lib/utils'
import {
  User as UserType,
  Role,
  Department,
  CreateUserData,
  UpdateUserData,
} from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  GraduationCap,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ErrorState } from '@/components/state/error-state'

function getInitials(name: string | null | undefined, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i)
  const idx = Math.abs(hash) % 8
  const colors = ['bg-slate-400', 'bg-blue-400', 'bg-violet-400', 'bg-emerald-400', 'bg-orange-400', 'bg-pink-400', 'bg-sky-400', 'bg-teal-400']
  return colors[idx]
}

function formatLastLogin(iso: string | null | undefined): string {
  if (!iso) return 'Never'
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  return d.toLocaleDateString()
}

const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: 'ADMIN',
  [Role.HOD]: 'HOD',
  [Role.LECTURER]: 'Lecturer',
  [Role.STUDENT]: 'Student',
}

type UsersPageRole = 'LECTURER' | 'STUDENT'

interface UsersPageProps {
  role: UsersPageRole
}

export function UsersPage({ role }: UsersPageProps) {
  const { user, isAdmin, isHod } = useAuth()
  const { toast } = useToast()
  const isLecturers = role === 'LECTURER'

  const [users, setUsers] = useState<UserType[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentCode, setDepartmentCode] = useState<string>('')
  const [showInactive, setShowInactive] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [deleteUser, setDeleteUser] = useState<UserType | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateUserData & { password?: string }>({
    matricNO: '',
    email: '',
    password: '',
    name: '',
    role: isLecturers ? Role.LECTURER : Role.STUDENT,
    departmentCode: '',
    phone: '',
  })

  const fetchData = useCallback(async () => {
    if (!isAdmin && !isHod) return
    try {
      setLoading(true)
      setFetchError(null)
      const baseParams: Record<string, unknown> = {
        page: 1,
        limit: 200,
        isActive: showInactive ? undefined : true,
      }
      if (isHod && user?.departmentCode) baseParams.departmentCode = user.departmentCode
      else if (departmentCode) baseParams.departmentCode = departmentCode

      let result: UserType[] = []
      if (isLecturers) {
        const [lectRes, hodRes, deptRes] = await Promise.all([
          apiClient.getUsers({ ...baseParams, role: Role.LECTURER }),
          apiClient.getUsers({ ...baseParams, role: Role.HOD }),
          apiClient.getDepartments({ limit: 100 }),
        ])
        const lectR = getItemsFromResponse<UserType>(lectRes)
        const hodR = getItemsFromResponse<UserType>(hodRes)
        const deptR = getItemsFromResponse<Department>(deptRes)
        const lect = lectR?.items ?? []
        const hods = hodR?.items ?? []
        result = Array.from(new Map([...lect, ...hods].map((u) => [u.id, u])).values())
        if (deptR) setDepartments(deptR.items)
      } else {
        const [res, deptRes] = await Promise.all([
          apiClient.getUsers({ ...baseParams, role: Role.STUDENT }),
          apiClient.getDepartments({ limit: 100 }),
        ])
        const userR = getItemsFromResponse<UserType>(res)
        const deptR = getItemsFromResponse<Department>(deptRes)
        if (userR) result = userR.items
        if (deptR) setDepartments(deptR.items)
      }
      setUsers(result)
    } catch {
      setFetchError('Failed to load users')
      toast({ title: 'Failed to load users', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isHod, user?.departmentCode, departmentCode, showInactive, isLecturers, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase()
    if (!term) return true
    const name = (u.name ?? '').toLowerCase()
    const email = u.email.toLowerCase()
    const matric = u.matricNO.toLowerCase()
    const dept = (u.department?.name ?? u.departmentCode ?? '').toLowerCase()
    return name.includes(term) || email.includes(term) || matric.includes(term) || dept.includes(term)
  })

  const openCreate = () => {
    setEditingUser(null)
    setFormData({
      matricNO: '',
      email: '',
      password: '',
      name: '',
      role: isLecturers ? Role.LECTURER : Role.STUDENT,
      departmentCode: isHod ? (user?.departmentCode ?? '') : (departmentCode || ''),
      phone: '',
    })
    setIsModalOpen(true)
  }

  const openEdit = (u: UserType) => {
    setEditingUser(u)
    setFormData({
      matricNO: u.matricNO,
      email: u.email,
      name: u.name ?? '',
      role: u.role,
      departmentCode: u.departmentCode ?? '',
      phone: u.phone ?? '',
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.matricNO.trim() || !formData.email.trim()) {
      toast({ title: 'Matric/Staff No. and Email are required', variant: 'destructive' })
      return
    }
    if (!editingUser && !formData.password) {
      toast({ title: 'Password is required for new users', variant: 'destructive' })
      return
    }

    try {
      setSaving(true)
      if (editingUser) {
        const payload: UpdateUserData = {
          matricNO: formData.matricNO.trim(),
          email: formData.email.trim(),
          name: formData.name?.trim() || undefined,
          role: formData.role,
          departmentCode: formData.departmentCode || undefined,
          phone: formData.phone?.trim() || undefined,
        }
        const res = await apiClient.updateUser(editingUser.id, payload)
        if (res.success) {
          toast({ title: 'User updated.' })
          setIsModalOpen(false)
          fetchData()
        } else {
          toast({ title: (res as any).error || 'Update failed', variant: 'destructive' })
        }
      } else {
        const payload: CreateUserData = {
          ...formData,
          password: formData.password!,
          matricNO: formData.matricNO.trim(),
          email: formData.email.trim(),
          name: formData.name?.trim(),
          role: formData.role,
          departmentCode: formData.departmentCode || undefined,
          phone: formData.phone?.trim(),
        }
        const res = await apiClient.createUser(payload)
        if (res.success) {
          toast({ title: 'User created.' })
          setIsModalOpen(false)
          fetchData()
        } else {
          toast({ title: (res as any).error || 'Create failed', variant: 'destructive' })
        }
      }
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (u: UserType): Promise<void> => {
    try {
      setActionLoading(true)
      const res = await apiClient.updateUser(u.id, { isActive: !u.isActive })
      if (res.success) {
        toast({ title: u.isActive ? 'User deactivated.' : 'User activated.' })
        fetchData()
      } else {
        toast({ title: (res as any).error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Update failed', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (): Promise<boolean> => {
    if (!deleteUser) return false
    try {
      setActionLoading(true)
      const res = await apiClient.deleteUser(deleteUser.id)
      if (res.success) {
        toast({ title: 'User deleted.' })
        setDeleteUser(null)
        fetchData()
        return true
      }
      toast({ title: (res as any).error, variant: 'destructive' })
      return false
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' })
      return false
    } finally {
      setActionLoading(false)
    }
  }

  if (!isAdmin && !isHod) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-500">You need admin or HOD privileges to access this page.</p>
      </div>
    )
  }

  const heading = isLecturers ? 'Lecturers' : 'Students'
  const addLabel = isLecturers ? 'Add Lecturer' : 'Add Student'
  const showDeptSelect = isAdmin && !isHod

  return (
    <div className="space-y-6">
      {/* 10.1 Page Layout */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{heading}</h1>
        {isAdmin && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {addLabel}
          </Button>
        )}
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {showDeptSelect && (
            <Select value={departmentCode || 'all'} onValueChange={(v) => setDepartmentCode(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.code}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">Show inactive</span>
          </label>
        </div>
      </div>

      {/* 10.2 Users Table */}
      {fetchError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ErrorState title={fetchError} onRetry={() => { setFetchError(null); fetchData(); }} />
        </div>
      ) : loading ? (
        <div className="rounded-xl border bg-white p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-xl border border-gray-200 p-12 text-center">
          <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base font-semibold text-gray-700">No users found</h3>
          <p className="text-sm text-gray-400 mt-2">{searchTerm ? 'Try adjusting your search' : 'No users have been registered yet.'}</p>
          {isAdmin && (
            <Button className="mt-4" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              {addLabel}
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white border-b sticky top-0 z-10">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="p-3">Avatar+Name</th>
                    <th className="p-3">Matric/Staff No.</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Last Login</th>
                    <th className="p-3">Status</th>
                    {isAdmin && <th className="p-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(u.name ?? u.email)}`}>
                            {getInitials(u.name, u.email)}
                          </div>
                          <span className="font-medium">{u.name ?? u.email}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-sm">{u.matricNO}</td>
                      <td className="p-3 text-sm">{u.email}</td>
                      <td className="p-3 text-sm">{u.department?.name ?? u.departmentCode ?? '—'}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-xs">{ROLE_LABELS[u.role]}</Badge>
                      </td>
                      <td className="p-3 text-sm text-gray-500">{formatLastLogin(u.lastLoginAt)}</td>
                      <td className="p-3">
                        <Badge className={u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => openEdit(u)}><Pencil className="h-5 w-5" /><span className="sr-only">Edit</span></Button>
                            <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => handleToggleActive(u)} disabled={actionLoading}><Power className="h-5 w-5" /><span className="sr-only">Toggle active</span></Button>
                            <Button size="icon" variant="ghost" className="h-11 w-11 text-red-600" onClick={() => setDeleteUser(u)}><Trash2 className="h-5 w-5" /><span className="sr-only">Delete</span></Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filteredUsers.map((u) => (
              <div key={u.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 ${getAvatarColor(u.name ?? u.email)}`}>
                      {getInitials(u.name, u.email)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{u.name ?? u.email}</p>
                        <Badge variant="secondary" className="text-xs">{ROLE_LABELS[u.role]}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 font-mono">{u.matricNO}</p>
                      <p className="text-sm text-gray-500">{u.email}</p>
                      <p className="text-xs text-gray-500">{u.department?.name ?? u.departmentCode ?? '—'} · {u.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-11 w-11 shrink-0"><MoreVertical className="h-5 w-5" /><span className="sr-only">Menu</span></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(u)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => setDeleteUser(u)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">Last login: {formatLastLogin(u.lastLoginAt)}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 10.3 Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : addLabel}</DialogTitle>
            <DialogDescription>{editingUser ? 'Update user details.' : 'Create a new user account.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label>Full name</Label>
              <Input value={formData.name ?? ''} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="Optional" />
            </div>
            <div>
              <Label>Matric / Staff no. *</Label>
              <Input value={formData.matricNO} onChange={(e) => setFormData((p) => ({ ...p, matricNO: e.target.value }))} required />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} required disabled={!!editingUser} />
            </div>
            {!editingUser && (
              <div>
                <Label>Password *</Label>
                <Input type="password" value={formData.password ?? ''} onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))} required />
              </div>
            )}
            {isLecturers && (
              <div>
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData((p) => ({ ...p, role: v as Role }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Role.LECTURER}>Lecturer</SelectItem>
                    <SelectItem value={Role.HOD}>HOD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {(isLecturers || role === 'STUDENT') && (
              <div>
                <Label>Department</Label>
                <Select value={formData.departmentCode || ''} onValueChange={(v) => setFormData((p) => ({ ...p, departmentCode: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.code}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Phone</Label>
              <Input value={formData.phone ?? ''} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} placeholder="Optional" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteUser}
        onOpenChange={(o) => !o && setDeleteUser(null)}
        title="Delete user?"
        description={`This will permanently remove ${deleteUser?.name ?? deleteUser?.email}.`}
        icon={Trash2}
        iconClassName="bg-red-500 text-white"
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={handleDelete}
        loading={actionLoading}
      />
    </div>
  )
}
