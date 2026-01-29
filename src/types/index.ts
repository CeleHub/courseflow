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
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Enums
export enum Role {
  STUDENT = "STUDENT",
  LECTURER = "LECTURER",
  HOD = "HOD",
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

export enum VenueType {
  UNIVERSITY_ICT_CENTER = "UNIVERSITY_ICT_CENTER",
  ICT_LAB_1 = "ICT_LAB_1",
  ICT_LAB_2 = "ICT_LAB_2",
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
  COMPUTER_LAB = "COMPUTER_LAB",
  SCIENCE_LAB_1 = "SCIENCE_LAB_1",
  SCIENCE_LAB_2 = "SCIENCE_LAB_2",
}

export enum ComplaintStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

// Data Models
export interface User {
  id: string;
  matricNO: string;
  email: string;
  name?: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
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
  college: College;
  hodId?: string;
  hod?: {
    id: string;
    name?: string;
    email: string;
    role: Role;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  courses?: Course[];
  lecturers?: Lecturer[];
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
  lecturer?: Lecturer;
  isGeneral: boolean;
  isLocked: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  schedules?: Schedule[];
  examSchedules?: ExamSchedule[];
}

export interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  courseCode: string;
  course?: Course;
  semester: Semester;
  sessionId: string;
  session?: AcademicSession;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  venue: VenueType;
  createdAt: string;
  updatedAt: string;
}

export interface ExamSchedule {
  id: string;
  courseCode: string;
  course?: Course;
  date: string;
  startTime: string;
  endTime: string;
  venue: VenueType;
  studentCount: number;
  targetCollege?: College;
  invigilators?: string;
  semester: Semester;
  sessionId: string;
  session?: AcademicSession;
  createdAt: string;
  updatedAt: string;
}

export interface Complaint {
  id: string;
  userId?: string;
  user?: User;
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
  usageCount: number;
  maxUsage?: number;
  expiresAt?: string;
  createdBy: string;
  creator?: {
    id: string;
    name?: string;
    email: string;
    role: Role;
  };
  createdAt: string;
  updatedAt: string;
}

// Form Data Types
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
  departmentCode?: string; // Required for HOD/LECTURER
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface CreateDepartmentData {
  name: string;
  code: string;
  description?: string;
  hodEmail?: string;
}

export interface UpdateDepartmentData extends Partial<CreateDepartmentData> {}

export interface CreateLecturerData {
  name: string;
  email: string;
  phone?: string;
  departmentCode: string;
}

export interface UpdateLecturerData extends Partial<CreateLecturerData> {}

export interface CreateCourseData {
  code: string;
  name: string;
  overview?: string;
  level: Level;
  credits: number;
  semester: Semester;
  departmentCode: string;
  lecturerEmail: string;
  isGeneral?: boolean;
  isLocked?: boolean;
}

export interface UpdateCourseData extends Partial<CreateCourseData> {}

export interface CreateScheduleData {
  courseCode: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  venue: VenueType;
}

export interface UpdateScheduleData extends Partial<CreateScheduleData> {}

export interface CreateAcademicSessionData {
  name: string;
  startDate: string;
  endDate: string;
}

export interface UpdateAcademicSessionData
  extends Partial<CreateAcademicSessionData> {
  isActive?: boolean;
}

export interface CreateExamData {
  courseCode: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: VenueType;
  studentCount: number;
  targetCollege?: College;
  invigilators?: string;
}

export interface UpdateExamData extends Partial<CreateExamData> {}

export interface CreateComplaintData {
  name: string;
  email: string;
  department: string;
  subject: string;
  message: string;
}

export interface UpdateComplaintData {
  status: ComplaintStatus;
  resolvedBy?: string;
}

export interface CreateVerificationCodeData {
  code: string;
  role: Role;
  description?: string;
  maxUsage?: number;
  expiresAt?: string;
}

export interface UpdateVerificationCodeData
  extends Partial<CreateVerificationCodeData> {
  isActive?: boolean;
}

// Query Parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

export interface DepartmentFilterParams extends PaginationParams {
  searchTerm?: string;
  hasCourses?: boolean;
  withoutCourses?: boolean;
}

export interface CourseFilterParams extends PaginationParams {
  departmentCode?: string;
  level?: Level;
  semester?: Semester;
  isGeneral?: boolean;
  includeGeneral?: boolean;
  searchTerm?: string;
  lecturerEmail?: string;
  minCredits?: number;
  maxCredits?: number;
}

export interface ScheduleFilterParams extends PaginationParams {
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

export interface ComplaintFilterParams extends PaginationParams {
  status?: ComplaintStatus;
  searchTerm?: string;
}

// Bulk Upload Response
export interface BulkUploadError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface BulkUploadResult<T> {
  success: boolean;
  created: T[];
  errors: BulkUploadError[];
  summary: {
    totalRows: number;
    successCount: number;
    errorCount: number;
  };
}

// Statistics
export interface DepartmentStatistics {
  totalDepartments: number;
  departmentsWithCourses: number;
  departmentsWithoutCourses: number;
  averageCoursesPerDepartment: number;
}

export interface CourseStatistics {
  totalCourses: number;
  coursesByLevel: Record<Level, number>;
  coursesByDepartment: Record<string, number>;
  averageCredits: number;
}

export interface ScheduleStatistics {
  totalSchedules: number;
  schedulesByDay: Record<DayOfWeek, number>;
}

export interface SessionStatistics {
  totalSchedules: number;
  totalExams: number;
  schedulesBySemester: { FIRST: number; SECOND: number };
  examsBySemester: { FIRST: number; SECOND: number };
}

export interface LecturerDashboardStats {
  totalCourses: number;
  totalSchedules: number;
  coursesByLevel: Record<string, number>;
  schedulesByDay: Record<string, number>;
  upcomingClasses: number;
}
