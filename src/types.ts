/**
 * Định nghĩa Type cho Hệ thống Xếp Thời Khóa Biểu Trường 2 Cấp (THCS - THPT)
 * Hỗ trợ 3 điểm trường, liên môn KHTN, LS&ĐL, chuyên đề & tự chọn THPT
 */

export type UserRole = 'admin' | 'head_of_department' | 'teacher';

export interface Campus {
  id: string;
  name: string;
  code: string;
  address: string;
  travelTimeMinutes: number;
  isMainCampus: boolean;
}

export interface Room {
  id: string;
  name: string;
  campusId: string;
  roomType: 'standard' | 'lab_khtn' | 'lab_computer' | 'lab_foreign_lang' | 'multipurpose_hall';
  capacity: number;
}

export type GradeLevel = 'THCS' | 'THPT';

export type SubjectCategory =
  | 'standard'
  | 'khtn_integrated'  // Môn KHTN THCS (Lý, Hóa, Sinh)
  | 'lsdl_integrated'  // Môn LS&ĐL THCS (Sử, Địa)
  | 'thpt_chuyen_de'   // Chuyên đề học tập THPT
  | 'thpt_elective';   // Môn lựa chọn THPT theo tổ hợp KHTN/KHXH

export interface SubComponentAssignment {
  name: string; // VD: 'KHTN - Vật lí', 'KHTN - Hóa học', 'KHTN - Sinh học'
  code: string;
  teacherId?: string;
  weeklyPeriodsByRange: {
    fromWeek: number;
    toWeek: number;
    periods: number;
  }[];
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  gradeLevel: GradeLevel;
  category: SubjectCategory;
  defaultWeeklyPeriods: number;
  requiresSpecialRoom?: boolean;
  specialRoomType?: Room['roomType'];
  color: string;
  subComponents?: SubComponentAssignment[];
}

export interface Teacher {
  id: string;
  code: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string; // VD: 'Tổ KHTN', 'Tổ Toán - Tin', 'Tổ KHXH', 'Tổ Ngoại ngữ'
  primaryCampusId: string;
  specialties: string[]; // Môn giảng dạy chính & phụ
  maxPeriodsPerDay: number;
  maxPeriodsPerWeek: number;
  preferredOffDay: number; // 2: Thứ 2, ..., 7: Thứ 7
  avatarUrl?: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: number; // 6, 7, 8, 9, 10, 11, 12
  gradeLevel: GradeLevel;
  campusId: string;
  shift: 'morning' | 'afternoon';
  homeroomTeacherId: string;
  studentCount: number;
  track?: 'KHTN' | 'KHXH' | 'standard';
  assignedElectives?: string[]; // Môn tự chọn THPT
  assignedChuyenDe?: string[]; // Môn chuyên đề THPT
}

export interface PeriodSlot {
  id: string;
  dayOfWeek: number; // 2 (Thứ 2) -> 7 (Thứ 7)
  periodNumber: number; // 1 -> 5 (Sáng), 6 -> 10 (Chiều)
  shift: 'morning' | 'afternoon';
  classId: string;
  subjectId: string;
  subComponentName?: string; // e.g. "Vật lí (KHTN)", "Hóa học (KHTN)"
  teacherId: string;
  campusId: string;
  roomId: string;
  weekNumber: number;
  termId: string;
  isFlagSalute?: boolean; // Tiết Chào cờ
  isClassMeeting?: boolean; // Tiết Sinh hoạt lớp
  isLocked?: boolean; // Khóa không cho thuật toán tự đổi
  isOppositeShift?: boolean; // Tiết học trái buổi (HĐTNHN Tân Kiều hoặc GDTC ĐBK)
  note?: string;
}

/**
 * Gom nhóm theo Giáo viên và Tuần học - Tối ưu truy vấn Firestore (1 lần đọc lấy toàn bộ lịch tuần)
 */
export interface TeacherWeeklySchedule {
  id: string; // Format: `${teacherId}_w${weekNumber}`
  teacherId: string;
  weekNumber: number;
  termId: string;
  totalPeriods: number;
  slots: PeriodSlot[];
  updatedAt: string;
}

/**
 * Gom nhóm theo Lớp và Tuần học
 */
export interface ClassWeeklySchedule {
  id: string; // Format: `${classId}_w${weekNumber}`
  classId: string;
  weekNumber: number;
  termId: string;
  totalPeriods: number;
  slots: PeriodSlot[];
  updatedAt: string;
}

export type ConstraintType = 'hard' | 'soft';

export interface ConstraintRule {
  id: string;
  code: string;
  name: string;
  type: ConstraintType;
  description: string;
  isActive: boolean;
  weight?: number; // Cho ràng buộc mềm (1-10)
  parameters?: Record<string, any>;
}

export interface ScheduleConflict {
  id: string;
  type: 'hard_error' | 'soft_warning';
  ruleCode: string;
  title: string;
  description: string;
  dayOfWeek: number;
  periodNumber: number;
  affectedTeacherIds: string[];
  affectedClassIds: string[];
  affectedCampuses: string[];
  slotIds: string[];
}

export interface TeachingReportEntry {
  id: string;
  dayOfWeek: number;
  periodNumber: number;
  shift?: 'morning' | 'afternoon';
  classId: string;
  subjectName: string;
  subComponent?: string;
  ppctLessonNumber: number;
  lessonTitle: string;
  teachingEquipment: string;
  notes: string;
  status?: 'taught' | 'compensated' | 'substituted';
}

export interface TeachingReport {
  id: string; // Format: `${teacherId}_w${weekNumber}`
  teacherId: string;
  teacherName: string;
  weekNumber: number;
  termId: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  approvedBy?: string;
  approverName?: string;
  approverComment?: string;
  reviewedAt?: string;
  entries: TeachingReportEntry[];
}

export interface AppNotification {
  id: string;
  teacherId: string;
  teacherName: string;
  title: string;
  message: string;
  type: 'schedule_change' | 'conflict_alert' | 'report_reminder' | 'report_status' | 'announcement';
  isRead: boolean;
  createdAt: string;
  relatedWeek?: number;
}

export interface VietSchoolImportResult {
  success: boolean;
  totalClasses: number;
  totalTeachers: number;
  totalSlots: number;
  assignedSubjectsCount: number;
  warnings: string[];
  integrityCheckPassed: boolean;
  mappedTeacherCount: number;
  khtnSplitCount: number;
  lsdlSplitCount: number;
}

export interface TeacherAssignmentItem {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  weeklyPeriods: number;
  campusId: string;
  grade: number;
  gradeLevel: GradeLevel;
  subComponentName?: string;
  termId: string;
}

export interface TeacherWorkloadSummary {
  teacherId: string;
  teacherName: string;
  teacherCode: string;
  department: string;
  primaryCampusId: string;
  totalPeriodsPerWeek: number;
  classesAssigned: {
    classId: string;
    className: string;
    subjectName: string;
    periods: number;
  }[];
  isHomeroom: boolean;
  homeroomClassName?: string;
}

export interface StagedSyncStatus {
  hasUncommittedChanges: boolean;
  uncommittedCount: number;
  lastCommittedAt?: string;
  stagedActionSummary: {
    slotChanges: number;
    pcgdChanges: number;
    ruleChanges: number;
  };
  estimatedFirestoreWrites: {
    teacherSchedules: number;
    classSchedules: number;
    teachingAssignments: number;
    totalWrites: number;
    quotaPercentage: number; // Tỷ lệ % trên mức miễn phí 20.000 writes/ngày
  };
}

export interface Week3GenerationOptions {
  inheritFromWeek: number; // default 2
  targetWeek: number; // default 3
  optimizeTeacherGaps: boolean;
  enforceCampusTravelGap: boolean;
  rotateKHTNSubjects: boolean; // luân phiên phân môn nếu có quy định
  keepFixedSlots: boolean; // giữ cố định chào cờ & sinh hoạt lớp
}

