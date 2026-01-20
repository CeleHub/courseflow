// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  timestamp?: string
  error?: string
  statusCode?: number
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}

// For endpoints that return arrays directly (like verification codes)
export interface ArrayResponse<T> extends ApiResponse<T[]> {}

// Enums
export enum Role {
  STUDENT = "STUDENT",
  LECTURER = "LECTURER",
  ADMIN = "ADMIN"
}

// Academic structure enums
export enum Level {
  LEVEL_100 = "LEVEL_100",
  LEVEL_200 = "LEVEL_200",
  LEVEL_300 = "LEVEL_300",
  LEVEL_400 = "LEVEL_400",
  LEVEL_500 = "LEVEL_500"
}

export enum College {
  CBAS = "CBAS", // College of Basic and Applied Sciences
  CHMS = "CHMS", // College of Humanities and Management Sciences
}

export enum Semester {
  FIRST = "FIRST",
  SECOND = "SECOND",
}

export enum DayOfWeek {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY"
}

export enum ClassType {
  LECTURE = "LECTURE",
  SEMINAR = "SEMINAR",
  LAB = "LAB",
  TUTORIAL = "TUTORIAL"
}

export enum ComplaintStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED"
}

// Data Models
export interface User {
  id: string;
  matricNO: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User
  access_token: string
  token_type: string
}

export interface Lecturer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  departmentCode: string;
  department?: Department;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  college?: College;
  hodId?: string;
  hod?: User;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    courses: number;
    lecturers: number;
  };
}

export interface Course {
  id: string;
  code: string;
  name: string;
  overview?: string;
  level: Level;
  credits: number;
  semester: Semester;
  departmentCode: string;
  department?: Department;
  lecturerId?: string;
  lecturer?: Lecturer | User; // Handles both strict Lecturer model or User model depending on endpoint
  lecturerEmail?: string;
  isGeneral: boolean;
  isLocked: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  schedules?: Schedule[];
}

// Academic sessions (v2.0)
export interface AcademicSession {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

// Venues (v2.0)
export interface Venue {
  id: string
  name: string
  capacity: number
  isIct: boolean
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Schedule {
  id: string;
  courseCode: string;
  course?: Course;
  semester: Semester;
  sessionId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  venue: string;
  type: ClassType;
  createdAt: string;
  updatedAt: string;
}

// Exams (v2.0)
export interface Exam {
  id: string;
  courseCode: string;
  course?: Course;
  date: string;
  startTime: string;
  endTime: string;
  venueId: string;
  venue?: Venue;
  studentCount: number;
  targetCollege?: College;
  invigilators?: string;
  semester: Semester;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Complaint {
  id: string;
  userId?: string;
  name: string;
  email: string;
  department: string;
  subject: string;
  message: string;
  status: ComplaintStatus;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationCode {
  id: string;
  code: string;
  role: Role;
  description?: string;
  isActive: boolean;
  currentUses: number; // Mapped from usageCount in backend
  maxUses?: number; // Mapped from maxUsage in backend
  expiresAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Form Data Types
export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  matricNO: string
  email: string
  password: string
  name?: string
  role?: Role
  verificationCode?: string
}

export interface CreateDepartmentData {
  name: string
  code: string
  // NEW (v2.0)
  description?: string
  hodEmail?: string
}

export interface CreateCourseData {
  code: string
  name: string
  level: Level
  // NEW (v2.0)
  overview?: string
  credits: number
  departmentCode: string
  lecturerEmail?: string
  // University‑wide / admin flags (v2.0)
  isGeneral?: boolean
  isLocked?: boolean
}

export interface CreateScheduleData {
  courseCode: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  venue: string
  type: ClassType
}

export interface CreateAcademicSessionData {
  name: string
  startDate: string
  endDate: string
}

export interface UpdateAcademicSessionData {
  name?: string
  startDate?: string
  endDate?: string
}

export interface CreateVenueData {
  name: string
  capacity: number
  isIct: boolean
}

export interface UpdateVenueData {
  name?: string
  capacity?: number
  isIct?: boolean
}

export interface CreateExamData {
  courseCode: string
  venueId: string
  date: string
  startTime: string
  endTime: string
  studentCount: number
  invigilators: string
  targetCollege?: College
}

export interface UpdateExamData extends Partial<CreateExamData> {}

export interface CreateComplaintData {
  name: string
  email: string
  department: string
  subject: string
  message: string
}

export interface CreateVerificationCodeData {
  code: string
  role: Role
  expiresAt?: string
  maxUses?: number
}

// Utils
export interface QueryParams {
  page?: number
  limit?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export interface SearchParams extends QueryParams {
  search?: string
}
