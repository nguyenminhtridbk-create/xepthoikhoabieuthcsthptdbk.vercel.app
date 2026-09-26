import {
  PeriodSlot,
  Teacher,
  ClassRoom,
  Subject,
  TeacherWeeklySchedule,
  ClassWeeklySchedule,
  VietSchoolImportResult,
} from '../types';

export interface VietSchoolTeacherRow {
  maGV: string; // VD: 'HUNGNV', 'MAITT'
  hoTen: string; // VD: 'Nguyễn Văn Hùng'
  toBoMon: string; // VD: 'KHTN', 'Toán - Tin', 'KHXH'
  monChinh: string; // VD: 'Vật lí', 'Hóa học', 'Sinh học'
  sdt?: string;
  email?: string;
}

export interface VietSchoolAssignmentRow {
  maLop: string; // VD: '6A1', '10A1'
  maMon: string; // VD: 'KHTN', 'TOAN', 'VAN', 'LS&DL'
  phanMon?: string; // VD: 'Vật lí', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lí'
  maGV: string; // VD: 'HUNGNV'
  soTietTuan: number;
}

export interface VietSchoolTimetableRow {
  thu: number; // 2 -> 7
  tiet: number; // 1 -> 5 (hoặc 1 -> 10)
  maLop: string;
  maMon: string;
  phanMon?: string;
  maGV: string;
  phong?: string;
}

export interface VietSchoolPayload {
  namHoc?: string;
  hocKy?: string;
  tuanHoc?: number;
  danhSachGiaoVien: VietSchoolTeacherRow[];
  phanCongChuyenMon: VietSchoolAssignmentRow[];
  thoiKhoaBieu: VietSchoolTimetableRow[];
}

/**
 * Mẫu dữ liệu xuất từ VietSchool để người dùng có thể thử nghiệm hoặc tham chiếu
 */
export const SAMPLE_VIETSCHOOL_EXPORT: VietSchoolPayload = {
  namHoc: '2026-2027',
  hocKy: 'HK1',
  tuanHoc: 1,
  danhSachGiaoVien: [
    { maGV: 'TRINM', hoTen: 'Nguyễn Minh Trí', toBoMon: 'BGH', monChinh: 'Toán học' },
    { maGV: 'HUNGNV', hoTen: 'Nguyễn Văn Hùng', toBoMon: 'Tổ KHTN', monChinh: 'Vật lí' },
    { maGV: 'MAITT', hoTen: 'Trần Thị Mai', toBoMon: 'Tổ KHTN', monChinh: 'Hóa học' },
    { maGV: 'LANLT', hoTen: 'Lê Thị Lan', toBoMon: 'Tổ KHTN', monChinh: 'Sinh học' },
    { maGV: 'TUANPM', hoTen: 'Phạm Minh Tuấn', toBoMon: 'Tổ KHXH', monChinh: 'Lịch sử' },
    { maGV: 'YENVH', hoTen: 'Vũ Hoàng Yến', toBoMon: 'Tổ KHXH', monChinh: 'Địa lí' },
    { maGV: 'BAODQ', hoTen: 'Đặng Quốc Bảo', toBoMon: 'Tổ Toán - Tin', monChinh: 'Toán học' },
    { maGV: 'NGANT', hoTen: 'Ngô Thanh Nga', toBoMon: 'Tổ Ngữ Văn', monChinh: 'Ngữ văn' },
  ],
  phanCongChuyenMon: [
    { maLop: '6A1', maMon: 'TOAN', maGV: 'TRINM', soTietTuan: 4 },
    { maLop: '6A1', maMon: 'KHTN', phanMon: 'Vật lí', maGV: 'HUNGNV', soTietTuan: 2 },
    { maLop: '6A1', maMon: 'KHTN', phanMon: 'Hóa học', maGV: 'MAITT', soTietTuan: 2 },
    { maLop: '6A1', maMon: 'LS&DL', phanMon: 'Lịch sử', maGV: 'TUANPM', soTietTuan: 2 },
    { maLop: '6A1', maMon: 'LS&DL', phanMon: 'Địa lí', maGV: 'YENVH', soTietTuan: 1 },
    { maLop: '6A1', maMon: 'VAN', maGV: 'NGANT', soTietTuan: 4 },
    { maLop: '10A1', maMon: 'TOAN', maGV: 'BAODQ', soTietTuan: 4 },
    { maLop: '10A1', maMon: 'CD_TOAN', maGV: 'BAODQ', soTietTuan: 1 },
    { maLop: '10A1', maMon: 'TC_HOA', maGV: 'MAITT', soTietTuan: 3 },
  ],
  thoiKhoaBieu: [
    { thu: 2, tiet: 1, maLop: '6A1', maMon: 'HDTN', maGV: 'MAITT', phong: 'Phòng 101' },
    { thu: 2, tiet: 2, maLop: '6A1', maMon: 'TOAN', maGV: 'TRINM', phong: 'Phòng 101' },
    { thu: 2, tiet: 3, maLop: '6A1', maMon: 'TOAN', maGV: 'TRINM', phong: 'Phòng 101' },
    { thu: 3, tiet: 1, maLop: '6A1', maMon: 'KHTN', phanMon: 'Vật lí', maGV: 'HUNGNV', phong: 'Lab KHTN' },
    { thu: 3, tiet: 2, maLop: '6A1', maMon: 'KHTN', phanMon: 'Vật lí', maGV: 'HUNGNV', phong: 'Lab KHTN' },
    { thu: 4, tiet: 1, maLop: '6A1', maMon: 'KHTN', phanMon: 'Hóa học', maGV: 'MAITT', phong: 'Lab KHTN' },
    { thu: 4, tiet: 2, maLop: '6A1', maMon: 'KHTN', phanMon: 'Hóa học', maGV: 'MAITT', phong: 'Lab KHTN' },
    { thu: 5, tiet: 1, maLop: '6A1', maMon: 'LS&DL', phanMon: 'Lịch sử', maGV: 'TUANPM', phong: 'Phòng 101' },
    { thu: 5, tiet: 2, maLop: '6A1', maMon: 'LS&DL', phanMon: 'Lịch sử', maGV: 'TUANPM', phong: 'Phòng 101' },
    { thu: 6, tiet: 1, maLop: '6A1', maMon: 'LS&DL', phanMon: 'Địa lí', maGV: 'YENVH', phong: 'Phòng 101' },
  ],
};

/**
 * Chuyển đổi dữ liệu thô từ VietSchool sang cấu trúc chuẩn của ứng dụng
 */
export function convertVietSchoolData(
  payload: VietSchoolPayload,
  existingTeachers: Teacher[],
  existingClasses: ClassRoom[],
  existingSubjects: Subject[],
  termId: string = 'HK1_2026_2027',
  targetWeek: number = 1
): {
  slots: PeriodSlot[];
  teacherSchedules: TeacherWeeklySchedule[];
  classSchedules: ClassWeeklySchedule[];
  resultSummary: VietSchoolImportResult;
} {
  const warnings: string[] = [];
  const teacherCodeMap = new Map<string, Teacher>();
  existingTeachers.forEach((t) => {
    teacherCodeMap.set(t.code.toUpperCase(), t);
    teacherCodeMap.set(t.id.toUpperCase(), t);
    teacherCodeMap.set(t.fullName.toLowerCase(), t);
  });

  // Ánh xạ danh sách giáo viên từ VietSchool
  let mappedTeacherCount = 0;
  payload.danhSachGiaoVien.forEach((gv) => {
    const matched =
      teacherCodeMap.get(gv.maGV.toUpperCase()) ||
      teacherCodeMap.get(gv.hoTen.toLowerCase());
    if (matched) {
      mappedTeacherCount++;
    } else {
      warnings.push(`Chưa tìm thấy hồ sơ hệ thống cho Giáo viên VietSchool: [${gv.maGV}] ${gv.hoTen}`);
    }
  });

  // Ánh xạ lớp
  const classCodeMap = new Map<string, ClassRoom>();
  existingClasses.forEach((c) => {
    classCodeMap.set(c.id.toUpperCase(), c);
    classCodeMap.set(c.name.toUpperCase(), c);
  });

  // Ánh xạ môn
  const subjectCodeMap = new Map<string, Subject>();
  existingSubjects.forEach((s) => {
    subjectCodeMap.set(s.code.toUpperCase(), s);
    subjectCodeMap.set(s.id.toUpperCase(), s);
    subjectCodeMap.set(s.name.toUpperCase(), s);
  });

  const slots: PeriodSlot[] = [];
  let khtnSplitCount = 0;
  let lsdlSplitCount = 0;

  payload.thoiKhoaBieu.forEach((row, idx) => {
    const classObj =
      classCodeMap.get(row.maLop.toUpperCase()) ||
      existingClasses.find((c) => c.name.toLowerCase().includes(row.maLop.toLowerCase()));

    if (!classObj) {
      warnings.push(`Dòng ${idx + 1}: Không tìm thấy lớp [${row.maLop}] trên hệ thống.`);
      return;
    }

    // Tìm giáo viên
    let teacherObj =
      teacherCodeMap.get(row.maGV.toUpperCase()) ||
      existingTeachers.find((t) => t.fullName.toLowerCase().includes(row.maGV.toLowerCase()));

    if (!teacherObj) {
      // Thử tìm qua bảng phân công chuyên môn
      const pc = payload.phanCongChuyenMon.find(
        (p) =>
          p.maLop.toUpperCase() === row.maLop.toUpperCase() &&
          p.maMon.toUpperCase() === row.maMon.toUpperCase() &&
          (!row.phanMon || p.phanMon === row.phanMon)
      );
      if (pc) {
        teacherObj = teacherCodeMap.get(pc.maGV.toUpperCase());
      }
    }

    if (!teacherObj) {
      warnings.push(`Dòng ${idx + 1}: Không ánh xạ được giáo viên [${row.maGV}] dạy môn [${row.maMon}] lớp [${row.maLop}].`);
    }

    // Tìm môn học
    let subjectObj =
      subjectCodeMap.get(row.maMon.toUpperCase()) ||
      existingSubjects.find(
        (s) =>
          s.code.toUpperCase().includes(row.maMon.toUpperCase()) ||
          s.name.toUpperCase().includes(row.maMon.toUpperCase())
      );

    if (!subjectObj) {
      // Fallback cho KHTN / LS&ĐL
      if (row.maMon.includes('KHTN') || (row.phanMon && ['Vật lí', 'Hóa học', 'Sinh học'].includes(row.phanMon))) {
        subjectObj = existingSubjects.find((s) => s.category === 'khtn_integrated');
      } else if (row.maMon.includes('LS') || row.maMon.includes('DL')) {
        subjectObj = existingSubjects.find((s) => s.category === 'lsdl_integrated');
      }
    }

    const subComponentName = row.phanMon
      ? `${row.maMon} - ${row.phanMon}`
      : undefined;

    if (subjectObj?.category === 'khtn_integrated') khtnSplitCount++;
    if (subjectObj?.category === 'lsdl_integrated') lsdlSplitCount++;

    const newSlot: PeriodSlot = {
      id: `slot_vs_${targetWeek}_${row.maLop}_d${row.thu}_p${row.tiet}`,
      dayOfWeek: row.thu,
      periodNumber: row.tiet,
      shift: classObj.shift || 'morning',
      classId: classObj.id,
      subjectId: subjectObj?.id || 'sub_toan',
      subComponentName: subComponentName,
      teacherId: teacherObj?.id || existingTeachers[0]?.id,
      campusId: classObj.campusId,
      roomId: classObj.campusId === 'campus_a' ? 'room_a_101' : 'room_b_201',
      weekNumber: targetWeek,
      termId: termId,
      isFlagSalute: row.thu === 2 && row.tiet === 1,
      isClassMeeting: row.thu === 7 && row.tiet === 5,
    };

    slots.push(newSlot);
  });

  // Gom nhóm theo Giáo viên & Tuần học (Tối ưu Firestore read)
  const teacherWeeklyMap = new Map<string, PeriodSlot[]>();
  slots.forEach((slot) => {
    const list = teacherWeeklyMap.get(slot.teacherId) || [];
    list.push(slot);
    teacherWeeklyMap.set(slot.teacherId, list);
  });

  const teacherSchedules: TeacherWeeklySchedule[] = [];
  teacherWeeklyMap.forEach((teacherSlots, tId) => {
    teacherSchedules.push({
      id: `${tId}_w${targetWeek}`,
      teacherId: tId,
      weekNumber: targetWeek,
      termId: termId,
      totalPeriods: teacherSlots.length,
      slots: teacherSlots,
      updatedAt: new Date().toISOString(),
    });
  });

  // Gom nhóm theo Lớp & Tuần học
  const classWeeklyMap = new Map<string, PeriodSlot[]>();
  slots.forEach((slot) => {
    const list = classWeeklyMap.get(slot.classId) || [];
    list.push(slot);
    classWeeklyMap.set(slot.classId, list);
  });

  const classSchedules: ClassWeeklySchedule[] = [];
  classWeeklyMap.forEach((classSlots, cId) => {
    classSchedules.push({
      id: `${cId}_w${targetWeek}`,
      classId: cId,
      weekNumber: targetWeek,
      termId: termId,
      totalPeriods: classSlots.length,
      slots: classSlots,
      updatedAt: new Date().toISOString(),
    });
  });

  const integrityCheckPassed = warnings.length === 0;

  return {
    slots,
    teacherSchedules,
    classSchedules,
    resultSummary: {
      success: slots.length > 0,
      totalClasses: classWeeklyMap.size,
      totalTeachers: teacherWeeklyMap.size,
      totalSlots: slots.length,
      assignedSubjectsCount: payload.phanCongChuyenMon.length,
      warnings,
      integrityCheckPassed,
      mappedTeacherCount,
      khtnSplitCount,
      lsdlSplitCount,
    },
  };
}
