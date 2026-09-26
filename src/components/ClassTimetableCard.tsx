import React from 'react';
import { PeriodSlot, ClassRoom, Teacher, Subject, Campus, UserRole } from '../types';
import { Edit2, Plus } from 'lucide-react';

interface ClassTimetableCardProps {
  classItem: ClassRoom;
  slots: PeriodSlot[];
  teachers: Teacher[];
  subjects: Subject[];
  campuses: Campus[];
  currentWeek: number;
  currentRole: UserRole;
  isViewOnly?: boolean;
  onEditSlot?: (slot: PeriodSlot) => void;
  onAddSlot?: (prefill: Partial<PeriodSlot>) => void;
}

export const getWeekDateRangeText = (weekNumber: number, schoolYear: string = '2026 - 2027'): string => {
  const baseWeek2Monday = new Date(2026, 8, 14); // 14/09/2026
  const diffDays = (weekNumber - 2) * 7;
  const start = new Date(baseWeek2Monday.getTime() + diffDays * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 5 * 24 * 60 * 60 * 1000); // Thứ 7

  const formatDate = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  return `Tuần ${weekNumber} (${formatDate(start)} - ${formatDate(end)}) Năm học ${schoolYear}`;
};

export const getCampusDisplayName = (campusId: string): string => {
  if (campusId === 'campus_main') return 'Điểm chính';
  if (campusId === 'campus_dbk') return 'Điểm Đốc Binh Kiều';
  if (campusId === 'campus_tk') return 'Điểm Tân Kiều';
  return 'Điểm chính';
};

export const ClassTimetableCard: React.FC<ClassTimetableCardProps> = ({
  classItem,
  slots,
  teachers,
  subjects,
  campuses,
  currentWeek,
  currentRole,
  isViewOnly = false,
  onEditSlot,
  onAddSlot,
}) => {
  const teacherMap = new Map<string, Teacher>(teachers.map((t) => [t.id, t]));
  const subjectMap = new Map<string, Subject>(subjects.map((s) => [s.id, s]));

  // Lọc các tiết của lớp này trong tuần
  const classSlots = slots.filter((s) => s.classId === classItem.id && s.weekNumber === currentWeek);

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
    return classSlots.find((s) => s.dayOfWeek === day && s.periodNumber === period && s.shift === shift);
  };

  const homeroomTeacher = teacherMap.get(classItem.homeroomTeacherId);
  const campusName = getCampusDisplayName(classItem.campusId);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6 transition-all hover:shadow-md">
      {/* 1. Header Card y hệt Screenshot 1 */}
      <div className="bg-[#12163b] text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Badge + Tên Lớp + Điểm Trường + GVCN */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-white text-sm shadow-xs shrink-0 tracking-wide">
            {classItem.name}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight uppercase">
                LỚP {classItem.name} • KHỐI {classItem.grade}
              </h3>
              <span className="text-[11px] font-semibold bg-white/15 text-slate-200 px-2 py-0.5 rounded-md border border-white/10">
                {campusName}
              </span>
              {classItem.grade <= 7 ? (
                <span className="text-[11px] font-semibold bg-emerald-500/25 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/40">
                  Chính khóa: Buổi Chiều • Trái buổi: Buổi Sáng
                </span>
              ) : (
                <span className="text-[11px] font-semibold bg-blue-500/25 text-blue-200 px-2 py-0.5 rounded-md border border-blue-500/40">
                  Chính khóa: Buổi Sáng
                </span>
              )}
            </div>
            <div className="text-xs text-slate-300 font-medium mt-0.5 flex items-center gap-3 flex-wrap">
              <span>
                GVCN: <span className="text-white font-bold">{homeroomTeacher?.fullName || 'Chưa phân công'}</span>
              </span>
              <span>•</span>
              <span className="text-amber-300 font-semibold">Tiết trống tập trung vào Thứ Năm</span>
            </div>
          </div>
        </div>

        {/* Right: Tuần + Năm học */}
        <div className="text-right text-xs text-slate-300 font-medium">
          <span className="text-white font-bold">{getWeekDateRangeText(currentWeek)}</span>
        </div>
      </div>

      {/* 2. Table Thời Khóa Biểu y hệt Screenshot 1 */}
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
              <tr key={`morning_${p}`} className="hover:bg-slate-50/60 transition-colors">
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
                  const subjectName = slot
                    ? (slot.subComponentName || subjectMap.get(slot.subjectId)?.name || 'Môn học')
                    : null;
                  const teacherName = slot ? teacherMap.get(slot.teacherId)?.fullName : null;

                  return (
                    <td
                      key={`m_${day.num}_${p}`}
                      onClick={() => {
                        if (isViewOnly) return;
                        if (slot && onEditSlot) {
                          onEditSlot(slot);
                        } else if (!slot && onAddSlot) {
                          onAddSlot({
                            classId: classItem.id,
                            dayOfWeek: day.num,
                            periodNumber: p,
                            shift: 'morning',
                            campusId: classItem.campusId,
                          });
                        }
                      }}
                      className={`p-2 border-r border-slate-200 last:border-r-0 align-middle h-14 ${
                        !isViewOnly ? 'cursor-pointer hover:bg-blue-50/40' : ''
                      }`}
                    >
                      {slot ? (
                        <div
                          className={`flex flex-col items-center justify-center leading-tight py-1 px-1 rounded-md transition-all ${
                            slot.isOppositeShift
                              ? 'bg-amber-100/80 border border-amber-300 shadow-2xs'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-1 flex-wrap justify-center">
                            <span className="font-bold text-slate-900 text-[13px]">{subjectName}</span>
                            {slot.isOppositeShift && (
                              <span className="text-[9.5px] font-extrabold text-amber-800 bg-amber-200/90 px-1.5 py-0.2 rounded leading-none border border-amber-300/80">
                                Trái buổi
                              </span>
                            )}
                          </div>
                          <span className="text-blue-600 text-[11px] font-medium mt-0.5">{teacherName}</span>
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
              <tr key={`afternoon_${p}`} className="hover:bg-slate-50/60 transition-colors">
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
                  const subjectName = slot
                    ? (slot.subComponentName || subjectMap.get(slot.subjectId)?.name || 'Môn học')
                    : null;
                  const teacherName = slot ? teacherMap.get(slot.teacherId)?.fullName : null;

                  return (
                    <td
                      key={`a_${day.num}_${p}`}
                      onClick={() => {
                        if (isViewOnly) return;
                        if (slot && onEditSlot) {
                          onEditSlot(slot);
                        } else if (!slot && onAddSlot) {
                          onAddSlot({
                            classId: classItem.id,
                            dayOfWeek: day.num,
                            periodNumber: p,
                            shift: 'afternoon',
                            campusId: classItem.campusId,
                          });
                        }
                      }}
                      className={`p-2 border-r border-slate-200 last:border-r-0 align-middle h-14 ${
                        !isViewOnly ? 'cursor-pointer hover:bg-amber-50/40' : ''
                      }`}
                    >
                      {slot ? (
                        <div
                          className={`flex flex-col items-center justify-center leading-tight py-1 px-1 rounded-md transition-all ${
                            slot.isOppositeShift
                              ? 'bg-amber-100/80 border border-amber-300 shadow-2xs'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-1 flex-wrap justify-center">
                            <span className="font-bold text-slate-900 text-[13px]">{subjectName}</span>
                            {slot.isOppositeShift && (
                              <span className="text-[9.5px] font-extrabold text-amber-800 bg-amber-200/90 px-1.5 py-0.2 rounded leading-none border border-amber-300/80">
                                Trái buổi
                              </span>
                            )}
                          </div>
                          <span className="text-blue-600 text-[11px] font-medium mt-0.5">{teacherName}</span>
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
