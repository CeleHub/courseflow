'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import { getItemsFromResponse } from '@/lib/utils'
import { VerificationCode, Role, CreateVerificationCodeData } from '@/types'
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
  Clipboard,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  KeyRound,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ErrorState } from '@/components/state/error-state'

function formatExpiry(iso: string | null | undefined): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function VerificationCodesPage() {
  const { isAdmin } = useAuth()
  const { toast } = useToast()

  const [codes, setCodes] = useState<VerificationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<VerificationCode | null>(null)
  const [deleteCode, setDeleteCode] = useState<VerificationCode | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateVerificationCodeData & { maxUsage?: number }>({
    code: '',
    role: Role.LECTURER,
    description: '',
    maxUsage: undefined,
    expiresAt: undefined,
  })

  const fetchCodes = useCallback(async () => {
    try {
      setLoading(true)
      setFetchError(null)
      const res = await apiClient.getVerificationCodes()
      const parsed = getItemsFromResponse<VerificationCode>(res)
      const items = parsed?.items ?? (Array.isArray((res as any)?.data) ? (res as any).data : [])
      setCodes(items)
    } catch {
      setFetchError('Failed to load verification codes')
      toast({ title: 'Failed to load verification codes', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (isAdmin) fetchCodes()
  }, [isAdmin, fetchCodes])

  const copyToClipboard = async (code: VerificationCode) => {
    try {
      await navigator.clipboard.writeText(code.code)
      setCopiedId(code.id)
      toast({ title: 'Copied to clipboard.', variant: 'info' })
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' })
    }
  }

  const generateCode = () => {
    const rolePrefix = formData.role.toUpperCase()
    const year = new Date().getFullYear()
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let suffix = ''
    for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)]
    setFormData((p) => ({ ...p, code: `${rolePrefix}-${year}-${suffix}` }))
  }

  const openCreate = () => {
    setEditingCode(null)
    setFormData({
      code: '',
      role: Role.LECTURER,
      description: '',
      maxUsage: undefined,
      expiresAt: undefined,
    })
    setIsModalOpen(true)
  }

  const openEdit = (c: VerificationCode) => {
    setEditingCode(c)
    setFormData({
      code: c.code,
      role: c.role,
      description: c.description ?? '',
      maxUsage: c.maxUsage ?? undefined,
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 16) : undefined,
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code.trim()) {
      toast({ title: 'Code is required', variant: 'destructive' })
      return
    }
    if (formData.code.length > 50) {
      toast({ title: 'Code max 50 chars', variant: 'destructive' })
      return
    }

    try {
      setSaving(true)
      const payload: CreateVerificationCodeData = {
        code: formData.code.trim(),
        role: formData.role,
        description: formData.description?.trim(),
        maxUsage: formData.maxUsage && formData.maxUsage >= 1 ? formData.maxUsage : undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
      }
      if (editingCode) {
        const res = await apiClient.updateVerificationCode(editingCode.id, payload)
        if (res.success) {
          toast({ title: 'Code updated.' })
          setIsModalOpen(false)
          fetchCodes()
        } else {
          toast({ title: (res as any).error, variant: 'destructive' })
        }
      } else {
        const res = await apiClient.createVerificationCode(payload)
        if (res.success) {
          toast({ title: 'Code created.' })
          setIsModalOpen(false)
          fetchCodes()
        } else {
          toast({ title: (res as any).error, variant: 'destructive' })
        }
      }
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (c: VerificationCode) => {
    try {
      setActionLoading(true)
      const res = await apiClient.updateVerificationCode(c.id, { isActive: !c.isActive })
      if (res.success) {
        toast({ title: c.isActive ? 'Code deactivated.' : 'Code activated.' })
        fetchCodes()
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
    if (!deleteCode) return false
    try {
      setActionLoading(true)
      const res = await apiClient.deleteVerificationCode(deleteCode.id)
      if (res.success) {
        toast({ title: 'Code deleted.' })
        setDeleteCode(null)
        fetchCodes()
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

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <KeyRound className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-500">Admin privileges required.</p>
      </div>
    )
  }

  const staffRoles = [Role.ADMIN, Role.HOD, Role.LECTURER]

  return (
    <div className="space-y-6">
      {/* 12.1 Page Layout */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Verification Codes</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Code
        </Button>
      </div>

      {/* 12.2 Table */}
      {fetchError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ErrorState title={fetchError} onRetry={() => { setFetchError(null); fetchCodes(); }} />
        </div>
      ) : loading ? (
        <div className="rounded-xl border bg-white p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      ) : codes.length === 0 ? (
        <div className="rounded-xl border border-gray-200 p-12 text-center">
          <KeyRound className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base font-semibold text-gray-700">No verification codes</h3>
          <p className="text-sm text-gray-400 mt-2">Create codes to allow staff registration.</p>
          <Button className="mt-5" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            + New Code
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white border-b">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="p-3">Code</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Usage</th>
                    <th className="p-3">Expires</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created By</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <code className="font-mono text-sm">{c.code}</code>
                          <Button size="icon" variant="ghost" className="h-11 w-11 shrink-0" onClick={() => copyToClipboard(c)} title={copiedId === c.id ? 'Copied!' : 'Copy'}>
                            <Clipboard className="h-4 w-4" /><span className="sr-only">Copy</span>
                          </Button>
                        </div>
                      </td>
                      <td className="p-3"><Badge variant="secondary">{c.role}</Badge></td>
                      <td className="p-3 text-sm text-gray-600 max-w-[180px] truncate" title={c.description ?? ''}>{c.description ?? '—'}</td>
                      <td className="p-3">
                        {c.maxUsage != null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (c.usageCount / c.maxUsage) * 100)}%` }} />
                            </div>
                            <span className="text-sm">{c.usageCount}/{c.maxUsage}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Unlimited</span>
                        )}
                      </td>
                      <td className="p-3 text-sm">{formatExpiry(c.expiresAt)}</td>
                      <td className="p-3">
                        <Badge className={c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td className="p-3 text-sm text-gray-600">{c.creator?.name ?? c.createdBy ?? '—'}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => openEdit(c)}><Pencil className="h-5 w-5" /><span className="sr-only">Edit</span></Button>
                          <Button size="icon" variant="ghost" className={`h-11 w-11 ${c.isActive ? 'text-green-600' : 'text-gray-500'}`} onClick={() => handleToggleActive(c)} disabled={actionLoading}><Power className="h-5 w-5" /><span className="sr-only">Toggle</span></Button>
                          <Button size="icon" variant="ghost" className="h-11 w-11 text-red-600" onClick={() => setDeleteCode(c)}><Trash2 className="h-5 w-5" /><span className="sr-only">Delete</span></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {codes.map((c) => (
              <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm">{c.code}</code>
                    <Button size="icon" variant="ghost" className="h-11 w-11 shrink-0" onClick={() => copyToClipboard(c)}><Clipboard className="h-4 w-4" /><span className="sr-only">Copy</span></Button>
                  </div>
                  <Badge variant="secondary">{c.role}</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{c.description ?? '—'}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  {c.maxUsage != null ? (
                    <>
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden flex-1 max-w-[80px]">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (c.usageCount / c.maxUsage) * 100)}%` }} />
                      </div>
                      <span>{c.usageCount}/{c.maxUsage}</span>
                    </>
                  ) : (
                    <span>Unlimited</span>
                  )}
                  <span>·</span>
                  <span>Expires: {formatExpiry(c.expiresAt)}</span>
                </div>
                <div className="border-t mt-3 pt-3 flex items-center justify-between">
                  <Badge className={c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-11 w-11 shrink-0"><MoreVertical className="h-5 w-5" /><span className="sr-only">Menu</span></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(c)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(c)}>{c.isActive ? 'Deactivate' : 'Activate'}</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => setDeleteCode(c)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 12.3 Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]" onSwipeDown={() => setIsModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingCode ? 'Edit Verification Code' : 'New Verification Code'}</DialogTitle>
            <DialogDescription>{editingCode ? 'Update code details.' : 'Create a verification code for registration.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label>Code * (max 50 chars)</Label>
              <div className="relative mt-1.5">
                <Input value={formData.code} onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))} placeholder="ROLE-YEAR-XXXXXX" className="pr-24 font-mono" required maxLength={50} />
                <Button type="button" variant="outline" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={generateCode}>Generate</Button>
              </div>
            </div>
            <div>
              <Label>Role *</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData((p) => ({ ...p, role: v as Role }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {staffRoles.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description (max 200 chars)</Label>
              <Input value={formData.description ?? ''} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} maxLength={200} />
            </div>
            <div>
              <Label>Max usage (empty = unlimited)</Label>
              <Input type="number" min={1} value={formData.maxUsage ?? ''} onChange={(e) => setFormData((p) => ({ ...p, maxUsage: e.target.value ? Number(e.target.value) : undefined }))} placeholder="Unlimited" />
            </div>
            <div>
              <Label>Expiry date/time</Label>
              <Input type="datetime-local" value={formData.expiresAt ?? ''} onChange={(e) => setFormData((p) => ({ ...p, expiresAt: e.target.value || undefined }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteCode} onOpenChange={(o) => !o && setDeleteCode(null)} title="Delete verification code?" description="This cannot be undone." icon={Trash2} iconClassName="bg-red-500 text-white" confirmLabel="Delete" confirmVariant="destructive" onConfirm={handleDelete} loading={actionLoading} />
    </div>
  )
}
