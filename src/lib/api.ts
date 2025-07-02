import { ApiResponse, PaginatedResponse, ArrayResponse } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1'

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

  private normalizeAuthResponse(response: any): ApiResponse<any> {
    // Check if this is a direct auth response (has user and access_token)
    if (response.user && response.access_token) {
      return {
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      }
    }
    // Check if this is a simple message response (forgot-password, reset-password)
    if (response.message && !response.success) {
      return {
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      }
    }
    // For health endpoints or other direct responses
    if (!response.success && !response.error) {
      return {
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      }
    }
    return response
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
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        }
      }

      const data = await response.json()
      
      // Normalize endpoints that return direct responses (not wrapped in success/data)
      if (endpoint.startsWith('/auth/login') || 
          endpoint.startsWith('/auth/register') ||
          endpoint.startsWith('/auth/forgot-password') ||
          endpoint.startsWith('/auth/reset-password') ||
          endpoint.startsWith('/health')) {
        return this.normalizeAuthResponse(data)
      }
      
      return data
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

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword: password }),
    })
  }

  // Get current authenticated user
  async getCurrentUser() {
    return this.request('/auth/me')
  }

  // Verification code endpoints
  async getVerificationCodes() {
    return this.request<any[]>('/auth/verification-codes')
  }

  async getVerificationCode(id: string) {
    return this.request(`/auth/verification-codes/${id}`)
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

  async getUserByMatricNO(matricNO: string) {
    return this.request(`/users/${matricNO}`)
  }

  async createUser(data: {
    matricNO: string
    email: string
    password: string
    name?: string
    role?: string
  }) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateUser(matricNO: string, data: Partial<{
    email: string
    name: string
    role: string
  }>) {
    return this.request(`/users/${matricNO}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteUser(matricNO: string) {
    return this.request(`/users/${matricNO}`, {
      method: 'DELETE',
    })
  }

  // Department endpoints
  async getDepartments(params?: { page?: number; limit?: number }) {
    const queryString = params ? new URLSearchParams(params as any).toString() : ''
    return this.request<PaginatedResponse<any>>(`/departments${queryString ? `?${queryString}` : ''}`)
  }

  async getDepartment(code: string) {
    return this.request(`/departments/${code}`)
  }

  async createDepartment(data: { name: string; code: string }) {
    return this.request('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateDepartment(code: string, data: Partial<{ name: string; code: string }>) {
    return this.request(`/departments/${code}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteDepartment(code: string) {
    return this.request(`/departments/${code}`, {
      method: 'DELETE',
    })
  }

  // Additional department endpoints
  async getDepartmentStatistics() {
    return this.request('/departments/statistics')
  }

  async searchDepartments(searchTerm: string) {
    return this.request(`/departments/search/${searchTerm}`)
  }

  async getDepartmentsWithCourses() {
    return this.request('/departments/with-courses')
  }

  async getDepartmentsWithoutCourses() {
    return this.request('/departments/without-courses')
  }

  async getDepartmentsWithCourseCount() {
    return this.request('/departments/with-course-count')
  }

  async getDepartmentFullDetails(code: string) {
    return this.request(`/departments/${code}/full-details`)
  }

  async uploadDepartmentsBulk(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return this.request('/departments/bulk/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    })
  }

  async getDepartmentsBulkTemplate() {
    return this.request('/departments/bulk/template')
  }

  // Course endpoints
  async getCourses(params?: { page?: number; limit?: number; departmentCode?: string; level?: string }) {
    const queryString = params ? new URLSearchParams(params as any).toString() : ''
    return this.request<PaginatedResponse<any>>(`/courses${queryString ? `?${queryString}` : ''}`)
  }

  async getCourse(code: string) {
    return this.request(`/courses/${code}`)
  }

  async createCourse(data: {
    code: string
    name: string
    level: string
    credits: number
    departmentCode: string
  }) {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCourse(code: string, data: Partial<{
    code: string
    name: string
    level: string
    credits: number
    departmentCode: string
  }>) {
    return this.request(`/courses/${code}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteCourse(code: string) {
    return this.request(`/courses/${code}`, {
      method: 'DELETE',
    })
  }

  // Additional course endpoints
  async getCoursesByDepartment(departmentCode: string) {
    return this.request(`/courses/department/${departmentCode}`)
  }

  async getCoursesByLevel(level: string) {
    return this.request(`/courses/level/${level}`)
  }

  async getCourseStatistics() {
    return this.request('/courses/statistics')
  }

  async searchCourses(searchTerm: string) {
    return this.request(`/courses/search/${searchTerm}`)
  }

  async getCoursesByCredits(minCredits: number, maxCredits: number) {
    return this.request(`/courses/credits/${minCredits}/${maxCredits}`)
  }

  async getCoursesWithoutSchedules() {
    return this.request('/courses/without-schedules')
  }

  async uploadCoursesBulk(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return this.request('/courses/bulk/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    })
  }

  async getCoursesBulkTemplate() {
    return this.request('/courses/bulk/template')
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

  async getSchedule(id: string) {
    return this.request(`/schedules/${id}`)
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

  async updateSchedule(id: string, data: Partial<{
    courseCode: string
    dayOfWeek: string
    startTime: string
    endTime: string
    venue: string
    type: string
  }>) {
    return this.request(`/schedules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteSchedule(id: string) {
    return this.request(`/schedules/${id}`, {
      method: 'DELETE',
    })
  }

  // Additional schedule endpoints
  async getSchedulesByCourse(courseCode: string) {
    return this.request(`/schedules/course/${courseCode}`)
  }

  async getSchedulesByDepartment(departmentCode: string) {
    return this.request(`/schedules/department/${departmentCode}`)
  }

  async getSchedulesByLevel(level: string) {
    return this.request(`/schedules/level/${level}`)
  }

  async getSchedulesByDay(dayOfWeek: string) {
    return this.request(`/schedules/day/${dayOfWeek}`)
  }

  async getSchedulesByVenue(venue: string) {
    return this.request(`/schedules/venue/${venue}`)
  }

  async getSchedulesByType(type: string) {
    return this.request(`/schedules/type/${type}`)
  }

  async getScheduleStatistics() {
    return this.request('/schedules/statistics')
  }

  async uploadSchedulesBulk(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return this.request('/schedules/bulk/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    })
  }

  async getSchedulesBulkTemplate() {
    return this.request('/schedules/bulk/template')
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

  // Additional complaint endpoints
  async getPendingComplaints() {
    return this.request('/complaints/pending')
  }

  async getResolvedComplaints() {
    return this.request('/complaints/resolved')
  }

  // Health check endpoints
  async healthCheck() {
    return this.request('/health')
  }

  async simpleHealthCheck() {
    return this.request('/health/simple')
  }

  async databaseHealthCheck() {
    return this.request('/health/database')
  }

  async readinessCheck() {
    return this.request('/health/readiness')
  }

  async livenessCheck() {
    return this.request('/health/liveness')
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
export default apiClient
