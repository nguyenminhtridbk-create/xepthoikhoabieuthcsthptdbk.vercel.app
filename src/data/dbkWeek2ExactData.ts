import { PeriodSlot, TeacherAssignmentItem } from '../types';
import exactData from './dbkWeek2ExactData.json';

/**
 * THỜI KHÓA BIỂU TUẦN 2 THỰC TẾ CHUẨN XÁC TRƯỜNG THCS & THPT ĐỐC BINH KIỀU
 * Đầy đủ 53 lớp, 1538 tiết học (Khối 8 đủ 30 tiết, Khối 9 có 1 tiết trống Thứ 5,
 * Khối 6 và 7 có đủ 27 tiết chính khóa chiều + 2 tiết trái buổi sáng)
 */
export const EXACT_WEEK2_SLOTS: PeriodSlot[] = exactData.slots as unknown as PeriodSlot[];

/**
 * PHÂN CÔNG GIẢNG DẠY CHUẨN XÁC THEO TKB THỰC TẾ
 */
export const EXACT_TEACHING_ASSIGNMENTS: TeacherAssignmentItem[] = exactData.assignments as unknown as TeacherAssignmentItem[];
