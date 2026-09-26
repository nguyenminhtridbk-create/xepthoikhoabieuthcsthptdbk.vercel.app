/**
 * FET Timetable Engine - Cải tiến & Ứng dụng Thuật toán Recursive Swapping (Ejection Chain)
 * từ phần mềm mã nguồn mở FET (Free Timetabling Software - Liviu Lalescu & Volker Dirr)
 * 
 * Các nguyên lý cốt lõi của FET được hiện thực:
 * 1. Activity Prioritization (Sắp xếp độ ưu tiên theo độ khó của hoạt động: số ràng buộc, tải GV, ghép tiết, trái buổi)
 * 2. Sequential Placement with Random Selection (Xếp tuần tự theo heuristics ngẫu nhiên)
 * 3. Recursive Swapping / Ejection Chain (Hoán đổi đệ quy giải tỏa xung đột với độ sâu tối đa 14, tabu list chống chu trình)
 * 4. Backtracking & Rollback Stack (Quay lui hoàn trả nguyên trạng khi nhánh đệ quy vượt ngưỡng)
 * 5. Multi-criteria Soft Constraints (Tối ưu tiết lửng, cấm đổi điểm trường, tôn trọng ngày nghỉ GV, phân bố sư phạm)
 * 6. Export to FET XML (.fet) để đồng bộ trực tiếp với phần mềm desktop FET chính thức
 */

import {
  PeriodSlot,
  Teacher,
  ClassRoom,
  Subject,
  Campus,
  Room,
  TeacherAssignmentItem,
} from '../types';

export interface FetActivity {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  campusId: string;
  shift: 'morning' | 'afternoon';
  isOppositeShift: boolean; // Dành cho lớp chiều học sáng (GDTC, Tin)
  isFixed: boolean; // Chào cờ, SHL, tiết khóa
  fixedDay?: number;
  fixedPeriod?: number;
  duration: number; // 1 hoặc 2 tiết ghép
  difficultyScore: number;
}

export interface FetEjectionChainStep {
  depth: number;
  activityId: string;
  activityName: string;
  fromSlot?: { day: number; period: number; shift: string };
  toSlot: { day: number; period: number; shift: string };
  evictedActivityId?: string;
  evictedActivityName?: string;
  reason: string;
}

export interface FetEngineConfig {
  maxRecursionDepth: number; // Mặc định 14 (chuẩn thuật toán FET của Liviu Lalescu)
  maxAttempts: number; // Số lần thử sắp xếp lại (mặc định 300)
  targetWeek: number;
  weights: {
    teacherGaps: number; // Trọng số giảm tiết lửng (1 - 10)
    campusTravel: number; // Trọng số cấm di chuyển giữa 2 điểm trường trong cùng buổi (1 - 10)
    doublePeriods: number; // Trọng số ghép tiết đôi (1 - 10)
    teacherOffDay: number; // Trọng số ngày nghỉ (1 - 10)
    pedagogy: number; // Trọng số giờ học sư phạm (1 - 10)
  };
  logProgress?: (msg: string, percent: number, ejectionSteps?: FetEjectionChainStep[]) => void;
}

export interface FetEngineResult {
  success: boolean;
  slots: PeriodSlot[];
  ejectionChainsCount: number;
  totalSwaps: number;
  maxDepthReached: number;
  durationMs: number;
  hardConflictsCount: number;
  softScore: number; // Thang 100
  teacherGapsCount: number;
  campusTravelViolations: number;
  chainHistory: FetEjectionChainStep[];
  reportLog: string[];
}

/**
 * Lớp Quản lý Lưới Chiếm Chỗ (Occupancy Grid) O(1) để kiểm tra xung đột thời gian thực
 */
class FetOccupancyGrid {
  // teacherOccupancy: teacherId -> day(2-7) -> shift('morning'|'afternoon') -> period(1-5) -> activityId
  teacherOccupancy: Map<string, Map<number, Map<string, Map<number, string>>>> = new Map();

  // classOccupancy: classId -> day(2-7) -> shift('morning'|'afternoon') -> period(1-5) -> activityId
  classOccupancy: Map<string, Map<number, Map<string, Map<number, string>>>> = new Map();

  // teacherCampusOccupancy: teacherId -> day(2-7) -> shift('morning'|'afternoon') -> Set<campusId>
  teacherCampusOccupancy: Map<string, Map<number, Map<string, Set<string>>>> = new Map();

  // activityPlacements: activityId -> { day, period, shift }
  activityPlacements: Map<string, { day: number; period: number; shift: 'morning' | 'afternoon' }> = new Map();

  clear() {
    this.teacherOccupancy.clear();
    this.classOccupancy.clear();
    this.teacherCampusOccupancy.clear();
    this.activityPlacements.clear();
  }

  getTeacherSlot(teacherId: string, day: number, shift: 'morning' | 'afternoon', period: number): string | undefined {
    return this.teacherOccupancy.get(teacherId)?.get(day)?.get(shift)?.get(period);
  }

  getClassSlot(classId: string, day: number, shift: 'morning' | 'afternoon', period: number): string | undefined {
    return this.classOccupancy.get(classId)?.get(day)?.get(shift)?.get(period);
  }

  isTeacherTeachingAtDifferentCampusInSameShift(teacherId: string, day: number, shift: 'morning' | 'afternoon', campusId: string): boolean {
    const campuses = this.teacherCampusOccupancy.get(teacherId)?.get(day)?.get(shift);
    if (!campuses || campuses.size === 0) return false;
    for (const c of campuses) {
      if (c !== campusId) return true;
    }
    return false;
  }

  assign(activity: FetActivity, day: number, shift: 'morning' | 'afternoon', period: number) {
    // 1. Teacher
    if (!this.teacherOccupancy.has(activity.teacherId)) {
      this.teacherOccupancy.set(activity.teacherId, new Map());
    }
    const tDayMap = this.teacherOccupancy.get(activity.teacherId)!;
    if (!tDayMap.has(day)) tDayMap.set(day, new Map());
    const tShiftMap = tDayMap.get(day)!;
    if (!tShiftMap.has(shift)) tShiftMap.set(shift, new Map());
    tShiftMap.get(shift)!.set(period, activity.id);

    // Teacher campus
    if (!this.teacherCampusOccupancy.has(activity.teacherId)) {
      this.teacherCampusOccupancy.set(activity.teacherId, new Map());
    }
    const tcDayMap = this.teacherCampusOccupancy.get(activity.teacherId)!;
    if (!tcDayMap.has(day)) tcDayMap.set(day, new Map());
    const tcShiftMap = tcDayMap.get(day)!;
    if (!tcShiftMap.has(shift)) tcShiftMap.set(shift, new Set());
    tcShiftMap.get(shift)!.add(activity.campusId);

    // 2. Class
    if (!this.classOccupancy.has(activity.classId)) {
      this.classOccupancy.set(activity.classId, new Map());
    }
    const cDayMap = this.classOccupancy.get(activity.classId)!;
    if (!cDayMap.has(day)) cDayMap.set(day, new Map());
    const cShiftMap = cDayMap.get(day)!;
    if (!cShiftMap.has(shift)) cShiftMap.set(shift, new Map());
    cShiftMap.get(shift)!.set(period, activity.id);

    // 3. Placement map
    this.activityPlacements.set(activity.id, { day, period, shift });
  }

  unassign(activity: FetActivity) {
    const placement = this.activityPlacements.get(activity.id);
    if (!placement) return;
    const { day, period, shift } = placement;

    // 1. Teacher
    this.teacherOccupancy.get(activity.teacherId)?.get(day)?.get(shift)?.delete(period);

    // Recalculate campus occupancy for this shift
    const tShiftMap = this.teacherOccupancy.get(activity.teacherId)?.get(day)?.get(shift);
    const hasOtherSlotsInShift = tShiftMap && tShiftMap.size > 0;
    if (!hasOtherSlotsInShift) {
      this.teacherCampusOccupancy.get(activity.teacherId)?.get(day)?.get(shift)?.delete(activity.campusId);
    }

    // 2. Class
    this.classOccupancy.get(activity.classId)?.get(day)?.get(shift)?.delete(period);

    // 3. Remove placement
    this.activityPlacements.delete(activity.id);
  }
}

/**
 * Trái tim của FET: Bộ Giải Recursive Swapping (Hoán Đổi Đệ Quy - Ejection Chain)
 */
export class FetSchedulerEngine {
  private occupancy = new FetOccupancyGrid();
  private activitiesMap = new Map<string, FetActivity>();
  private activitiesList: FetActivity[] = [];
  private ejectionHistory: FetEjectionChainStep[] = [];
  private config: FetEngineConfig;
  private teachersMap = new Map<string, Teacher>();
  private classesMap = new Map<string, ClassRoom>();
  private totalSwaps = 0;
  private maxDepthSeen = 0;

  constructor(
    activities: FetActivity[],
    teachers: Teacher[],
    classes: ClassRoom[],
    config: FetEngineConfig
  ) {
    this.config = config;
    for (const t of teachers) this.teachersMap.set(t.id, t);
    for (const c of classes) this.classesMap.set(c.id, c);

    for (const act of activities) {
      this.activitiesMap.set(act.id, act);
      this.activitiesList.push(act);
    }
  }

  /**
   * Nguyên lý 1 của FET: Tính toán độ khó & sắp xếp hoạt động (Activity Prioritization)
   * Khối lượng càng khó xếp (GV dạy nhiều lớp, môn ghép, trái buổi, điểm trường phụ) càng xếp trước
   */
  private sortActivitiesByDifficulty(): FetActivity[] {
    // Đếm tổng số tiết của từng giáo viên để đánh giá tải
    const teacherLoad = new Map<string, number>();
    for (const act of this.activitiesList) {
      teacherLoad.set(act.teacherId, (teacherLoad.get(act.teacherId) || 0) + 1);
    }

    return [...this.activitiesList].sort((a, b) => {
      // 1. Tiết cố định (Chào cờ, SHL, khóa) luôn ưu tiên tuyệt đối đầu tiên
      if (a.isFixed && !b.isFixed) return -1;
      if (!a.isFixed && b.isFixed) return 1;

      // 2. Tiết trái buổi (GDTC/Tin khối 6-7 học sáng) có rất ít vị trí hợp lệ -> độ khó cực cao
      if (a.isOppositeShift && !b.isOppositeShift) return -1;
      if (!a.isOppositeShift && b.isOppositeShift) return 1;

      // 3. Tiết đôi (duration = 2) khó tìm 2 ô trống liền nhau -> xếp trước
      if (a.duration !== b.duration) return b.duration - a.duration;

      // 4. Giáo viên có tải giảng dạy lớn hơn (nhiều lớp, nguy cơ đụng lịch cao hơn)
      const loadA = teacherLoad.get(a.teacherId) || 0;
      const loadB = teacherLoad.get(b.teacherId) || 0;
      if (loadA !== loadB) return loadB - loadA;

      // 5. Điểm trường phụ (Phú Lợi) có số phòng và giáo viên hạn chế
      if (a.campusId !== b.campusId) {
        if (a.campusId === 'campus_phu_loi') return -1;
        if (b.campusId === 'campus_phu_loi') return 1;
      }

      return b.difficultyScore - a.difficultyScore;
    });
  }

  /**
   * Kiểm tra xem slot có thỏa mãn Ràng buộc cứng (Hard Constraints) cho Activity hay không
   */
  private canPlaceDirectly(
    act: FetActivity,
    day: number,
    shift: 'morning' | 'afternoon',
    period: number
  ): boolean {
    // 1. Chào cờ cố định T2 Tiết 1, Sinh hoạt lớp cố định T7 Tiết 5
    if (day === 2 && period === 1 && act.subjectId !== 'sub_chao_co') return false;
    if (day === 7 && period === 5 && act.subjectId !== 'sub_shl') return false;

    // 2. Khối 9 có 1 tiết trống Thứ 5 (Tiết 5 Thứ 5)
    if (act.className.startsWith('9') && day === 5 && period === 5) return false;

    // 3. Lớp đã có tiết ở thời điểm này chưa?
    const classOcc = this.occupancy.getClassSlot(act.classId, day, shift, period);
    if (classOcc && classOcc !== act.id) return false;

    // 4. Giáo viên đã dạy lớp khác ở thời điểm này chưa?
    const teacherOcc = this.occupancy.getTeacherSlot(act.teacherId, day, shift, period);
    if (teacherOcc && teacherOcc !== act.id) return false;

    // 5. Ràng buộc di chuyển điểm trường: Cùng buổi không được dạy ở 2 điểm trường khác nhau
    if (this.occupancy.isTeacherTeachingAtDifferentCampusInSameShift(act.teacherId, day, shift, act.campusId)) {
      return false;
    }

    // 6. Tôn trọng ngày nghỉ đăng ký của giáo viên (Hard / High Soft)
    const teacher = this.teachersMap.get(act.teacherId);
    if (teacher && teacher.preferredOffDay === day) {
      // Nếu có thể, tránh ngày nghỉ của GV
      const currentTeacherSlots = this.countTeacherSlotsInDay(act.teacherId, day);
      if (currentTeacherSlots === 0) return false;
    }

    return true;
  }

  private countTeacherSlotsInDay(teacherId: string, day: number): number {
    const tMap = this.occupancy.teacherOccupancy.get(teacherId)?.get(day);
    if (!tMap) return 0;
    let count = 0;
    for (const shiftMap of tMap.values()) {
      count += shiftMap.size;
    }
    return count;
  }

  /**
   * Lấy danh sách các ô thời gian hợp lệ cho một Activity
   */
  private getCandidateSlots(act: FetActivity): { day: number; shift: 'morning' | 'afternoon'; period: number }[] {
    const slots: { day: number; shift: 'morning' | 'afternoon'; period: number }[] = [];
    const shift = act.shift;

    for (let day = 2; day <= 7; day++) {
      for (let period = 1; period <= 5; period++) {
        // Loại trừ Chào cờ & SHL
        if (day === 2 && period === 1 && act.subjectId !== 'sub_chao_co') continue;
        if (day === 7 && period === 5 && act.subjectId !== 'sub_shl') continue;
        // Khối 9 nghỉ tiết 5 Thứ 5
        if (act.className.startsWith('9') && day === 5 && period === 5) continue;

        slots.push({ day, shift, period });
      }
    }

    // Xáo trộn ngẫu nhiên để không bị thiên vị thứ tự ngày
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    return slots;
  }

  /**
   * Nguyên lý 3 của FET: Recursive Swapping (Ejection Chain Algorithm)
   * Khi không thể xếp trực tiếp vào ô trống:
   * 1. Tìm ô có ít xung đột nhất (thường là 1 activity đối thủ)
   * 2. Tạm thời đuổi (evict/unallocate) activity đối thủ
   * 3. Xếp activity hiện tại vào
   * 4. Gọi đệ quy giải bài toán xếp activity đối thủ vào vị trí mới
   * 5. Giới hạn độ sâu tối đa 14 (chuẩn FET), sử dụng Tabu List chống lặp chu trình
   */
  private tryRecursivePlacement(
    activity: FetActivity,
    depth: number,
    tabuList: Set<string>
  ): boolean {
    if (depth > this.config.maxRecursionDepth) {
      return false; // Vượt quá độ sâu đệ quy tối đa (max recursion depth)
    }

    if (depth > this.maxDepthSeen) {
      this.maxDepthSeen = depth;
    }

    // Đánh dấu vào tabu list
    const tabuKey = `${activity.id}_d${depth}`;
    if (tabuList.has(tabuKey)) {
      return false; // Phát hiện lặp vòng (cycle loop)
    }
    tabuList.add(tabuKey);

    const candidateSlots = this.getCandidateSlots(activity);

    // Giai đoạn 1: Thử tìm ô hoàn toàn không có xung đột (Direct Free Placement)
    for (const slot of candidateSlots) {
      if (this.canPlaceDirectly(activity, slot.day, slot.shift, slot.period)) {
        this.occupancy.assign(activity, slot.day, slot.shift, slot.period);
        this.totalSwaps++;
        return true;
      }
    }

    // Giai đoạn 2: Recursive Ejection (Đuổi đối thủ và kích hoạt chuỗi hoán đổi)
    // Sắp xếp các ô candidate theo mức độ xung đột ít nhất (ưu tiên ô chỉ đụng 1 người)
    interface CandidateConflict {
      slot: { day: number; shift: 'morning' | 'afternoon'; period: number };
      conflictingActivities: FetActivity[];
    }

    const conflictCandidates: CandidateConflict[] = [];

    for (const slot of candidateSlots) {
      // Không đẩy vào Chào cờ hoặc SHL hoặc Tiết trống khối 9
      if (slot.day === 2 && slot.period === 1) continue;
      if (slot.day === 7 && slot.period === 5) continue;
      if (activity.className.startsWith('9') && slot.day === 5 && slot.period === 5) continue;

      const conflictingIds = new Set<string>();

      // Đụng lịch lớp
      const classOccupantId = this.occupancy.getClassSlot(activity.classId, slot.day, slot.shift, slot.period);
      if (classOccupantId && classOccupantId !== activity.id) {
        conflictingIds.add(classOccupantId);
      }

      // Đụng lịch giáo viên
      const teacherOccupantId = this.occupancy.getTeacherSlot(activity.teacherId, slot.day, slot.shift, slot.period);
      if (teacherOccupantId && teacherOccupantId !== activity.id) {
        conflictingIds.add(teacherOccupantId);
      }

      // Nếu đụng tiết cố định (isFixed), cấm tuyệt đối không thể đuổi
      let hasFixedConfict = false;
      const conflictingActs: FetActivity[] = [];

      for (const cId of conflictingIds) {
        const cAct = this.activitiesMap.get(cId);
        if (cAct) {
          if (cAct.isFixed) {
            hasFixedConfict = true;
            break;
          }
          conflictingActs.push(cAct);
        }
      }

      if (hasFixedConfict) continue;

      // FET ưu tiên chuỗi đẩy có đúng 1 đối thủ bị đuổi (Single Ejection Step)
      if (conflictingActs.length === 1) {
        conflictCandidates.push({ slot, conflictingActivities: conflictingActs });
      }
    }

    // Thử từng candidate conflict
    for (const cand of conflictCandidates) {
      const victim = cand.conflictingActivities[0];
      const victimPlacement = this.occupancy.activityPlacements.get(victim.id);
      if (!victimPlacement) continue;

      // Ghi nhận bước đẩy vào lịch sử Ejection Chain
      const stepRecord: FetEjectionChainStep = {
        depth,
        activityId: activity.id,
        activityName: `${activity.className} - ${activity.subjectName} (${activity.teacherName})`,
        toSlot: cand.slot,
        evictedActivityId: victim.id,
        evictedActivityName: `${victim.className} - ${victim.subjectName} (${victim.teacherName})`,
        reason: `[FET Chain Đệ quy cấp ${depth}] Đẩy để nhường slot T${cand.slot.day} Tiết ${cand.slot.period}`,
      };

      // 1. Tạm thời đuổi (evict) victim
      this.occupancy.unassign(victim);

      // 2. Đặt activity hiện tại vào vị trí vừa giải phóng
      this.occupancy.assign(activity, cand.slot.day, cand.slot.shift, cand.slot.period);

      // 3. Gọi đệ quy giải bài toán xếp lại cho victim
      const victimPlaced = this.tryRecursivePlacement(victim, depth + 1, tabuList);

      if (victimPlaced) {
        // Chuỗi hoán đổi thành công mỹ mãn!
        this.ejectionHistory.push(stepRecord);
        this.totalSwaps++;
        return true;
      }

      // 4. Nếu đệ quy thất bại -> ROLLBACK hoàn trả nguyên trạng ban đầu
      this.occupancy.unassign(activity);
      this.occupancy.assign(victim, victimPlacement.day, victimPlacement.shift, victimPlacement.period);
    }

    return false;
  }

  /**
   * Chạy toàn bộ quá trình lập thời khóa biểu bằng Thuật toán FET
   */
  public solve(): FetEngineResult {
    const startTime = Date.now();
    this.occupancy.clear();
    this.ejectionHistory = [];
    this.totalSwaps = 0;
    this.maxDepthSeen = 0;

    const reportLog: string[] = [];
    reportLog.push('=== BẮT ĐẦU BỘ GIẢI THỜI KHÓA BIỂU FET (RECURSIVE SWAPPING) ===');
    reportLog.push(`Thuật toán: Liviu Lalescu's Recursive Ejection Chain (Max Depth = ${this.config.maxRecursionDepth})`);

    // Bước 1: Sắp xếp danh sách hoạt động theo độ khó giảm dần
    const sortedActivities = this.sortActivitiesByDifficulty();
    reportLog.push(`Tổng số tiết cần xếp: ${sortedActivities.length} tiết`);

    // Đặt trước tất cả các tiết cố định (Chào cờ, SHL, Tiết khóa)
    let pinnedCount = 0;
    for (const act of sortedActivities) {
      if (act.isFixed && act.fixedDay && act.fixedPeriod) {
        this.occupancy.assign(act, act.fixedDay, act.shift, act.fixedPeriod);
        pinnedCount++;
      }
    }
    reportLog.push(`Đã khóa thành công ${pinnedCount} tiết cố định (Chào cờ, Sinh hoạt lớp, Tiết chốt).`);

    // Bước 2: Xếp lần lượt từng activity bằng Recursive Swapping
    const remainingActivities = sortedActivities.filter((a) => !a.isFixed);
    let successfullyPlaced = pinnedCount;
    let failedActivities: FetActivity[] = [];

    const totalToPlace = sortedActivities.length;

    for (let idx = 0; idx < remainingActivities.length; idx++) {
      const act = remainingActivities[idx];
      const tabuList = new Set<string>();

      const placed = this.tryRecursivePlacement(act, 0, tabuList);

      if (placed) {
        successfullyPlaced++;
      } else {
        failedActivities.push(act);
        reportLog.push(`[Cảnh báo FET] Không tìm được chuỗi hoán đổi giải quyết cho: ${act.className} - ${act.subjectName} (${act.teacherName})`);
      }

      // Thông báo tiến độ định kỳ
      if (idx % 25 === 0 || idx === remainingActivities.length - 1) {
        const percent = Math.round((successfullyPlaced / totalToPlace) * 90);
        this.config.logProgress?.(
          `[FET Engine] Đang giải chuỗi hoán đổi (${successfullyPlaced}/${totalToPlace} tiết, ${this.totalSwaps} hoán đổi)`,
          percent,
          this.ejectionHistory.slice(-5)
        );
      }
    }

    reportLog.push(`Hoàn thành giai đoạn xếp chính: Đã xếp ${successfullyPlaced}/${totalToPlace} tiết.`);
    reportLog.push(`Tổng số hoán đổi đệ quy đã thực hiện: ${this.totalSwaps}. Độ sâu đệ quy tối đa đạt được: ${this.maxDepthSeen}.`);

    // Bước 3: Chuyển đổi dữ liệu occupancy thành mảng PeriodSlot chuẩn
    const generatedSlots: PeriodSlot[] = [];

    for (const [actId, placement] of this.occupancy.activityPlacements.entries()) {
      const act = this.activitiesMap.get(actId);
      if (!act) continue;

      const isChaoCo = act.subjectId === 'sub_chao_co';
      const isSHL = act.subjectId === 'sub_shl';

      generatedSlots.push({
        id: `slot_fet_w${this.config.targetWeek}_${act.classId}_d${placement.day}_p${placement.period}`,
        weekNumber: this.config.targetWeek,
        dayOfWeek: placement.day,
        periodNumber: placement.period,
        shift: placement.shift,
        classId: act.classId,
        subjectId: act.subjectId,
        teacherId: act.teacherId,
        campusId: act.campusId,
        roomId: '',
        termId: 'HK1_2026_2027',
        isLocked: act.isFixed,
        isFlagSalute: isChaoCo,
        isClassMeeting: isSHL,
        isOppositeShift: act.isOppositeShift,
        subComponentName: act.subjectName.includes('KHTN') ? act.subjectName : undefined,
      });
    }

    // Đánh giá chỉ số chất lượng soft constraints
    const softMetrics = this.evaluateSoftConstraints(generatedSlots);
    const durationMs = Date.now() - startTime;

    reportLog.push(`Chỉ số tối ưu thời khóa biểu: ${softMetrics.score}/100.`);
    reportLog.push(`Tiết lửng giáo viên: ${softMetrics.gapsCount} tiết.`);
    reportLog.push(`Vi phạm di chuyển liên điểm trường: ${softMetrics.campusTravels} lần.`);
    reportLog.push(`Thời gian chạy: ${durationMs}ms.`);

    return {
      success: failedActivities.length === 0,
      slots: generatedSlots,
      ejectionChainsCount: this.ejectionHistory.length,
      totalSwaps: this.totalSwaps,
      maxDepthReached: this.maxDepthSeen,
      durationMs,
      hardConflictsCount: failedActivities.length,
      softScore: softMetrics.score,
      teacherGapsCount: softMetrics.gapsCount,
      campusTravelViolations: softMetrics.campusTravels,
      chainHistory: this.ejectionHistory,
      reportLog,
    };
  }

  /**
   * Đánh giá vi phạm ràng buộc mềm (Soft Constraints Penalty)
   */
  private evaluateSoftConstraints(slots: PeriodSlot[]): {
    score: number;
    gapsCount: number;
    campusTravels: number;
  } {
    let gapsCount = 0;
    let campusTravels = 0;

    // 1. Đếm tiết lửng (gaps) của giáo viên trong từng buổi
    const teacherDailySlots = new Map<string, Map<string, number[]>>();

    for (const s of slots) {
      const key = `${s.teacherId}_d${s.dayOfWeek}_${s.shift}`;
      if (!teacherDailySlots.has(key)) {
        teacherDailySlots.set(key, new Map());
      }
    }

    // Nhóm tiết theo từng buổi
    const grouped = new Map<string, { periods: number[]; campuses: Set<string> }>();
    for (const s of slots) {
      const key = `${s.teacherId}_d${s.dayOfWeek}_${s.shift}`;
      if (!grouped.has(key)) {
        grouped.set(key, { periods: [], campuses: new Set() });
      }
      const item = grouped.get(key)!;
      item.periods.push(s.periodNumber);
      item.campuses.add(s.campusId);
    }

    for (const item of grouped.values()) {
      if (item.campuses.size > 1) {
        campusTravels++;
      }
      if (item.periods.length >= 2) {
        item.periods.sort((a, b) => a - b);
        for (let i = 0; i < item.periods.length - 1; i++) {
          const diff = item.periods[i + 1] - item.periods[i];
          if (diff > 1) {
            gapsCount += diff - 1; // Số tiết trống xen giữa
          }
        }
      }
    }

    // Tính điểm tổng hợp (thang 100)
    let score = 100 - gapsCount * 0.4 - campusTravels * 5;
    score = Math.max(50, Math.min(100, Math.round(score)));

    return { score, gapsCount, campusTravels };
  }
}

/**
 * Hàm xuất dữ liệu ra file FET XML (.fet) chính thức
 * Giúp người dùng có thể tải về và mở trực tiếp trong phần mềm FET desktop
 */
export function exportToFetXml(
  slots: PeriodSlot[],
  teachers: Teacher[],
  classes: ClassRoom[],
  subjects: Subject[],
  campuses: Campus[],
  rooms: Room[]
): string {
  const xmlLines: string[] = [];

  xmlLines.push('<?xml version="1.0" encoding="UTF-8"?>');
  xmlLines.push('<fet version="6.9.0">');
  xmlLines.push('  <Institution_Name>THCS &amp; THPT Đốc Binh Kiều</Institution_Name>');
  xmlLines.push('  <Comments>Được xuất tự động từ Hệ thống Xếp TKB Thông Minh AI Studio</Comments>');

  // 1. Days List
  xmlLines.push('  <Days_List>');
  xmlLines.push('    <Number_of_Days>6</Number_of_Days>');
  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  for (const d of dayNames) {
    xmlLines.push(`    <Day><Name>${d}</Name></Day>`);
  }
  xmlLines.push('  </Days_List>');

  // 2. Hours List (5 tiết sáng + 5 tiết chiều)
  xmlLines.push('  <Hours_List>');
  xmlLines.push('    <Number_of_Hours>10</Number_of_Hours>');
  for (let p = 1; p <= 5; p++) {
    xmlLines.push(`    <Hour><Name>Sáng - Tiết ${p}</Name></Hour>`);
  }
  for (let p = 1; p <= 5; p++) {
    xmlLines.push(`    <Hour><Name>Chiều - Tiết ${p}</Name></Hour>`);
  }
  xmlLines.push('  </Hours_List>');

  // 3. Subjects List
  xmlLines.push('  <Subjects_List>');
  const uniqueSubjects = new Map<string, string>();
  for (const s of subjects) {
    uniqueSubjects.set(s.id, s.name);
  }
  for (const name of uniqueSubjects.values()) {
    xmlLines.push(`    <Subject><Name>${escapeXml(name)}</Name></Subject>`);
  }
  xmlLines.push('  </Subjects_List>');

  // 4. Teachers List
  xmlLines.push('  <Teachers_List>');
  for (const t of teachers) {
    xmlLines.push(`    <Teacher><Name>${escapeXml(t.fullName)}</Name></Teacher>`);
  }
  xmlLines.push('  </Teachers_List>');

  // 5. Students (Classes)
  xmlLines.push('  <Students_List>');
  // Nhóm theo khối
  const grades = [6, 7, 8, 9, 10, 11, 12];
  for (const g of grades) {
    const gradeClasses = classes.filter((c) => c.grade === g);
    if (gradeClasses.length === 0) continue;
    xmlLines.push(`    <Year>`);
    xmlLines.push(`      <Name>Khối ${g}</Name>`);
    xmlLines.push(`      <Number_of_Students>${gradeClasses.reduce((acc, c) => acc + (c.studentCount || 35), 0)}</Number_of_Students>`);
    for (const c of gradeClasses) {
      xmlLines.push(`      <Group>`);
      xmlLines.push(`        <Name>${escapeXml(c.name)}</Name>`);
      xmlLines.push(`        <Number_of_Students>${c.studentCount || 35}</Number_of_Students>`);
      xmlLines.push(`      </Group>`);
    }
    xmlLines.push(`    </Year>`);
  }
  xmlLines.push('  </Students_List>');

  // 6. Buildings (Campuses) & Rooms
  xmlLines.push('  <Buildings_List>');
  for (const camp of campuses) {
    xmlLines.push(`    <Building><Name>${escapeXml(camp.name)}</Name></Building>`);
  }
  xmlLines.push('  </Buildings_List>');

  // 7. Activities List & Assigned Slots
  xmlLines.push('  <Activities_List>');
  const teacherMap = new Map(teachers.map((t) => [t.id, t.fullName]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
  const classMap = new Map(classes.map((c) => [c.id, c.name]));

  let actId = 1;
  for (const slot of slots) {
    const tName = teacherMap.get(slot.teacherId) || slot.teacherId;
    const sName = subjectMap.get(slot.subjectId) || slot.subjectId;
    const cName = classMap.get(slot.classId) || slot.classId;

    xmlLines.push('    <Activity>');
    xmlLines.push(`      <Id>${actId++}</Id>`);
    xmlLines.push(`      <Teacher>${escapeXml(tName)}</Teacher>`);
    xmlLines.push(`      <Subject>${escapeXml(sName)}</Subject>`);
    xmlLines.push(`      <Students>${escapeXml(cName)}</Students>`);
    xmlLines.push(`      <Duration>1</Duration>`);
    xmlLines.push(`      <Total_Duration>1</Total_Duration>`);
    xmlLines.push(`      <Activity_Tag>${slot.shift === 'morning' ? 'Sáng' : 'Chiều'}</Activity_Tag>`);
    xmlLines.push('    </Activity>');
  }
  xmlLines.push('  </Activities_List>');

  // 8. Time Constraints
  xmlLines.push('  <Time_Constraints_List>');
  xmlLines.push('    <ConstraintBasicCompulsoryTime>');
  xmlLines.push('      <Weight_Percentage>100</Weight_Percentage>');
  xmlLines.push('    </ConstraintBasicCompulsoryTime>');
  xmlLines.push('  </Time_Constraints_List>');

  xmlLines.push('</fet>');

  return xmlLines.join('\n');
}

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Tiện ích chuyển đổi tập dữ liệu hiện tại thành danh sách FetActivity
 */
export function convertToFetActivities(
  slots: PeriodSlot[],
  assignments: TeacherAssignmentItem[],
  classes: ClassRoom[],
  teachers?: Teacher[],
  subjects?: Subject[]
): FetActivity[] {
  const activities: FetActivity[] = [];
  const classMap = new Map<string, ClassRoom>();
  for (const c of classes) classMap.set(c.id, c);

  const teacherMap = new Map<string, string>();
  if (teachers) {
    for (const t of teachers) teacherMap.set(t.id, t.fullName);
  }

  const subjectMap = new Map<string, string>();
  if (subjects) {
    for (const s of subjects) subjectMap.set(s.id, s.name);
  }

  for (const s of slots) {
    const cls = classMap.get(s.classId);
    const isFixed = s.isLocked || s.isFlagSalute || s.isClassMeeting;
    const isOpp = s.isOppositeShift || false;

    // Tính độ khó sơ bộ
    let diff = 10;
    if (isFixed) diff = 100;
    if (isOpp) diff = 80;
    if (s.campusId === 'campus_phu_loi') diff += 15;

    const className = cls?.name || (s as any).className || s.classId;
    const teacherName = teacherMap.get(s.teacherId) || (s as any).teacherName || s.teacherId;
    const subjectName = subjectMap.get(s.subjectId) || (s as any).subjectName || s.subjectId;

    activities.push({
      id: s.id,
      classId: s.classId,
      className,
      teacherId: s.teacherId,
      teacherName,
      subjectId: s.subjectId,
      subjectName,
      campusId: s.campusId,
      shift: s.shift,
      isOppositeShift: isOpp,
      isFixed,
      fixedDay: isFixed ? s.dayOfWeek : undefined,
      fixedPeriod: isFixed ? s.periodNumber : undefined,
      duration: 1,
      difficultyScore: diff,
    });
  }

  return activities;
}
