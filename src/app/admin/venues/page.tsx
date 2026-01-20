'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Users
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { Venue } from '@/types'
import { useToast } from '@/hooks/use-toast'

export default function VenuesPage() {
  const { isAuthenticated, isAdmin } = useAuth()
  const { toast } = useToast()
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    isIct: false
  })

  const fetchVenues = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.getVenues({ page: 1, limit: 100 })

      if (response.success && response.data) {
        setVenues(response.data.data?.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch venues:', error)
      toast({
        title: "Error",
        description: "Failed to fetch venues",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchVenues()
    }
  }, [isAuthenticated, isAdmin, fetchVenues])

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.capacity) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const capacity = parseInt(formData.capacity)
    if (isNaN(capacity) || capacity < 1) {
      toast({
        title: "Validation Error",
        description: "Capacity must be a positive number",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await apiClient.createVenue({
        name: formData.name.trim(),
        capacity,
        isIct: formData.isIct
      })

      if (response.success) {
        toast({
          title: "Success",
          description: "Venue created successfully",
        })
        setIsCreateDialogOpen(false)
        setFormData({ name: '', capacity: '', isIct: false })
        fetchVenues()
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create venue",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to create venue:', error)
      toast({
        title: "Error",
        description: "Failed to create venue",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async () => {
    if (!editingVenue) return

    if (!formData.name.trim() || !formData.capacity) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const capacity = parseInt(formData.capacity)
    if (isNaN(capacity) || capacity < 1) {
      toast({
        title: "Validation Error",
        description: "Capacity must be a positive number",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await apiClient.updateVenue(editingVenue.id, {
        name: formData.name.trim(),
        capacity,
        isIct: formData.isIct
      })

      if (response.success) {
        toast({
          title: "Success",
          description: "Venue updated successfully",
        })
        setIsEditDialogOpen(false)
        setEditingVenue(null)
        setFormData({ name: '', capacity: '', isIct: false })
        fetchVenues()
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update venue",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to update venue:', error)
      toast({
        title: "Error",
        description: "Failed to update venue",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this venue? This is a soft delete.')) {
      return
    }

    try {
      const response = await apiClient.deleteVenue(id)

      if (response.success) {
        toast({
          title: "Success",
          description: "Venue deleted successfully",
        })
        fetchVenues()
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete venue",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to delete venue:', error)
      toast({
        title: "Error",
        description: "Failed to delete venue",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (venue: Venue) => {
    setEditingVenue(venue)
    setFormData({
      name: venue.name,
      capacity: venue.capacity.toString(),
      isIct: venue.isIct
    })
    setIsEditDialogOpen(true)
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
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
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Building2 className="h-8 w-8" />
                Venues Management
              </h1>
              <p className="text-muted-foreground">
                Manage physical locations for classes and exams
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={fetchVenues} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Venue
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Venue</DialogTitle>
                    <DialogDescription>
                      Add a new physical location for classes and exams
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Venue Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., ICT Center Hall A"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacity *</Label>
                      <Input
                        id="capacity"
                        type="number"
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                        placeholder="e.g., 500"
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isIct"
                        checked={formData.isIct}
                        onChange={(e) => setFormData(prev => ({ ...prev, isIct: e.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="isIct" className="cursor-pointer">
                        CBT-ready (ICT Venue)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Required for 100L/General courses
                      </p>
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
                    <Button onClick={handleCreate}>
                      Create Venue
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Venues Table */}
          <Card>
            <CardHeader>
              <CardTitle>Venues</CardTitle>
              <CardDescription>
                {venues.length} venue{venues.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : venues.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No venues found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Venue Name</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>ICT Ready</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {venues.map((venue) => (
                      <TableRow key={venue.id}>
                        <TableCell className="font-medium">{venue.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {venue.capacity}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={venue.isActive ? "default" : "secondary"}>
                            {venue.isActive ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={venue.isIct ? "default" : "outline"}>
                            {venue.isIct ? "CBT-Ready" : "Standard"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(venue)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(venue.id)}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Venue</DialogTitle>
            <DialogDescription>
              Update venue information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Venue Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., ICT Center Hall A"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-capacity">Capacity *</Label>
              <Input
                id="edit-capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                placeholder="e.g., 500"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isIct"
                checked={formData.isIct}
                onChange={(e) => setFormData(prev => ({ ...prev, isIct: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="edit-isIct" className="cursor-pointer">
                CBT-ready (ICT Venue)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingVenue(null)
                setFormData({ name: '', capacity: '', isIct: false })
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate}>
              Update Venue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

