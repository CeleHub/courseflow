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
  id: string
  matricNO: string
  email: string
  name: string
  role: Role
  createdAt?: string
  updatedAt?: string
}

export interface AuthResponse {
  user: User
  access_token: string
  token_type: string
}

export interface Department {
  id: string
  name: string
  code: string
  // NEW (v2.0 API)
  description?: string
  hodEmail?: string
  createdAt?: string
  updatedAt?: string
  _count?: {
    courses: number
  }
}

export interface Course {
  id: string
  code: string
  name: string
  level: Level
  // NEW (v2.0 API)
  overview?: string
  credits: number
  departmentCode: string
  lecturerEmail?: string | null
  // University‑wide / admin flags (v2.0)
  isGeneral?: boolean
  isLocked?: boolean
  department?: Department
  lecturer?: User
  schedules?: Schedule[]
  createdAt?: string
  updatedAt?: string
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
  id: string
  courseCode: string
  course?: Course
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  venue: string
  type: ClassType
  createdAt?: string
  updatedAt?: string
}

// Exams (v2.0)
export interface Exam {
  id: string
  courseCode: string
  course?: Course
  venueId: string
  venue?: Venue
  date: string
  startTime: string
  endTime: string
  studentCount: number
  invigilators: string
  targetCollege?: College
  createdAt?: string
  updatedAt?: string
}

export interface Complaint {
  id: string
  name: string
  email: string
  department: string
  subject: string
  message: string
  status: ComplaintStatus
  userId?: string
  user?: User
  createdAt?: string
  updatedAt?: string
}

export interface VerificationCode {
  id: string
  code: string
  role: Role
  expiresAt?: string | null
  maxUses?: number | null
  currentUses: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
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
