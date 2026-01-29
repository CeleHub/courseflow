import {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  LoginData,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
  CreateDepartmentData,
  UpdateDepartmentData,
  DepartmentFilterParams,
  CreateLecturerData,
  UpdateLecturerData,
  CreateCourseData,
  UpdateCourseData,
  CourseFilterParams,
  CreateScheduleData,
  UpdateScheduleData,
  ScheduleFilterParams,
  CreateAcademicSessionData,
  UpdateAcademicSessionData,
  CreateExamData,
  UpdateExamData,
  CreateComplaintData,
  UpdateComplaintData,
  ComplaintFilterParams,
  CreateVerificationCodeData,
  UpdateVerificationCodeData,
  BulkUploadResult,
  AuthResponse,
  User,
  Department,
  Lecturer,
  Course,
  Schedule,
  AcademicSession,
  ExamSchedule,
  Complaint,
  VerificationCode,
  DepartmentStatistics,
  CourseStatistics,
  ScheduleStatistics,
  SessionStatistics,
  LecturerDashboardStats,
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

  private buildQueryString(params?: Record<string, any>): string {
    if (!params) return "";
    const filtered = Object.entries(params).filter(
      ([_, v]) => v !== undefined && v !== null && v !== ""
    );
    if (filtered.length === 0) return "";
    return "?" + new URLSearchParams(filtered as any).toString();
  }

  private async request<T>(
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
      const response = await fetch(url, { ...options, headers });

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
      
      // Backend wraps responses in { success, data, message }
      if (data.success !== undefined) {
        return data;
      }

      // Handle direct responses (auth, arrays, etc)
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
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

  private async uploadFile<T>(
    endpoint: string,
    file: File
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
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
      return {
        success: true,
        data,
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

  private async downloadFile(endpoint: string): Promise<ApiResponse<string>> {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
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

  // ============ AUTH ============
  async login(data: LoginData) {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async register(data: RegisterData) {
    return this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser() {
    return this.request<{ data: User }>("/auth/me");
  }

  async forgotPassword(data: ForgotPasswordData) {
    return this.request<{ message: string; resetToken?: string }>(
      "/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  async resetPassword(data: ResetPasswordData) {
    return this.request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ============ VERIFICATION CODES ============
  async getVerificationCodes() {
    return this.request<VerificationCode[]>("/auth/verification-codes");
  }

  async getVerificationCode(id: string) {
    return this.request<VerificationCode>(`/auth/verification-codes/${id}`);
  }

  async createVerificationCode(data: CreateVerificationCodeData) {
    return this.request<VerificationCode>("/auth/verification-codes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateVerificationCode(id: string, data: UpdateVerificationCodeData) {
    return this.request<VerificationCode>(`/auth/verification-codes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteVerificationCode(id: string) {
    return this.request<VerificationCode>(`/auth/verification-codes/${id}`, {
      method: "DELETE",
    });
  }

  // ============ USERS ============
  async getUsers(params?: PaginationParams) {
    return this.request<PaginatedResponse<User> | User[]>(
      `/users${this.buildQueryString(params)}`
    );
  }

  async getUser(matricNO: string) {
    return this.request<User>(`/users/${matricNO}`);
  }

  async updateUser(matricNO: string, data: Partial<User>) {
    return this.request<User>(`/users/${matricNO}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteUser(matricNO: string) {
    return this.request<User>(`/users/${matricNO}`, {
      method: "DELETE",
    });
  }

  // ============ DEPARTMENTS ============
  async getDepartments(params?: DepartmentFilterParams) {
    return this.request<PaginatedResponse<Department> | Department[]>(
      `/departments${this.buildQueryString(params)}`
    );
  }

  async getDepartment(code: string) {
    return this.request<Department>(`/departments/${code}`);
  }

  async getDepartmentFullDetails(code: string) {
    return this.request<Department>(`/departments/${code}/full-details`);
  }

  async getDepartmentStatistics() {
    return this.request<DepartmentStatistics>("/departments/statistics");
  }

  async createDepartment(data: CreateDepartmentData) {
    return this.request<Department>("/departments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateDepartment(code: string, data: UpdateDepartmentData) {
    return this.request<Department>(`/departments/${code}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteDepartment(code: string) {
    return this.request<Department>(`/departments/${code}`, {
      method: "DELETE",
    });
  }

  async uploadDepartmentsBulk(file: File) {
    return this.uploadFile<BulkUploadResult<Department>>(
      "/departments/bulk/upload",
      file
    );
  }

  async getDepartmentsBulkTemplate() {
    return this.downloadFile("/departments/bulk/template");
  }

  // ============ LECTURERS ============
  async getLecturers(params?: PaginationParams) {
    return this.request<PaginatedResponse<Lecturer> | Lecturer[]>(
      `/lecturers${this.buildQueryString(params)}`
    );
  }

  async getLecturer(id: string) {
    return this.request<Lecturer>(`/lecturers/${id}`);
  }

  async getLecturersByDepartment(departmentCode: string) {
    return this.request<Lecturer[]>(`/lecturers/department/${departmentCode}`);
  }

  async searchLecturers(searchTerm: string) {
    return this.request<Lecturer[]>(`/lecturers/search/${searchTerm}`);
  }

  async getLecturerDashboard() {
    return this.request<LecturerDashboardStats>(
      "/lecturers/dashboard/stats"
    );
  }

  async getLecturerCourses() {
    return this.request<{
      lecturer: Lecturer;
      courses: Course[];
    }>("/lecturers/dashboard/my-courses");
  }

  async getLecturerSchedule() {
    return this.request<{
      lecturer: Lecturer;
      activeSession: AcademicSession | null;
      schedulesByDay: Record<string, Schedule[]>;
      totalSchedules: number;
    }>("/lecturers/dashboard/my-schedule");
  }

  async createLecturer(data: CreateLecturerData) {
    return this.request<Lecturer>("/lecturers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateLecturer(id: string, data: UpdateLecturerData) {
    return this.request<Lecturer>(`/lecturers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteLecturer(id: string) {
    return this.request<Lecturer>(`/lecturers/${id}`, {
      method: "DELETE",
    });
  }

  // ============ COURSES ============
  async getCourses(params?: CourseFilterParams) {
    return this.request<PaginatedResponse<Course> | Course[]>(
      `/courses${this.buildQueryString(params)}`
    );
  }

  async getCourse(code: string) {
    return this.request<Course>(`/courses/${code}`);
  }

  async getCoursesWithoutSchedules() {
    return this.request<Course[]>("/courses/without-schedules");
  }

  async getCourseStatistics() {
    return this.request<CourseStatistics>("/courses/statistics");
  }

  async createCourse(data: CreateCourseData) {
    return this.request<Course>("/courses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCourse(code: string, data: UpdateCourseData) {
    return this.request<Course>(`/courses/${code}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteCourse(code: string) {
    return this.request<Course>(`/courses/${code}`, {
      method: "DELETE",
    });
  }

  async uploadCoursesBulk(file: File) {
    return this.uploadFile<BulkUploadResult<Course>>(
      "/courses/bulk/upload",
      file
    );
  }

  async getCoursesBulkTemplate() {
    return this.downloadFile("/courses/bulk/template");
  }

  // ============ SCHEDULES ============
  async getSchedules(params?: ScheduleFilterParams) {
    return this.request<PaginatedResponse<Schedule> | Schedule[]>(
      `/schedules${this.buildQueryString(params)}`
    );
  }

  async getSchedule(id: string) {
    return this.request<Schedule>(`/schedules/${id}`);
  }

  async getScheduleStatistics() {
    return this.request<ScheduleStatistics>("/schedules/statistics");
  }

  async createSchedule(data: CreateScheduleData) {
    return this.request<Schedule>("/schedules", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSchedule(id: string, data: UpdateScheduleData) {
    return this.request<Schedule>(`/schedules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteSchedule(id: string) {
    return this.request<Schedule>(`/schedules/${id}`, {
      method: "DELETE",
    });
  }

  async uploadSchedulesBulk(file: File) {
    return this.uploadFile<BulkUploadResult<Schedule>>(
      "/schedules/bulk/upload",
      file
    );
  }

  async getSchedulesBulkTemplate() {
    return this.downloadFile("/schedules/bulk/template");
  }

  // ============ ACADEMIC SESSIONS ============
  async getAcademicSessions(params?: PaginationParams) {
    return this.request<PaginatedResponse<AcademicSession> | AcademicSession[]>(
      `/academic-sessions${this.buildQueryString(params)}`
    );
  }

  async getAcademicSession(id: string) {
    return this.request<AcademicSession>(`/academic-sessions/${id}`);
  }

  async getActiveAcademicSession() {
    return this.request<AcademicSession | null>("/academic-sessions/active");
  }

  async getSessionStatistics(id: string) {
    return this.request<SessionStatistics>(
      `/academic-sessions/${id}/statistics`
    );
  }

  async createAcademicSession(data: CreateAcademicSessionData) {
    return this.request<AcademicSession>("/academic-sessions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateAcademicSession(id: string, data: UpdateAcademicSessionData) {
    return this.request<AcademicSession>(`/academic-sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async activateAcademicSession(id: string) {
    return this.request<AcademicSession>(`/academic-sessions/${id}/activate`, {
      method: "PATCH",
    });
  }

  async archiveAcademicSession(id: string) {
    return this.request<AcademicSession>(`/academic-sessions/${id}/archive`, {
      method: "PATCH",
    });
  }

  async deleteAcademicSession(id: string) {
    return this.request<AcademicSession>(`/academic-sessions/${id}`, {
      method: "DELETE",
    });
  }

  // ============ EXAMS ============
  async getExams(params?: PaginationParams) {
    return this.request<PaginatedResponse<ExamSchedule> | ExamSchedule[]>(
      `/exams${this.buildQueryString(params)}`
    );
  }

  async getExam(id: string) {
    return this.request<ExamSchedule>(`/exams/${id}`);
  }

  async createExam(data: CreateExamData) {
    return this.request<ExamSchedule>("/exams", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateExam(id: string, data: UpdateExamData) {
    return this.request<ExamSchedule>(`/exams/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteExam(id: string) {
    return this.request<ExamSchedule>(`/exams/${id}`, {
      method: "DELETE",
    });
  }

  // ============ COMPLAINTS ============
  async getComplaints(params?: ComplaintFilterParams) {
    return this.request<PaginatedResponse<Complaint> | Complaint[]>(
      `/complaints${this.buildQueryString(params)}`
    );
  }

  async getMyComplaints() {
    return this.request<Complaint[]>("/complaints/my-complaints");
  }

  async getPendingComplaints() {
    return this.request<Complaint[]>("/complaints/pending");
  }

  async getResolvedComplaints() {
    return this.request<Complaint[]>("/complaints/resolved");
  }

  async getComplaint(id: string) {
    return this.request<Complaint>(`/complaints/${id}`);
  }

  async createComplaint(data: CreateComplaintData) {
    return this.request<Complaint>("/complaints", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateComplaintStatus(id: string, status: string) {
    return this.request<Complaint>(`/complaints/${id}/status?status=${status}`, {
      method: "PATCH",
    });
  }

  async deleteComplaint(id: string) {
    return this.request<Complaint>(`/complaints/${id}`, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
