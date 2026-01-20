import {
  ApiResponse,
  PaginatedResponse,
  CreateAcademicSessionData,
  UpdateAcademicSessionData,
  CreateVenueData,
  UpdateVenueData,
  CreateExamData,
  UpdateExamData,
} from "@/types";

const API_BASE_URL = "https://courseflow-backend-s16i.onrender.com/api/v1";

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private normalizeResponse(data: any, endpoint: string): ApiResponse<any> {
    // For direct auth responses (login, register)
    if (data.user && data.access_token) {
      return {
        success: true,
        data: data,
        timestamp: new Date().toISOString(),
      };
    }

    // For verification codes endpoint (returns array directly)
    if (endpoint.includes("/verification-codes") && Array.isArray(data)) {
      return {
        success: true,
        data: data,
        timestamp: new Date().toISOString(),
      };
    }

    // For paginated responses from backend
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
              totalPages:
                data.totalPages || Math.ceil(data.total / (data.limit || 10)),
              hasNext: data.page < data.totalPages,
              hasPrev: data.page > 1,
            },
          },
        },
        timestamp: new Date().toISOString(),
      };
    }

    // For non-paginated array responses
    if (Array.isArray(data)) {
      return {
        success: true,
        data: data,
        timestamp: new Date().toISOString(),
      };
    }

    // For single item responses or already normalized responses
    if (data.success !== undefined) {
      return data;
    }

    // Default: wrap the data
    return {
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
    };
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error:
            errorData.message ||
            errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();
      return this.normalizeResponse(data, endpoint);
    } catch (error) {
      console.error("API Request Error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
        statusCode: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async downloadFile(endpoint: string): Promise<ApiResponse<string>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error:
            errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        };
      }

      const fileContent = await response.text();
      return {
        success: true,
        data: fileContent,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
        statusCode: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    matricNO: string;
    email: string;
    password: string;
    name?: string;
    role?: string;
    verificationCode?: string;
  }) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser() {
    return this.request("/auth/me");
  }

  // Verification code endpoints
  async getVerificationCodes() {
    return this.request<any[]>("/auth/verification-codes");
  }

  async createVerificationCode(data: {
    code: string;
    role: string;
    expiresAt?: string;
    maxUses?: number;
  }) {
    return this.request("/auth/verification-codes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateVerificationCode(
    id: string,
    data: Partial<{
      code: string;
      role: string;
      expiresAt: string;
      maxUses: number;
      isActive: boolean;
    }>
  ) {
    return this.request(`/auth/verification-codes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteVerificationCode(id: string) {
    return this.request(`/auth/verification-codes/${id}`, {
      method: "DELETE",
    });
  }

  // User management endpoints - FIXED
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    orderBy?: string;
    orderDirection?: string;
  }) {
    const queryString = params
      ? new URLSearchParams(params as any).toString()
      : "";
    return this.request<PaginatedResponse<any>>(
      `/users${queryString ? `?${queryString}` : ""}`
    );
  }

  // Academic Sessions (v2.0)
  async getAcademicSessions(params?: { page?: number; limit?: number }) {
    const queryString = params
      ? new URLSearchParams(params as any).toString()
      : "";
    return this.request<PaginatedResponse<any>>(
      `/academic-sessions${queryString ? `?${queryString}` : ""}`
    );
  }

  async createAcademicSession(data: CreateAcademicSessionData) {
    return this.request("/academic-sessions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getActiveAcademicSession() {
    return this.request("/academic-sessions/active");
  }

  async activateAcademicSession(id: string) {
    return this.request(`/academic-sessions/${id}/activate`, {
      method: "PATCH",
    });
  }

  async updateAcademicSession(id: string, data: UpdateAcademicSessionData) {
    return this.request(`/academic-sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteAcademicSession(id: string) {
    return this.request(`/academic-sessions/${id}`, {
      method: "DELETE",
    });
  }

  // Department endpoints - FIXED with proper filters
  async getDepartments(params?: {
    page?: number;
    limit?: number;
    search?: string;
    orderBy?: string;
    orderDirection?: string;
  }) {
    const queryString = params
      ? new URLSearchParams(params as any).toString()
      : "";
    return this.request<PaginatedResponse<any>>(
      `/departments${queryString ? `?${queryString}` : ""}`
    );
  }

  async createDepartment(
    data: { name: string; code: string } & {
      // v2.0 optional fields
      description?: string;
      hodEmail?: string;
    }
  ) {
    return this.request("/departments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getDepartmentFullDetails(code: string) {
    return this.request(`/departments/${code}/full-details`);
  }

  async uploadDepartmentsBulk(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${this.baseURL}/departments/bulk/upload`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || errorData.error || "Upload failed",
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();
      return this.normalizeResponse(data, "/departments/bulk/upload");
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
        statusCode: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getDepartmentsBulkTemplate() {
    return this.downloadFile("/departments/bulk/template");
  }

  // Course endpoints - FIXED with lecturer support
  async getCourses(params?: {
    page?: number;
    limit?: number;
    departmentCode?: string;
    level?: string;
    search?: string;
    lecturerEmail?: string;
    // v2.0 filters
    isGeneral?: string;
    includeGeneral?: string;
    semester?: string;
    orderBy?: string;
    orderDirection?: string;
  }) {
    const queryString = params
      ? new URLSearchParams(params as any).toString()
      : "";
    return this.request<PaginatedResponse<any>>(
      `/courses${queryString ? `?${queryString}` : ""}`
    );
  }

  async createCourse(data: {
    code: string;
    name: string;
    level: string;
    credits: number;
    departmentCode: string;
    lecturerEmail?: string;
    // v2.0 extras
    overview?: string;
    isGeneral?: boolean;
    isLocked?: boolean;
  }) {
    return this.request("/courses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async uploadCoursesBulk(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${this.baseURL}/courses/bulk/upload`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || errorData.error || "Upload failed",
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();
      return this.normalizeResponse(data, "/courses/bulk/upload");
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
        statusCode: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getCoursesBulkTemplate() {
    return this.downloadFile("/courses/bulk/template");
  }

  // Schedule endpoints - FIXED
  async getSchedules(params?: {
    page?: number;
    limit?: number;
    courseCode?: string;
    departmentCode?: string;
    level?: string;
    dayOfWeek?: string;
    semester?: string;
    search?: string;
    orderBy?: string;
    orderDirection?: string;
  }) {
    const queryString = params
      ? new URLSearchParams(params as any).toString()
      : "";
    return this.request<PaginatedResponse<any>>(
      `/schedules${queryString ? `?${queryString}` : ""}`
    );
  }

  async createSchedule(data: {
    courseCode: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    venue: string;
    type: string;
  }) {
    return this.request("/schedules", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async uploadSchedulesBulk(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${this.baseURL}/schedules/bulk/upload`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || errorData.error || "Upload failed",
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();
      return this.normalizeResponse(data, "/schedules/bulk/upload");
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
        statusCode: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getSchedulesBulkTemplate() {
    return this.downloadFile("/schedules/bulk/template");
  }

  // Venues (v2.0)
  async getVenues(params?: { page?: number; limit?: number }) {
    const queryString = params
      ? new URLSearchParams(params as any).toString()
      : "";
    return this.request<PaginatedResponse<any>>(
      `/venues${queryString ? `?${queryString}` : ""}`
    );
  }

  async createVenue(data: CreateVenueData) {
    return this.request("/venues", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateVenue(id: string, data: UpdateVenueData) {
    return this.request(`/venues/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteVenue(id: string) {
    return this.request(`/venues/${id}`, {
      method: "DELETE",
    });
  }

  // Complaint endpoints - FIXED
  async getComplaints(params?: {
    page?: number;
    limit?: number;
    status?: string;
    department?: string;
    search?: string;
    orderBy?: string;
    orderDirection?: string;
  }) {
    const queryString = params
      ? new URLSearchParams(params as any).toString()
      : "";
    return this.request<PaginatedResponse<any>>(
      `/complaints${queryString ? `?${queryString}` : ""}`
    );
  }

  async getMyComplaints() {
    return this.request("/complaints/my-complaints");
  }

  async createComplaint(data: {
    name: string;
    email: string;
    department: string;
    subject: string;
    message: string;
  }) {
    return this.request("/complaints", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateComplaintStatus(id: string, status: string) {
    return this.request(`/complaints/${id}/status?status=${status}`, {
      method: "PATCH",
    });
  }

  // Exams (v2.0)
  async getExams(params?: { page?: number; limit?: number }) {
    const queryString = params
      ? new URLSearchParams(params as any).toString()
      : "";
    return this.request<PaginatedResponse<any>>(
      `/exams${queryString ? `?${queryString}` : ""}`
    );
  }

  async createExam(data: CreateExamData) {
    return this.request("/exams", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateExam(id: string, data: UpdateExamData) {
    return this.request(`/exams/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteExam(id: string) {
    return this.request(`/exams/${id}`, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
