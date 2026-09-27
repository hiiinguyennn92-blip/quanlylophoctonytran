import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ClassRepository } from '../../repositories/dataRepository';
import { BackupService } from '../../services/backupService';
import {
  Settings,
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Sparkles,
  School,
  Save,
  CheckCircle,
  AlertTriangle,
  User,
  PartyPopper,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    activeClass,
    currentUser,
    classes,
    setActiveClassId,
    refreshClasses,
    refreshActiveData,
    seedDemoClass,
    showToast,
    setShowOnboarding,
    setWelcomeModalUser,
  } = useApp();

  // Class settings form
  const [schoolName, setSchoolName] = useState(activeClass?.schoolName || '');
  const [className, setClassName] = useState(activeClass?.className || '');
  const [schoolYear, setSchoolYear] = useState(activeClass?.schoolYear || '');
  const [teacherName, setTeacherName] = useState(activeClass?.teacherName || '');
  const [expectedCount, setExpectedCount] = useState(activeClass?.expectedStudentCount || 35);
  const [savingClass, setSavingClass] = useState(false);

  // Backup state
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  // Restore Modal State (Preview -> Validate -> Confirm -> Persist)
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<{
    fileName: string;
    fileSize: string;
    rawContent: string;
  } | null>(null);
  const [restoreValidation, setRestoreValidation] = useState<{
    valid: boolean;
    summary?: any;
    error?: string;
  } | null>(null);
  const [restoreStrategy, setRestoreStrategy] = useState<'create_new' | 'overwrite_existing'>('create_new');
  const [overwriteConfirmed, setOverwriteConfirmed] = useState(false);

  // Reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [classToDelete, setClassToDelete] = useState<any | null>(null);
  const [deletingClass, setDeletingClass] = useState(false);

  React.useEffect(() => {
    if (activeClass) {
      setSchoolName(activeClass.schoolName);
      setClassName(activeClass.className);
      setSchoolYear(activeClass.schoolYear);
      setTeacherName(activeClass.teacherName);
      setExpectedCount(activeClass.expectedStudentCount || 35);
    }
  }, [activeClass]);

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass) return;
    setSavingClass(true);
    try {
      await ClassRepository.updateClass(activeClass.id, {
        schoolName,
        className,
        schoolYear,
        teacherName,
        expectedStudentCount: Number(expectedCount),
      });

      await refreshClasses();
      showToast('Đã lưu thông tin lớp học thành công!');
    } catch (err: any) {
      showToast('Lỗi khi lưu thông tin: ' + (err.message || ''), 'error');
    } finally {
      setSavingClass(false);
    }
  };

  const handleBackupDownload = async () => {
    if (!activeClass || !currentUser) return;
    setExporting(true);
    try {
      await BackupService.exportClassBackup(activeClass.id, activeClass.className, currentUser.uid);
      showToast('Đã tải tệp sao lưu JSON về máy an toàn!');
    } catch (err: any) {
      showToast('Lỗi khi tạo sao lưu: ' + (err.message || ''), 'error');
    } finally {
      setExporting(false);
    }
  };

  // Step 1 & 2: Preview & Validate file before any restore
  const handleSelectRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeClass || !currentUser) return;
    try {
      const rawText = await file.text();
      const fileSizeKb = (file.size / 1024).toFixed(1) + ' KB';
      const validation = BackupService.validateBackupFile(rawText, {
        id: activeClass.id,
        className: activeClass.className,
      });

      setPendingRestoreFile({
        fileName: file.name,
        fileSize: fileSizeKb,
        rawContent: rawText,
      });
      setRestoreValidation(validation);
      setRestoreStrategy(validation.summary?.conflictWithCurrentClass ? 'create_new' : 'create_new');
      setOverwriteConfirmed(false);
      setShowRestoreModal(true);
    } catch (err: any) {
      showToast('Không thể đọc tệp sao lưu: ' + (err.message || 'Lỗi đọc tệp'), 'error');
    } finally {
      e.target.value = '';
    }
  };

  // Step 4 & 5: Confirm & Persist
  const handleExecuteRestore = async () => {
    if (!pendingRestoreFile || !restoreValidation?.valid || !currentUser || !activeClass) return;

    if (restoreStrategy === 'overwrite_existing' && !overwriteConfirmed) {
      showToast('Vui lòng tích chọn xác nhận trước khi ghi đè lớp học hiện tại', 'error');
      return;
    }

    setImporting(true);
    try {
      const result = await BackupService.restoreFromBackup(
        pendingRestoreFile.rawContent,
        currentUser.uid,
        {
          mode: restoreStrategy,
          targetClassId: activeClass.id,
        }
      );

      await refreshClasses();
      if (result.targetClassId) {
        setActiveClassId(result.targetClassId);
      }
      await refreshActiveData();

      const modeLabel =
        result.mode === 'overwrite_existing'
          ? `Ghi đè thành công vào Lớp ${activeClass.className}`
          : `Khởi tạo thành công lớp mới`;

      showToast(
        `${modeLabel} (${result.studentsRestored} học sinh, ${result.attendanceRestored} điểm danh, ${result.assessmentsRestored} đánh giá)!`,
        'success'
      );
      setShowRestoreModal(false);
      setPendingRestoreFile(null);
      setRestoreValidation(null);
    } catch (err: any) {
      showToast('Lỗi khi khôi phục dữ liệu: ' + (err.message || ''), 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600" />
            <span>Cài Đặt Hệ Thống & Quản Trị Dữ Liệu</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cập nhật thông tin lớp · Sao lưu dự phòng an toàn · Quản lý danh sách lớp
          </p>
        </div>
      </div>

      {/* Account & Google Login Status Card */}
      {currentUser && (
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-300 p-0.5 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName}
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-base">
                  {currentUser.displayName?.charAt(0) || 'G'}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{currentUser.displayName}</span>
                {currentUser.email?.includes('@gmail.com') ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    Gmail Google đã liên kết
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                    Tài khoản Giáo viên
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">{currentUser.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setWelcomeModalUser(currentUser)}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <PartyPopper className="w-4 h-4 text-amber-500" />
            <span>Xem hiệu ứng chào mừng Google</span>
          </button>
        </div>
      )}

      {/* 1. Class Information Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <School className="w-4 h-4 text-emerald-600" />
          <span>Thông tin Lớp học & Giáo viên chủ nhiệm</span>
        </h3>

        <form onSubmit={handleUpdateClass} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên trường học
              </label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên lớp (Mã lớp)
              </label>
              <input
                type="text"
                required
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Năm học
              </label>
              <input
                type="text"
                required
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ và tên Giáo viên chủ nhiệm
              </label>
              <input
                type="text"
                required
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sĩ số chỉ tiêu dự kiến
              </label>
              <input
                type="number"
                value={expectedCount}
                onChange={(e) => setExpectedCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingClass}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingClass ? 'Đang lưu...' : 'Lưu cập nhật'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Backup & Restore Data */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          <span>Sao Lưu & Phục Hồi Dữ Liệu An Toàn</span>
        </h3>
        <p className="text-xs text-slate-500">
          Xuất toàn bộ cơ sở dữ liệu của lớp (học sinh, phụ huynh, chuyên cần, điểm số, nhật ký, thi đua) ra tệp JSON để lưu trữ ngoại tuyến trên máy tính.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Download backup */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Sao lưu dữ liệu về máy</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Tạo bản sao lưu nén định dạng JSON có dấu thời gian.
            </p>
            <button
              type="button"
              onClick={handleBackupDownload}
              disabled={exporting}
              className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? 'Đang tạo sao lưu...' : 'Tải tệp sao lưu (.json)'}</span>
            </button>
          </div>

          {/* Restore backup */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Khôi phục từ tệp sao lưu</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Chọn tệp sao lưu JSON đã tải trước đây để phục hồi lại dữ liệu.
            </p>
            <label className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>{importing ? 'Đang đọc tệp...' : 'Chọn tệp khôi phục (.json)'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleSelectRestoreFile}
                disabled={importing}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* 3. Demo Data & Multi-class Management */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-emerald-600" />
            <span>Danh Sách Các Lớp Chủ Nhiệm ({classes.length})</span>
          </div>
          <button
            type="button"
            onClick={() => setShowOnboarding(true)}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>+ Thêm lớp mới</span>
          </button>
        </h3>

        <div className="space-y-2.5">
          {classes.map((cls) => {
            const isActive = cls.id === activeClass?.id;
            return (
              <div
                key={cls.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  isActive
                    ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-400/20'
                    : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Lớp {cls.className}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      ({cls.schoolYear})
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {cls.schoolName} · GVCN: {cls.teacherName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!isActive && (
                    <button
                      type="button"
                      onClick={async () => {
                        setActiveClassId(cls.id);
                        showToast(`Đã chuyển sang lớp ${cls.className}!`);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      Chọn lớp này
                    </button>
                  )}

                  {classes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setClassToDelete(cls)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Xóa lớp này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-amber-50/60 rounded-xl border border-amber-200">
          <div>
            <h4 className="text-xs font-bold text-slate-800">Nạp lại dữ liệu mẫu Lớp 3A1</h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Tạo nhanh một lớp 3A1 đầy đủ học sinh, điểm danh, kết quả học tập và nhật ký để trải nghiệm toàn bộ tính năng.
            </p>
          </div>
          <button
            type="button"
            onClick={seedDemoClass}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            Nạp dữ liệu mẫu
          </button>
        </div>
      </div>

      {/* Safe Restore Modal: Preview -> Validate -> Confirm -> Persist */}
      {showRestoreModal && pendingRestoreFile && restoreValidation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Khôi phục dữ liệu an toàn
                  </h3>
                  <p className="text-xs text-slate-500">
                    Quy trình kiểm tra 4 bước: Xem trước → Thẩm định → Xác nhận → Lưu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRestoreModal(false);
                  setPendingRestoreFile(null);
                  setRestoreValidation(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Step 1 & 2: Preview & Validation results */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                1. Thông tin tệp & Thẩm định cấu trúc
              </div>

              {restoreValidation.valid ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">Cấu trúc tệp JSON hoàn toàn hợp lệ</span>
                  </div>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-mono">
                    v{restoreValidation.summary?.schemaVersion || '1.0.0'}
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{restoreValidation.error || 'Tệp sao lưu không đúng định dạng chuẩn'}</span>
                </div>
              )}

              {/* Data Summary Grid */}
              {restoreValidation.summary && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-sm font-bold text-slate-900 tabular-nums">
                      {restoreValidation.summary.studentCount}
                    </div>
                    <div className="text-[10px] text-slate-500">Học sinh</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-sm font-bold text-slate-900 tabular-nums">
                      {restoreValidation.summary.attendanceCount}
                    </div>
                    <div className="text-[10px] text-slate-500">Điểm danh</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-sm font-bold text-slate-900 tabular-nums">
                      {restoreValidation.summary.assessmentCount}
                    </div>
                    <div className="text-[10px] text-slate-500">Đánh giá</div>
                  </div>
                </div>
              )}

              {/* Conflict warning banner if applicable */}
              {restoreValidation.summary?.conflictWithCurrentClass && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Phát hiện trùng tên với lớp hiện tại:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {restoreValidation.summary.conflictReason}
                  </p>
                </div>
              )}
            </div>

            {/* Step 3: Strategy Selection & Explicit Confirmation */}
            {restoreValidation.valid && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  2. Chọn phương thức khôi phục (Không ghi đè âm thầm)
                </div>

                <div className="space-y-2">
                  <label
                    className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                      restoreStrategy === 'create_new'
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="restoreStrategy"
                        value="create_new"
                        checked={restoreStrategy === 'create_new'}
                        onChange={() => setRestoreStrategy('create_new')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Tạo thành Lớp học Mới</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                            An toàn nhất
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Giữ nguyên 100% dữ liệu lớp học hiện tại. Tạo thêm một lớp mới độc lập từ tệp sao lưu.
                        </p>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                      restoreStrategy === 'overwrite_existing'
                        ? 'border-rose-400 bg-rose-50/50 ring-2 ring-rose-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="restoreStrategy"
                        value="overwrite_existing"
                        checked={restoreStrategy === 'overwrite_existing'}
                        onChange={() => setRestoreStrategy('overwrite_existing')}
                        className="mt-0.5 text-rose-600 focus:ring-rose-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                          <span>Ghi đè vào Lớp hiện tại ({activeClass?.className})</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold">
                            Thay thế dữ liệu
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Dữ liệu học sinh, điểm danh và đánh giá hiện tại của Lớp {activeClass?.className} sẽ được làm mới theo tệp sao lưu này.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Overwrite Confirmation Checkbox */}
                {restoreStrategy === 'overwrite_existing' && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 animate-in fade-in duration-100">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overwriteConfirmed}
                        onChange={(e) => setOverwriteConfirmed(e.target.checked)}
                        className="mt-0.5 text-rose-600 rounded focus:ring-rose-500"
                      />
                      <span className="font-semibold text-[11px] leading-tight text-rose-950">
                        Tôi hiểu và xác nhận: Dữ liệu hiện tại của Lớp {activeClass?.className} sẽ được ghi đè và thay thế hoàn toàn bởi tệp sao lưu này.
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={importing}
                onClick={() => {
                  setShowRestoreModal(false);
                  setPendingRestoreFile(null);
                  setRestoreValidation(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={importing || !restoreValidation?.valid}
                onClick={() => {
                  if (restoreStrategy === 'overwrite_existing' && !overwriteConfirmed) {
                    showToast('Vui lòng tích chọn ô "Tôi hiểu và xác nhận: Dữ liệu hiện tại sẽ được ghi đè..." trước khi tiếp tục.', 'info');
                    return;
                  }
                  handleExecuteRestore();
                }}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                  restoreStrategy === 'overwrite_existing' && !overwriteConfirmed
                    ? 'bg-rose-600/80 hover:bg-rose-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang khôi phục & đồng bộ...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>
                      {restoreStrategy === 'overwrite_existing'
                        ? 'Xác nhận ghi đè & khôi phục'
                        : 'Khôi phục thành lớp mới'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Deletion Cascade Confirmation Modal */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận xóa hoàn toàn lớp học</h3>
                <p className="text-xs text-red-600 font-medium">Thao tác Cascade Delete vĩnh viễn</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-700">
              <p><span className="font-semibold text-slate-900">Lớp:</span> {classToDelete.className}</p>
              <p><span className="font-semibold text-slate-900">Năm học:</span> {classToDelete.schoolYear || 'Hiện tại'}</p>
              <p><span className="font-semibold text-slate-900">Trường:</span> {classToDelete.schoolName || 'Chưa cập nhật'}</p>
            </div>

            <div className="text-xs text-slate-600 space-y-1.5">
              <p className="font-semibold text-red-700">Dữ liệu liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống:</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px] pl-1">
                <li>Toàn bộ hồ sơ học sinh thuộc lớp</li>
                <li>Toàn bộ lịch sử điểm danh & chuyên cần</li>
                <li>Toàn bộ kết quả đánh giá môn học định kỳ</li>
                <li>Toàn bộ hồ sơ 10 tiêu chí Năng lực & Phẩm chất</li>
                <li>Sổ liên lạc & lịch sử trao đổi với phụ huynh</li>
                <li>Bảng theo dõi nhiệm vụ, thi đua và nhật ký lớp</li>
              </ul>
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2">
                Lưu ý: Thao tác này không thể hoàn tác. Nếu cần lưu trữ, vui lòng sao lưu dữ liệu trước khi xóa.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deletingClass}
                onClick={() => setClassToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deletingClass}
                onClick={async () => {
                  setDeletingClass(true);
                  try {
                    await ClassRepository.deleteClass(classToDelete.id);
                    await refreshClasses();
                    showToast(`Đã xóa hoàn toàn lớp ${classToDelete.className} và toàn bộ dữ liệu liên kết!`);
                    setClassToDelete(null);
                  } catch (err: any) {
                    showToast('Lỗi khi xóa lớp: ' + (err?.message || ''), 'error');
                  } finally {
                    setDeletingClass(false);
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingClass ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa cascade...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xác nhận xóa vĩnh viễn</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
