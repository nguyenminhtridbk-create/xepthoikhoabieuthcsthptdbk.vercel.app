import { PeriodSlot, TeacherAssignmentItem } from '../types';
import week5Data from './dbkWeek5Data.json';

export const DBK_WEEK5_SLOTS = week5Data.slots as unknown as PeriodSlot[];
export const DBK_WEEK5_ASSIGNMENTS = week5Data.assignments as unknown as TeacherAssignmentItem[];
export const DBK_WEEK5_TEACHER_WORKLOADS = week5Data.teacherWorkloads;
export const DBK_WEEK5_RULE_VIOLATIONS = week5Data.ruleViolations;
export const DBK_WEEK5_SOURCE_FILES = week5Data.sourceFiles;
