import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AttendanceRecord, AttendanceStatus } from '../../types';
import { AttendanceRepository } from '../../repositories/dataRepository';
import { ImportExportService } from '../../services/importExportService';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Save,
  RotateCcw,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  Printer,
  CalendarRange,
  Users,
  Search,
} from 'lucide-react';
import {
  format,
  subDays,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { vi } from 'date-fns/locale';

export const AttendanceView: React.FC = () => {
  const {
    activeClass,
    currentUser,
    students,
    attendanceRecords,
    refreshAttendance,
    showToast,
    setActiveTab,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'stats'>('day');

  // Custom date range state for Summary / Report mode
  const [statsPreset, setStatsPreset] = useState<'this_month' | 'last_month' | 'last_30_days' | 'custom'>('this_month');
  const [rangeStartDate, setRangeStartDate] = useState<string>(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [rangeEndDate, setRangeEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [statsSearchTerm, setStatsSearchTerm] = useState<string>('');
  const [statsGroupFilter, setStatsGroupFilter] = useState<string>('all');

  // Local state for the selected date's attendance rows
  const [currentMap, setCurrentMap] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync current map when selectedDate or attendanceRecords changes
  useEffect(() => {
    const map: Record<string, { status: AttendanceStatus; notes: string }> = {};
    const dateRecs = attendanceRecords.filter((r) => r.date === selectedDate);
    const recByStudent = new Map(dateRecs.map((r) => [r.studentId, r]));

    students.forEach((s) => {
      const rec = recByStudent.get(s.id);
      if (rec) {
        map[s.id] = { status: rec.status, notes: rec.notes || '' };
      } else {
        // Default: present
        map[s.id] = { status: 'present', notes: '' };
      }
    });

    setCurrentMap(map);
    setHasChanges(false);
  }, [selectedDate, students, attendanceRecords]);

  // Fast Cycle Status: present -> excused -> unexcused -> late -> present
  const cycleStatus = (studentId: string) => {
    const current = currentMap[studentId]?.status || 'present';
    let next: AttendanceStatus = 'present';
    if (current === 'present') next = 'excused_absence';
    else if (current === 'excused_absence') next = 'unexcused_absence';
    else if (current === 'unexcused_absence') next = 'late';
    else if (current === 'late') next = 'present';

    setCurrentMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: next,
      },
    }));
    setHasChanges(true);
  };

  const setDirectStatus = (studentId: string, status: AttendanceStatus) => {
    setCurrentMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
    setHasChanges(true);
  };

  const updateNotes = (studentId: string, notes: string) => {
    setCurrentMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }));
    setHasChanges(true);
  };

  const setAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; notes: string }> = {};
    students.forEach((s) => {
      updated[s.id] = { status: 'present', notes: '' };
    });
    setCurrentMap(updated);
    setHasChanges(true);
    showToast('Đã đặt tất cả học sinh có mặt');
  };

  const handleSave = async () => {
    if (!activeClass || !currentUser) return;
    if (!hasChanges) {
      showToast(`Dữ liệu điểm danh ngày ${selectedDate} đã được lưu và đồng bộ mới nhất.`, 'info');
      return;
    }
    setSaving(true);
    try {
      const batchPayload = students.map((s) => ({
        studentId: s.id,
        status: currentMap[s.id]?.status || 'present',
        notes: currentMap[s.id]?.notes || '',
      }));

      await AttendanceRepository.saveAttendanceBatch(activeClass.id, currentUser.uid, selectedDate, batchPayload);
      await refreshAttendance();
      setHasChanges(false);
      showToast(`Đã lưu bảng điểm danh ngày ${selectedDate}!`);
    } catch (err: any) {
      showToast('Lỗi khi lưu điểm danh: ' + (err.message || ''), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle quick date presets
  const applyStatsPreset = (preset: 'this_month' | 'last_month' | 'last_30_days' | 'custom') => {
    setStatsPreset(preset);
    const now = new Date();
    if (preset === 'this_month') {
      setRangeStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
      setRangeEndDate(format(now, 'yyyy-MM-dd'));
    } else if (preset === 'last_month') {
      const prev = subMonths(now, 1);
      setRangeStartDate(format(startOfMonth(prev), 'yyyy-MM-dd'));
      setRangeEndDate(format(endOfMonth(prev), 'yyyy-MM-dd'));
    } else if (preset === 'last_30_days') {
      setRangeStartDate(format(subDays(now, 29), 'yyyy-MM-dd'));
      setRangeEndDate(format(now, 'yyyy-MM-dd'));
    }
  };

  // Filtered attendance records within custom date range
  const rangeRecords = React.useMemo(() => {
    const start = rangeStartDate || '2000-01-01';
    const end = rangeEndDate || '2099-12-31';
    return attendanceRecords.filter((r) => r.date >= start && r.date <= end);
  }, [attendanceRecords, rangeStartDate, rangeEndDate]);

  // Distinct dates in the selected range that have attendance data
  const rangeRecordedDates = React.useMemo(() => {
    return Array.from(new Set(rangeRecords.map((r) => r.date))).sort();
  }, [rangeRecords]);

  // Comprehensive Student Summary Rows for the chosen range
  const summaryReportData = React.useMemo(() => {
    const totalRecordedDays = rangeRecordedDates.length;

    const list = students.map((s, idx) => {
      const sRecs = rangeRecords.filter((r) => r.studentId === s.id);
      const present = sRecs.filter((r) => r.status === 'present').length;
      const excused = sRecs.filter((r) => r.status === 'excused_absence').length;
      const unexcused = sRecs.filter((r) => r.status === 'unexcused_absence').length;
      const late = sRecs.filter((r) => r.status === 'late').length;
      const totalRecorded = sRecs.length;

      // Rate: present out of total sessions recorded for this student (or total range dates)
      const denominator = totalRecorded > 0 ? totalRecorded : totalRecordedDays > 0 ? totalRecordedDays : 1;
      const attendanceRate = totalRecorded > 0 ? Math.round((present / denominator) * 100) : 100;

      let statusNote = 'Chuyên cần tốt';
      if (unexcused > 0) {
        statusNote = `Cần nhắc nhở (Nghỉ KP: ${unexcused})`;
      } else if (excused >= 3) {
        statusNote = `Nghỉ phép nhiều (${excused} buổi)`;
      } else if (late >= 3) {
        statusNote = `Thường xuyên đi muộn (${late} lần)`;
      } else if (attendanceRate === 100 && totalRecorded > 0) {
        statusNote = 'Đi học đầy đủ 100%';
      }

      return {
        stt: idx + 1,
        id: s.id,
        studentCode: s.studentCode || '',
        fullName: s.fullName,
        groupId: s.groupId || 'Tổ 1',
        totalDays: totalRecorded,
        present,
        excused,
        unexcused,
        late,
        totalAbsence: excused + unexcused,
        attendanceRate,
        statusNote,
      };
    });

    return list;
  }, [students, rangeRecords, rangeRecordedDates]);

  // Filtered list by search and group
  const filteredSummaryList = React.useMemo(() => {
    return summaryReportData.filter((r) => {
      const matchSearch =
        statsSearchTerm.trim() === '' ||
        r.fullName.toLowerCase().includes(statsSearchTerm.toLowerCase()) ||
        r.studentCode.toLowerCase().includes(statsSearchTerm.toLowerCase());
      const matchGroup = statsGroupFilter === 'all' || r.groupId === statsGroupFilter;
      return matchSearch && matchGroup;
    });
  }, [summaryReportData, statsSearchTerm, statsGroupFilter]);

  // Aggregate totals for the range report
  const summaryTotals = React.useMemo(() => {
    const totalStudents = summaryReportData.length;
    const totalExcused = summaryReportData.reduce((acc, cur) => acc + cur.excused, 0);
    const totalUnexcused = summaryReportData.reduce((acc, cur) => acc + cur.unexcused, 0);
    const totalLate = summaryReportData.reduce((acc, cur) => acc + cur.late, 0);
    const perfectAttendanceCount = summaryReportData.filter((r) => r.attendanceRate === 100 && r.totalDays > 0).length;
    const avgRate =
      totalStudents > 0
        ? Math.round(summaryReportData.reduce((acc, cur) => acc + cur.attendanceRate, 0) / totalStudents)
        : 100;

    return {
      totalStudents,
      totalRecordedDays: rangeRecordedDates.length,
      totalExcused,
      totalUnexcused,
      totalLate,
      perfectAttendanceCount,
      avgAttendanceRate: avgRate,
    };
  }, [summaryReportData, rangeRecordedDates]);

  // Export custom range report to Excel
  const handleExportRangeReport = () => {
    if (!activeClass) return;
    ImportExportService.exportAttendanceSummaryReportToExcel(
      activeClass.className,
      rangeStartDate,
      rangeEndDate,
      summaryReportData,
      summaryTotals
    );
    showToast(`Đã xuất báo cáo tổng kết điểm danh từ ${rangeStartDate} đến ${rangeEndDate}!`, 'success');
  };

  // Day summary stats
  const dayStats = React.useMemo(() => {
    const vals = Object.values(currentMap);
    const present = vals.filter((v) => v.status === 'present').length;
    const excused = vals.filter((v) => v.status === 'excused_absence').length;
    const unexcused = vals.filter((v) => v.status === 'unexcused_absence').length;
    const late = vals.filter((v) => v.status === 'late').length;
    return { present, excused, unexcused, late, total: students.length };
  }, [currentMap, students.length]);

  // Week Interval dates
  const weekDays = React.useMemo(() => {
    const cur = new Date(selectedDate);
    const start = startOfWeek(cur, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(cur, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end }).slice(0, 5); // Mon - Fri
  }, [selectedDate]);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Sổ Điểm Danh Chuyên Cần
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Điểm danh 1 chạm siêu nhanh · Thống kê tự động theo Thông tư 27
          </p>
        </div>

        {/* View Switcher & Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'day' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Theo ngày
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Theo tuần
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'stats' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Tổng kết
            </button>
          </div>

          <button
            onClick={() => {
              if (activeClass) {
                const dates = Array.from(new Set(attendanceRecords.map((r) => r.date))).sort();
                ImportExportService.exportAttendanceToExcel(activeClass.className, dates, students, attendanceRecords);
              }
            }}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            title="Xuất bảng điểm danh Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Date Control Bar (For Day and Week mode) */}
      {(viewMode === 'day' || viewMode === 'week') && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 cursor-pointer"
              title="Ngày trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />

            <button
              onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 cursor-pointer"
              title="Ngày sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Hôm nay
            </button>
          </div>

          {viewMode === 'day' && (
            <div className="flex items-center gap-2">
              <button
                onClick={setAllPresent}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Tất cả có mặt</span>
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-4 py-1.5 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                  hasChanges ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-500/20' : 'bg-slate-800 hover:bg-slate-900'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Đang lưu...' : hasChanges ? 'Lưu thay đổi' : 'Đã đồng bộ'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Daily Summary Counters */}
      {viewMode === 'day' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-800">Có mặt</span>
              <p className="text-xl font-extrabold text-emerald-900">{dayStats.present}</p>
            </div>
            <span className="text-xs font-bold text-emerald-700">
              {Math.round((dayStats.present / (dayStats.total || 1)) * 100)}%
            </span>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-800">Nghỉ có phép</span>
              <p className="text-xl font-extrabold text-amber-900">{dayStats.excused}</p>
            </div>
            <AlertCircle className="w-5 h-5 text-amber-600 opacity-60" />
          </div>

          <div className="bg-red-50/70 border border-red-200 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-red-800">Nghỉ không phép</span>
              <p className="text-xl font-extrabold text-red-900">{dayStats.unexcused}</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-red-600 opacity-60" />
          </div>

          <div className="bg-purple-50/70 border border-purple-200 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-purple-800">Đi học muộn</span>
              <p className="text-xl font-extrabold text-purple-900">{dayStats.late}</p>
            </div>
            <Clock className="w-5 h-5 text-purple-600 opacity-60" />
          </div>
        </div>
      )}

      {/* 1. VIEW MODE: DAILY 1-CLICK ROSTER */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>
              Chạm vào hàng hoặc nút trạng thái để chuyển đổi trạng thái (Có mặt ➔ Có phép ➔ Không phép ➔ Muộn)
            </span>
            <span className="font-semibold text-slate-700">Sĩ số: {students.length}</span>
          </div>

          <div className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Lớp chưa có học sinh nào để điểm danh.
              </div>
            ) : (
              students.map((student, idx) => {
                const state = currentMap[student.id] || { status: 'present', notes: '' };
                const isPresent = state.status === 'present';
                const isExcused = state.status === 'excused_absence';
                const isUnexcused = state.status === 'unexcused_absence';
                const isLate = state.status === 'late';

                return (
                  <div
                    key={student.id}
                    className="p-3.5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-400 w-6 text-center">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-sm font-bold text-slate-900">{student.fullName}</span>
                        <span className="text-slate-400 text-xs ml-2">
                          ({student.studentCode || student.groupId})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {/* 4 Status Pills */}
                      <div className="inline-flex rounded-xl p-1 bg-slate-100 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setDirectStatus(student.id, 'present')}
                          className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                            isPresent
                              ? 'bg-emerald-600 text-white shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Có mặt
                        </button>
                        <button
                          type="button"
                          onClick={() => setDirectStatus(student.id, 'excused_absence')}
                          className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                            isExcused
                              ? 'bg-amber-600 text-white shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Có phép
                        </button>
                        <button
                          type="button"
                          onClick={() => setDirectStatus(student.id, 'unexcused_absence')}
                          className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                            isUnexcused
                              ? 'bg-red-600 text-white shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Không phép
                        </button>
                        <button
                          type="button"
                          onClick={() => setDirectStatus(student.id, 'late')}
                          className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                            isLate
                              ? 'bg-purple-600 text-white shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Đi muộn
                        </button>
                      </div>

                      {/* Notes Input */}
                      <input
                        type="text"
                        value={state.notes}
                        onChange={(e) => updateNotes(student.id, e.target.value)}
                        placeholder="Lý do vắng / ghi chú..."
                        className="w-full sm:w-48 px-3 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. VIEW MODE: WEEK MATRIX */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 min-w-[160px]">Họ và tên</th>
                <th className="py-3 px-4">Tổ</th>
                {weekDays.map((d, i) => (
                  <th key={i} className="py-3 px-4 text-center">
                    <div>{format(d, 'EEEE', { locale: vi })}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{format(d, 'dd/MM')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-center text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{s.fullName}</td>
                  <td className="py-3 px-4 text-slate-500">{s.groupId}</td>
                  {weekDays.map((d, i) => {
                    const dStr = format(d, 'yyyy-MM-dd');
                    const rec = attendanceRecords.find((r) => r.studentId === s.id && r.date === dStr);
                    let badge = <span className="text-slate-300">-</span>;
                    if (rec) {
                      if (rec.status === 'present') {
                        badge = <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">Có mặt</span>;
                      } else if (rec.status === 'excused_absence') {
                        badge = <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">Phép</span>;
                      } else if (rec.status === 'unexcused_absence') {
                        badge = <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px]">Không phép</span>;
                      } else if (rec.status === 'late') {
                        badge = <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">Muộn</span>;
                      }
                    }
                    return (
                      <td key={i} className="py-3 px-4 text-center">
                        {badge}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. VIEW MODE: SUMMARY STATS & CUSTOM TIME RANGE REPORT */}
      {viewMode === 'stats' && (
        <div className="space-y-5">
          {/* Custom Date Range Selector & Action Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <CalendarRange className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Báo Cáo Tổng Kết Chuyên Cần Theo Mốc Thời Gian
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tùy chọn khoảng thời gian từ ngày đến ngày · Thống kê số buổi nghỉ, đi muộn & phân loại học sinh
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Export Excel & Print */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportRangeReport}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Xuất Báo Cáo Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>In Báo Cáo</span>
                </button>
              </div>
            </div>

            {/* Time Presets & Range Inputs */}
            <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-600 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mốc nhanh:</span>
                </span>
                <button
                  type="button"
                  onClick={() => applyStatsPreset('this_month')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    statsPreset === 'this_month'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tháng này
                </button>
                <button
                  type="button"
                  onClick={() => applyStatsPreset('last_month')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    statsPreset === 'last_month'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tháng trước
                </button>
                <button
                  type="button"
                  onClick={() => applyStatsPreset('last_30_days')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    statsPreset === 'last_30_days'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  30 ngày gần nhất
                </button>
                <button
                  type="button"
                  onClick={() => setStatsPreset('custom')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    statsPreset === 'custom'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tùy chọn tự do
                </button>
              </div>

              {/* Exact Date Range Inputs */}
              <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium pl-1">Từ ngày:</span>
                <input
                  type="date"
                  value={rangeStartDate}
                  onChange={(e) => {
                    setRangeStartDate(e.target.value);
                    setStatsPreset('custom');
                  }}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-slate-400 font-bold">→</span>
                <span className="text-slate-500 font-medium">Đến ngày:</span>
                <input
                  type="date"
                  value={rangeEndDate}
                  onChange={(e) => {
                    setRangeEndDate(e.target.value);
                    setStatsPreset('custom');
                  }}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 4 Summary Stat Cards for this chosen interval */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Tỷ lệ chuyên cần TB
                </span>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  {summaryTotals.avgAttendanceRate}%
                </p>
                <span className="text-[10px] text-slate-400">
                  {summaryTotals.perfectAttendanceCount}/{summaryTotals.totalStudents} em đạt 100%
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Nghỉ có phép (P)
                </span>
                <p className="text-2xl font-black text-amber-600 mt-1">
                  {summaryTotals.totalExcused}
                </p>
                <span className="text-[10px] text-slate-400">Lượt nghỉ có phép</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                  Nghỉ không phép (KP)
                </span>
                <p className="text-2xl font-black text-rose-600 mt-1">
                  {summaryTotals.totalUnexcused}
                </p>
                <span className="text-[10px] text-slate-400">Cần liên hệ gia đình</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                  Đi học muộn (M)
                </span>
                <p className="text-2xl font-black text-purple-600 mt-1">
                  {summaryTotals.totalLate}
                </p>
                <span className="text-[10px] text-slate-400">Lượt đi học muộn</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Detailed Student Report Table with Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Header Filter Bar */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Bảng Chi Tiết Học Sinh Trong Kỳ Báo Cáo
                </h4>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold">
                  {filteredSummaryList.length}/{students.length} em
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={statsSearchTerm}
                    onChange={(e) => setStatsSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên / mã HS..."
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44"
                  />
                </div>

                {/* Group Filter */}
                <select
                  value={statsGroupFilter}
                  onChange={(e) => setStatsGroupFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
                >
                  <option value="all">Tất cả các tổ</option>
                  <option value="Tổ 1">Tổ 1</option>
                  <option value="Tổ 2">Tổ 2</option>
                  <option value="Tổ 3">Tổ 3</option>
                  <option value="Tổ 4">Tổ 4</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3.5 w-12 text-center">STT</th>
                    <th className="py-3 px-3.5 min-w-[160px]">Họ và tên</th>
                    <th className="py-3 px-3.5 w-16">Tổ</th>
                    <th className="py-3 px-3.5 text-center font-bold text-emerald-800">Có mặt</th>
                    <th className="py-3 px-3.5 text-center font-bold text-amber-800">Có phép (P)</th>
                    <th className="py-3 px-3.5 text-center font-bold text-rose-800">Không phép (KP)</th>
                    <th className="py-3 px-3.5 text-center font-bold text-purple-800">Muộn (M)</th>
                    <th className="py-3 px-3.5 text-center min-w-[140px]">Tỷ lệ chuyên cần</th>
                    <th className="py-3 px-3.5 min-w-[150px]">Đánh giá / Phân loại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSummaryList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Không tìm thấy học sinh nào phù hợp bộ lọc
                      </td>
                    </tr>
                  ) : (
                    filteredSummaryList.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3.5 text-center text-slate-400 font-medium">
                          {row.stt}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="font-bold text-slate-900">{row.fullName}</div>
                          {row.studentCode && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {row.studentCode}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-500 font-medium">
                          {row.groupId}
                        </td>
                        <td className="py-2.5 px-3.5 text-center font-semibold text-emerald-700 bg-emerald-50/30">
                          {row.present}
                        </td>
                        <td className="py-2.5 px-3.5 text-center font-semibold text-amber-700">
                          {row.excused > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                              {row.excused}
                            </span>
                          ) : (
                            <span className="text-slate-300">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-center font-semibold text-rose-700">
                          {row.unexcused > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                              {row.unexcused}
                            </span>
                          ) : (
                            <span className="text-slate-300">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-center font-semibold text-purple-700">
                          {row.late > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                              {row.late}
                            </span>
                          ) : (
                            <span className="text-slate-300">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span
                                className={
                                  row.attendanceRate >= 95
                                    ? 'text-emerald-700'
                                    : row.attendanceRate >= 85
                                    ? 'text-teal-700'
                                    : 'text-rose-700'
                                }
                              >
                                {row.attendanceRate}%
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {row.present}/{row.totalDays || summaryTotals.totalRecordedDays || 0} buổi
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${row.attendanceRate}%` }}
                                className={`h-full rounded-full ${
                                  row.attendanceRate >= 95
                                    ? 'bg-emerald-500'
                                    : row.attendanceRate >= 85
                                    ? 'bg-teal-500'
                                    : 'bg-rose-500'
                                }`}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              row.unexcused > 0
                                ? 'bg-rose-100 text-rose-800'
                                : row.excused >= 3
                                ? 'bg-amber-100 text-amber-800'
                                : row.late >= 3
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {row.statusNote}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
