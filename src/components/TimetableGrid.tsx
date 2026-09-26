import React, { useState } from 'react';
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
import {
  Calendar,
  User,
  Users,
  Building,
  AlertCircle,
  AlertTriangle,
  Lock,
  Edit2,
  Check,
  X,
  Shuffle,
  Plus,
  Sparkles,
  MapPin,
  School,
  Globe,
  Layers,
  Search,
  Filter,
} from 'lucide-react';
import { CampusTimetableView } from './CampusTimetableView';
import { SchoolMasterTimetableView } from './SchoolMasterTimetableView';
import { GradeTimetableView } from './GradeTimetableView';
import { ClassTimetableCard } from './ClassTimetableCard';
import { TeacherTimetableCard } from './TeacherTimetableCard';

interface TimetableGridProps {
  slots: PeriodSlot[];
  teachers: Teacher[];
  classes: ClassRoom[];
  subjects: Subject[];
  rooms: Room[];
  campuses: Campus[];
  conflicts: ScheduleConflict[];
  currentWeek: number;
  selectedCampusId: string;
  currentRole: UserRole;
  onUpdateSlot: (slot: PeriodSlot) => void;
  onDeleteSlot: (slotId: string) => void;
  onAddSlot: (slot: Omit<PeriodSlot, 'id'>) => void;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  slots,
  teachers,
  classes,
  subjects,
  rooms,
  campuses,
  conflicts,
  currentWeek,
  selectedCampusId,
  currentRole,
  onUpdateSlot,
  onDeleteSlot,
  onAddSlot,
}) => {
  // Mặc định hiển thị xem theo Lớp (y hệt hình ảnh mẫu người dùng đã gửi)
  const [viewMode, setViewMode] = useState<'class' | 'teacher' | 'school' | 'campus' | 'grade'>('class');

  // Bộ lọc cho chế độ Xem Theo Lớp
  const [classGradeFilter, setClassGradeFilter] = useState<'all' | number>('all');
  const [classViewMode, setClassViewMode] = useState<'all' | 'single'>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes.find((c) => c.name === '10CB1')?.id || classes[0]?.id || 'cls_10cb1'
  );
  const [classSearchText, setClassSearchText] = useState<string>('');

  // Bộ lọc cho chế độ Xem Theo Giáo Viên
  const [teacherDeptFilter, setTeacherDeptFilter] = useState<string>('all');
  const [teacherViewMode, setTeacherViewMode] = useState<'all' | 'single'>('all');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teachers.find((t) => t.fullName.includes('Huy'))?.id || teachers[0]?.id || 'gv_tran_quoc_huy'
  );
  const [teacherSearchText, setTeacherSearchText] = useState<string>('');

  // Modal chỉnh sửa tiết
  const [editingSlot, setEditingSlot] = useState<PeriodSlot | null>(null);
  const [slotForm, setSlotForm] = useState<{
    classId: string;
    dayOfWeek: number;
    shift: 'morning' | 'afternoon';
    periodNumber: number;
    subjectId: string;
    teacherId: string;
    subComponentName?: string;
    roomId: string;
    campusId: string;
    isLocked?: boolean;
    note?: string;
  }>({
    classId: '',
    dayOfWeek: 2,
    shift: 'morning',
    periodNumber: 1,
    subjectId: '',
    teacherId: '',
    roomId: '',
    campusId: '',
    isLocked: false,
    note: '',
  });

  const teacherMap = new Map<string, Teacher>(teachers.map((t) => [t.id, t]));
  const classMap = new Map<string, ClassRoom>(classes.map((c) => [c.id, c]));
  const subjectMap = new Map<string, Subject>(subjects.map((s) => [s.id, s]));
  const roomMap = new Map<string, Room>(rooms.map((r) => [r.id, r]));
  const campusMap = new Map<string, Campus>(campuses.map((cp) => [cp.id, cp]));

  // Danh sách tổ chuyên môn
  const allDepartments = Array.from(new Set(teachers.map((t) => t.department))).filter(Boolean);

  // Lọc danh sách lớp theo điểm trường, khối, tìm kiếm và chế độ xem
  const filteredClasses = classes.filter((c) => {
    if (selectedCampusId !== 'all' && c.campusId !== selectedCampusId) return false;
    if (classGradeFilter !== 'all' && c.grade !== Number(classGradeFilter)) return false;
    if (classSearchText.trim()) {
      const q = classSearchText.toLowerCase().trim();
      return c.name.toLowerCase().includes(q);
    }
    if (classViewMode === 'single') {
      return c.id === selectedClassId;
    }
    return true;
  });

  // Lọc danh sách giáo viên theo điểm trường, tổ, tìm kiếm và chế độ xem
  const filteredTeachers = teachers.filter((t) => {
    if (selectedCampusId !== 'all' && t.primaryCampusId !== selectedCampusId) return false;
    if (teacherDeptFilter !== 'all' && t.department !== teacherDeptFilter) return false;
    if (teacherSearchText.trim()) {
      const q = teacherSearchText.toLowerCase().trim();
      return t.fullName.toLowerCase().includes(q) || t.code.toLowerCase().includes(q);
    }
    if (teacherViewMode === 'single') {
      return t.id === selectedTeacherId;
    }
    return true;
  });

  const handleOpenEdit = (slot: PeriodSlot) => {
    setEditingSlot(slot);
    setSlotForm({
      classId: slot.classId,
      dayOfWeek: slot.dayOfWeek,
      shift: slot.shift || 'morning',
      periodNumber: slot.periodNumber,
      subjectId: slot.subjectId,
      teacherId: slot.teacherId,
      subComponentName: slot.subComponentName || '',
      roomId: slot.roomId,
      campusId: slot.campusId,
      isLocked: !!slot.isLocked,
      note: slot.note || '',
    });
  };

  const handleOpenCreate = (prefill?: Partial<PeriodSlot>) => {
    const targetClassId = prefill?.classId || selectedClassId;
    const targetClass = classMap.get(targetClassId);
    const defaultCampus = prefill?.campusId || targetClass?.campusId || 'campus_main';
    const defaultRoom = rooms.find((r) => r.campusId === defaultCampus)?.id || 'room_main_101';
    const defaultShift = prefill?.shift || (targetClass?.shift === 'afternoon' ? 'afternoon' : 'morning');

    const pseudoSlot: PeriodSlot = {
      id: 'NEW',
      dayOfWeek: prefill?.dayOfWeek || 2,
      periodNumber: prefill?.periodNumber || 1,
      shift: defaultShift,
      classId: targetClassId,
      subjectId: prefill?.subjectId || subjects[0]?.id || 'sub_toan',
      teacherId: prefill?.teacherId || teachers[0]?.id || 'gv_tran_quoc_huy',
      campusId: defaultCampus,
      roomId: defaultRoom,
      weekNumber: currentWeek,
      termId: 'HK1_2026_2027',
      isLocked: false,
    };

    setEditingSlot(pseudoSlot);
    setSlotForm({
      classId: targetClassId,
      dayOfWeek: pseudoSlot.dayOfWeek,
      shift: pseudoSlot.shift,
      periodNumber: pseudoSlot.periodNumber,
      subjectId: pseudoSlot.subjectId,
      teacherId: pseudoSlot.teacherId,
      subComponentName: '',
      campusId: defaultCampus,
      roomId: defaultRoom,
      isLocked: false,
      note: '',
    });
  };

  const handleSaveSlot = () => {
    if (!editingSlot) return;

    if (editingSlot.id === 'NEW') {
      onAddSlot({
        dayOfWeek: Number(slotForm.dayOfWeek),
        periodNumber: Number(slotForm.periodNumber),
        shift: slotForm.shift,
        classId: slotForm.classId,
        subjectId: slotForm.subjectId,
        teacherId: slotForm.teacherId,
        subComponentName: slotForm.subComponentName || undefined,
        campusId: slotForm.campusId,
        roomId: slotForm.roomId,
        weekNumber: currentWeek,
        termId: 'HK1_2026_2027',
        isLocked: slotForm.isLocked,
        note: slotForm.note,
      });
    } else {
      const updated: PeriodSlot = {
        ...editingSlot,
        dayOfWeek: Number(slotForm.dayOfWeek),
        periodNumber: Number(slotForm.periodNumber),
        shift: slotForm.shift,
        classId: slotForm.classId,
        subjectId: slotForm.subjectId,
        teacherId: slotForm.teacherId,
        subComponentName: slotForm.subComponentName || undefined,
        campusId: slotForm.campusId,
        roomId: slotForm.roomId,
        isLocked: slotForm.isLocked,
        note: slotForm.note,
      };
      onUpdateSlot(updated);
    }
    setEditingSlot(null);
  };

  return (
    <div className="space-y-4">
      {/* 1. THANH ĐIỀU HƯỚNG CHẾ ĐỘ XEM CHÍNH (THEO LỚP, THEO GIÁO VIÊN, TOÀN TRƯỜNG, ĐIỂM TRƯỜNG, KHỐI) */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-3 sm:p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Main View Mode Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold flex-wrap gap-1">
            {/* 1. Xem Theo Lớp (Mặc định) */}
            <button
              onClick={() => setViewMode('class')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                viewMode === 'class'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Xem Theo Lớp</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] rounded font-bold ml-0.5 ${
                  viewMode === 'class' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                }`}
              >
                53 Lớp
              </span>
            </button>

            {/* 2. Xem Theo Giáo Viên */}
            <button
              onClick={() => setViewMode('teacher')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                viewMode === 'teacher'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Xem Theo Giáo Viên</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] rounded font-bold ml-0.5 ${
                  viewMode === 'teacher' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                }`}
              >
                101 GV
              </span>
            </button>

            {/* 3. Xem Toàn Trường */}
            <button
              onClick={() => setViewMode('school')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                viewMode === 'school'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Xem Toàn Trường</span>
            </button>

            {/* 4. Xem Theo Điểm Trường */}
            <button
              onClick={() => setViewMode('campus')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                viewMode === 'campus'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>Xem Theo Điểm Trường</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] rounded font-bold ml-0.5 ${
                  viewMode === 'campus' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                3 Điểm
              </span>
            </button>

            {/* 5. Xem Theo Khối Lớp */}
            <button
              onClick={() => setViewMode('grade')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grade'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Xem Theo Khối Lớp</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] rounded font-bold ml-0.5 ${
                  viewMode === 'grade' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                }`}
              >
                K6-12
              </span>
            </button>
          </div>

          {/* Quick Add Slot Action */}
          <button
            type="button"
            onClick={() => handleOpenCreate()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer ml-auto"
            title="Thêm tiết học mới vào TKB"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Tiết Mới Vào TKB</span>
          </button>
        </div>

        {/* 2. SUB-FILTER BAR: CHO CHẾ ĐỘ XEM THEO LỚP */}
        {viewMode === 'class' && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Lọc Khối */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <span className="text-slate-500 font-medium">Khối:</span>
                <select
                  value={classGradeFilter}
                  onChange={(e) =>
                    setClassGradeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="all">Tất cả các khối (6-12)</option>
                  {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={g}>
                      Khối {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chế độ xem: Tất cả các lớp vs 1 lớp cụ thể */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setClassViewMode('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    classViewMode === 'all'
                      ? 'bg-white text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả các lớp trong khối
                </button>
                <button
                  onClick={() => setClassViewMode('single')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    classViewMode === 'single'
                      ? 'bg-white text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chọn 1 lớp cụ thể
                </button>
              </div>

              {/* Dropdown chọn lớp nếu ở chế độ single */}
              {classViewMode === 'single' && (
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                  <span className="text-slate-500 font-medium">Lớp:</span>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="bg-transparent font-bold text-blue-700 focus:outline-none cursor-pointer"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Khối {c.grade} • {campusMap.get(c.campusId)?.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Tìm kiếm nhanh lớp */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={classSearchText}
                onChange={(e) => setClassSearchText(e.target.value)}
                placeholder="Tìm nhanh lớp (vd: 10CB1, 9A7)..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-52 sm:w-60"
              />
              {classSearchText && (
                <button
                  onClick={() => setClassSearchText('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. SUB-FILTER BAR: CHO CHẾ ĐỘ XEM THEO GIÁO VIÊN */}
        {viewMode === 'teacher' && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Lọc Tổ bộ môn */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <span className="text-slate-500 font-medium">Tổ:</span>
                <select
                  value={teacherDeptFilter}
                  onChange={(e) => setTeacherDeptFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[200px]"
                >
                  <option value="all">Tất cả các tổ ({allDepartments.length} tổ)</option>
                  {allDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chế độ xem: Tất cả giáo viên vs 1 giáo viên cụ thể */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setTeacherViewMode('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    teacherViewMode === 'all'
                      ? 'bg-white text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả giáo viên trong tổ
                </button>
                <button
                  onClick={() => setTeacherViewMode('single')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    teacherViewMode === 'single'
                      ? 'bg-white text-blue-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chọn 1 giáo viên cụ thể
                </button>
              </div>

              {/* Dropdown chọn GV nếu ở chế độ single */}
              {teacherViewMode === 'single' && (
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                  <span className="text-slate-500 font-medium">GV:</span>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="bg-transparent font-bold text-blue-700 focus:outline-none cursor-pointer max-w-[220px]"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.code}] {t.fullName} ({t.department})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Tìm kiếm nhanh giáo viên */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={teacherSearchText}
                onChange={(e) => setTeacherSearchText(e.target.value)}
                placeholder="Tìm tên hoặc mã GV (vd: Huy, Lang, Tùng)..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-52 sm:w-64"
              />
              {teacherSearchText && (
                <button
                  onClick={() => setTeacherSearchText('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. RENDER CÁC GIAO DIỆN THEO CHẾ ĐỘ ĐƯỢC CHỌN */}

      {/* A. XEM THEO LỚP: RENDER DANH SÁCH THẺ CLASSTIMETABLECARD (CHUẨN HÌNH ẢNH MẪU 1) */}
      {viewMode === 'class' && (
        <div className="space-y-6">
          {filteredClasses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Không tìm thấy lớp học phù hợp</h3>
              <p className="text-xs text-slate-500 mt-1">
                Vui lòng thử đổi bộ lọc khối lớp hoặc từ khóa tìm kiếm.
              </p>
              <button
                onClick={() => {
                  setClassGradeFilter('all');
                  setClassSearchText('');
                  setClassViewMode('all');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            filteredClasses.map((cls) => (
              <ClassTimetableCard
                key={cls.id}
                classItem={cls}
                slots={slots}
                teachers={teachers}
                subjects={subjects}
                campuses={campuses}
                currentWeek={currentWeek}
                currentRole={currentRole}
                onEditSlot={handleOpenEdit}
                onAddSlot={handleOpenCreate}
              />
            ))
          )}
        </div>
      )}

      {/* B. XEM THEO GIÁO VIÊN: RENDER DANH SÁCH THẺ TEACHERTIMETABLECARD (CHUẨN HÌNH ẢNH MẪU 2) */}
      {viewMode === 'teacher' && (
        <div className="space-y-6">
          {filteredTeachers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Không tìm thấy giáo viên phù hợp</h3>
              <p className="text-xs text-slate-500 mt-1">
                Vui lòng thử đổi bộ lọc tổ bộ môn hoặc từ khóa tìm kiếm giáo viên.
              </p>
              <button
                onClick={() => {
                  setTeacherDeptFilter('all');
                  setTeacherSearchText('');
                  setTeacherViewMode('all');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            filteredTeachers.map((tch) => (
              <TeacherTimetableCard
                key={tch.id}
                teacher={tch}
                slots={slots}
                classes={classes}
                subjects={subjects}
                campuses={campuses}
                currentWeek={currentWeek}
                currentRole={currentRole}
                onEditSlot={handleOpenEdit}
                onAddSlot={handleOpenCreate}
              />
            ))
          )}
        </div>
      )}

      {/* C. XEM TOÀN TRƯỜNG */}
      {viewMode === 'school' && (
        <SchoolMasterTimetableView
          slots={slots}
          teachers={teachers}
          classes={classes}
          subjects={subjects}
          rooms={rooms}
          campuses={campuses}
          conflicts={conflicts}
          currentWeek={currentWeek}
          currentRole={currentRole}
          onEditSlot={handleOpenEdit}
          onAddSlot={handleOpenCreate}
          onDeleteSlot={onDeleteSlot}
        />
      )}

      {/* D. XEM THEO ĐIỂM TRƯỜNG */}
      {viewMode === 'campus' && (
        <CampusTimetableView
          slots={slots}
          teachers={teachers}
          classes={classes}
          subjects={subjects}
          rooms={rooms}
          campuses={campuses}
          conflicts={conflicts}
          currentWeek={currentWeek}
          initialCampusId={selectedCampusId}
          currentRole={currentRole}
          onEditSlot={handleOpenEdit}
          onAddSlot={handleOpenCreate}
          onDeleteSlot={onDeleteSlot}
        />
      )}

      {/* E. XEM THEO KHỐI LỚP */}
      {viewMode === 'grade' && (
        <GradeTimetableView
          slots={slots}
          teachers={teachers}
          classes={classes}
          subjects={subjects}
          rooms={rooms}
          campuses={campuses}
          conflicts={conflicts}
          currentWeek={currentWeek}
          initialGrade={6}
          currentRole={currentRole}
          onEditSlot={handleOpenEdit}
          onAddSlot={handleOpenCreate}
          onDeleteSlot={onDeleteSlot}
        />
      )}

      {/* Modal Chỉnh Sửa Tiết Học */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingSlot.id === 'NEW' ? 'Thêm Tiết Mới Vào Thời Khóa Biểu' : 'Điều Chỉnh Tiết Thời Khóa Biểu'}
                </h3>
                <p className="text-xs text-slate-500">
                  Thứ {slotForm.dayOfWeek} • Tiết {slotForm.periodNumber} ({slotForm.shift === 'afternoon' ? 'Buổi Chiều' : 'Buổi Sáng'}) • Lớp {classMap.get(slotForm.classId)?.name || 'Chưa chọn'}
                </p>
              </div>
              <button
                onClick={() => setEditingSlot(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Lớp và Buổi/Thứ/Tiết */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lớp học:</label>
                  <select
                    value={slotForm.classId}
                    onChange={(e) => setSlotForm({ ...slotForm, classId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Khối {c.grade} - {campusMap.get(c.campusId)?.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thứ trong tuần:</label>
                  <select
                    value={slotForm.dayOfWeek}
                    onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold"
                  >
                    {[2, 3, 4, 5, 6, 7].map((d) => (
                      <option key={d} value={d}>
                        Thứ {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Buổi học (Ca):</label>
                  <select
                    value={slotForm.shift}
                    onChange={(e) => setSlotForm({ ...slotForm, shift: e.target.value as 'morning' | 'afternoon' })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold"
                  >
                    <option value="morning">Buổi Sáng (07:15 - 11:30)</option>
                    <option value="afternoon">Buổi Chiều (13:00 - 17:15)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tiết số:</label>
                  <select
                    value={slotForm.periodNumber}
                    onChange={(e) => setSlotForm({ ...slotForm, periodNumber: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold"
                  >
                    {[1, 2, 3, 4, 5].map((p) => (
                      <option key={p} value={p}>
                        Tiết {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Môn học */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Môn học:</label>
                <select
                  value={slotForm.subjectId}
                  onChange={(e) => {
                    const subId = e.target.value;
                    const sub = subjectMap.get(subId);
                    setSlotForm({
                      ...slotForm,
                      subjectId: subId,
                      subComponentName: sub?.subComponents ? sub.subComponents[0]?.name : '',
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) - {s.gradeLevel}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phân môn (Nếu là KHTN hoặc LS&ĐL) */}
              {subjectMap.get(slotForm.subjectId)?.subComponents && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <label className="block font-semibold text-emerald-900 mb-1">
                    Phân môn tích hợp (KHTN / LS&ĐL):
                  </label>
                  <select
                    value={slotForm.subComponentName}
                    onChange={(e) => setSlotForm({ ...slotForm, subComponentName: e.target.value })}
                    className="w-full bg-white border border-emerald-300 rounded-lg p-2 text-emerald-950 font-semibold"
                  >
                    {subjectMap.get(slotForm.subjectId)?.subComponents?.map((comp) => (
                      <option key={comp.code} value={comp.name}>
                        {comp.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    * Lưu ý: Môn KHTN và LS&ĐL thay đổi số tiết hàng tuần theo phân phối chương trình thực tế.
                  </p>
                </div>
              )}

              {/* Giáo viên phụ trách */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Giáo viên phụ trách:</label>
                <select
                  value={slotForm.teacherId}
                  onChange={(e) => setSlotForm({ ...slotForm, teacherId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.code}] {t.fullName} - {t.department} (Cơ sở chính: {campusMap.get(t.primaryCampusId)?.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Điểm trường */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Điểm trường:</label>
                <select
                  value={slotForm.campusId}
                  onChange={(e) => setSlotForm({ ...slotForm, campusId: e.target.value, roomId: '' })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                >
                  {campuses.map((cp) => (
                    <option key={cp.id} value={cp.id}>
                      {cp.code} - {cp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Khóa tiết cố định */}
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="slot_is_locked"
                  checked={!!slotForm.isLocked}
                  onChange={(e) => setSlotForm({ ...slotForm, isLocked: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="slot_is_locked" className="font-semibold text-slate-700 cursor-pointer">
                  Khóa tiết này (Không cho thuật toán xếp tự động di dời)
                </label>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú chuyên môn:</label>
                <input
                  type="text"
                  value={slotForm.note || ''}
                  onChange={(e) => setSlotForm({ ...slotForm, note: e.target.value })}
                  placeholder="Ví dụ: Dạy thực hành mẫu tại Lab, hoặc gộp tiết đôi..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-5">
              {editingSlot.id !== 'NEW' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Xác nhận xóa tiết học này khỏi thời khóa biểu?')) {
                      onDeleteSlot(editingSlot.id);
                      setEditingSlot(null);
                    }
                  }}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors"
                >
                  Xóa tiết này
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveSlot}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm transition-colors"
                >
                  {editingSlot.id === 'NEW' ? 'Thêm vào TKB' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
