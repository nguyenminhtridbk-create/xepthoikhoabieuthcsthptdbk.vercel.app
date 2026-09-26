import React, { useState } from 'react';
import {
  Calendar,
  Layers,
  AlertTriangle,
  Bell,
  Download,
  Upload,
  Database,
  Sliders,
  BookOpen,
  School,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Users,
  Sparkles,
  Key,
  Eye,
  EyeOff,
  ChevronDown,
  Wifi,
  BarChart3,
  Zap,
} from 'lucide-react';
import { UserRole, Campus } from '../types';
import { triggerPrintWindow } from '../services/exportService';
import { AppScheduleStorage } from '../services/appStorage';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentWeek: number;
  onWeekChange: (week: number) => void;
  selectedCampusId: string;
  onCampusChange: (campusId: string) => void;
  campuses: Campus[];
  hardConflictsCount: number;
  softWarningsCount: number;
  unreadNotificationsCount: number;
  activeTab: 'timetable' | 'scheduler' | 'pcgd' | 'khtn_lsdl' | 'reports' | 'constraints' | 'notifications';
  onTabChange: (tab: 'timetable' | 'scheduler' | 'pcgd' | 'khtn_lsdl' | 'reports' | 'constraints' | 'notifications') => void;
  onOpenWeek3Modal: () => void;
  onOpenVietSchoolModal: () => void;
  onExportExcel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  currentWeek,
  onWeekChange,
  selectedCampusId,
  onCampusChange,
  campuses,
  hardConflictsCount,
  softWarningsCount,
  unreadNotificationsCount,
  activeTab,
  onTabChange,
  onOpenWeek3Modal,
  onOpenVietSchoolModal,
  onExportExcel,
}) => {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);

  const totalWarnings = hardConflictsCount + softWarningsCount;

  return (
    <header className="bg-[#18154c] text-white border-b border-[#2d2875] sticky top-0 z-40 shadow-lg">
      {/* 1. TOP HEADER - Y hệt thanh điều hướng chính trong Screenshot */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Logo và Tiêu đề Trường */}
        <div className="flex items-center space-x-3">
          {/* Logo Huy hiệu Tròn Đốc Binh Kiều */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 via-red-500 to-indigo-600 p-0.5 shadow-md shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-[#18154c] rounded-full flex items-center justify-center border border-white/20">
              <School className="w-5 h-5 text-amber-300" />
            </div>
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-semibold tracking-wider text-slate-300 uppercase leading-none">
              SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐỒNG THÁP
            </div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white uppercase leading-tight mt-0.5">
              TRƯỜNG THCS &amp; THPT ĐỐC BINH KIỀU
            </h1>
          </div>
        </div>

        {/* Controls Bên Phải y hệt mẫu Webapp */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Năm học pill */}
          <div className="flex items-center gap-1 bg-[#252063] hover:bg-[#2d2777] border border-indigo-400/30 text-white px-3 py-1.5 rounded-full font-semibold transition-colors cursor-default shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-indigo-300" />
            <span>2026 - 2027</span>
          </div>

          {/* Học kỳ pill */}
          <div className="bg-[#252063] border border-indigo-400/30 text-white px-3 py-1.5 rounded-full font-semibold cursor-default shadow-xs">
            <span>HK1</span>
          </div>

          {/* Chọn Tuần Pill */}
          <div className="flex items-center gap-1.5 bg-[#252063] border border-indigo-400/40 text-white px-3 py-1 rounded-full font-semibold shadow-xs">
            <span className="text-[10px] text-indigo-300 font-bold uppercase">Tuần:</span>
            <select
              value={currentWeek}
              onChange={(e) => onWeekChange(Number(e.target.value))}
              className="bg-transparent text-amber-300 font-extrabold focus:outline-hidden cursor-pointer text-xs"
            >
              <option value={1} className="bg-slate-900 text-white">Tuần 1</option>
              <option value={2} className="bg-slate-900 text-white">Tuần 2</option>
              <option value={3} className="bg-slate-900 text-white">Tuần 3</option>
              <option value={4} className="bg-slate-900 text-amber-300 font-bold">Tuần 4 (PCCM Mới)</option>
            </select>
          </div>

          {/* Nút Cảnh báo / Lưu ý */}
          <button
            onClick={() => onTabChange('constraints')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-all shadow-xs border cursor-pointer ${
              totalWarnings > 0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
            }`}
            title="Xem danh sách ràng buộc & lưu ý cảnh báo"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>{totalWarnings > 0 ? `${totalWarnings} lưu ý` : '0 lưu ý'}</span>
          </button>

          {/* Chế độ Xem / Sửa TKB */}
          <button
            onClick={() => setIsViewOnlyMode(!isViewOnlyMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all border cursor-pointer shadow-xs ${
              isViewOnlyMode
                ? 'bg-purple-600/40 text-purple-200 border-purple-400/50'
                : 'bg-[#2b2575] hover:bg-[#352e8c] text-white border-indigo-300/40'
            }`}
            title={isViewOnlyMode ? 'Đang ở chế độ Chỉ Xem' : 'Đang ở chế độ Xem & Sửa'}
          >
            {isViewOnlyMode ? (
              <>
                <Eye className="w-3.5 h-3.5 text-blue-300" />
                <span>Chỉ xem TKB</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-300" />
                <span>Chế độ Xem &amp; Sửa</span>
              </>
            )}
          </button>

          {/* Đăng nhập / Chuyển quyền Quản trị (Màu Vàng Gold đặc trưng như hình) */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-full shadow-md transition-all cursor-pointer text-xs"
              title="Phân quyền tài khoản quản trị"
            >
              <Key className="w-3.5 h-3.5 text-slate-900" />
              <span>
                {currentRole === 'admin'
                  ? 'Quản trị (PHT)'
                  : currentRole === 'head_of_department'
                  ? 'Tổ Trưởng'
                  : 'Giáo Viên'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-900 ml-0.5" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-800">
                  CHỌN VAI TRÒ ĐĂNG NHẬP
                </div>
                <button
                  onClick={() => {
                    onRoleChange('admin');
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between font-medium cursor-pointer transition-colors ${
                    currentRole === 'admin'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>Phó Hiệu Trưởng (Admin)</span>
                  {currentRole === 'admin' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => {
                    onRoleChange('head_of_department');
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between font-medium cursor-pointer transition-colors ${
                    currentRole === 'head_of_department'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>Tổ Trưởng Chuyên Môn</span>
                  {currentRole === 'head_of_department' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => {
                    onRoleChange('teacher');
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between font-medium cursor-pointer transition-colors ${
                    currentRole === 'teacher'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>Giáo Viên Bộ Môn</span>
                  {currentRole === 'teacher' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. SUB-BAR: Chỉ số thống kê (101 GV, 53 Lớp, 100% Gán tiết, Định mức 100%) y hệt Screenshot */}
      <div className="bg-[#110f36] border-t border-[#231e61] px-4 sm:px-6 lg:px-8 py-1.5 text-[11px] sm:text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left stats */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap font-medium">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                Giáo viên: <strong className="text-white font-bold">101 GV</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-blue-400" />
              <span>
                Lớp học: <strong className="text-white font-bold">53 Lớp</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Tiến độ gán tiết: <strong className="text-emerald-400 font-bold">100%</strong>
              </span>
            </div>
          </div>

          {/* Right stats: TỔNG ĐỊNH MỨC + Thanh tiến độ Cyan */}
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider">
              TỔNG ĐỊNH MỨC
            </span>
            <div className="w-24 sm:w-32 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full w-full"></div>
            </div>
            <span className="text-cyan-400 font-extrabold text-xs">100%</span>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION BAR: Chuyển Tab Chức Năng & Bộ Lọc Nhanh */}
      <div className="bg-[#1a1752]/90 border-t border-[#2b2575] px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          {/* Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1">
            <button
              onClick={() => onTabChange('timetable')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'timetable'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Thời Khóa Biểu</span>
            </button>

            <button
              onClick={() => onTabChange('scheduler')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'scheduler'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-indigo-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Xếp TKB Tự Động</span>
            </button>

            <button
              onClick={() => onTabChange('pcgd')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'pcgd'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Phân Công GD</span>
            </button>

            <button
              onClick={() => onTabChange('khtn_lsdl')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'khtn_lsdl'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>KHTN &amp; LSĐL</span>
            </button>

            <button
              onClick={() => onTabChange('reports')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Báo Giảng</span>
            </button>

            <button
              onClick={() => onTabChange('constraints')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'constraints'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Ràng Buộc</span>
            </button>

            <button
              onClick={() => onTabChange('notifications')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Thông Báo</span>
              {unreadNotificationsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right side: Tools & Actions */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Quick Button Xếp TKB Tuần 3 */}
            <button
              onClick={onOpenWeek3Modal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Xếp TKB Tuần 3</span>
            </button>

            {/* Quick Button Xếp TKB Tuần 4 (PCCM Mới) */}
            <button
              onClick={() => {
                AppScheduleStorage.getInstance().generateWeek4Schedule();
                onWeekChange(4);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-lg shadow-sm transition-all cursor-pointer"
              title="Khởi tạo & Tối ưu TKB Tuần 4 theo phân công chuyên môn mới nhất (Thầy Tiến dạy 8A9, 8A10)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Xếp TKB Tuần 4 (Mới)</span>
            </button>

            {/* VietSchool import */}
            <button
              onClick={onOpenVietSchoolModal}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Nhập dữ liệu VietSchool"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>VietSchool</span>
            </button>

            {/* Export buttons */}
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-emerald-300 border border-white/20 rounded-lg font-medium transition-colors cursor-pointer"
              title="Xuất Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={triggerPrintWindow}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 rounded-lg font-medium transition-colors cursor-pointer"
              title="In / PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">In/PDF</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};


