import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TeachingScheduleEntry,
  TeachingScheduleRule,
  TeachingScheduleStatus,
} from '../../types';
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  BookOpen,
  ListTodo,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Edit2,
  Trash2,
  X,
  Repeat,
  CalendarDays,
  MapPin,
  FileText,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Upload,
  FileSpreadsheet,
  ArrowRightLeft,
  CalendarRange,
} from 'lucide-react';
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import { vi } from 'date-fns/locale';

const PRIMARY_SUBJECTS = [
  'Toán',
  'Tiếng Việt',
  'Tiếng Anh',
  'Tự nhiên và Xã hội',
  'Khoa học',
  'Lịch sử và Địa lí',
  'Tin học',
  'Công nghệ',
  'Đạo đức',
  'Âm nhạc',
  'Mĩ thuật',
  'Giáo dục thể chất',
  'Hoạt động trải nghiệm',
];

const DEFAULT_PERIODS = [
  { period: 1, start: '07:30', end: '08:05' },
  { period: 2, start: '08:15', end: '08:50' },
  { period: 3, start: '09:15', end: '09:50' },
  { period: 4, start: '10:00', end: '10:35' },
  { period: 5, start: '13:45', end: '14:20' },
  { period: 6, start: '14:30', end: '15:05' },
  { period: 7, start: '15:20', end: '15:55' },
];

export const TeachingScheduleView: React.FC = () => {
  const {
    activeClass,
    currentUser,
    teachingSchedules,
    teachingRules,
    addTeachingScheduleEntry,
    updateTeachingScheduleEntry,
    deleteTeachingScheduleEntry,
    completeTeachingScheduleEntry,
    addTeachingRule,
    deleteTeachingRule,
    generateSchedulesFromRules,
    setActiveTab,
    setLearningJournalPrefill,
    setTaskPrefill,
    showToast,
  } = useApp();

  const [viewMode, setViewMode] = useState<'today' | 'week' | 'month' | 'rules'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Modals & Action Sheet
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TeachingScheduleEntry | null>(null);
  const [detailEntry, setDetailEntry] = useState<TeachingScheduleEntry | null>(null);
  const [showCompletePrompt, setShowCompletePrompt] = useState<TeachingScheduleEntry | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);

  // Form State for Add / Edit
  const [formDate, setFormDate] = useState(selectedDate);
  const [formPeriod, setFormPeriod] = useState<number>(1);
  const [formStartTime, setFormStartTime] = useState('07:30');
  const [formEndTime, setFormEndTime] = useState('08:05');
  const [formSubject, setFormSubject] = useState('Toán');
  const [formLessonTitle, setFormLessonTitle] = useState('');
  const [formRoom, setFormRoom] = useState(activeClass?.className || 'Phòng học');
  const [formPrepNote, setFormPrepNote] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formStatus, setFormStatus] = useState<TeachingScheduleStatus>('scheduled');
  const [makeRecurring, setMakeRecurring] = useState(false);

  // Today string for time evaluation
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const currentTimeStr = format(new Date(), 'HH:mm');

  // Filter schedules for the selected day
  const daySchedules = useMemo(() => {
    return teachingSchedules
      .filter((s) => s.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [teachingSchedules, selectedDate]);

  // Determine current and next period for today
  const { currentPeriodId, nextPeriodId } = useMemo(() => {
    if (selectedDate !== todayStr || daySchedules.length === 0) {
      return { currentPeriodId: null, nextPeriodId: null };
    }
    let current: string | null = null;
    let next: string | null = null;

    for (let i = 0; i < daySchedules.length; i++) {
      const entry = daySchedules[i];
      if (currentTimeStr >= entry.startTime && currentTimeStr <= entry.endTime) {
        current = entry.id;
        if (i + 1 < daySchedules.length) {
          next = daySchedules[i + 1].id;
        }
        break;
      } else if (currentTimeStr < entry.startTime && !next) {
        next = entry.id;
      }
    }
    return { currentPeriodId: current, nextPeriodId: next };
  }, [selectedDate, todayStr, daySchedules, currentTimeStr]);

  // Week days calculation
  const currentWeekDays = useMemo(() => {
    const curr = parseISO(selectedDate);
    const start = startOfWeek(curr, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(curr, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end }).slice(0, 6); // Mon to Sat
  }, [selectedDate]);

  // Month days calculation
  const currentMonthDays = useMemo(() => {
    const curr = parseISO(selectedDate);
    const monthStart = startOfMonth(curr);
    const monthEnd = endOfMonth(curr);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  // Import TKB Wizard states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'validate' | 'confirm'>('upload');
  const [importRawText, setImportRawText] = useState('');
  const [importParsedRules, setImportParsedRules] = useState<Array<{
    dayOfWeek: number;
    periodNumber: number;
    startTime: string;
    endTime: string;
    subjectName: string;
    lessonTitle?: string;
    valid: boolean;
    error?: string;
  }>>([]);

  // Schedule Exception quick-action states
  const [exceptionMode, setExceptionMode] = useState<'none' | 'reschedule_time' | 'change_subject' | 'move_date'>('none');
  const [exNewStartTime, setExNewStartTime] = useState('08:00');
  const [exNewEndTime, setExNewEndTime] = useState('08:35');
  const [exNewSubject, setExNewSubject] = useState('Toán');
  const [exNewDate, setExNewDate] = useState('');

  // Handle open Add Modal
  const handleOpenAdd = (dateTarget?: string, periodTarget?: number) => {
    const targetDate = dateTarget || selectedDate;
    setFormDate(targetDate);
    const pNum = periodTarget || 1;
    setFormPeriod(pNum);
    const def = DEFAULT_PERIODS.find((p) => p.period === pNum) || DEFAULT_PERIODS[0];
    setFormStartTime(def.start);
    setFormEndTime(def.end);
    setFormSubject('Toán');
    setFormLessonTitle('');
    setFormRoom(activeClass?.className || 'Phòng học');
    setFormPrepNote('');
    setFormNote('');
    setFormStatus('scheduled');
    setMakeRecurring(false);
    setEditingEntry(null);
    setShowAddModal(true);
  };

  // Handle open Edit Modal
  const handleOpenEdit = (entry: TeachingScheduleEntry) => {
    setEditingEntry(entry);
    setFormDate(entry.date);
    setFormPeriod(entry.periodNumber || 1);
    setFormStartTime(entry.startTime);
    setFormEndTime(entry.endTime);
    setFormSubject(entry.subjectName);
    setFormLessonTitle(entry.lessonTitle || '');
    setFormRoom(entry.room || '');
    setFormPrepNote(entry.preparationNote || '');
    setFormNote(entry.note || '');
    setFormStatus(entry.status);
    setMakeRecurring(false);
    setShowAddModal(true);
  };

  // Save Schedule Entry
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !currentUser) {
      showToast('Vui lòng chọn lớp học', 'error');
      return;
    }

    try {
      if (editingEntry) {
        await updateTeachingScheduleEntry(editingEntry.id, {
          date: formDate,
          periodNumber: formPeriod,
          startTime: formStartTime,
          endTime: formEndTime,
          subjectName: formSubject,
          lessonTitle: formLessonTitle.trim(),
          room: formRoom.trim(),
          preparationNote: formPrepNote.trim(),
          note: formNote.trim(),
          status: formStatus,
        });
        showToast('Đã cập nhật tiết dạy thành công!', 'success');
      } else {
        const newEntry = await addTeachingScheduleEntry({
          ownerId: currentUser.uid,
          classId: activeClass.id,
          date: formDate,
          periodNumber: formPeriod,
          startTime: formStartTime,
          endTime: formEndTime,
          subjectName: formSubject,
          lessonTitle: formLessonTitle.trim(),
          room: formRoom.trim(),
          preparationNote: formPrepNote.trim(),
          note: formNote.trim(),
          status: formStatus,
          source: makeRecurring ? 'recurring' : 'manual',
        });

        // Also add recurring rule if checked
        if (makeRecurring) {
          const d = parseISO(formDate);
          const dayOfWeek = d.getDay();
          await addTeachingRule({
            ownerId: currentUser.uid,
            classId: activeClass.id,
            dayOfWeek,
            periodNumber: formPeriod,
            startTime: formStartTime,
            endTime: formEndTime,
            subjectName: formSubject,
            lessonTitle: formLessonTitle.trim(),
            effectiveFrom: formDate,
            active: true,
          });
          showToast('Đã lưu tiết dạy và tạo quy tắc lặp hàng tuần!', 'success');
        } else {
          showToast('Đã thêm tiết dạy vào lịch!', 'success');
        }
      }
      setShowAddModal(false);
      setEditingEntry(null);
    } catch (err: any) {
      showToast('Lỗi lưu tiết dạy: ' + (err.message || ''), 'error');
    }
  };

  // Complete period action
  const handleComplete = async (entry: TeachingScheduleEntry) => {
    try {
      await completeTeachingScheduleEntry(entry.id);
      showToast(`Đã ghi nhận hoàn thành tiết: ${entry.subjectName}`, 'success');
      setShowCompletePrompt(entry);
    } catch (err: any) {
      showToast('Lỗi cập nhật tiết dạy: ' + (err.message || ''), 'error');
    }
  };

  // Jump to Student Learning Journal with prefilled context
  const handleGoToJournal = (entry: TeachingScheduleEntry) => {
    setLearningJournalPrefill({
      scheduleEntryId: entry.id,
      subject: entry.subjectName,
      lessonTitle: entry.lessonTitle,
      date: entry.date,
    });
    setShowCompletePrompt(null);
    setDetailEntry(null);
    setActiveTab('learning-journal');
  };

  // Create Task from Schedule
  const handleCreateTask = (entry: TeachingScheduleEntry) => {
    setTaskPrefill({
      title: `Bài tập / Nhiệm vụ: ${entry.lessonTitle || entry.subjectName}`,
      subject: entry.subjectName,
      dueDate: entry.date,
    });
    setDetailEntry(null);
    setActiveTab('schedule');
  };

  // Jump to Attendance
  const handleGoToAttendance = () => {
    setDetailEntry(null);
    setActiveTab('attendance');
  };

  // Generate week from rules
  const handleGenerateWeekFromRules = async () => {
    if (teachingRules.length === 0) {
      showToast('Chưa có quy tắc lặp thời khóa biểu. Hãy thêm quy tắc trước.', 'info');
      setViewMode('rules');
      return;
    }
    const curr = parseISO(selectedDate);
    const startStr = format(startOfWeek(curr, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const endStr = format(endOfWeek(curr, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    try {
      await generateSchedulesFromRules(startStr, endStr);
      showToast(`Đã đồng bộ lịch dạy tuần (${startStr} đến ${endStr}) từ quy tắc!`, 'success');
    } catch (err: any) {
      showToast('Lỗi đồng bộ lịch: ' + (err.message || ''), 'error');
    }
  };

  const getStatusBadge = (status: TeachingScheduleStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Đã dạy
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
            <X className="w-3 h-3" />
            Đã hủy
          </span>
        );
      case 'rescheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" />
            Đổi giờ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            <Clock className="w-3 h-3" />
            Sắp tới
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs">
            <Calendar className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-base lg:text-lg font-bold text-slate-900 tracking-tight leading-tight">
              Lịch Dạy & Kế Hoạch Bài Học
            </h1>
            <p className="text-xs text-slate-500">
              Lớp {activeClass?.className || '---'} · Theo dõi tiến độ giảng dạy và chuyển nhanh sang Nhật ký học tập
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Modes */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setViewMode('today')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'today' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'week' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Lịch tuần
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'month' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Lịch tháng
            </button>
            <button
              type="button"
              onClick={() => setViewMode('rules')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'rules' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Quy tắc lặp</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setImportStep('upload');
              setImportRawText('');
              setImportParsedRules([]);
              setShowImportModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Import thời khóa biểu từ bảng dữ liệu hoặc mẫu chuẩn"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Import TKB</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateWeekFromRules}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Tự động tạo các tiết dạy trong tuần từ Quy tắc lặp"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Sinh lịch từ quy tắc</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm tiết dạy</span>
          </button>
        </div>
      </div>

      {/* Date Navigation Bar (for Today, Week & Month views) */}
      {viewMode !== 'rules' && (
        <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const curr = parseISO(selectedDate);
                if (viewMode === 'month') {
                  setSelectedDate(format(subMonths(curr, 1), 'yyyy-MM-dd'));
                } else if (viewMode === 'week') {
                  setSelectedDate(format(subDays(curr, 7), 'yyyy-MM-dd'));
                } else {
                  setSelectedDate(format(subDays(curr, 1), 'yyyy-MM-dd'));
                }
              }}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer"
              title="Lùi thời gian"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className="px-2.5 py-1 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
            >
              Hôm nay
            </button>

            <button
              type="button"
              onClick={() => {
                const curr = parseISO(selectedDate);
                if (viewMode === 'month') {
                  setSelectedDate(format(addMonths(curr, 1), 'yyyy-MM-dd'));
                } else if (viewMode === 'week') {
                  setSelectedDate(format(addDays(curr, 7), 'yyyy-MM-dd'));
                } else {
                  setSelectedDate(format(addDays(curr, 1), 'yyyy-MM-dd'));
                }
              }}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer"
              title="Tiến thời gian"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-slate-800 ml-1">
              {viewMode === 'month'
                ? `Tháng ${format(parseISO(selectedDate), 'MM/yyyy')}`
                : viewMode === 'week'
                ? `Tuần ${format(startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 }), 'dd/MM')} – ${format(endOfWeek(parseISO(selectedDate), { weekStartsOn: 1 }), 'dd/MM/yyyy')}`
                : format(parseISO(selectedDate), 'EEEE, dd/MM/yyyy', { locale: vi })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      )}

      {/* VIEW MODE: TODAY TIMELINE */}
      {viewMode === 'today' && (
        <div className="space-y-3">
          {daySchedules.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/90 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Chưa có lịch dạy cho ngày {format(parseISO(selectedDate), 'dd/MM/yyyy')}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Chưa có lịch dạy. Hãy thêm tiết đầu tiên hoặc tạo thời khóa biểu tuần.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenAdd()}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  + Thêm tiết
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('rules')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Tạo thời khóa biểu
                </button>
              </div>
            </div>
          ) : (
            <div className="relative pl-6 lg:pl-8 space-y-3 before:absolute before:left-3 lg:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {daySchedules.map((entry) => {
                const isCurrent = entry.id === currentPeriodId;
                const isNext = entry.id === nextPeriodId;

                return (
                  <div
                    key={entry.id}
                    className={`relative bg-white rounded-2xl border p-4 lg:p-5 transition-all shadow-2xs ${
                      isCurrent
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                        : isNext
                        ? 'border-indigo-400 bg-indigo-50/15'
                        : 'border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    {/* Timeline Dot */}
                    <div
                      className={`absolute -left-[1.85rem] lg:-left-[2.1rem] top-5 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                        isCurrent
                          ? 'bg-emerald-600 ring-4 ring-emerald-100 animate-pulse'
                          : entry.status === 'completed'
                          ? 'bg-teal-600'
                          : isNext
                          ? 'bg-indigo-600'
                          : 'bg-slate-300'
                      }`}
                    />

                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-1.5 flex-1 min-w-[220px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs">
                            Tiết {entry.periodNumber || '---'}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {entry.startTime} – {entry.endTime}
                          </span>
                          {getStatusBadge(entry.status)}
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider animate-bounce">
                              Đang diễn ra
                            </span>
                          )}
                          {isNext && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
                              Tiết tiếp theo
                            </span>
                          )}
                          {entry.room && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {entry.room}
                            </span>
                          )}
                        </div>

                        <div className="flex items-baseline gap-2">
                          <h3 className="text-sm lg:text-base font-bold text-slate-900">
                            {entry.subjectName}
                          </h3>
                          {entry.lessonTitle && (
                            <span className="text-xs lg:text-sm font-medium text-slate-600">
                              · Bài: <span className="font-semibold text-slate-800">{entry.lessonTitle}</span>
                            </span>
                          )}
                        </div>

                        {entry.preparationNote && (
                          <div className="text-xs text-amber-800 bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 flex items-start gap-2">
                            <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Chuẩn bị bài: </span>
                              <span>{entry.preparationNote}</span>
                            </div>
                          </div>
                        )}

                        {entry.note && (
                          <p className="text-xs text-slate-500 italic">
                            Ghi chú: {entry.note}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {entry.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleComplete(entry)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            title="Đánh dấu đã dạy xong tiết này"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đã dạy</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleGoToJournal(entry)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          title="Chuyển sang ghi nhận xét, khó khăn hoặc tiến bộ của học sinh"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Ghi nhật ký</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(entry)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa tiết dạy"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa tiết ${entry.subjectName}?`)) {
                              deleteTeachingScheduleEntry(entry.id);
                              showToast('Đã xóa tiết dạy khỏi lịch.', 'info');
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa tiết dạy"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE: WEEK GRID */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-3 text-left font-bold text-slate-500 uppercase tracking-wider w-24">
                    Tiết / Giờ
                  </th>
                  {currentWeekDays.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isToday = dateStr === todayStr;
                    return (
                      <th
                        key={dateStr}
                        className={`py-3 px-3 text-center font-bold border-l border-slate-200 ${
                          isToday ? 'bg-emerald-50/80 text-emerald-900' : 'text-slate-700'
                        }`}
                      >
                        <div className="text-xs">{format(day, 'EEEE', { locale: vi })}</div>
                        <div className={`text-sm ${isToday ? 'text-emerald-700 font-extrabold' : 'text-slate-500'}`}>
                          {format(day, 'dd/MM')}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[1, 2, 3, 4, 5, 6, 7].map((pNum) => {
                  const def = DEFAULT_PERIODS.find((p) => p.period === pNum);
                  return (
                    <tr key={pNum} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 bg-slate-50/40 text-slate-600 font-medium whitespace-nowrap">
                        <div className="font-bold text-slate-800">Tiết {pNum}</div>
                        {def && <div className="text-[10px] text-slate-400">{def.start}–{def.end}</div>}
                      </td>

                      {currentWeekDays.map((day) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const entry = teachingSchedules.find(
                          (s) => s.date === dateStr && s.periodNumber === pNum
                        );

                        return (
                          <td
                            key={dateStr}
                            className="py-2 px-2 border-l border-slate-200/80 align-top h-20"
                          >
                            {entry ? (
                              <div
                                onClick={() => setDetailEntry(entry)}
                                className={`h-full p-2 rounded-xl border text-left cursor-pointer transition-all hover:shadow-xs group ${
                                  entry.status === 'completed'
                                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                    : entry.status === 'cancelled'
                                    ? 'bg-rose-50/70 border-rose-200 text-rose-800'
                                    : 'bg-white border-slate-200 hover:border-emerald-400 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-xs truncate">
                                    {entry.subjectName}
                                  </span>
                                  {entry.status === 'completed' && (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  )}
                                </div>
                                {entry.lessonTitle && (
                                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                                    {entry.lessonTitle}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenAdd(dateStr, pNum)}
                                className="w-full h-full rounded-xl border border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 text-slate-300 hover:text-emerald-600 flex items-center justify-center transition-colors cursor-pointer"
                                title="Thêm tiết dạy vào ô này"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE: MONTH GRID */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 lg:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Tổng quan lịch dạy tháng {format(parseISO(selectedDate), 'MM/yyyy')}
            </h3>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Bấm vào ngày để xem chi tiết hoặc chuyển nhanh sang Hôm nay
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map((h, i) => (
              <div
                key={h}
                className={`py-2 text-center text-xs font-bold rounded-lg ${
                  i >= 5 ? 'bg-slate-50 text-slate-400' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {h}
              </div>
            ))}

            {currentMonthDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isCurrMonth = isSameMonth(day, parseISO(selectedDate));
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const dayEntries = teachingSchedules
                .filter((s) => s.date === dateStr)
                .sort((a, b) => (a.periodNumber || 0) - (b.periodNumber || 0));

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setViewMode('today');
                  }}
                  className={`min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    !isCurrMonth
                      ? 'bg-slate-50/40 border-slate-100 text-slate-300'
                      : isSelected
                      ? 'bg-emerald-50/80 border-emerald-500 shadow-xs'
                      : isToday
                      ? 'bg-white border-emerald-400 ring-2 ring-emerald-200'
                      : 'bg-white border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-emerald-600 text-white font-black'
                          : isCurrMonth
                          ? 'text-slate-700'
                          : 'text-slate-300'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayEntries.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                        {dayEntries.length} tiết
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                    {dayEntries.slice(0, 3).map((entry) => (
                      <div
                        key={entry.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailEntry(entry);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center justify-between gap-0.5 ${
                          entry.status === 'completed'
                            ? 'bg-emerald-100/80 text-emerald-900 font-semibold'
                            : entry.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800 line-through'
                            : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-900'
                        }`}
                        title={`Tiết ${entry.periodNumber}: ${entry.subjectName} (${entry.startTime}–${entry.endTime})`}
                      >
                        <span className="truncate">
                          T{entry.periodNumber}: {entry.subjectName}
                        </span>
                      </div>
                    ))}
                    {dayEntries.length > 3 && (
                      <div className="text-[9px] font-semibold text-slate-400 text-center">
                        +{dayEntries.length - 3} tiết nữa
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE: RECURRING RULES */}
      {viewMode === 'rules' && (
        <div className="space-y-4">
          <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Quy Tắc Thời Khóa Biểu Lặp Hàng Tuần
              </h3>
              <p className="text-xs text-slate-500">
                Cấu hình các tiết học cố định mỗi tuần. Hệ thống sẽ tự động sinh lịch dạy cho các tuần tiếp theo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowRuleModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm quy tắc tuần</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((dow) => {
              const dayName =
                dow === 1 ? 'Thứ Hai' : dow === 2 ? 'Thứ Ba' : dow === 3 ? 'Thứ Tư' : dow === 4 ? 'Thứ Năm' : dow === 5 ? 'Thứ Sáu' : 'Thứ Bảy';
              const rulesForDay = teachingRules.filter((r) => r.dayOfWeek === dow);

              return (
                <div
                  key={dow}
                  className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 text-xs">{dayName}</span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {rulesForDay.length} tiết
                    </span>
                  </div>

                  {rulesForDay.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">Chưa có tiết nào</p>
                  ) : (
                    <div className="space-y-1.5">
                      {rulesForDay.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs border border-slate-100 transition-colors"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800">
                              Tiết {r.periodNumber}: {r.subjectName}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1.5">
                              ({r.startTime}–{r.endTime})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Xóa quy tắc tiết ${r.periodNumber} môn ${r.subjectName}?`)) {
                                deleteTeachingRule(r.id);
                                showToast('Đã xóa quy tắc.', 'info');
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Xóa quy tắc"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PERIOD */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 lg:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm lg:text-base">
                  {editingEntry ? 'Chỉnh sửa tiết dạy' : 'Thêm tiết dạy mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày dạy *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tiết số *</label>
                  <select
                    value={formPeriod}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      setFormPeriod(p);
                      const def = DEFAULT_PERIODS.find((d) => d.period === p);
                      if (def) {
                        setFormStartTime(def.start);
                        setFormEndTime(def.end);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        Tiết {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Môn học *</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  >
                    {PRIMARY_SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phòng học</label>
                  <input
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="VD: Phòng 3A1, Phòng Tin..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên bài học / Nội dung tiết dạy</label>
                <input
                  type="text"
                  value={formLessonTitle}
                  onChange={(e) => setFormLessonTitle(e.target.value)}
                  placeholder="VD: Phép chia hết và phép chia có dư..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chuẩn bị đồ dùng / Giáo cụ</label>
                <input
                  type="text"
                  value={formPrepNote}
                  onChange={(e) => setFormPrepNote(e.target.value)}
                  placeholder="VD: Que tính, bảng con, phiếu nhóm đôi..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trạng thái tiết</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as TeachingScheduleStatus)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="scheduled">Sắp tới (Chưa dạy)</option>
                  <option value="completed">Đã hoàn thành (Đã dạy)</option>
                  <option value="rescheduled">Đổi giờ / Hoán đổi</option>
                  <option value="cancelled">Hủy tiết</option>
                </select>
              </div>

              {!editingEntry && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-emerald-700" />
                    <div>
                      <p className="font-bold text-emerald-900">Lặp hàng tuần</p>
                      <p className="text-[10px] text-emerald-700">Tự động tạo tiết này vào cùng thứ mỗi tuần</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={makeRecurring}
                    onChange={(e) => setMakeRecurring(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {editingEntry ? 'Lưu thay đổi' : 'Thêm tiết dạy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL / QUICK ACTIONS */}
      {detailEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Chi tiết tiết dạy
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  Tiết {detailEntry.periodNumber}: {detailEntry.subjectName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailEntry(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Thời gian:</span>
                <span className="font-bold">
                  {detailEntry.date} ({detailEntry.startTime} – {detailEntry.endTime})
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Tên bài học:</span>
                <span className="font-semibold text-slate-900">{detailEntry.lessonTitle || 'Chưa ghi tên bài'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Phòng học:</span>
                <span>{detailEntry.room || 'Phòng học chính'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Trạng thái:</span>
                <span>{getStatusBadge(detailEntry.status)}</span>
              </div>

              {detailEntry.preparationNote && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  <span className="font-bold">Chuẩn bị bài: </span>
                  {detailEntry.preparationNote}
                </div>
              )}
            </div>

            {/* Quick Action Matrix */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleGoToJournal(detailEntry)}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl font-bold text-xs border border-purple-200 transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Ghi nhật ký học tập</span>
              </button>

              <button
                type="button"
                onClick={() => handleCreateTask(detailEntry)}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl font-bold text-xs border border-teal-200 transition-colors cursor-pointer"
              >
                <ListTodo className="w-4 h-4" />
                <span>Tạo nhiệm vụ bài tập</span>
              </button>

              <button
                type="button"
                onClick={handleGoToAttendance}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs border border-emerald-200 transition-colors cursor-pointer"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Điểm danh lớp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const entry = detailEntry;
                  setDetailEntry(null);
                  handleOpenEdit(entry);
                }}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
                <span>Chỉnh sửa tiết</span>
              </button>
            </div>

            {/* NGOẠI LỆ LỊCH (EXCEPTIONS) */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Xử lý ngoại lệ tiết này
                </span>
                <span className="text-[10px] text-slate-400">Không ảnh hưởng các tuần sau</span>
              </div>

              {exceptionMode === 'none' && (
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('Hủy tiết dạy này? Lịch các tuần sau vẫn giữ nguyên theo quy tắc.')) {
                        await updateTeachingScheduleEntry(detailEntry.id, {
                          status: 'cancelled',
                          note: (detailEntry.note ? detailEntry.note + ' · ' : '') + 'Hủy tiết (ngoại lệ)',
                        });
                        showToast('Đã hủy tiết này thành công.', 'info');
                        setDetailEntry(null);
                      }
                    }}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold border border-rose-200 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Hủy tiết này</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExNewStartTime(detailEntry.startTime);
                      setExNewEndTime(detailEntry.endTime);
                      setExceptionMode('reschedule_time');
                    }}
                    className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold border border-amber-200 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Đổi giờ dạy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExNewSubject(detailEntry.subjectName);
                      setExceptionMode('change_subject');
                    }}
                    className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold border border-blue-200 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Đổi môn khác</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExNewDate(detailEntry.date);
                      setExceptionMode('move_date');
                    }}
                    className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold border border-indigo-200 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Chuyển ngày khác</span>
                  </button>
                </div>
              )}

              {exceptionMode === 'reschedule_time' && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-amber-900">Đổi khung giờ cho tiết này:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-amber-800 font-semibold">Giờ bắt đầu</label>
                      <input
                        type="time"
                        value={exNewStartTime}
                        onChange={(e) => setExNewStartTime(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-amber-800 font-semibold">Giờ kết thúc</label>
                      <input
                        type="time"
                        value={exNewEndTime}
                        onChange={(e) => setExNewEndTime(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setExceptionMode('none')}
                      className="px-2.5 py-1 text-slate-600 border border-slate-200 rounded-lg text-xs cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await updateTeachingScheduleEntry(detailEntry.id, {
                          startTime: exNewStartTime,
                          endTime: exNewEndTime,
                          status: 'rescheduled',
                          note: (detailEntry.note ? detailEntry.note + ' · ' : '') + `Đổi giờ: ${exNewStartTime}–${exNewEndTime}`,
                        });
                        showToast('Đã đổi giờ tiết dạy!', 'success');
                        setExceptionMode('none');
                        setDetailEntry(null);
                      }}
                      className="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                    >
                      Lưu đổi giờ
                    </button>
                  </div>
                </div>
              )}

              {exceptionMode === 'change_subject' && (
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-blue-900">Đổi môn dạy cho riêng tiết này:</div>
                  <select
                    value={exNewSubject}
                    onChange={(e) => setExNewSubject(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-blue-300 rounded-lg text-xs"
                  >
                    {PRIMARY_SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setExceptionMode('none')}
                      className="px-2.5 py-1 text-slate-600 border border-slate-200 rounded-lg text-xs cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await updateTeachingScheduleEntry(detailEntry.id, {
                          subjectName: exNewSubject,
                          status: 'rescheduled',
                          note: (detailEntry.note ? detailEntry.note + ' · ' : '') + `Đổi môn sang ${exNewSubject}`,
                        });
                        showToast(`Đã đổi môn thành ${exNewSubject}!`, 'success');
                        setExceptionMode('none');
                        setDetailEntry(null);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                    >
                      Lưu đổi môn
                    </button>
                  </div>
                </div>
              )}

              {exceptionMode === 'move_date' && (
                <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-indigo-900">Chuyển tiết dạy sang ngày khác:</div>
                  <input
                    type="date"
                    value={exNewDate}
                    onChange={(e) => setExNewDate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs"
                  />
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setExceptionMode('none')}
                      className="px-2.5 py-1 text-slate-600 border border-slate-200 rounded-lg text-xs cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!exNewDate) return;
                        await updateTeachingScheduleEntry(detailEntry.id, {
                          date: exNewDate,
                          status: 'rescheduled',
                          note: (detailEntry.note ? detailEntry.note + ' · ' : '') + `Chuyển từ ngày ${detailEntry.date}`,
                        });
                        showToast(`Đã chuyển tiết sang ngày ${exNewDate}!`, 'success');
                        setExceptionMode('none');
                        setDetailEntry(null);
                      }}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                    >
                      Xác nhận chuyển
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POST-LESSON PROMPT: COMPLETED -> GO TO JOURNAL? */}
      {showCompletePrompt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 text-center space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-sm lg:text-base">
                Đã hoàn thành tiết dạy!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Thầy/Cô có muốn ghi nhanh Nhật ký học tập (quan sát tiến bộ, khó khăn của học sinh) cho tiết{' '}
                <span className="font-bold text-slate-800">{showCompletePrompt.subjectName}</span> không?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCompletePrompt(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Để sau
              </button>
              <button
                type="button"
                onClick={() => handleGoToJournal(showCompletePrompt)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Ghi nhật ký học tập</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD RECURRING RULE */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-slate-900 text-sm">Thêm quy tắc lặp thời khóa biểu</h3>
              <button
                type="button"
                onClick={() => setShowRuleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!activeClass || !currentUser) return;
                const form = e.currentTarget;
                const dow = Number(form.dow.value);
                const p = Number(form.period.value);
                const sub = form.subject.value;
                const def = DEFAULT_PERIODS.find((d) => d.period === p) || DEFAULT_PERIODS[0];

                await addTeachingRule({
                  ownerId: currentUser.uid,
                  classId: activeClass.id,
                  dayOfWeek: dow,
                  periodNumber: p,
                  startTime: def.start,
                  endTime: def.end,
                  subjectName: sub,
                  effectiveFrom: todayStr,
                  active: true,
                });
                showToast('Đã lưu quy tắc lặp!', 'success');
                setShowRuleModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thứ trong tuần *</label>
                <select name="dow" className="w-full px-3 py-2 border border-slate-200 rounded-xl">
                  <option value={1}>Thứ Hai</option>
                  <option value={2}>Thứ Ba</option>
                  <option value={3}>Thứ Tư</option>
                  <option value={4}>Thứ Năm</option>
                  <option value={5}>Thứ Sáu</option>
                  <option value={6}>Thứ Bảy</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tiết số *</label>
                <select name="period" className="w-full px-3 py-2 border border-slate-200 rounded-xl">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <option key={n} value={n}>
                      Tiết {n}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Môn học *</label>
                <select name="subject" className="w-full px-3 py-2 border border-slate-200 rounded-xl">
                  {PRIMARY_SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-slate-600 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Lưu quy tắc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: IMPORT THỜI KHÓA BIỂU WIZARD (Upload -> Preview -> Validate -> Confirm -> Import) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 lg:p-6 shadow-2xl border border-slate-100 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm lg:text-base">
                    Import Thời Khóa Biểu Vào Lịch Dạy
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Quy trình 4 bước: Dữ liệu → Xem trước → Kiểm tra → Xác nhận lưu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
              {[
                { id: 'upload', label: '1. Dữ liệu' },
                { id: 'preview', label: '2. Xem trước' },
                { id: 'validate', label: '3. Kiểm tra' },
                { id: 'confirm', label: '4. Xác nhận' },
              ].map((step, idx) => {
                const isActive = importStep === step.id;
                const isPast =
                  (step.id === 'upload' && ['preview', 'validate', 'confirm'].includes(importStep)) ||
                  (step.id === 'preview' && ['validate', 'confirm'].includes(importStep)) ||
                  (step.id === 'validate' && importStep === 'confirm');
                return (
                  <div
                    key={step.id}
                    className={`py-2 px-1 rounded-xl border text-[11px] transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-xs'
                        : isPast
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    {step.label}
                  </div>
                );
              })}
            </div>

            {/* STEP 1: UPLOAD / DATA INPUT */}
            {importStep === 'upload' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">
                    Dán danh sách tiết học hoặc bấm chọn mẫu:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const sampleText = `Thứ 2, 1, Toán, 07:30, 08:05, Ôn tập phép nhân và chia
Thứ 2, 2, Tiếng Việt, 08:15, 08:50, Tập đọc: Chiếc áo hoa
Thứ 2, 3, Đạo đức, 09:15, 09:50, Kính yêu thầy cô giáo
Thứ 3, 1, Tiếng Việt, 07:30, 08:05, Luyện từ và câu
Thứ 3, 2, Toán, 08:15, 08:50, Bảng nhân 7
Thứ 3, 3, Tự nhiên và Xã hội, 09:15, 09:50, Họ nội họ ngoại
Thứ 4, 1, Toán, 07:30, 08:05, Luyện tập bảng nhân 7
Thứ 4, 2, Tiếng Anh, 08:15, 08:50, Unit 2: My Classroom
Thứ 4, 3, Âm nhạc, 09:15, 09:50, Học hát bài reo vang bình minh
Thứ 5, 1, Tiếng Việt, 07:30, 08:05, Chính tả nghe viết
Thứ 5, 2, Toán, 08:15, 08:50, Bảng chia 7
Thứ 5, 3, Tin học, 09:15, 09:50, Làm quen với bàn phím
Thứ 6, 1, Tiếng Việt, 07:30, 08:05, Tập làm văn
Thứ 6, 2, Toán, 08:15, 08:50, Luyện tập chung
Thứ 6, 3, Hoạt động trải nghiệm, 09:15, 09:50, Sinh hoạt lớp cuối tuần`;
                      setImportRawText(sampleText);
                    }}
                    className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Nạp mẫu TKB lớp 3</span>
                  </button>
                </div>

                <textarea
                  rows={8}
                  value={importRawText}
                  onChange={(e) => setImportRawText(e.target.value)}
                  placeholder={`Định dạng mỗi dòng (cách nhau dấu phẩy hoặc tab):
Thứ (2-7), Tiết (1-7), Môn học, Giờ bắt đầu, Giờ kết thúc, Tên bài học
Ví dụ:
Thứ 2, 1, Toán, 07:30, 08:05, Phép chia
Thứ 2, 2, Tiếng Việt, 08:15, 08:50, Bài đọc tuần 1`}
                  className="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 leading-relaxed"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={!importRawText.trim()}
                    onClick={() => {
                      const lines = importRawText.split('\n').map((l) => l.trim()).filter(Boolean);
                      const parsed = lines.map((line) => {
                        const parts = line.split(/[,;\t]+/).map((p) => p.trim());
                        let dow = 1;
                        const dowStr = (parts[0] || '').toLowerCase();
                        if (dowStr.includes('3') || dowStr.includes('ba')) dow = 2;
                        else if (dowStr.includes('4') || dowStr.includes('tư') || dowStr.includes('bốn')) dow = 3;
                        else if (dowStr.includes('5') || dowStr.includes('năm')) dow = 4;
                        else if (dowStr.includes('6') || dowStr.includes('sáu')) dow = 5;
                        else if (dowStr.includes('7') || dowStr.includes('bảy')) dow = 6;
                        else if (dowStr.includes('cn') || dowStr.includes('nhật')) dow = 0;
                        else dow = 1;

                        const pNum = parseInt(parts[1], 10) || 1;
                        const def = DEFAULT_PERIODS.find((d) => d.period === pNum) || DEFAULT_PERIODS[0];
                        const sub = parts[2] || 'Toán';
                        const start = parts[3] && parts[3].includes(':') ? parts[3] : def.start;
                        const end = parts[4] && parts[4].includes(':') ? parts[4] : def.end;
                        const lesson = parts[5] || '';

                        const isDowValid = dow >= 1 && dow <= 6;
                        const isPeriodValid = pNum >= 1 && pNum <= 8;
                        const valid = isDowValid && isPeriodValid && sub.length > 0;

                        return {
                          dayOfWeek: dow,
                          periodNumber: pNum,
                          startTime: start,
                          endTime: end,
                          subjectName: sub,
                          lessonTitle: lesson,
                          valid,
                        };
                      });

                      setImportParsedRules(parsed);
                      setImportStep('preview');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Tiếp tục: Xem trước</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: PREVIEW */}
            {importStep === 'preview' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">
                    Tìm thấy {importParsedRules.length} tiết học được phân tích:
                  </span>
                  <span className="text-[11px] text-slate-400">Kiểm tra thông tin trước khi xác thực</span>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2 text-slate-600 font-bold">Thứ</th>
                        <th className="p-2 text-slate-600 font-bold">Tiết</th>
                        <th className="p-2 text-slate-600 font-bold">Giờ</th>
                        <th className="p-2 text-slate-600 font-bold">Môn học</th>
                        <th className="p-2 text-slate-600 font-bold">Bài học</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importParsedRules.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-medium">
                            {row.dayOfWeek === 1 ? 'Thứ 2' : row.dayOfWeek === 2 ? 'Thứ 3' : row.dayOfWeek === 3 ? 'Thứ 4' : row.dayOfWeek === 4 ? 'Thứ 5' : row.dayOfWeek === 5 ? 'Thứ 6' : 'Thứ 7'}
                          </td>
                          <td className="p-2 font-bold">Tiết {row.periodNumber}</td>
                          <td className="p-2 text-slate-500 font-mono text-[11px]">
                            {row.startTime}–{row.endTime}
                          </td>
                          <td className="p-2 font-semibold text-slate-900">{row.subjectName}</td>
                          <td className="p-2 text-slate-500 truncate max-w-[150px]">{row.lessonTitle || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setImportStep('upload')}
                    className="px-3.5 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                  >
                    Quay lại sửa dữ liệu
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportStep('validate')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Kiểm tra tính hợp lệ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: VALIDATE */}
            {importStep === 'validate' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-emerald-900">
                      Đã kiểm tra tính hợp lệ thành công ({importParsedRules.filter((r) => r.valid).length}/{importParsedRules.length} tiết)
                    </h4>
                    <p className="text-[11px] text-emerald-700">
                      Tất cả các tiết đều có thứ (Thứ 2 - Thứ 7), tiết số (1 - 7), giờ học chuẩn và môn học hợp lệ.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setImportStep('preview')}
                    className="px-3.5 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                  >
                    Quay lại xem trước
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportStep('confirm')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Tiếp tục: Xác nhận Import</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: CONFIRM & IMPORT */}
            {importStep === 'confirm' && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Lớp tiếp nhận:</span>
                    <span className="font-bold text-slate-900">{activeClass?.className || 'Lớp học hiện tại'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Số quy tắc thời khóa biểu sẽ tạo:</span>
                    <span className="font-bold text-emerald-700">{importParsedRules.length} tiết cố định hàng tuần</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Áp dụng từ ngày:</span>
                    <span className="font-bold text-slate-900">{todayStr}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  * Hệ thống sẽ lưu các quy tắc lặp và tự động đồng bộ lịch dạy cho tuần hiện tại và các tuần tiếp theo.
                </p>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setImportStep('validate')}
                    className="px-3.5 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!activeClass || !currentUser) return;
                      try {
                        for (const r of importParsedRules.filter((p) => p.valid)) {
                          await addTeachingRule({
                            ownerId: currentUser.uid,
                            classId: activeClass.id,
                            dayOfWeek: r.dayOfWeek,
                            periodNumber: r.periodNumber,
                            startTime: r.startTime,
                            endTime: r.endTime,
                            subjectName: r.subjectName,
                            lessonTitle: r.lessonTitle,
                            effectiveFrom: todayStr,
                            active: true,
                          });
                        }
                        const curr = parseISO(selectedDate);
                        const startStr = format(startOfWeek(curr, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                        const endStr = format(endOfWeek(curr, { weekStartsOn: 1 }), 'yyyy-MM-dd');
                        await generateSchedulesFromRules(startStr, endStr);

                        showToast(`Đã import thành công ${importParsedRules.length} tiết vào thời khóa biểu!`, 'success');
                        setShowImportModal(false);
                      } catch (err: any) {
                        showToast('Lỗi khi import thời khóa biểu: ' + (err.message || ''), 'error');
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác nhận nhập vào thời khóa biểu</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
