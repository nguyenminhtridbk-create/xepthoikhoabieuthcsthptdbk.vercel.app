import { PeriodSlot, TeacherAssignmentItem } from '../types';
import week4Data from './dbkWeek4Data.json';
import week5Data from './dbkWeek5Data.json';

export interface WeeklyTeacherWorkload {
  teacherId: string;
  teacherName: string;
  weeklyTeachingPeriods: number;
  dutyPeriods: number;
  totalQuotaPeriods: number;
  quotaBalance: number;
  sourcePdf: string;
}

export interface WeeklyScheduleSnapshot {
  revision: string;
  sourceDate: string;
  sourceFiles: string[];
  weekNumber: number;
  slots: PeriodSlot[];
  assignments: TeacherAssignmentItem[];
  teacherWorkloads: WeeklyTeacherWorkload[];
  ruleViolations: {
    className: string;
    dayOfWeek: number;
    periodNumber: number;
    subjectName: string;
    teacherName: string;
    description: string;
  }[];
}

const scheduleSnapshots: WeeklyScheduleSnapshot[] = [
  week4Data as unknown as WeeklyScheduleSnapshot,
  week5Data as unknown as WeeklyScheduleSnapshot,
];

export const DBK_WEEKLY_SCHEDULES: Record<number, WeeklyScheduleSnapshot> = Object.fromEntries(
  scheduleSnapshots.map((snapshot) => [snapshot.weekNumber, snapshot])
);
export const DBK_AVAILABLE_WEEKS = scheduleSnapshots.map((snapshot) => snapshot.weekNumber).sort((a, b) => a - b);
export const DBK_LATEST_WEEK = Math.max(...DBK_AVAILABLE_WEEKS);
