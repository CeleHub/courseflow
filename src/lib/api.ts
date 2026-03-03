import {
  ApiResponse,
  PaginatedResponse,
  CreateAcademicSessionData,
  UpdateAcademicSessionData,
  CreateExamData,
  UpdateExamData,
  CreateDepartmentData,
  UpdateDepartmentData,
  CreateCourseData,
  UpdateCourseData,
  CreateScheduleData,
  UpdateScheduleData,
  CreateComplaintData,
  CreateVerificationCodeData,
  RegisterData,
  UserFilterParams,
  CourseFilterParams,
  ScheduleFilterParams,
  DepartmentFilterParams,
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
    // Auth responses (login / register)
    if (data.user && data.access_token) {
      return { success: true, data, timestamp: new Date().toISOString() };
    }

    // Paginated responses { data: [...], total, page, limit, totalPages }
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
              hasNext: (data.page || 1) < (data.totalPages || 1),
              hasPrev: (data.page || 1) > 1,
            },
          },
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Plain array responses
    if (Array.isArray(data)) {
      return { success: true, data, timestamp: new Date().toISOString() };
    }

    // Already a normalized { success, data, ... } envelope
    if (data.success !== undefined) return data;

    // Fallback
    return { success: true, data, timestamp: new Date().toISOString() };
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

    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    try {
      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Backend sends { message: string | string[] } on errors
        const message = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message || errorData.error || `HTTP ${response.status}`;
        return {
          success: false,
          error: message,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();
      return this.normalizeResponse(data, endpoint);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
        statusCode: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async uploadFile(
    endpoint: string,
    file: File
  ): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        body: formData,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message || errorData.error || "Upload failed";
        return {
          success: false,
          error: message,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();
      return this.normalizeResponse(data, endpoint);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
        statusCode: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async downloadFile(endpoint: string): Promise<ApiResponse<string>> {
    const headers: Record<string, string> = {};
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: await response.text(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
        statusCode: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private buildQuery(params?: Record<string, any>): string {
    if (!params) return "";
    // Drop undefined / null values so they don't appear as "key=undefined"
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    );
    const qs = new URLSearchParams(clean as any).toString();
    return qs ? `?${qs}` : "";
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  register(data: RegisterData) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getCurrentUser() {
    return this.request("/auth/me");
  }

  forgotPassword(email: string) {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  resetPassword(token: string, newPassword: string) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // ─── Verification Codes ────────────────────────────────────────────────────

  getVerificationCodes() {
    return this.request<any[]>("/auth/verification-codes");
  }

  createVerificationCode(data: CreateVerificationCodeData) {
    return this.request("/auth/verification-codes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateVerificationCode(
    id: string,
    data: Partial<CreateVerificationCodeData> & { isActive?: boolean }
  ) {
    return this.request(`/auth/verification-codes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteVerificationCode(id: string) {
    return this.request(`/auth/verification-codes/${id}`, {
      method: "DELETE",
    });
  }

  // ─── Users ─────────────────────────────────────────────────────────────────
  //
  // One endpoint covers ALL roles.
  // To get lecturers:  getUsers({ role: Role.LECTURER })
  // To get HODs:       getUsers({ role: Role.HOD })
  // To get students:   getUsers({ role: Role.STUDENT })
  // No separate /lecturers route exists anymore.

  getUsers(params?: UserFilterParams) {
    return this.request<PaginatedResponse<any>>(
      `/users${this.buildQuery(params)}`
    );
  }

  getUserById(id: string) {
    return this.request(`/users/${id}`);
  }

  updateUser(id: string, data: Partial<{
    name: string;
    phone: string;
    departmentCode: string;
    role: string;
    isActive: boolean;
  }>) {
    return this.request(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteUser(id: string) {
    return this.request(`/users/${id}`, { method: "DELETE" });
  }

  // ─── Lecturer self-service (must be authenticated as LECTURER / HOD) ───────

  getLecturerDashboard() {
    return this.request("/users/me/dashboard");
  }

  getLecturerCourses() {
    return this.request("/users/me/courses");
  }

  getLecturerSchedule() {
    return this.request("/users/me/schedule");
  }

  // ─── Departments ───────────────────────────────────────────────────────────

  getDepartments(params?: DepartmentFilterParams) {
    return this.request<PaginatedResponse<any>>(
      `/departments${this.buildQuery(params)}`
    );
  }

  getDepartmentByCode(code: string) {
    return this.request(`/departments/${code}`);
  }

  getDepartmentFullDetails(code: string) {
    return this.request(`/departments/${code}/full-details`);
  }

  getDepartmentStatistics() {
    return this.request("/departments/statistics");
  }

  createDepartment(data: CreateDepartmentData) {
    // data.hodId is a User ID string — NOT an email
    return this.request("/departments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateDepartment(code: string, data: UpdateDepartmentData) {
    return this.request(`/departments/${code}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteDepartment(code: string) {
    return this.request(`/departments/${code}`, { method: "DELETE" });
  }

  getDepartmentsBulkTemplate() {
    return this.downloadFile("/departments/bulk/template");
  }

  uploadDepartmentsBulk(file: File) {
    return this.uploadFile("/departments/bulk/upload", file);
  }

  // ─── Courses ───────────────────────────────────────────────────────────────

  getCourses(params?: CourseFilterParams) {
    // Note: filter by lecturer uses lecturerId (User ID), not lecturerEmail
    return this.request<PaginatedResponse<any>>(
      `/courses${this.buildQuery(params)}`
    );
  }

  getCourseByCode(code: string) {
    return this.request(`/courses/${code}`);
  }

  getCoursesWithoutSchedules() {
    return this.request("/courses/without-schedules");
  }

  getCourseStatistics() {
    return this.request("/courses/statistics");
  }

  createCourse(data: CreateCourseData) {
    // data.lecturerId is a User ID — NOT an email
    return this.request("/courses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateCourse(code: string, data: UpdateCourseData) {
    return this.request(`/courses/${code}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteCourse(code: string) {
    return this.request(`/courses/${code}`, { method: "DELETE" });
  }

  getCoursesBulkTemplate() {
    return this.downloadFile("/courses/bulk/template");
  }

  uploadCoursesBulk(file: File) {
    // CSV column is still "lecturerEmail" — backend resolves to ID internally
    return this.uploadFile("/courses/bulk/upload", file);
  }

  // ─── Schedules ─────────────────────────────────────────────────────────────

  getSchedules(params?: ScheduleFilterParams) {
    return this.request<PaginatedResponse<any>>(
      `/schedules${this.buildQuery(params)}`
    );
  }

  getScheduleById(id: string) {
    return this.request(`/schedules/${id}`);
  }

  getScheduleStatistics() {
    return this.request("/schedules/statistics");
  }

  createSchedule(data: CreateScheduleData) {
    // venue is a VenueType enum string — NOT a venue id
    // there is no `type` field
    return this.request("/schedules", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateSchedule(id: string, data: UpdateScheduleData) {
    return this.request(`/schedules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteSchedule(id: string) {
    return this.request(`/schedules/${id}`, { method: "DELETE" });
  }

  getSchedulesBulkTemplate() {
    return this.downloadFile("/schedules/bulk/template");
  }

  uploadSchedulesBulk(file: File) {
    return this.uploadFile("/schedules/bulk/upload", file);
  }

  // ─── Academic Sessions ─────────────────────────────────────────────────────

  getAcademicSessions(params?: { page?: number; limit?: number }) {
    return this.request<PaginatedResponse<any>>(
      `/academic-sessions${this.buildQuery(params)}`
    );
  }

  getAcademicSessionById(id: string) {
    return this.request(`/academic-sessions/${id}`);
  }

  getActiveAcademicSession() {
    return this.request("/academic-sessions/active");
  }

  getSessionStatistics(id: string) {
    return this.request(`/academic-sessions/${id}/statistics`);
  }

  createAcademicSession(data: CreateAcademicSessionData) {
    return this.request("/academic-sessions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateAcademicSession(id: string, data: UpdateAcademicSessionData) {
    return this.request(`/academic-sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  activateAcademicSession(id: string) {
    return this.request(`/academic-sessions/${id}/activate`, {
      method: "PATCH",
    });
  }

  archiveAcademicSession(id: string) {
    return this.request(`/academic-sessions/${id}/archive`, {
      method: "PATCH",
    });
  }

  deleteAcademicSession(id: string) {
    return this.request(`/academic-sessions/${id}`, { method: "DELETE" });
  }

  // ─── Exams ─────────────────────────────────────────────────────────────────

  getExams(params?: { page?: number; limit?: number }) {
    return this.request<PaginatedResponse<any>>(
      `/exams${this.buildQuery(params)}`
    );
  }

  getExamById(id: string) {
    return this.request(`/exams/${id}`);
  }

  createExam(data: CreateExamData) {
    // venue   → VenueType enum string (e.g. "LECTURE_HALL_1"), NOT a venue id
    // no venueId field exists
    return this.request("/exams", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateExam(id: string, data: UpdateExamData) {
    return this.request(`/exams/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  deleteExam(id: string) {
    return this.request(`/exams/${id}`, { method: "DELETE" });
  }

  // ─── Complaints ────────────────────────────────────────────────────────────

  getComplaints(params?: {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: string;
  }) {
    return this.request<PaginatedResponse<any>>(
      `/complaints${this.buildQuery(params)}`
    );
  }

  getMyComplaints() {
    return this.request("/complaints/my-complaints");
  }

  getPendingComplaints() {
    return this.request("/complaints/pending");
  }

  getResolvedComplaints() {
    return this.request("/complaints/resolved");
  }

  createComplaint(data: CreateComplaintData) {
    return this.request("/complaints", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * status must be one of: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
   */
  updateComplaintStatus(id: string, status: string) {
    return this.request(`/complaints/${id}/status?status=${status}`, {
      method: "PATCH",
    });
  }

  // ─── Health ────────────────────────────────────────────────────────────────

  healthCheck() {
    return this.request("/health");
  }

  simpleHealthCheck() {
    return this.request("/health/simple");
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
