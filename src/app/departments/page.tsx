'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  Building2,
  Search,
  BookOpen,
  Users,
  RefreshCw,
  GraduationCap,
  Upload,
  Download,
  FileText,
  Plus,
  Clock
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { getItemsFromResponse } from '@/lib/utils'
import { Department } from '@/types'

export default function DepartmentsPage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isLecturer } = useAuth()
  const { toast } = useToast()

  // Check if user is staff (admin or lecturer)
  const isStaff = isAdmin || isLecturer
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.getDepartments({
        page: currentPage,
        limit: 12,
      })
      const result = getItemsFromResponse(response)
      if (result) {
        setDepartments(result.items)
        setTotalPages(result.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

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
      const response = await apiClient.uploadDepartmentsBulk(selectedFile)

      if (response.success) {
        toast({
          title: "Upload Successful",
          description: "Departments have been uploaded successfully",
        })
        setIsUploadDialogOpen(false)
        setSelectedFile(null)
        fetchDepartments()
      } else {
        toast({
          title: "Upload Failed",
          description: response.error || "Failed to upload departments",
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
      const response = await apiClient.getDepartmentsBulkTemplate()
      if (response.success && typeof response.data === 'string') {
        const blob = new Blob([response.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'departments_template.csv'
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

  const filteredDepartments = departments.filter(department =>
    department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleReset = () => {
    setSearchTerm('')
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl flex-shrink-0">
                <Building2 className="h-8 w-8 md:h-10 md:w-10 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Academic Departments
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  Explore departments and discover their course offerings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 border-2 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Search className="h-5 w-5 text-primary" />
              </div>
              Search Departments
            </CardTitle>
            <CardDescription>
              Find departments by name or code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                {isAuthenticated && isAdmin && (
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
                          <DialogTitle>Bulk Upload Departments</DialogTitle>
                          <DialogDescription>
                            Upload a CSV file to create multiple departments at once
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
                            <p>• CSV file should contain columns: name, code</p>
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

                    <Button variant="default" onClick={() => router.push('/departments/create')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Department
                    </Button>
                  </>
                )}

                <Button variant="outline" onClick={handleReset}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Departments Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-base font-medium text-muted-foreground">
                Showing <span className="text-foreground font-semibold">{filteredDepartments.length}</span> of{' '}
                <span className="text-foreground font-semibold">{departments.length}</span> departments
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDepartments.map((department) => (
                <Card 
                  key={department.id} 
                  className="transition-all hover:shadow-xl hover:scale-[1.02] border-2 hover:border-primary/20 group cursor-pointer"
                  onClick={() => router.push(`/departments/${department.code}`)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <Badge variant="outline" className="font-mono text-xs mb-2">
                          {department.code}
                        </Badge>
                        <CardTitle className="text-xl font-semibold leading-tight">
                          {department.name}
                        </CardTitle>
                      </div>
                      <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Building2 className="h-7 w-7 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 pt-3 border-t">
                      {(department as { _count?: { courses: number } })._count && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                            <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-muted-foreground">
                            <span className="font-semibold text-foreground">{(department as { _count?: { courses: number } })._count!.courses}</span> Course{(department as { _count?: { courses: number } })._count!.courses !== 1 ? 's' : ''} Available
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-sm">
                        <div className="p-1.5 bg-green-50 dark:bg-green-950/30 rounded-lg">
                          <GraduationCap className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-muted-foreground">Academic Department</span>
                      </div>

                      {department.createdAt && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="p-1.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                            <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="text-muted-foreground">
                            Established <span className="font-semibold text-foreground">{new Date(department.createdAt).getFullYear()}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredDepartments.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No departments found matching your search</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your search terms
                  </p>
                </CardContent>
              </Card>
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
