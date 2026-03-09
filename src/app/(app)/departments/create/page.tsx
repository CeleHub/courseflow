'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext'
import { HodCombobox } from '@/components/departments/hod-combobox'
import { usePageLoadReporter } from '@/contexts/PageLoadContext'
import { useToast } from '@/hooks/use-toast'
import { Building2, ArrowLeft, Loader2 } from 'lucide-react'
import { ErrorState } from '@/components/state/error-state'
import { apiClient } from '@/lib/api'
import { College } from '@/types'

export default function CreateDepartmentPage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isLecturer, isHod } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  usePageLoadReporter(loadingData)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    college: College.CBAS,
    hodId: '',
  })

  const canCreate = isAdmin /* Only ADMIN can create departments per 0.1; HOD mutates own dept's courses/schedules only */

  useEffect(() => {
    if (!isAuthenticated || !canCreate) {
      router.replace(!isAuthenticated ? '/login' : '/dashboard')
      return
    }
  }, [isAuthenticated, canCreate, router])

  if (!isAuthenticated || !canCreate) {
    return null
  }

  if (fetchError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <ErrorState title={fetchError} onRetry={() => setFetchError(null)} />
      </div>
    )
  }

  if (loadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.code.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.createDepartment({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase().slice(0, 4),
        description: formData.description.trim() || undefined,
        college: formData.college,
        hodId: formData.hodId || undefined,
      })

      if (response.success) {
        toast({
          title: "Success",
          description: "Department created successfully",
        })
        router.push('/departments')
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create department",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Create department failed:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Create Department
          </h1>
          <p className="text-muted-foreground">
            Add a new academic department to the system
          </p>
        </div>

        {/* Form */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Department Information</CardTitle>
            <CardDescription>
              Enter the details for the new department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Department Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="e.g., Computer Science"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    maxLength={100}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Department Code *</Label>
                  <Input
                    id="code"
                    name="code"
                    type="text"
                    placeholder="e.g., CS"
                    value={formData.code}
                    onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase().slice(0, 4) }))}
                    required
                    maxLength={4}
                    className="font-mono"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    2–4 uppercase letters
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter department description..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    maxLength={1000}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>College *</Label>
                  <Select value={formData.college} onValueChange={(v) => setFormData((p) => ({ ...p, college: v as College }))} disabled={loading}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={College.CBAS}>CBAS</SelectItem>
                      <SelectItem value={College.CHMS}>CHMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Head of Department (Optional)</Label>
                  <HodCombobox
                    value={formData.hodId}
                    onChange={(v) => setFormData((p) => ({ ...p, hodId: v }))}
                    placeholder="Search by name..."
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Automatically links Head of Department to this department
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Department'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
