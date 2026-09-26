import React, { useState, useMemo } from 'react';
import {
  Teacher,
  ClassRoom,
  Subject,
  Campus,
  TeacherAssignmentItem,
  UserRole,
} from '../types';
import {
  Users,
  School,
  Search,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  AlertTriangle,
  Building,
  Edit2,
  Plus,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface TeachingAssignmentsManagerProps {
  assignments: TeacherAssignmentItem[];
  teachers: Teacher[];
  classes: ClassRoom[];
  subjects: Subject[];
  campuses: Campus[];
  currentRole: UserRole;
  onUpdateAssignment?: (item: TeacherAssignmentItem) => void;
  onDeleteAssignment?: (id: string) => void;
}

export const TeachingAssignmentsManager: React.FC<TeachingAssignmentsManagerProps> = ({
  assignments,
  teachers,
  classes,
  subjects,
  campuses,
  onUpdateAssignment,
  onDeleteAssignment,
}) => {
  const [viewMode, setViewMode] = useState<'teachers' | 'classes' | 'all_table'>('teachers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Modal State for Direct Editing / Creating
  const [editingAssignment, setEditingAssignment] = useState<TeacherAssignmentItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [assignmentForm, setAssignmentForm] = useState<{
    teacherId: string;
    classId: string;
    subjectId: string;
    subComponentName: string;
    weeklyPeriods: number;
    campusId: string;
  }>({
    teacherId: '',
    classId: '',
    subjectId: '',
    subComponentName: '',
    weeklyPeriods: 2,
    campusId: 'campus_main',
  });

  const campusMap = useMemo(() => new Map<string, Campus>(campuses.map((c) => [c.id, c])), [campuses]);
  const classMap = useMemo(() => new Map<string, ClassRoom>(classes.map((c) => [c.id, c])), [classes]);
  const teacherMap = useMemo(() => new Map<string, Teacher>(teachers.map((t) => [t.id, t])), [teachers]);
  const subjectMap = useMemo(() => new Map<string, Subject>(subjects.map((s) => [s.id, s])), [subjects]);

  // Open Edit Modal
  const handleOpenEdit = (item: TeacherAssignmentItem) => {
    setEditingAssignment(item);
    setIsAddingNew(false);
    setAssignmentForm({
      teacherId: item.teacherId,
      classId: item.classId,
      subjectId: item.subjectId,
      subComponentName: item.subComponentName || '',
      weeklyPeriods: item.weeklyPeriods,
      campusId: item.campusId || 'campus_main',
    });
  };

  // Open Create Modal
  const handleOpenCreate = (prefill?: Partial<TeacherAssignmentItem>) => {
    const defaultTeacherId = prefill?.teacherId || teachers[0]?.id || '';
    const defaultClassId = prefill?.classId || classes[0]?.id || '';
    const targetClass = classMap.get(defaultClassId);
    const defaultCampusId = prefill?.campusId || targetClass?.campusId || 'campus_main';
    const defaultSubjectId = prefill?.subjectId || subjects[0]?.id || '';

    setEditingAssignment(null);
    setIsAddingNew(true);
    setAssignmentForm({
      teacherId: defaultTeacherId,
      classId: defaultClassId,
      subjectId: defaultSubjectId,
      subComponentName: prefill?.subComponentName || '',
      weeklyPeriods: prefill?.weeklyPeriods || 2,
      campusId: defaultCampusId,
    });
  };

  // Save Assignment
  const handleSaveAssignment = () => {
    const targetTeacher = teacherMap.get(assignmentForm.teacherId);
    const targetClass = classMap.get(assignmentForm.classId);
    const targetSubject = subjectMap.get(assignmentForm.subjectId);

    if (!targetTeacher || !targetClass || !targetSubject) {
      alert('Vui lòng chọn đầy đủ Giáo viên, Lớp học và Môn học.');
      return;
    }

    const payload: TeacherAssignmentItem = {
      id: isAddingNew || !editingAssignment
        ? `assign_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        : editingAssignment.id,
      teacherId: targetTeacher.id,
      teacherName: targetTeacher.fullName,
      classId: targetClass.id,
      className: targetClass.name,
      subjectId: targetSubject.id,
      subjectName: targetSubject.name,
      subComponentName: assignmentForm.subComponentName || undefined,
      weeklyPeriods: Number(assignmentForm.weeklyPeriods) || 1,
      campusId: assignmentForm.campusId || targetClass.campusId,
      grade: targetClass.grade,
      gradeLevel: targetClass.gradeLevel,
      termId: 'HK1_2026_2027',
    };

    if (onUpdateAssignment) {
      onUpdateAssignment(payload);
    }
    setEditingAssignment(null);
    setIsAddingNew(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Xác nhận xóa phân công chuyên môn này?')) {
      if (onDeleteAssignment) {
        onDeleteAssignment(id);
      }
      setEditingAssignment(null);
      setIsAddingNew(false);
    }
  };

  // Danh sách tổ chuyên môn duy nhất
  const departments = useMemo(() => {
    const depts = new Set<string>();
    teachers.forEach((t) => {
      if (t.department) depts.add(t.department);
    });
    return Array.from(depts);
  }, [teachers]);

  // Thống kê định mức từng giáo viên
  const teacherWorkloads = useMemo(() => {
    return teachers.map((t) => {
      const teacherAssigns = assignments.filter((a) => a.teacherId === t.id);
      const totalPeriods = teacherAssigns.reduce((sum, a) => sum + a.weeklyPeriods, 0);
      const homeroomClass = classes.find((c) => c.homeroomTeacherId === t.id);

      // Điểm trường giáo viên này có tiết dạy
      const teachingCampuses = Array.from(
        new Set(
          teacherAssigns.map((a) => {
            const cls = classMap.get(a.classId);
            return cls?.campusId;
          }).filter(Boolean)
        )
      );

      return {
        teacher: t,
        assignments: teacherAssigns,
        totalPeriods,
        isHomeroom: !!homeroomClass,
        homeroomClassName: homeroomClass?.name,
        teachingCampuses,
        campusNames: teachingCampuses.map((cid) => campusMap.get(cid!)?.name).join(', '),
      };
    });
  }, [teachers, assignments, classes, classMap, campusMap]);

  // Lọc giáo viên theo tìm kiếm và bộ lọc
  const filteredTeacherWorkloads = useMemo(() => {
    return teacherWorkloads.filter(({ teacher, teachingCampuses }) => {
      if (selectedCampus !== 'all' && !teachingCampuses.includes(selectedCampus)) {
        return false;
      }
      if (selectedDept !== 'all' && teacher.department !== selectedDept) {
        return false;
      }
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchName = teacher.fullName.toLowerCase().includes(query);
        const matchCode = teacher.code.toLowerCase().includes(query);
        return matchName || matchCode;
      }
      return true;
    });
  }, [teacherWorkloads, selectedCampus, selectedDept, searchTerm]);

  // Thống kê theo lớp học
  const classAssignmentsSummary = useMemo(() => {
    return classes.map((cls) => {
      const clsAssigns = assignments.filter((a) => a.classId === cls.id);
      const totalPeriods = clsAssigns.reduce((sum, a) => sum + a.weeklyPeriods, 0);
      const homeroomTeacher = teachers.find((t) => t.id === cls.homeroomTeacherId);
      const campus = campusMap.get(cls.campusId);

      return {
        classRoom: cls,
        assignments: clsAssigns,
        totalPeriods,
        homeroomTeacherName: homeroomTeacher?.fullName || 'Chưa gán',
        campusName: campus?.name || cls.campusId,
      };
    });
  }, [classes, assignments, teachers, campusMap]);

  const filteredClassSummary = useMemo(() => {
    return classAssignmentsSummary.filter(({ classRoom }) => {
      if (selectedCampus !== 'all' && classRoom.campusId !== selectedCampus) {
        return false;
      }
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return classRoom.name.toLowerCase().includes(query);
      }
      return true;
    });
  }, [classAssignmentsSummary, selectedCampus, searchTerm]);

  // Danh sách toàn bộ phân công cho view bảng (all_table)
  const filteredAssignmentsTable = useMemo(() => {
    return assignments.filter((a) => {
      if (selectedCampus !== 'all' && a.campusId !== selectedCampus) {
        return false;
      }
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchTeacher = a.teacherName.toLowerCase().includes(query);
        const matchClass = a.className.toLowerCase().includes(query);
        const matchSubject = a.subjectName.toLowerCase().includes(query);
        const matchSubComp = a.subComponentName?.toLowerCase().includes(query);
        return matchTeacher || matchClass || matchSubject || matchSubComp;
      }
      return true;
    });
  }, [assignments, selectedCampus, searchTerm]);

  // Thống kê tổng quát toàn trường
  const statsOverview = useMemo(() => {
    const totalPeriodsAllSchool = assignments.reduce((sum, a) => sum + a.weeklyPeriods, 0);
    const avgPeriodsPerTeacher = (totalPeriodsAllSchool / Math.max(1, teachers.length)).toFixed(1);
    const teachersOverQuota = teacherWorkloads.filter((t) => t.totalPeriods > 19).length;
    const teachersUnderQuota = teacherWorkloads.filter((t) => t.totalPeriods > 0 && t.totalPeriods < 15).length;
    const multiCampusTeachers = teacherWorkloads.filter((t) => t.teachingCampuses.length > 1).length;

    return {
      totalClasses: classes.length,
      totalTeachers: teachers.length,
      totalPeriodsAllSchool,
      avgPeriodsPerTeacher,
      teachersOverQuota,
      teachersUnderQuota,
      multiCampusTeachers,
    };
  }, [assignments, teachers, classes, teacherWorkloads]);

  // Xuất Excel Phân Công Chuyên Môn
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Phân công theo Giáo viên
    const gvData = teacherWorkloads.map((tw) => ({
      'Mã GV': tw.teacher.code,
      'Họ và Tên': tw.teacher.fullName,
      'Tổ Chuyên Môn': tw.teacher.department,
      'Cơ Sở Chính': campusMap.get(tw.teacher.primaryCampusId)?.name || '',
      'Chủ Nhiệm': tw.homeroomClassName || 'Không',
      'Tổng Tiết/Tuần': tw.totalPeriods,
      'Định Mức Đạt': tw.totalPeriods >= 15 && tw.totalPeriods <= 19 ? 'Đạt chuẩn' : (tw.totalPeriods > 19 ? 'Vượt định mức' : 'Thiếu tiết'),
      'Các Lớp & Môn Dạy': tw.assignments.map((a) => `${a.className} (${a.subjectName}: ${a.weeklyPeriods}t)`).join('; '),
    }));
    const wsGv = XLSX.utils.json_to_sheet(gvData);
    XLSX.utils.book_append_sheet(wb, wsGv, 'PhanCong_Theo_GiaoVien');

    // Sheet 2: Phân công theo Lớp học
    const lopData = assignments.map((a) => ({
      'Lớp': a.className,
      'Khối': a.grade,
      'Cấp': a.gradeLevel,
      'Điểm Trường': campusMap.get(a.campusId)?.name || '',
      'Môn Học': a.subjectName,
      'Phân Môn': a.subComponentName || '',
      'Giáo Viên Phụ Trách': a.teacherName,
      'Số Tiết/Tuần': a.weeklyPeriods,
    }));
    const wsLop = XLSX.utils.json_to_sheet(lopData);
    XLSX.utils.book_append_sheet(wb, wsLop, 'PhanCong_Theo_Lop');

    XLSX.writeFile(wb, `PhanCongChuyenMon_THCS_THPT_DocBinhKieu_HK1_2026_2027.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Title Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
              Chính Thức
            </span>
            <span className="text-xs text-slate-500 font-medium">Học Kỳ 1 • Năm học 2026 - 2027</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Phân Công Chuyên Môn - THCS & THPT Đốc Binh Kiều
          </h1>
          <p className="text-sm text-slate-600">
            Quản lý định mức tiết giảng dạy, phân bổ 53 lớp học cho 101 giáo viên tại 3 điểm trường (CS1-Chính, CS2-ĐBK, CS3-Tân Kiều). Bấm nút Sửa trực tiếp trên từng mục để điều chỉnh sai sót.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenCreate()}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Phân Công Mới</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel PCGD</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Tổng số lớp</div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">{statsOverview.totalClasses} <span className="text-xs text-slate-400 font-normal">lớp</span></div>
          <div className="text-xs text-slate-400 mt-1">14 THPT + 39 THCS</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Tổng giáo viên</div>
          <div className="text-2xl font-bold text-blue-600 mt-0.5">{statsOverview.totalTeachers} <span className="text-xs text-slate-400 font-normal">GV</span></div>
          <div className="text-xs text-slate-400 mt-1">101 thầy cô</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Tổng phân công</div>
          <div className="text-2xl font-bold text-indigo-600 mt-0.5">{assignments.length}</div>
          <div className="text-xs text-slate-400 mt-1">Môn dạy theo lớp</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Tổng tiết dạy/tuần</div>
          <div className="text-2xl font-bold text-emerald-600 mt-0.5">{statsOverview.totalPeriodsAllSchool}</div>
          <div className="text-xs text-slate-400 mt-1">Toàn bộ 3 điểm trường</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Dạy liên cơ sở</div>
          <div className="text-2xl font-bold text-amber-600 mt-0.5">{statsOverview.multiCampusTeachers} <span className="text-xs text-slate-400 font-normal">GV</span></div>
          <div className="text-xs text-amber-600 mt-1">Có đi lại giữa 3 điểm</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Vượt định mức</div>
          <div className="text-2xl font-bold text-rose-600 mt-0.5">{statsOverview.teachersOverQuota} <span className="text-xs text-slate-400 font-normal">GV</span></div>
          <div className="text-xs text-slate-400 mt-1">&gt; 19 tiết / tuần</div>
        </div>
      </div>

      {/* Filter and View Mode Switcher */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit flex-wrap">
            <button
              type="button"
              onClick={() => setViewMode('teachers')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'teachers'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Bàn Làm Việc Giáo Viên ({teacherWorkloads.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('classes')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'classes'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>Ma Trận Theo Lớp ({classes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all_table')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'all_table'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Danh Sách Chi Tiết & Sửa Nhanh ({assignments.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  viewMode === 'teachers'
                    ? 'Tìm họ tên hoặc mã GV...'
                    : viewMode === 'classes'
                    ? 'Tìm tên lớp (10CB1, 6A1)...'
                    : 'Tìm GV, lớp, hoặc môn học...'
                }
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Campus Filter */}
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Mọi điểm trường</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Department Filter (Only in Teachers View) */}
            {viewMode === 'teachers' && (
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Mọi tổ chuyên môn</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Main View 1: By Teachers */}
      {viewMode === 'teachers' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Giáo Viên</th>
                  <th className="py-3 px-3">Tổ Chuyên Môn</th>
                  <th className="py-3 px-3">Điểm Trường</th>
                  <th className="py-3 px-3 text-center">Chủ Nhiệm</th>
                  <th className="py-3 px-3 text-center">Tổng Tiết</th>
                  <th className="py-3 px-3">Tình Trạng Định Mức</th>
                  <th className="py-3 px-4">Danh Sách Lớp & Tiết Dạy (Bấm để sửa)</th>
                  <th className="py-3 px-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTeacherWorkloads.map((tw) => {
                  const isNormal = tw.totalPeriods >= 15 && tw.totalPeriods <= 19;
                  const isOver = tw.totalPeriods > 19;
                  const isUnder = tw.totalPeriods < 15 && tw.totalPeriods > 0;

                  return (
                    <tr key={tw.teacher.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{tw.teacher.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                          <span>Mã: {tw.teacher.code}</span>
                          {tw.teacher.role === 'admin' && (
                            <span className="bg-amber-100 text-amber-800 px-1 rounded text-[10px] font-bold">BGH</span>
                          )}
                          {tw.teacher.role === 'head_of_department' && (
                            <span className="bg-blue-100 text-blue-800 px-1 rounded text-[10px] font-bold">Tổ Trưởng</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                          {tw.teacher.department || 'Chung'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-800">
                            {campusMap.get(tw.teacher.primaryCampusId)?.code || tw.teacher.primaryCampusId}
                          </span>
                        </div>
                        {tw.teachingCampuses.length > 1 && (
                          <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
                            Dạy tại {tw.teachingCampuses.length} cơ sở
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {tw.isHomeroom ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{tw.homeroomClassName}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="text-base font-extrabold text-slate-900">{tw.totalPeriods}</div>
                        <div className="text-[10px] text-slate-400">tiết/tuần</div>
                      </td>

                      <td className="py-3 px-3">
                        {isNormal && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-medium text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đủ định mức</span>
                          </span>
                        )}
                        {isOver && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-medium text-[11px]">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Vượt ({tw.totalPeriods}t)</span>
                          </span>
                        )}
                        {isUnder && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-medium text-[11px]">
                            <Clock className="w-3 h-3" />
                            <span>Thiếu tiết</span>
                          </span>
                        )}
                        {tw.totalPeriods === 0 && (
                          <span className="text-slate-400 italic">Chưa xếp tiết</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xl">
                          {tw.assignments.map((assign) => (
                            <button
                              key={assign.id}
                              type="button"
                              onClick={() => handleOpenEdit(assign)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:border-indigo-300 text-slate-800 rounded-md text-[11px] border border-slate-200 transition-all cursor-pointer group shadow-2xs"
                              title="Bấm để sửa phân công môn này"
                            >
                              <span className="font-bold text-blue-700 group-hover:text-indigo-700">{assign.className}</span>
                              <span className="text-slate-600 font-medium">({assign.subjectName})</span>
                              <span className="bg-slate-200 group-hover:bg-indigo-200 text-slate-700 group-hover:text-indigo-900 px-1 rounded text-[10px] font-mono font-bold">
                                {assign.weeklyPeriods}t
                              </span>
                              <Edit2 className="w-2.5 h-2.5 text-slate-400 group-hover:text-indigo-600 ml-0.5" />
                            </button>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenCreate({ teacherId: tw.teacher.id })}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white rounded text-[11px] font-semibold transition-colors cursor-pointer border border-slate-200"
                          title="Thêm phân công môn mới cho giáo viên này"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Thêm</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main View 2: By Classes */}
      {viewMode === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClassSummary.map((item) => (
            <div
              key={item.classRoom.id}
              className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 hover:border-blue-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-slate-900">{item.classRoom.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.classRoom.gradeLevel === 'THPT' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.classRoom.gradeLevel} • Khối {item.classRoom.grade}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenCreate({ classId: item.classRoom.id })}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded text-[11px] font-bold border border-indigo-200 transition-colors cursor-pointer"
                    title="Thêm môn học cho lớp này"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm môn</span>
                  </button>
                </div>

                <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                  <span>GVCN: <strong className="text-slate-800">{item.homeroomTeacherName}</strong></span>
                  <span>{item.campusName}</span>
                </div>

                {/* Subjects breakdown list with Direct Edit Buttons */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {item.assignments.map((assign) => (
                    <div
                      key={assign.id}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 hover:bg-slate-100/90 transition-colors border border-slate-100 group"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">{assign.subjectName}</span>
                        {assign.subComponentName && (
                          <span className="text-[10px] text-amber-700 font-medium">({assign.subComponentName})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-slate-600 max-w-[120px] truncate" title={assign.teacherName}>
                          {assign.teacherName}
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-bold font-mono rounded text-[10px]">
                          {assign.weeklyPeriods}t
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(assign)}
                          className="p-1 hover:bg-indigo-100 text-slate-400 hover:text-indigo-700 rounded transition-colors cursor-pointer"
                          title="Sửa phân công môn này"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(assign.id)}
                          className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Xóa phân công này"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Tổng số tiết tuần:</span>
                <span className="text-sm font-extrabold text-blue-700">{item.totalPeriods} tiết</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main View 3: Complete Detail Table with Direct Edit and Delete */}
      {viewMode === 'all_table' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-600 font-medium">
              Hiển thị <strong className="text-slate-900">{filteredAssignmentsTable.length}</strong> / {assignments.length} phân công môn học
            </div>
            <div className="text-xs text-slate-500 italic">
              Bấm [Sửa] hoặc [Xóa] để điều chỉnh trực tiếp bất kỳ phân công nào
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px] sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th className="py-2.5 px-3">Lớp Học</th>
                  <th className="py-2.5 px-2 text-center">Khối</th>
                  <th className="py-2.5 px-3">Điểm Trường</th>
                  <th className="py-2.5 px-3">Môn Học</th>
                  <th className="py-2.5 px-3">Phân Môn (KHTN / LS&ĐL)</th>
                  <th className="py-2.5 px-3">Giáo Viên Phụ Trách</th>
                  <th className="py-2.5 px-3 text-center">Số Tiết/Tuần</th>
                  <th className="py-2.5 px-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAssignmentsTable.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <span className="font-extrabold text-slate-900">{item.className}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">({item.gradeLevel})</span>
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-slate-700">{item.grade}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">
                      {campusMap.get(item.campusId)?.code || item.campusId}
                    </td>
                    <td className="py-2 px-3 font-semibold text-indigo-900">{item.subjectName}</td>
                    <td className="py-2 px-3">
                      {item.subComponentName ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-medium text-[10px] border border-amber-200">
                          {item.subComponentName}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-900">{item.teacherName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Mã: {teacherMap.get(item.teacherId)?.code || item.teacherId}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold font-mono rounded text-xs">
                        {item.weeklyPeriods} tiết
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded text-[11px] font-bold border border-indigo-200 transition-colors cursor-pointer"
                          title="Sửa phân công này"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded text-[11px] font-bold border border-rose-200 transition-colors cursor-pointer"
                          title="Xóa phân công này"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa / Thêm Phân Công Chuyên Môn */}
      {(editingAssignment || isAddingNew) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isAddingNew ? 'Thêm Phân Công Chuyên Môn Mới' : 'Điều Chỉnh Phân Công Chuyên Môn'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAddingNew
                    ? 'Chỉ định giáo viên, lớp học và số tiết dạy/tuần'
                    : `Điều chỉnh phân công cho ${editingAssignment?.className} - Môn ${editingAssignment?.subjectName}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingAssignment(null);
                  setIsAddingNew(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Lớp học */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lớp học:</label>
                <select
                  value={assignmentForm.classId}
                  onChange={(e) => {
                    const newClassId = e.target.value;
                    const cls = classMap.get(newClassId);
                    setAssignmentForm({
                      ...assignmentForm,
                      classId: newClassId,
                      campusId: cls?.campusId || assignmentForm.campusId,
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Khối {c.grade} - {c.gradeLevel} - {campusMap.get(c.campusId)?.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Môn học */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Môn học:</label>
                <select
                  value={assignmentForm.subjectId}
                  onChange={(e) => {
                    const newSubId = e.target.value;
                    const sub = subjectMap.get(newSubId);
                    setAssignmentForm({
                      ...assignmentForm,
                      subjectId: newSubId,
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

              {/* Phân môn nếu có */}
              {subjectMap.get(assignmentForm.subjectId)?.subComponents && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <label className="block font-semibold text-emerald-900 mb-1">
                    Phân môn tích hợp (KHTN / LS&ĐL):
                  </label>
                  <select
                    value={assignmentForm.subComponentName}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, subComponentName: e.target.value })}
                    className="w-full bg-white border border-emerald-300 rounded-lg p-2 text-emerald-950 font-semibold"
                  >
                    <option value="">-- Chọn phân môn --</option>
                    {subjectMap.get(assignmentForm.subjectId)?.subComponents?.map((comp) => (
                      <option key={comp.code} value={comp.name}>
                        {comp.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Giáo viên phụ trách */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Giáo viên phụ trách:</label>
                <select
                  value={assignmentForm.teacherId}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, teacherId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.code}] {t.fullName} - {t.department} (Cơ sở chính: {campusMap.get(t.primaryCampusId)?.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Số tiết / tuần và Điểm trường */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số tiết / tuần:</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={assignmentForm.weeklyPeriods}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, weeklyPeriods: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Điểm trường:</label>
                  <select
                    value={assignmentForm.campusId}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, campusId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  >
                    {campuses.map((cp) => (
                      <option key={cp.id} value={cp.id}>
                        {cp.code} - {cp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-5">
              {!isAddingNew && editingAssignment ? (
                <button
                  type="button"
                  onClick={() => handleDelete(editingAssignment.id)}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Xóa phân công này
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAssignment(null);
                    setIsAddingNew(false);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignment}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  {isAddingNew ? 'Thêm phân công' : 'Lưu phân công'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
