import { PeriodSlot, TeacherAssignmentItem } from '../types';
import week4Data from './dbkWeek4Data.json';

export const DBK_WEEK4_SLOTS = week4Data.slots as unknown as PeriodSlot[];
export const DBK_WEEK4_ASSIGNMENTS = week4Data.assignments as unknown as TeacherAssignmentItem[];
export const DBK_WEEK4_TEACHER_WORKLOADS = week4Data.teacherWorkloads;
export const DBK_WEEK4_RULE_VIOLATIONS = week4Data.ruleViolations;
export const DBK_WEEK4_SOURCE_FILES = week4Data.sourceFiles;