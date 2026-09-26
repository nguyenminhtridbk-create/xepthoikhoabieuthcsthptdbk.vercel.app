import React from 'react';
import { PeriodSlot, ClassRoom, Teacher, Subject, Campus, UserRole } from '../types';
import { getWeekDateRangeText, getCampusDisplayName } from './ClassTimetableCard';

interface TeacherTimetableCardProps {
  teacher: Teacher;
  slots: PeriodSlot[];
  classes: ClassRoom[];
  subjects: Subject[];
  campuses: Campus[];
  currentWeek: number;
  currentRole: UserRole;
  isViewOnly?: boolean;
  onEditSlot?: (slot: PeriodSlot) => void;
  onAddSlot?: (prefill: Partial<PeriodSlot>) => void;
}

export const formatTeacherCode = (code: string): string => {
  if (/^[A-ZÀ-Ỹ][a-zà-ỹ]+[A-ZÀ-Ỹ]+$/.test(code)) {
    const match = code.match(/^([A-ZÀ-Ỹ][a-zà-ỹ]+)([A-ZÀ-Ỹ]+)$/);
    if (match) {
      return `${match[1]}.${match[2]}`;
    }
  }
  return code;
};

export const TeacherTimetableCard: React.FC<TeacherTimetableCardProps> = ({
  teacher,
  slots,
  classes,
  subjects,
  campuses,
  currentWeek,
  currentRole,
  isViewOnly = false,
  onEditSlot,
  onAddSlot,
}) => {
  const classMap = new Map<string, ClassRoom>(classes.map((c) => [c.id, c]));
  const subjectMap = new Map<string, Subject>(subjects.map((s) => [s.id, s]));

  // Lấy các tiết dạy của giáo viên này trong tuần hiện tại
  const teacherSlots = slots.filter((s) => s.teacherId === teacher.id && s.weekNumber === currentWeek);
  const totalWeeklyPeriods = teacherSlots.length;

  // Tìm lớp chủ nhiệm nếu có
  const homeroomClass = classes.find((c) => c.homeroomTeacherId === teacher.id);
  const formattedCode = formatTeacherCode(teacher.code);

  // Nhãn badge hiển thị: Huy.TQ (TP-9A7)
  const shortBadge = homeroomClass
    ? `${formattedCode} (TP-${homeroomClass.name})`
    : teacher.role === 'head_of_department'
    ? `${formattedCode} (TT)`
    : formattedCode;

  // Tên đầy đủ trên banner: TRẦN QUỐC HUY (HUY.TQ (TP-9A7))
  const bannerFullName = `${teacher.fullName.toUpperCase()} (${shortBadge.toUpperCase()})`;

  const days = [
    { num: 2, label: 'Thứ Hai' },
    { num: 3, label: 'Thứ Ba' },
    { num: 4, label: 'Thứ Tư' },
    { num: 5, label: 'Thứ Năm' },
    { num: 6, label: 'Thứ Sáu' },
    { num: 7, label: 'Thứ Bảy' },
  ];

  const periods = [1, 2, 3, 4, 5];

  const findSlot = (day: number, period: number, shift: 'morning' | 'afternoon') => {
    return teacherSlots.find((s) => s.dayOfWeek === day && s.periodNumber === period && s.shift === shift);
  };

  const campusName = getCampusDisplayName(teacher.primaryCampusId);
  const quota = teacher.maxPeriodsPerWeek || 19;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 transition-all hover:shadow-md">
      {/* 1. Header Card y hệt Screenshot 2 */}
      <div className="bg-[#12163b] text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Badge + Tên Giáo Viên + Chức vụ + Điểm trường & Tổng tiết */}
        <div className="flex items-center gap-3.5">
          <div className="px-3 py-1.5 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0 tracking-wide">
            {shortBadge}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight uppercase">
                {bannerFullName}
              </h3>
              {teacher.role === 'head_of_department' ? (
                <span className="text-[11px] font-bold bg-indigo-700 text-white px-2 py-0.5 rounded-full">
                  TổTrưởng
                </span>
              ) : homeroomClass ? (
                <span className="text-[11px] font-bold bg-indigo-700 text-white px-2 py-0.5 rounded-full">
                  ToPho
                </span>
              ) : null}
            </div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">
              Điểm trường: <span className="text-white font-semibold">{campusName}</span> • Tổng tiết TKB:{' '}
              <span className="text-emerald-400 font-bold">{totalWeeklyPeriods} tiết/tuần</span>
            </div>
          </div>
        </div>

        {/* Right: Tuần + Năm học + Định mức */}
        <div className="flex items-center gap-3 text-right">
          <div className="text-xs text-slate-300 font-medium">
            <span className="text-white font-bold">{getWeekDateRangeText(currentWeek)}</span>
          </div>
          <div className="bg-slate-900/95 border border-slate-700 text-white px-2.5 py-1 rounded-md text-xs font-extrabold shadow-xs">
            Định mức: {quota}t
          </div>
        </div>
      </div>

      {/* 2. Table Thời Khóa Biểu y hệt Screenshot 2 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center min-w-[760px] text-xs">
          <thead>
            <tr className="bg-slate-50/90 text-slate-700 font-bold border-b border-slate-200 text-xs">
              <th className="py-2.5 px-3 w-20 border-r border-slate-200 font-extrabold text-slate-700">Buổi</th>
              <th className="py-2.5 px-3 w-20 border-r border-slate-200 font-extrabold text-slate-700">Tiết</th>
              {days.map((day) => (
                <th key={day.num} className="py-2.5 px-3 border-r border-slate-200 last:border-r-0 font-extrabold text-slate-800">
                  {day.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {/* BUỔI SÁNG (Rowspan = 5) */}
            {periods.map((p, idx) => (
              <tr key={`tch_m_${p}`} className="hover:bg-slate-50/60 transition-colors">
                {idx === 0 && (
                  <td
                    rowSpan={5}
                    className="p-2 border-r border-slate-200 font-black text-blue-600 tracking-wider text-xs align-middle select-none bg-blue-50/20"
                  >
                    SÁNG
                  </td>
                )}
                <td className="py-2.5 px-2 font-medium text-slate-600 border-r border-slate-200 text-xs">
                  Tiết {p}
                </td>
                {days.map((day) => {
                  const slot = findSlot(day.num, p, 'morning');
                  const className = slot ? classMap.get(slot.classId)?.name || 'Lớp' : null;
                  const subjectName = slot
                    ? (slot.subComponentName || subjectMap.get(slot.subjectId)?.name || 'Môn học')
                    : null;

                  return (
                    <td
                      key={`tch_cell_m_${day.num}_${p}`}
                      onClick={() => {
                        if (isViewOnly) return;
                        if (slot && onEditSlot) {
                          onEditSlot(slot);
                        } else if (!slot && onAddSlot) {
                          onAddSlot({
                            teacherId: teacher.id,
                            dayOfWeek: day.num,
                            periodNumber: p,
                            shift: 'morning',
                            campusId: teacher.primaryCampusId,
                          });
                        }
                      }}
                      className={`p-2 border-r border-slate-200 last:border-r-0 align-middle h-14 ${
                        !isViewOnly ? 'cursor-pointer hover:bg-blue-50/40' : ''
                      }`}
                    >
                      {slot ? (
                        <div
                          className={`inline-flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-lg border shadow-2xs text-xs ${
                            slot.isOppositeShift
                              ? 'border-amber-300 bg-amber-100/80 text-amber-950 font-medium'
                              : 'border-blue-200/90 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span className="font-extrabold text-slate-900">{className}</span>
                            <span className="text-slate-600 font-medium">({subjectName})</span>
                          </div>
                          {slot.isOppositeShift && (
                            <span className="text-[9.5px] font-bold text-amber-800 bg-amber-200/90 px-1 py-0.2 rounded">
                              Dạy trái buổi
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 font-normal text-sm select-none">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* BUỔI CHIỀU (Rowspan = 5) */}
            {periods.map((p, idx) => (
              <tr key={`tch_a_${p}`} className="hover:bg-slate-50/60 transition-colors">
                {idx === 0 && (
                  <td
                    rowSpan={5}
                    className="p-2 border-r border-slate-200 font-black text-amber-600 tracking-wider text-xs align-middle select-none bg-amber-50/20"
                  >
                    CHIỀU
                  </td>
                )}
                <td className="py-2.5 px-2 font-medium text-slate-600 border-r border-slate-200 text-xs">
                  Tiết {p}
                </td>
                {days.map((day) => {
                  const slot = findSlot(day.num, p, 'afternoon');
                  const className = slot ? classMap.get(slot.classId)?.name || 'Lớp' : null;
                  const subjectName = slot
                    ? (slot.subComponentName || subjectMap.get(slot.subjectId)?.name || 'Môn học')
                    : null;

                  return (
                    <td
                      key={`tch_cell_a_${day.num}_${p}`}
                      onClick={() => {
                        if (isViewOnly) return;
                        if (slot && onEditSlot) {
                          onEditSlot(slot);
                        } else if (!slot && onAddSlot) {
                          onAddSlot({
                            teacherId: teacher.id,
                            dayOfWeek: day.num,
                            periodNumber: p,
                            shift: 'afternoon',
                            campusId: teacher.primaryCampusId,
                          });
                        }
                      }}
                      className={`p-2 border-r border-slate-200 last:border-r-0 align-middle h-14 ${
                        !isViewOnly ? 'cursor-pointer hover:bg-amber-50/40' : ''
                      }`}
                    >
                      {slot ? (
                        <div className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50/80 shadow-2xs text-xs">
                          <span className="font-extrabold text-amber-950">{className}</span>
                          <span className="text-amber-800 font-medium">({subjectName})</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-normal text-sm select-none">-</span>
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
};
