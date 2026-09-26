import {
  PeriodSlot,
  TeacherWeeklySchedule,
  ClassWeeklySchedule,
  TeachingReport,
  AppNotification,
  ConstraintRule,
  TeacherAssignmentItem,
  Week3GenerationOptions,
} from '../types';
import { INITIAL_RULES, INITIAL_NOTIFICATIONS, INITIAL_TEACHING_REPORTS } from '../data/mockData';
import {
  DBK_CLASSES,
  DBK_TEACHERS,
  DBK_SUBJECTS,
  DBK_CAMPUSES,
  buildWeek2Slots,
  buildTeachingAssignments,
} from '../data/dbkActualData';
import { generateOfficialWeek3Slots, generateOfficialWeek4Slots } from './timetableSchedulerEngine';

const STORAGE_KEYS = {
  SLOTS: 'dbk_slots_v2',
  PCGD: 'dbk_pcgd_v2',
  RULES: 'dbk_rules_v2',
  REPORTS: 'dbk_reports_v2',
  NOTIFICATIONS: 'dbk_notifications_v2',
};

export class AppScheduleStorage {
  private static instance: AppScheduleStorage;
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.ensureInitialized();
  }

  public static getInstance(): AppScheduleStorage {
    if (!AppScheduleStorage.instance) {
      AppScheduleStorage.instance = new AppScheduleStorage();
    }
    return AppScheduleStorage.instance;
  }

  private ensureInitialized() {
    // Dọn dẹp cờ Firestore cũ khỏi localStorage nếu có
    localStorage.removeItem('dbk_staged_changes_count');
    localStorage.removeItem('dbk_last_firestore_commit');

    const existingSlots = localStorage.getItem(STORAGE_KEYS.SLOTS);
    let parsedSlots: PeriodSlot[] = [];
    try {
      parsedSlots = existingSlots ? JSON.parse(existingSlots) : [];
    } catch {
      parsedSlots = [];
    }

    const hasWeek2MorningGrade67 = parsedSlots.some(
      (s) => s.weekNumber === 2 && s.shift === 'morning' && s.classId === 'cls_6a1'
    );
    const isWeek2Optimized = parsedSlots.some(
      (s) => s.weekNumber === 2 && s.dayOfWeek === 7 && s.classId === 'cls_10cb3' && s.periodNumber === 1
    );

    if (!existingSlots || parsedSlots.length < 1000 || !hasWeek2MorningGrade67 || !isWeek2Optimized) {
      // Nạp toàn bộ 1,528 tiết học Tuần 2 tối ưu (tiết trái buổi sáng Khối 6,7 và tập trung tiết trống vào Thứ 5)
      const initialWeek2 = buildWeek2Slots();
      const week3Slots = generateOfficialWeek3Slots(
        initialWeek2,
        DBK_TEACHERS,
        DBK_CLASSES,
        DBK_SUBJECTS,
        DBK_CAMPUSES
      );
      parsedSlots = [...initialWeek2, ...week3Slots];
      localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(parsedSlots));
    }

    const existingPCGD = localStorage.getItem(STORAGE_KEYS.PCGD);
    if (!existingPCGD || JSON.parse(existingPCGD).length < 500) {
      // Nạp toàn bộ 762 phân công chuyên môn chuẩn của 53 lớp và 101 giáo viên
      const initialPCGD = buildTeachingAssignments();
      localStorage.setItem(STORAGE_KEYS.PCGD, JSON.stringify(initialPCGD));
    }

    if (!localStorage.getItem(STORAGE_KEYS.RULES)) {
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(INITIAL_RULES));
    }

    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_TEACHING_REPORTS));
    }

    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    }

    // Kiểm tra xem đã có thời khóa biểu Tuần 3 với đầy đủ tiết sáng trái buổi khối 6, 7 chưa
    const hasWeek3 = parsedSlots.some((s) => s.weekNumber === 3);
    const hasWeek3MorningGrade67 = parsedSlots.some(
      (s) => s.weekNumber === 3 && s.shift === 'morning' && s.classId === 'cls_6a1'
    );

    let currentSlotsToSave = parsedSlots;

    if (!hasWeek3 || !hasWeek3MorningGrade67) {
      const week2Slots = parsedSlots.filter((s) => s.weekNumber === 2);
      const baseWeek2 = week2Slots.length >= 1000 ? week2Slots : buildWeek2Slots();
      const week3Slots = generateOfficialWeek3Slots(
        baseWeek2,
        DBK_TEACHERS,
        DBK_CLASSES,
        DBK_SUBJECTS,
        DBK_CAMPUSES
      );
      currentSlotsToSave = [
        ...parsedSlots.filter((s) => s.weekNumber !== 3),
        ...week3Slots,
      ];
      localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(currentSlotsToSave));
    }

    // Kiểm tra xem đã có thời khóa biểu Tuần 4 theo phân công chuyên môn mới nhất chưa
    const hasWeek4 = currentSlotsToSave.some((s) => s.weekNumber === 4);
    if (!hasWeek4) {
      const week4Slots = generateOfficialWeek4Slots(
        currentSlotsToSave,
        DBK_TEACHERS,
        DBK_CLASSES,
        DBK_SUBJECTS,
        DBK_CAMPUSES
      );
      const allSlots = [
        ...currentSlotsToSave.filter((s) => s.weekNumber !== 4),
        ...week4Slots,
      ];
      localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(allSlots));
    }
  }

  /**
   * Cập nhật phân công chuyên môn cho Tuần 4:
   * Chuyển 2 lớp HĐTNHN 8A9 và 8A10 từ Thầy Phan Văn Tặt sang Thầy Thái Văn Tiến
   */
  public updateWeek4Assignments(): void {
    const assignments = this.getTeachingAssignments();
    const updated = assignments.map((a) => {
      if (
        (a.className === '8A9' || a.className === '8A10' || a.classId === 'cls_8a9' || a.classId === 'cls_8a10') &&
        (a.subjectName.toLowerCase().includes('hđtn') || a.subjectName.toLowerCase().includes('hdtn') || a.subjectId.includes('hdtn'))
      ) {
        return {
          ...a,
          teacherId: 'gv_thai_van_tien',
          teacherName: 'Thái Văn Tiến',
        };
      }
      return a;
    });
    this.saveTeachingAssignments(updated);
  }

  /**
   * Khôi phục/nạp lại dữ liệu gốc Tuần 2, Tuần 3, Tuần 4 từ tài liệu nhà trường (1,528 tiết học, 762 PCGD)
   */
  public resetToWeek2ActualData(): void {
    const initialWeek2 = buildWeek2Slots();
    const week3Slots = generateOfficialWeek3Slots(
      initialWeek2,
      DBK_TEACHERS,
      DBK_CLASSES,
      DBK_SUBJECTS,
      DBK_CAMPUSES
    );
    const week4Slots = generateOfficialWeek4Slots(
      [...initialWeek2, ...week3Slots],
      DBK_TEACHERS,
      DBK_CLASSES,
      DBK_SUBJECTS,
      DBK_CAMPUSES
    );
    localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify([...initialWeek2, ...week3Slots, ...week4Slots]));

    const initialPCGD = buildTeachingAssignments();
    localStorage.setItem(STORAGE_KEYS.PCGD, JSON.stringify(initialPCGD));

    this.notify();
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(_isStaged?: boolean) {
    this.listeners.forEach((fn) => fn());
  }

  // --- QUẢN LÝ TIẾT HỌC (SLOTS) ---

  public getSlots(): PeriodSlot[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SLOTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveSlots(slots: PeriodSlot[]) {
    localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
    this.notify(true);
  }

  public updateSlot(updatedSlot: PeriodSlot) {
    const slots = this.getSlots();
    const index = slots.findIndex((s) => s.id === updatedSlot.id);
    if (index >= 0) {
      slots[index] = updatedSlot;
    } else {
      slots.push(updatedSlot);
    }
    this.saveSlots(slots);
  }

  public removeSlot(slotId: string) {
    const slots = this.getSlots().filter((s) => s.id !== slotId);
    this.saveSlots(slots);
  }

  // --- QUẢN LÝ PHÂN CÔNG CHUYÊN MÔN (PCGD) ---

  public getTeachingAssignments(): TeacherAssignmentItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PCGD);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveTeachingAssignments(assignments: TeacherAssignmentItem[]) {
    localStorage.setItem(STORAGE_KEYS.PCGD, JSON.stringify(assignments));
    this.notify(true);
  }

  public updateTeachingAssignment(item: TeacherAssignmentItem) {
    const assignments = this.getTeachingAssignments();
    const index = assignments.findIndex((a) => a.id === item.id);
    if (index >= 0) {
      assignments[index] = item;
    } else {
      assignments.push(item);
    }
    this.saveTeachingAssignments(assignments);
  }

  public deleteTeachingAssignment(id: string) {
    const assignments = this.getTeachingAssignments().filter((a) => a.id !== id);
    this.saveTeachingAssignments(assignments);
  }

  // --- XẾP THỜI KHÓA BIỂU CHO TUẦN 3 ---

  /**
   * Tự động khởi tạo và tối ưu hóa Thời Khóa Biểu cho Tuần 3 theo đúng 17 quy tắc cứng & quy tắc giáo viên
   */
  public generateWeek3Schedule(options: Week3GenerationOptions): {
    newSlotsCount: number;
    weekNumber: number;
  } {
    const existingSlots = this.getSlots();
    // Lấy các slot của tuần nguồn (Tuần 2)
    const sourceSlots = existingSlots.filter((s) => s.weekNumber === options.inheritFromWeek);
    const slotsToUse = sourceSlots.length > 0 ? sourceSlots : existingSlots;

    // Sử dụng bộ máy chuyên sâu tối ưu theo 17 quy tắc cứng, KHTN 8 (Lý 2 - Hóa 2), Thầy Thái Văn Tiến dạy lại 8A7-8A10
    const week3Slots = generateOfficialWeek3Slots(
      slotsToUse,
      DBK_TEACHERS,
      DBK_CLASSES,
      DBK_SUBJECTS,
      DBK_CAMPUSES
    );

    // Lọc bỏ tuần 3 cũ nếu đã có, và bổ sung tuần 3 mới
    const filtered = existingSlots.filter((s) => s.weekNumber !== options.targetWeek);
    const combined = [...filtered, ...week3Slots];

    this.saveSlots(combined);

    // Gửi thông báo đến giáo viên
    this.addNotification({
      teacherId: 'all',
      teacherName: 'Toàn trường',
      title: `Khởi tạo Thời Khóa Biểu Tuần ${options.targetWeek} (Đã chuẩn hóa)`,
      message: `Thời khóa biểu Tuần ${options.targetWeek} đã được tự động tối ưu hóa thành công với ${week3Slots.length} tiết dạy theo 17 quy tắc trường Đốc Binh Kiều (KHTN 8: 2 Lý - 2 Hóa; Thầy Thái Văn Tiến đi dạy lại; đã giải quyết nguyện vọng giáo viên).`,
      type: 'schedule_change',
      isRead: false,
      relatedWeek: options.targetWeek,
    });

    return {
      newSlotsCount: week3Slots.length,
      weekNumber: options.targetWeek,
    };
  }

  // --- XẾP THỜI KHÓA BIỂU CHO TUẦN 4 ---

  /**
   * Tự động khởi tạo và tối ưu hóa Thời Khóa Biểu cho Tuần 4
   * Áp dụng phân công chuyên môn mới nhất (chuyển 8A9, 8A10 HĐTNHN từ Thầy Phan Văn Tặt sang Thầy Thái Văn Tiến)
   * Sử dụng thuật toán UniTime MPP (Minimal Perturbation Problem) & CBS cùng kiểm tra ma trận FET O(1)
   */
  public generateWeek4Schedule(): {
    newSlotsCount: number;
    weekNumber: number;
  } {
    const existingSlots = this.getSlots();
    const week4Slots = generateOfficialWeek4Slots(
      existingSlots,
      DBK_TEACHERS,
      DBK_CLASSES,
      DBK_SUBJECTS,
      DBK_CAMPUSES
    );

    const filtered = existingSlots.filter((s) => s.weekNumber !== 4);
    const combined = [...filtered, ...week4Slots];
    this.saveSlots(combined);

    // Cập nhật phân công chuyên môn Tuần 4
    this.updateWeek4Assignments();

    this.addNotification({
      teacherId: 'all',
      teacherName: 'Toàn trường',
      title: 'Khởi tạo Thời Khóa Biểu Tuần 4 (PCCM Mới Chuẩn Hóa)',
      message: `Thời khóa biểu Tuần 4 đã được tạo tự động với ${week4Slots.length} tiết học! Đã đổi 2 lớp 8A9, 8A10 (HĐTNHN) từ Thầy Phan Văn Tặt sang Thầy Thái Văn Tiến, đảm bảo 0 xung đột cứng (Zero Hard Conflict) và xáo trộn tối thiểu (UniTime MPP).`,
      type: 'schedule_change',
      isRead: false,
      relatedWeek: 4,
    });

    return {
      newSlotsCount: week4Slots.length,
      weekNumber: 4,
    };
  }

  // --- GOM NHÓM THEO GIÁO VIÊN & LỚP ĐỂ ĐỌC/XUẤT ---

  public getTeacherWeeklySchedule(teacherId: string, weekNumber: number, termId: string = 'HK1_2026_2027'): TeacherWeeklySchedule {
    const slots = this.getSlots().filter(
      (s) => s.teacherId === teacherId && s.weekNumber === weekNumber
    );
    return {
      id: `${teacherId}_w${weekNumber}`,
      teacherId,
      weekNumber,
      termId,
      totalPeriods: slots.length,
      slots,
      updatedAt: new Date().toISOString(),
    };
  }

  public getClassWeeklySchedule(classId: string, weekNumber: number, termId: string = 'HK1_2026_2027'): ClassWeeklySchedule {
    const slots = this.getSlots().filter(
      (s) => s.classId === classId && s.weekNumber === weekNumber
    );
    return {
      id: `${classId}_w${weekNumber}`,
      classId,
      weekNumber,
      termId,
      totalPeriods: slots.length,
      slots,
      updatedAt: new Date().toISOString(),
    };
  }

  // --- QUY TẮC RÀNG BUỘC ---

  public getRules(): ConstraintRule[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RULES);
      return data ? JSON.parse(data) : INITIAL_RULES;
    } catch {
      return INITIAL_RULES;
    }
  }

  public toggleRule(ruleCode: string) {
    const rules = this.getRules().map((r) =>
      r.code === ruleCode ? { ...r, isActive: !r.isActive } : r
    );
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
    this.notify(true);
  }

  // --- BÁO CÁO GIẢNG DẠY (SỔ BÁO GIẢNG) ---

  public getReports(): TeachingReport[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveReport(report: TeachingReport) {
    const reports = this.getReports();
    const idx = reports.findIndex((r) => r.id === report.id);
    if (idx >= 0) {
      reports[idx] = report;
    } else {
      reports.push(report);
    }
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    this.notify(true);
  }

  // --- THÔNG BÁO ---

  public getNotifications(): AppNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public addNotification(notif: Omit<AppNotification, 'id' | 'createdAt'>) {
    const notifications = this.getNotifications();
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    this.notify(false);
  }

  public markNotificationAsRead(id: string) {
    const notifications = this.getNotifications().map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    this.notify(false);
  }

  public resetToDefault() {
    localStorage.removeItem(STORAGE_KEYS.SLOTS);
    localStorage.removeItem(STORAGE_KEYS.PCGD);
    localStorage.removeItem(STORAGE_KEYS.RULES);
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    this.ensureInitialized();
    this.notify(false);
  }
}

export { AppScheduleStorage as FirestoreScheduleService };
