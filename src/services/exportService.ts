import * as XLSX from 'xlsx';
import { PeriodSlot, Teacher, ClassRoom, Subject, TeachingReport, Campus } from '../types';

export function exportTimetableToExcel(
  slots: PeriodSlot[],
  teachers: Teacher[],
  classes: ClassRoom[],
  subjects: Subject[],
  campuses: Campus[],
  weekNumber: number,
  termName: string = 'Học kỳ 1 - Năm học 2026-2027'
) {
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const campusMap = new Map(campuses.map((cp) => [cp.id, cp]));

  const currentWeekSlots = slots.filter((s) => s.weekNumber === weekNumber);

  // 1. Sheet: TKB Toàn trường (Matrix theo Lớp)
  const matrixHeaders = ['Thứ', 'Buổi', 'Tiết', ...classes.map((c) => `${c.name} (${campusMap.get(c.campusId)?.code || ''})`)];
  const matrixData: any[][] = [];

  for (let day = 2; day <= 7; day++) {
    const dayName = `Thứ ${day}`;
    // Buổi Sáng
    for (let period = 1; period <= 5; period++) {
      const row: any[] = [dayName, 'Sáng', `Tiết ${period}`];

      classes.forEach((cls) => {
        const slot = currentWeekSlots.find(
          (s) => s.classId === cls.id && s.dayOfWeek === day && s.periodNumber === period && s.shift === 'morning'
        );
        if (slot) {
          const sub = subjectMap.get(slot.subjectId);
          const teacher = teacherMap.get(slot.teacherId);
          const subText = slot.subComponentName ? `${sub?.name || ''} (${slot.subComponentName})` : sub?.name || '';
          row.push(`${subText}\n[${teacher?.code || ''}]`);
        } else {
          row.push('');
        }
      });

      matrixData.push(row);
    }

    // Buổi Chiều
    for (let period = 1; period <= 5; period++) {
      const row: any[] = [dayName, 'Chiều', `Tiết ${period}`];

      classes.forEach((cls) => {
        const slot = currentWeekSlots.find(
          (s) => s.classId === cls.id && s.dayOfWeek === day && s.periodNumber === period && s.shift === 'afternoon'
        );
        if (slot) {
          const sub = subjectMap.get(slot.subjectId);
          const teacher = teacherMap.get(slot.teacherId);
          const subText = slot.subComponentName ? `${sub?.name || ''} (${slot.subComponentName})` : sub?.name || '';
          row.push(`${subText}\n[${teacher?.code || ''}]`);
        } else {
          row.push('');
        }
      });

      matrixData.push(row);
    }
  }

  const wsMatrix = XLSX.utils.aoa_to_sheet([
    [`THỜI KHÓA BIỂU TOÀN TRƯỜNG THCS & THPT ĐỐC BINH KIỀU - TUẦN ${weekNumber}`],
    [termName],
    [],
    matrixHeaders,
    ...matrixData,
  ]);

  // 2. Sheet: TKB Theo từng Giáo viên
  const teacherScheduleRows: any[][] = [
    ['THỜI KHÓA BIỂU CÁ NHÂN GIÁO VIÊN - TRƯỜNG THCS & THPT ĐỐC BINH KIỀU'],
    [`Tuần áp dụng: Tuần ${weekNumber} - ${termName}`],
    [],
    ['STT', 'Mã GV', 'Họ và tên', 'Tổ chuyên môn', 'Thứ', 'Buổi', 'Tiết', 'Lớp', 'Môn học / Phân môn', 'Điểm trường', 'Phòng'],
  ];

  let stt = 1;
  teachers.forEach((teacher) => {
    const tSlots = currentWeekSlots
      .filter((s) => s.teacherId === teacher.id)
      .sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        const shiftOrderA = a.shift === 'morning' ? 1 : 2;
        const shiftOrderB = b.shift === 'morning' ? 1 : 2;
        if (shiftOrderA !== shiftOrderB) return shiftOrderA - shiftOrderB;
        return a.periodNumber - b.periodNumber;
      });

    if (tSlots.length === 0) {
      teacherScheduleRows.push([stt++, teacher.code, teacher.fullName, teacher.department, 'Không có tiết', '', '', '', '', '', '']);
    } else {
      tSlots.forEach((slot) => {
        const cls = classMap.get(slot.classId);
        const sub = subjectMap.get(slot.subjectId);
        const campus = campusMap.get(slot.campusId);
        teacherScheduleRows.push([
          stt++,
          teacher.code,
          teacher.fullName,
          teacher.department,
          `Thứ ${slot.dayOfWeek}`,
          slot.shift === 'afternoon' ? 'Chiều' : 'Sáng',
          `Tiết ${slot.periodNumber}`,
          cls?.name || slot.classId,
          slot.subComponentName || sub?.name || '',
          campus?.name || slot.campusId,
          slot.roomId,
        ]);
      });
    }
  });

  const wsTeachers = XLSX.utils.aoa_to_sheet(teacherScheduleRows);

  // 3. Sheet: Thống kê số tiết & Phân bổ các điểm trường
  const campusHeaderCols = campuses.map((cp) => `Tại ${cp.name} (${cp.code})`);
  const statsRows: any[][] = [
    ['THỐNG KÊ ĐỊNH MỨC TIẾT DẠY VÀ PHÂN BỔ ĐIỂM TRƯỜNG'],
    [`Tuần ${weekNumber} - Trường THCS & THPT Đốc Binh Kiều`],
    [],
    ['Mã GV', 'Họ và tên', 'Tổ', 'Tổng tiết/tuần', ...campusHeaderCols, 'Ngày nghỉ ưu tiên'],
  ];

  teachers.forEach((t) => {
    const tSlots = currentWeekSlots.filter((s) => s.teacherId === t.id);
    const campusCounts = campuses.map((cp) => tSlots.filter((s) => s.campusId === cp.id).length);

    statsRows.push([
      t.code,
      t.fullName,
      t.department,
      tSlots.length,
      ...campusCounts,
      t.preferredOffDay ? `Thứ ${t.preferredOffDay}` : 'Không',
    ]);
  });

  const wsStats = XLSX.utils.aoa_to_sheet(statsRows);

  // Tạo Workbook và xuất file
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'TKB_Toan_Truong');
  XLSX.utils.book_append_sheet(wb, wsTeachers, 'TKB_Giao_Vien');
  XLSX.utils.book_append_sheet(wb, wsStats, 'Thong_Ke_Tiet_Day');

  XLSX.writeFile(wb, `ThoiKhoaBieu_Tuan_${weekNumber}_TruongLienCap.xlsx`);
}

export function exportTeachingReportToExcel(
  reports: TeachingReport[],
  weekNumber: number,
  termName: string = 'Học kỳ 1'
) {
  const rows: any[][] = [
    ['SỔ BÁO GIẢNG ĐIỆN TỬ TỔNG HỢP - TRƯỜNG THCS & THPT ĐỐC BINH KIỀU'],
    [`Tuần ${weekNumber} - ${termName}`],
    [],
    ['Giáo viên', 'Thứ', 'Buổi', 'Tiết', 'Lớp', 'Môn học / Phân môn', 'Tiết PPCT', 'Tên bài dạy', 'Thiết bị dạy học', 'Ghi chú', 'Trạng thái duyệt'],
  ];

  reports.forEach((rep) => {
    if (!rep.entries || rep.entries.length === 0) {
      rows.push([rep.teacherName, '', '', '', '', '', '', 'Chưa có dữ liệu báo giảng', '', '', rep.status]);
    } else {
      rep.entries.forEach((e) => {
        rows.push([
          rep.teacherName,
          `Thứ ${e.dayOfWeek}`,
          e.shift === 'afternoon' ? 'Chiều' : 'Sáng',
          `Tiết ${e.periodNumber}`,
          e.classId,
          e.subComponent || e.subjectName,
          e.ppctLessonNumber,
          e.lessonTitle,
          e.teachingEquipment,
          e.notes,
          rep.status === 'approved' ? 'Đã duyệt' : rep.status === 'submitted' ? 'Chờ duyệt' : 'Bản nháp',
        ]);
      });
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `BaoGiang_Tuan_${weekNumber}`);
  XLSX.writeFile(wb, `SoBaoGiang_Tuan_${weekNumber}.xlsx`);
}

/**
 * Kích hoạt in chuẩn PDF / Print cho trình duyệt
 */
export function triggerPrintWindow() {
  window.print();
}
