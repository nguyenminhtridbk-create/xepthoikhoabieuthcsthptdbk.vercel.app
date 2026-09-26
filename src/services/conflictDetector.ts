import { PeriodSlot, Teacher, ClassRoom, Room, Campus, ConstraintRule, ScheduleConflict, Subject } from '../types';

export interface ValidationSummary {
  hardConflictsCount: number;
  softWarningsCount: number;
  conflicts: ScheduleConflict[];
  teacherGapStats: { teacherId: string; teacherName: string; totalGaps: number }[];
  campusTravelIssues: { teacherId: string; teacherName: string; day: number; fromCampus: string; toCampus: string }[];
}

/**
 * Chuẩn hóa ca học và tiết học thực tế (1..5 cho buổi sáng, 1..5 cho buổi chiều)
 */
export function getSlotShiftAndPeriod(slot: PeriodSlot): { shift: 'morning' | 'afternoon'; period: number } {
  if (slot.periodNumber > 5) {
    return { shift: 'afternoon', period: slot.periodNumber - 5 };
  }
  return { shift: slot.shift || 'morning', period: slot.periodNumber };
}

export function detectAllConflicts(
  slots: PeriodSlot[],
  teachers: Teacher[],
  classes: ClassRoom[],
  _rooms: Room[], // Đã bỏ chức năng phòng học theo yêu cầu của nhà trường
  campuses: Campus[],
  _subjects: Subject[],
  rules: ConstraintRule[],
  weekNumber: number
): ValidationSummary {
  const conflicts: ScheduleConflict[] = [];
  const teacherMap = new Map<string, Teacher>(teachers.map((t) => [t.id, t]));
  const classMap = new Map<string, ClassRoom>(classes.map((c) => [c.id, c]));
  const campusMap = new Map<string, Campus>(campuses.map((cp) => [cp.id, cp]));

  // Lọc các slot của tuần hiện tại
  const currentWeekSlots = slots.filter((s) => s.weekNumber === weekNumber);

  // 1. HARD RULE: NO_TEACHER_COLLISION (Giáo viên không dạy 2 lớp cùng 1 thời điểm)
  // Phải phân biệt rõ Buổi Sáng (tiết 1-5) và Buổi Chiều (tiết 1-5)
  const isTeacherCollisionActive = rules.find((r) => r.code === 'NO_TEACHER_COLLISION')?.isActive ?? true;
  if (isTeacherCollisionActive) {
    const teacherSlotMap = new Map<string, PeriodSlot[]>();
    for (const slot of currentWeekSlots) {
      if (!slot.teacherId) continue;
      const { shift, period } = getSlotShiftAndPeriod(slot);
      const key = `${slot.teacherId}_d${slot.dayOfWeek}_${shift}_p${period}`;
      const list = teacherSlotMap.get(key) || [];
      list.push(slot);
      teacherSlotMap.set(key, list);
    }

    teacherSlotMap.forEach((matchedSlots, key) => {
      if (matchedSlots.length > 1) {
        const teacher = teacherMap.get(matchedSlots[0].teacherId);
        const day = matchedSlots[0].dayOfWeek;
        const { shift, period } = getSlotShiftAndPeriod(matchedSlots[0]);
        const shiftLabel = shift === 'morning' ? 'Sáng' : 'Chiều';
        const classNames = matchedSlots
          .map((s) => classMap.get(s.classId)?.name || s.classId)
          .join(', ');

        conflicts.push({
          id: `conflict_teacher_${key}`,
          type: 'hard_error',
          ruleCode: 'NO_TEACHER_COLLISION',
          title: `Trùng tiết giáo viên: ${teacher?.fullName || 'GV'}`,
          description: `Giáo viên ${teacher?.fullName} bị xếp dạy đồng thời ở ${matchedSlots.length} lớp (${classNames}) vào Thứ ${day}, ${shiftLabel} Tiết ${period}.`,
          dayOfWeek: day,
          periodNumber: period,
          affectedTeacherIds: [matchedSlots[0].teacherId],
          affectedClassIds: matchedSlots.map((s) => s.classId),
          affectedCampuses: Array.from(new Set(matchedSlots.map((s) => s.campusId))),
          slotIds: matchedSlots.map((s) => s.id),
        });
      }
    });
  }

  // 2. HARD RULE: NO_CLASS_COLLISION (Lớp học không trùng 2 môn cùng 1 thời điểm)
  const isClassCollisionActive = rules.find((r) => r.code === 'NO_CLASS_COLLISION')?.isActive ?? true;
  if (isClassCollisionActive) {
    const classSlotMap = new Map<string, PeriodSlot[]>();
    for (const slot of currentWeekSlots) {
      if (!slot.classId) continue;
      const { shift, period } = getSlotShiftAndPeriod(slot);
      const key = `${slot.classId}_d${slot.dayOfWeek}_${shift}_p${period}`;
      const list = classSlotMap.get(key) || [];
      list.push(slot);
      classSlotMap.set(key, list);
    }

    classSlotMap.forEach((matchedSlots, key) => {
      if (matchedSlots.length > 1) {
        const cls = classMap.get(matchedSlots[0].classId);
        const day = matchedSlots[0].dayOfWeek;
        const { shift, period } = getSlotShiftAndPeriod(matchedSlots[0]);
        const shiftLabel = shift === 'morning' ? 'Sáng' : 'Chiều';
        const teacherNames = matchedSlots
          .map((s) => teacherMap.get(s.teacherId)?.fullName || s.teacherId)
          .join(' và ');

        conflicts.push({
          id: `conflict_class_${key}`,
          type: 'hard_error',
          ruleCode: 'NO_CLASS_COLLISION',
          title: `Trùng môn học lớp: ${cls?.name || 'Lớp'}`,
          description: `Lớp ${cls?.name} bị xếp trùng ${matchedSlots.length} môn (${teacherNames}) vào Thứ ${day}, ${shiftLabel} Tiết ${period}.`,
          dayOfWeek: day,
          periodNumber: period,
          affectedTeacherIds: matchedSlots.map((s) => s.teacherId),
          affectedClassIds: [matchedSlots[0].classId],
          affectedCampuses: [matchedSlots[0].campusId],
          slotIds: matchedSlots.map((s) => s.id),
        });
      }
    });
  }

  // 3. ĐÃ LOẠI BỎ HOÀN TOÀN QUY TẮC NO_ROOM_COLLISION THEO YÊU CẦU CỦA NGƯỜI DÙNG:
  // Nhà trường không quản lý và không xếp phòng học.

  // 4. HARD RULE: CAMPUS_TRAVEL_GAP (Di chuyển giữa các điểm trường TRONG CÙNG MỘT BUỔI)
  const campusTravelIssues: { teacherId: string; teacherName: string; day: number; fromCampus: string; toCampus: string }[] = [];
  const isCampusTravelActive = rules.find((r) => r.code === 'CAMPUS_TRAVEL_GAP')?.isActive ?? true;
  if (isCampusTravelActive) {
    teachers.forEach((teacher) => {
      for (let day = 2; day <= 7; day++) {
        // Kiểm tra riêng trong từng buổi (Sáng riêng, Chiều riêng)
        (['morning', 'afternoon'] as const).forEach((shift) => {
          const sessionSlots = currentWeekSlots
            .filter((s) => {
              if (s.teacherId !== teacher.id || s.dayOfWeek !== day) return false;
              const sp = getSlotShiftAndPeriod(s);
              return sp.shift === shift;
            })
            .sort((a, b) => getSlotShiftAndPeriod(a).period - getSlotShiftAndPeriod(b).period);

          for (let i = 0; i < sessionSlots.length - 1; i++) {
            const slot1 = sessionSlots[i];
            const slot2 = sessionSlots[i + 1];

            if (slot1.campusId !== slot2.campusId) {
              const p1 = getSlotShiftAndPeriod(slot1).period;
              const p2 = getSlotShiftAndPeriod(slot2).period;
              const periodDiff = p2 - p1;
              const campus1 = campusMap.get(slot1.campusId)?.name || slot1.campusId;
              const campus2 = campusMap.get(slot2.campusId)?.name || slot2.campusId;
              const shiftLabel = shift === 'morning' ? 'Sáng' : 'Chiều';

              // Trong cùng 1 buổi, chỉ khi khoảng cách <= 1 tiết (liền kề hoặc quá sát) mới là không kịp di chuyển
              if (periodDiff <= 1) {
                campusTravelIssues.push({
                  teacherId: teacher.id,
                  teacherName: teacher.fullName,
                  day,
                  fromCampus: campus1,
                  toCampus: campus2,
                });

                conflicts.push({
                  id: `conflict_travel_${teacher.id}_d${day}_${shift}_p${p1}_${p2}`,
                  type: 'hard_error',
                  ruleCode: 'CAMPUS_TRAVEL_GAP',
                  title: `Xung đột đổi điểm trường: ${teacher.fullName}`,
                  description: `Giáo viên dạy Tiết ${p1} tại [${campus1}] và Tiết ${p2} tại [${campus2}] trong cùng buổi ${shiftLabel} Thứ ${day}. Khoảng cách chỉ ${periodDiff} tiết không đủ để di chuyển giữa các cơ sở.`,
                  dayOfWeek: day,
                  periodNumber: p2,
                  affectedTeacherIds: [teacher.id],
                  affectedClassIds: [slot1.classId, slot2.classId],
                  affectedCampuses: [slot1.campusId, slot2.campusId],
                  slotIds: [slot1.id, slot2.id],
                });
              }
            }
          }
        });
      }
    });
  }

  // 5. HARD RULE: MAX_PERIODS_PER_DAY (Giới hạn số tiết trong 1 ngày)
  const isMaxPeriodsActive = rules.find((r) => r.code === 'MAX_PERIODS_PER_DAY')?.isActive ?? true;
  if (isMaxPeriodsActive) {
    teachers.forEach((teacher) => {
      // Một ngày giáo viên có thể dạy tối đa 8 tiết (Sáng 4-5, Chiều 3-4 khi dạy cả 2 ca)
      const maxLimit = Math.max(teacher.maxPeriodsPerDay || 0, 8);
      for (let day = 2; day <= 7; day++) {
        const daySlots = currentWeekSlots.filter((s) => s.teacherId === teacher.id && s.dayOfWeek === day);
        if (daySlots.length > maxLimit) {
          conflicts.push({
            id: `conflict_max_periods_${teacher.id}_d${day}`,
            type: 'hard_error',
            ruleCode: 'MAX_PERIODS_PER_DAY',
            title: `Quá tải tiết dạy: ${teacher.fullName}`,
            description: `Giáo viên ${teacher.fullName} được xếp ${daySlots.length} tiết vào Thứ ${day} (giới hạn an toàn: ${maxLimit} tiết/ngày).`,
            dayOfWeek: day,
            periodNumber: getSlotShiftAndPeriod(daySlots[0]).period,
            affectedTeacherIds: [teacher.id],
            affectedClassIds: daySlots.map((s) => s.classId),
            affectedCampuses: Array.from(new Set(daySlots.map((s) => s.campusId))),
            slotIds: daySlots.map((s) => s.id),
          });
        }
      }
    });
  }

  // 6. SOFT RULE: MINIMIZE_TEACHER_GAPS (Thống kê tiết trống của giáo viên)
  // Chỉ tính vào thống kê số liệu để nhà trường theo dõi tối ưu, KHÔNG gắn cờ làm vàng các ô TKB lớp
  const teacherGapStats: { teacherId: string; teacherName: string; totalGaps: number }[] = [];
  teachers.forEach((teacher) => {
    let teacherTotalGaps = 0;
    for (let day = 2; day <= 7; day++) {
      (['morning', 'afternoon'] as const).forEach((shift) => {
        const sessionSlots = currentWeekSlots
          .filter((s) => s.teacherId === teacher.id && s.dayOfWeek === day && getSlotShiftAndPeriod(s).shift === shift)
          .sort((a, b) => getSlotShiftAndPeriod(a).period - getSlotShiftAndPeriod(b).period);

        if (sessionSlots.length >= 2) {
          for (let i = 0; i < sessionSlots.length - 1; i++) {
            const p1 = getSlotShiftAndPeriod(sessionSlots[i]).period;
            const p2 = getSlotShiftAndPeriod(sessionSlots[i + 1]).period;
            const gap = p2 - p1 - 1;
            if (gap > 0) {
              teacherTotalGaps += gap;
            }
          }
        }
      });
    }
    if (teacherTotalGaps > 0) {
      teacherGapStats.push({
        teacherId: teacher.id,
        teacherName: teacher.fullName,
        totalGaps: teacherTotalGaps,
      });
    }
  });

  // 7. SOFT RULE: TEACHER_OFF_DAY (Ngày nghỉ chuyên môn của giáo viên)
  const isOffDayActive = rules.find((r) => r.code === 'TEACHER_OFF_DAY')?.isActive ?? true;
  if (isOffDayActive) {
    teachers.forEach((teacher) => {
      if (teacher.preferredOffDay) {
        const offDaySlots = currentWeekSlots.filter(
          (s) => s.teacherId === teacher.id && s.dayOfWeek === teacher.preferredOffDay
        );
        if (offDaySlots.length > 0) {
          conflicts.push({
            id: `warn_offday_${teacher.id}_d${teacher.preferredOffDay}`,
            type: 'soft_warning',
            ruleCode: 'TEACHER_OFF_DAY',
            title: `Tiết dạy vào ngày nghỉ ưu tiên: ${teacher.fullName}`,
            description: `Giáo viên ${teacher.fullName} đăng ký ưu tiên nghỉ Thứ ${teacher.preferredOffDay}, đang có ${offDaySlots.length} tiết dạy.`,
            dayOfWeek: teacher.preferredOffDay,
            periodNumber: getSlotShiftAndPeriod(offDaySlots[0]).period,
            affectedTeacherIds: [teacher.id],
            affectedClassIds: offDaySlots.map((s) => s.classId),
            affectedCampuses: Array.from(new Set(offDaySlots.map((s) => s.campusId))),
            slotIds: [], // Không gắn slotIds vào ô thời khóa biểu lớp để tránh bôi vàng các tiết học hợp lệ
          });
        }
      }
    });
  }

  const hardConflictsCount = conflicts.filter((c) => c.type === 'hard_error').length;
  const softWarningsCount = conflicts.filter((c) => c.type === 'soft_warning').length;

  return {
    hardConflictsCount,
    softWarningsCount,
    conflicts,
    teacherGapStats,
    campusTravelIssues,
  };
}
