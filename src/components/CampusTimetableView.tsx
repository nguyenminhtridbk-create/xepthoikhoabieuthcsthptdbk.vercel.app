import React, { useState, useMemo } from 'react';
import {
  Building,
  School,
  Calendar,
  Clock,
  Users,
  User,
  MapPin,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Lock,
  AlertTriangle,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
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

interface CampusTimetableViewProps {
  slots: PeriodSlot[];
  teachers: Teacher[];
  classes: ClassRoom[];
  subjects: Subject[];
  rooms: Room[];
  campuses: Campus[];
  conflicts: ScheduleConflict[];
  currentWeek: number;
  initialCampusId?: string;
  currentRole: UserRole;
  onEditSlot: (slot: PeriodSlot) => void;
  onAddSlot: (prefill?: Partial<PeriodSlot>) => void;
  onDeleteSlot: (slotId: string) => void;
}

export const CampusTimetableView: React.FC<CampusTimetableViewProps> = ({
  slots,
  teachers,
  classes,
  subjects,
  rooms,
  campuses,
  conflicts,
  currentWeek,
  initialCampusId = 'campus_main',
  currentRole,
  onEditSlot,
  onAddSlot,
  onDeleteSlot,
}) => {
  const [selectedCampusId, setSelectedCampusId] = useState<string>(
    initialCampusId === 'all' ? 'campus_main' : initialCampusId
  );
  const [selectedDay, setSelectedDay] = useState<number>(2); // 2: Thứ 2, 0: Cả tuần
  const [selectedShift, setSelectedShift] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);
  const campusMap = useMemo(() => new Map(campuses.map((cp) => [cp.id, cp])), [campuses]);

  const currentCampus = campusMap.get(selectedCampusId) || campuses[0];

  // Lớp thuộc điểm trường này
  const campusClasses = useMemo(() => {
    return classes.filter((c) => c.campusId === selectedCampusId);
  }, [classes, selectedCampusId]);

  // Phòng học thuộc điểm trường này
  const campusRooms = useMemo(() => {
    return rooms.filter((r) => r.campusId === selectedCampusId);
  }, [rooms, selectedCampusId]);

  // Slots tuần hiện tại của điểm trường này
  const campusSlots = useMemo(() => {
    return slots.filter((s) => s.weekNumber === currentWeek && s.campusId === selectedCampusId);
  }, [slots, currentWeek, selectedCampusId]);

  // Các giáo viên có tiết dạy tại điểm trường này trong tuần
  const activeTeachersInCampus = useMemo(() => {
    const teacherIdSet = new Set(campusSlots.map((s) => s.teacherId));
    return teachers.filter((t) => teacherIdSet.has(t.id));
  }, [campusSlots, teachers]);

  // Phát hiện giáo viên di chuyển liên cơ sở trong ngày
  const multiCampusTeachersInDay = useMemo(() => {
    const daySlots = slots.filter((s) => s.weekNumber === currentWeek && s.dayOfWeek === selectedDay);
    const teacherCampusMap = new Map<string, Set<string>>();

    daySlots.forEach((s) => {
      if (!teacherCampusMap.has(s.teacherId)) {
        teacherCampusMap.set(s.teacherId, new Set());
      }
      teacherCampusMap.get(s.teacherId)!.add(s.campusId);
    });

    const multiList: { teacher: Teacher; campusCount: number; campusNames: string[] }[] = [];
    teacherCampusMap.forEach((campusSet, tId) => {
      if (campusSet.size > 1 && campusSet.has(selectedCampusId)) {
        const teacher = teacherMap.get(tId);
        if (teacher) {
          multiList.push({
            teacher,
            campusCount: campusSet.size,
            campusNames: Array.from(campusSet).map((cid) => campusMap.get(cid)?.code || cid),
          });
        }
      }
    });

    return multiList;
  }, [slots, currentWeek, selectedDay, selectedCampusId, teacherMap, campusMap]);

  // Lọc danh sách lớp hiển thị
  const filteredCampusClasses = useMemo(() => {
    return campusClasses.filter((cls) => {
      if (gradeFilter !== 'all' && cls.grade.toString() !== gradeFilter) {
        return false;
      }
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchName = cls.name.toLowerCase().includes(query);
        const homeroomTeacher = teacherMap.get(cls.homeroomTeacherId);
        const matchTeacher = homeroomTeacher?.fullName.toLowerCase().includes(query);
        return matchName || matchTeacher;
      }
      return true;
    });
  }, [campusClasses, gradeFilter, searchTerm, teacherMap]);

  const daysList = [
    { num: 2, label: 'Thứ Hai' },
    { num: 3, label: 'Thứ Ba' },
    { num: 4, label: 'Thứ Tư' },
    { num: 5, label: 'Thứ Năm' },
    { num: 6, label: 'Thứ Sáu' },
    { num: 7, label: 'Thứ Bảy' },
  ];

  const periodsList = [
    { num: 1, morningTime: '07:15 - 08:00', afternoonTime: '13:00 - 13:45' },
    { num: 2, morningTime: '08:05 - 08:50', afternoonTime: '13:50 - 14:35' },
    { num: 3, morningTime: '09:05 - 09:50', afternoonTime: '14:50 - 15:35' },
    { num: 4, morningTime: '09:55 - 10:40', afternoonTime: '15:40 - 16:25' },
    { num: 5, morningTime: '10:45 - 11:30', afternoonTime: '16:30 - 17:15' },
  ];

  // Xuất Excel riêng cho Điểm trường
  const handleExportCampusExcel = () => {
    const campusCode = currentCampus.code;
    const headers = ['Lớp', 'Ca', 'GVCN', 'Tiết 1', 'Tiết 2', 'Tiết 3', 'Tiết 4', 'Tiết 5'];
    const rows: any[][] = [];

    daysList.forEach((d) => {
      rows.push([`=== THỜI KHÓA BIỂU ${d.label.toUpperCase()} ===`]);

      ['morning', 'afternoon'].forEach((shift) => {
        const shiftLabel = shift === 'morning' ? 'SÁNG' : 'CHIỀU';
        rows.push([`--- BUỔI ${shiftLabel} ---`]);

        filteredCampusClasses
          .filter((cls) => shift === 'morning' || cls.shift === 'afternoon')
          .forEach((cls) => {
            const rowData: any[] = [
              cls.name,
              cls.shift === 'morning' ? 'Sáng' : 'Chiều',
              teacherMap.get(cls.homeroomTeacherId)?.fullName || '',
            ];

            for (let p = 1; p <= 5; p++) {
              const slot = campusSlots.find(
                (s) =>
                  s.classId === cls.id &&
                  s.dayOfWeek === d.num &&
                  s.shift === shift &&
                  s.periodNumber === p
              );
              if (slot) {
                const sub = subjectMap.get(slot.subjectId);
                const teacher = teacherMap.get(slot.teacherId);
                const subText = slot.subComponentName
                  ? `${sub?.name} (${slot.subComponentName})`
                  : sub?.name || '';
                rowData.push(`${subText} - ${teacher?.fullName || ''}`);
              } else {
                rowData.push('');
              }
            }
            rows.push(rowData);
          });
      });
      rows.push([]);
    });

    const ws = XLSX.utils.aoa_to_sheet([
      [`THỜI KHÓA BIỂU ĐIỂM TRƯỜNG: ${currentCampus.name.toUpperCase()} (${campusCode})`],
      [`Tuần ${currentWeek} - Năm học 2026-2027`],
      [],
      headers,
      ...rows,
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `TKB_${campusCode}`);
    XLSX.writeFile(wb, `TKB_DiemTruong_${campusCode}_Tuan${currentWeek}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* 1. Thanh chọn Điểm Trường & Thông tin tổng quát */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tabs 3 Điểm trường */}
          <div className="flex items-center gap-2 flex-wrap">
            {campuses.map((cp) => {
              const isSelected = cp.id === selectedCampusId;
              const countClasses = classes.filter((c) => c.campusId === cp.id).length;
              const countRooms = rooms.filter((r) => r.campusId === cp.id).length;

              return (
                <button
                  key={cp.id}
                  type="button"
                  onClick={() => setSelectedCampusId(cp.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-semibold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {cp.code}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">{cp.name}</div>
                    <div className={`text-[11px] ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                      {countClasses} lớp • {countRooms} phòng
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Nút hành động nhanh */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onAddSlot({ campusId: selectedCampusId })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Tiết Tại CS Này</span>
            </button>
            <button
              type="button"
              onClick={handleExportCampusExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất Excel CS Này</span>
            </button>
          </div>
        </div>

        {/* Thống kê điểm trường */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="text-[11px] text-slate-500 font-medium">Quy mô lớp học</div>
            <div className="text-xl font-extrabold text-indigo-700 mt-0.5">
              {campusClasses.length} <span className="text-xs font-normal text-slate-500">lớp</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Sáng: {campusClasses.filter((c) => c.shift === 'morning').length} lớp • Chiều: {campusClasses.filter((c) => c.shift === 'afternoon').length} lớp
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="text-[11px] text-slate-500 font-medium">Giáo viên đến giảng dạy</div>
            <div className="text-xl font-extrabold text-blue-700 mt-0.5">
              {activeTeachersInCampus.length} <span className="text-xs font-normal text-slate-500">thầy cô</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Có tiết trong tuần {currentWeek}</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="text-[11px] text-slate-500 font-medium">Tổng số tiết tuần {currentWeek}</div>
            <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
              {campusSlots.length} <span className="text-xs font-normal text-slate-500">tiết</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Đã phân bổ lịch học</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="text-[11px] text-slate-500 font-medium">Quy mô điểm trường</div>
            <div className="text-xl font-extrabold text-indigo-700 mt-0.5">
              {campusClasses.length} <span className="text-xs font-normal text-slate-500">lớp học</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{currentCampus?.address.split('(')[0]}</div>
          </div>
        </div>
      </div>

      {/* Cảnh báo Giáo viên dạy liên cơ sở trong ngày nếu có */}
      {multiCampusTeachersInDay.length > 0 && selectedDay > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-amber-950">
              Cảnh báo di chuyển liên cơ sở Thứ {selectedDay}:
            </span>{' '}
            Có {multiCampusTeachersInDay.length} giáo viên có tiết tại {currentCampus.code} và cơ sở khác trong ngày (
            {multiCampusTeachersInDay.map((m, idx) => (
              <span key={m.teacher.id}>
                {idx > 0 && ', '}
                <strong className="text-indigo-900">{m.teacher.fullName}</strong> ({m.campusNames.join(' ⇄ ')})
              </span>
            ))}
            ). Hãy kiểm tra khoảng cách thời gian giữa các ca để đảm bảo thầy cô kịp di chuyển.
          </div>
        </div>
      )}

      {/* 2. Bộ lọc ngày, ca, khối & tìm kiếm */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Chọn Thứ trong tuần */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto">
          {daysList.map((d) => (
            <button
              key={d.num}
              type="button"
              onClick={() => setSelectedDay(d.num)}
              className={`px-3 py-1.5 rounded-md font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedDay === d.num
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Chọn Buổi (Ca) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setSelectedShift('all')}
            className={`px-2.5 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              selectedShift === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cả ngày
          </button>
          <button
            type="button"
            onClick={() => setSelectedShift('morning')}
            className={`px-2.5 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              selectedShift === 'morning' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sáng
          </button>
          <button
            type="button"
            onClick={() => setSelectedShift('afternoon')}
            className={`px-2.5 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              selectedShift === 'afternoon' ? 'bg-white text-amber-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chiều
          </button>
        </div>

        {/* Lọc Khối và Tìm kiếm */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold"
          >
            <option value="all">Tất cả các khối</option>
            {Array.from(new Set(campusClasses.map((c) => c.grade))).sort((a, b) => Number(a) - Number(b)).map((gr) => (
              <option key={gr} value={gr.toString()}>
                Khối {gr}
              </option>
            ))}
          </select>

          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm lớp, GVCN..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 3. Ma trận Thời Khóa Biểu Điểm Trường (Campus Matrix) */}
      <div className="space-y-4">
        {/* Hiển thị Ca Sáng nếu được chọn */}
        {(selectedShift === 'all' || selectedShift === 'morning') && (
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-bold">
                  BUỔI SÁNG (07:15 - 11:30)
                </span>
                <span className="text-xs text-slate-600 font-semibold">
                  Thứ {selectedDay} • {currentCampus.name}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                {filteredCampusClasses.length} lớp học
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 w-36 border-r border-slate-200">Lớp / GVCN</th>
                    {periodsList.map((p) => (
                      <th key={p.num} className="py-2 px-2 text-center border-r border-slate-200 last:border-r-0">
                        <div className="text-indigo-950 font-bold">Tiết {p.num}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{p.morningTime}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCampusClasses.map((cls) => {
                    const homeroomTeacher = teacherMap.get(cls.homeroomTeacherId);
                    return (
                      <tr key={`morning_${cls.id}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3 border-r border-slate-200 bg-slate-50/50">
                          <div className="font-extrabold text-slate-900 text-sm">{cls.name}</div>
                          <div className="text-[10px] text-slate-500 truncate" title={homeroomTeacher?.fullName}>
                            GVCN: {homeroomTeacher?.fullName || 'Chưa phân'}
                          </div>
                          <div className="text-[10px] text-indigo-600 font-medium">
                            Khối {cls.grade} ({cls.gradeLevel})
                          </div>
                        </td>

                        {periodsList.map((p) => {
                          const slot = campusSlots.find(
                            (s) =>
                              s.classId === cls.id &&
                              s.dayOfWeek === selectedDay &&
                              s.shift === 'morning' &&
                              s.periodNumber === p.num
                          );

                          return (
                            <td
                              key={`m_${cls.id}_${p.num}`}
                              className="p-1.5 border-r border-slate-200 last:border-r-0 align-top h-20 w-44"
                            >
                              {slot ? (
                                <div
                                  onClick={() => onEditSlot(slot)}
                                  className="h-full rounded-lg p-2 bg-blue-50/70 hover:bg-blue-100/90 border border-blue-200 text-slate-800 cursor-pointer transition-all shadow-2xs group flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex items-start justify-between gap-1">
                                      <span className="font-bold text-blue-950 text-xs line-clamp-1">
                                        {slot.subComponentName || subjectMap.get(slot.subjectId)?.name || 'Môn'}
                                      </span>
                                      <div className="flex items-center gap-0.5 shrink-0">
                                        {slot.isLocked && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                                        <Edit2 className="w-2.5 h-2.5 text-slate-400 group-hover:text-indigo-600" />
                                      </div>
                                    </div>
                                    <div className="text-[11px] text-slate-700 font-medium mt-0.5 line-clamp-1">
                                      {teacherMap.get(slot.teacherId)?.fullName || 'Chưa có GV'}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-blue-200/50 mt-1">
                                    <span className="font-semibold text-blue-800">{cls.name}</span>
                                    <span className="text-[9px] px-1 bg-blue-200/60 rounded text-blue-900 font-bold">Sáng</span>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onAddSlot({
                                      classId: cls.id,
                                      dayOfWeek: selectedDay,
                                      shift: 'morning',
                                      periodNumber: p.num,
                                      campusId: selectedCampusId,
                                    })
                                  }
                                  className="w-full h-full rounded-lg border border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 flex items-center justify-center text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer"
                                  title="Thêm tiết tại ô này"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Hiển thị Ca Chiều nếu được chọn */}
        {(selectedShift === 'all' || selectedShift === 'afternoon') && (
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-amber-50/80 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-600 text-white rounded text-xs font-bold">
                  BUỔI CHIỀU (13:00 - 17:15)
                </span>
                <span className="text-xs text-slate-600 font-semibold">
                  Thứ {selectedDay} • {currentCampus.name}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                Lớp học ca chiều &amp; tiết phụ đạo/tăng cường
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 w-36 border-r border-slate-200">Lớp / GVCN</th>
                    {periodsList.map((p) => (
                      <th key={p.num} className="py-2 px-2 text-center border-r border-slate-200 last:border-r-0">
                        <div className="text-amber-950 font-bold">Tiết {p.num}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{p.afternoonTime}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCampusClasses
                    .filter((cls) => cls.shift === 'afternoon' || campusSlots.some((s) => s.classId === cls.id && s.shift === 'afternoon' && s.dayOfWeek === selectedDay))
                    .map((cls) => {
                      const homeroomTeacher = teacherMap.get(cls.homeroomTeacherId);
                      return (
                        <tr key={`afternoon_${cls.id}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-3 border-r border-slate-200 bg-slate-50/50">
                            <div className="font-extrabold text-slate-900 text-sm">{cls.name}</div>
                            <div className="text-[10px] text-slate-500 truncate" title={homeroomTeacher?.fullName}>
                              GVCN: {homeroomTeacher?.fullName || 'Chưa phân'}
                            </div>
                            <div className="text-[10px] text-amber-700 font-medium">
                              Ca chiều • Khối {cls.grade}
                            </div>
                          </td>

                          {periodsList.map((p) => {
                            const slot = campusSlots.find(
                              (s) =>
                                s.classId === cls.id &&
                                s.dayOfWeek === selectedDay &&
                                s.shift === 'afternoon' &&
                                s.periodNumber === p.num
                            );

                            return (
                              <td
                                key={`af_${cls.id}_${p.num}`}
                                className="p-1.5 border-r border-slate-200 last:border-r-0 align-top h-20 w-44"
                              >
                                {slot ? (
                                  <div
                                    onClick={() => onEditSlot(slot)}
                                    className="h-full rounded-lg p-2 bg-amber-50/70 hover:bg-amber-100/90 border border-amber-200 text-slate-800 cursor-pointer transition-all shadow-2xs group flex flex-col justify-between"
                                  >
                                    <div>
                                      <div className="flex items-start justify-between gap-1">
                                        <span className="font-bold text-amber-950 text-xs line-clamp-1">
                                          {slot.subComponentName || subjectMap.get(slot.subjectId)?.name || 'Môn'}
                                        </span>
                                        <div className="flex items-center gap-0.5 shrink-0">
                                          {slot.isLocked && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                                          <Edit2 className="w-2.5 h-2.5 text-slate-400 group-hover:text-amber-700" />
                                        </div>
                                      </div>
                                      <div className="text-[11px] text-slate-700 font-medium mt-0.5 line-clamp-1">
                                        {teacherMap.get(slot.teacherId)?.fullName || 'Chưa có GV'}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-amber-200/50 mt-1">
                                      <span className="font-semibold text-amber-800">{cls.name}</span>
                                      <span className="text-[9px] px-1 bg-amber-200/60 rounded text-amber-900 font-bold">Chiều</span>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onAddSlot({
                                        classId: cls.id,
                                        dayOfWeek: selectedDay,
                                        shift: 'afternoon',
                                        periodNumber: p.num,
                                        campusId: selectedCampusId,
                                      })
                                    }
                                    className="w-full h-full rounded-lg border border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 flex items-center justify-center text-slate-300 hover:text-amber-600 transition-colors cursor-pointer"
                                    title="Thêm tiết tại ô này"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 4. Danh sách giáo viên có mặt tại điểm trường trong ngày này */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          <span>Danh Sách Giáo Viên Có Tiết Dạy Tại {currentCampus.name} (Thứ {selectedDay})</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-2">
          {activeTeachersInCampus
            .filter((t) => campusSlots.some((s) => s.teacherId === t.id && s.dayOfWeek === selectedDay))
            .map((t) => {
              const teacherSlotsToday = campusSlots.filter(
                (s) => s.teacherId === t.id && s.dayOfWeek === selectedDay
              );
              return (
                <div key={t.id} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <div className="font-bold text-slate-900 truncate" title={t.fullName}>
                    {t.fullName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    [{t.code}] • {t.department}
                  </div>
                  <div className="text-[10px] text-indigo-600 font-semibold mt-1">
                    {teacherSlotsToday.length} tiết hôm nay
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
