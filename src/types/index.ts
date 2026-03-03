// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp?: string;
  error?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface ArrayResponse<T> extends ApiResponse<T[]> {}

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum Role {
  STUDENT = "STUDENT",
  LECTURER = "LECTURER",
  HOD = "HOD",       // added — backend has HOD as distinct role
  ADMIN = "ADMIN",
}

export enum Level {
  LEVEL_100 = "LEVEL_100",
  LEVEL_200 = "LEVEL_200",
  LEVEL_300 = "LEVEL_300",
  LEVEL_400 = "LEVEL_400",
  LEVEL_500 = "LEVEL_500",
}

export enum College {
  CBAS = "CBAS",
  CHMS = "CHMS",
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
  SUNDAY = "SUNDAY",
}

export enum ComplaintStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

/**
 * VenueType — venues are NOT a database table; they are a fixed enum on the
 * backend.  Every schedule and exam references one of these string values.
 */
export enum VenueType {
  UNIVERSITY_ICT_CENTER = "UNIVERSITY_ICT_CENTER",
  ICT_LAB_1 = "ICT_LAB_1",
  ICT_LAB_2 = "ICT_LAB_2",
  COMPUTER_LAB = "COMPUTER_LAB",
  LECTURE_HALL_1 = "LECTURE_HALL_1",
  LECTURE_HALL_2 = "LECTURE_HALL_2",
  LECTURE_HALL_3 = "LECTURE_HALL_3",
  AUDITORIUM_A = "AUDITORIUM_A",
  AUDITORIUM_B = "AUDITORIUM_B",
  SEMINAR_ROOM_A = "SEMINAR_ROOM_A",
  SEMINAR_ROOM_B = "SEMINAR_ROOM_B",
  ROOM_101 = "ROOM_101",
  ROOM_102 = "ROOM_102",
  ROOM_201 = "ROOM_201",
  ROOM_202 = "ROOM_202",
  ROOM_301 = "ROOM_301",
  ROOM_302 = "ROOM_302",
  SCIENCE_LAB_1 = "SCIENCE_LAB_1",
  SCIENCE_LAB_2 = "SCIENCE_LAB_2",
}

/** Venues that are valid for CBT exams (100L / General courses). */
export const ICT_VENUES: VenueType[] = [
  VenueType.UNIVERSITY_ICT_CENTER,
  VenueType.ICT_LAB_1,
  VenueType.ICT_LAB_2,
  VenueType.COMPUTER_LAB,
];

// ─── Data Models ──────────────────────────────────────────────────────────────

/**
 * User — single unified model for ALL system actors.
 * Lecturer-specific fields (phone, departmentCode, department) are only
 * populated when role = LECTURER | HOD.
 */
export interface User {
  id: string;
  matricNO: string;
  email: string;
  name: string | null;
  role: Role;
  // Lecturer / HOD only
  phone?: string | null;
  departmentCode?: string | null;
  department?: Pick<Department, "name" | "code" | "college"> | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Convenience alias — a User whose role is LECTURER or HOD. */
export type Lecturer = User & {
  role: Role.LECTURER | Role.HOD;
  departmentCode: string;
};

export interface AuthResponse {
  user: Pick<User, "id" | "email" | "name" | "role">;
  access_token: string;
  token_type: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  college: College;
  hodId?: string | null;
  /** Populated as a partial User (id, name, email, role). */
  hod?: Pick<User, "id" | "name" | "email" | "role"> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  overview?: string | null;
  level: Level;
  credits: number;
  semester: Semester;
  departmentCode: string;
  department?: Department;
  lecturerId?: string | null;
  /** Lecturer is now a User record — selected fields only. */
  lecturer?: Pick<User, "id" | "name" | "email" | "phone" | "departmentCode"> | null;
  isGeneral: boolean;
  isLocked: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  schedules?: Schedule[];
}

export interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Schedule {
  id: string;
  courseCode: string;
  course?: Course;
  semester: Semester;
  sessionId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;   // "HH:MM"
  endTime: string;     // "HH:MM"
  venue: VenueType;    // enum string — not a related object
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  courseCode: string;
  course?: Course;
  date: string;
  startTime: string;   // "HH:MM"
  endTime: string;     // "HH:MM"
  venue: VenueType;    // enum string — not a related object or id
  studentCount: number;
  targetCollege?: College | null;
  invigilators?: string | null;
  semester: Semester;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Complaint {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  department: string;
  subject: string;
  message: string;
  status: ComplaintStatus;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationCode {
  id: string;
  code: string;
  role: Role;
  description?: string | null;
  isActive: boolean;
  usageCount: number;   // exact backend field name
  maxUsage?: number | null;  // exact backend field name
  expiresAt?: string | null;
  createdBy: string;
  creator?: Pick<User, "id" | "name" | "email" | "role">;
  createdAt: string;
  updatedAt: string;
}

// ─── Form / Request Data Types ────────────────────────────────────────────────

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  matricNO: string;
  email: string;
  password: string;
  name?: string;
  role?: Role;
  verificationCode?: string;
  /** Required when role = LECTURER | HOD */
  departmentCode?: string;
  phone?: string;
}

export interface CreateDepartmentData {
  name: string;
  code: string;
  description?: string;
  /** User ID (not email) of the intended HOD */
  hodId?: string;
}

export interface UpdateDepartmentData extends Partial<CreateDepartmentData> {}

export interface CreateCourseData {
  code: string;
  name: string;
  overview?: string;
  level: Level;
  semester: Semester;
  credits: number;
  departmentCode: string;
  /** User ID of the lecturer — NOT an email address */
  lecturerId?: string;
  isGeneral?: boolean;
  isLocked?: boolean;
}

export interface UpdateCourseData extends Partial<CreateCourseData> {}

export interface CreateScheduleData {
  courseCode: string;
  dayOfWeek: DayOfWeek;
  startTime: string;   // "HH:MM"
  endTime: string;     // "HH:MM"
  /** One of the VenueType enum values */
  venue: VenueType;
  // NOTE: no `type` field — ClassType does not exist in the backend
}

export interface UpdateScheduleData extends Partial<CreateScheduleData> {}

export interface CreateAcademicSessionData {
  name: string;
  startDate: string;
  endDate: string;
}

export interface UpdateAcademicSessionData {
  name?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface CreateExamData {
  courseCode: string;
  date: string;
  startTime: string;   // "HH:MM"
  endTime: string;     // "HH:MM"
  /** VenueType enum value — NOT a venue id */
  venue: VenueType;
  studentCount: number;
  invigilators?: string;
  /** Required only for General courses (GST / PIF) */
  targetCollege?: College;
}

export interface UpdateExamData extends Partial<CreateExamData> {}

export interface CreateComplaintData {
  name: string;
  email: string;
  department: string;
  subject: string;
  message: string;
}

export interface CreateVerificationCodeData {
  code: string;
  role: Role;
  description?: string;
  maxUsage?: number;   // backend field name
  expiresAt?: string;
}

// ─── Query / Filter Params ────────────────────────────────────────────────────

export interface QueryParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

export interface UserFilterParams extends QueryParams {
  role?: Role;
  departmentCode?: string;
  isActive?: boolean;
}

export interface CourseFilterParams extends QueryParams {
  departmentCode?: string;
  level?: Level;
  semester?: Semester;
  isGeneral?: boolean;
  includeGeneral?: boolean;
  searchTerm?: string;
  /** Filter by lecturer User ID */
  lecturerId?: string;
  minCredits?: number;
  maxCredits?: number;
}

export interface ScheduleFilterParams extends QueryParams {
  courseCode?: string;
  departmentCode?: string;
  level?: Level;
  semester?: Semester;
  sessionId?: string;
  dayOfWeek?: DayOfWeek;
  venue?: string;
  startTime?: string;
  endTime?: string;
}

export interface DepartmentFilterParams extends QueryParams {
  searchTerm?: string;
  hasCourses?: boolean;
  withoutCourses?: boolean;
}
