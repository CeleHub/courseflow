'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
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

  const logout = useCallback(() => {
    setUser(null)
    apiClient.setToken(null)
    localStorage.removeItem('user')
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    })
  }, [toast])

  useEffect(() => {
    // Check if user is logged in on mount and validate token
    const validateToken = async () => {
      const token = apiClient.getToken()
      if (token) {
        try {
          // Validate token with backend
          const response = await apiClient.getCurrentUser()
          if (response.success && response.data) {
            setUser(response.data as User)
            // Update localStorage with fresh user data
            localStorage.setItem('user', JSON.stringify(response.data))
          } else {
            // Token is invalid, clear it
            logout()
          }
        } catch (error) {
          console.error('Token validation failed:', error)
          logout()
        }
      }
      setLoading(false)
    }

    validateToken()
  }, [logout])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      const response = await apiClient.login(email, password)

      if (response.success && response.data) {
        const authData = response.data as AuthResponse
        setUser(authData.user)
        apiClient.setToken(authData.access_token)

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
        apiClient.setToken(authData.access_token)

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
