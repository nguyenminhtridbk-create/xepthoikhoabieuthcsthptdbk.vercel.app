import React, { useState } from 'react';
import { ConstraintRule, ScheduleConflict, Teacher, Campus, ClassRoom } from '../types';
import {
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Info,
  Clock,
  Car,
  MapPin,
  Sparkles,
  Zap,
} from 'lucide-react';

interface ConstraintManagerProps {
  rules: ConstraintRule[];
  conflicts: ScheduleConflict[];
  teachers: Teacher[];
  campuses: Campus[];
  classes: ClassRoom[];
  currentWeek: number;
  onToggleRule: (ruleCode: string) => void;
}

export const ConstraintManager: React.FC<ConstraintManagerProps> = ({
  rules,
  conflicts,
  teachers,
  campuses,
  classes,
  currentWeek,
  onToggleRule,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'hard' | 'soft'>('all');

  const hardRules = rules.filter((r) => r.type === 'hard');
  const softRules = rules.filter((r) => r.type === 'soft');

  const hardConflicts = conflicts.filter((c) => c.type === 'hard_error');
  const softWarnings = conflicts.filter((c) => c.type === 'soft_warning');

  const filteredConflicts = conflicts.filter((c) => {
    if (filterType === 'hard') return c.type === 'hard_error';
    if (filterType === 'soft') return c.type === 'soft_warning';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xl border border-rose-200">
            {hardConflicts.length}
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Xung Đột Ràng Buộc Cứng
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {hardConflicts.length === 0 ? 'Tất cả hợp lệ (Không vi phạm)' : `${hardConflicts.length} lỗi cần xử lý ngay`}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl border border-amber-200">
            {softWarnings.length}
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Cảnh Báo Ràng Buộc Mềm
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {softWarnings.length} tiết trống hoặc cần tối ưu
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl border border-emerald-200">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Quy Tắc Đang Áp Dụng
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {rules.filter((r) => r.isActive).length} / {rules.length} quy tắc kích hoạt
            </div>
          </div>
        </div>
      </div>

      {/* Main Container: Split into Rules Config and Live Conflict List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Rules Config (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Hard Constraints Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-sm">RÀNG BUỘC CỨNG (Bắt buộc 100% không được vi phạm)</h3>
              </div>
              <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
                {hardRules.length} Quy tắc
              </span>
            </div>

            <div className="divide-y divide-slate-100 p-2">
              {hardRules.map((rule) => (
                <div key={rule.code} className="p-3.5 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">{rule.name}</span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                        {rule.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{rule.description}</p>

                    {rule.code === 'CAMPUS_TRAVEL_GAP' && (
                      <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-900 flex items-center gap-2">
                        <Car className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <strong>Khoảng cách 3 điểm trường:</strong> CS1 cách CS2 4.5km (~20p), CS1 cách CS3 8km (~30p). Quy tắc cấm giáo viên dạy liền kề 2 cơ sở khác nhau trong cùng một buổi sáng hoặc chiều.
                        </div>
                      </div>
                    )}
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={rule.isActive}
                      onChange={() => onToggleRule(rule.code)}
                      disabled={rule.code === 'GRADE67_OPPOSITE_SHIFT_GDTC' || rule.code === 'MINIMIZE_TEACHER_GAPS'}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-60"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Soft Constraints Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">RÀNG BUỘC MỀM (Tối ưu hóa chất lượng sư phạm & tiện ích)</h3>
              </div>
              <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
                {softRules.length} Quy tắc
              </span>
            </div>

            <div className="divide-y divide-slate-100 p-2">
              {softRules.map((rule) => (
                <div key={rule.code} className="p-3.5 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">{rule.name}</span>
                      {rule.weight && (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          Trọng số: {rule.weight}/10
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{rule.description}</p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={rule.isActive}
                      onChange={() => onToggleRule(rule.code)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Conflicts & Warnings Feed (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Bảng Cảnh Báo Trùng Lịch & Tiết Trống
                </h3>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 text-[11px] bg-slate-200/80 p-0.5 rounded-lg">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2 py-0.5 rounded ${
                    filterType === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Tất cả ({conflicts.length})
                </button>
                <button
                  onClick={() => setFilterType('hard')}
                  className={`px-2 py-0.5 rounded ${
                    filterType === 'hard' ? 'bg-white text-rose-700 font-bold shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Lỗi cứng ({hardConflicts.length})
                </button>
                <button
                  onClick={() => setFilterType('soft')}
                  className={`px-2 py-0.5 rounded ${
                    filterType === 'soft' ? 'bg-white text-amber-700 font-bold shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Tiết trống ({softWarnings.length})
                </button>
              </div>
            </div>

            {/* List of Conflicts */}
            <div className="p-4 max-h-[600px] overflow-y-auto space-y-3">
              {filteredConflicts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <div className="text-sm font-semibold text-slate-700">Không có vi phạm nào!</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Thời khóa biểu Tuần {currentWeek} hoàn toàn đáp ứng các tiêu chuẩn ràng buộc.
                  </div>
                </div>
              ) : (
                filteredConflicts.map((c) => {
                  const isHard = c.type === 'hard_error';
                  return (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-xl border text-xs transition-all ${
                        isHard
                          ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                          : 'bg-amber-50/70 border-amber-300 text-amber-950'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          {isHard ? (
                            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <span>{c.title}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isHard ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
                          }`}
                        >
                          {isHard ? 'Lỗi Cứng' : 'Gợi ý Tối ưu'}
                        </span>
                      </div>

                      <p className="text-slate-700 leading-relaxed mb-2">
                        {c.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60 text-slate-500">
                        <span>
                          Thứ {c.dayOfWeek}, Tiết {c.periodNumber}
                        </span>
                        <span className="font-mono text-[10px] bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                          {c.ruleCode}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
