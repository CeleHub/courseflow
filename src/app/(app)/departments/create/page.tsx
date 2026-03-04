'use client'

import { useState, useEffect } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import { Building2, ArrowLeft } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { getItemsFromResponse } from '@/lib/utils'
import { Role, User } from '@/types'

export default function CreateDepartmentPage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isLecturer, isHod } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [hodCandidates, setHodCandidates] = useState<User[]>([])
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    hodId: '',
  })

  const isStaff = isAdmin || isLecturer || isHod

  useEffect(() => {
    if (!isAuthenticated || !isStaff) {
      router.push('/login')
      return
    }

    const fetchHodCandidates = async () => {
      try {
        const [hodRes, lecturerRes] = await Promise.all([
          apiClient.getUsers({ role: Role.HOD, limit: 100 }),
          apiClient.getUsers({ role: Role.LECTURER, limit: 100 }),
        ])
        const hodResult = getItemsFromResponse<User>(hodRes)
        const lecturerResult = getItemsFromResponse<User>(lecturerRes)
        const combined = [...(hodResult?.items ?? []), ...(lecturerResult?.items ?? [])]
        setHodCandidates(combined)
      } catch (error) {
        console.error('Failed to fetch HOD candidates:', error)
      }
    }

    fetchHodCandidates()
  }, [isAuthenticated, isStaff, router])

  // Redirect if not authenticated or not staff
  if (!isAuthenticated || !isStaff) {
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
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
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        hodId: formData.hodId && formData.hodId !== "none" ? formData.hodId : undefined,
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
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    onChange={handleInputChange}
                    required
                    maxLength={10}
                    style={{ textTransform: 'uppercase' }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Short code for the department (will be converted to uppercase)
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
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="hodId">Head of Department (Optional)</Label>
                  <Select
                    value={formData.hodId}
                    onValueChange={(value) =>
                      handleSelectChange("hodId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Head of Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No HOD assigned</SelectItem>
                      {hodCandidates.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name ?? user.email} — {user.department?.name ?? user.departmentCode ?? "—"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  {loading ? 'Creating...' : 'Create Department'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
