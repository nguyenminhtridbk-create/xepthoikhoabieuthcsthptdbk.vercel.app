import React, { useState } from 'react';
import { Subject, Teacher, ClassRoom, PeriodSlot } from '../types';
import {
  Layers,
  FlaskConical,
  BookOpen,
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface IntegratedSubjectsManagerProps {
  subjects: Subject[];
  teachers: Teacher[];
  classes: ClassRoom[];
  slots: PeriodSlot[];
  currentWeek: number;
  onWeekChange: (week: number) => void;
}

export const IntegratedSubjectsManager: React.FC<IntegratedSubjectsManagerProps> = ({
  subjects,
  teachers,
  classes,
  slots,
  currentWeek,
  onWeekChange,
}) => {
  const [activeSection, setActiveSection] = useState<'khtn' | 'lsdl' | 'thpt'>('khtn');

  const teacherMap = new Map<string, Teacher>(teachers.map((t) => [t.id, t]));
  const classMap = new Map<string, ClassRoom>(classes.map((c) => [c.id, c]));

  const khtnSubject = subjects.find((s) => s.category === 'khtn_integrated');
  const lsdlSubject = subjects.find((s) => s.category === 'lsdl_integrated');
  const thptElectives = subjects.filter(
    (s) => s.category === 'thpt_elective' || s.category === 'thpt_chuyen_de'
  );

  const thcsClasses = classes.filter((c) => c.gradeLevel === 'THCS');
  const thptClasses = classes.filter((c) => c.gradeLevel === 'THPT');

  const currentWeekSlots = slots.filter((s) => s.weekNumber === currentWeek);

  return (
    <div className="space-y-6">
      {/* Top Banner Explaining the Subject Specialties */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl p-6 shadow-sm border border-emerald-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
            <Layers className="w-3.5 h-3.5" />
            <span>Mô-Đun Quản Lý Môn Đặc Thù (Chương trình GDPT 2018)</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Điều Hành Luân Phiên KHTN, LS&ĐL & Môn Chuyên Đề/Tự Chọn
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 mt-2 leading-relaxed">
            Hệ thống tự động giải bài toán biến động số tiết theo tuần: Môn <strong>KHTN</strong> do nhiều giáo viên Vật lí, Hóa học, Sinh học cùng dạy; Môn <strong>LS&ĐL</strong> luân phiên Sử - Địa; và các <strong>Chuyên đề / Tổ hợp lựa chọn THPT</strong> tại cả 3 điểm trường.
          </p>
        </div>

        {/* Navigation buttons inside module */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-emerald-800/60 text-xs">
          <button
            onClick={() => setActiveSection('khtn')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
              activeSection === 'khtn'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-800/50'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>KHTN Cấp THCS (Vật lí - Hóa học - Sinh học)</span>
          </button>

          <button
            onClick={() => setActiveSection('lsdl')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
              activeSection === 'lsdl'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>LS&ĐL Cấp THCS (Lịch sử - Địa lí)</span>
          </button>

          <button
            onClick={() => setActiveSection('thpt')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
              activeSection === 'thpt'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-800/50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Chuyên Đề & Tự Chọn Cấp THPT</span>
          </button>
        </div>
      </div>

      {/* Week Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Xem phân phối theo Tuần học thực tế:</span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
            <button
              key={w}
              onClick={() => onWeekChange(w)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentWeek === w
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              T{w}
            </button>
          ))}
        </div>
      </div>

      {/* Section 1: KHTN THCS */}
      {activeSection === 'khtn' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-sm text-emerald-950">
                  Cơ Chế Phân Bổ Môn KHTN - Tuần {currentWeek} (Tổng 4 tiết/tuần)
                </h3>
              </div>
              <span className="text-xs bg-emerald-200/80 text-emerald-900 font-bold px-3 py-1 rounded-full">
                {currentWeek <= 8 ? 'Giai đoạn 1: Tập trung Vật lí & Hóa học' : 'Giai đoạn 2: Tăng cường Sinh học'}
              </span>
            </div>

            <div className="p-5">
              {/* Phân phối theo tuần */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
                  <div className="text-xs font-bold text-blue-900 mb-1">1. Phân môn Vật lí</div>
                  <div className="text-2xl font-black text-blue-700">
                    {currentWeek <= 8 ? '2 tiết/tuần' : '1 tiết/tuần'}
                  </div>
                  <p className="text-xs text-blue-800 mt-2">
                    Giáo viên phụ trách: <strong>Thầy Nguyễn Văn Hùng</strong> (Tổ trưởng KHTN)
                  </p>
                  <div className="mt-2 text-[11px] text-blue-600">Phòng TN Thực hành KHTN CS1</div>
                </div>

                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50">
                  <div className="text-xs font-bold text-purple-900 mb-1">2. Phân môn Hóa học</div>
                  <div className="text-2xl font-black text-purple-700">
                    {currentWeek <= 8 ? '2 tiết/tuần' : '1 tiết/tuần'}
                  </div>
                  <p className="text-xs text-purple-800 mt-2">
                    Giáo viên phụ trách: <strong>Cô Trần Thị Mai</strong>
                  </p>
                  <div className="mt-2 text-[11px] text-purple-600">Hóa chất & Thiết bị thực hành chuẩn</div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                  <div className="text-xs font-bold text-emerald-900 mb-1">3. Phân môn Sinh học</div>
                  <div className="text-2xl font-black text-emerald-700">
                    {currentWeek <= 8 ? '0 tiết/tuần' : '2 tiết/tuần'}
                  </div>
                  <p className="text-xs text-emerald-800 mt-2">
                    Giáo viên phụ trách: <strong>Cô Lê Thị Lan</strong>
                  </p>
                  <div className="mt-2 text-[11px] text-emerald-600">Dạy tăng cường từ Tuần 9 đến Tuần 18</div>
                </div>
              </div>

              {/* Lịch thực tế của từng lớp THCS trong tuần hiện tại */}
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-3">
                Thực Tế Xếp Tiết KHTN Tại Các Lớp THCS (Tuần {currentWeek})
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-200 rounded-lg">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Lớp học</th>
                      <th className="p-3">Cơ sở</th>
                      <th className="p-3">Số tiết đã xếp</th>
                      <th className="p-3">Chi tiết phân môn & Giáo viên</th>
                      <th className="p-3">Trạng thái định mức</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {thcsClasses.map((cls) => {
                      const classSlots = currentWeekSlots.filter(
                        (s) => s.classId === cls.id && s.subjectId === khtnSubject?.id
                      );
                      const total = classSlots.length;
                      const isMatching = total === 4;

                      return (
                        <tr key={cls.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">{cls.name}</td>
                          <td className="p-3 text-slate-600">
                            {cls.campusId === 'campus_a'
                              ? 'CS1 - Chính'
                              : cls.campusId === 'campus_b'
                              ? 'CS2 - Nam'
                              : 'CS3 - Đồng Tiến'}
                          </td>
                          <td className="p-3 font-bold text-slate-900">{total} / 4 tiết</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1.5">
                              {classSlots.map((s) => (
                                <span
                                  key={s.id}
                                  className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-medium"
                                >
                                  T{s.dayOfWeek} (Tiết {s.periodNumber}): {s.subComponentName} [{teacherMap.get(s.teacherId)?.code}]
                                </span>
                              ))}
                              {classSlots.length === 0 && (
                                <span className="text-slate-400 italic">Chưa xếp tiết KHTN</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            {isMatching ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Đúng PPCT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                                <AlertCircle className="w-3.5 h-3.5" /> Chưa đủ 4 tiết
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: LS&DL THCS */}
      {activeSection === 'lsdl' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-sm text-amber-950">
                  Cơ Chế Phân Bổ Môn Lịch Sử & Địa Lí - Tuần {currentWeek} (Tổng 3 tiết/tuần)
                </h3>
              </div>
              <span className="text-xs bg-amber-200/80 text-amber-900 font-bold px-3 py-1 rounded-full">
                {currentWeek <= 9 ? 'Giai đoạn 1: 2 Sử + 1 Địa' : 'Giai đoạn 2: 1 Sử + 2 Địa'}
              </span>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/50">
                  <div className="text-xs font-bold text-orange-900 mb-1">1. Phân môn Lịch sử</div>
                  <div className="text-2xl font-black text-orange-700">
                    {currentWeek <= 9 ? '2 tiết/tuần' : '1 tiết/tuần'}
                  </div>
                  <p className="text-xs text-orange-800 mt-2">
                    Giáo viên phụ trách: <strong>Thầy Phạm Minh Tuấn</strong> (Tổ trưởng KHXH)
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                  <div className="text-xs font-bold text-amber-900 mb-1">2. Phân môn Địa lí</div>
                  <div className="text-2xl font-black text-amber-700">
                    {currentWeek <= 9 ? '1 tiết/tuần' : '2 tiết/tuần'}
                  </div>
                  <p className="text-xs text-amber-800 mt-2">
                    Giáo viên phụ trách: <strong>Cô Vũ Hoàng Yến</strong> (Cơ sở 3)
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-200 rounded-lg">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Lớp học</th>
                      <th className="p-3">Cơ sở</th>
                      <th className="p-3">Số tiết đã xếp</th>
                      <th className="p-3">Chi tiết phân môn & Giáo viên</th>
                      <th className="p-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {thcsClasses.map((cls) => {
                      const classSlots = currentWeekSlots.filter(
                        (s) => s.classId === cls.id && s.subjectId === lsdlSubject?.id
                      );
                      const total = classSlots.length;
                      const isMatching = total === 3;

                      return (
                        <tr key={cls.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">{cls.name}</td>
                          <td className="p-3 text-slate-600">
                            {cls.campusId === 'campus_a' ? 'CS1' : cls.campusId === 'campus_b' ? 'CS2' : 'CS3'}
                          </td>
                          <td className="p-3 font-bold text-slate-900">{total} / 3 tiết</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1.5">
                              {classSlots.map((s) => (
                                <span
                                  key={s.id}
                                  className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-medium"
                                >
                                  T{s.dayOfWeek} (P{s.periodNumber}): {s.subComponentName} [{teacherMap.get(s.teacherId)?.code}]
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            {isMatching ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn 3 tiết
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                                <AlertCircle className="w-3.5 h-3.5" /> Lệch định mức
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: THPT Chuyen de & Tu chon */}
      {activeSection === 'thpt' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-indigo-50 border-b border-indigo-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-700" />
                <h3 className="font-bold text-sm text-indigo-950">
                  Môn Chuyên Đề & Môn Lựa Chọn THPT (Lớp 10, 11, 12)
                </h3>
              </div>
              <span className="text-xs bg-indigo-200/80 text-indigo-900 font-bold px-3 py-1 rounded-full">
                Tổ hợp KHTN & Tổ hợp KHXH
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {thptElectives.map((sub) => (
                  <div key={sub.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">{sub.name}</span>
                      <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                        {sub.code}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Định mức: <strong>{sub.defaultWeeklyPeriods} tiết/tuần</strong>
                    </div>
                    {sub.requiresSpecialRoom && (
                      <div className="mt-2 text-[11px] text-purple-700 font-medium bg-purple-50 p-1.5 rounded border border-purple-100">
                        ⚡ Yêu cầu phòng Thực hành / Bộ môn
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-xs text-left border border-slate-200 rounded-lg">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Lớp THPT</th>
                      <th className="p-3">Định hướng / Ban</th>
                      <th className="p-3">Cơ sở</th>
                      <th className="p-3">Môn Lựa chọn theo tổ hợp</th>
                      <th className="p-3">Môn Chuyên đề học tập</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {thptClasses.map((cls) => (
                      <tr key={cls.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{cls.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                            {cls.track || 'Chuẩn'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">
                          {cls.campusId === 'campus_a' ? 'CS1 - Chính' : 'CS2 - Nam'}
                        </td>
                        <td className="p-3">
                          {cls.assignedElectives?.map((id) => (
                            <span key={id} className="mr-1 inline-block px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 border border-slate-200">
                              {subjects.find((s) => s.id === id)?.name || id}
                            </span>
                          ))}
                        </td>
                        <td className="p-3">
                          {cls.assignedChuyenDe?.map((id) => (
                            <span key={id} className="mr-1 inline-block px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-medium">
                              {subjects.find((s) => s.id === id)?.name || id}
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
