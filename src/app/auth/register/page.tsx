'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Mail, Lock, Eye, EyeOff, User, IdCard, Shield } from 'lucide-react'
import { Role } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api'
import { getItemsFromResponse } from '@/lib/utils'
import type { Department } from '@/types'

export default function RegisterPage() {
  const [formData, setFormData] = useState<{
    matricNO: string
    email: string
    password: string
    name: string
    role: Role
    verificationCode: string
    departmentCode?: string
  }>({
    matricNO: '',
    email: '',
    password: '',
    name: '',
    role: Role.STUDENT,
    verificationCode: '',
    departmentCode: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])

  const { register } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const needsDepartment = formData.role !== Role.ADMIN
  const departmentRequired = formData.role === Role.LECTURER || formData.role === Role.HOD

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await apiClient.getDepartments({ limit: 100 })
        const result = getItemsFromResponse<Department>(response)
        if (result) setDepartments(result.items)
      } catch (error) {
        console.error('Failed to fetch departments:', error)
      }
    }
    fetchDepartments()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (departmentRequired && !formData.departmentCode?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please select your department',
        variant: 'destructive',
      })
      return
    }
    setIsLoading(true)

    try {
      const payload = { ...formData }
      if (formData.role === Role.ADMIN) {
        delete payload.departmentCode
      }
      const success = await register(payload)
      if (success) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'role' && value === Role.ADMIN) {
        next.departmentCode = ''
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
              <CardDescription>
                Join CourseFlow and manage your academic journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="matricNO">Matriculation Number</Label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="matricNO"
                      type="text"
                      placeholder="Enter your matric number"
                      value={formData.matricNO}
                      onChange={(e) => handleInputChange('matricNO', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Role.STUDENT}>Student</SelectItem>
                      <SelectItem value={Role.LECTURER}>Lecturer</SelectItem>
                      <SelectItem value={Role.HOD}>HOD</SelectItem>
                      <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.role === Role.LECTURER || formData.role === Role.HOD || formData.role === Role.ADMIN) && (
                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">Verification Code</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="verificationCode"
                        type="text"
                        placeholder="Enter verification code"
                        value={formData.verificationCode}
                        onChange={(e) => handleInputChange('verificationCode', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Contact admin for {formData.role.toLowerCase()} verification code
                    </p>
                  </div>
                )}

                {needsDepartment && (
                  <div className="space-y-2">
                    <Label htmlFor="departmentCode">
                      Department {departmentRequired && <span className="text-red-500">*</span>}
                    </Label>
                    <Select
                      value={formData.departmentCode ?? ''}
                      onValueChange={(value) => handleInputChange('departmentCode', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Select department</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.code} value={dept.code}>
                            {dept.name} ({dept.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {departmentRequired
                        ? 'Required for lecturers and HODs'
                        : 'Optional for students'}
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <p className="text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
