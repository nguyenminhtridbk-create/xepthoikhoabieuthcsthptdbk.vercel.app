import {
  PeriodSlot,
  TeacherWeeklySchedule,
  ClassWeeklySchedule,
  TeachingReport,
  AppNotification,
  ConstraintRule,
  TeacherAssignmentItem,
} from '../types';
import { INITIAL_RULES, INITIAL_NOTIFICATIONS, INITIAL_TEACHING_REPORTS } from '../data/mockData';
import { DBK_WEEKLY_SCHEDULES, DBK_AVAILABLE_WEEKS, DBK_LATEST_WEEK } from '../data/dbkWeeklyScheduleData';

const STORAGE_KEYS = {
  SLOTS: 'dbk_slots_v2',
  RULES: 'dbk_rules_v2',
  REPORTS: 'dbk_reports_v2',
  NOTIFICATIONS: 'dbk_notifications_v2',
  PCGD_BY_WEEK: 'dbk_pcgd_by_week_v1',
  STATIC_REVISIONS: 'dbk_static_week_revisions_v1',
};

const PERMANENT_RULE_CODES = new Set([
  'GRADE67_OPPOSITE_SHIFT_GDTC',
  'MINIMIZE_TEACHER_GAPS',
]);

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

  private readSlots(): PeriodSlot[] {
    try {
      const value = localStorage.getItem(STORAGE_KEYS.SLOTS);
      return value ? JSON.parse(value) as PeriodSlot[] : [];
    } catch {
      return [];
    }
  }

  private readAssignmentsByWeek(): Record<string, TeacherAssignmentItem[]> {
    try {
      const value = localStorage.getItem(STORAGE_KEYS.PCGD_BY_WEEK);
      return value ? JSON.parse(value) as Record<string, TeacherAssignmentItem[]> : {};
    } catch {
      return {};
    }
  }

  private readStaticRevisions(): Record<string, string> {
    try {
      const value = localStorage.getItem(STORAGE_KEYS.STATIC_REVISIONS);
      return value ? JSON.parse(value) as Record<string, string> : {};
    } catch {
      return {};
    }
  }

  private ensureInitialized() {
    // Dọn dẹp cờ Firestore cũ khỏi localStorage nếu có
    localStorage.removeItem('dbk_staged_changes_count');
    localStorage.removeItem('dbk_last_firestore_commit');

    let slots = this.readSlots();
    const assignmentsByWeek = this.readAssignmentsByWeek();
    const staticRevisions = this.readStaticRevisions();
    let slotsChanged = false;
    let assignmentsChanged = false;
    let revisionsChanged = false;

    for (const snapshot of Object.values(DBK_WEEKLY_SCHEDULES)) {
      const weekKey = String(snapshot.weekNumber);
      const hasSavedWeek = slots.some((slot) => slot.weekNumber === snapshot.weekNumber);
      if (staticRevisions[weekKey] !== snapshot.revision || !hasSavedWeek) {
        slots = [
          ...slots.filter((slot) => slot.weekNumber !== snapshot.weekNumber),
          ...snapshot.slots.map((slot) => ({ ...slot })),
        ];
        assignmentsByWeek[weekKey] = snapshot.assignments.map((assignment) => ({ ...assignment }));
        staticRevisions[weekKey] = snapshot.revision;
        slotsChanged = true;
        assignmentsChanged = true;
        revisionsChanged = true;
      } else if (!assignmentsByWeek[weekKey]) {
        assignmentsByWeek[weekKey] = snapshot.assignments.map((assignment) => ({ ...assignment }));
        assignmentsChanged = true;
      }
    }

    if (slotsChanged) localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
    if (assignmentsChanged) localStorage.setItem(STORAGE_KEYS.PCGD_BY_WEEK, JSON.stringify(assignmentsByWeek));
    if (revisionsChanged) localStorage.setItem(STORAGE_KEYS.STATIC_REVISIONS, JSON.stringify(staticRevisions));

    if (!localStorage.getItem(STORAGE_KEYS.RULES)) {
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(INITIAL_RULES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_TEACHING_REPORTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    }

  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public getAvailableWeeks(): number[] {
    return [...DBK_AVAILABLE_WEEKS];
  }

  public getLatestAvailableWeek(): number {
    return DBK_LATEST_WEEK;
  }

  public loadWeekFromCode(weekNumber: number): boolean {
    const snapshot = DBK_WEEKLY_SCHEDULES[weekNumber];
    if (!snapshot) return false;

    const slots = this.getSlots().filter((slot) => slot.weekNumber !== weekNumber);
    slots.push(...snapshot.slots.map((slot) => ({ ...slot })));
    const assignmentsByWeek = this.readAssignmentsByWeek();
    assignmentsByWeek[String(weekNumber)] = snapshot.assignments.map((assignment) => ({ ...assignment }));
    const staticRevisions = this.readStaticRevisions();
    staticRevisions[String(weekNumber)] = snapshot.revision;

    localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
    localStorage.setItem(STORAGE_KEYS.PCGD_BY_WEEK, JSON.stringify(assignmentsByWeek));
    localStorage.setItem(STORAGE_KEYS.STATIC_REVISIONS, JSON.stringify(staticRevisions));
    this.notify();
    return true;
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

  public getTeachingAssignments(weekNumber: number = DBK_LATEST_WEEK): TeacherAssignmentItem[] {
    return this.readAssignmentsByWeek()[String(weekNumber)] || [];
  }

  public getAllTeachingAssignments(): TeacherAssignmentItem[] {
    return Object.values(this.readAssignmentsByWeek()).flat();
  }

  public saveTeachingAssignments(assignments: TeacherAssignmentItem[], weekNumber: number = DBK_LATEST_WEEK) {
    const assignmentsByWeek = this.readAssignmentsByWeek();
    assignmentsByWeek[String(weekNumber)] = assignments;
    localStorage.setItem(STORAGE_KEYS.PCGD_BY_WEEK, JSON.stringify(assignmentsByWeek));
    this.notify(true);
  }

  public updateTeachingAssignment(item: TeacherAssignmentItem, weekNumber: number = DBK_LATEST_WEEK) {
    const assignments = this.getTeachingAssignments(weekNumber);
    const index = assignments.findIndex((a) => a.id === item.id);
    if (index >= 0) {
      assignments[index] = item;
    } else {
      assignments.push(item);
    }
    this.saveTeachingAssignments(assignments, weekNumber);
  }

  public deleteTeachingAssignment(id: string, weekNumber: number = DBK_LATEST_WEEK) {
    const assignments = this.getTeachingAssignments(weekNumber).filter((a) => a.id !== id);
    this.saveTeachingAssignments(assignments, weekNumber);
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
      const storedRules: ConstraintRule[] = data ? JSON.parse(data) : [];
      const storedByCode = new Map(storedRules.map((rule) => [rule.code, rule]));
      const rules = INITIAL_RULES.map((defaultRule) => {
        const storedRule = storedByCode.get(defaultRule.code);
        if (PERMANENT_RULE_CODES.has(defaultRule.code)) {
          return { ...storedRule, ...defaultRule, isActive: true };
        }
        return { ...defaultRule, ...storedRule };
      });

      if (JSON.stringify(rules) !== data) {
        localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
      }
      return rules;
    } catch {
      return INITIAL_RULES;
    }
  }

  public toggleRule(ruleCode: string) {
    if (PERMANENT_RULE_CODES.has(ruleCode)) return;
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
    localStorage.removeItem(STORAGE_KEYS.PCGD_BY_WEEK);
    localStorage.removeItem(STORAGE_KEYS.STATIC_REVISIONS);
    localStorage.removeItem(STORAGE_KEYS.RULES);
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    this.ensureInitialized();
    this.notify(false);
  }
}

export { AppScheduleStorage as FirestoreScheduleService };
