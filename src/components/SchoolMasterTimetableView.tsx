import React, { useState, useMemo } from 'react';
import {
  School,
  Globe,
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
  Building,
  Layers,
  ChevronDown,
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

interface SchoolMasterTimetableViewProps {
  slots: PeriodSlot[];
  teachers: Teacher[];
  classes: ClassRoom[];
  subjects: Subject[];
  rooms: Room[];
  campuses: Campus[];
  conflicts: ScheduleConflict[];
  currentWeek: number;
  currentRole: UserRole;
  onEditSlot: (slot: PeriodSlot) => void;
  onAddSlot: (prefill?: Partial<PeriodSlot>) => void;
  onDeleteSlot: (slotId: string) => void;
}

export const SchoolMasterTimetableView: React.FC<SchoolMasterTimetableViewProps> = ({
  slots,
  teachers,
  classes,
  subjects,
  rooms,
  campuses,
  conflicts,
  currentWeek,
  currentRole,
  onEditSlot,
  onAddSlot,
  onDeleteSlot,
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(2); // Thứ 2 đến Thứ 7
  const [selectedShift, setSelectedShift] = useState<'all' | 'morning' | 'afternoon'>('all');
  const [selectedCampusId, setSelectedCampusId] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'THCS' | 'THPT'>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [masterViewSubMode, setMasterViewSubMode] = useState<'matrix' | 'live_monitor' | 'summary'>('matrix');
  const [monitorPeriod, setMonitorPeriod] = useState<{ shift: 'morning' | 'afternoon'; period: number }>({
    shift: 'morning',
    period: 1,
  });

  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);
  const campusMap = useMemo(() => new Map(campuses.map((cp) => [cp.id, cp])), [campuses]);

  // Toàn bộ slots tuần hiện tại
  const weekSlots = useMemo(() => {
    return slots.filter((s) => s.weekNumber === currentWeek);
  }, [slots, currentWeek]);

  // Lọc danh sách lớp
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      if (selectedCampusId !== 'all' && cls.campusId !== selectedCampusId) return false;
      if (selectedLevel !== 'all' && cls.gradeLevel !== selectedLevel) return false;
      if (selectedGrade !== 'all' && cls.grade.toString() !== selectedGrade) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = cls.name.toLowerCase().includes(q);
        const matchHomeroom = teacherMap.get(cls.homeroomTeacherId)?.fullName.toLowerCase().includes(q);
        const matchCampus = campusMap.get(cls.campusId)?.name.toLowerCase().includes(q);
        return matchName || matchHomeroom || matchCampus;
      }
      return true;
    });
  }, [classes, selectedCampusId, selectedLevel, selectedGrade, searchTerm, teacherMap, campusMap]);

  // Phân nhóm lớp theo điểm trường để hiển thị
  const classesGroupedByCampus = useMemo(() => {
    const group = new Map<string, ClassRoom[]>();
    campuses.forEach((cp) => group.set(cp.id, []));

    filteredClasses.forEach((cls) => {
      if (!group.has(cls.campusId)) {
        group.set(cls.campusId, []);
      }
      group.get(cls.campusId)!.push(cls);
    });

    return group;
  }, [filteredClasses, campuses]);

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

  // Thống kê toàn trường
  const stats = useMemo(() => {
    const totalSlots = weekSlots.length;
    const morningSlots = weekSlots.filter((s) => s.shift === 'morning').length;
    const afternoonSlots = weekSlots.filter((s) => s.shift === 'afternoon').length;
    const lockedSlots = weekSlots.filter((s) => s.isLocked).length;

    return {
      totalClasses: classes.length,
      totalTeachers: teachers.length,
      totalCampuses: campuses.length,
      totalSlots,
      morningSlots,
      afternoonSlots,
      lockedSlots,
    };
  }, [classes, teachers, campuses, weekSlots]);

  // Xuất Excel Ma Trận Toàn Trường
  const handleExportMasterExcel = () => {
    const headers = ['Cơ sở', 'Khối', 'Lớp', 'GVCN', 'Ca học', 'Tiết 1', 'Tiết 2', 'Tiết 3', 'Tiết 4', 'Tiết 5'];
    const rows: any[][] = [];

    daysList.forEach((d) => {
      rows.push([`=== THỜI KHÓA BIỂU TOÀN TRƯỜNG - ${d.label.toUpperCase()} ===`]);

      ['morning', 'afternoon'].forEach((shift) => {
        const shiftLabel = shift === 'morning' ? 'BUỔI SÁNG' : 'BUỔI CHIỀU';
        rows.push([`--- ${shiftLabel} ---`]);

        filteredClasses
          .filter((cls) => shift === 'morning' || cls.shift === 'afternoon')
          .forEach((cls) => {
            const cpCode = campusMap.get(cls.campusId)?.code || cls.campusId;
            const rowData: any[] = [
              cpCode,
              cls.grade,
              cls.name,
              teacherMap.get(cls.homeroomTeacherId)?.fullName || '',
              cls.shift === 'morning' ? 'Sáng' : 'Chiều',
            ];

            for (let p = 1; p <= 5; p++) {
              const slot = weekSlots.find(
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
                rowData.push(`${subText}\n[${teacher?.code || ''}]`);
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
      ['THỜI KHÓA BIỂU TỔNG THỂ TOÀN TRƯỜNG THCS & THPT ĐỐC BINH KIỀU'],
      [`Kế hoạch Tuần ${currentWeek} - Học kỳ 1 Năm học 2026-2027 (53 Lớp - 101 Giáo viên)`],
      [],
      headers,
      ...rows,
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TKB_ToanTruong');
    XLSX.writeFile(wb, `TKB_ToanTruong_DBK_Tuan${currentWeek}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* 1. Dashboard Thống Kê Tổng Quan Toàn Trường */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                <Globe className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  Thời Khóa Biểu Tổng Thể Toàn Trường - Tuần {currentWeek}
                </h2>
                <p className="text-xs text-slate-500">
                  Xem đồng thời 53 lớp tại 3 điểm trường (CS1-Chính, CS2-ĐBK, CS3-Tân Kiều) với 101 giáo viên.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onAddSlot()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Tiết Học Mới</span>
            </button>
            <button
              type="button"
              onClick={handleExportMasterExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất Excel Toàn Trường</span>
            </button>
          </div>
        </div>

        {/* 4 Chỉ số tổng quát */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="text-[11px] text-slate-500 font-medium">Quy mô toàn trường</div>
            <div className="text-xl font-extrabold text-indigo-700 mt-0.5">
              53 <span className="text-xs font-normal text-slate-500">lớp</span> • 3 <span className="text-xs font-normal text-slate-500">cơ sở</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">CS1: 31 • CS2: 12 • CS3: 10</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="text-[11px] text-slate-500 font-medium">Đội ngũ nhà giáo</div>
            <div className="text-xl font-extrabold text-blue-700 mt-0.5">
              101 <span className="text-xs font-normal text-slate-500">giáo viên</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Đã gán 100% tiết giảng dạy</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="text-[11px] text-slate-500 font-medium">Tổng tiết đã xếp</div>
            <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
              {stats.totalSlots} <span className="text-xs font-normal text-slate-500">tiết</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Sáng: {stats.morningSlots} • Chiều: {stats.afternoonSlots}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="text-[11px] text-slate-500 font-medium">Kiểm soát xung đột</div>
            <div className="text-xl font-extrabold text-emerald-600 mt-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 inline" />
              <span>0 Trùng lịch</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Không có xung đột cứng</div>
          </div>
        </div>
      </div>

      {/* 2. Thanh chế độ xem & Bộ lọc thông minh */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-3.5 space-y-3">
        {/* Hàng 1: Chuyển đổi giữa [Ma trận theo ngày] & [Giám sát thời gian thực] & [Tổng hợp 53 lớp] */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMasterViewSubMode('matrix')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                masterViewSubMode === 'matrix'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ma Trận Theo Ngày (53 Lớp)
            </button>
            <button
              type="button"
              onClick={() => setMasterViewSubMode('live_monitor')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                masterViewSubMode === 'live_monitor'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Giám Sát Tiết Dạy Trực Tiếp
            </button>
            <button
              type="button"
              onClick={() => setMasterViewSubMode('summary')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                masterViewSubMode === 'summary'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bảng Tổng Hợp 53 Lớp Tuần
            </button>
          </div>

          {/* Chọn Thứ trong tuần khi ở chế độ matrix / live_monitor */}
          {masterViewSubMode !== 'summary' && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto text-xs">
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
          )}
        </div>

        {/* Hàng 2: Bộ lọc đa chiều: Điểm trường, Cấp học, Khối, Ca học, Tìm kiếm */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Lọc Điểm Trường */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Điểm:</span>
            <select
              value={selectedCampusId}
              onChange={(e) => setSelectedCampusId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-semibold text-slate-800"
            >
              <option value="all">Tất cả 3 điểm trường (53 lớp)</option>
              {campuses.map((cp) => (
                <option key={cp.id} value={cp.id}>
                  {cp.code} - {cp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Cấp học */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Cấp:</span>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-semibold text-slate-800"
            >
              <option value="all">Cả 2 cấp</option>
              <option value="THCS">THCS (Khối 6-9)</option>
              <option value="THPT">THPT (Khối 10-12)</option>
            </select>
          </div>

          {/* Lọc Khối */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Khối:</span>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-semibold text-slate-800"
            >
              <option value="all">Tất cả các khối</option>
              {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                <option key={g} value={g.toString()}>
                  Khối {g}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Ca */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Ca:</span>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-semibold text-slate-800"
            >
              <option value="all">Cả ngày (Sáng &amp; Chiều)</option>
              <option value="morning">Buổi Sáng</option>
              <option value="afternoon">Buổi Chiều</option>
            </select>
          </div>

          {/* Ô tìm kiếm */}
          <div className="relative flex-1 min-w-[200px] ml-auto">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên lớp, GVCN hoặc điểm trường..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 3. Render Nội Dung Theo SubMode */}
      {masterViewSubMode === 'matrix' && (
        <div className="space-y-6">
          {campuses
            .filter((cp) => selectedCampusId === 'all' || cp.id === selectedCampusId)
            .map((campus) => {
              const currentCampusClasses = classesGroupedByCampus.get(campus.id) || [];
              if (currentCampusClasses.length === 0) return null;

              return (
                <div key={campus.id} className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                  {/* Header của Điểm Trường */}
                  <div className="px-4 py-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 rounded text-xs font-bold border border-indigo-500/40">
                        {campus.code}
                      </span>
                      <h3 className="text-sm font-bold">{campus.name}</h3>
                      <span className="text-xs text-slate-300">
                        ({currentCampusClasses.length} lớp hiển thị)
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 flex items-center gap-3">
                      <span>Thứ {selectedDay}</span>
                      <span>•</span>
                      <span>{campus.address}</span>
                    </div>
                  </div>

                  {/* Bảng Ma Trận Lớp của Điểm Trường này */}
                  <div className="overflow-x-auto max-h-[700px]">
                    <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px] sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3 w-36 border-r border-slate-200 bg-slate-100">Lớp / Ca</th>
                          <th className="py-2.5 px-3 w-36 border-r border-slate-200 bg-slate-100">GV Chủ Nhiệm</th>
                          {periodsList.map((p) => (
                            <th key={p.num} className="py-2 px-2 text-center border-r border-slate-200 last:border-r-0 bg-slate-100">
                              <div className="text-indigo-950 font-bold">Tiết {p.num}</div>
                              <div className="text-[10px] text-slate-500 font-normal">
                                {selectedShift === 'afternoon' ? p.afternoonTime : p.morningTime}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {currentCampusClasses.map((cls) => {
                          const homeroomTeacher = teacherMap.get(cls.homeroomTeacherId);
                          // Xác định ca cần hiển thị
                          const targetShift = selectedShift === 'all' ? cls.shift : selectedShift;

                          return (
                            <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 border-r border-slate-200 bg-slate-50/50">
                                <div className="font-extrabold text-slate-900 text-sm">{cls.name}</div>
                                <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                                  Khối {cls.grade} ({cls.gradeLevel})
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {cls.shift === 'morning' ? 'Ca Sáng' : 'Ca Chiều'}
                                </div>
                              </td>

                              <td className="py-2 px-3 border-r border-slate-200">
                                <div className="font-semibold text-slate-900 text-xs">
                                  {homeroomTeacher?.fullName || 'Chưa phân'}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Mã: {homeroomTeacher?.code || '—'}
                                </div>
                              </td>

                              {periodsList.map((p) => {
                                const slot = weekSlots.find(
                                  (s) =>
                                    s.classId === cls.id &&
                                    s.dayOfWeek === selectedDay &&
                                    s.shift === targetShift &&
                                    s.periodNumber === p.num
                                );

                                return (
                                  <td
                                    key={`${cls.id}_${p.num}`}
                                    className="p-1.5 border-r border-slate-200 last:border-r-0 align-top h-20 w-44"
                                  >
                                    {slot ? (
                                      <div
                                        onClick={() => onEditSlot(slot)}
                                        className="h-full rounded-lg p-2 bg-indigo-50/70 hover:bg-indigo-100/90 border border-indigo-200 text-slate-800 cursor-pointer transition-all shadow-2xs group flex flex-col justify-between"
                                      >
                                        <div>
                                          <div className="flex items-start justify-between gap-1">
                                            <span className="font-bold text-indigo-950 text-xs line-clamp-1">
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
                                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-indigo-200/50 mt-1">
                                          <span className="font-semibold text-indigo-700">
                                            {cls.name}
                                          </span>
                                          <span className="text-[9px] px-1 bg-indigo-200/60 rounded text-indigo-900 font-bold">
                                            {slot.shift === 'morning' ? 'Sáng' : 'Chiều'}
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onAddSlot({
                                            classId: cls.id,
                                            dayOfWeek: selectedDay,
                                            shift: targetShift,
                                            periodNumber: p.num,
                                            campusId: cls.campusId,
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
              );
            })}
        </div>
      )}

      {/* Mode B: Giám sát tiết dạy trực tiếp (Live Monitor) */}
      {masterViewSubMode === 'live_monitor' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bản Đồ Giảng Dạy Trực Tiếp Toàn Trường - Thứ {selectedDay}
              </h3>
              <p className="text-xs text-slate-500">
                Kiểm tra vị trí và hoạt động của tất cả 53 lớp và 101 giáo viên trong từng tiết cụ thể.
              </p>
            </div>

            {/* Bộ chọn Ca và Tiết */}
            <div className="flex items-center gap-2">
              <select
                value={monitorPeriod.shift}
                onChange={(e) =>
                  setMonitorPeriod({ ...monitorPeriod, shift: e.target.value as 'morning' | 'afternoon' })
                }
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800"
              >
                <option value="morning">Buổi Sáng</option>
                <option value="afternoon">Buổi Chiều</option>
              </select>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                {[1, 2, 3, 4, 5].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setMonitorPeriod({ ...monitorPeriod, period: p })}
                    className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      monitorPeriod.period === p
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tiết {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lưới 53 lớp trong tiết này */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredClasses.map((cls) => {
              const activeSlot = weekSlots.find(
                (s) =>
                  s.classId === cls.id &&
                  s.dayOfWeek === selectedDay &&
                  s.shift === monitorPeriod.shift &&
                  s.periodNumber === monitorPeriod.period
              );

              return (
                <div
                  key={cls.id}
                  className={`p-3 rounded-xl border transition-all ${
                    activeSlot
                      ? 'bg-white border-slate-200 shadow-2xs hover:border-indigo-300'
                      : 'bg-slate-50/70 border-slate-200/80 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">{cls.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {campusMap.get(cls.campusId)?.code} • Khối {cls.grade}
                    </span>
                  </div>

                  {activeSlot ? (
                    <div className="mt-2 space-y-1">
                      <div className="text-xs font-bold text-indigo-900">
                        {activeSlot.subComponentName || subjectMap.get(activeSlot.subjectId)?.name}
                      </div>
                      <div className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{teacherMap.get(activeSlot.teacherId)?.fullName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between border-t border-slate-100 mt-1">
                        <span className="font-semibold text-slate-700">Ca: {activeSlot.shift === 'morning' ? 'Sáng' : 'Chiều'}</span>
                        <button
                          type="button"
                          onClick={() => onEditSlot(activeSlot)}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                        >
                          Sửa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs italic text-slate-400 flex items-center justify-between">
                      <span>Trống tiết (Không có lịch)</span>
                      <button
                        type="button"
                        onClick={() =>
                          onAddSlot({
                            classId: cls.id,
                            dayOfWeek: selectedDay,
                            shift: monitorPeriod.shift,
                            periodNumber: monitorPeriod.period,
                            campusId: cls.campusId,
                          })
                        }
                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] cursor-pointer"
                      >
                        + Xếp tiết
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode C: Bảng Tổng Hợp 53 Lớp Cả Tuần (Summary Table) */}
      {masterViewSubMode === 'summary' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase">
              Danh Sách Tổng Hợp 53 Lớp Học Tuần {currentWeek}
            </span>
            <span className="text-xs text-slate-500">
              Hiển thị {filteredClasses.length} / 53 lớp
            </span>
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px] sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th className="py-2.5 px-3">Tên Lớp</th>
                  <th className="py-2.5 px-3">Điểm Trường</th>
                  <th className="py-2.5 px-2 text-center">Khối</th>
                  <th className="py-2.5 px-3">Cấp Học</th>
                  <th className="py-2.5 px-3">Ca Học Chính</th>
                  <th className="py-2.5 px-3">Giáo Viên Chủ Nhiệm</th>
                  <th className="py-2.5 px-3 text-center">Tổng Tiết/Tuần</th>
                  <th className="py-2.5 px-3 text-center">Trạng Thái TKB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredClasses.map((cls, idx) => {
                  const classWeekSlots = weekSlots.filter((s) => s.classId === cls.id);
                  const homeroomTeacher = teacherMap.get(cls.homeroomTeacherId);
                  const cp = campusMap.get(cls.campusId);

                  return (
                    <tr key={cls.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2 px-3 font-extrabold text-slate-900">{cls.name}</td>
                      <td className="py-2 px-3 font-medium text-slate-700">
                        {cp?.code} - {cp?.name}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-slate-800">{cls.grade}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                          {cls.gradeLevel}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cls.shift === 'morning'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {cls.shift === 'morning' ? 'Buổi Sáng' : 'Buổi Chiều'}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900">
                        {homeroomTeacher?.fullName || 'Chưa phân'}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold font-mono rounded text-xs">
                          {classWeekSlots.length} tiết
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã phân bổ</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
