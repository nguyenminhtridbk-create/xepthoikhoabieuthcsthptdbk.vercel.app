import React, { useState, useMemo } from 'react';
import {
  Layers,
  Calendar,
  Clock,
  Users,
  Search,
  Download,
  AlertTriangle,
  Building,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  PeriodSlot,
  Teacher,
  ClassRoom,
  Subject,
  Room,
  Campus,
  ScheduleConflict,
  UserRole,
} from '../types';

interface GradeTimetableViewProps {
  slots: PeriodSlot[];
  teachers: Teacher[];
  classes: ClassRoom[];
  subjects: Subject[];
  rooms: Room[];
  campuses: Campus[];
  conflicts: ScheduleConflict[];
  currentWeek: number;
  initialGrade?: number;
  currentRole: UserRole;
  onEditSlot?: (slot: PeriodSlot) => void;
  onAddSlot?: (prefill?: Partial<PeriodSlot>) => void;
  onDeleteSlot?: (slotId: string) => void;
}

export const GradeTimetableView: React.FC<GradeTimetableViewProps> = ({
  slots,
  teachers,
  classes,
  subjects,
  campuses,
  conflicts,
  currentWeek,
  initialGrade = 6,
  onEditSlot,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<number>(initialGrade);
  const [selectedShift, setSelectedShift] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [displayStyle, setDisplayStyle] = useState<'matrix' | 'cards'>('matrix');

  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const campusMap = useMemo(() => new Map(campuses.map((cp) => [cp.id, cp])), [campuses]);

  // Lọc slots của tuần hiện tại
  const weekSlots = useMemo(() => {
    return slots.filter((s) => s.weekNumber === currentWeek);
  }, [slots, currentWeek]);

  // Danh sách các khối có sẵn
  const availableGrades = [6, 7, 8, 9, 10, 11, 12];

  // Lọc danh sách lớp của khối được chọn
  const gradeClasses = useMemo(() => {
    return classes
      .filter((c) => c.grade === selectedGrade)
      .filter((c) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          c.name.toLowerCase().includes(term) ||
          (campusMap.get(c.campusId)?.name || '').toLowerCase().includes(term)
        );
      });
  }, [classes, selectedGrade, searchTerm, campusMap]);

  // Các ngày trong tuần từ Thứ 2 đến Thứ 7
  const days = [2, 3, 4, 5, 6, 7];
  const dayLabels: Record<number, string> = {
    2: 'Thứ 2',
    3: 'Thứ 3',
    4: 'Thứ 4',
    5: 'Thứ 5',
    6: 'Thứ 6',
    7: 'Thứ 7',
  };

  // Helper tìm slot cho 1 lớp, thứ, ca, tiết
  const getSlot = (classId: string, day: number, shift: 'morning' | 'afternoon', period: number) => {
    return weekSlots.find(
      (s) =>
        s.classId === classId &&
        s.dayOfWeek === day &&
        s.shift === shift &&
        s.periodNumber === period
    );
  };

  // Đếm số tiết sáng/chiều của khối
  const gradeStats = useMemo(() => {
    const classIds = new Set(gradeClasses.map((c) => c.id));
    const gradeSlots = weekSlots.filter((s) => classIds.has(s.classId));
    const morningCount = gradeSlots.filter((s) => s.shift === 'morning').length;
    const afternoonCount = gradeSlots.filter((s) => s.shift === 'afternoon').length;
    const totalCount = gradeSlots.length;

    // Đếm số xung đột trong khối
    const classConflictCount = conflicts.filter((c) =>
      c.affectedClassIds.some((cid) => classIds.has(cid))
    ).length;

    return {
      totalClasses: gradeClasses.length,
      morningCount,
      afternoonCount,
      totalCount,
      classConflictCount,
    };
  }, [gradeClasses, weekSlots, conflicts]);

  // Xuất Excel cho Khối
  const handleExportGradeExcel = () => {
    const rows: Record<string, string | number>[] = [];

    gradeClasses.forEach((cls) => {
      const cSlots = weekSlots.filter((s) => s.classId === cls.id);
      days.forEach((day) => {
        ['morning', 'afternoon'].forEach((shift) => {
          for (let p = 1; p <= 5; p++) {
            const s = cSlots.find(
              (slot) => slot.dayOfWeek === day && slot.shift === shift && slot.periodNumber === p
            );
            if (s) {
              const sub = subjectMap.get(s.subjectId);
              const tch = teacherMap.get(s.teacherId);
              const cp = campusMap.get(cls.campusId);
              rows.push({
                Khối: `Khối ${selectedGrade}`,
                Lớp: cls.name,
                'Điểm Trường': cp?.name || cls.campusId,
                Thứ: dayLabels[day],
                Buổi: shift === 'morning' ? 'Sáng' : 'Chiều',
                Tiết: p,
                'Môn Học': sub?.name || s.subjectId,
                'Giáo Viên': tch?.fullName || s.teacherId,
                'Ghi Chú': s.note || '',
              });
            }
          }
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `TKB_Khoi_${selectedGrade}`);
    XLSX.writeFile(workbook, `TKB_Khoi_${selectedGrade}_Tuan_${currentWeek}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Grade Selector, Shift Filter, View Style */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 space-y-4">
        {/* Row 1: Grade Selection Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Thời Khóa Biểu Khối {selectedGrade}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                    {gradeClasses.length} Lớp
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Xem đối chiếu toàn bộ các lớp của Khối {selectedGrade} trên cùng màn hình (Sáng &amp; Chiều)
                </p>
              </div>
            </div>
          </div>

          {/* Grade Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {availableGrades.map((grade) => (
              <button
                key={grade}
                type="button"
                onClick={() => setSelectedGrade(grade)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedGrade === grade
                    ? 'bg-indigo-600 text-white shadow-xs scale-105'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Khối {grade}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Secondary Controls (Shift, Display Mode, Search, Export) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Shift Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSelectedShift('all')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedShift === 'all'
                    ? 'bg-white text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cả Ngày (Sáng &amp; Chiều)
              </button>
              <button
                type="button"
                onClick={() => setSelectedShift('morning')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedShift === 'morning'
                    ? 'bg-white text-blue-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chỉ Buổi Sáng
              </button>
              <button
                type="button"
                onClick={() => setSelectedShift('afternoon')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedShift === 'afternoon'
                    ? 'bg-white text-amber-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chỉ Buổi Chiều
              </button>
            </div>

            {/* Display Mode */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDisplayStyle('matrix')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  displayStyle === 'matrix'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ma Trận Tổng Hợp
              </button>
              <button
                type="button"
                onClick={() => setDisplayStyle('cards')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  displayStyle === 'cards'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lưới Từng Lớp
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm lớp, điểm trường..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-44 sm:w-56"
              />
            </div>

            {/* Export Excel */}
            <button
              type="button"
              onClick={handleExportGradeExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel Khối {selectedGrade}</span>
            </button>
          </div>
        </div>

        {/* Row 3: Stats banner for this Grade */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/70">
            <span className="text-slate-500">Tổng số lớp:</span>{' '}
            <strong className="text-slate-900">{gradeStats.totalClasses} lớp</strong>
          </div>
          <div className="bg-blue-50/80 rounded-xl p-2.5 border border-blue-200/70 text-blue-900">
            <span className="text-blue-700">Tiết Buổi Sáng:</span>{' '}
            <strong className="font-bold">{gradeStats.morningCount} tiết</strong>
            {(selectedGrade === 6 || selectedGrade === 7) && (
              <span className="ml-1 text-[10px] font-semibold text-blue-600">(Học trái buổi)</span>
            )}
          </div>
          <div className="bg-amber-50/80 rounded-xl p-2.5 border border-amber-200/70 text-amber-900">
            <span className="text-amber-700">Tiết Buổi Chiều:</span>{' '}
            <strong className="font-bold">{gradeStats.afternoonCount} tiết</strong>
            {(selectedGrade === 6 || selectedGrade === 7) && (
              <span className="ml-1 text-[10px] font-semibold text-amber-600">(Chính khóa)</span>
            )}
          </div>
          <div className={`rounded-xl p-2.5 border text-xs font-semibold ${
            gradeStats.classConflictCount === 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <span className="flex items-center gap-1">
              {gradeStats.classConflictCount === 0 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>0 Trùng tiết trong khối</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{gradeStats.classConflictCount} Cảnh báo cần kiểm tra</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* MATRIX VIEW: TABLE COMPARING ALL CLASSES OF THE GRADE */}
      {displayStyle === 'matrix' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>BẢNG MA TRẬN SO SÁNH CÁC LỚP KHỐI {selectedGrade} - TUẦN {currentWeek}</span>
            </div>
            {(selectedGrade === 6 || selectedGrade === 7) && (
              <div className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                <span>Khối {selectedGrade}: Học chính khóa chiều + Học trái buổi sáng (GDTC tại ĐBK, HĐTNHN tại Tân Kiều)</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold border-b border-slate-200">
                  <th className="p-2.5 sticky left-0 bg-slate-100 z-10 w-24 border-r border-slate-200">Lớp</th>
                  <th className="p-2.5 w-32 border-r border-slate-200">Điểm trường</th>
                  <th className="p-2.5 w-20 border-r border-slate-200 text-center">Buổi</th>
                  {days.map((day) => (
                    <th key={day} colSpan={5} className="p-2 text-center border-r border-slate-200 font-extrabold bg-slate-100/90">
                      {dayLabels[day]}
                    </th>
                  ))}
                </tr>
                <tr className="bg-slate-50 text-[10px] text-slate-500 font-semibold border-b border-slate-200 text-center">
                  <th className="p-1 sticky left-0 bg-slate-50 z-10 border-r border-slate-200"></th>
                  <th className="p-1 border-r border-slate-200"></th>
                  <th className="p-1 border-r border-slate-200"></th>
                  {days.map((day) => (
                    <React.Fragment key={day}>
                      {[1, 2, 3, 4, 5].map((p) => (
                        <th key={`${day}_p${p}`} className={`p-1 w-14 border-r border-slate-100 ${p === 5 ? 'border-r-slate-300' : ''}`}>
                          T{p}
                        </th>
                      ))}
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {gradeClasses.map((cls) => {
                  const campus = campusMap.get(cls.campusId);
                  const shiftsToRender: ('morning' | 'afternoon')[] = [];
                  if (selectedShift === 'all') {
                    shiftsToRender.push('morning', 'afternoon');
                  } else {
                    shiftsToRender.push(selectedShift);
                  }

                  return (
                    <React.Fragment key={cls.id}>
                      {shiftsToRender.map((shift, shiftIndex) => {
                        const isMorning = shift === 'morning';
                        return (
                          <tr
                            key={`${cls.id}_${shift}`}
                            className={`hover:bg-indigo-50/20 transition-colors ${
                              shiftIndex === 0 && shiftsToRender.length > 1 ? 'border-t-2 border-slate-300' : ''
                            } ${isMorning ? 'bg-white' : 'bg-slate-50/40'}`}
                          >
                            {/* Class name (only show on first shift row or merge) */}
                            {shiftIndex === 0 ? (
                              <td
                                rowSpan={shiftsToRender.length}
                                className="p-2.5 font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200 align-middle shadow-xs"
                              >
                                <div className="text-sm font-black text-indigo-700">{cls.name}</div>
                                <div className="text-[10px] text-slate-400 font-normal">
                                  Ca: {cls.shift === 'morning' ? 'Sáng' : 'Chiều'}
                                </div>
                              </td>
                            ) : null}

                            {shiftIndex === 0 ? (
                              <td
                                rowSpan={shiftsToRender.length}
                                className="p-2 text-[11px] text-slate-600 border-r border-slate-200 align-middle"
                              >
                                <div className="flex items-center gap-1 font-medium">
                                  <Building className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{campus?.name || cls.campusId}</span>
                                </div>
                              </td>
                            ) : null}

                            {/* Shift Label */}
                            <td className="p-1.5 text-center border-r border-slate-200 font-bold text-[10px]">
                              <span
                                className={`px-2 py-0.5 rounded-md inline-block ${
                                  isMorning ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {isMorning ? 'Sáng' : 'Chiều'}
                              </span>
                            </td>

                            {/* 6 Days x 5 Periods */}
                            {days.map((day) => (
                              <React.Fragment key={day}>
                                {[1, 2, 3, 4, 5].map((period) => {
                                  const slot = getSlot(cls.id, day, shift, period);
                                  const subject = slot ? subjectMap.get(slot.subjectId) : null;
                                  const teacher = slot ? teacherMap.get(slot.teacherId) : null;
                                  const isTráiBuổi =
                                    (selectedGrade === 6 || selectedGrade === 7) && isMorning && Boolean(slot);

                                  return (
                                    <td
                                      key={`${day}_${period}`}
                                      onClick={() => slot && onEditSlot?.(slot)}
                                      className={`p-1 border-r border-slate-100 align-top transition-colors ${
                                        period === 5 ? 'border-r-slate-300' : ''
                                      } ${
                                        slot
                                          ? isTráiBuổi
                                            ? 'bg-blue-50/90 hover:bg-blue-100 cursor-pointer border border-blue-200 rounded-sm'
                                            : 'hover:bg-indigo-50 cursor-pointer'
                                          : 'text-slate-300'
                                      }`}
                                    >
                                      {slot ? (
                                        <div className="space-y-0.5">
                                          <div
                                            className="text-[11px] font-bold truncate leading-tight"
                                            style={{ color: subject?.color || '#334155' }}
                                            title={`${subject?.name || slot.subjectId} - ${teacher?.fullName || 'GV'}`}
                                          >
                                            {subject?.shortName || subject?.name || slot.subjectId}
                                          </div>
                                          <div className="text-[9px] text-slate-500 truncate" title={teacher?.fullName}>
                                            {teacher?.fullName?.split(' ').slice(-1)[0] || 'GV'}
                                          </div>
                                          {isTráiBuổi && (
                                            <div className="text-[8px] font-black uppercase text-blue-700 bg-blue-100/80 px-1 rounded-xs inline-block">
                                              Trái buổi
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-[10px] text-slate-200 select-none">-</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CARDS VIEW: INDIVIDUAL TIMETABLE CARDS FOR EACH CLASS IN THIS GRADE */}
      {displayStyle === 'cards' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {gradeClasses.map((cls) => {
            const campus = campusMap.get(cls.campusId);
            const classSlots = weekSlots.filter((s) => s.classId === cls.id);

            return (
              <div
                key={cls.id}
                className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-indigo-700">{cls.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {campus?.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cls.shift === 'morning' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Ca {cls.shift === 'morning' ? 'Sáng' : 'Chiều'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-semibold">
                    Tổng: {classSlots.length} tiết
                  </div>
                </div>

                {/* Table for this class */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-600 border-b border-slate-200">
                        <th className="p-1.5 w-16">Buổi &bull; Tiết</th>
                        {days.map((day) => (
                          <th key={day} className="p-1.5 text-center border-l border-slate-200">
                            {dayLabels[day]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {/* Buổi Sáng */}
                      {(selectedShift === 'all' || selectedShift === 'morning') &&
                        [1, 2, 3, 4, 5].map((period) => (
                          <tr key={`m_${period}`} className="hover:bg-slate-50/60">
                            <td className="p-1 font-semibold text-blue-700 bg-blue-50/30 whitespace-nowrap text-[10px]">
                              Sáng T{period}
                            </td>
                            {days.map((day) => {
                              const slot = getSlot(cls.id, day, 'morning', period);
                              const subject = slot ? subjectMap.get(slot.subjectId) : null;
                              const teacher = slot ? teacherMap.get(slot.teacherId) : null;
                              return (
                                <td
                                  key={day}
                                  onClick={() => slot && onEditSlot?.(slot)}
                                  className={`p-1 border-l border-slate-100 text-center ${
                                    slot ? 'bg-blue-50/40 hover:bg-blue-100 cursor-pointer font-medium' : 'text-slate-300'
                                  }`}
                                >
                                  {slot ? (
                                    <div>
                                      <div className="font-bold text-slate-800 truncate">
                                        {subject?.shortName || subject?.name}
                                      </div>
                                      <div className="text-[9px] text-slate-500 truncate">{teacher?.fullName}</div>
                                    </div>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}

                      {/* Buổi Chiều */}
                      {(selectedShift === 'all' || selectedShift === 'afternoon') &&
                        [1, 2, 3, 4, 5].map((period) => (
                          <tr key={`a_${period}`} className="hover:bg-slate-50/60">
                            <td className="p-1 font-semibold text-amber-700 bg-amber-50/30 whitespace-nowrap text-[10px]">
                              Chiều T{period}
                            </td>
                            {days.map((day) => {
                              const slot = getSlot(cls.id, day, 'afternoon', period);
                              const subject = slot ? subjectMap.get(slot.subjectId) : null;
                              const teacher = slot ? teacherMap.get(slot.teacherId) : null;
                              return (
                                <td
                                  key={day}
                                  onClick={() => slot && onEditSlot?.(slot)}
                                  className={`p-1 border-l border-slate-100 text-center ${
                                    slot ? 'bg-amber-50/30 hover:bg-amber-100 cursor-pointer font-medium' : 'text-slate-300'
                                  }`}
                                >
                                  {slot ? (
                                    <div>
                                      <div className="font-bold text-slate-800 truncate">
                                        {subject?.shortName || subject?.name}
                                      </div>
                                      <div className="text-[9px] text-slate-500 truncate">{teacher?.fullName}</div>
                                    </div>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
