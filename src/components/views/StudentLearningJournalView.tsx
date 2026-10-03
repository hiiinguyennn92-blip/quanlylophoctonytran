import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  StudentLearningJournalEntry,
  StudentLearningJournalType,
  Student,
} from '../../types';
import { AIClientService } from '../../services/aiClientService';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Sparkles,
  Calendar,
  Lock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Award,
  TrendingUp,
  Clock,
  Trash2,
  Edit2,
  X,
  Users,
  ShieldCheck,
  Tag,
  Copy,
  ChevronDown,
  Check,
  MessageCircle,
  Layers,
} from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

const POSITIVE_TAGS = [
  'hoàn thành tốt',
  'tiến bộ rõ rệt',
  'chủ động phát biểu',
  'tư duy sáng tạo',
  'chăm chỉ kiên trì',
  'cần ôn tập',
  'cần theo dõi',
  'cần kèm thêm',
  'giữ vệ sinh tốt',
  'giúp đỡ bạn',
];

const JOURNAL_TYPE_CONFIG: Record<
  StudentLearningJournalType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  observation: { label: 'Quan sát bài học', icon: Eye, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  progress: { label: 'Tiến bộ nổi bật', icon: TrendingUp, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  difficulty: { label: 'Khó khăn cần hỗ trợ', icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  achievement: { label: 'Khen ngợi & Thành tích', icon: Award, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  follow_up: { label: 'Kế hoạch theo dõi', icon: Clock, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  general: { label: 'Ghi chú chung', icon: BookOpen, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
};

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

export const StudentLearningJournalView: React.FC = () => {
  const {
    activeClass,
    currentUser,
    students,
    studentLearningJournals,
    addStudentLearningJournal,
    bulkAddStudentLearningJournals,
    updateStudentLearningJournal,
    deleteStudentLearningJournal,
    learningJournalPrefill,
    setLearningJournalPrefill,
    showToast,
  } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [filterFollowUpOnly, setFilterFollowUpOnly] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<StudentLearningJournalEntry | null>(null);

  // Form State
  const [formStudentId, setFormStudentId] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [formSubject, setFormSubject] = useState<string>('Toán');
  const [formLessonTitle, setFormLessonTitle] = useState<string>('');
  const [formType, setFormType] = useState<StudentLearningJournalType>('observation');
  const [formObservation, setFormObservation] = useState<string>('');
  const [formEvidence, setFormEvidence] = useState<string>('');
  const [formSupportAction, setFormSupportAction] = useState<string>('');
  const [formFollowUpDate, setFormFollowUpDate] = useState<string>('');
  const [formSelectedTags, setFormSelectedTags] = useState<string[]>([]);
  const [formPrivate, setFormPrivate] = useState<boolean>(false);
  const [showDetailedFields, setShowDetailedFields] = useState<boolean>(false);
  const [aiRefining, setAiRefining] = useState(false);

  // Bulk Form State
  const [bulkSubject, setBulkSubject] = useState<string>('Toán');
  const [bulkLessonTitle, setBulkLessonTitle] = useState<string>('');
  const [bulkDate, setBulkDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [bulkEntriesMap, setBulkEntriesMap] = useState<
    Record<
      string,
      {
        selected: boolean;
        type: StudentLearningJournalType;
        observation: string;
        evidence?: string;
        supportAction?: string;
      }
    >
  >({});

  // Check if opened from Schedule with prefilled data
  useEffect(() => {
    if (learningJournalPrefill) {
      if (learningJournalPrefill.subject) setFormSubject(learningJournalPrefill.subject);
      if (learningJournalPrefill.lessonTitle) setFormLessonTitle(learningJournalPrefill.lessonTitle);
      if (learningJournalPrefill.date) setFormDate(learningJournalPrefill.date);
      if (learningJournalPrefill.studentId) setFormStudentId(learningJournalPrefill.studentId);
      setShowAddModal(true);
    }
  }, [learningJournalPrefill]);

  // Students mapping
  const studentMap = useMemo(() => {
    return new Map<string, Student>(students.map((s) => [s.id, s]));
  }, [students]);

  // Filtered Journals
  const filteredJournals = useMemo(() => {
    return studentLearningJournals.filter((j) => {
      if (selectedStudentFilter !== 'all' && j.studentId !== selectedStudentFilter) return false;
      if (selectedSubjectFilter !== 'all' && j.subject !== selectedSubjectFilter) return false;
      if (selectedTypeFilter !== 'all' && j.type !== selectedTypeFilter) return false;
      if (filterFollowUpOnly && !j.followUpDate) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const stuName = (studentMap.get(j.studentId)?.fullName || '').toLowerCase();
        const obs = (j.observation || '').toLowerCase();
        const sub = (j.subject || '').toLowerCase();
        const lesson = (j.lessonTitle || '').toLowerCase();
        const tagsStr = (j.tags || []).join(' ').toLowerCase();

        if (
          !stuName.includes(q) &&
          !obs.includes(q) &&
          !sub.includes(q) &&
          !lesson.includes(q) &&
          !tagsStr.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    studentLearningJournals,
    selectedStudentFilter,
    selectedSubjectFilter,
    selectedTypeFilter,
    filterFollowUpOnly,
    searchTerm,
    studentMap,
  ]);

  // Open Add Modal
  const handleOpenAdd = (studentIdTarget?: string) => {
    setEditingEntry(null);
    setFormStudentId(studentIdTarget || (students[0]?.id || ''));
    setFormDate(format(new Date(), 'yyyy-MM-dd'));
    setFormSubject('Toán');
    setFormLessonTitle('');
    setFormType('observation');
    setFormObservation('');
    setFormEvidence('');
    setFormSupportAction('');
    setFormFollowUpDate('');
    setFormSelectedTags([]);
    setFormPrivate(false);
    setShowDetailedFields(false);
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (entry: StudentLearningJournalEntry) => {
    setEditingEntry(entry);
    setFormStudentId(entry.studentId);
    setFormDate(entry.date);
    setFormSubject(entry.subject || 'Toán');
    setFormLessonTitle(entry.lessonTitle || '');
    setFormType(entry.type);
    setFormObservation(entry.observation);
    setFormEvidence(entry.evidence || '');
    setFormSupportAction(entry.supportAction || '');
    setFormFollowUpDate(entry.followUpDate || '');
    setFormSelectedTags(entry.tags || []);
    setFormPrivate(entry.privateToTeacher);
    setShowDetailedFields(Boolean(entry.evidence || entry.supportAction || entry.followUpDate));
    setShowAddModal(true);
  };

  // AI Refine Note into Positive Pedagogical Voice
  const handleAiRefine = async () => {
    if (!formObservation.trim()) {
      showToast('Vui lòng nhập nội dung quan sát trước khi nhờ AI tinh chỉnh.', 'info');
      return;
    }
    const student = studentMap.get(formStudentId);
    const studentName = student ? student.fullName : 'Học sinh';

    setAiRefining(true);
    try {
      const prompt = `Bạn là cố vấn sư phạm tiểu học theo Thông tư 27-BGDĐT. 
Hãy chuyển đổi ghi chú quan sát sau của giáo viên sang văn phong sư phạm tích cực, nhân văn, tuân theo cấu trúc:
1. Quan sát thực tế (không phán xét, không dán nhãn tiêu cực)
2. Minh chứng quan sát được
3. Hướng hỗ trợ tiếp theo cụ thể.

Tên học sinh: ${studentName}
Môn học: ${formSubject}
Nội dung giáo viên vừa ghi: "${formObservation}"
${formEvidence ? `Minh chứng hiện tại: "${formEvidence}"` : ''}

Trả về định dạng JSON thuần với 3 trường:
{
  "observation": "lời quan sát sư phạm tích cực ngắn gọn",
  "evidence": "minh chứng cụ thể",
  "supportAction": "bước hỗ trợ tiếp theo của cô giáo"
}`;

      const res = await AIClientService.askAssistant({
        userQuery: prompt,
        contextData: {
          className: activeClass?.className,
          selectedStudent: student ? { name: student.fullName, group: student.groupId } : undefined,
        },
      });

      // Try parsing JSON from AI answer
      try {
        const jsonMatch = res.reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.observation) setFormObservation(parsed.observation);
          if (parsed.evidence) setFormEvidence(parsed.evidence);
          if (parsed.supportAction) setFormSupportAction(parsed.supportAction);
          setShowDetailedFields(true);
          showToast('AI đã tinh chỉnh theo chuẩn sư phạm tích cực!', 'success');
          return;
        }
      } catch {}

      // Fallback: put in observation
      setFormObservation(res.reply);
      showToast('Đã nhận gợi ý sư phạm từ AI!', 'success');
    } catch (err: any) {
      showToast('Không thể gọi trợ lý AI: ' + (err.message || ''), 'error');
    } finally {
      setAiRefining(false);
    }
  };

  // Save Single Journal
  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !currentUser) return;
    if (!formStudentId) {
      showToast('Vui lòng chọn học sinh', 'error');
      return;
    }
    if (!formObservation.trim()) {
      showToast('Vui lòng nhập nội dung quan sát', 'error');
      return;
    }

    try {
      if (editingEntry) {
        await updateStudentLearningJournal(editingEntry.id, {
          studentId: formStudentId,
          date: formDate,
          subject: formSubject,
          lessonTitle: formLessonTitle.trim() || undefined,
          type: formType,
          observation: formObservation.trim(),
          evidence: formEvidence.trim() || undefined,
          supportAction: formSupportAction.trim() || undefined,
          followUpDate: formFollowUpDate || undefined,
          tags: formSelectedTags,
          privateToTeacher: formPrivate,
        });
        showToast('Đã cập nhật nhật ký học tập thành công!', 'success');
      } else {
        await addStudentLearningJournal({
          ownerId: currentUser.uid,
          classId: activeClass.id,
          studentId: formStudentId,
          scheduleEntryId: learningJournalPrefill?.scheduleEntryId,
          date: formDate,
          subject: formSubject,
          lessonTitle: formLessonTitle.trim() || undefined,
          type: formType,
          observation: formObservation.trim(),
          evidence: formEvidence.trim() || undefined,
          supportAction: formSupportAction.trim() || undefined,
          followUpDate: formFollowUpDate || undefined,
          tags: formSelectedTags,
          privateToTeacher: formPrivate,
        });
        showToast('Đã lưu nhật ký học tập cho học sinh!', 'success');
      }

      setShowAddModal(false);
      setEditingEntry(null);
      setLearningJournalPrefill(null);
    } catch (err: any) {
      showToast('Lỗi lưu nhật ký: ' + (err.message || ''), 'error');
    }
  };

  // Open Bulk Modal
  const handleOpenBulkModal = () => {
    const initialMap: Record<string, any> = {};
    students.forEach((s) => {
      initialMap[s.id] = {
        selected: false,
        type: 'observation' as StudentLearningJournalType,
        observation: '',
        evidence: '',
        supportAction: '',
      };
    });
    setBulkEntriesMap(initialMap);
    setBulkSubject('Toán');
    setBulkLessonTitle('');
    setBulkDate(format(new Date(), 'yyyy-MM-dd'));
    setShowBulkModal(true);
  };

  // Save Bulk Journals
  const handleSaveBulk = async () => {
    if (!activeClass || !currentUser) return;
    const selectedEntries = Object.entries(bulkEntriesMap)
      .filter(([_, data]) => data.selected && data.observation.trim().length > 0)
      .map(([stuId, data]) => ({
        ownerId: currentUser.uid,
        classId: activeClass.id,
        studentId: stuId,
        scheduleEntryId: learningJournalPrefill?.scheduleEntryId,
        date: bulkDate,
        subject: bulkSubject,
        lessonTitle: bulkLessonTitle.trim() || undefined,
        type: data.type,
        observation: data.observation.trim(),
        evidence: data.evidence?.trim() || undefined,
        supportAction: data.supportAction?.trim() || undefined,
        privateToTeacher: false,
      }));

    if (selectedEntries.length === 0) {
      showToast('Vui lòng tích chọn học sinh và nhập nội dung quan sát.', 'info');
      return;
    }

    try {
      await bulkAddStudentLearningJournals(selectedEntries);
      showToast(`Đã lưu thành công nhật ký cho ${selectedEntries.length} học sinh!`, 'success');
      setShowBulkModal(false);
      setLearningJournalPrefill(null);
    } catch (err: any) {
      showToast('Lỗi lưu nhật ký hàng loạt: ' + (err.message || ''), 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base lg:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                Nhật Ký Học Tập Học Sinh
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                Sư phạm TT27
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Ghi nhận tiến bộ, minh chứng và hướng hỗ trợ từng em · Tôn trọng phẩm chất, không phán xét tiêu cực
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleOpenBulkModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Ghi nhật ký nhanh cho nhiều học sinh sau tiết dạy"
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Ghi theo tiết (Nhiều em)</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Ghi nhật ký mới</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên học sinh, bài học, quan sát..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Student Filter */}
          <select
            value={selectedStudentFilter}
            onChange={(e) => setSelectedStudentFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-700 font-medium"
          >
            <option value="all">Tất cả học sinh ({students.length})</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.studentCode || s.groupId})
              </option>
            ))}
          </select>

          {/* Subject Filter */}
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-700 font-medium"
          >
            <option value="all">Tất cả môn học</option>
            {PRIMARY_SUBJECTS.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-700 font-medium"
          >
            <option value="all">Tất cả loại ghi nhận</option>
            <option value="progress">Tiến bộ nổi bật</option>
            <option value="difficulty">Khó khăn cần hỗ trợ</option>
            <option value="achievement">Khen ngợi & Thành tích</option>
            <option value="observation">Quan sát bài học</option>
            <option value="follow_up">Kế hoạch theo dõi</option>
          </select>

          {/* Follow-up Checkbox */}
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterFollowUpOnly}
              onChange={(e) => setFilterFollowUpOnly(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500"
            />
            <span>Có ngày theo dõi</span>
          </label>
        </div>
      </div>

      {/* Journal List / Timeline */}
      <div className="space-y-3">
        {filteredJournals.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/90 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Chưa có nhật ký học tập nào phù hợp</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Thầy/Cô hãy bấm "+ Ghi nhật ký mới" để lưu lại quan sát tiến bộ của các em học sinh.
            </p>
            <button
              type="button"
              onClick={() => handleOpenAdd()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              + Ghi nhật ký đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredJournals.map((entry) => {
              const student = studentMap.get(entry.studentId);
              const cfg = JOURNAL_TYPE_CONFIG[entry.type] || JOURNAL_TYPE_CONFIG.general;
              const TypeIcon = cfg.icon;

              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs transition-all space-y-3 relative group"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {student ? student.fullName.slice(-2) : 'HS'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-xs lg:text-sm">
                            {student?.fullName || 'Học sinh'}
                          </h4>
                          {entry.privateToTeacher && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600"
                              title="Ghi chú cá nhân của cô giáo - Không đưa vào báo cáo gửi phụ huynh"
                            >
                              <Lock className="w-3 h-3 text-slate-500" />
                              Riêng tư
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {format(parseISO(entry.date), 'dd/MM/yyyy')} · {entry.subject || 'Môn học'}{' '}
                          {entry.lessonTitle ? `· Bài: ${entry.lessonTitle}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.color}`}>
                        <TypeIcon className="w-3 h-3" />
                        <span>{cfg.label}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(entry)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Bạn có chắc muốn xóa bản ghi nhật ký này?')) {
                            deleteStudentLearningJournal(entry.id);
                            showToast('Đã xóa bản ghi nhật ký.', 'info');
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Pedagogical 3-Part Body */}
                  <div className="space-y-2 text-xs">
                    {/* Observation */}
                    <div className="text-slate-800 leading-relaxed font-medium bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-600 mr-1.5">Quan sát:</span>
                      {entry.observation}
                    </div>

                    {/* Evidence */}
                    {entry.evidence && (
                      <div className="text-slate-600 pl-2 border-l-2 border-purple-300">
                        <span className="font-bold text-purple-900">Minh chứng: </span>
                        <span>{entry.evidence}</span>
                      </div>
                    )}

                    {/* Support Action */}
                    {entry.supportAction && (
                      <div className="text-emerald-800 bg-emerald-50/60 border border-emerald-200/70 p-2 rounded-xl">
                        <span className="font-bold">Hướng hỗ trợ tiếp theo: </span>
                        <span>{entry.supportAction}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer Tags & Follow-up */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px] flex-wrap">
                    <div className="flex items-center gap-1 flex-wrap">
                      {(entry.tags || []).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    {entry.followUpDate && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Theo dõi: {format(parseISO(entry.followUpDate), 'dd/MM/yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT SINGLE JOURNAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 lg:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm lg:text-base">
                    {editingEntry ? 'Chỉnh sửa nhật ký học tập' : 'Ghi nhật ký học tập học sinh'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Tuân thủ cấu trúc: Quan sát → Minh chứng → Hướng hỗ trợ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEntry(null);
                  setLearningJournalPrefill(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJournal} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Học sinh *</label>
                  <select
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                  >
                    <option value="">-- Chọn học sinh --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.groupId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày ghi *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Môn học *</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    {PRIMARY_SUBJECTS.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại ghi nhận *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as StudentLearningJournalType)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                  >
                    <option value="observation">Quan sát bài học</option>
                    <option value="progress">Tiến bộ nổi bật</option>
                    <option value="difficulty">Khó khăn cần hỗ trợ</option>
                    <option value="achievement">Khen ngợi & Thành tích</option>
                    <option value="follow_up">Kế hoạch theo dõi</option>
                    <option value="general">Ghi chú chung</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên bài học (Tùy chọn)</label>
                <input
                  type="text"
                  value={formLessonTitle}
                  onChange={(e) => setFormLessonTitle(e.target.value)}
                  placeholder="VD: Phép chia có dư, Mở rộng vốn từ..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              {/* Observation Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Nội dung quan sát sư phạm *</label>
                  <button
                    type="button"
                    onClick={handleAiRefine}
                    disabled={aiRefining || !formObservation.trim()}
                    className="flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-800 disabled:opacity-40 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-spin" style={{ animationDuration: aiRefining ? '1s' : '0s' }} />
                    <span>{aiRefining ? 'AI đang tinh chỉnh...' : 'AI Sư phạm tinh chỉnh'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  required
                  value={formObservation}
                  onChange={(e) => setFormObservation(e.target.value)}
                  placeholder="Mô tả cụ thể hành vi hoặc kết quả làm bài của học sinh (VD: Trong tiết học, em hiểu bài nhưng còn ngập ngừng khi tìm số dư...)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 leading-relaxed"
                />
              </div>

              {/* Detailed Fields Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowDetailedFields((prev) => !prev)}
                  className="text-[11px] font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDetailedFields ? 'rotate-180' : ''}`} />
                  <span>{showDetailedFields ? 'Thu gọn chi tiết' : '+ Thêm minh chứng & Hướng hỗ trợ cụ thể'}</span>
                </button>
              </div>

              {showDetailedFields && (
                <div className="space-y-3 p-3 bg-purple-50/40 rounded-xl border border-purple-100 animate-in fade-in duration-150">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Minh chứng quan sát được</label>
                    <input
                      type="text"
                      value={formEvidence}
                      onChange={(e) => setFormEvidence(e.target.value)}
                      placeholder="VD: Phiếu bài tập cá nhân bài 3, vở thực hành..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Hướng hỗ trợ tiếp theo</label>
                    <input
                      type="text"
                      value={formSupportAction}
                      onChange={(e) => setFormSupportAction(e.target.value)}
                      placeholder="VD: Cô ôn lại quy tắc 3 bước, ghép bạn Bảo Châu kèm thêm..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Ngày theo dõi lại (Follow-up)</label>
                    <input
                      type="date"
                      value={formFollowUpDate}
                      onChange={(e) => setFormFollowUpDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Tag Quick Select */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gắn nhãn sư phạm tích cực</label>
                <div className="flex flex-wrap gap-1.5">
                  {POSITIVE_TAGS.map((tag) => {
                    const selected = formSelectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            setFormSelectedTags(formSelectedTags.filter((t) => t !== tag));
                          } else {
                            setFormSelectedTags([...formSelectedTags, tag]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                          selected
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Private flag */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-600" />
                  <div>
                    <p className="font-bold text-slate-800">Ghi chú riêng tư của giáo viên</p>
                    <p className="text-[10px] text-slate-500">
                      Không hiển thị trong báo cáo phụ huynh hoặc tin nhắn Zalo gửi gia đình
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formPrivate}
                  onChange={(e) => setFormPrivate(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEntry(null);
                    setLearningJournalPrefill(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {editingEntry ? 'Lưu cập nhật' : 'Lưu nhật ký'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BULK JOURNAL PER LESSON */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 lg:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm lg:text-base">
                    Ghi nhật ký nhanh sau tiết học cho nhiều học sinh
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Tích chọn các em có biểu hiện đáng lưu ý trong tiết để ghi nhận xét riêng cho từng em
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Shared Context */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs shrink-0">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Môn học *</label>
                <select
                  value={bulkSubject}
                  onChange={(e) => setBulkSubject(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                >
                  {PRIMARY_SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên bài học</label>
                <input
                  type="text"
                  value={bulkLessonTitle}
                  onChange={(e) => setBulkLessonTitle(e.target.value)}
                  placeholder="VD: Phép chia số có 2 chữ số..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ngày học</label>
                <input
                  type="date"
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Student Table / Cards */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {students.map((student) => {
                const entry = bulkEntriesMap[student.id] || {
                  selected: false,
                  type: 'observation',
                  observation: '',
                  supportAction: '',
                };

                return (
                  <div
                    key={student.id}
                    className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                      entry.selected
                        ? 'bg-purple-50/40 border-purple-300 ring-1 ring-purple-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 select-none">
                        <input
                          type="checkbox"
                          checked={entry.selected}
                          onChange={(e) => {
                            setBulkEntriesMap((prev) => ({
                              ...prev,
                              [student.id]: {
                                ...prev[student.id],
                                selected: e.target.checked,
                              },
                            }));
                          }}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <span>{student.fullName}</span>
                        <span className="text-[11px] font-normal text-slate-400">({student.groupId})</span>
                      </label>

                      {entry.selected && (
                        <select
                          value={entry.type}
                          onChange={(e) => {
                            setBulkEntriesMap((prev) => ({
                              ...prev,
                              [student.id]: {
                                ...prev[student.id],
                                type: e.target.value as StudentLearningJournalType,
                              },
                            }));
                          }}
                          className="px-2 py-1 text-[11px] border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="observation">Quan sát bài học</option>
                          <option value="progress">Tiến bộ</option>
                          <option value="difficulty">Cần hỗ trợ</option>
                          <option value="achievement">Khen ngợi</option>
                        </select>
                      )}
                    </div>

                    {entry.selected && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-in fade-in duration-100">
                        <div>
                          <input
                            type="text"
                            value={entry.observation}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBulkEntriesMap((prev) => ({
                                ...prev,
                                [student.id]: {
                                  ...prev[student.id],
                                  observation: val,
                                },
                              }));
                            }}
                            placeholder="Quan sát ngắn (VD: nắm chắc bài, hoặc lúng túng khi thực hiện bước 2...)"
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            value={entry.supportAction || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBulkEntriesMap((prev) => ({
                                ...prev,
                                [student.id]: {
                                  ...prev[student.id],
                                  supportAction: val,
                                },
                              }));
                            }}
                            placeholder="Hướng hỗ trợ (VD: giao thêm bài, ghép bạn kèm thêm...)"
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Đã chọn:{' '}
                <span className="font-bold text-purple-700">
                  {Object.values(bulkEntriesMap).filter((e) => e.selected).length}
                </span>{' '}
                học sinh
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveBulk}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Lưu tất cả nhật ký đã chọn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
