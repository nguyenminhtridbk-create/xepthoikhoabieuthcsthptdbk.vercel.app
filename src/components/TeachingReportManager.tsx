import React, { useState } from 'react';
import {
  TeachingReport,
  TeachingReportEntry,
  Teacher,
  PeriodSlot,
  Subject,
  ClassRoom,
  UserRole,
} from '../types';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Edit3,
  Send,
  Download,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { exportTeachingReportToExcel, triggerPrintWindow } from '../services/exportService';

interface TeachingReportManagerProps {
  reports: TeachingReport[];
  teachers: Teacher[];
  slots: PeriodSlot[];
  subjects: Subject[];
  classes: ClassRoom[];
  currentWeek: number;
  currentRole: UserRole;
  onSaveReport: (report: TeachingReport) => void;
}

export const TeachingReportManager: React.FC<TeachingReportManagerProps> = ({
  reports,
  teachers,
  slots,
  subjects,
  classes,
  currentWeek,
  currentRole,
  onSaveReport,
}) => {
  // Giáo viên được chọn để xem/điền sổ báo giảng
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    currentRole === 'teacher' ? 'gv_khtn_mai' : teachers[0]?.id || 'gv_pht_tri'
  );

  const teacherMap = new Map<string, Teacher>(teachers.map((t) => [t.id, t]));
  const classMap = new Map<string, ClassRoom>(classes.map((c) => [c.id, c]));
  const subjectMap = new Map<string, Subject>(subjects.map((s) => [s.id, s]));

  // Lấy hoặc tạo báo cáo tuần cho giáo viên được chọn
  const reportId = `${selectedTeacherId}_w${currentWeek}`;
  const existingReport = reports.find((r) => r.id === reportId);

  // Lấy các tiết dạy của GV trong tuần
  const teacherSlots = slots
    .filter((s) => s.teacherId === selectedTeacherId && s.weekNumber === currentWeek)
    .sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      const shiftOrderA = a.shift === 'morning' ? 1 : 2;
      const shiftOrderB = b.shift === 'morning' ? 1 : 2;
      if (shiftOrderA !== shiftOrderB) return shiftOrderA - shiftOrderB;
      return a.periodNumber - b.periodNumber;
    });

  // Khởi tạo entries từ thời khóa biểu nếu chưa có
  const [entries, setEntries] = useState<TeachingReportEntry[]>(() => {
    if (existingReport && existingReport.entries && existingReport.entries.length > 0) {
      return existingReport.entries;
    }
    return teacherSlots.map((slot, index) => ({
      id: `entry_${slot.id}`,
      dayOfWeek: slot.dayOfWeek,
      periodNumber: slot.periodNumber,
      shift: slot.shift,
      classId: classMap.get(slot.classId)?.name || slot.classId,
      subjectName: subjectMap.get(slot.subjectId)?.name || 'Môn học',
      subComponent: slot.subComponentName,
      ppctLessonNumber: index + 1,
      lessonTitle: '',
      teachingEquipment: 'Máy chiếu / Bảng phụ',
      notes: '',
    }));
  });

  const [approverComment, setApproverComment] = useState(existingReport?.approverComment || '');

  // Cập nhật khi đổi giáo viên hoặc tuần
  React.useEffect(() => {
    if (existingReport && existingReport.entries && existingReport.entries.length > 0) {
      setEntries(existingReport.entries);
      setApproverComment(existingReport.approverComment || '');
    } else {
      const generated = teacherSlots.map((slot, index) => ({
        id: `entry_${slot.id}`,
        dayOfWeek: slot.dayOfWeek,
        periodNumber: slot.periodNumber,
        shift: slot.shift,
        classId: classMap.get(slot.classId)?.name || slot.classId,
        subjectName: subjectMap.get(slot.subjectId)?.name || 'Môn học',
        subComponent: slot.subComponentName,
        ppctLessonNumber: index + 1,
        lessonTitle: '',
        teachingEquipment: 'Máy chiếu / Thiết bị chuẩn',
        notes: '',
      }));
      setEntries(generated);
      setApproverComment('');
    }
  }, [selectedTeacherId, currentWeek]);

  const handleEntryChange = (id: string, field: keyof TeachingReportEntry, value: any) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleSaveDraft = () => {
    const teacher = teacherMap.get(selectedTeacherId);
    const updated: TeachingReport = {
      id: reportId,
      teacherId: selectedTeacherId,
      teacherName: teacher?.fullName || 'Giáo viên',
      weekNumber: currentWeek,
      termId: 'HK1_2026_2027',
      status: 'draft',
      entries,
    };
    onSaveReport(updated);
    alert('Đã lưu bản nháp sổ báo giảng tuần ' + currentWeek);
  };

  const handleSubmitReport = () => {
    const teacher = teacherMap.get(selectedTeacherId);
    const updated: TeachingReport = {
      id: reportId,
      teacherId: selectedTeacherId,
      teacherName: teacher?.fullName || 'Giáo viên',
      weekNumber: currentWeek,
      termId: 'HK1_2026_2027',
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      entries,
    };
    onSaveReport(updated);
    alert('Đã ký nộp Sổ báo giảng điện tử Tuần ' + currentWeek + ' tới Ban giám hiệu!');
  };

  const handleApproveReport = (approved: boolean) => {
    if (!existingReport) return;
    const updated: TeachingReport = {
      ...existingReport,
      status: approved ? 'approved' : 'rejected',
      approvedBy: 'gv_pht_tri',
      approverName: 'Nguyễn Minh Trí (Phó hiệu trưởng)',
      approverComment: approverComment || (approved ? 'Đã duyệt sổ báo giảng tuần.' : 'Cần bổ sung tên bài dạy theo PPCT.'),
      reviewedAt: new Date().toISOString(),
    };
    onSaveReport(updated);
    alert(approved ? 'Đã phê duyệt sổ báo giảng thành công!' : 'Đã gửi phản hồi yêu cầu giáo viên chỉnh sửa!');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Quản Lý Báo Cáo Giảng Dạy Hàng Tuần (Sổ Báo Giảng Điện Tử)
            </h2>
            <p className="text-xs text-slate-500">
              Kế hoạch bài dạy • Tiết phân phối chương trình • Thiết bị thực hành • Phê duyệt trực tuyến
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Select Teacher */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5">
            <span className="text-slate-500 font-medium">Giáo viên:</span>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.code}] {t.fullName} ({t.department})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => exportTeachingReportToExcel(reports, currentWeek)}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-medium shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Excel Sổ Báo Giảng</span>
          </button>
        </div>
      </div>

      {/* Report Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-amber-950 text-white p-4 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-300 font-bold uppercase tracking-wider">
              Tuần {currentWeek} • Học kỳ 1
            </span>
            {existingReport?.status === 'approved' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Đã Phê Duyệt
              </span>
            )}
            {existingReport?.status === 'submitted' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> Chờ Ban Giám Hiệu Duyệt
              </span>
            )}
            {(!existingReport || existingReport?.status === 'draft') && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                <Edit3 className="w-3 h-3" /> Bản Nháp
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-white mt-1">
            Sổ Báo Giảng: {teacherMap.get(selectedTeacherId)?.fullName}
          </h3>
          <p className="text-xs text-slate-300">
            Tổ chuyên môn: {teacherMap.get(selectedTeacherId)?.department} • Tổng số: {entries.length} tiết giảng dạy trong tuần
          </p>
        </div>

        {/* Approver notes */}
        {existingReport?.approverComment && (
          <div className="bg-black/30 border border-white/10 p-2.5 rounded-lg text-xs max-w-sm">
            <div className="font-semibold text-amber-300 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ý kiến BGH ({existingReport.approverName}):</span>
            </div>
            <p className="text-slate-200 mt-0.5">{existingReport.approverComment}</p>
          </div>
        )}
      </div>

      {/* Table of Teaching Entries */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 w-16 text-center">Thứ</th>
                <th className="p-3 w-16 text-center">Buổi</th>
                <th className="p-3 w-14 text-center">Tiết</th>
                <th className="p-3 w-20">Lớp</th>
                <th className="p-3 w-40">Môn học / Phân môn</th>
                <th className="p-3 w-24">Tiết PPCT</th>
                <th className="p-3">Tên bài dạy / Nội dung hoạt động</th>
                <th className="p-3 w-48">Thiết bị & Đồ dùng dạy học</th>
                <th className="p-3 w-36">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Giáo viên không có lịch dạy trong Tuần {currentWeek} trên thời khóa biểu.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80">
                    <td className="p-3 text-center font-bold text-slate-900 bg-slate-50/50">
                      Thứ {entry.dayOfWeek}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          entry.shift === 'afternoon'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {entry.shift === 'afternoon' ? 'Chiều' : 'Sáng'}
                      </span>
                    </td>
                    <td className="p-3 text-center font-semibold text-indigo-700 bg-slate-50/50">
                      {entry.periodNumber}
                    </td>
                    <td className="p-3 font-bold text-slate-800">{entry.classId}</td>
                    <td className="p-3 font-medium text-slate-900">
                      <div>{entry.subComponent || entry.subjectName}</div>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={entry.ppctLessonNumber}
                        onChange={(e) =>
                          handleEntryChange(entry.id, 'ppctLessonNumber', Number(e.target.value))
                        }
                        className="w-16 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-center font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={entry.lessonTitle}
                        onChange={(e) =>
                          handleEntryChange(entry.id, 'lessonTitle', e.target.value)
                        }
                        placeholder="Nhập tên bài theo chương trình..."
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-medium focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={entry.teachingEquipment}
                        onChange={(e) =>
                          handleEntryChange(entry.id, 'teachingEquipment', e.target.value)
                        }
                        placeholder="Đồ dùng thực hành..."
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-700 focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={entry.notes}
                        onChange={(e) => handleEntryChange(entry.id, 'notes', e.target.value)}
                        placeholder="Dạy bù / ghi chú..."
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-700 focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Action Bottom Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDraft}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs transition-colors shadow-xs"
            >
              Lưu bản nháp
            </button>
            <button
              onClick={handleSubmitReport}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ký Nộp Sổ Báo Giảng</span>
            </button>
          </div>

          {/* Admin / Vice Principal Approval Box */}
          {currentRole !== 'teacher' && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={approverComment}
                onChange={(e) => setApproverComment(e.target.value)}
                placeholder="Nhận xét của Phó hiệu trưởng / Tổ trưởng..."
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 w-64 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleApproveReport(true)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
              >
                Phê Duyệt
              </button>
              <button
                onClick={() => handleApproveReport(false)}
                className="px-3 py-2 bg-rose-50 border border-rose-300 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs transition-colors"
              >
                Yêu cầu sửa
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
