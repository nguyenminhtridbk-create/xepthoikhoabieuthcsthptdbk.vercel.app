import React, { useState } from 'react';
import { Week3GenerationOptions } from '../types';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Building,
  Layers,
  X,
  Clock,
} from 'lucide-react';

interface Week3SchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (options: Week3GenerationOptions) => void;
}

export const Week3SchedulerModal: React.FC<Week3SchedulerModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
}) => {
  const [options, setOptions] = useState<Week3GenerationOptions>({
    inheritFromWeek: 2,
    targetWeek: 3,
    optimizeTeacherGaps: true,
    enforceCampusTravelGap: true,
    rotateKHTNSubjects: false,
    keepFixedSlots: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      onGenerate(options);
      setIsGenerating(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-indigo-700 to-blue-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Khởi Tạo & Tối Ưu TKB Tuần 3</h2>
              <p className="text-xs text-indigo-100 mt-0.5">
                Kế thừa từ TKB Tuần 2 đã chuẩn hóa • Giữ nguyên Phân công chuyên môn
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Inherit Flow Indicator */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white border border-indigo-200 rounded-lg shadow-2xs">
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-xs text-indigo-900 font-bold">Tuần nguồn: Tuần 2</div>
                <div className="text-[11px] text-indigo-700">53 lớp • 101 giáo viên đã duyệt</div>
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-indigo-400" />

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-lg shadow-2xs">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs text-indigo-900 font-bold">Mục tiêu: Tuần 3</div>
                <div className="text-[11px] text-indigo-700">Tự động khởi tạo & tối ưu</div>
              </div>
            </div>
          </div>

          {/* Options Checklist */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Bộ quy tắc áp dụng cho Tuần 3:</span>
              <span className="text-[11px] font-normal text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                17 quy tắc cứng + Quy tắc Tuần 3
              </span>
            </div>

            {/* Quy tắc Tuần 3 KHTN & Thầy Tiến */}
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Quy tắc thay đổi riêng cho Tuần 3 (Bắt buộc)</span>
              </div>
              <ul className="text-[11px] text-amber-800 mt-1.5 space-y-1 list-disc list-inside">
                <li><strong>KHTN 8:</strong> 2 tiết Vật lí + 2 tiết Hóa học (chuyển 1 tiết Lý sang Hóa).</li>
                <li><strong>Thầy Thái Văn Tiến:</strong> Nghỉ học Trung cấp, trực tiếp dạy lại Sinh học 8A7-8A10 và HĐTNHN 8A7, 8A8.</li>
                <li><strong>LS&ĐL:</strong> 2 tiết Lịch sử + 1 tiết Địa lí.</li>
              </ul>
            </div>

            {/* Option 1: Keep Fixed Slots */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={options.keepFixedSlots}
                onChange={(e) => setOptions({ ...options, keepFixedSlots: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tuân thủ 17 quy tắc cứng của Trường THCS &amp; THPT Đốc Binh Kiều</span>
                </div>
                <div className="text-slate-500 mt-0.5">
                  Thứ 5 có 2-3 tiết; Khối 8-12 học sáng; Khối 6-7 học chiều; HĐTNHN Tân Kiều và GDTC ĐBK học trái buổi; Ngữ Văn tiết đôi; Thầy Bền (2 buổi TK); Thầy Anh Văn &amp; Cô Mỹ Quốc (1 buổi ĐBK); Thầy Sơn &amp; Thầy Ẩn không đổi cơ sở trong 1 buổi; Thầy Tòng tiết đôi cuối buổi; Cô Vân Nhi không dạy T7/T2; Cô Kim Hà không dạy T1; Nghỉ trưa không dạy P5 sáng đến P1-2 chiều.
                </div>
              </div>
            </label>

            {/* Option 2: Soft Rules */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={options.optimizeTeacherGaps}
                onChange={(e) => setOptions({ ...options, optimizeTeacherGaps: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
              />
              <div className="text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Đáp ứng nguyện vọng mềm của giáo viên &amp; Giảm tiết lửng</span>
                </div>
                <div className="text-slate-500 mt-0.5">
                  Cô Bé Trang không dạy Thứ 5; Thầy Quốc Huy không dạy chiều T7; Cô Ngọc Diễm không dạy sáng T7; Cô Đinh Thị Giàu không dạy tiết 5; Gom gọn tiết cho Cô Lụa (không có tiết lửng).
                </div>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              {isGenerating ? (
                <span>Đang xử lý thuật toán...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Khởi Tạo &amp; Mở TKB Tuần 3</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
