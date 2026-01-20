'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  Calendar,
  Search,
  Filter,
  Clock,
  MapPin,
  BookOpen,
  RefreshCw,
  Upload,
  Download,
  FileText,
  Plus,
  FileDown,
  ChevronDown
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { Schedule, Department, Level, DayOfWeek, ClassType, Semester } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'

export default function SchedulePage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isLecturer } = useAuth()
  const { toast } = useToast()

  // Check if user is staff (admin or lecturer)
  const isStaff = isAdmin || isLecturer
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [selectedSemester, setSelectedSemester] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const dayOptions = [
    { value: DayOfWeek.MONDAY, label: 'Monday', shortLabel: 'MON.' },
    { value: DayOfWeek.TUESDAY, label: 'Tuesday', shortLabel: 'TUES.' },
    { value: DayOfWeek.WEDNESDAY, label: 'Wednesday', shortLabel: 'WED.' },
    { value: DayOfWeek.THURSDAY, label: 'Thursday', shortLabel: 'THURS.' },
    { value: DayOfWeek.FRIDAY, label: 'Friday', shortLabel: 'FRI.' },
    { value: DayOfWeek.SATURDAY, label: 'Saturday', shortLabel: 'SAT.' },
    { value: DayOfWeek.SUNDAY, label: 'Sunday', shortLabel: 'SUN.' },
  ]

  const levelOptions = [
    { value: Level.LEVEL_100, label: '100 Level' },
    { value: Level.LEVEL_200, label: '200 Level' },
    { value: Level.LEVEL_300, label: '300 Level' },
    { value: Level.LEVEL_400, label: '400 Level' },
    { value: Level.LEVEL_500, label: '500 Level' },
  ]

  const semesterOptions = [
    { value: Semester.FIRST, label: 'First Semester' },
    { value: Semester.SECOND, label: 'Second Semester' },
  ]

  useEffect(() => {
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

    fetchDepartments()
  }, [])

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit: 20,
      }

      if (selectedDepartment && selectedDepartment !== 'all') params.departmentCode = selectedDepartment
      if (selectedLevel && selectedLevel !== 'all') params.level = selectedLevel
      if (selectedDay && selectedDay !== 'all') params.dayOfWeek = selectedDay
      if (selectedSemester && selectedSemester !== 'all') params.semester = selectedSemester

      const response = await apiClient.getSchedules(params)

      if (response.success && response.data) {
        setSchedules(response.data.data.items)
        setTotalPages(response.data.data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, selectedDepartment, selectedLevel, selectedDay, selectedSemester])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const filteredSchedules = schedules.filter(schedule =>
    schedule.course?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.course?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.venue.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleReset = () => {
    setSearchTerm('')
    setSelectedDepartment('all')
    setSelectedLevel('all')
    setSelectedDay('all')
    setSelectedSemester('all')
    setCurrentPage(1)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setSelectedFile(file)
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      })
    }
  }

  const handleBulkUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)
      const response = await apiClient.uploadSchedulesBulk(selectedFile)

      if (response.success) {
        toast({
          title: "Upload Successful",
          description: "Schedules have been uploaded successfully",
        })
        setIsUploadDialogOpen(false)
        setSelectedFile(null)
        fetchSchedules()
      } else {
        toast({
          title: "Upload Failed",
          description: response.error || "Failed to upload schedules",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Bulk upload failed:', error)
      toast({
        title: "Upload Error",
        description: "An error occurred during upload",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await apiClient.getSchedulesBulkTemplate()
      if (response.success && response.data) {
        // Create a download link for the template
        const blob = new Blob([response.data as string], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'schedules_template.csv'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        toast({
          title: "Download Failed",
          description: "Failed to download template",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Template download failed:', error)
      toast({
        title: "Download Error",
        description: "An error occurred while downloading template",
        variant: "destructive",
      })
    }
  }

  // Helper function to get time slots from schedules
  const getTimeSlots = (schedules: Schedule[]): string[] => {
    const timeSet = new Set<string>()
    schedules.forEach(schedule => {
      const timeKey = `${schedule.startTime}-${schedule.endTime}`
      timeSet.add(timeKey)
    })
    return Array.from(timeSet).sort((a, b) => {
      const [startA] = a.split('-')
      const [startB] = b.split('-')
      return startA.localeCompare(startB)
    })
  }

  // Helper function to format time slot for display (matches image format)
  const formatTimeSlot = (startTime: string, endTime: string): string => {
    try {
      const [startHours, startMinutes] = startTime.split(':')
      const [endHours, endMinutes] = endTime.split(':')
      const startHour = parseInt(startHours)
      const endHour = parseInt(endHours)
      
      const startAMPM = startHour >= 12 ? 'PM' : 'AM'
      const endAMPM = endHour >= 12 ? 'PM' : 'AM'
      const displayStartHour = startHour % 12 || 12
      const displayEndHour = endHour % 12 || 12
      
      // Format like "9-10 (AM)" or "11AM-12PM"
      if (startAMPM === endAMPM) {
        return `${displayStartHour}-${displayEndHour} (${startAMPM})`
      } else {
        return `${displayStartHour}${startAMPM}-${displayEndHour}${endAMPM}`
      }
    } catch {
      return `${startTime} - ${endTime}`
    }
  }


  // Fetch all schedules for export (not just current page)
  const fetchAllSchedulesForExport = async (): Promise<Schedule[]> => {
    try {
      // Always fetch from API with filters, don't rely on current page data
      const params: any = {
        page: 1,
        limit: 100, // Reasonable limit per page
      }

      if (selectedDepartment && selectedDepartment !== 'all') params.departmentCode = selectedDepartment
      if (selectedLevel && selectedLevel !== 'all') params.level = selectedLevel
      if (selectedDay && selectedDay !== 'all') params.dayOfWeek = selectedDay
      if (searchTerm) params.search = searchTerm

      const response = await apiClient.getSchedules(params)
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch schedules')
      }

      // Based on fetchSchedules, the structure is: response.data.data.items
      let allSchedules: Schedule[] = []
      let totalPagesCount = 1

      // Parse response structure (matches fetchSchedules structure)
      if (response.data.data && typeof response.data.data === 'object') {
        if ('items' in response.data.data && Array.isArray((response.data.data as any).items)) {
          allSchedules = (response.data.data as any).items
          if ('pagination' in response.data.data && (response.data.data as any).pagination) {
            totalPagesCount = (response.data.data as any).pagination.totalPages || 1
          }
        } else if (Array.isArray(response.data.data)) {
          allSchedules = response.data.data
        }
      }

      // Fetch all remaining pages
      for (let page = 2; page <= totalPagesCount; page++) {
        const pageParams = { ...params, page }
        const pageResponse = await apiClient.getSchedules(pageParams)
        
        if (pageResponse.success && pageResponse.data) {
          let pageItems: Schedule[] = []
          
          if (pageResponse.data.data && typeof pageResponse.data.data === 'object') {
            if ('items' in pageResponse.data.data && Array.isArray((pageResponse.data.data as any).items)) {
              pageItems = (pageResponse.data.data as any).items
            } else if (Array.isArray(pageResponse.data.data)) {
              pageItems = pageResponse.data.data
            }
          }
          
          allSchedules = [...allSchedules, ...pageItems]
        }
      }

      // Apply client-side search filter if search param wasn't supported by API
      if (searchTerm && allSchedules.length > 0) {
        const filtered = allSchedules.filter(schedule =>
          schedule.course?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          schedule.course?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          schedule.venue?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        // Use filtered results if we got matches
        if (filtered.length > 0) {
          allSchedules = filtered
        }
      }

      // Fetch courses with lecturer information to enrich schedules
      const courseCodes = Array.from(new Set(allSchedules.map(s => s.courseCode).filter(Boolean)))
      if (courseCodes.length > 0) {
        try {
          const coursesResponse = await apiClient.getCourses({ limit: 1000 })
          if (coursesResponse.success && coursesResponse.data) {
            let courses: any[] = []
            
            // Parse courses response structure
            if (coursesResponse.data.data && typeof coursesResponse.data.data === 'object') {
              if ('items' in coursesResponse.data.data && Array.isArray((coursesResponse.data.data as any).items)) {
                courses = (coursesResponse.data.data as any).items
              } else if (Array.isArray(coursesResponse.data.data)) {
                courses = coursesResponse.data.data
              }
            } else if (Array.isArray(coursesResponse.data)) {
              courses = coursesResponse.data
            }

            // Create a map of course codes to courses with lecturer info
            const courseMap = new Map<string, any>()
            courses.forEach(course => {
              if (course.code) {
                courseMap.set(course.code, course)
              }
            })

            // Enrich schedules with lecturer information from courses
            allSchedules = allSchedules.map(schedule => {
              if (schedule.courseCode && courseMap.has(schedule.courseCode)) {
                const enrichedCourse = courseMap.get(schedule.courseCode)
                if (schedule.course && enrichedCourse) {
                  return {
                    ...schedule,
                    course: {
                      ...schedule.course,
                      lecturer: enrichedCourse.lecturer || schedule.course.lecturer,
                      lecturerEmail: enrichedCourse.lecturerEmail || schedule.course.lecturerEmail,
                    }
                  } as Schedule
                }
              }
              return schedule
            })
          }
        } catch (error) {
          console.warn('Failed to fetch courses for lecturer info:', error)
          // Continue without enriching, will use available data
        }
      }

      return allSchedules
    } catch (error) {
      console.error('Failed to fetch all schedules:', error)
      // Only fallback to visible schedules if API completely fails
      // But note: this will only have current page data
      if (filteredSchedules.length > 0) {
        console.warn('API fetch failed, using visible schedules (may be incomplete)')
        return filteredSchedules
      }
      return []
    }
  }

  // Export as PDF
  const exportAsPDF = async () => {
    try {
      toast({
        title: "Preparing Export",
        description: "Fetching all schedules...",
      })

      const allSchedules = await fetchAllSchedulesForExport()
      
      if (!allSchedules || allSchedules.length === 0) {
        toast({
          title: "No Schedules",
          description: "There are no schedules to export",
          variant: "destructive",
        })
        return
      }

      // Build grid with all schedules
      const timeSlots = getTimeSlots(allSchedules)
      const grid: Record<string, Record<string, { code: string; venue: string; type?: string }[]>> = {}

      dayOptions.forEach(day => {
        grid[day.value] = {}
        timeSlots.forEach(timeSlot => {
          grid[day.value][timeSlot] = []
        })
      })

      allSchedules.forEach(schedule => {
        const day = schedule.dayOfWeek
        const timeSlot = `${schedule.startTime}-${schedule.endTime}`
        const courseCode = schedule.course?.code || 'N/A'
        const venue = schedule.venue
        const type = schedule.type

        if (!grid[day]) grid[day] = {}
        if (!grid[day][timeSlot]) grid[day][timeSlot] = []
        
        grid[day][timeSlot].push({ code: courseCode, venue, type })
      })

      // Build course details
      const courseMap = new Map<string, {
        code: string
        title: string
        lecturer: string
        units: number
        status: string
      }>()

      allSchedules.forEach(schedule => {
        if (!schedule.course) return
        const code = schedule.course.code
        if (!courseMap.has(code)) {
          // Get lecturer name from lecturer object, or use lecturerEmail, or fallback to N/A
          let lecturerName = 'N/A'
          if (schedule.course.lecturer?.name) {
            lecturerName = schedule.course.lecturer.name
          } else if (schedule.course.lecturerEmail) {
            lecturerName = schedule.course.lecturerEmail
          }
          
          courseMap.set(code, {
            code,
            title: schedule.course.name,
            lecturer: lecturerName,
            units: schedule.course.credits,
            status: 'C'
          })
        }
      })

      const courseDetails = Array.from(courseMap.values()).sort((a, b) => a.code.localeCompare(b.code))
      const doc = new jsPDF('landscape', 'mm', 'a4')
      
      // Timetable Grid
      const timetableData: string[][] = []
      dayOptions.forEach(day => {
        const row: string[] = [day.shortLabel || day.label]
        timeSlots.forEach(timeSlot => {
          const [startTime, endTime] = timeSlot.split('-')
          const timeLabel = formatTimeSlot(startTime, endTime)
          const schedules = grid[day.value]?.[timeSlot] || []
          if (schedules.length > 0) {
            const cellContent = schedules.map(s => {
              const venueText = s.venue ? ` (${s.venue})` : ''
              return `${s.code}${venueText}`
            }).join(' / ')
            row.push(cellContent)
          } else {
            row.push('')
          }
        })
        timetableData.push(row)
      })

      const timeHeaders = ['Day', ...timeSlots.map(ts => {
        const [start, end] = ts.split('-')
        return formatTimeSlot(start, end)
      })]

      autoTable(doc, {
        head: [timeHeaders],
        body: timetableData,
        startY: 20,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { top: 20 },
      })

      // Course Details Table
      const courseData = courseDetails.map((course, index) => [
        (index + 1).toString(),
        course.code,
        course.title,
        course.lecturer,
        course.units.toString(),
        course.status
      ])

      autoTable(doc, {
        head: [['S/NO.', 'COURSE CODE', 'COURSE TITLE', 'LECTURER', 'UNITS', 'STATUS']],
        body: courseData,
        startY: (doc as any).lastAutoTable.finalY + 20,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
      })

      const date = new Date().toISOString().split('T')[0]
      doc.save(`timetable_${date}.pdf`)

      toast({
        title: "Export Successful",
        description: `Timetable exported as PDF (${allSchedules.length} schedules)`,
      })
    } catch (error) {
      console.error('PDF export failed:', error)
      toast({
        title: "Export Error",
        description: "An error occurred while exporting PDF",
        variant: "destructive",
      })
    }
  }

  // Export as XLSX
  const exportAsXLSX = async () => {
    try {
      toast({
        title: "Preparing Export",
        description: "Fetching all schedules...",
      })

      const allSchedules = await fetchAllSchedulesForExport()
      
      if (!allSchedules || allSchedules.length === 0) {
        toast({
          title: "No Schedules",
          description: "There are no schedules to export",
          variant: "destructive",
        })
        return
      }

      // Build grid with all schedules
      const timeSlots = getTimeSlots(allSchedules)
      const grid: Record<string, Record<string, { code: string; venue: string; type?: string }[]>> = {}

      dayOptions.forEach(day => {
        grid[day.value] = {}
        timeSlots.forEach(timeSlot => {
          grid[day.value][timeSlot] = []
        })
      })

      allSchedules.forEach(schedule => {
        const day = schedule.dayOfWeek
        const timeSlot = `${schedule.startTime}-${schedule.endTime}`
        const courseCode = schedule.course?.code || 'N/A'
        const venue = schedule.venue
        const type = schedule.type

        if (!grid[day]) grid[day] = {}
        if (!grid[day][timeSlot]) grid[day][timeSlot] = []
        
        grid[day][timeSlot].push({ code: courseCode, venue, type })
      })

      // Build course details
      const courseMap = new Map<string, {
        code: string
        title: string
        lecturer: string
        units: number
        status: string
      }>()

      allSchedules.forEach(schedule => {
        if (!schedule.course) return
        const code = schedule.course.code
        if (!courseMap.has(code)) {
          // Get lecturer name from lecturer object, or use lecturerEmail, or fallback to N/A
          let lecturerName = 'N/A'
          if (schedule.course.lecturer?.name) {
            lecturerName = schedule.course.lecturer.name
          } else if (schedule.course.lecturerEmail) {
            lecturerName = schedule.course.lecturerEmail
          }
          
          courseMap.set(code, {
            code,
            title: schedule.course.name,
            lecturer: lecturerName,
            units: schedule.course.credits,
            status: 'C'
          })
        }
      })

      const courseDetails = Array.from(courseMap.values()).sort((a, b) => a.code.localeCompare(b.code))

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Timetable Grid Sheet
      const timetableData: string[][] = []
      const timeHeaders = ['Day', ...timeSlots.map(ts => {
        const [start, end] = ts.split('-')
        return formatTimeSlot(start, end)
      })]
      timetableData.push(timeHeaders)

      dayOptions.forEach(day => {
        const row: string[] = [day.shortLabel || day.label]
        timeSlots.forEach(timeSlot => {
          const schedules = grid[day.value]?.[timeSlot] || []
          if (schedules.length > 0) {
            const cellContent = schedules.map(s => {
              const venueText = s.venue ? ` (${s.venue})` : ''
              return `${s.code}${venueText}`
            }).join(' / ')
            row.push(cellContent)
          } else {
            row.push('')
          }
        })
        timetableData.push(row)
      })

      const ws1 = XLSX.utils.aoa_to_sheet(timetableData)
      XLSX.utils.book_append_sheet(wb, ws1, 'Timetable')

      // Course Details Sheet
      const courseData = [
        ['S/NO.', 'COURSE CODE', 'COURSE TITLE', 'LECTURER', 'UNITS', 'STATUS'],
        ...courseDetails.map((course, index) => [
          index + 1,
          course.code,
          course.title,
          course.lecturer,
          course.units,
          course.status
        ])
      ]

      const ws2 = XLSX.utils.aoa_to_sheet(courseData)
      XLSX.utils.book_append_sheet(wb, ws2, 'Course Details')

      const date = new Date().toISOString().split('T')[0]
      XLSX.writeFile(wb, `timetable_${date}.xlsx`)

      toast({
        title: "Export Successful",
        description: `Timetable exported as XLSX (${allSchedules.length} schedules)`,
      })
    } catch (error) {
      console.error('XLSX export failed:', error)
      toast({
        title: "Export Error",
        description: "An error occurred while exporting XLSX",
        variant: "destructive",
      })
    }
  }

  // Export as CSV
  const exportAsCSV = async () => {
    try {
      toast({
        title: "Preparing Export",
        description: "Fetching all schedules...",
      })

      const allSchedules = await fetchAllSchedulesForExport()
      
      if (!allSchedules || allSchedules.length === 0) {
        toast({
          title: "No Schedules",
          description: "There are no schedules to export",
          variant: "destructive",
        })
        return
      }

      // Build grid with all schedules
      const timeSlots = getTimeSlots(allSchedules)
      const grid: Record<string, Record<string, { code: string; venue: string; type?: string }[]>> = {}

      dayOptions.forEach(day => {
        grid[day.value] = {}
        timeSlots.forEach(timeSlot => {
          grid[day.value][timeSlot] = []
        })
      })

      allSchedules.forEach(schedule => {
        const day = schedule.dayOfWeek
        const timeSlot = `${schedule.startTime}-${schedule.endTime}`
        const courseCode = schedule.course?.code || 'N/A'
        const venue = schedule.venue
        const type = schedule.type

        if (!grid[day]) grid[day] = {}
        if (!grid[day][timeSlot]) grid[day][timeSlot] = []
        
        grid[day][timeSlot].push({ code: courseCode, venue, type })
      })

      // Build course details
      const courseMap = new Map<string, {
        code: string
        title: string
        lecturer: string
        units: number
        status: string
      }>()

      allSchedules.forEach(schedule => {
        if (!schedule.course) return
        const code = schedule.course.code
        if (!courseMap.has(code)) {
          // Get lecturer name from lecturer object, or use lecturerEmail, or fallback to N/A
          let lecturerName = 'N/A'
          if (schedule.course.lecturer?.name) {
            lecturerName = schedule.course.lecturer.name
          } else if (schedule.course.lecturerEmail) {
            lecturerName = schedule.course.lecturerEmail
          }
          
          courseMap.set(code, {
            code,
            title: schedule.course.name,
            lecturer: lecturerName,
            units: schedule.course.credits,
            status: 'C'
          })
        }
      })

      const courseDetails = Array.from(courseMap.values()).sort((a, b) => a.code.localeCompare(b.code))

      let csvContent = ''

      // Timetable Grid
      csvContent += 'TIMETABLE\n'
      const timeHeaders = ['Day', ...timeSlots.map(ts => {
        const [start, end] = ts.split('-')
        return formatTimeSlot(start, end)
      })]
      csvContent += timeHeaders.map(h => `"${h}"`).join(',') + '\n'

      dayOptions.forEach(day => {
        const row: string[] = [day.shortLabel || day.label]
        timeSlots.forEach(timeSlot => {
          const schedules = grid[day.value]?.[timeSlot] || []
          if (schedules.length > 0) {
            const cellContent = schedules.map(s => {
              const venueText = s.venue ? ` (${s.venue})` : ''
              return `${s.code}${venueText}`
            }).join(' / ')
            row.push(cellContent)
          } else {
            row.push('')
          }
        })
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n'
      })

      csvContent += '\n\nCOURSE DETAILS\n'
      csvContent += '"S/NO.","COURSE CODE","COURSE TITLE","LECTURER","UNITS","STATUS"\n'
      courseDetails.forEach((course, index) => {
        csvContent += `"${index + 1}","${course.code}","${course.title}","${course.lecturer}","${course.units}","${course.status}"\n`
      })

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const date = new Date().toISOString().split('T')[0]
      link.download = `timetable_${date}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: `Timetable exported as CSV (${allSchedules.length} schedules)`,
      })
    } catch (error) {
      console.error('CSV export failed:', error)
      toast({
        title: "Export Error",
        description: "An error occurred while exporting CSV",
        variant: "destructive",
      })
    }
  }

  // Export as PNG
  const exportAsPNG = async () => {
    try {
      toast({
        title: "Preparing Export",
        description: "Fetching all schedules...",
      })

      const allSchedules = await fetchAllSchedulesForExport()
      
      if (!allSchedules || allSchedules.length === 0) {
        toast({
          title: "No Schedules",
          description: "There are no schedules to export",
          variant: "destructive",
        })
        return
      }

      // Create a temporary container for the export
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.width = '1200px'
      container.style.backgroundColor = 'white'
      container.style.padding = '20px'
      document.body.appendChild(container)

      // Build grid with all schedules
      const timeSlots = getTimeSlots(allSchedules)
      const grid: Record<string, Record<string, { code: string; venue: string; type?: string }[]>> = {}

      dayOptions.forEach(day => {
        grid[day.value] = {}
        timeSlots.forEach(timeSlot => {
          grid[day.value][timeSlot] = []
        })
      })

      allSchedules.forEach(schedule => {
        const day = schedule.dayOfWeek
        const timeSlot = `${schedule.startTime}-${schedule.endTime}`
        const courseCode = schedule.course?.code || 'N/A'
        const venue = schedule.venue
        const type = schedule.type

        if (!grid[day]) grid[day] = {}
        if (!grid[day][timeSlot]) grid[day][timeSlot] = []
        
        grid[day][timeSlot].push({ code: courseCode, venue, type })
      })

      // Build course details
      const courseMap = new Map<string, {
        code: string
        title: string
        lecturer: string
        units: number
        status: string
      }>()

      allSchedules.forEach(schedule => {
        if (!schedule.course) return
        const code = schedule.course.code
        if (!courseMap.has(code)) {
          // Get lecturer name from lecturer object, or use lecturerEmail, or fallback to N/A
          let lecturerName = 'N/A'
          if (schedule.course.lecturer?.name) {
            lecturerName = schedule.course.lecturer.name
          } else if (schedule.course.lecturerEmail) {
            lecturerName = schedule.course.lecturerEmail
          }
          
          courseMap.set(code, {
            code,
            title: schedule.course.name,
            lecturer: lecturerName,
            units: schedule.course.credits,
            status: 'C'
          })
        }
      })

      const courseDetails = Array.from(courseMap.values()).sort((a, b) => a.code.localeCompare(b.code))

      // Create timetable table
      let html = `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="text-align: center; margin-bottom: 20px;">ACADEMIC TIMETABLE</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 10px;">
            <thead>
              <tr style="background-color: #4285F4; color: white;">
                <th style="border: 1px solid #000; padding: 8px; text-align: left;">Day</th>
                ${timeSlots.map(ts => {
                  const [start, end] = ts.split('-')
                  return `<th style="border: 1px solid #000; padding: 8px; text-align: center;">${formatTimeSlot(start, end)}</th>`
                }).join('')}
              </tr>
            </thead>
            <tbody>
              ${dayOptions.map(day => `
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">${day.shortLabel || day.label}</td>
                  ${timeSlots.map(timeSlot => {
                    const schedules = grid[day.value]?.[timeSlot] || []
                    const cellContent = schedules.length > 0
                      ? schedules.map(s => {
                          const venueText = s.venue ? ` (${s.venue})` : ''
                          return `${s.code}${venueText}`
                        }).join(' / ')
                      : ''
                    return `<td style="border: 1px solid #000; padding: 8px; text-align: center;">${cellContent}</td>`
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2 style="text-align: center; margin-bottom: 20px;">COURSE DETAILS</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="background-color: #4285F4; color: white;">
                <th style="border: 1px solid #000; padding: 8px;">S/NO.</th>
                <th style="border: 1px solid #000; padding: 8px;">COURSE CODE</th>
                <th style="border: 1px solid #000; padding: 8px;">COURSE TITLE</th>
                <th style="border: 1px solid #000; padding: 8px;">LECTURER</th>
                <th style="border: 1px solid #000; padding: 8px;">UNITS</th>
                <th style="border: 1px solid #000; padding: 8px;">STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${courseDetails.map((course, index) => `
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; text-align: center;">${index + 1}</td>
                  <td style="border: 1px solid #000; padding: 8px;">${course.code}</td>
                  <td style="border: 1px solid #000; padding: 8px;">${course.title}</td>
                  <td style="border: 1px solid #000; padding: 8px;">${course.lecturer}</td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: center;">${course.units}</td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: center;">${course.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `

      container.innerHTML = html

      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = imgData
      const date = new Date().toISOString().split('T')[0]
      link.download = `timetable_${date}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      document.body.removeChild(container)

      toast({
        title: "Export Successful",
        description: `Timetable exported as PNG (${allSchedules.length} schedules)`,
      })
    } catch (error) {
      console.error('PNG export failed:', error)
      toast({
        title: "Export Error",
        description: "An error occurred while exporting PNG",
        variant: "destructive",
      })
    }
  }

  const getClassTypeBadgeColor = (type: ClassType) => {
    switch (type) {
      case ClassType.LECTURE: return 'bg-blue-100 text-blue-800'
      case ClassType.SEMINAR: return 'bg-green-100 text-green-800'
      case ClassType.LAB: return 'bg-purple-100 text-purple-800'
      case ClassType.TUTORIAL: return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes} ${ampm}`
    } catch {
      return time
    }
  }

  // Group schedules by day
  const schedulesByDay = filteredSchedules.reduce((acc, schedule) => {
    const day = schedule.dayOfWeek
    if (!acc[day]) acc[day] = []
    acc[day].push(schedule)
    return acc
  }, {} as Record<string, Schedule[]>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0">
                <Calendar className="h-8 w-8 md:h-10 md:w-10 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Academic Timetable
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  View your class schedules organized by day with detailed time and venue information
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8 border-2 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Filter className="h-5 w-5 text-primary" />
              </div>
              Filter Timetable
            </CardTitle>
            <CardDescription>
              Refine your schedule view by department, level, or day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search schedules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.code} value={dept.code}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {levelOptions.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger>
                  <SelectValue placeholder="All Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {dayOptions.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="All Semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {semesterOptions.map((semester) => (
                    <SelectItem key={semester.value} value={semester.value}>
                      {semester.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isAuthenticated && isStaff && (
                <>
                  <Button variant="outline" onClick={handleDownloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Template
                  </Button>

                  <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Bulk Upload
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Bulk Upload Schedules</DialogTitle>
                        <DialogDescription>
                          Upload a CSV file to create multiple schedules at once
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              {selectedFile ? selectedFile.name : 'Select a CSV file'}
                            </p>
                            <Input
                              type="file"
                              accept=".csv"
                              onChange={handleFileSelect}
                              className="cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>• CSV file should contain columns: courseCode, dayOfWeek, startTime, endTime, venue, type</p>
                          <p>• Download the template for the correct format</p>
                          <p>• Maximum file size: 5MB</p>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsUploadDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleBulkUpload}
                          disabled={!selectedFile || isUploading}
                        >
                          {isUploading ? 'Uploading...' : 'Upload'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button variant="default" onClick={() => router.push('/schedule/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Schedule
                  </Button>
                </>
              )}

              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Content */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredSchedules.length} of {schedules.length} schedules
              </p>
              {filteredSchedules.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="default"
                      className="flex items-center gap-2"
                    >
                      <FileDown className="h-4 w-4" />
                      Export Timetable
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={exportAsPDF} className="cursor-pointer">
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportAsXLSX} className="cursor-pointer">
                      <FileText className="h-4 w-4 mr-2" />
                      Export as XLSX
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportAsCSV} className="cursor-pointer">
                      <FileText className="h-4 w-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportAsPNG} className="cursor-pointer">
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PNG
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {Object.keys(schedulesByDay).length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="p-4 bg-muted/50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <Calendar className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No schedules found</h3>
                  <p className="text-muted-foreground mb-4">
                    We couldn&apos;t find any schedules matching your search criteria
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters or search terms
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {dayOptions.map((dayOption) => {
                  const daySchedules = schedulesByDay[dayOption.value]
                  if (!daySchedules || daySchedules.length === 0) return null

                  return (
                    <Card key={dayOption.value} className="border-2 shadow-sm">
                      <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-2xl font-bold">{dayOption.label}</CardTitle>
                            <CardDescription className="text-base mt-1">
                              {daySchedules.length} class{daySchedules.length !== 1 ? 'es' : ''} scheduled for this day
                            </CardDescription>
                          </div>
                          <div className="p-3 bg-primary/10 rounded-xl">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {daySchedules
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((schedule) => (
                              <Card 
                                key={schedule.id} 
                                className="border-l-4 border-l-primary hover:shadow-lg transition-all group"
                              >
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge className={getClassTypeBadgeColor(schedule.type)}>
                                          {schedule.type}
                                        </Badge>
                                        <Badge variant="outline" className="font-mono text-xs">
                                          {schedule.course?.code}
                                        </Badge>
                                      </div>
                                      <CardTitle className="text-base font-semibold leading-tight">
                                        {schedule.course?.name}
                                      </CardTitle>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-3 border-t">
                                  <div className="flex items-center gap-2 text-sm">
                                    <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-muted-foreground">
                                      <span className="font-semibold text-foreground">
                                        {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                      </span>
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 text-sm">
                                    <div className="p-1.5 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                      <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="text-muted-foreground">
                                      <span className="font-semibold text-foreground">{schedule.venue}</span>
                                    </span>
                                  </div>

                                  {schedule.course && (
                                    <div className="flex items-center gap-2 text-sm">
                                      <div className="p-1.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                                        <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                      </div>
                                      <span className="text-muted-foreground">
                                        <span className="font-semibold text-foreground">{schedule.course.credits}</span> Credits
                                      </span>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {[...Array(Math.min(5, totalPages))].map((_, index) => {
                    const page = index + 1
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
