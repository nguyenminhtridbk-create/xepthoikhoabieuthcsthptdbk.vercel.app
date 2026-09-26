import React, { useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, Search, Users } from 'lucide-react';
import { Campus, ClassRoom, Teacher, TeacherAssignmentItem } from '../types';

interface Week4TeachingAssignmentsTabProps {
  weekNumber: number;
  sourceDate: string;
  assignments: TeacherAssignmentItem[];
  teachers: Teacher[];
  classes: ClassRoom[];
  campuses: Campus[];
  teacherWorkloads: {
    teacherId: string;
    weeklyTeachingPeriods: number;
    dutyPeriods: number;
    totalQuotaPeriods: number;
    quotaBalance: number;
    sourcePdf: string;
  }[];
  ruleViolations: {
    className: string;
    dayOfWeek: number;
    periodNumber: number;
    subjectName: string;
    teacherName: string;
    description: string;
  }[];
  sourceFiles: string[];
}

export const Week4TeachingAssignmentsTab: React.FC<Week4TeachingAssignmentsTabProps> = ({
  weekNumber,
  sourceDate,
  assignments,
  teachers,
  classes,
  campuses,
  teacherWorkloads,
  ruleViolations,
  sourceFiles,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampusId, setSelectedCampusId] = useState('all');
  const appliedDate = sourceDate
    ? new Date(`${sourceDate}T00:00:00`).toLocaleDateString('vi-VN')
    : '';

  const teacherMap = useMemo(() => new Map(teachers.map((teacher) => [teacher.id, teacher])), [teachers]);
  const classMap = useMemo(() => new Map(classes.map((classRoom) => [classRoom.id, classRoom])), [classes]);
  const workloadMap = useMemo(
    () => new Map(teacherWorkloads.map((workload) => [workload.teacherId, workload])),
    [teacherWorkloads]
  );

  const filteredAssignments = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase('vi');
    return assignments.filter((assignment) => {
      const classRoom = classMap.get(assignment.classId);
      if (selectedCampusId !== 'all' && classRoom?.campusId !== selectedCampusId) return false;
      if (!query) return true;

      const teacher = teacherMap.get(assignment.teacherId);
      return [
        teacher?.fullName,
        teacher?.code,
        assignment.teacherName,
        assignment.className,
        assignment.subjectName,
      ].some((value) => value?.toLocaleLowerCase('vi').includes(query));
    });
  }, [assignments, classMap, searchTerm, selectedCampusId, teacherMap]);

  const teacherGroups = useMemo(() => {
    const groups = new Map<string, TeacherAssignmentItem[]>();
    for (const assignment of filteredAssignments) {
      const rows = groups.get(assignment.teacherId) || [];
      rows.push(assignment);
      groups.set(assignment.teacherId, rows);
    }

    return [...groups.entries()]
      .map(([teacherId, rows]) => ({
        teacherId,
        teacher: teacherMap.get(teacherId),
        rows: rows.sort((a, b) => a.className.localeCompare(b.className, 'vi') || a.subjectName.localeCompare(b.subjectName, 'vi')),
        teachingPeriods: rows
          .filter((assignment) => !['sub_chao_co', 'sub_shl'].includes(assignment.subjectId))
          .reduce((total, assignment) => total + assignment.weeklyPeriods, 0),
        fixedPeriods: rows
          .filter((assignment) => ['sub_chao_co', 'sub_shl'].includes(assignment.subjectId))
          .reduce((total, assignment) => total + assignment.weeklyPeriods, 0),
        homeroomClass: classes.find((classRoom) => classRoom.homeroomTeacherId === teacherId)?.name,
        pdfWorkload: workloadMap.get(teacherId),
      }))
      .sort((a, b) => (a.teacher?.fullName || '').localeCompare(b.teacher?.fullName || '', 'vi'));
  }, [classes, filteredAssignments, teacherMap, workloadMap]);

  const totalPeriods = assignments.reduce((total, assignment) => total + assignment.weeklyPeriods, 0);
  const teacherCount = new Set(assignments.map((assignment) => assignment.teacherId)).size;
  const classCount = new Set(assignments.map((assignment) => assignment.classId)).size;

  return (
    <div className="space-y-5">
      <section className="border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Tuần {weekNumber}{appliedDate ? ` · Áp dụng ${appliedDate}` : ''}
            </p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">Phân công chuyên môn</h1>
            <p className="mt-1 text-sm text-slate-600">Nguồn: {sourceFiles.join(' · ')}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <div className="flex items-center gap-2 border border-slate-200 bg-white px-3 py-2">
              <BookOpen className="h-4 w-4 text-emerald-700" />
              <strong>{totalPeriods.toLocaleString('vi-VN')}</strong>
              <span className="text-slate-500">tiết</span>
            </div>
            <div className="flex items-center gap-2 border border-slate-200 bg-white px-3 py-2">
              <Users className="h-4 w-4 text-blue-700" />
              <strong>{teacherCount}</strong>
              <span className="text-slate-500">giáo viên</span>
            </div>
            <div className="border border-slate-200 bg-white px-3 py-2">
              <strong>{classCount}</strong>
              <span className="ml-1 text-slate-500">lớp</span>
            </div>
          </div>
        </div>
      </section>

      {ruleViolations.length > 0 && (
        <section className="border border-amber-300 bg-amber-50 px-4 py-3" role="alert">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <h2 className="text-sm font-bold text-amber-950">Có {ruleViolations.length} tiết vi phạm quy tắc cứng môn trái buổi</h2>
              <ul className="mt-1 space-y-0.5 text-sm text-amber-900">
                {ruleViolations.map((violation) => (
                  <li key={`${violation.className}-${violation.dayOfWeek}-${violation.periodNumber}`}>
                    {violation.className} · Thứ {violation.dayOfWeek}, tiết {violation.periodNumber}: {violation.subjectName} ({violation.teacherName})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm giáo viên, lớp hoặc môn"
            className="w-full border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>
        <select
          value={selectedCampusId}
          onChange={(event) => setSelectedCampusId(event.target.value)}
          className="border border-slate-300 bg-white px-3 py-2 text-sm"
          aria-label="Lọc theo điểm trường"
        >
          <option value="all">Tất cả điểm trường</option>
          {campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}
        </select>
      </section>

      <section className="divide-y divide-slate-200 border-y border-slate-200 bg-white">
        {teacherGroups.map(({ teacherId, teacher, rows, teachingPeriods, fixedPeriods, homeroomClass, pdfWorkload }) => (
          <details key={teacherId} open={Boolean(searchTerm)} className="group">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
              <div>
                <div className="font-semibold text-slate-900">{teacher?.fullName || rows[0]?.teacherName}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {teacher?.department || 'Chưa rõ tổ'} · {rows.length} lớp/môn
                  {homeroomClass ? ` · GVCN ${homeroomClass}` : ''}
                </div>
                {pdfWorkload && (
                  <div className="mt-1 text-xs text-slate-600" title={pdfWorkload.sourcePdf}>
                    PDF: {pdfWorkload.weeklyTeachingPeriods} dạy + {pdfWorkload.dutyPeriods} kiêm nhiệm = {pdfWorkload.totalQuotaPeriods} tổng
                    {' · '}
                    {pdfWorkload.quotaBalance < 0
                      ? `Thiếu ${Math.abs(pdfWorkload.quotaBalance)}`
                      : pdfWorkload.quotaBalance > 0
                        ? `Thừa ${pdfWorkload.quotaBalance}`
                        : 'Đủ chuẩn'}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-bold text-slate-900">{teachingPeriods} tiết dạy</span>
                {fixedPeriods > 0 && <span className="text-xs text-slate-500">+ {fixedPeriods} tiết SHL/CC</span>}
              </div>
            </summary>
            <div className="overflow-x-auto border-t border-slate-100 bg-slate-50/70">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Lớp</th>
                    <th className="px-4 py-2 font-semibold">Môn</th>
                    <th className="px-4 py-2 text-right font-semibold">Số tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70">
                  {rows.map((assignment) => (
                    <tr key={assignment.id}>
                      <td className="px-4 py-2 font-semibold text-slate-800">{assignment.className}</td>
                      <td className="px-4 py-2 text-slate-700">{assignment.subjectName}</td>
                      <td className="px-4 py-2 text-right font-semibold tabular-nums text-slate-900">{assignment.weeklyPeriods}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
        {teacherGroups.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Không có phân công khớp bộ lọc.</p>
        )}
      </section>
    </div>
  );
};