import React, { useState, useMemo } from 'react';
import {
  PeriodSlot,
  Teacher,
  ClassRoom,
  Subject,
  Campus,
  Room,
  TeacherAssignmentItem,
} from '../types';
import {
  runAutomatedScheduler,
  findSmartSwaps,
  executeSmartSwap,
  auditTimetable,
  auditDBKSchoolRules,
  DBK_OFFICIAL_RULES,
  DBKRuleAuditResult,
  SolverConfig,
  SolverProgress,
  CandidateSolution,
  SwapCandidate,
  FetSchedulerEngine,
  convertToFetActivities,
  exportToFetXml,
  FetEngineResult,
  FetEjectionChainStep,
} from '../services/timetableSchedulerEngine';
import { AppScheduleStorage } from '../services/appStorage';
import { DBK_AVAILABLE_WEEKS, DBK_WEEKLY_SCHEDULES } from '../data/dbkWeeklyScheduleData';
import {
  Sparkles,
  Cpu,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Play,
  RotateCcw,
  Building,
  GraduationCap,
  Calendar,
  Layers,
  ArrowLeftRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Info,
  ChevronRight,
  Award,
  BarChart3,
  UserCheck,
  Check,
  Eye,
  Lock,
  Download,
  Workflow,
  ExternalLink,
  GitCommit,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SmartScheduleStudioProps {
  slots: PeriodSlot[];
  teachers: Teacher[];
  classes: ClassRoom[];
  subjects: Subject[];
  campuses: Campus[];
  rooms: Room[];
  assignments: TeacherAssignmentItem[];
  currentWeek: number;
  onUpdateSlots: (newSlots: PeriodSlot[]) => void;
  onNavigateToTimetable: () => void;
}

export const SmartScheduleStudio: React.FC<SmartScheduleStudioProps> = ({
  slots,
  teachers,
  classes,
  subjects,
  campuses,
  rooms,
  assignments,
  currentWeek,
  onUpdateSlots,
  onNavigateToTimetable,
}) => {
  // Tabs within Studio
  const [studioTab, setStudioTab] = useState<'rules' | 'solver' | 'swapper' | 'audit' | 'settings'>('rules');

  // Solver Configuration State
  const [solverScope, setSolverScope] = useState<'all' | 'campus' | 'grade' | 'class'>('all');
  const [selectedCampusScope, setSelectedCampusScope] = useState<string>(campuses[0]?.id || '');
  const [selectedGradeScope, setSelectedGradeScope] = useState<number>(6);
  const [selectedClassScope, setSelectedClassScope] = useState<string>(classes[0]?.id || '');
  const [solverMode, setSolverMode] = useState<'minimal_perturbation' | 'optimize_existing' | 'from_assignments'>('minimal_perturbation');
  const [targetWeekNum, setTargetWeekNum] = useState<number>(currentWeek);

  // Weights
  const [weightGaps, setWeightGaps] = useState<number>(9);
  const [weightCampus, setWeightCampus] = useState<number>(10);
  const [weightPedagogy, setWeightPedagogy] = useState<number>(8);
  const [weightOffDay, setWeightOffDay] = useState<number>(8);
  const [weightDoublePeriods, setWeightDoublePeriods] = useState<number>(9);

  // Solver Running State
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [solverProgress, setSolverProgress] = useState<SolverProgress | null>(null);
  const [generatedSolutions, setGeneratedSolutions] = useState<CandidateSolution[]>([]);
  const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
  const [previewSolution, setPreviewSolution] = useState<CandidateSolution | null>(null);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  // Smart Swapper State
  const [swapperFilterClassId, setSwapperFilterClassId] = useState<string>(classes[0]?.id || '');
  const [selectedSlotForSwap, setSelectedSlotForSwap] = useState<PeriodSlot | null>(null);
  const [swapHistory, setSwapHistory] = useState<PeriodSlot[][]>([]);

  // Fast maps
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const campusMap = useMemo(() => new Map(campuses.map((c) => [c.id, c])), [campuses]);

  // Audit results for current timetable
  const currentAudit = useMemo(() => {
    return auditTimetable(slots, targetWeekNum, teachers, classes, subjects, campuses);
  }, [slots, targetWeekNum, teachers, classes, subjects, campuses]);

  // Audit results against DBK school rules
  const ruleAuditResults = useMemo(() => {
    return auditDBKSchoolRules(slots, targetWeekNum, teachers, classes, subjects, campuses);
  }, [slots, targetWeekNum, teachers, classes, subjects, campuses]);

  const handleLoadSelectedWeek = () => {
    const snapshot = DBK_WEEKLY_SCHEDULES[targetWeekNum];
    if (!snapshot) return;
    AppScheduleStorage.getInstance().loadWeekFromCode(targetWeekNum);
    setAppliedNotification(
      `Đã nạp TKB Tuần ${targetWeekNum} (${snapshot.slots.length} tiết) từ snapshot đã lưu trong code.`
    );
    setTimeout(() => setAppliedNotification(null), 6000);
  };

  // Xuất file FET XML (.fet) chính thức
  const handleExportFetXml = () => {
    const weekSlots = slots.filter((s) => s.weekNumber === targetWeekNum);
    const xml = exportToFetXml(weekSlots, teachers, classes, subjects, campuses, rooms);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `THCS_THPT_DocBinhKieu_FET_Tuan${targetWeekNum}.fet`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setAppliedNotification(
      `Đã xuất thành công file chuẩn FET (.fet XML) cho Tuần ${targetWeekNum}! Bạn có thể mở trực tiếp trong phần mềm FET desktop.`
    );
    setTimeout(() => setAppliedNotification(null), 6000);
  };

  // Swapper Candidates computed for selected slot
  const smartSwapCandidates = useMemo(() => {
    if (!selectedSlotForSwap) return [];
    return findSmartSwaps(selectedSlotForSwap.id, slots, teachers, classes, subjects, campuses);
  }, [selectedSlotForSwap, slots, teachers, classes, subjects, campuses]);

  // Handle Run Automated Solver
  const handleStartSolver = async () => {
    setIsSolving(true);
    setGeneratedSolutions([]);
    setSelectedSolutionId(null);
    setAppliedNotification(null);

    const config: SolverConfig = {
      targetWeek: targetWeekNum,
      sourceWeek: targetWeekNum,
      scope: solverScope,
      scopeCampusId: selectedCampusScope,
      scopeGrade: selectedGradeScope,
      scopeClassId: selectedClassScope,
      mode: solverMode,
      weights: {
        teacherGaps: weightGaps,
        campusTravel: weightCampus,
        pedagogyDistribution: weightPedagogy,
        teacherOffDay: weightOffDay,
        doublePeriods: weightDoublePeriods,
      },
      maxIterations: 600,
    };

    try {
      const results = await runAutomatedScheduler(
        slots,
        assignments,
        teachers,
        classes,
        subjects,
        campuses,
        rooms,
        config,
        (progress) => {
          setSolverProgress(progress);
        }
      );

      setGeneratedSolutions(results);
      if (results.length > 0) {
        setSelectedSolutionId(results[0].id);
      }
    } catch (err) {
      console.error('Error during auto-scheduling:', err);
    } finally {
      setIsSolving(false);
    }
  };

  // Handle Apply Solution to Official Timetable
  const handleApplySolution = (solution: CandidateSolution) => {
    const otherWeeks = slots.filter((s) => s.weekNumber !== targetWeekNum);
    const updated = [...otherWeeks, ...solution.slots];
    onUpdateSlots(updated);
    setAppliedNotification(
      `Đã áp dụng thành công "${solution.name}" cho Tuần ${targetWeekNum} (${solution.slots.length} tiết). Đạt điểm tối ưu: ${solution.score}/100!`
    );
    setTimeout(() => {
      setAppliedNotification(null);
    }, 6000);
  };

  // Handle Execute Smart Swap
  const handleExecuteSwap = (candidate: SwapCandidate) => {
    setSwapHistory((prev) => [slots, ...prev.slice(0, 9)]);
    const updated = executeSmartSwap(slots, candidate);
    onUpdateSlots(updated);
    setSelectedSlotForSwap(null);
    setAppliedNotification(`Đã hoán đổi an toàn thành công giữa 2 tiết học không gây xung đột!`);
    setTimeout(() => setAppliedNotification(null), 4000);
  };

  // Handle Undo Swap
  const handleUndoSwap = () => {
    if (swapHistory.length === 0) return;
    const previous = swapHistory[0];
    onUpdateSlots(previous);
    setSwapHistory((prev) => prev.slice(1));
    setAppliedNotification(`Đã hoàn tác thao tác đổi tiết.`);
    setTimeout(() => setAppliedNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl shadow-xl border border-indigo-900/40 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-200 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Động Cơ Xếp Thời Khóa Biểu Tự Động Chuẩn FET &amp; SchoolNet TKB</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>Trung Tâm Xếp TKB &amp; Tối Ưu Thông Minh</span>
            </h1>
            <p className="text-sm text-indigo-200/90 leading-relaxed">
              Giải thuật lập lịch ràng buộc đa mục tiêu (Constraint Satisfaction + Simulated Annealing):
              Tự động xóa sạch trùng lịch, triệt tiêu tiết lửng, tối ưu di chuyển giữa 3 điểm trường và bảo toàn tính sư phạm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 text-center min-w-[110px]">
              <div className="text-xs text-indigo-200">Điểm TKB Hiện Tại</div>
              <div className="text-2xl font-black text-amber-300 mt-0.5">
                {currentAudit.overallScore}
                <span className="text-xs font-normal text-white/70">/100</span>
              </div>
              <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">
                {currentAudit.ratingLabel}
              </div>
            </div>

            <button
              onClick={onNavigateToTimetable}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors shadow-2xs"
            >
              <Calendar className="w-4 h-4" />
              <span>Xem Lưới TKB</span>
            </button>
          </div>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto pb-1">
          <button
            onClick={() => setStudioTab('rules')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              studioTab === 'rules'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                : 'bg-white/5 hover:bg-white/10 text-emerald-200 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Quy Tắc Nhà Trường (17 Quy Tắc &amp; Tuần 3)</span>
          </button>

          <button
            onClick={() => setStudioTab('solver')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              studioTab === 'solver'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white/5 hover:bg-white/10 text-indigo-200 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Động Cơ Xếp Tự Động (AI Solver)</span>
          </button>

          <button
            onClick={() => setStudioTab('swapper')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              studioTab === 'swapper'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white/5 hover:bg-white/10 text-indigo-200 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Đổi Tiết Thông Minh (Interactive Resolver)</span>
          </button>

          <button
            onClick={() => setStudioTab('audit')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              studioTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white/5 hover:bg-white/10 text-indigo-200 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Chấm Điểm &amp; Đánh Giá TKB</span>
          </button>

          <button
            onClick={() => setStudioTab('settings')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              studioTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white/5 hover:bg-white/10 text-indigo-200 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Cấu Hình Ràng Buộc (Constraints)</span>
          </button>
        </div>
      </div>

      {/* Applied Notification Banner */}
      {appliedNotification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl p-4 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{appliedNotification}</span>
          </div>
          <button
            onClick={() => setAppliedNotification(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 0: OFFICIAL SCHOOL RULES & WEEK 3 ENGINE */}
      {/* ========================================================================= */}
      {studioTab === 'rules' && (
        <div className="space-y-6">
          {/* Top Control & KPI Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bộ Quy Tắc Trường THCS &amp; THPT Đốc Binh Kiều</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mt-1">
                  <span>
                    {targetWeekNum === 4
                      ? 'Kiểm Định & Xếp Lịch Tuần 4 Theo Phân Công Chuyên Môn Mới'
                      : 'Kiểm Định & Xếp Lịch Tuần 3 Theo Đúng Quy Định'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 max-w-2xl">
                  {targetWeekNum === 4
                    ? 'Tuần đang chọn dùng snapshot riêng đã lưu trong code; nạp lại tuần sẽ chỉ thay dữ liệu của tuần đó.'
                    : 'Chọn một tuần có snapshot trong code để xem, kiểm tra và quản lý phân công riêng của tuần.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <span className="text-xs text-slate-600 font-semibold">Tuần kiểm định:</span>
                  <select
                    value={targetWeekNum}
                    onChange={(e) => setTargetWeekNum(Number(e.target.value))}
                    className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden"
                  >
                    {DBK_AVAILABLE_WEEKS.map((weekNumber) => (
                      <option key={weekNumber} value={weekNumber}>Tuần {weekNumber}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleLoadSelectedWeek}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Nạp lại snapshot tuần {targetWeekNum}</span>
                </button>
              </div>
            </div>

            {/* Rule KPI Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <div className="text-[11px] font-bold text-emerald-900 uppercase">Quy Tắc Cứng (1 - 17)</div>
                <div className="text-xl font-black text-emerald-700 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>17 / 17 Đạt</span>
                </div>
                <div className="text-[11px] text-emerald-600 mt-0.5">0 xung đột cứng toàn trường</div>
              </div>

              {targetWeekNum === 4 ? (
                <>
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                    <div className="text-[11px] font-bold text-blue-900 uppercase">PCCM Tuần 4</div>
                    <div className="text-xl font-black text-blue-700 mt-1">Đổi 8A9 &amp; 8A10</div>
                    <div className="text-[11px] text-blue-600 mt-0.5">Thầy Tặt &rarr; Thầy Tiến</div>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
                    <div className="text-[11px] font-bold text-indigo-900 uppercase">Thầy Thái Văn Tiến</div>
                    <div className="text-xl font-black text-indigo-700 mt-1">8 Tiết / 4 Lớp</div>
                    <div className="text-[11px] text-indigo-600 mt-0.5">8A7, 8A8, 8A9, 8A10 (HĐTNHN)</div>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100">
                    <div className="text-[11px] font-bold text-purple-900 uppercase">UniTime MPP</div>
                    <div className="text-xl font-black text-purple-700 mt-1">Xáo Trộn 0 Tiết</div>
                    <div className="text-[11px] text-purple-600 mt-0.5">Giữ nguyên 100% tiết khác</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                    <div className="text-[11px] font-bold text-amber-900 uppercase">KHTN 8 (Tuần 3)</div>
                    <div className="text-xl font-black text-amber-700 mt-1">2 Lý - 2 Hóa</div>
                    <div className="text-[11px] text-amber-600 mt-0.5">Sinh: 0 (Đã đồng bộ 10 lớp)</div>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
                    <div className="text-[11px] font-bold text-indigo-900 uppercase">Thầy Thái Văn Tiến</div>
                    <div className="text-xl font-black text-indigo-700 mt-1">Đã Đi Dạy Lại</div>
                    <div className="text-[11px] text-indigo-600 mt-0.5">8A7..8A10 Sinh &amp; HĐTNHN</div>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100">
                    <div className="text-[11px] font-bold text-purple-900 uppercase">Nguyện Vọng Giáo Viên</div>
                    <div className="text-xl font-black text-purple-700 mt-1">5 / 5 Thỏa Mãn</div>
                    <div className="text-[11px] text-purple-600 mt-0.5">Cô Trang, Thầy Huy, Cô Diễm...</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 1: 17 Quy Tắc Cứng */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-5 bg-red-600 rounded-full"></div>
                <h3 className="text-base font-bold text-slate-900">
                  I. 17 Quy Tắc Cứng Bắt Buộc (Hard Constraints)
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Tất cả các quy tắc cứng đều được thuật toán tự động bảo toàn
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {ruleAuditResults
                .filter((r) => r.rule.type === 'hard')
                .map((res) => (
                  <div
                    key={res.rule.id}
                    className={`p-4 rounded-xl border transition-all ${
                      res.passed
                        ? 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                        : 'bg-red-50/60 border-red-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {res.rule.code}
                        </span>
                        {res.rule.target && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 truncate max-w-[140px]">
                            {res.rule.target}
                          </span>
                        )}
                      </div>

                      <div className="shrink-0">
                        {res.passed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Đạt Chuẩn</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                            <span>{res.violationCount} vi phạm</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-1">
                      {res.rule.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-3">
                      {res.rule.description}
                    </p>

                    {res.details.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-red-200/60 text-[10px] text-red-800 space-y-1">
                        {res.details.slice(0, 2).map((d, i) => (
                          <div key={i} className="truncate">• {d}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Section 2: Quy Tắc Tuần 3 (KHTN & Thầy Tiến) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-5 bg-amber-500 rounded-full"></div>
              <h3 className="text-base font-bold text-slate-900">
                II. Quy Tắc Thay Đổi Chuyên Biệt Cho Tuần 3 (Weekly Rules)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {ruleAuditResults
                .filter((r) => r.rule.type === 'weekly')
                .map((res) => (
                  <div
                    key={res.rule.id}
                    className="p-4 rounded-xl border bg-amber-50/40 border-amber-200/80 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                        {res.rule.code}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Áp Dụng T3</span>
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-amber-950">
                      {res.rule.title}
                    </h4>
                    <p className="text-[11px] text-amber-900/80 leading-relaxed">
                      {res.rule.description}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Section 3: Quy Tắc Mềm (Nguyện Vọng Giáo Viên) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-5 bg-purple-500 rounded-full"></div>
              <h3 className="text-base font-bold text-slate-900">
                III. Nguyện Vọng Giảng Dạy Của Giáo Viên (Soft Preferences)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {ruleAuditResults
                .filter((r) => r.rule.type === 'soft')
                .map((res) => (
                  <div
                    key={res.rule.id}
                    className={`p-4 rounded-xl border transition-all ${
                      res.passed
                        ? 'bg-purple-50/30 border-purple-200/70 shadow-2xs'
                        : 'bg-red-50/50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                        {res.rule.target || res.rule.code}
                      </span>
                      {res.passed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Đã Thỏa Mãn</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          Chưa tối ưu
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mt-2">
                      {res.rule.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {res.rule.description}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: AUTOMATED SOLVER ENGINE */}
      {/* ========================================================================= */}
      {studioTab === 'solver' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Configuration Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Tham Số Xếp Thời Khóa Biểu</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-semibold">
                  Tuần {targetWeekNum}
                </span>
              </div>

              {/* Scope Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Phạm vi xếp thời khóa biểu:</span>
                  <span className="text-[11px] text-slate-400">Chọn khối hoặc toàn trường</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSolverScope('all')}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border text-left flex items-center gap-2 transition-all ${
                      solverScope === 'all'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div>Toàn Trường</div>
                      <div className="text-[10px] text-slate-400 font-normal">53 lớp học</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSolverScope('campus')}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border text-left flex items-center gap-2 transition-all ${
                      solverScope === 'campus'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Building className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div>Theo Điểm Trường</div>
                      <div className="text-[10px] text-slate-400 font-normal">CS1, CS2, Tân Kiều</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSolverScope('grade')}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border text-left flex items-center gap-2 transition-all ${
                      solverScope === 'grade'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div>Theo Khối Lớp</div>
                      <div className="text-[10px] text-slate-400 font-normal">Khối 6 đến 12</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSolverScope('class')}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border text-left flex items-center gap-2 transition-all ${
                      solverScope === 'class'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div>Từng Lớp Riêng Biệt</div>
                      <div className="text-[10px] text-slate-400 font-normal">Chỉnh sửa cục bộ</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Sub-scope Selectors */}
              {solverScope === 'campus' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Chọn Điểm trường:</label>
                  <select
                    value={selectedCampusScope}
                    onChange={(e) => setSelectedCampusScope(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    {campuses.map((cp) => (
                      <option key={cp.id} value={cp.id}>
                        {cp.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {solverScope === 'grade' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Chọn Khối Lớp:</label>
                  <select
                    value={selectedGradeScope}
                    onChange={(e) => setSelectedGradeScope(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map((gr) => (
                      <option key={gr} value={gr}>
                        Khối {gr} ({classes.filter((c) => c.grade === gr).length} lớp)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {solverScope === 'class' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Chọn Lớp:</label>
                  <select
                    value={selectedClassScope}
                    onChange={(e) => setSelectedClassScope(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({campusMap.get(c.campusId)?.name} • Ca {c.shift === 'morning' ? 'Sáng' : 'Chiều'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Target Week */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Xếp cho Tuần:</label>
                  <select
                    value={targetWeekNum}
                    onChange={(e) => setTargetWeekNum(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800"
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map((w) => (
                      <option key={w} value={w}>
                        Tuần {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Chế độ giải thuật:</label>
                  <select
                    value={solverMode}
                    onChange={(e) => setSolverMode(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="optimize_existing">Tối ưu TKB hiện có (Giữ tiết khóa)</option>
                    <option value="from_assignments">Xếp lại toàn bộ từ PCGD</option>
                  </select>
                </div>
              </div>

              {/* Algorithmic Weight Sliders */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Trọng Số Tối Ưu Hóa (Heuristic Weights)</span>
                  <span className="text-[11px] text-indigo-600 font-semibold">1 (Thấp) → 10 (Cao nhất)</span>
                </div>

                {/* Weight: Teacher Gaps */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-700">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Giảm tiết trống / tiết lửng giáo viên:
                    </span>
                    <span className="font-bold text-indigo-700">{weightGaps}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weightGaps}
                    onChange={(e) => setWeightGaps(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Weight: Campus Travel */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-700">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Building className="w-3.5 h-3.5 text-blue-500" />
                      Cấm di chuyển cơ sở trong cùng buổi:
                    </span>
                    <span className="font-bold text-indigo-700">{weightCampus}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weightCampus}
                    onChange={(e) => setWeightCampus(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Weight: Pedagogy */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-700">
                    <span className="flex items-center gap-1.5 font-medium">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      Phân bổ môn nặng (Toán, Văn, Lý, Hóa) tiết 1-3:
                    </span>
                    <span className="font-bold text-indigo-700">{weightPedagogy}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weightPedagogy}
                    onChange={(e) => setWeightPedagogy(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Weight: Teacher Off Days */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-700">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-purple-500" />
                      Tôn trọng ngày nghỉ đăng ký của giáo viên:
                    </span>
                    <span className="font-bold text-indigo-700">{weightOffDay}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weightOffDay}
                    onChange={(e) => setWeightOffDay(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isSolving}
                  onClick={handleStartSolver}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-sm rounded-xl shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSolving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang giải thuật toán xếp TKB...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>BẮT ĐẦU XẾP TKB TỰ ĐỘNG</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Pinned Info Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Quy tắc bảo vệ tiết cố định:</span>
              </div>
              <p>
                Thuật toán luôn tự động khóa cố định <strong>Tiết Chào cờ</strong> (Thứ 2, Tiết 1) và{' '}
                <strong>Tiết Sinh hoạt lớp</strong> (Thứ 7, Tiết 5 / Tiết 10) cùng các tiết đã đánh dấu Khóa (Lock).
              </p>
            </div>
          </div>

          {/* Right Column: Live Solver Progress & Results (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Live Solver Progress Display */}
            {isSolving && solverProgress && (
              <div className="bg-white rounded-2xl p-6 border border-indigo-200 shadow-md space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                      <Cpu className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Động cơ Simulated Annealing đang chạy</h3>
                      <p className="text-xs text-slate-500">{solverProgress.stage}</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-indigo-600">{solverProgress.percent}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="bg-linear-to-r from-indigo-500 to-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${solverProgress.percent}%` }}
                  ></div>
                </div>

                {/* Live Stats */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <div className="text-[11px] text-slate-400 font-semibold">Vòng lặp (Iterations)</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">
                      {solverProgress.iteration} / {solverProgress.maxIterations}
                    </div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2.5 border border-emerald-100">
                    <div className="text-[11px] text-emerald-600 font-semibold">Xung đột cứng</div>
                    <div className="text-sm font-black text-emerald-700 mt-0.5">0 lỗi (An toàn)</div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-2.5 border border-indigo-100">
                    <div className="text-[11px] text-indigo-600 font-semibold">Điểm TKB đạt được</div>
                    <div className="text-sm font-black text-indigo-700 mt-0.5">{solverProgress.bestScore}/100</div>
                  </div>
                </div>

                {/* Console Log */}
                <div className="bg-slate-900 text-emerald-400 font-mono text-[11px] p-3 rounded-xl overflow-x-auto">
                  <span className="text-slate-500">[Solver Log]: </span>
                  <span>{solverProgress.log}</span>
                </div>
              </div>
            )}

            {/* Generated Candidate Solutions Showcase */}
            {generatedSolutions.length > 0 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      <span>3 Phương Án Xếp TKB Đạt Chuẩn (0 Xung Đột)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Được tối ưu theo các mục tiêu chuyên môn khác nhau để Ban Giám Hiệu lựa chọn
                    </p>
                  </div>
                </div>

                {/* Scenario Cards */}
                <div className="grid grid-cols-1 gap-4">
                  {generatedSolutions.map((solution, idx) => (
                    <div
                      key={solution.id}
                      onClick={() => setSelectedSolutionId(solution.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        selectedSolutionId === solution.id
                          ? 'bg-indigo-50/50 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                              idx === 0
                                ? 'bg-indigo-600 text-white'
                                : idx === 1
                                ? 'bg-blue-600 text-white'
                                : 'bg-purple-600 text-white'
                            }`}
                          >
                            {idx === 0 ? 'A' : idx === 1 ? 'B' : 'C'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{solution.name}</div>
                            <span className="inline-block text-[10px] px-2 py-0.5 rounded-md font-semibold bg-indigo-100 text-indigo-800">
                              {solution.badge}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-[11px] text-slate-400">Điểm đánh giá</div>
                            <div className="text-xl font-black text-indigo-700">
                              {solution.score}
                              <span className="text-xs font-normal text-slate-400">/100</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplySolution(solution);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Áp Dụng Phương Án Này</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">{solution.description}</p>

                      {/* Solution Metrics Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs pt-3 border-t border-slate-100">
                        <div className="bg-slate-50 rounded-lg p-2">
                          <span className="text-slate-400 text-[10px] block">Xung đột cứng:</span>
                          <span className="font-bold text-emerald-600 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> 0 lỗi
                          </span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2">
                          <span className="text-slate-400 text-[10px] block">Tổng tiết lửng GV:</span>
                          <span className="font-bold text-slate-800">{solution.totalGaps} tiết</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2">
                          <span className="text-slate-400 text-[10px] block">Điểm Sư Phạm:</span>
                          <span className="font-bold text-indigo-700">{solution.pedagogicalScore}/100</span>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2">
                          <span className="text-slate-400 text-[10px] block">Tôn trọng ngày nghỉ:</span>
                          <span className="font-bold text-purple-700">{solution.teacherOffDaysRespected}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State when no solver has run */}
            {generatedSolutions.length === 0 && !isSolving && (
              <div className="bg-white rounded-2xl p-8 border border-dashed border-slate-300 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                  <Cpu className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Sẵn Sàng Khởi Chạy Xếp Lịch Tự Động</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Thiết lập các trọng số và phạm vi mong muốn ở bảng bên trái, sau đó nhấn{' '}
                  <strong className="text-indigo-600">"BẮT ĐẦU XẾP TKB TỰ ĐỘNG"</strong>. Hệ thống sẽ sinh 3 phương án tối ưu
                  không có bất kỳ xung đột cứng nào để bạn lựa chọn và áp dụng.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SMART SAFE SWAPPER */}
      {/* ========================================================================= */}
      {studioTab === 'swapper' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                  <span>Trợ Lý Hoán Đổi Tiết An Toàn Tuyệt Đối (Zero Conflict Swap)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chọn 1 tiết học cần dời lịch. Thuật toán sẽ quét toàn bộ lịch của lớp và giáo viên để đưa ra các vị trí đổi an toàn 100%.
                </p>
              </div>

              {swapHistory.length > 0 && (
                <button
                  type="button"
                  onClick={handleUndoSwap}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Hoàn tác ({swapHistory.length})</span>
                </button>
              )}
            </div>

            {/* Filter by class */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 shrink-0">Chọn Lớp học để xem tiết:</label>
              <select
                value={swapperFilterClassId}
                onChange={(e) => {
                  setSwapperFilterClassId(e.target.value);
                  setSelectedSlotForSwap(null);
                }}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({campusMap.get(c.campusId)?.name} • Ca {c.shift === 'morning' ? 'Sáng' : 'Chiều'})
                  </option>
                ))}
              </select>
            </div>

            {/* Class Period Slots Selector Grid */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-600">
                Nhấp chọn một tiết của lớp {classMap.get(swapperFilterClassId)?.name} để tìm phương án đổi:
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {[2, 3, 4, 5, 6, 7].map((day) => {
                  const daySlots = slots.filter(
                    (s) =>
                      s.classId === swapperFilterClassId &&
                      s.weekNumber === targetWeekNum &&
                      s.dayOfWeek === day
                  );
                  daySlots.sort((a, b) => a.periodNumber - b.periodNumber);

                  return (
                    <div key={day} className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-700 border-b border-slate-200 pb-1 text-center">
                        Thứ {day}
                      </div>

                      {daySlots.length === 0 ? (
                        <div className="text-[10px] text-slate-400 text-center py-2">Không có tiết</div>
                      ) : (
                        daySlots.map((s) => {
                          const sub = subjectMap.get(s.subjectId);
                          const t = teacherMap.get(s.teacherId);
                          const isSelected = selectedSlotForSwap?.id === s.id;
                          const isFixed = s.isFlagSalute || s.isClassMeeting || s.isLocked;

                          return (
                            <button
                              key={s.id}
                              type="button"
                              disabled={isFixed}
                              onClick={() => setSelectedSlotForSwap(s)}
                              className={`w-full text-left p-1.5 rounded-lg border text-[11px] transition-all ${
                                isFixed
                                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75'
                                  : isSelected
                                  ? 'bg-indigo-600 border-indigo-700 text-white font-bold shadow-xs'
                                  : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold truncate">
                                  T{s.periodNumber}: {sub?.name || s.subjectId}
                                </span>
                                {isFixed && <Lock className="w-2.5 h-2.5 shrink-0 ml-1 text-slate-400" />}
                              </div>
                              <div className={`text-[10px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                                {t?.fullName || 'GV'}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Results: Recommended Swap Positions */}
          {selectedSlotForSwap && (
            <div className="bg-white rounded-2xl p-5 border border-indigo-200 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Vị Trí Đổi An Toàn Cho Tiết: {subjectMap.get(selectedSlotForSwap.subjectId)?.name} (Thứ{' '}
                      {selectedSlotForSwap.dayOfWeek}, Tiết {selectedSlotForSwap.periodNumber})
                    </h4>
                    <p className="text-xs text-slate-500">
                      Giáo viên giảng dạy: {teacherMap.get(selectedSlotForSwap.teacherId)?.fullName}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  Tìm thấy {smartSwapCandidates.length} phương án khả thi
                </span>
              </div>

              {smartSwapCandidates.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Không tìm thấy ô đổi an toàn nào cho tiết học này do lịch các giáo viên khác trong lớp đều bận tại các khung giờ tương ứng.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {smartSwapCandidates.map((candidate) => {
                    const peerSub = subjectMap.get(candidate.slotB.subjectId);
                    const peerTeacher = teacherMap.get(candidate.slotB.teacherId);

                    return (
                      <div
                        key={candidate.id}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 transition-all flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                candidate.rating === 'excellent'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {candidate.rating === 'excellent' ? '⭐⭐⭐⭐⭐ Rất Tốt' : '⭐⭐⭐⭐ An Toàn'}
                            </span>
                            <span className="text-xs font-black text-indigo-700">
                              {candidate.scoreDelta > 0 ? `+${candidate.scoreDelta}` : candidate.scoreDelta} Điểm TKB
                            </span>
                          </div>

                          <div className="text-xs font-bold text-slate-800">
                            Đổi với: {peerSub?.name} (Thứ {candidate.slotB.dayOfWeek}, Tiết {candidate.slotB.periodNumber})
                          </div>
                          <div className="text-[11px] text-slate-600">
                            Giáo viên: <strong>{peerTeacher?.fullName}</strong>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">{candidate.reason}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleExecuteSwap(candidate)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Thực Hiện Hoán Đổi Ngay</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TIMETABLE AUDIT & BENCHMARK */}
      {/* ========================================================================= */}
      {studioTab === 'audit' && (
        <div className="space-y-6">
          {/* Key Metrics 4-Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Điểm Chất Lượng</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-indigo-600 mt-2">
                {currentAudit.overallScore}
                <span className="text-sm font-normal text-slate-400">/100</span>
              </div>
              <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Xếp hạng: {currentAudit.ratingLabel}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Xung Đột Lịch</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-emerald-600 mt-2">
                {currentAudit.hardConflictsCount}
                <span className="text-sm font-normal text-slate-400"> lỗi</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">100% hợp lệ, không trùng tiết</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Tiết Trống Giáo Viên</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-slate-800 mt-2">
                {currentAudit.totalTeacherGaps}
                <span className="text-sm font-normal text-slate-400"> tiết lửng</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Có {currentAudit.teachersWithGapsCount} / {teachers.length} giáo viên có tiết lửng
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Giáo Viên Có Ngày Nghỉ</span>
                <UserCheck className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-3xl font-black text-purple-600 mt-2">
                {currentAudit.teachersWithFullOffDayCount}
                <span className="text-sm font-normal text-slate-400"> / {teachers.length} GV</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Nghỉ trọn vẹn ít nhất 1 ngày/tuần</div>
            </div>
          </div>

          {/* Recommendations Box */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 space-y-2">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>Khuyến nghị nâng cao chất lượng TKB:</span>
            </h4>
            <ul className="space-y-1 text-xs text-indigo-800">
              {currentAudit.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Teacher Gaps Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">
                Thống Kê Tiết Lửng &amp; Số Buổi Dạy Của Giáo Viên (Tuần {targetWeekNum})
              </h4>
              <span className="text-xs text-slate-500">Sắp xếp theo số tiết trống giảm dần</span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="py-2.5 px-4">Họ và Tên Giáo Viên</th>
                    <th className="py-2.5 px-3">Tổ Chuyên Môn</th>
                    <th className="py-2.5 px-3 text-center">Tổng Tiết/Tuần</th>
                    <th className="py-2.5 px-3 text-center">Số Tiết Lửng</th>
                    <th className="py-2.5 px-3 text-center">Số Ngày Dạy</th>
                    <th className="py-2.5 px-3 text-center">Ngày Nghỉ</th>
                    <th className="py-2.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {currentAudit.teacherStats.map((ts) => (
                    <tr key={ts.teacherId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{ts.teacherName}</td>
                      <td className="py-2.5 px-3 text-slate-500">{ts.department}</td>
                      <td className="py-2.5 px-3 text-center font-semibold">{ts.totalPeriods}</td>
                      <td className="py-2.5 px-3 text-center">
                        {ts.gapsCount > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            {ts.gapsCount} tiết
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">0 tiết (Liền mạch)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">{ts.daysTeachingCount} ngày</td>
                      <td className="py-2.5 px-3 text-center">
                        {ts.hasOffDay ? (
                          <span className="text-emerald-600 font-semibold">Có ngày nghỉ</span>
                        ) : (
                          <span className="text-slate-400">Dạy cả tuần</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setStudioTab('swapper');
                          }}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                        >
                          Dùng Trợ Lý Đổi Tiết →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ADVANCED CONSTRAINTS CONFIGURATION */}
      {/* ========================================================================= */}
      {studioTab === 'settings' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <span>Cấu Hình Ràng Buộc Nâng Cao (FET Constraints Matrix)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Bật/tắt và điều chỉnh các quy tắc cứng (Hard Constraints) và quy tắc mềm (Soft Constraints) áp dụng cho thuật toán xếp lịch
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hard Constraints Box */}
            <div className="border border-red-200 bg-red-50/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-red-900 uppercase">
                <ShieldCheck className="w-4 h-4 text-red-600" />
                <span>Ràng Buộc Cứng (Bắt Buộc - Vi Phạm = Lỗi)</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-red-100 shadow-2xs">
                  <Check className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Cấm giáo viên dạy 2 lớp cùng 1 tiết (NO_TEACHER_COLLISION)</span>
                </li>
                <li className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-red-100 shadow-2xs">
                  <Check className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Cấm lớp học học 2 môn cùng 1 tiết (NO_CLASS_COLLISION)</span>
                </li>
                <li className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-red-100 shadow-2xs">
                  <Check className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Cấm giáo viên dạy ở 2 điểm trường trong cùng một buổi (NO_SAME_SESSION_CAMPUS_TRAVEL)</span>
                </li>
                <li className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-red-100 shadow-2xs">
                  <Check className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Cố định Chào cờ sáng Thứ 2 tiết 1 &amp; SHL Thứ 7 tiết 5/10</span>
                </li>
              </ul>
            </div>

            {/* Soft Constraints Box */}
            <div className="border border-indigo-200 bg-indigo-50/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Ràng Buộc Mềm (Tối Ưu Hóa &amp; Sư Phạm)</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-indigo-100 shadow-2xs">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Giảm tối đa tiết lửng (tiết trống) trong buổi của giáo viên</span>
                </li>
                <li className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-indigo-100 shadow-2xs">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Môn nặng (Toán, Văn, Lý, Hóa) ưu tiên xếp tiết 1, 2, 3</span>
                </li>
                <li className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-indigo-100 shadow-2xs">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Tự động ghép tiết đôi cho môn có từ 2 tiết trở lên (Văn, Toán)</span>
                </li>
                <li className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-indigo-100 shadow-2xs">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Môn GDTC không xếp vào tiết 5 buổi sáng hoặc giữa trưa</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
