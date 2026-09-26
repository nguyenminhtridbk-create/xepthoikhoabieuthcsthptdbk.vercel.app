import React, { useState, useEffect, useMemo } from 'react';
import {
  UserRole,
  PeriodSlot,
  ConstraintRule,
  TeachingReport,
  AppNotification,
  VietSchoolImportResult,
  TeacherAssignmentItem,
} from './types';
import {
  DBK_CAMPUSES,
  DBK_ROOMS,
  DBK_TEACHERS,
  DBK_SUBJECTS,
  DBK_CLASSES,
} from './data/dbkActualData';
import { detectAllConflicts } from './services/conflictDetector';
import { AppScheduleStorage } from './services/appStorage';
import { exportTimetableToExcel } from './services/exportService';

import { Header } from './components/Header';
import { TimetableGrid } from './components/TimetableGrid';
import { TeachingAssignmentsManager } from './components/TeachingAssignmentsManager';
import { ConstraintManager } from './components/ConstraintManager';
import { IntegratedSubjectsManager } from './components/IntegratedSubjectsManager';
import { TeachingReportManager } from './components/TeachingReportManager';
import { NotificationCenter } from './components/NotificationCenter';
import { VietschoolImporterModal } from './components/VietschoolImporterModal';
import { SmartScheduleStudio } from './components/SmartScheduleStudio';
import { Week4TeachingAssignmentsTab } from './components/Week4TeachingAssignmentsTab';
import { DBK_WEEKLY_SCHEDULES } from './data/dbkWeeklyScheduleData';
import { Sparkles } from 'lucide-react';

export default function App() {
  const storage = useMemo(() => AppScheduleStorage.getInstance(), []);

  // System states
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [currentWeek, setCurrentWeek] = useState<number>(() => storage.getLatestAvailableWeek());
  const availableWeeks = useMemo(() => storage.getAvailableWeeks(), [storage]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<
    'timetable' | 'scheduler' | 'pcgd' | 'week4_assignments' | 'khtn_lsdl' | 'reports' | 'constraints' | 'notifications'
  >('timetable');

  // Core Data
  const [slots, setSlots] = useState<PeriodSlot[]>(() => storage.getSlots());
  const [assignments, setAssignments] = useState<TeacherAssignmentItem[]>(() =>
    storage.getTeachingAssignments(currentWeek)
  );
  const [rules, setRules] = useState<ConstraintRule[]>(() => storage.getRules());
  const [reports, setReports] = useState<TeachingReport[]>(() => storage.getReports());
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    storage.getNotifications()
  );

  // Modals
  const [isVietSchoolOpen, setIsVietSchoolOpen] = useState(false);

  // Sync with Storage events
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setSlots(storage.getSlots());
      setAssignments(storage.getTeachingAssignments(currentWeek));
      setRules(storage.getRules());
      setReports(storage.getReports());
      setNotifications(storage.getNotifications());
    });
    return () => unsubscribe();
  }, [storage, currentWeek]);

  // Conflict Detection Engine
  const validationSummary = useMemo(() => {
    return detectAllConflicts(
      slots,
      DBK_TEACHERS,
      DBK_CLASSES,
      DBK_ROOMS,
      DBK_CAMPUSES,
      DBK_SUBJECTS,
      rules,
      currentWeek
    );
  }, [slots, rules, currentWeek]);

  const conflicts = validationSummary.conflicts;
  const hardConflictsCount = validationSummary.hardConflictsCount;
  const softWarningsCount = validationSummary.softWarningsCount;

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );
  const weekSummary = useMemo(() => {
    const weekSlots = slots.filter((slot) => slot.weekNumber === currentWeek);
    return {
      teacherCount: new Set(weekSlots.map((slot) => slot.teacherId)).size,
      periodSlotCount: weekSlots.length,
    };
  }, [slots, currentWeek]);

  // Handlers for Timetable Slots
  const handleUpdateSlot = (updatedSlot: PeriodSlot) => {
    storage.updateSlot(updatedSlot);
  };

  const handleDeleteSlot = (slotId: string) => {
    storage.removeSlot(slotId);
  };

  const handleAddSlot = (slotData: Omit<PeriodSlot, 'id'>) => {
    const newSlot: PeriodSlot = {
      ...slotData,
      id: `slot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    storage.updateSlot(newSlot);
  };

  // Handlers for Teaching Assignments (PCGD)
  const handleUpdateAssignment = (item: TeacherAssignmentItem) => {
    storage.updateTeachingAssignment(item, currentWeek);
  };

  const handleDeleteAssignment = (id: string) => {
    storage.deleteTeachingAssignment(id, currentWeek);
  };

  const handleWeekChange = (weekNumber: number) => {
    setCurrentWeek(weekNumber);
    setAssignments(storage.getTeachingAssignments(weekNumber));
  };

  // Handlers for Constraint Rules
  const handleToggleRule = (ruleCode: string) => {
    storage.toggleRule(ruleCode);
  };

  // Handlers for Teaching Reports
  const handleSaveReport = (report: TeachingReport) => {
    storage.saveReport(report);
  };

  // Handlers for Notifications
  const handleMarkNotificationAsRead = (id: string) => {
    storage.markNotificationAsRead(id);
  };

  const handleSendNotification = (
    notifData: Omit<AppNotification, 'id' | 'createdAt'>
  ) => {
    storage.addNotification(notifData);
  };

  const handleExportLocalBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      school: 'Trường THCS & THPT Đốc Binh Kiều',
      slots: storage.getSlots(),
      assignments: storage.getAllTeachingAssignments(),
      rules: storage.getRules(),
      reports: storage.getReports(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TKB_THCS_THPT_DocBinhKieu_DuPhong_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handler for VietSchool Import Success
  const handleVietSchoolImportSuccess = (
    newSlots: PeriodSlot[],
    summary: VietSchoolImportResult
  ) => {
    const otherWeeks = slots.filter((s) => s.weekNumber !== currentWeek);
    const combined = [...otherWeeks, ...newSlots];
    storage.saveSlots(combined);

    storage.addNotification({
      teacherId: 'all',
      teacherName: 'Toàn trường',
      title: `Cập nhật TKB Tuần ${currentWeek} từ VietSchool`,
      message: `Thời khóa biểu Tuần ${currentWeek} đã được đồng bộ từ tệp xuất VietSchool với ${newSlots.length} tiết học và ${summary.khtnSplitCount} phân môn KHTN.`,
      type: 'schedule_change',
      isRead: false,
    });
  };

  // Excel Export
  const handleExportExcel = () => {
    exportTimetableToExcel(
      slots,
      DBK_TEACHERS,
      DBK_CLASSES,
      DBK_SUBJECTS,
      DBK_CAMPUSES,
      currentWeek
    );
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Global Application Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        currentWeek={currentWeek}
        onWeekChange={handleWeekChange}
        availableWeeks={availableWeeks}
        selectedCampusId={selectedCampusId}
        onCampusChange={setSelectedCampusId}
        campuses={DBK_CAMPUSES}
        teacherCount={weekSummary.teacherCount}
        periodSlotCount={weekSummary.periodSlotCount}
        hardConflictsCount={hardConflictsCount}
        softWarningsCount={softWarningsCount}
        unreadNotificationsCount={unreadNotificationsCount}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenVietSchoolModal={() => setIsVietSchoolOpen(true)}
        onExportExcel={handleExportExcel}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'timetable' && (
          <TimetableGrid
            slots={slots}
            teachers={DBK_TEACHERS}
            classes={DBK_CLASSES}
            subjects={DBK_SUBJECTS}
            rooms={DBK_ROOMS}
            campuses={DBK_CAMPUSES}
            conflicts={conflicts}
            currentWeek={currentWeek}
            selectedCampusId={selectedCampusId}
            currentRole={currentRole}
            onUpdateSlot={handleUpdateSlot}
            onDeleteSlot={handleDeleteSlot}
            onAddSlot={handleAddSlot}
          />
        )}

        {activeTab === 'scheduler' && (
          <SmartScheduleStudio
            slots={slots}
            teachers={DBK_TEACHERS}
            classes={DBK_CLASSES}
            subjects={DBK_SUBJECTS}
            campuses={DBK_CAMPUSES}
            rooms={DBK_ROOMS}
            assignments={assignments}
            currentWeek={currentWeek}
            onUpdateSlots={(newSlots) => storage.saveSlots(newSlots)}
            onNavigateToTimetable={() => setActiveTab('timetable')}
          />
        )}

        {activeTab === 'pcgd' && (
          <TeachingAssignmentsManager
            assignments={assignments}
            teachers={DBK_TEACHERS}
            classes={DBK_CLASSES}
            subjects={DBK_SUBJECTS}
            campuses={DBK_CAMPUSES}
            currentRole={currentRole}
            onUpdateAssignment={handleUpdateAssignment}
            onDeleteAssignment={handleDeleteAssignment}
          />
        )}

        {activeTab === 'week4_assignments' && (
          <Week4TeachingAssignmentsTab
            assignments={assignments}
            teachers={DBK_TEACHERS}
            classes={DBK_CLASSES}
            campuses={DBK_CAMPUSES}
            teacherWorkloads={DBK_WEEKLY_SCHEDULES[currentWeek]?.teacherWorkloads || []}
            ruleViolations={DBK_WEEKLY_SCHEDULES[currentWeek]?.ruleViolations || []}
            sourceFiles={DBK_WEEKLY_SCHEDULES[currentWeek]?.sourceFiles || []}
            weekNumber={currentWeek}
            sourceDate={DBK_WEEKLY_SCHEDULES[currentWeek]?.sourceDate || ''}
          />
        )}

        {activeTab === 'khtn_lsdl' && (
          <IntegratedSubjectsManager
            subjects={DBK_SUBJECTS}
            teachers={DBK_TEACHERS}
            classes={DBK_CLASSES}
            slots={slots}
            currentWeek={currentWeek}
            onWeekChange={handleWeekChange}
          />
        )}

        {activeTab === 'reports' && (
          <TeachingReportManager
            reports={reports}
            teachers={DBK_TEACHERS}
            slots={slots}
            subjects={DBK_SUBJECTS}
            classes={DBK_CLASSES}
            currentWeek={currentWeek}
            currentRole={currentRole}
            onSaveReport={handleSaveReport}
          />
        )}

        {activeTab === 'constraints' && (
          <ConstraintManager
            rules={rules}
            conflicts={conflicts}
            teachers={DBK_TEACHERS}
            campuses={DBK_CAMPUSES}
            classes={DBK_CLASSES}
            currentWeek={currentWeek}
            onToggleRule={handleToggleRule}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationCenter
            notifications={notifications}
            teachers={DBK_TEACHERS}
            currentRole={currentRole}
            onMarkAsRead={handleMarkNotificationAsRead}
            onSendNotification={handleSendNotification}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            Trường THCS &amp; THPT Đốc Binh Kiều • Phần mềm Xếp Thời Khóa Biểu &amp; Quản Lý Chuyên Môn
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Phiên bản 2.8</span>
            <span>•</span>
            <span>3 Điểm trường: CS1-Chính, CS2-ĐBK, CS3-Tân Kiều</span>
            <span>•</span>
            <span>Hệ Thống Dữ Liệu Nội Bộ Tối Ưu</span>
          </div>
        </div>
      </footer>

      {/* VietSchool Importer Modal */}
      <VietschoolImporterModal
        isOpen={isVietSchoolOpen}
        onClose={() => setIsVietSchoolOpen(false)}
        teachers={DBK_TEACHERS}
        classes={DBK_CLASSES}
        subjects={DBK_SUBJECTS}
        currentWeek={currentWeek}
        onImportSuccess={handleVietSchoolImportSuccess}
      />
    </div>
  );
}
