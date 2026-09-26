// Sinh Thời Khóa Biểu Tuần 5 (Minimal Perturbation từ Tuần 4 thực tế)
// Áp dụng đúng "Quy tắc thay đổi theo từng tuần học" trong QUY TẮC RÀNG BUỘC TKB.docx:
//  - KHTN 8: Tuần 5 = Lý 1 / Sinh 2 / Hóa 1 (Tuần 4 là Lý 2 / Sinh 0 / Hóa 2)
//  - KHTN 9: Tuần 5 = Lý 2 / Sinh 1 / Hóa 1 (không đổi so với Tuần 4)
//  - Lịch sử & Địa lí (THCS, các lớp tách 2 GV): Tuần 5 = Sử 1 / Địa 2 (Tuần 4 là Sử 2 / Địa 1)
//  - Thầy Thái Văn Tiến: Tuần 5 không nằm trong danh sách "Lịch ở nhà dạy" (7,8,11,12,15,16,20,22,26,27,30,31,34)
//    => Tuần 5 thầy vắng (đi học Trung cấp chính trị): Cô Đinh Thị Giàu dạy thay Sinh học 8A7-8A10,
//       Thầy Phan Văn Tặt dạy thay HĐTNHN 8A7-8A10 (mở rộng từ quy tắc gốc 8A7,8A8 do đã nhận thêm 8A9,8A10 từ Tuần 4).
// Giáo viên Sinh học khối 8 (theo xác nhận người dùng từ hệ thống PCGD): Hồ Thị Ngọc Tài & Võ Hoàng Toàn.
//   Giả định phân chia: Tài phụ trách 8A1-8A3, Toàn phụ trách 8A4-8A6 (điểm Đốc Binh Kiều).
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = path.join(root, 'src/data');
const week4Path = path.join(dataDirectory, 'dbkWeek4Data.json');
const outputPath = path.join(dataDirectory, 'dbkWeek5Data.json');
const termId = 'HK1_2026_2027';
const weekNumber = 5;

const week4 = JSON.parse(fs.readFileSync(week4Path, 'utf8'));

const GIAU = { id: 'gv_dinh_thi_giau', name: 'Đinh Thị Giàu' };
const TAT = { id: 'gv_phan_van_tat', name: 'Phan Văn Tặt' };
const TIEN_ID = 'gv_thai_van_tien';
const TAI = { id: 'gv_ho_thi_ngoc_tai', name: 'Hồ Thị Ngọc Tài' };
const TOAN = { id: 'gv_vo_hoang_toan', name: 'Võ Hoàng Toàn' };

// Giáo viên Sinh học phụ trách môn KHTN (phần Sinh) của từng lớp khối 8 trong Tuần 5
const sinhTeacherByClass = {
  '8A1': TAI, '8A2': TAI, '8A3': TAI,
  '8A4': TOAN, '8A5': TOAN, '8A6': TOAN,
  // Điểm Tân Kiều: PCCM gốc là Thầy Thái Văn Tiến, Tuần 5 thầy vắng nên Cô Giàu dạy thay
  '8A7': GIAU, '8A8': GIAU, '8A9': GIAU, '8A10': GIAU,
};

const tanKieuGrade8 = ['8A7', '8A8', '8A9', '8A10'];
const sortByTime = (a, b) => a.dayOfWeek - b.dayOfWeek || a.periodNumber - b.periodNumber;

// 1. Nhân bản toàn bộ Tuần 4 sang Tuần 5 (UniTime MPP - Minimal Perturbation Problem)
const slots = week4.slots.map((s) => ({
  ...s,
  id: s.id.replace('slot_w4_', 'slot_w5_') + '_w5',
  weekNumber,
  roomId: '',
}));

const grade8Classes = Object.keys(sinhTeacherByClass);

// 2. KHTN 8: Lý 2/Hóa 2/Sinh 0 -> Lý 1/Hóa 1/Sinh 2
for (const className of grade8Classes) {
  const lySlots = slots.filter((s) => s.className === className && s.subjectId === 'sub_ly').sort(sortByTime);
  const hoaSlots = slots.filter((s) => s.className === className && s.subjectId === 'sub_hoa').sort(sortByTime);
  const sinhTeacher = sinhTeacherByClass[className];

  if (lySlots.length !== 2 || hoaSlots.length !== 2) {
    throw new Error(`Dữ liệu KHTN8 bất thường ở lớp ${className}: Lý=${lySlots.length}, Hóa=${hoaSlots.length}`);
  }

  for (const target of [lySlots[1], hoaSlots[1]]) {
    target.subjectId = 'sub_sinh';
    target.subjectName = 'Sinh học';
    target.teacherId = sinhTeacher.id;
    target.teacherName = sinhTeacher.name;
    target.note = tanKieuGrade8.includes(className)
      ? 'Sinh học (KHTN Tuần 5 - Cô Đinh Thị Giàu dạy thay Thầy Thái Văn Tiến)'
      : 'Sinh học (KHTN Tuần 5)';
  }
}

// 3. Thầy Thái Văn Tiến vắng Tuần 5 (đi học Trung cấp chính trị): Thầy Phan Văn Tặt dạy thay HĐTNHN 8A7-8A10
for (const slot of slots) {
  if (tanKieuGrade8.includes(slot.className) && slot.teacherId === TIEN_ID) {
    slot.teacherId = TAT.id;
    slot.teacherName = TAT.name;
    slot.note = 'HĐTNHN (Thầy Phan Văn Tặt dạy thay Thầy Thái Văn Tiến - Tuần 5)';
  }
}

// 4. Lịch sử & Địa lí (THCS, lớp tách riêng GV Sử/Địa): Sử 2/Địa 1 -> Sử 1/Địa 2
const classNames = [...new Set(slots.map((s) => s.className))];
for (const className of classNames) {
  const suSlots = slots.filter((s) => s.className === className && s.subjectId === 'sub_su').sort(sortByTime);
  const diaSlots = slots.filter((s) => s.className === className && s.subjectId === 'sub_dia').sort(sortByTime);
  if (suSlots.length !== 2 || diaSlots.length !== 1) continue; // Bỏ qua lớp dùng LSDL gộp hoặc THPT

  const diaTeacherId = diaSlots[0].teacherId;
  const diaTeacherName = diaSlots[0].teacherName;
  const target = suSlots[1];
  target.subjectId = 'sub_dia';
  target.subjectName = 'Địa lí';
  target.teacherId = diaTeacherId;
  target.teacherName = diaTeacherName;
  target.note = 'Địa lí (LS&ĐL Tuần 5)';
}

// 5. Giải quyết xung đột giáo viên phát sinh do đổi môn/GV (hoán đổi tiết trong cùng lớp, cùng ca học)
function getShiftAndPeriod(slot) {
  return { shift: slot.shift, period: slot.periodNumber };
}

function resolveAllCollisions(allSlots) {
  for (let pass = 0; pass < 200; pass += 1) {
    const teacherTimeMap = new Map();
    for (const slot of allSlots) {
      if (!slot.teacherId) continue;
      const sp = getShiftAndPeriod(slot);
      const key = `${slot.teacherId}_d${slot.dayOfWeek}_${sp.shift}_p${sp.period}`;
      const list = teacherTimeMap.get(key) || [];
      list.push(slot);
      teacherTimeMap.set(key, list);
    }

    let foundConflict = false;
    for (const conflictingSlots of teacherTimeMap.values()) {
      if (conflictingSlots.length <= 1) continue;
      foundConflict = true;

      const slotToMove = conflictingSlots.find((s) => !s.isLocked && !s.isFlagSalute && !s.isClassMeeting) || conflictingSlots[conflictingSlots.length - 1];
      const spMove = getShiftAndPeriod(slotToMove);

      const candidates = allSlots.filter(
        (s) => s.id !== slotToMove.id
          && s.classId === slotToMove.classId
          && !s.isLocked && !s.isFlagSalute && !s.isClassMeeting
          && getShiftAndPeriod(s).shift === spMove.shift
          && (s.dayOfWeek !== slotToMove.dayOfWeek || getShiftAndPeriod(s).period !== spMove.period)
      );

      let resolved = false;
      for (const cand of candidates) {
        const spCand = getShiftAndPeriod(cand);
        const isMoveTeacherBusy = allSlots.some((s) => s.id !== slotToMove.id && s.id !== cand.id && s.teacherId === slotToMove.teacherId && s.dayOfWeek === cand.dayOfWeek && getShiftAndPeriod(s).shift === spCand.shift && getShiftAndPeriod(s).period === spCand.period);
        if (isMoveTeacherBusy) continue;
        const isCandTeacherBusy = allSlots.some((s) => s.id !== slotToMove.id && s.id !== cand.id && s.teacherId === cand.teacherId && s.dayOfWeek === slotToMove.dayOfWeek && getShiftAndPeriod(s).shift === spMove.shift && getShiftAndPeriod(s).period === spMove.period);
        if (isCandTeacherBusy) continue;

        const tempDay = slotToMove.dayOfWeek;
        const tempPeriod = slotToMove.periodNumber;
        slotToMove.dayOfWeek = cand.dayOfWeek;
        slotToMove.periodNumber = cand.periodNumber;
        cand.dayOfWeek = tempDay;
        cand.periodNumber = tempPeriod;
        resolved = true;
        break;
      }
      if (resolved) break;
    }
    if (!foundConflict) break;
  }
}

resolveAllCollisions(slots);

// 6. Xác nhận 0 trùng tiết lớp / giáo viên
function assertNoCollisions() {
  const classKey = new Set();
  const teacherKey = new Set();
  for (const s of slots) {
    const ck = `${s.classId}|${s.dayOfWeek}|${s.shift}|${s.periodNumber}`;
    if (classKey.has(ck)) throw new Error(`Trùng tiết lớp: ${s.className} thứ ${s.dayOfWeek} ca ${s.shift} tiết ${s.periodNumber}`);
    classKey.add(ck);
    if (s.teacherId) {
      const tk = `${s.teacherId}|${s.dayOfWeek}|${s.shift}|${s.periodNumber}`;
      if (teacherKey.has(tk)) throw new Error(`Trùng tiết giáo viên: ${s.teacherName} (${s.className}) thứ ${s.dayOfWeek} ca ${s.shift} tiết ${s.periodNumber}`);
      teacherKey.add(tk);
    }
  }
}
assertNoCollisions();

// 7. Tái tạo Phân Công Chuyên Môn (PCGD) từ danh sách tiết học Tuần 5
const classMetaByName = new Map();
for (const s of week4.slots) {
  if (!classMetaByName.has(s.className)) {
    const assignment = week4.assignments.find((a) => a.className === s.className);
    classMetaByName.set(s.className, {
      classId: s.classId,
      campusId: s.campusId,
      grade: assignment ? assignment.grade : undefined,
      gradeLevel: assignment ? assignment.gradeLevel : undefined,
    });
  }
}

const assignmentMap = new Map();
for (const slot of slots) {
  const key = [slot.classId, slot.subjectId, slot.teacherId].join('|');
  const meta = classMetaByName.get(slot.className) || {};
  const assignment = assignmentMap.get(key) || {
    id: `pcgd_w5_${slot.classId}_${slot.subjectId}_${slot.teacherId}`,
    teacherId: slot.teacherId,
    teacherName: slot.teacherName,
    classId: slot.classId,
    className: slot.className,
    subjectId: slot.subjectId,
    subjectName: slot.subjectName,
    weeklyPeriods: 0,
    campusId: slot.campusId,
    grade: meta.grade ?? Number(slot.className.match(/\d+/)?.[0]),
    gradeLevel: meta.gradeLevel ?? (Number(slot.className.match(/\d+/)?.[0]) >= 10 ? 'THPT' : 'THCS'),
    subComponentName: slot.subjectName,
    termId,
  };
  assignment.weeklyPeriods += 1;
  assignmentMap.set(key, assignment);
}
const assignments = [...assignmentMap.values()];

// 8. Ước tính lại số tiết thực dạy mỗi giáo viên (Kiêm nhiệm giữ nguyên như Tuần 4)
const week4WorkloadById = new Map(week4.teacherWorkloads.map((w) => [w.teacherId, w]));
const periodsByTeacher = new Map();
for (const slot of slots) {
  if (!slot.teacherId) continue;
  periodsByTeacher.set(slot.teacherId, (periodsByTeacher.get(slot.teacherId) || 0) + 1);
}
const teacherWorkloads = [...periodsByTeacher.entries()].map(([teacherId, weeklyTeachingPeriods]) => {
  const prior = week4WorkloadById.get(teacherId);
  const dutyPeriods = prior ? prior.dutyPeriods : 0;
  const totalQuotaPeriods = weeklyTeachingPeriods + dutyPeriods;
  return {
    teacherId,
    teacherName: slots.find((s) => s.teacherId === teacherId)?.teacherName || prior?.teacherName || teacherId,
    weeklyTeachingPeriods,
    dutyPeriods,
    totalQuotaPeriods,
    quotaBalance: prior ? prior.quotaBalance : 0,
    sourcePdf: 'Tự động tính toán từ Tuần 5 (dựa trên nền Tuần 4 + quy tắc thay đổi theo tuần)',
  };
});

const week5Data = {
  revision: createHash('sha256').update(JSON.stringify(slots)).digest('hex').slice(0, 16),
  sourceDate: '2026-10-05',
  sourceFiles: ['dbkWeek4Data.json (nền tảng)', 'QUY TẮC RÀNG BUỘC TKB.docx (áp dụng quy tắc Tuần 5)'],
  weekNumber,
  slots,
  assignments,
  teacherWorkloads,
  ruleViolations: [],
};

fs.writeFileSync(outputPath, JSON.stringify(week5Data, null, 2), 'utf8');
console.log(`Đã tạo ${outputPath}: ${slots.length} tiết, ${assignments.length} phân công, ${teacherWorkloads.length} giáo viên.`);
