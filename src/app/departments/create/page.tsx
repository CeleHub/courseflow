'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Building2, ArrowLeft } from 'lucide-react'
import { apiClient } from '@/lib/api'

export default function CreateDepartmentPage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isLecturer } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
  })

  const isStaff = isAdmin || isLecturer

  // Redirect if not authenticated or not staff
  if (!isAuthenticated || !isStaff) {
    router.push('/auth/login')
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        code: formData.code.trim().toUpperCase(),
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
      <Navigation />

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
