'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Shield,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Calendar,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { VerificationCode, Role } from '@/types'
import { useToast } from '@/hooks/use-toast'

export default function AdminVerificationCodesPage() {
  const { isAuthenticated, isAdmin } = useAuth()
  const { toast } = useToast()
  const [codes, setCodes] = useState<VerificationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newCode, setNewCode] = useState({
    code: '',
    role: Role.STUDENT,
    expiresAt: '',
    maxUsage: 1
  })

  const fetchVerificationCodes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.getVerificationCodes()

      if (response.success && response.data) {
        setCodes(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch verification codes:', error)
      toast({
        title: "Error",
        description: "Failed to fetch verification codes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchVerificationCodes()
    }
  }, [isAuthenticated, isAdmin, fetchVerificationCodes])

  const handleCreateCode = async () => {
    if (!newCode.code.trim()) {
      toast({
        title: "Error",
        description: "Please enter a verification code",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreating(true)
      const codeData = {
        ...newCode,
        expiresAt: newCode.expiresAt || undefined,
        maxUsage: newCode.maxUsage || undefined
      }

      const response = await apiClient.createVerificationCode(codeData)

      if (response.success) {
        toast({
          title: "Success",
          description: "Verification code created successfully",
        })
        setIsCreateDialogOpen(false)
        setNewCode({
          code: '',
          role: Role.STUDENT,
          expiresAt: '',
          maxUsage: 1
        })
        fetchVerificationCodes()
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create verification code",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to create verification code:', error)
      toast({
        title: "Error",
        description: "Failed to create verification code",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this verification code?')) {
      return
    }

    try {
      const response = await apiClient.deleteVerificationCode(id)

      if (response.success) {
        toast({
          title: "Success",
          description: "Verification code deleted successfully",
        })
        fetchVerificationCodes()
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete verification code",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to delete verification code:', error)
      toast({
        title: "Error",
        description: "Failed to delete verification code",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await apiClient.updateVerificationCode(id, {
        isActive: !currentStatus
      })

      if (response.success) {
        toast({
          title: "Success",
          description: `Verification code ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        })
        fetchVerificationCodes()
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update verification code",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to update verification code:', error)
      toast({
        title: "Error",
        description: "Failed to update verification code",
        variant: "destructive",
      })
    }
  }

  const generateRandomCode = () => {
    const rolePrefix = newCode.role.toUpperCase()
    const year = new Date().getFullYear()
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${rolePrefix}-${year}-${randomString}`
  }

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return 'destructive'
      case Role.LECTURER:
        return 'default'
      case Role.STUDENT:
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card>
            <CardContent className="text-center py-12">
              <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You need admin privileges to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Verification Codes</h1>
              <p className="text-muted-foreground">
                Manage verification codes for lecturer and admin registration
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={fetchVerificationCodes} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Code
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Verification Code</DialogTitle>
                    <DialogDescription>
                      Generate a new verification code for user registration
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Verification Code</Label>
                      <div className="flex gap-2">
                        <Input
                          id="code"
                          value={newCode.code}
                          onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value }))}
                          placeholder="Enter verification code"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setNewCode(prev => ({ ...prev, code: generateRandomCode() }))}
                        >
                          Generate
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select 
                        value={newCode.role} 
                        onValueChange={(value: Role) => setNewCode(prev => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={Role.LECTURER}>Lecturer</SelectItem>
                          <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxUsage">Max Usage (optional)</Label>
                      <Input
                        id="maxUsage"
                        type="number"
                        min="1"
                        value={newCode.maxUsage}
                        onChange={(e) => setNewCode(prev => ({ ...prev, maxUsage: parseInt(e.target.value) || 1 }))}
                        placeholder="Maximum number of uses"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiresAt">Expires At (optional)</Label>
                      <Input
                        id="expiresAt"
                        type="datetime-local"
                        value={newCode.expiresAt}
                        onChange={(e) => setNewCode(prev => ({ ...prev, expiresAt: e.target.value }))}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateCode} disabled={isCreating}>
                      {isCreating ? 'Creating...' : 'Create Code'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{codes.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {codes.filter(code => code.isActive && !isExpired(code.expiresAt || '')).length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expired Codes</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {codes.filter(code => isExpired(code.expiresAt || '')).length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {codes.reduce((total, code) => total + code.usageCount, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Verification Codes Table */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Codes</CardTitle>
              <CardDescription>
                Manage verification codes for secure user registration
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : codes.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No verification codes found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell className="font-medium">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {code.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeColor(code.role)}>
                            {code.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {code.usageCount}
                            {code.maxUsage && ` / ${code.maxUsage}`}
                          </span>
                        </TableCell>
                        <TableCell>
                          {code.expiresAt ? (
                            <span className={`text-sm ${isExpired(code.expiresAt) ? 'text-red-600' : ''}`}>
                              {formatDate(code.expiresAt)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            !code.isActive ? 'destructive' :
                            isExpired(code.expiresAt || '') ? 'secondary' :
                            'default'
                          }>
                            {!code.isActive ? 'Inactive' :
                             isExpired(code.expiresAt || '') ? 'Expired' :
                             'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {code.createdAt && (
                            <span className="text-sm text-muted-foreground">
                              {formatDate(code.createdAt)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(code.id, code.isActive)}
                            >
                              {code.isActive ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCode(code.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
