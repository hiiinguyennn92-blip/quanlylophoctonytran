import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  CheckSquare,
  AlertTriangle,
  ListTodo,
  Trophy,
  Cake,
  Calendar,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Heart,
  ChevronRight,
  X,
  Phone,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  UserX,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { isBirthdayToday } from '../../utils/dateUtils';
import { Task, AttentionSignal, Student, ParentContact } from '../../types';

type DrillDownTarget =
  | { type: 'students_summary' }
  | { type: 'attendance_today'; initialFilter?: 'all' | 'excused_absence' | 'unexcused_absence' | 'late' | 'present' }
  | { type: 'attendance_date'; date: string; dayName: string; label: string }
  | { type: 'task_detail'; task: Task }
  | { type: 'attention_all' }
  | { type: 'attention_signal'; signal: AttentionSignal }
  | { type: 'competition_group'; groupName: string; score: number };

export const DashboardView: React.FC = () => {
  const {
    activeClass,
    students,
    parents,
    attendanceRecords,
    tasks,
    taskCompletions,
    competitionEntries,
    classEvents,
    attentionSignals,
    setActiveTab,
    setSelectedStudentForDetail,
    seedDemoClass,
  } = useApp();

  const [drillDown, setDrillDown] = useState<DrillDownTarget | null>(null);
  const [attFilter, setAttFilter] = useState<'all' | 'excused_absence' | 'unexcused_absence' | 'late' | 'present'>('all');
  const [stuGroupFilter, setStuGroupFilter] = useState<string>('all');

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const currentHour = new Date().getHours();
  const timeGreeting =
    currentHour < 11
      ? 'Chúc Thầy/Cô một buổi sáng giảng dạy tràn đầy năng lượng!'
      : currentHour < 14
      ? 'Chúc Thầy/Cô buổi trưa nhiều niềm vui và an lành!'
      : currentHour < 18
      ? 'Chúc Thầy/Cô buổi chiều làm việc hiệu quả và thảnh thơi!'
      : 'Chúc Thầy/Cô buổi tối nghỉ ngơi ấm áp bên gia đình!';

  const parentMap = React.useMemo(() => {
    const map = new Map<string, ParentContact>();
    parents.forEach((p) => {
      if (p.primary || !map.has(p.studentId)) {
        map.set(p.studentId, p);
      }
    });
    return map;
  }, [parents]);

  const studentMap = React.useMemo(() => {
    return new Map(students.map((s) => [s.id, s]));
  }, [students]);

  // Student demographics
  const maleCount = React.useMemo(() => students.filter((s) => s.gender === 'nam').length, [students]);
  const femaleCount = React.useMemo(() => students.filter((s) => s.gender === 'nữ').length, [students]);

  // Today attendance numbers
  const todayAttendance = React.useMemo(() => {
    const records = attendanceRecords.filter((r) => r.date === todayStr);
    const present = records.filter((r) => r.status === 'present').length;
    const excused = records.filter((r) => r.status === 'excused_absence').length;
    const unexcused = records.filter((r) => r.status === 'unexcused_absence').length;
    const late = records.filter((r) => r.status === 'late').length;
    const recordedTotal = records.length;
    return { present, excused, unexcused, late, recordedTotal };
  }, [attendanceRecords, todayStr]);

  // Tasks due today or upcoming
  const todayTasks = React.useMemo(() => {
    return tasks.filter((t) => t.dueAt >= todayStr).slice(0, 3);
  }, [tasks, todayStr]);

  // Group Competition scores
  const groupScores = React.useMemo(() => {
    const scores: Record<string, number> = {
      'Tổ 1': 0,
      'Tổ 2': 0,
      'Tổ 3': 0,
      'Tổ 4': 0,
    };
    competitionEntries.forEach((e) => {
      if (e.groupId && scores[e.groupId] !== undefined) {
        scores[e.groupId] += e.pointDelta;
      }
    });
    return Object.entries(scores)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score);
  }, [competitionEntries]);

  // Today birthdays
  const birthdayStudents = React.useMemo(() => {
    return students.filter((s) => isBirthdayToday(s.dob));
  }, [students]);

  // 7-day attendance history with weekdays
  const weekAttendanceTrend = React.useMemo(() => {
    const days = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    for (let i = 6; i >= 0; i--) {
      const targetDate = subDays(new Date(), i);
      const dStr = format(targetDate, 'yyyy-MM-dd');
      const dayRecs = attendanceRecords.filter((r) => r.date === dStr);
      const pres = dayRecs.filter((r) => r.status === 'present').length;
      const tot = students.length || 1;
      const pct = dayRecs.length > 0 ? Math.round((pres / tot) * 100) : null;
      days.push({
        date: dStr,
        dayName: dayNames[targetDate.getDay()],
        label: format(targetDate, 'dd/MM'),
        presentPct: pct,
        presentCount: pres,
        hasRecord: dayRecs.length > 0,
        isToday: i === 0,
      });
    }
    return days;
  }, [attendanceRecords, students.length]);

  const avgAttendancePct = React.useMemo(() => {
    const valid = weekAttendanceTrend.filter((d) => d.presentPct !== null);
    if (valid.length === 0) return null;
    const sum = valid.reduce((acc, curr) => acc + (curr.presentPct || 0), 0);
    return Math.round(sum / valid.length);
  }, [weekAttendanceTrend]);

  return (
    <div className="space-y-6">
      {/* Fallback Banner if no active class selected */}
      {!activeClass && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950">Chưa có lớp học được kích hoạt</p>
              <p className="text-[11px] text-emerald-800">Thầy/Cô có thể bấm nạp ngay bộ dữ liệu mẫu Lớp 3A1 (35 học sinh, sổ học tập, thi đua).</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => seedDemoClass()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            Nạp Lớp 3A1 mẫu
          </button>
        </div>
      )}

      {/* Header Welcome Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-7 text-white shadow-sm border border-emerald-600/50">
        {/* Soft decorative background elements */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-teal-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-emerald-100 text-xs font-semibold uppercase tracking-wider">
              <span className="px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-xs border border-white/20">
                {activeClass?.schoolName || 'Trường Tiểu học'}
              </span>
              <span>·</span>
              <span>Năm học {activeClass?.schoolYear || '2025 - 2026'}</span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-2 text-white tracking-tight">
              Lớp {activeClass?.className || '---'} · GVCN: {activeClass?.teacherName || 'Thầy/Cô'}
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1.5 max-w-xl leading-relaxed">
              {timeGreeting}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-stretch md:self-auto shrink-0 flex-wrap">
            <button
              onClick={() => setActiveTab('attendance')}
              className="flex-1 md:flex-none px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <CheckSquare className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
              <span>Điểm danh 1 phút</span>
            </button>
            <button
              onClick={() => setActiveTab('ai-comments')}
              className="flex-1 md:flex-none px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/25 rounded-xl text-xs font-bold backdrop-blur-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI Viết nhận xét</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. Sĩ số */}
        <div
          onClick={() => setDrillDown({ type: 'students_summary' })}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
          title="Bấm để xem danh sách & phân tổ học sinh"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sĩ số học sinh</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
              {students.length}
            </span>
            <span className="text-xs text-slate-400">/ {activeClass?.expectedStudentCount || 35} em</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">
              {maleCount} nam · {femaleCount} nữ
            </span>
            <span className="text-emerald-700 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Chi tiết <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 2. Điểm danh hôm nay */}
        <div
          onClick={() => {
            setAttFilter('all');
            setDrillDown({ type: 'attendance_today' });
          }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
          title="Bấm để kiểm tra danh sách vắng / muộn hôm nay"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Chuyên cần hôm nay</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckSquare className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
              {todayAttendance.recordedTotal > 0 ? `${todayAttendance.present}` : '0'}
            </span>
            <span className="text-xs text-slate-400">/ {students.length} có mặt</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] truncate">
            {todayAttendance.recordedTotal === 0 ? (
              <span className="text-slate-400 italic">Chưa điểm danh buổi sáng</span>
            ) : (
              <div className="flex items-center gap-1.5 truncate">
                {todayAttendance.excused > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAttFilter('excused_absence');
                      setDrillDown({ type: 'attendance_today', initialFilter: 'excused_absence' });
                    }}
                    className="text-amber-800 font-semibold hover:underline bg-amber-50 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    {todayAttendance.excused} có phép
                  </button>
                )}
                {todayAttendance.unexcused > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAttFilter('unexcused_absence');
                      setDrillDown({ type: 'attendance_today', initialFilter: 'unexcused_absence' });
                    }}
                    className="text-rose-800 font-bold hover:underline bg-rose-50 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    {todayAttendance.unexcused} không phép
                  </button>
                )}
                {todayAttendance.late > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAttFilter('late');
                      setDrillDown({ type: 'attendance_today', initialFilter: 'late' });
                    }}
                    className="text-purple-800 font-medium hover:underline bg-purple-50 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    {todayAttendance.late} muộn
                  </button>
                )}
                {todayAttendance.excused === 0 && todayAttendance.unexcused === 0 && todayAttendance.late === 0 && (
                  <span className="text-emerald-700 font-semibold">100% hiện diện đầy đủ</span>
                )}
              </div>
            )}
            <span className="text-blue-700 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0">
              Kiểm diện <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 3. Nhiệm vụ & Bài tập */}
        <div
          onClick={() => {
            if (tasks.length > 0) {
              setDrillDown({ type: 'task_detail', task: tasks[0] });
            } else {
              setActiveTab('tasks');
            }
          }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
          title="Bấm để kiểm tra tiến độ nộp bài của học sinh"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Nhiệm vụ & Bài tập</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ListTodo className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
              {tasks.length}
            </span>
            <span className="text-xs text-slate-400">bài đang theo dõi</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Theo dõi nộp bài</span>
            <span className="text-indigo-700 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Kiểm tra <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 4. Học sinh cần quan tâm */}
        <div
          onClick={() => setDrillDown({ type: 'attention_all' })}
          className={`bg-white p-4 sm:p-5 rounded-2xl border shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group ${
            attentionSignals.length > 0
              ? 'border-amber-200/80 hover:border-amber-400'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
          title="Bấm để xem căn cứ và bằng chứng cần quan tâm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Cần xem xét thêm</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
                attentionSignals.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <AlertTriangle className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span
              className={`text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${
                attentionSignals.length > 0 ? 'text-amber-800' : 'text-slate-900'
              }`}
            >
              {attentionSignals.length}
            </span>
            <span className="text-xs text-slate-400">em có dấu hiệu</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium truncate">Minh chứng thực tế</span>
            <span className="text-amber-800 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0">
              Chi tiết <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Attendance trend & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* 7-Day Attendance Trend */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Chuyên cần 7 ngày qua</h3>
                  <p className="text-[11px] text-slate-400">
                    {avgAttendancePct !== null
                      ? `Tỷ lệ chuyên cần trung bình: ${avgAttendancePct}%`
                      : 'Chưa có đủ dữ liệu chuyên cần tuần này'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('attendance')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Xem sổ điểm danh</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2.5 sm:gap-4 items-end pt-5 pb-1">
              {weekAttendanceTrend.map((day, idx) => {
                const isSelected = day.isToday;
                return (
                  <div
                    key={idx}
                    onClick={() =>
                      setDrillDown({
                        type: 'attendance_date',
                        date: day.date,
                        dayName: day.dayName,
                        label: day.label,
                      })
                    }
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                    title={`Bấm để xem danh sách chuyên cần ngày ${day.dayName} (${day.label})`}
                  >
                    <div className="text-[11px] font-bold text-slate-700 tabular-nums group-hover:text-emerald-700 transition-colors">
                      {day.presentPct !== null ? `${day.presentPct}%` : '—'}
                    </div>
                    <div className="w-full bg-slate-100/90 group-hover:bg-emerald-50 rounded-xl h-32 relative flex items-end justify-center overflow-hidden p-0.5 transition-colors">
                      {day.presentPct !== null ? (
                        <div
                          style={{ height: `${Math.max(day.presentPct, 8)}%` }}
                          className={`w-full transition-all duration-500 rounded-lg ${
                            day.presentPct >= 95
                              ? 'bg-gradient-to-t from-emerald-600 to-teal-500'
                              : day.presentPct >= 85
                              ? 'bg-gradient-to-t from-teal-600 to-cyan-500'
                              : 'bg-gradient-to-t from-amber-600 to-yellow-500'
                          } ${isSelected ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}`}
                        />
                      ) : (
                        <div className="h-1.5 w-full bg-slate-200 rounded-full" />
                      )}
                    </div>
                    <div className="text-center leading-tight">
                      <span className={`block text-[11px] font-bold ${isSelected ? 'text-emerald-800' : 'text-slate-700'} group-hover:text-emerald-700 transition-colors`}>
                        {day.dayName}
                      </span>
                      <span className="block text-[10px] text-slate-400">{day.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Urgent Tasks */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <ListTodo className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Nhiệm vụ & Bài tập cần hoàn thành</h3>
                  <p className="text-[11px] text-slate-400">Theo dõi tiến độ hoàn thành bài tập của học sinh</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('tasks')}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Tất cả ({tasks.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todayTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Chưa có nhiệm vụ học tập nào được giao. Bấm vào Nhiệm vụ để giao bài mới!
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasks.map((t) => {
                  const completedCount = taskCompletions.filter((c) => c.taskId === t.id && c.completed).length;
                  const total = students.length || 1;
                  const pct = Math.round((completedCount / total) * 100);
                  return (
                    <div
                      key={t.id}
                      onClick={() => setDrillDown({ type: 'task_detail', task: t })}
                      className="p-3.5 rounded-xl border border-slate-100 hover:border-indigo-300 bg-slate-50/50 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                      title="Bấm để kiểm tra chi tiết danh sách học sinh nộp bài"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                          {t.title}
                        </span>
                        <span className="shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-slate-200/70 text-slate-700">
                          Hạn: {t.dueAt}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Đã nộp: <strong className="text-slate-800">{completedCount}/{total}</strong> học sinh</span>
                        <span className="font-bold text-indigo-700">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200/80 rounded-full mt-1.5 overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 span): Birthdays, Leaderboard, Events */}
        <div className="space-y-6">
          {/* Birthday Card */}
          {birthdayStudents.length > 0 ? (
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-rose-500 to-pink-600 p-5 sm:p-6 rounded-2xl text-white shadow-xs">
              <div className="flex items-center gap-2 text-white/95 text-xs font-bold uppercase tracking-wider">
                <Cake className="w-4 h-4 animate-bounce" />
                <span>Sinh nhật hôm nay!</span>
              </div>
              <div className="mt-3 space-y-1">
                {birthdayStudents.map((s, idx) => (
                  <div key={s.id || `bday_${idx}`}>
                    <p className="text-lg font-bold text-white tracking-tight">{s.fullName}</p>
                    <p className="text-xs text-white/85">{s.groupId} · Chúc con luôn vui vẻ và chăm ngoan!</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveTab('birthdays')}
                className="mt-4 w-full py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gửi lời chúc mừng qua Zalo</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => setActiveTab('birthdays')}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-pink-300 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Cake className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-pink-700 transition-colors">
                    Lịch sinh nhật học sinh
                  </h4>
                  <p className="text-[11px] text-slate-400">Xem sinh nhật tuần này & tháng này</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}

          {/* Group Competition Ranking */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Trophy className="w-4 h-4 stroke-[2]" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Thi đua các Tổ tuần này</h3>
              </div>
              <button
                onClick={() => setActiveTab('competition')}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Cộng sao</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {groupScores.map((item, idx) => (
                <div
                  key={item.name}
                  onClick={() => setDrillDown({ type: 'competition_group', groupName: item.name, score: item.score })}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-amber-300 hover:bg-amber-50/40 transition-all cursor-pointer group"
                  title="Bấm để xem lịch sử cộng trừ điểm của tổ"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-700'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-amber-800 transition-colors">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 tabular-nums">
                    {item.score > 0 ? `+${item.score}` : item.score} điểm
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Upcoming Event */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Calendar className="w-4 h-4 stroke-[2]" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Hoạt động sắp diễn ra</h3>
              </div>
              <button
                onClick={() => setActiveTab('events')}
                className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Lịch lớp</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {classEvents.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Chưa có sự kiện nào trong tuần này.
              </div>
            ) : (
              <div className="space-y-2">
                {classEvents.slice(0, 2).map((ev) => (
                  <div key={ev.id} className="p-3 rounded-xl bg-purple-50/60 border border-purple-100/80">
                    <p className="text-xs font-bold text-slate-900">{ev.title}</p>
                    <p className="text-[11px] text-purple-700 mt-1 font-medium">
                      {ev.date} {ev.startTime ? `· ${ev.startTime}` : ''} {ev.location ? `· ${ev.location}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drill-Down Inspection Modal (Full Traceability & Root Cause Inspection) */}
      {drillDown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  {drillDown.type === 'students_summary' && (
                    <Users className="w-5 h-5 text-emerald-600" />
                  )}
                  {(drillDown.type === 'attendance_today' || drillDown.type === 'attendance_date') && (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  )}
                  {drillDown.type === 'task_detail' && (
                    <ListTodo className="w-5 h-5 text-indigo-600" />
                  )}
                  {(drillDown.type === 'attention_all' || drillDown.type === 'attention_signal') && (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  )}
                  {drillDown.type === 'competition_group' && (
                    <Trophy className="w-5 h-5 text-amber-600" />
                  )}

                  <h3 className="text-base font-bold text-slate-900">
                    {drillDown.type === 'students_summary' && `Hồ sơ sĩ số Lớp ${activeClass?.className || ''} (${students.length} em)`}
                    {drillDown.type === 'attendance_today' && `Kiểm diện chuyên cần hôm nay (${todayStr})`}
                    {drillDown.type === 'attendance_date' && `Sổ điểm danh ngày ${drillDown.dayName} (${drillDown.label})`}
                    {drillDown.type === 'task_detail' && `Tiến độ nhiệm vụ: ${drillDown.task.title}`}
                    {drillDown.type === 'attention_all' && `Căn cứ & Minh chứng học sinh cần quan tâm (${attentionSignals.length} em)`}
                    {drillDown.type === 'attention_signal' && `Minh chứng cảnh báo: ${drillDown.signal.studentName}`}
                    {drillDown.type === 'competition_group' && `Nhật ký cộng/trừ điểm: ${drillDown.groupName} (${drillDown.score} điểm)`}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Truy ngược số liệu gốc · Minh chứng xác thực thời gian thực
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDrillDown(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* 1. STUDENTS SUMMARY DRILL-DOWN */}
              {drillDown.type === 'students_summary' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                      <div className="text-emerald-800 font-bold text-base">{students.length}</div>
                      <div className="text-[10px] text-emerald-600">Tổng sĩ số</div>
                    </div>
                    <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="text-blue-800 font-bold text-base">{maleCount}</div>
                      <div className="text-[10px] text-blue-600">Học sinh Nam</div>
                    </div>
                    <div className="p-2.5 bg-pink-50 rounded-xl border border-pink-100">
                      <div className="text-pink-800 font-bold text-base">{femaleCount}</div>
                      <div className="text-[10px] text-pink-600">Học sinh Nữ</div>
                    </div>
                  </div>

                  {/* Filter by group */}
                  <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
                    {['all', 'Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setStuGroupFilter(g)}
                        className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                          stuGroupFilter === g
                            ? 'bg-slate-900 text-white font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {g === 'all' ? 'Tất cả các tổ' : g}
                      </button>
                    ))}
                  </div>

                  {/* Student rows */}
                  <div className="space-y-1.5 divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                    {students
                      .filter((s) => stuGroupFilter === 'all' || s.groupId === stuGroupFilter)
                      .map((s, idx) => {
                        const p = parentMap.get(s.id);
                        return (
                          <div
                            key={s.id}
                            className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-[10px] font-mono text-slate-400 w-5 text-right">
                                {idx + 1}.
                              </span>
                              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px]">
                                {s.fullName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">{s.fullName}</div>
                                <div className="text-[10px] text-slate-400">
                                  {s.studentCode || 'HS'} · {s.groupId} · {s.gender}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {p ? (
                                <a
                                  href={`tel:${p.phone}`}
                                  className="text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md flex items-center gap-1 font-semibold"
                                  title={`Gọi ${p.type} (${p.fullName})`}
                                >
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                  <span>{p.phone}</span>
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Chưa có SĐT</span>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentForDetail(s);
                                  setActiveTab('students');
                                  setDrillDown(null);
                                }}
                                className="text-[11px] text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1 font-medium cursor-pointer"
                              >
                                <span>Hồ sơ</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* 2. ATTENDANCE TODAY OR SPECIFIC DATE DRILL-DOWN */}
              {(drillDown.type === 'attendance_today' || drillDown.type === 'attendance_date') && (
                <div className="space-y-3">
                  {(() => {
                    const targetDateStr =
                      drillDown.type === 'attendance_today' ? todayStr : drillDown.date;
                    const dateRecords = attendanceRecords.filter((r) => r.date === targetDateStr);
                    const recordByStudentId = new Map(dateRecords.map((r) => [r.studentId, r]));

                    const excusedList = students.filter(
                      (s) => recordByStudentId.get(s.id)?.status === 'excused_absence'
                    );
                    const unexcusedList = students.filter(
                      (s) => recordByStudentId.get(s.id)?.status === 'unexcused_absence'
                    );
                    const lateList = students.filter(
                      (s) => recordByStudentId.get(s.id)?.status === 'late'
                    );
                    const presentList = students.filter(
                      (s) =>
                        recordByStudentId.get(s.id)?.status === 'present' ||
                        (!recordByStudentId.has(s.id) && dateRecords.length > 0)
                    );

                    let displayList: Student[] = [];
                    if (attFilter === 'all') displayList = students;
                    else if (attFilter === 'excused_absence') displayList = excusedList;
                    else if (attFilter === 'unexcused_absence') displayList = unexcusedList;
                    else if (attFilter === 'late') displayList = lateList;
                    else if (attFilter === 'present') displayList = presentList;

                    return (
                      <>
                        {/* Summary Badges */}
                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                          <button
                            type="button"
                            onClick={() => setAttFilter('present')}
                            className={`p-2 rounded-xl border text-center transition-colors cursor-pointer ${
                              attFilter === 'present'
                                ? 'bg-emerald-100 border-emerald-300 ring-2 ring-emerald-500/20'
                                : 'bg-emerald-50 border-emerald-100'
                            }`}
                          >
                            <div className="text-emerald-800 font-bold text-sm">
                              {dateRecords.length > 0 ? presentList.length : 0}
                            </div>
                            <div className="text-[10px] text-emerald-600">Có mặt</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAttFilter('excused_absence')}
                            className={`p-2 rounded-xl border text-center transition-colors cursor-pointer ${
                              attFilter === 'excused_absence'
                                ? 'bg-amber-100 border-amber-300 ring-2 ring-amber-500/20'
                                : 'bg-amber-50 border-amber-100'
                            }`}
                          >
                            <div className="text-amber-800 font-bold text-sm">{excusedList.length}</div>
                            <div className="text-[10px] text-amber-600">Có phép</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAttFilter('unexcused_absence')}
                            className={`p-2 rounded-xl border text-center transition-colors cursor-pointer ${
                              attFilter === 'unexcused_absence'
                                ? 'bg-rose-100 border-rose-300 ring-2 ring-rose-500/20'
                                : 'bg-rose-50 border-rose-100'
                            }`}
                          >
                            <div className="text-rose-800 font-bold text-sm">{unexcusedList.length}</div>
                            <div className="text-[10px] text-rose-600">Không phép</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAttFilter('late')}
                            className={`p-2 rounded-xl border text-center transition-colors cursor-pointer ${
                              attFilter === 'late'
                                ? 'bg-purple-100 border-purple-300 ring-2 ring-purple-500/20'
                                : 'bg-purple-50 border-purple-100'
                            }`}
                          >
                            <div className="text-purple-800 font-bold text-sm">{lateList.length}</div>
                            <div className="text-[10px] text-purple-600">Đi muộn</div>
                          </button>
                        </div>

                        {/* Filter pills */}
                        <div className="flex items-center gap-1.5 text-xs pt-1">
                          <button
                            type="button"
                            onClick={() => setAttFilter('all')}
                            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                              attFilter === 'all'
                                ? 'bg-slate-900 text-white font-bold'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Toàn bộ lớp ({students.length})
                          </button>
                          <span className="text-[11px] text-slate-400">
                            Hiển thị {displayList.length} em theo bộ lọc
                          </span>
                        </div>

                        {/* List */}
                        <div className="space-y-1.5 border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 max-h-64 overflow-y-auto">
                          {displayList.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-400">
                              Không có học sinh nào trong nhóm này
                            </div>
                          ) : (
                            displayList.map((s) => {
                              const rec = recordByStudentId.get(s.id);
                              const status = rec?.status || (dateRecords.length > 0 ? 'present' : 'Chưa điểm danh');
                              const p = parentMap.get(s.id);

                              return (
                                <div
                                  key={s.id}
                                  className="p-2 bg-white rounded-lg border border-slate-100 flex items-center justify-between gap-2 text-xs"
                                >
                                  <div>
                                    <div className="font-semibold text-slate-900">{s.fullName}</div>
                                    <div className="text-[10px] text-slate-400">
                                      {s.groupId} {rec?.notes ? `· Lý do: "${rec.notes}"` : ''}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        status === 'present'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : status === 'excused_absence'
                                          ? 'bg-amber-100 text-amber-800'
                                          : status === 'unexcused_absence'
                                          ? 'bg-rose-100 text-rose-800'
                                          : status === 'late'
                                          ? 'bg-purple-100 text-purple-800'
                                          : 'bg-slate-100 text-slate-500'
                                      }`}
                                    >
                                      {status === 'present'
                                        ? 'Có mặt'
                                        : status === 'excused_absence'
                                        ? 'Có phép'
                                        : status === 'unexcused_absence'
                                        ? 'Không phép'
                                        : status === 'late'
                                        ? 'Đi muộn'
                                        : 'Chưa điểm danh'}
                                    </span>

                                    {p && (
                                      <a
                                        href={`tel:${p.phone}`}
                                        className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                                        title={`Gọi phụ huynh: ${p.phone}`}
                                      >
                                        <Phone className="w-3.5 h-3.5" />
                                      </a>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedStudentForDetail(s);
                                        setActiveTab('students');
                                        setDrillDown(null);
                                      }}
                                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                                      title="Xem hồ sơ"
                                    >
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* 3. TASK DETAIL DRILL-DOWN */}
              {drillDown.type === 'task_detail' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{drillDown.task.title}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                        Hạn: {drillDown.task.dueAt}
                      </span>
                    </div>
                    {drillDown.task.description && (
                      <p className="text-slate-600 text-[11px]">{drillDown.task.description}</p>
                    )}
                  </div>

                  {(() => {
                    const completedIds = new Set(
                      taskCompletions
                        .filter((c) => c.taskId === drillDown.task.id && c.completed)
                        .map((c) => c.studentId)
                    );
                    const completedStudents = students.filter((s) => completedIds.has(s.id));
                    const uncompletedStudents = students.filter((s) => !completedIds.has(s.id));

                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">Danh sách nộp bài</span>
                          <span className="font-semibold text-indigo-700">
                            Đã nộp: {completedStudents.length} / {students.length} em (
                            {Math.round((completedStudents.length / (students.length || 1)) * 100)}%)
                          </span>
                        </div>

                        {/* Uncompleted students (Priority to follow up) */}
                        {uncompletedStudents.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                              Chưa nộp ({uncompletedStudents.length} em) - Cần nhắc nhở:
                            </div>
                            <div className="space-y-1 max-h-40 overflow-y-auto border border-amber-200 rounded-xl p-2 bg-amber-50/40">
                              {uncompletedStudents.map((s) => {
                                const p = parentMap.get(s.id);
                                return (
                                  <div
                                    key={s.id}
                                    className="flex items-center justify-between text-xs bg-white p-1.5 rounded-lg border border-amber-100"
                                  >
                                    <div>
                                      <span className="font-semibold text-slate-900">{s.fullName}</span>
                                      <span className="text-slate-400 text-[10px] ml-1.5">
                                        ({s.groupId})
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {p && (
                                        <a
                                          href={`tel:${p.phone}`}
                                          className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1"
                                        >
                                          <Phone className="w-3 h-3 text-amber-700" />
                                          <span>Nhắc PH ({p.phone})</span>
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Completed students */}
                        {completedStudents.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                              Đã hoàn thành ({completedStudents.length} em):
                            </div>
                            <div className="space-y-1 max-h-36 overflow-y-auto border border-emerald-200 rounded-xl p-2 bg-emerald-50/30 text-xs">
                              {completedStudents.map((s) => (
                                <div
                                  key={s.id}
                                  className="flex items-center justify-between p-1 bg-white rounded border border-emerald-100"
                                >
                                  <span className="text-slate-800">{s.fullName}</span>
                                  <span className="text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã nộp
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 4. ATTENTION SIGNALS GROUNDED DRILL-DOWN */}
              {(drillDown.type === 'attention_all' || drillDown.type === 'attention_signal') && (
                <div className="space-y-3">
                  {attentionSignals.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Tất cả học sinh đều đang duy trì nề nếp và tiến độ tốt!
                    </div>
                  ) : (
                    (drillDown.type === 'attention_signal'
                      ? [drillDown.signal]
                      : attentionSignals
                    ).map((sig) => {
                      const s = studentMap.get(sig.studentId);
                      const p = parentMap.get(sig.studentId);

                      return (
                        <div
                          key={sig.id}
                          className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <span>{sig.studentName}</span>
                                <span className="text-xs font-normal text-slate-500">
                                  ({sig.groupId})
                                </span>
                              </div>
                              <div className="text-amber-900 font-semibold text-xs mt-0.5 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>{sig.title}: {sig.description}</span>
                              </div>
                            </div>

                            {p && (
                              <a
                                href={`tel:${p.phone}`}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shrink-0"
                              >
                                <Phone className="w-3 h-3" />
                                <span>Gọi PH ({p.phone})</span>
                              </a>
                            )}
                          </div>

                          {/* Grounded Evidence Box */}
                          {sig.evidence && (
                            <div className="p-2.5 bg-white rounded-lg border border-amber-200/80 space-y-1 text-[11px]">
                              <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                                Căn cứ dữ liệu gốc trong hệ thống:
                              </div>
                              {sig.evidence.dates && sig.evidence.dates.length > 0 && (
                                <p className="text-slate-700">
                                  <strong>Ngày ghi nhận:</strong> {sig.evidence.dates.join(', ')}
                                </p>
                              )}
                              {sig.evidence.details && (
                                <p className="text-slate-600">
                                  <strong>Chi tiết:</strong> {sig.evidence.details}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-2 pt-1">
                            {s && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentForDetail(s);
                                  setActiveTab('students');
                                  setDrillDown(null);
                                }}
                                className="text-[11px] text-slate-700 hover:text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1 font-semibold cursor-pointer"
                              >
                                <span>Xem toàn bộ hồ sơ em</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* 5. COMPETITION GROUP DRILL-DOWN */}
              {drillDown.type === 'competition_group' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-amber-900 text-sm">{drillDown.groupName}</span>
                      <p className="text-[11px] text-amber-700">Tổng điểm thi đua hiện tại</p>
                    </div>
                    <span className="text-lg font-black text-amber-800 tabular-nums">
                      {drillDown.score > 0 ? `+${drillDown.score}` : drillDown.score} điểm
                    </span>
                  </div>

                  {(() => {
                    const groupEntries = competitionEntries.filter(
                      (e) => e.groupId === drillDown.groupName
                    );

                    return (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Lịch sử cộng/trừ điểm ({groupEntries.length} lượt ghi nhận):
                        </div>
                        {groupEntries.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            Chưa có lượt cộng/trừ điểm nào được ghi nhận cho tổ này
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50 text-xs">
                            {groupEntries.map((e) => (
                              <div
                                key={e.id}
                                className="p-2 bg-white rounded-lg border border-slate-100 flex items-center justify-between gap-2"
                              >
                                <div>
                                  <span className="font-semibold text-slate-800">{e.ruleTitle}</span>
                                  {e.note && (
                                    <span className="text-slate-400 text-[11px] ml-1.5">
                                      - {e.note}
                                    </span>
                                  )}
                                  <div className="text-[10px] text-slate-400">Ngày: {e.date}</div>
                                </div>
                                <span
                                  className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded ${
                                    e.pointDelta > 0
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {e.pointDelta > 0 ? `+${e.pointDelta}` : e.pointDelta}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                AI Studio · Sổ Chủ Nhiệm Lớp Học
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDrillDown(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Đóng
                </button>

                {drillDown.type === 'students_summary' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('students');
                      setDrillDown(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Xem toàn bộ hồ sơ lớp
                  </button>
                )}

                {(drillDown.type === 'attendance_today' || drillDown.type === 'attendance_date') && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('attendance');
                      setDrillDown(null);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Mở sổ điểm danh chi tiết
                  </button>
                )}

                {drillDown.type === 'task_detail' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('tasks');
                      setDrillDown(null);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Mở trang Nhiệm vụ
                  </button>
                )}

                {(drillDown.type === 'attention_all' || drillDown.type === 'attention_signal') && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('attention');
                      setDrillDown(null);
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Mở chuyên mục Đồng hành & Hỗ trợ
                  </button>
                )}

                {drillDown.type === 'competition_group' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('competition');
                      setDrillDown(null);
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Mở trang Thi đua
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
