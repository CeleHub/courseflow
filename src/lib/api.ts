import { ApiResponse, PaginatedResponse, ArrayResponse } from '@/types'

//const API_BASE_URL = 'http://localhost:3001/api/v1'

const API_BASE_URL = 'https://courseflow-backend-s16i.onrender.com/api/v1'

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token')
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    }
  }

  getToken(): string | null {
    return this.token
  }

  private normalizeResponse(data: any, endpoint: string): ApiResponse<any> {
    // For direct auth responses (login, register)
    if (data.user && data.access_token) {
      return {
        success: true,
        data: data,
        timestamp: new Date().toISOString()
      }
    }

    // For verification codes endpoint (returns array directly)
    if (endpoint.includes('/verification-codes') && Array.isArray(data)) {
      return {
        success: true,
        data: data,
        timestamp: new Date().toISOString()
      }
    }

    // For paginated responses from backend
    // Backend structure: { data: [], total: number, page: number, limit: number, totalPages: number }
    if (data.data && Array.isArray(data.data) && data.total !== undefined) {
      return {
        success: true,
        data: {
          data: {
            items: data.data,
            pagination: {
              page: data.page || 1,
              limit: data.limit || 10,
              total: data.total,
              totalPages: data.totalPages || Math.ceil(data.total / (data.limit || 10)),
              hasNext: data.page < data.totalPages,
              hasPrev: data.page > 1
            }
          }
        },
        timestamp: new Date().toISOString()
      }
    }

    // For non-paginated array responses
    if (Array.isArray(data)) {
      return {
        success: true,
        data: data,
        timestamp: new Date().toISOString()
      }
    }

    // For single item responses or already normalized responses
    if (data.success !== undefined) {
      return data
    }

    // Default: wrap the data
    return {
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        }
      }

      const data = await response.json()
      return this.normalizeResponse(data, endpoint)
    } catch (error) {
      console.error('API Request Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
        statusCode: 0,
        timestamp: new Date().toISOString(),
      }
    }
  }

  async downloadFile(endpoint: string): Promise<ApiResponse<string>> {
    const url = `${this.baseURL}${endpoint}`

    const headers: Record<string, string> = {}

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        }
      }

      const fileContent = await response.text()

      return {
        success: true,
        data: fileContent,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
        statusCode: 0,
        timestamp: new Date().toISOString(),
      }
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(data: {
    matricNO: string
    email: string
    password: string
    name?: string
    role?: string
    verificationCode?: string
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getCurrentUser() {
    return this.request('/auth/me')
  }

  // Verification code endpoints
  async getVerificationCodes() {
    return this.request<any[]>('/auth/verification-codes')
  }

  async createVerificationCode(data: {
    code: string
    role: string
    expiresAt?: string
    maxUses?: number
  }) {
    return this.request('/auth/verification-codes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateVerificationCode(id: string, data: Partial<{
    code: string
    role: string
    expiresAt: string
    maxUses: number
    isActive: boolean
  }>) {
    return this.request(`/auth/verification-codes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteVerificationCode(id: string) {
    return this.request(`/auth/verification-codes/${id}`, {
      method: 'DELETE',
    })
  }

  // User management endpoints
  async getUsers(params?: { page?: number; limit?: number; orderBy?: string; orderDirection?: string }) {
    const queryString = params ? new URLSearchParams(params as any).toString() : ''
    return this.request<PaginatedResponse<any>>(`/users${queryString ? `?${queryString}` : ''}`)
  }

  // Department endpoints
  async getDepartments(params?: { page?: number; limit?: number }) {
    const queryString = params ? new URLSearchParams(params as any).toString() : ''
    return this.request<PaginatedResponse<any>>(`/departments${queryString ? `?${queryString}` : ''}`)
  }

  async createDepartment(data: { name: string; code: string }) {
    return this.request('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async uploadDepartmentsBulk(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const url = `${this.baseURL}/departments/bulk/upload`
    const headers: Record<string, string> = {}

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.message || errorData.error || 'Upload failed',
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        }
      }

      const data = await response.json()
      return this.normalizeResponse(data, '/departments/bulk/upload')
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
        statusCode: 0,
        timestamp: new Date().toISOString(),
      }
    }
  }

  async getDepartmentsBulkTemplate() {
    return this.downloadFile('/departments/bulk/template')
  }

  // Course endpoints
  async getCourses(params?: { page?: number; limit?: number; departmentCode?: string; level?: string }) {
    const queryString = params ? new URLSearchParams(params as any).toString() : ''
    return this.request<PaginatedResponse<any>>(`/courses${queryString ? `?${queryString}` : ''}`)
  }

  async createCourse(data: {
    code: string
    name: string
    level: string
    credits: number
    departmentCode: string
    lecturerEmail: string
  }) {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async uploadCoursesBulk(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const url = `${this.baseURL}/courses/bulk/upload`
    const headers: Record<string, string> = {}

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.message || errorData.error || 'Upload failed',
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        }
      }

      const data = await response.json()
      return this.normalizeResponse(data, '/courses/bulk/upload')
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
        statusCode: 0,
        timestamp: new Date().toISOString(),
      }
    }
  }

  async getCoursesBulkTemplate() {
    return this.downloadFile('/courses/bulk/template')
  }

  // Schedule endpoints
  async getSchedules(params?: {
    page?: number
    limit?: number
    courseCode?: string
    departmentCode?: string
    level?: string
    dayOfWeek?: string
  }) {
    const queryString = params ? new URLSearchParams(params as any).toString() : ''
    return this.request<PaginatedResponse<any>>(`/schedules${queryString ? `?${queryString}` : ''}`)
  }

  async createSchedule(data: {
    courseCode: string
    dayOfWeek: string
    startTime: string
    endTime: string
    venue: string
    type: string
  }) {
    return this.request('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async uploadSchedulesBulk(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const url = `${this.baseURL}/schedules/bulk/upload`
    const headers: Record<string, string> = {}

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.message || errorData.error || 'Upload failed',
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        }
      }

      const data = await response.json()
      return this.normalizeResponse(data, '/schedules/bulk/upload')
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
        statusCode: 0,
        timestamp: new Date().toISOString(),
      }
    }
  }

  async getSchedulesBulkTemplate() {
    return this.downloadFile('/schedules/bulk/template')
  }

  // Complaint endpoints
  async getComplaints(params?: { page?: number; limit?: number }) {
    const queryString = params ? new URLSearchParams(params as any).toString() : ''
    return this.request<PaginatedResponse<any>>(`/complaints${queryString ? `?${queryString}` : ''}`)
  }

  async getMyComplaints() {
    return this.request('/complaints/my-complaints')
  }

  async createComplaint(data: {
    name: string
    email: string
    department: string
    subject: string
    message: string
  }) {
    return this.request('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateComplaintStatus(id: string, status: string) {
    return this.request(`/complaints/${id}/status?status=${status}`, {
      method: 'PATCH',
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
export default apiClient
