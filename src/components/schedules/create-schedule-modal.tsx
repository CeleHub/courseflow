'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api'
import { getItemsFromResponse } from '@/lib/utils'
import { Course, DayOfWeek, Schedule } from '@/types'

const WEEKDAYS = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY]
const DAY_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: 'Monday',
  [DayOfWeek.TUESDAY]: 'Tuesday',
  [DayOfWeek.WEDNESDAY]: 'Wednesday',
  [DayOfWeek.THURSDAY]: 'Thursday',
  [DayOfWeek.FRIDAY]: 'Friday',
  [DayOfWeek.SATURDAY]: 'Saturday',
  [DayOfWeek.SUNDAY]: 'Sunday',
}

const START_TIMES_BASE = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
const WEDNESDAY_START_TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00']

export interface CreateScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  prefill?: { courseCode?: string; dayOfWeek?: DayOfWeek; startTime?: string }
  editSchedule?: Schedule | null
  /** When creating: if course already has a schedule in this session, show inline note */
  activeSessionId?: string
  existingSchedules?: Schedule[]
}

export function CreateScheduleModal({
  open,
  onOpenChange,
  onSuccess,
  prefill = {},
  editSchedule,
  activeSessionId,
  existingSchedules = [],
}: CreateScheduleModalProps) {
  const isEdit = !!editSchedule
  const { toast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    courseCode: '',
    dayOfWeek: '' as string,
    startTime: '',
    isFixed: false,
  })

  const fetchCourses = useCallback(async () => {
    try {
      const res = await apiClient.getCourses({ limit: 200 })
      const r = getItemsFromResponse<Course>(res)
      if (r) setCourses(r.items)
    } catch {
      setCourses([])
    }
  }, [])

  useEffect(() => {
    if (open) fetchCourses()
  }, [open, fetchCourses])

  useEffect(() => {
    if (open && editSchedule) {
      setFormData({
        courseCode: editSchedule.courseCode,
        dayOfWeek: editSchedule.dayOfWeek,
        startTime: editSchedule.startTime,
        isFixed: editSchedule.isFixed ?? false,
      })
    } else if (open && (prefill.courseCode || prefill.dayOfWeek || prefill.startTime)) {
      setFormData((p) => ({
        ...p,
        ...(prefill.courseCode && { courseCode: prefill.courseCode }),
        ...(prefill.dayOfWeek && { dayOfWeek: prefill.dayOfWeek }),
        ...(prefill.startTime && { startTime: prefill.startTime }),
      }))
    }
  }, [open, editSchedule, prefill.courseCode, prefill.dayOfWeek, prefill.startTime])

  const startTimeOptions = formData.dayOfWeek === DayOfWeek.WEDNESDAY ? WEDNESDAY_START_TIMES : START_TIMES_BASE
  const endTime = formData.startTime
    ? `${(parseInt(formData.startTime.split(':')[0] ?? '9') + 2).toString().padStart(2, '0')}:00`
    : ''

  const wednesdayError =
    formData.dayOfWeek === DayOfWeek.WEDNESDAY &&
    formData.startTime &&
    parseInt(formData.startTime.split(':')[0] ?? '0') >= 14

  const filteredCourses = query.trim().length >= 1
    ? courses.filter((c) => {
        const q = query.toLowerCase()
        return (c.code ?? '').toLowerCase().includes(q) || (c.name ?? '').toLowerCase().includes(q)
      })
    : courses.slice(0, 30)

  const selectedCourse = courses.find((c) => c.code === formData.courseCode)
  const displayValue = comboboxOpen ? query : (selectedCourse ? `${selectedCourse.code} - ${selectedCourse.name}` : '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.courseCode || !formData.dayOfWeek || !formData.startTime) {
      toast({ title: 'Please fill required fields', variant: 'destructive' })
      return
    }
    if (wednesdayError) {
      toast({ title: 'Wednesday classes must end by 15:00', variant: 'destructive' })
      return
    }
    try {
      setLoading(true)
      if (isEdit && editSchedule) {
        const res = await apiClient.updateSchedule(editSchedule.id, {
          dayOfWeek: formData.dayOfWeek as DayOfWeek,
          startTime: formData.startTime,
          endTime,
          isFixed: formData.isFixed,
        })
        if (res.success) {
          toast({ title: 'Schedule updated' })
          onOpenChange(false)
          setFormData({ courseCode: '', dayOfWeek: '', startTime: '', isFixed: false })
          setQuery('')
          onSuccess?.()
        } else {
          toast({ title: (res as any).error ?? 'Failed', variant: 'destructive' })
        }
      } else {
        const res = await apiClient.createSchedule({
          courseCode: formData.courseCode,
          dayOfWeek: formData.dayOfWeek as DayOfWeek,
          startTime: formData.startTime,
          endTime,
          isFixed: formData.isFixed,
        })
        if (res.success) {
          toast({ title: 'Schedule created' })
          onOpenChange(false)
          setFormData({ courseCode: '', dayOfWeek: '', startTime: '', isFixed: false })
          setQuery('')
          onSuccess?.()
        } else {
          toast({ title: (res as any).error ?? 'Failed', variant: 'destructive' })
        }
      }
    } catch {
      toast({ title: isEdit ? 'Failed to update schedule' : 'Failed to create schedule', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ courseCode: '', dayOfWeek: '', startTime: '', isFixed: false })
    setQuery('')
    setComboboxOpen(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]" onSwipeDown={handleClose}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Schedule' : 'Create Schedule'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the schedule details.' : 'Add a manual schedule to the timetable.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div ref={containerRef} className="relative">
            <Label>Course *</Label>
            <Input
              placeholder="Search by code or name..."
              value={displayValue}
              onChange={(e) => {
                setQuery(e.target.value)
                setComboboxOpen(true)
              }}
              onFocus={() => setComboboxOpen(true)}
              onKeyDown={(e) => e.key === 'Escape' && setComboboxOpen(false)}
              disabled={isEdit}
              className={isEdit ? 'bg-gray-50 cursor-not-allowed' : ''}
            />
            {comboboxOpen && (
              <>
                <div className="fixed inset-0 z-40" aria-hidden onClick={() => setComboboxOpen(false)} />
                <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-48 overflow-y-auto">
                  {filteredCourses.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-gray-500">No matches</div>
                  ) : (
                    filteredCourses.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        className="w-full px-3 py-2.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => {
                          setFormData((p) => ({ ...p, courseCode: c.code }))
                          setQuery('')
                          setComboboxOpen(false)
                        }}
                      >
                        <span className="font-mono text-xs">{c.code}</span>
                        <span className="text-gray-600 truncate">{c.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <div>
            <Label>Day of week *</Label>
            <Select value={formData.dayOfWeek} onValueChange={(v) => setFormData((p) => ({ ...p, dayOfWeek: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAYS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {DAY_LABELS[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Start time *</Label>
            <Select value={formData.startTime} onValueChange={(v) => setFormData((p) => ({ ...p, startTime: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
              <SelectContent>
                {startTimeOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>End time (auto-calculated)</Label>
            <Input value={endTime} readOnly className="bg-gray-50 cursor-not-allowed" />
          </div>

          {wednesdayError && (
            <p className="text-sm text-red-600">Wednesday classes must end by 15:00.</p>
          )}

          {!isEdit && formData.courseCode && activeSessionId && existingSchedules.some(
            (s) => s.courseCode === formData.courseCode && s.sessionId === activeSessionId
          ) && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              This course already has a schedule. Editing will update the existing one.
            </p>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFixed"
              checked={formData.isFixed}
              onChange={(e) => setFormData((p) => ({ ...p, isFixed: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isFixed" className="cursor-pointer text-sm">
              Pin this slot (isFixed) — Fix this slot so auto-generation never moves it.
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || wednesdayError}>
              {loading ? (isEdit ? 'Updating...' : 'Creating...') : isEdit ? 'Save Changes' : 'Create Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
