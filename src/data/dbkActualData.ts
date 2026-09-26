import {
  Campus,
  Room,
  Subject,
  Teacher,
  ClassRoom,
  PeriodSlot,
  TeacherAssignmentItem,
  TeacherWorkloadSummary,
} from '../types';
import { EXACT_WEEK2_SLOTS, EXACT_TEACHING_ASSIGNMENTS } from './dbkWeek2ExactData';
import { prepareOptimalWeek2Slots } from '../services/timetableSchedulerEngine';

export { EXACT_WEEK2_SLOTS, EXACT_TEACHING_ASSIGNMENTS };

export const DBK_CAMPUSES: Campus[] = [
  {
    id: 'campus_main',
    name: 'Điểm chính (Cơ sở THPT)',
    code: 'CS1-Chính',
    address: 'Số 12 Đường Lê Quý Đôn, Xã Đốc Binh Kiều, Tháp Mười, Đồng Tháp',
    travelTimeMinutes: 15,
    isMainCampus: true,
  },
  {
    id: 'campus_dbk',
    name: 'Điểm Đốc Binh Kiều (Cơ sở THCS)',
    code: 'CS2-ĐBK',
    address: 'Ấp 1, Xã Đốc Binh Kiều, Huyện Tháp Mười (Cách CS1 4.5km)',
    travelTimeMinutes: 20,
    isMainCampus: false,
  },
  {
    id: 'campus_tk',
    name: 'Điểm Tân Kiều (Phân hiệu THCS)',
    code: 'CS3-Tân Kiều',
    address: 'Xã Tân Kiều, Huyện Tháp Mười (Cách CS1 8km)',
    travelTimeMinutes: 30,
    isMainCampus: false,
  },
];

export const DBK_ROOMS: Room[] = [
  // Điểm chính
  { id: 'room_main_101', name: 'Phòng 101 (Điểm chính)', campusId: 'campus_main', roomType: 'standard', capacity: 45 },
  { id: 'room_main_102', name: 'Phòng 102 (Điểm chính)', campusId: 'campus_main', roomType: 'standard', capacity: 45 },
  { id: 'room_main_103', name: 'Phòng 103 (Điểm chính)', campusId: 'campus_main', roomType: 'standard', capacity: 45 },
  { id: 'room_main_lab_khtn', name: 'Phòng Thí nghiệm KHTN (Điểm chính)', campusId: 'campus_main', roomType: 'lab_khtn', capacity: 40 },
  { id: 'room_main_tin', name: 'Phòng Máy vi tính (Điểm chính)', campusId: 'campus_main', roomType: 'lab_computer', capacity: 45 },
  { id: 'room_main_gym', name: 'Sân đa năng / GDTC (Điểm chính)', campusId: 'campus_main', roomType: 'multipurpose_hall', capacity: 200 },

  // Điểm Đốc Binh Kiều
  { id: 'room_dbk_201', name: 'Phòng 201 (Điểm ĐBK)', campusId: 'campus_dbk', roomType: 'standard', capacity: 45 },
  { id: 'room_dbk_202', name: 'Phòng 202 (Điểm ĐBK)', campusId: 'campus_dbk', roomType: 'standard', capacity: 45 },
  { id: 'room_dbk_lab', name: 'Phòng TN Thực hành (Điểm ĐBK)', campusId: 'campus_dbk', roomType: 'lab_khtn', capacity: 40 },
  { id: 'room_dbk_tin', name: 'Phòng Máy vi tính (Điểm ĐBK)', campusId: 'campus_dbk', roomType: 'lab_computer', capacity: 40 },

  // Điểm Tân Kiều
  { id: 'room_tk_301', name: 'Phòng 301 (Điểm Tân Kiều)', campusId: 'campus_tk', roomType: 'standard', capacity: 40 },
  { id: 'room_tk_302', name: 'Phòng 302 (Điểm Tân Kiều)', campusId: 'campus_tk', roomType: 'standard', capacity: 40 },
  { id: 'room_tk_lab', name: 'Phòng Thực hành KHTN (Tân Kiều)', campusId: 'campus_tk', roomType: 'lab_khtn', capacity: 35 },
  { id: 'room_tk_tin', name: 'Phòng Máy vi tính (Tân Kiều)', campusId: 'campus_tk', roomType: 'lab_computer', capacity: 35 },
];

export const DBK_SUBJECTS: Subject[] = [
  { id: 'sub_toan', code: 'TOÁN', name: 'Toán học', gradeLevel: 'THPT', category: 'standard', defaultWeeklyPeriods: 4, color: '#2563EB' },
  { id: 'sub_van', code: 'VĂN', name: 'Ngữ văn', gradeLevel: 'THPT', category: 'standard', defaultWeeklyPeriods: 4, color: '#DC2626' },
  { id: 'sub_anh', code: 'ANH', name: 'Tiếng Anh', gradeLevel: 'THPT', category: 'standard', defaultWeeklyPeriods: 3, color: '#9333EA' },
  { id: 'sub_ly', code: 'LÝ', name: 'Vật lí', gradeLevel: 'THPT', category: 'standard', defaultWeeklyPeriods: 2, color: '#0284C7' },
  { id: 'sub_hoa', code: 'HÓA', name: 'Hóa học', gradeLevel: 'THPT', category: 'standard', defaultWeeklyPeriods: 2, color: '#7C3AED' },
  { id: 'sub_sinh', code: 'SINH', name: 'Sinh học', gradeLevel: 'THPT', category: 'standard', defaultWeeklyPeriods: 2, color: '#16A34A' },
  { id: 'sub_su', code: 'SỬ', name: 'Lịch sử', gradeLevel: 'THPT', category: 'standard', defaultWeeklyPeriods: 2, color: '#B45309' },
  { id: 'sub_dia', code: 'ĐỊA', name: 'Địa lí', gradeLevel: 'THPT', category: 'standard', defaultWeeklyPeriods: 2, color: '#EA580C' },
  { id: 'sub_tin', code: 'TIN', name: 'Tin học', gradeLevel: 'THPT', category: 'standard', defaultWeeklyPeriods: 2, color: '#0D9488' },
  { id: 'sub_cn', code: 'CN', name: 'Công nghệ', gradeLevel: 'THPT', category: 'standard', defaultWeeklyPeriods: 2, color: '#475569' },
  { id: 'sub_gdcd', code: 'GDCD', name: 'Giáo dục công dân', gradeLevel: 'THCS', category: 'standard', defaultWeeklyPeriods: 1, color: '#D97706' },
  { id: 'sub_gdktpl', code: 'GDKT&PL', name: 'Giáo dục KT & PL', gradeLevel: 'THPT', category: 'thpt_elective', defaultWeeklyPeriods: 2, color: '#4F46E5' },
  { id: 'sub_gdtc', code: 'GDTC', name: 'Giáo dục thể chất', gradeLevel: 'THPT', category: 'standard', defaultWeeklyPeriods: 2, color: '#059669' },
  { id: 'sub_gdqp', code: 'GDQP', name: 'GDQP - AN', gradeLevel: 'THPT', category: 'standard', defaultWeeklyPeriods: 1, color: '#65A30D' },
  { id: 'sub_amnhac', code: 'ÂN', name: 'Âm nhạc', gradeLevel: 'THCS', category: 'standard', defaultWeeklyPeriods: 1, color: '#EC4899' },
  { id: 'sub_mythuat', code: 'MT', name: 'Mỹ thuật', gradeLevel: 'THCS', category: 'standard', defaultWeeklyPeriods: 1, color: '#F43F5E' },
  { id: 'sub_hdtn_cd', code: 'HĐTNHN', name: 'HĐTNHN (Chuyên đề)', gradeLevel: 'THPT', category: 'thpt_chuyen_de', defaultWeeklyPeriods: 2, color: '#6366F1' },
  { id: 'sub_hdtn_lop', code: 'HĐTNHN_LOP', name: 'HĐTNHN (Quy mô lớp)', gradeLevel: 'THCS', category: 'standard', defaultWeeklyPeriods: 1, color: '#8B5CF6' },
  { id: 'sub_khtn', code: 'KHTN', name: 'Khoa học tự nhiên', gradeLevel: 'THCS', category: 'khtn_integrated', defaultWeeklyPeriods: 4, color: '#10B981' },
  { id: 'sub_lsdl', code: 'LS&ĐL', name: 'Lịch sử và Địa lí', gradeLevel: 'THCS', category: 'lsdl_integrated', defaultWeeklyPeriods: 3, color: '#F59E0B' },
  { id: 'sub_chao_co', code: 'CC', name: 'Chào cờ', gradeLevel: 'THPT', category: 'standard', defaultWeeklyPeriods: 1, color: '#E11D48' },
  { id: 'sub_shl', code: 'SHL', name: 'Sinh hoạt lớp', gradeLevel: 'THPT', category: 'standard', defaultWeeklyPeriods: 1, color: '#E11D48' },
];

/**
 * 53 Lớp học chuẩn theo tài liệu Phân công Chuyên môn & TKB Tuần 2
 */
export const DBK_CLASSES: ClassRoom[] = [
  // Khối 10 (Điểm chính - Buổi Sáng)
  { id: 'cls_10cb1', name: '10CB1', grade: 10, gradeLevel: 'THPT', campusId: 'campus_main', shift: 'morning', homeroomTeacherId: 'gv_cao_van_tung', studentCount: 42 },
  { id: 'cls_10cb2', name: '10CB2', grade: 10, gradeLevel: 'THPT', campusId: 'campus_main', shift: 'morning', homeroomTeacherId: 'gv_tran_thi_kieu', studentCount: 40 },
  { id: 'cls_10cb3', name: '10CB3', grade: 10, gradeLevel: 'THPT', campusId: 'campus_main', shift: 'morning', homeroomTeacherId: 'gv_le_thi_my_ny', studentCount: 41 },
  { id: 'cls_10cb4', name: '10CB4', grade: 10, gradeLevel: 'THPT', campusId: 'campus_main', shift: 'morning', homeroomTeacherId: 'gv_le_thi_thu_diem', studentCount: 39 },
  { id: 'cls_10cb5', name: '10CB5', grade: 10, gradeLevel: 'THPT', campusId: 'campus_main', shift: 'morning', homeroomTeacherId: 'gv_ho_van_nhinh', studentCount: 43 },

  // Khối 11 (Điểm chính - Buổi Sáng)
  { id: 'cls_11cb1', name: '11CB1', grade: 11, gradeLevel: 'THPT', campusId: 'campus_main', shift: 'morning', homeroomTeacherId: 'gv_bui_kim_huynh', studentCount: 40 },
  { id: 'cls_11cb2', name: '11CB2', grade: 11, gradeLevel: 'THPT', campusId: 'campus_main', shift: 'morning', homeroomTeacherId: 'gv_pham_long_phi', studentCount: 38 },
  { id: 'cls_11cb3', name: '11CB3', grade: 11, gradeLevel: 'THPT', campusId: 'campus_main', shift: 'morning', homeroomTeacherId: 'gv_tran_van_ro', studentCount: 42 },
  { id: 'cls_11cb4', name: '11CB4', grade: 11, gradeLevel: 'THPT', campusId: 'campus_main', shift: 'morning', homeroomTeacherId: 'gv_dao_thi_ngoc_lien', studentCount: 41 },

  // Khối 12 (Điểm chính - Buổi Sáng)
  { id: 'cls_12cb1', name: '12CB1', grade: 12, gradeLevel: 'THPT', campusId: 'campus_main', shift: 'morning', homeroomTeacherId: 'gv_phan_thi_ngoc_tho', studentCount: 39 },
  { id: 'cls_12cb2', name: '12CB2', grade: 12, gradeLevel: 'THPT', campusId: 'campus_main', shift: 'morning', homeroomTeacherId: 'gv_truong_thi_my_duyen', studentCount: 38 },
  { id: 'cls_12cb3', name: '12CB3', grade: 12, gradeLevel: 'THPT', campusId: 'campus_main', shift: 'morning', homeroomTeacherId: 'gv_vo_thi_ngoc_huong', studentCount: 41 },
  { id: 'cls_12cb4', name: '12CB4', grade: 12, gradeLevel: 'THPT', campusId: 'campus_main', shift: 'morning', homeroomTeacherId: 'gv_nguyen_thi_be_trang', studentCount: 40 },
  { id: 'cls_12cb5', name: '12CB5', grade: 12, gradeLevel: 'THPT', campusId: 'campus_main', shift: 'morning', homeroomTeacherId: 'gv_trinh_van_son', studentCount: 42 },

  // Khối 6 học chiều; ĐBK học GDTC trái buổi sáng, Tân Kiều học HĐTNHN trái buổi sáng.
  { id: 'cls_6a1', name: '6A1', grade: 6, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'afternoon', homeroomTeacherId: 'gv_ho_thi_ngoc_tai', studentCount: 38 },
  { id: 'cls_6a2', name: '6A2', grade: 6, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'afternoon', homeroomTeacherId: 'gv_nguyen_thi_tham', studentCount: 37 },
  { id: 'cls_6a3', name: '6A3', grade: 6, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'afternoon', homeroomTeacherId: 'gv_bui_kim_phuong', studentCount: 39 },
  { id: 'cls_6a4', name: '6A4', grade: 6, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'afternoon', homeroomTeacherId: 'gv_nguyen_thanh_hung', studentCount: 38 },
  { id: 'cls_6a5', name: '6A5', grade: 6, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'afternoon', homeroomTeacherId: 'gv_le_kim_ngan', studentCount: 36 },
  { id: 'cls_6a6', name: '6A6', grade: 6, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'afternoon', homeroomTeacherId: 'gv_le_thi_binh', studentCount: 38 },
  { id: 'cls_6a7', name: '6A7', grade: 6, gradeLevel: 'THCS', campusId: 'campus_tk', shift: 'afternoon', homeroomTeacherId: 'gv_nguyen_thi_kim_sang', studentCount: 35 },
  { id: 'cls_6a8', name: '6A8', grade: 6, gradeLevel: 'THCS', campusId: 'campus_tk', shift: 'afternoon', homeroomTeacherId: 'gv_le_thi_ngoc_diep', studentCount: 34 },
  { id: 'cls_6a9', name: '6A9', grade: 6, gradeLevel: 'THCS', campusId: 'campus_tk', shift: 'afternoon', homeroomTeacherId: 'gv_nguyen_thi_ngoc_diem', studentCount: 36 },
  { id: 'cls_6a10', name: '6A10', grade: 6, gradeLevel: 'THCS', campusId: 'campus_tk', shift: 'afternoon', homeroomTeacherId: 'gv_nguyen_thi_lua', studentCount: 35 },

  // Khối 7 học chiều; ĐBK 7A1-7A5 học GDTC sáng, riêng 7A6 HĐTNHN sáng; Tân Kiều học HĐTNHN sáng.
  { id: 'cls_7a1', name: '7A1', grade: 7, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'afternoon', homeroomTeacherId: 'gv_nguyen_van_ngoan', studentCount: 38 },
  { id: 'cls_7a2', name: '7A2', grade: 7, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'afternoon', homeroomTeacherId: 'gv_mai_phuoc_loc', studentCount: 37 },
  { id: 'cls_7a3', name: '7A3', grade: 7, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'afternoon', homeroomTeacherId: 'gv_nguyen_quoc_nguyen', studentCount: 39 },
  { id: 'cls_7a4', name: '7A4', grade: 7, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'afternoon', homeroomTeacherId: 'gv_le_ngoc_an', studentCount: 38 },
  { id: 'cls_7a5', name: '7A5', grade: 7, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'afternoon', homeroomTeacherId: 'gv_nguyen_thi_hieu', studentCount: 36 },
  { id: 'cls_7a6', name: '7A6', grade: 7, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'afternoon', homeroomTeacherId: 'gv_tran_thi_cam', studentCount: 37 },
  { id: 'cls_7a7', name: '7A7', grade: 7, gradeLevel: 'THCS', campusId: 'campus_tk', shift: 'afternoon', homeroomTeacherId: 'gv_tran_kim_phuong', studentCount: 34 },
  { id: 'cls_7a8', name: '7A8', grade: 7, gradeLevel: 'THCS', campusId: 'campus_tk', shift: 'afternoon', homeroomTeacherId: 'gv_pham_thi_my_chau', studentCount: 35 },
  { id: 'cls_7a9', name: '7A9', grade: 7, gradeLevel: 'THCS', campusId: 'campus_tk', shift: 'afternoon', homeroomTeacherId: 'gv_le_van_chinh', studentCount: 33 },

  // Khối 8 (Điểm ĐBK & Tân Kiều - Buổi Sáng)
  { id: 'cls_8a1', name: '8A1', grade: 8, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'morning', homeroomTeacherId: 'gv_nguyen_thai_hung', studentCount: 39 },
  { id: 'cls_8a2', name: '8A2', grade: 8, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'morning', homeroomTeacherId: 'gv_tran_phi_hai', studentCount: 38 },
  { id: 'cls_8a3', name: '8A3', grade: 8, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'morning', homeroomTeacherId: 'gv_nguyen_thi_xe', studentCount: 37 },
  { id: 'cls_8a4', name: '8A4', grade: 8, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'morning', homeroomTeacherId: 'gv_nguyen_kim_ngan', studentCount: 38 },
  { id: 'cls_8a5', name: '8A5', grade: 8, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'morning', homeroomTeacherId: 'gv_vo_hoang_toan', studentCount: 36 },
  { id: 'cls_8a6', name: '8A6', grade: 8, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'morning', homeroomTeacherId: 'gv_huynh_thanh_dan', studentCount: 39 },
  { id: 'cls_8a7', name: '8A7', grade: 8, gradeLevel: 'THCS', campusId: 'campus_tk', shift: 'morning', homeroomTeacherId: 'gv_thai_van_tien', studentCount: 35 },
  { id: 'cls_8a8', name: '8A8', grade: 8, gradeLevel: 'THCS', campusId: 'campus_tk', shift: 'morning', homeroomTeacherId: 'gv_nguyen_thi_bich_phuong', studentCount: 34 },
  { id: 'cls_8a9', name: '8A9', grade: 8, gradeLevel: 'THCS', campusId: 'campus_tk', shift: 'morning', homeroomTeacherId: 'gv_le_phuoc_hau', studentCount: 36 },
  { id: 'cls_8a10', name: '8A10', grade: 8, gradeLevel: 'THCS', campusId: 'campus_tk', shift: 'morning', homeroomTeacherId: 'gv_tran_van_nhuan', studentCount: 35 },

  // Khối 9 (Điểm ĐBK & Tân Kiều - Buổi Sáng)
  { id: 'cls_9a1', name: '9A1', grade: 9, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'morning', homeroomTeacherId: 'gv_nguyen_thi_cam_nhung', studentCount: 39 },
  { id: 'cls_9a2', name: '9A2', grade: 9, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'morning', homeroomTeacherId: 'gv_tran_thi_hau', studentCount: 38 },
  { id: 'cls_9a3', name: '9A3', grade: 9, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'morning', homeroomTeacherId: 'gv_nguyen_thi_bich_lang', studentCount: 37 },
  { id: 'cls_9a4', name: '9A4', grade: 9, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'morning', homeroomTeacherId: 'gv_nguyen_van_tai', studentCount: 39 },
  { id: 'cls_9a5', name: '9A5', grade: 9, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'morning', homeroomTeacherId: 'gv_ho_mai_thao', studentCount: 38 },
  { id: 'cls_9a6', name: '9A6', grade: 9, gradeLevel: 'THCS', campusId: 'campus_dbk', shift: 'morning', homeroomTeacherId: 'gv_le_thai_phuong', studentCount: 36 },
  { id: 'cls_9a7', name: '9A7', grade: 9, gradeLevel: 'THCS', campusId: 'campus_tk', shift: 'morning', homeroomTeacherId: 'gv_tran_quoc_huy', studentCount: 35 },
  { id: 'cls_9a8', name: '9A8', grade: 9, gradeLevel: 'THCS', campusId: 'campus_tk', shift: 'morning', homeroomTeacherId: 'gv_dinh_thi_giau', studentCount: 34 },
  { id: 'cls_9a9', name: '9A9', grade: 9, gradeLevel: 'THCS', campusId: 'campus_tk', shift: 'morning', homeroomTeacherId: 'gv_nguyen_my_ngan', studentCount: 35 },
  { id: 'cls_9a10', name: '9A10', grade: 9, gradeLevel: 'THCS', campusId: 'campus_tk', shift: 'morning', homeroomTeacherId: 'gv_nguyen_thanh_tin', studentCount: 36 },
];

/**
 * Danh sách đầy đủ các Thầy Cô giáo tiêu biểu theo Phân Công Tuần 2
 */
export const DBK_TEACHERS_CATALOG: { id: string; code: string; fullName: string; dept: string; campusId: string; role: 'admin' | 'head_of_department' | 'teacher'; specialties: string[] }[] = [
  // Ban Giám Hiệu
  { id: 'gv_pht_tri', code: 'TríNM', fullName: 'Nguyễn Minh Trí', dept: 'Ban Giám Hiệu', campusId: 'campus_main', role: 'admin', specialties: ['HĐTNHN (Chuyên đề)'] },

  // Toán
  { id: 'gv_vo_thi_ngoc_huong', code: 'HươngVTN', fullName: 'Võ Thị Ngọc Hương', dept: 'Tổ Toán THPT', campusId: 'campus_main', role: 'teacher', specialties: ['Toán học'] },
  { id: 'gv_le_cao_toan', code: 'ToànLC', fullName: 'Lê Cao Toàn', dept: 'Tổ Toán THPT', campusId: 'campus_main', role: 'teacher', specialties: ['Toán học'] },
  { id: 'gv_tran_van_giang', code: 'GiangTV', fullName: 'Trần Văn Giang', dept: 'Tổ Toán THPT', campusId: 'campus_main', role: 'teacher', specialties: ['Toán học'] },
  { id: 'gv_le_van_toan', code: 'ToànLV', fullName: 'Lê Văn Toàn', dept: 'Tổ Toán THPT', campusId: 'campus_main', role: 'teacher', specialties: ['Toán học'] },
  { id: 'gv_nguyen_van_toi', code: 'TớiNV', fullName: 'Nguyễn Văn Tới', dept: 'Tổ Toán THPT', campusId: 'campus_main', role: 'teacher', specialties: ['Toán học'] },
  { id: 'gv_nguyen_thi_bich_lang', code: 'LangNTB', fullName: 'Nguyễn Thị Bích Lang', dept: 'Tổ Toán THCS', campusId: 'campus_dbk', role: 'head_of_department', specialties: ['Toán học'] },
  { id: 'gv_le_thi_binh', code: 'BìnhLT', fullName: 'Lê Thị Bình', dept: 'Tổ Toán THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Toán học'] },
  { id: 'gv_nguyen_thai_hung', code: 'HùngNT', fullName: 'Nguyễn Thái Hùng', dept: 'Tổ Toán THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Toán học'] },
  { id: 'gv_tran_van_nhuan', code: 'NhuậnTV', fullName: 'Trần Văn Nhuận', dept: 'Tổ Toán THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Toán học'] },
  { id: 'gv_nguyen_thanh_tin', code: 'TínNT', fullName: 'Nguyễn Thành Tín', dept: 'Tổ Toán THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Toán học'] },
  { id: 'gv_tran_quoc_huy', code: 'HuyTQ', fullName: 'Trần Quốc Huy', dept: 'Tổ Toán THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Toán học'] },
  { id: 'gv_nguyen_van_ngoan', code: 'NgoanNV', fullName: 'Nguyễn Văn Ngoan', dept: 'Tổ Toán THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Toán học'] },
  { id: 'gv_nguyen_quoc_nguyen', code: 'NguyênNQ', fullName: 'Nguyễn Quốc Nguyễn', dept: 'Tổ Toán THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Toán học'] },
  { id: 'gv_nguyen_van_tai', code: 'TàiNV', fullName: 'Nguyễn Văn Tài', dept: 'Tổ Toán THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Toán học'] },
  { id: 'gv_huynh_thi_huynh_nga', code: 'NgaHTH', fullName: 'Huỳnh Thị Huỳnh Nga', dept: 'Tổ Toán THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Toán học'] },

  // Ngữ Văn
  { id: 'gv_truong_thi_my_duyen', code: 'DuyênTTM', fullName: 'Trương Thị Mỹ Duyên', dept: 'Tổ Ngữ Văn', campusId: 'campus_main', role: 'head_of_department', specialties: ['Ngữ văn', 'HĐTNHN (Chuyên đề)'] },
  { id: 'gv_ho_van_nhinh', code: 'NhịnhHV', fullName: 'Hồ Văn Nhịnh', dept: 'Tổ Ngữ Văn', campusId: 'campus_main', role: 'teacher', specialties: ['Ngữ văn'] },
  { id: 'gv_le_thi_my_ny', code: 'NyLTM', fullName: 'Lê Thị Mỹ Ny', dept: 'Tổ Ngữ Văn', campusId: 'campus_main', role: 'teacher', specialties: ['Ngữ văn'] },
  { id: 'gv_to_thi_lam', code: 'LắmTT', fullName: 'Tô Thị Lắm', dept: 'Tổ Ngữ Văn', campusId: 'campus_main', role: 'teacher', specialties: ['Ngữ văn'] },
  { id: 'gv_pham_thanh_lam', code: 'LâmPT', fullName: 'Phạm Thanh Lâm', dept: 'Tổ Ngữ Văn THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Ngữ văn'] },
  { id: 'gv_hua_thuy_duong', code: 'DươngHT', fullName: 'Hứa Thùy Dương', dept: 'Tổ Ngữ Văn THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Ngữ văn'] },
  { id: 'gv_nguyen_hien_vi', code: 'ViNH', fullName: 'Nguyễn Hiền Vi', dept: 'Tổ Ngữ Văn THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Ngữ văn'] },
  { id: 'gv_huynh_thi_van_nhi', code: 'NhiHTV', fullName: 'Huỳnh Thị Vân Nhi', dept: 'Tổ Ngữ Văn THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Ngữ văn'] },
  { id: 'gv_nguyen_thi_thao', code: 'ThảoNT', fullName: 'Nguyễn Thị Thảo', dept: 'Tổ Ngữ Văn THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Ngữ văn'] },
  { id: 'gv_le_thi_hoai_an', code: 'AnLTH', fullName: 'Lê Thị Hoài An', dept: 'Tổ Ngữ Văn THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Ngữ văn'] },
  { id: 'gv_nguyen_thi_kim_xoa', code: 'XoaNTK', fullName: 'Nguyễn Thị Kim Xoa', dept: 'Tổ Ngữ Văn THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Ngữ văn'] },
  { id: 'gv_truong_van_nghia', code: 'NghĩaTV', fullName: 'Trương Văn Nghĩa', dept: 'Tổ Ngữ Văn THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Ngữ văn'] },

  // Tiếng Anh
  { id: 'gv_vo_thi_hien_thi', code: 'ThiVTH', fullName: 'Võ Thị Hiền Thi', dept: 'Tổ Ngoại Ngữ', campusId: 'campus_main', role: 'head_of_department', specialties: ['Tiếng Anh'] },
  { id: 'gv_ngo_bao_quoc', code: 'QuốcNB', fullName: 'Ngô Bảo Quốc', dept: 'Tổ Ngoại Ngữ', campusId: 'campus_main', role: 'teacher', specialties: ['Tiếng Anh'] },
  { id: 'gv_nguyen_thi_van_anh', code: 'AnhNTV', fullName: 'Nguyễn Thị Vân Anh', dept: 'Tổ Ngoại Ngữ', campusId: 'campus_main', role: 'teacher', specialties: ['Tiếng Anh'] },
  { id: 'gv_truong_son_ben', code: 'BềnTS', fullName: 'Trương Sơn Bền', dept: 'Tổ Ngoại Ngữ', campusId: 'campus_tk', role: 'teacher', specialties: ['Tiếng Anh'] },
  { id: 'gv_ho_mai_thao', code: 'ThảoHM', fullName: 'Hồ Mai Thảo', dept: 'Tổ Ngoại Ngữ THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Tiếng Anh'] },
  { id: 'gv_tran_thanh_hau', code: 'HậuTT', fullName: 'Trần Thanh Hậu', dept: 'Tổ Ngoại Ngữ THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Tiếng Anh'] },
  { id: 'gv_le_minh_thanh', code: 'ThànhLM', fullName: 'Lê Minh Thành', dept: 'Tổ Ngoại Ngữ THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Tiếng Anh'] },
  { id: 'gv_le_thi_ngoc_tuyen', code: 'TuyềnLTN', fullName: 'Lê Thị Ngọc Tuyền', dept: 'Tổ Ngoại Ngữ THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Tiếng Anh'] },
  { id: 'gv_nguyen_thi_mai_khanh', code: 'KhanhNTM', fullName: 'Nguyễn Thị Mai Khanh', dept: 'Tổ Ngoại Ngữ THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Tiếng Anh'] },
  { id: 'gv_nguyen_thi_thuy_duong', code: 'DươngNTT', fullName: 'Nguyễn Thị Thùy Dương', dept: 'Tổ Ngoại Ngữ THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Tiếng Anh'] },

  // KHTN - Lý - Hóa - Sinh
  { id: 'gv_tran_thi_ngoc_hien', code: 'HiềnTTN', fullName: 'Trần Thị Ngọc Hiền', dept: 'Tổ KHTN', campusId: 'campus_main', role: 'head_of_department', specialties: ['Vật lí'] },
  { id: 'gv_pham_bien_thuy', code: 'ThùyPB', fullName: 'Phạm Biên Thùy', dept: 'Tổ KHTN', campusId: 'campus_main', role: 'teacher', specialties: ['Vật lí'] },
  { id: 'gv_tran_thi_kieu', code: 'KiềuTT', fullName: 'Trần Thị Kiều', dept: 'Tổ KHTN', campusId: 'campus_main', role: 'teacher', specialties: ['Hóa học', 'HĐTNHN (Chuyên đề)'] },
  { id: 'gv_cao_van_tung', code: 'TùngCV', fullName: 'Cao Văn Tùng', dept: 'Tổ KHTN', campusId: 'campus_main', role: 'teacher', specialties: ['Sinh học', 'Công nghệ', 'HĐTNHN (Chuyên đề)'] },
  { id: 'gv_bui_kim_huynh', code: 'HuỳnhBK', fullName: 'Bùi Kim Huỳnh', dept: 'Tổ KHTN', campusId: 'campus_main', role: 'teacher', specialties: ['Sinh học'] },
  { id: 'gv_phan_thi_ngoc_tho', code: 'ThơPTN', fullName: 'Phan Thị Ngọc Thơ', dept: 'Tổ KHTN', campusId: 'campus_main', role: 'teacher', specialties: ['Hóa học', 'HĐTNHN (Chuyên đề)'] },
  { id: 'gv_pham_long_phi', code: 'PhiPL', fullName: 'Phạm Long Phi', dept: 'Tổ KHTN', campusId: 'campus_main', role: 'teacher', specialties: ['Hóa học', 'HĐTNHN (Chuyên đề)'] },
  { id: 'gv_ho_thi_ngoc_tai', code: 'TàiHTN', fullName: 'Hồ Thị Ngọc Tài', dept: 'Tổ KHTN THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Khoa học tự nhiên', 'Hóa học'] },
  { id: 'gv_nguyen_thi_tham', code: 'ThắmNT', fullName: 'Nguyễn Thị Thắm', dept: 'Tổ KHTN THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Khoa học tự nhiên', 'Vật lí'] },
  { id: 'gv_nguyen_kim_ngan', code: 'NgânNK', fullName: 'Nguyễn Kim Ngân', dept: 'Tổ KHTN THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Khoa học tự nhiên', 'Hóa học'] },
  { id: 'gv_nguyen_thi_lua', code: 'LụaNT', fullName: 'Nguyễn Thị Lụa', dept: 'Tổ KHTN THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Khoa học tự nhiên', 'Hóa học'] },
  { id: 'gv_nguyen_thi_bich_phuong', code: 'PhượngNTB', fullName: 'Nguyễn Thị Bích Phượng', dept: 'Tổ KHTN THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Khoa học tự nhiên', 'Vật lí'] },
  { id: 'gv_nguyen_thi_hieu', code: 'HiếuNT', fullName: 'Nguyễn Thị Hiếu', dept: 'Tổ KHTN THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Khoa học tự nhiên', 'Sinh học'] },
  { id: 'gv_nguyen_thi_cam_nhung', code: 'NhungNTC', fullName: 'Nguyễn Thị Cẩm Nhung', dept: 'Tổ KHTN THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Khoa học tự nhiên', 'Sinh học', 'HĐTNHN'] },
  { id: 'gv_vo_hoang_toan', code: 'ToànVH', fullName: 'Võ Hoàng Toàn', dept: 'Tổ KHTN THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Khoa học tự nhiên', 'Hóa học'] },
  { id: 'gv_tran_thi_hau', code: 'HậuTT', fullName: 'Trần Thị Hậu', dept: 'Tổ KHTN THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Vật lí', 'HĐTNHN (Chuyên đề)'] },
  { id: 'gv_le_thai_phuong', code: 'PhươngLT', fullName: 'Lê Thái Phương', dept: 'Tổ KHTN THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Hóa học', 'HĐTNHN'] },
  { id: 'gv_tran_kim_phuong', code: 'PhươngTK', fullName: 'Trần Kim Phương', dept: 'Tổ KHTN THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Khoa học tự nhiên'] },
  { id: 'gv_vo_ngoc_dinh_van', code: 'VănVNĐ', fullName: 'Võ Ngọc Đình Văn', dept: 'Tổ KHTN THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Hóa học'] },
  { id: 'gv_dinh_thi_giau', code: 'GiàuĐT', fullName: 'Đinh Thị Giàu', dept: 'Tổ KHTN THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Hóa học', 'Sinh học', 'HĐTNHN'] },

  // Lịch sử - Địa lí
  { id: 'gv_nguyen_thi_be_trang', code: 'TrangNTB', fullName: 'Nguyễn Thị Bé Trang', dept: 'Tổ KHXH', campusId: 'campus_main', role: 'head_of_department', specialties: ['Lịch sử', 'HĐTNHN (Chuyên đề)'] },
  { id: 'gv_trinh_van_son', code: 'SơnTV', fullName: 'Trịnh Văn Sơn', dept: 'Tổ KHXH', campusId: 'campus_main', role: 'teacher', specialties: ['Lịch sử'] },
  { id: 'gv_tran_van_ro', code: 'RỡTV', fullName: 'Trần Văn Rỡ', dept: 'Tổ KHXH', campusId: 'campus_main', role: 'teacher', specialties: ['Lịch sử', 'HĐTNHN (Chuyên đề)'] },
  { id: 'gv_tran_phuoc_hoa', code: 'HòaTP', fullName: 'Trần Phước Hòa', dept: 'Tổ KHXH', campusId: 'campus_main', role: 'teacher', specialties: ['Địa lí'] },
  { id: 'gv_ngo_anh_tuan', code: 'TuấnNA', fullName: 'Ngô Anh Tuấn', dept: 'Tổ KHXH', campusId: 'campus_main', role: 'teacher', specialties: ['Địa lí'] },
  { id: 'gv_nguyen_quoc_tan', code: 'TấnNQ', fullName: 'Nguyễn Quốc Tấn', dept: 'Tổ KHXH THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Lịch sử và Địa lí', 'Lịch sử'] },
  { id: 'gv_chau_thi_kim_ha', code: 'HàCTK', fullName: 'Châu Thị Kim Hà', dept: 'Tổ KHXH THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Lịch sử'] },
  { id: 'gv_le_thi_kim_the', code: 'TheLTK', fullName: 'Lê Thị Kim The', dept: 'Tổ KHXH THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Lịch sử'] },
  { id: 'gv_nguyen_thi_kim_sang', code: 'SangNTK', fullName: 'Nguyễn Thị Kim Sang', dept: 'Tổ KHXH THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Địa lí'] },
  { id: 'gv_nguyen_thi_kim_dinh', code: 'ĐỉnhNTK', fullName: 'Nguyễn Thị Kim Đỉnh', dept: 'Tổ KHXH THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Địa lí'] },
  { id: 'gv_pham_thi_my_chau', code: 'ChâuPTM', fullName: 'Phạm Thị Mỹ Châu', dept: 'Tổ KHXH THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Lịch sử và Địa lí', 'Địa lí'] },
  { id: 'gv_nguyen_thi_ly', code: 'LýNT', fullName: 'Nguyễn Thị Lý', dept: 'Tổ KHXH THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Địa lí'] },

  // Tin học
  { id: 'gv_le_thi_thu_diem', code: 'DiễmLTT', fullName: 'Lê Thị Thu Diễm', dept: 'Tổ Toán - Tin', campusId: 'campus_main', role: 'teacher', specialties: ['Tin học'] },
  { id: 'gv_dao_thi_ngoc_lien', code: 'LiênĐTN', fullName: 'Đào Thị Ngọc Liên', dept: 'Tổ Toán - Tin', campusId: 'campus_main', role: 'teacher', specialties: ['Tin học'] },
  { id: 'gv_nguyen_trung_hieu', code: 'HiếuNT', fullName: 'Nguyễn Trung Hiếu', dept: 'Tổ Toán - Tin', campusId: 'campus_main', role: 'teacher', specialties: ['Tin học'] },
  { id: 'gv_bui_kim_phuong', code: 'PhướngBK', fullName: 'Bùi Kim Phướng', dept: 'Tổ Tin THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Tin học', 'HĐTNHN'] },
  { id: 'gv_le_phuoc_hau', code: 'HậuLP', fullName: 'Lê Phước Hậu', dept: 'Tổ Tin THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Tin học'] },
  { id: 'gv_mai_phuoc_loc', code: 'LộcMP', fullName: 'Mai Phước Lộc', dept: 'Tổ Tin THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Tin học'] },

  // GDCD / GDKT&PL
  { id: 'gv_pham_nguyen_van_truong', code: 'TrườngPNV', fullName: 'Phạm Nguyễn Văn Trường', dept: 'Tổ KHXH', campusId: 'campus_main', role: 'teacher', specialties: ['Giáo dục KT & PL'] },
  { id: 'gv_le_hong_thuy', code: 'ThúyLH', fullName: 'Lê Hồng Thúy', dept: 'Tổ KHXH THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Giáo dục công dân'] },
  { id: 'gv_nguyen_my_ngan', code: 'NgânNM', fullName: 'Nguyễn Mỹ Ngân', dept: 'Tổ KHXH THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Giáo dục công dân'] },
  { id: 'gv_nguyen_thi_xe', code: 'XeNT', fullName: 'Nguyễn Thị Xe', dept: 'Tổ KHXH THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Giáo dục công dân'] },

  // Thể dục & GDQP-AN
  { id: 'gv_le_ngoc_an', code: 'ẨnLN', fullName: 'Lê Ngọc Ẩn', dept: 'Tổ GDTC - QP', campusId: 'campus_main', role: 'teacher', specialties: ['Giáo dục thể chất', 'HĐTNHN'] },
  { id: 'gv_nguyen_kim_rang', code: 'RạngNK', fullName: 'Nguyễn Kim Rạng', dept: 'Tổ GDTC - QP', campusId: 'campus_main', role: 'head_of_department', specialties: ['GDQP - AN', 'Giáo dục thể chất'] },
  { id: 'gv_ho_hoai_ngan', code: 'NgânHH', fullName: 'Hồ Hoài Ngân', dept: 'Tổ GDTC - QP', campusId: 'campus_main', role: 'teacher', specialties: ['Giáo dục thể chất'] },
  { id: 'gv_nguyen_thanh_hung', code: 'HùngNT', fullName: 'Nguyễn Thanh Hùng', dept: 'Tổ GDTC THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Giáo dục thể chất', 'HĐTNHN'] },
  { id: 'gv_le_thi_ngoc_diep', code: 'ĐiệpLTN', fullName: 'Lê Thị Ngọc Điệp', dept: 'Tổ GDTC THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Giáo dục thể chất'] },
  { id: 'gv_huynh_thanh_dan', code: 'DânHT', fullName: 'Huỳnh Thanh Dân', dept: 'Tổ GDTC THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Giáo dục thể chất', 'HĐTNHN'] },
  { id: 'gv_le_van_nguyen', code: 'NguyênLV', fullName: 'Lê Văn Nguyên', dept: 'Tổ GDTC THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Giáo dục thể chất'] },
  { id: 'gv_le_van_chinh', code: 'ChínhLV', fullName: 'Lê Văn Chính', dept: 'Tổ GDTC THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Giáo dục thể chất'] },

  // Công nghệ
  { id: 'gv_le_kim_ngan', code: 'NgânLK', fullName: 'Lê Kim Ngân', dept: 'Tổ KHTN THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Công nghệ', 'HĐTNHN'] },
  { id: 'gv_nguyen_thi_ngoc_diem', code: 'DiễmNTN', fullName: 'Nguyễn Thị Ngọc Diễm', dept: 'Tổ KHTN THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Công nghệ', 'HĐTNHN'] },
  { id: 'gv_tran_thi_cam', code: 'CẩmTT', fullName: 'Trần Thị Cẩm', dept: 'Tổ KHTN THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Công nghệ', 'HĐTNHN'] },
  { id: 'gv_phan_van_tat', code: 'TặtPV', fullName: 'Phan Văn Tặt', dept: 'Tổ KHTN THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Công nghệ', 'HĐTNHN'] },
  { id: 'gv_tran_phi_hai', code: 'HảiTP', fullName: 'Trần Phi Hải', dept: 'Tổ KHTN THCS', campusId: 'campus_dbk', role: 'teacher', specialties: ['Công nghệ', 'HĐTNHN'] },
  { id: 'gv_thai_van_tien', code: 'TiếnTV', fullName: 'Thái Văn Tiến', dept: 'Tổ KHTN THCS', campusId: 'campus_tk', role: 'teacher', specialties: ['Công nghệ'] },
  { id: 'gv_nguyen_thanh_tong', code: 'TòngNT', fullName: 'Nguyễn Thanh Tòng', dept: 'Tổ HĐTNHN', campusId: 'campus_tk', role: 'teacher', specialties: ['HĐTNHN (Chuyên đề)'] },

  // Âm nhạc & Mỹ thuật
  { id: 'gv_le_thi_tuyet_xanh', code: 'XanhLTT', fullName: 'Lê Thị Tuyết Xanh', dept: 'Tổ Nghệ Thuật', campusId: 'campus_dbk', role: 'teacher', specialties: ['Âm nhạc'] },
  { id: 'gv_nguyen_anh_van', code: 'VănNA', fullName: 'Nguyễn Anh Văn', dept: 'Tổ Nghệ Thuật', campusId: 'campus_tk', role: 'teacher', specialties: ['Âm nhạc'] },
  { id: 'gv_le_minh_dat', code: 'ĐạtLM', fullName: 'Lê Minh Đạt', dept: 'Tổ Nghệ Thuật', campusId: 'campus_dbk', role: 'teacher', specialties: ['Mỹ thuật'] },
  { id: 'gv_tran_thi_my_quoc', code: 'QuốcTTM', fullName: 'Trần Thị Mỹ Quốc', dept: 'Tổ Nghệ Thuật', campusId: 'campus_tk', role: 'teacher', specialties: ['Mỹ thuật'] },
];

export const DBK_TEACHERS: Teacher[] = DBK_TEACHERS_CATALOG.map((t) => ({
  id: t.id,
  code: t.code,
  fullName: t.fullName,
  email: `${t.code.toLowerCase()}@thcs-thpt-docbinhkieu.edu.vn`,
  phone: '09' + Math.floor(10000000 + Math.random() * 90000000),
  role: t.role,
  department: t.dept,
  primaryCampusId: t.campusId,
  specialties: t.specialties,
  maxPeriodsPerDay: 8,
  maxPeriodsPerWeek: 25,
  preferredOffDay: undefined,
}));

/**
 * Trích xuất Phân Công Chuyên Môn (PCGD) chính thức của nhà trường từ dữ liệu Tuần 2 (762 phân công)
 */
export function buildTeachingAssignments(): TeacherAssignmentItem[] {
  return EXACT_TEACHING_ASSIGNMENTS;
}

/**
 * Danh sách đầy đủ 1,528 Tiết Học Thời Khóa Biểu Tuần 2 thực tế chuẩn xác của 53 lớp
 */
export function buildWeek2Slots(): PeriodSlot[] {
  return prepareOptimalWeek2Slots(EXACT_WEEK2_SLOTS);
}
