'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, AuthResponse } from '@/types'
import { apiClient } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (data: {
    matricNO: string
    email: string
    password: string
    name?: string
    role?: string
    verificationCode?: string
  }) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
  isLecturer: boolean
  isStudent: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is logged in on mount
    const token = apiClient.getToken()
    if (token) {
      // Validate token by making a request (you might want to add a /auth/me endpoint)
      // For now, we'll assume the token is valid if it exists
      // In a real app, you'd verify the token with the backend
      try {
        const userData = localStorage.getItem('user')
        if (userData) {
          setUser(JSON.parse(userData))
        }
      } catch (error) {
        console.error('Failed to parse user data:', error)
        logout()
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      const response = await apiClient.login(email, password)

      if (response.success && response.data) {
        const authData = response.data as AuthResponse
        setUser(authData.user)
        apiClient.setToken(authData.token)

        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(authData.user))

        toast({
          title: "Login Successful",
          description: `Welcome back, ${authData.user.name}!`,
        })

        return true
      } else {
        toast({
          title: "Login Failed",
          description: response.error || "Invalid credentials",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const register = async (data: {
    matricNO: string
    email: string
    password: string
    name?: string
    role?: string
    verificationCode?: string
  }): Promise<boolean> => {
    try {
      setLoading(true)
      const response = await apiClient.register(data)

      if (response.success && response.data) {
        const authData = response.data as AuthResponse
        setUser(authData.user)
        apiClient.setToken(authData.token)

        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(authData.user))

        toast({
          title: "Registration Successful",
          description: `Welcome to CourseFlow, ${authData.user.name}!`,
        })

        return true
      } else {
        toast({
          title: "Registration Failed",
          description: response.error || "Registration failed",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      toast({
        title: "Registration Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    apiClient.setToken(null)
    localStorage.removeItem('user')
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    })
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isLecturer: user?.role === 'LECTURER',
    isStudent: user?.role === 'STUDENT',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
