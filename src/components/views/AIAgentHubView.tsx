import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AIClientService } from '../../services/aiClientService';
import { SendZaloModal } from '../common/SendZaloModal';
import { Student } from '../../types';
import { format } from 'date-fns';
import {
  Bot,
  Sparkles,
  Send,
  User,
  ShieldCheck,
  Heart,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Copy,
  MessageCircle,
  RefreshCw,
  Award,
  Users,
  Eye,
  Calendar,
  Zap,
  Palette,
  ArrowRight,
  Code2,
  Ratio,
  Info,
  X,
  Compass,
} from 'lucide-react';
import {
  RoutedSkillInfo,
  ImagePromptBlueprint,
  AgentSkillAction,
  SkillRouteId,
  AgentSkillDefinition,
} from '../../services/agentSkills/skillTypes';
import {
  getAllSkillManifests,
  getSkillDefinition,
} from '../../services/agentSkills/skillRegistry';
import { TaskRepository } from '../../repositories/dataRepository';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: string;
  followUps?: string[];
  routedSkill?: RoutedSkillInfo;
  imagePromptBlueprint?: ImagePromptBlueprint;
  actionCard?: AgentSkillAction;
  suggestedAction?: {
    type: 'zalo' | 'copy';
    label: string;
    payload?: string;
  };
}

export type AgentSkillManifest = AgentSkillDefinition;

const getSkillIcon = (iconName: string) => {
  switch (iconName) {
    case 'AlertTriangle':
      return AlertTriangle;
    case 'Award':
      return Award;
    case 'Eye':
      return Eye;
    case 'Heart':
      return Heart;
    case 'Calendar':
      return Calendar;
    case 'Palette':
      return Palette;
    case 'Compass':
      return Compass;
    default:
      return Bot;
  }
};

export const AIAgentHubView: React.FC = () => {
  const {
    currentUser,
    activeClass,
    students,
    parents,
    assessments,
    attendanceRecords,
    attentionSignals,
    tasks,
    refreshTasks,
    showToast,
    setActiveTab,
  } = useApp();

  const skillsList = getAllSkillManifests();

  const [inputQuery, setInputQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedSkillRoute, setSelectedSkillRoute] = useState<string>('auto');
  const [loading, setLoading] = useState(false);
  const [showSkillInspectorModal, setShowSkillInspectorModal] = useState(false);

  // Modal Zalo State
  const [zaloModalOpen, setZaloModalOpen] = useState(false);
  const [zaloText, setZaloText] = useState('');

  // Calculate attendance statistics today
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayRecords = attendanceRecords.filter((r) => r.date === todayStr);
  const presentCount = todayRecords.filter((r) => r.status === 'present').length;
  const excusedCount = todayRecords.filter((r) => r.status === 'excused_absence').length;
  const unexcusedCount = todayRecords.filter((r) => r.status === 'unexcused_absence').length;
  const lateCount = todayRecords.filter((r) => r.status === 'late').length;

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Initial welcome message from the Agent
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'agent',
      content: `Kính chào Thầy/Cô! Em là **Trợ Lý AI Chủ Nhiệm** theo định hướng GDPT 2018 và Thông tư 27/2020/TT-BGDĐT.\n\nHiện tại em đã nắm bắt toàn bộ dữ liệu lớp **${activeClass?.className || 'chưa chọn'}** (sĩ số: ${students.length} em, hôm nay ghi nhận ${presentCount}/${students.length} em có mặt, ${attentionSignals.length} em có tín hiệu cần quan tâm).\n\nThầy/Cô có thể yêu cầu em bất kỳ công việc sư phạm nào: phân tích học sinh, lên kế hoạch sinh hoạt tuần, soạn tin nhắn Zalo cho phụ huynh hoặc tối ưu sơ đồ lớp học!`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      followUps: [
        'Phân tích học sinh cần quan tâm nhất tuần này',
        'Gợi ý kịch bản 35 phút tiết sinh hoạt lớp',
        'Soạn tin nhắn Zalo nhắc nhở phụ huynh giữ ấm mùa đông',
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (queryText?: string, forcedSkill?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || loading) return;

    const skillRouteToUse = forcedSkill || selectedSkillRoute;

    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      // Assemble live contextual data for Agent perception
      const relevantRecords = [
        attentionSignals.length > 0
          ? `Tín hiệu cần chú ý: ${attentionSignals.map((a) => `${a.studentName} (${a.title} - ${a.description})`).join('; ')}`
          : 'Không có tín hiệu nguy cơ nghiêm trọng.',
        tasks.length > 0
          ? `Nhiệm vụ tuần: ${tasks.slice(0, 3).map((t) => t.title).join(', ')}`
          : '',
      ].filter(Boolean).join('\n');

      // Build focused data if student is selected
      let studentContext: any = undefined;
      if (selectedStudent) {
        const studentAtt = attendanceRecords.filter((a) => a.studentId === selectedStudent.id);
        const absentCount = studentAtt.filter((a) => a.status === 'unexcused_absence' || a.status === 'excused_absence').length;
        const studentAssess = assessments.filter((a) => a.studentId === selectedStudent.id).slice(0, 5);
        const parentInfo = parents.find((p) => p.studentId === selectedStudent.id);
        const studentSignals = attentionSignals.filter((a) => a.studentId === selectedStudent.id);

        studentContext = {
          fullName: selectedStudent.fullName,
          gender: selectedStudent.gender,
          groupId: selectedStudent.groupId,
          notes: selectedStudent.notes,
          recentAbsencesCount: absentCount,
          recentAssessments: studentAssess.map((a) => `${a.subjectId}: mức ${a.level}${a.score !== undefined ? `, điểm ${a.score}` : ''}`).join('; '),
          parentContact: parentInfo ? `${parentInfo.type || 'Phụ huynh'}: ${parentInfo.fullName} (${parentInfo.phone || 'Chưa có SĐT'})` : 'Chưa có thông tin',
          alerts: studentSignals.map((s) => s.title).join(', '),
        };
      }

      // Maintain multi-turn conversational memory for LLM
      const conversationHistory = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-8)
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('model' as const),
          text: m.content,
        }));

      const res = await AIClientService.askAssistant({
        userQuery: textToSend,
        skillRoute: skillRouteToUse,
        contextData: {
          className: activeClass?.className,
          studentCount: students.length,
          attendanceToday: {
            present: presentCount,
            excused: excusedCount,
            unexcused: unexcusedCount,
            late: lateCount,
          },
          tasksSummary: tasks.slice(0, 5).map((t) => t.title).join(', '),
          selectedStudent: studentContext,
          relevantRecords,
        },
        conversationHistory,
      });

      const agentMsg: ChatMessage = {
        id: 'agent_' + Date.now(),
        sender: 'agent',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        followUps: res.followUps || [],
        routedSkill: res.routedSkill,
        imagePromptBlueprint: res.imagePromptBlueprint,
        actionCard: res.actionCard,
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      showToast('Lỗi tương tác Trợ lý AI: ' + (err.message || ''), 'error');
      const fallbackMsg: ChatMessage = {
        id: 'agent_err_' + Date.now(),
        sender: 'agent',
        content: 'Dạ Thầy/Cô, kết nối mạng hoặc máy chủ AI đang phản hồi chậm. Thầy/Cô có thể bấm thử lại hoặc chọn một trong các câu hỏi gợi ý bên dưới.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        followUps: ['Xem báo cáo chuyên cần', 'Soạn tin nhắn Zalo'],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Đã sao chép nội dung câu trả lời!');
  };

  const getContextualSkillPrompt = (skillId: string, defaultPrompt: string): string => {
    const def = getSkillDefinition(skillId as SkillRouteId);
    return def ? def.createContextualPrompt(selectedStudent, defaultPrompt) : defaultPrompt;
  };

  const handleOpenZaloFromMessage = (text: string) => {
    setZaloText(text);
    setZaloModalOpen(true);
  };

  const handleExecuteAction = async (action?: AgentSkillAction) => {
    if (!action) return;

    try {
      if (action.type === 'zalo_message') {
        const msgText = action.payload?.message || action.payload?.text || '';
        handleOpenZaloFromMessage(msgText);
      } else if (action.type === 'task_create') {
        if (!activeClass || !currentUser) {
          showToast('Vui lòng chọn lớp học trước khi tạo nhiệm vụ!', 'info');
          return;
        }
        const studentName = action.payload?.targetStudent || selectedStudent?.fullName || 'Học sinh';
        const taskTitle = action.title || `Kế hoạch kèm cặp em ${studentName}`;
        const taskDesc = action.description || action.payload?.message || `Kế hoạch do AI Agent Sư Phạm đề xuất cho em ${studentName}.`;
        const dueAt = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

        await TaskRepository.createTask({
          classId: activeClass.id,
          ownerId: currentUser.uid,
          title: taskTitle,
          description: taskDesc,
          dueAt,
          type: 'nhiệm vụ học tập',
          audience: studentName,
        });
        await refreshTasks();
        showToast(`Đã tạo nhiệm vụ kèm cặp thành công cho em ${studentName}!`);
        setActiveTab('tasks');
      } else if (action.type === 'seating_view') {
        showToast('Mở sơ đồ lớp học theo tư vấn công thái học & thị lực');
        setActiveTab('seating');
      } else if (action.type === 'assessment_input') {
        showToast('Mở Sổ Đánh Giá Học Sinh Thông tư 27');
        setActiveTab('learning');
      } else if (action.type === 'image_design') {
        showToast('Mở Xưởng Vẽ AI với bản thiết kế 8 khối');
        setActiveTab('ai-image-design');
      } else if (action.type === 'schedule_view') {
        showToast('Mở Thời Khóa Biểu & Lịch Báo Giảng');
        setActiveTab('schedule');
      } else {
        showToast(action.title || 'Đã ghi nhận hành động!');
      }
    } catch (err: any) {
      showToast(`Lỗi thực thi hành động: ${err.message}`, 'error');
    }
  };

  const studentForZalo: Student = selectedStudent || students[0] || {
    id: 'placeholder',
    classId: activeClass?.id || '',
    ownerId: activeClass?.ownerId || '',
    studentCode: 'HS01',
    fullName: 'Em học sinh',
    dob: '2016-01-01',
    gender: 'nam',
    groupId: 'Tổ 1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8">
      {/* Header & Agent Status Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <Bot className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Trợ Lý Sư Phạm Toàn Năng
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sẵn sàng • TT 27 / GDPT 2018
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                AI Agent đa luồng: Tự động phân tích hồ sơ, cảnh báo sớm, đánh giá khung năng lực và cầu nối phụ huynh
              </p>
            </div>
          </div>

          {/* Perception HUD Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-300" />
              <span>Lớp: <strong className="text-white">{activeClass?.className || 'Chưa chọn'}</strong> ({students.length} HS)</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Hôm nay: <strong className="text-white">{presentCount}/{students.length}</strong> có mặt</span>
            </div>
            {attentionSignals.length > 0 && (
              <div className="bg-amber-500/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-400/30 flex items-center gap-2 text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <span>Cần quan tâm: <strong>{attentionSignals.length} em</strong></span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowSkillInspectorModal(true)}
              className="bg-white/10 hover:bg-white/20 active:scale-98 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-1.5 text-xs text-white font-medium transition-all cursor-pointer shadow-xs"
              title="Xem thông số đặc tả và chuẩn năng lực các kỹ năng AI"
            >
              <Compass className="w-4 h-4 text-amber-300" />
              <span>Đặc Tả Chuẩn Skill ({skillsList.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Skills Selector + Chat Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Skills Deck & Context Selector (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Target Student Focus Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Tiêu điểm học sinh cần tư vấn
              </span>
              {selectedStudentId && (
                <button
                  onClick={() => setSelectedStudentId('')}
                  className="text-[11px] text-slate-400 hover:text-slate-600 underline"
                >
                  Xóa chọn
                </button>
              )}
            </div>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-800"
            >
              <option value="">-- Tư vấn toàn diện cả lớp --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} {s.gender === 'nữ' ? '(Nữ)' : '(Nam)'} {s.groupId ? `• ${s.groupId}` : ''}
                </option>
              ))}
            </select>
            {selectedStudent && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-900 space-y-1">
                <p className="font-semibold text-emerald-800">
                  Đã khóa ngữ cảnh học sinh: {selectedStudent.fullName}
                </p>
                <p className="text-slate-600 line-clamp-2">
                  {selectedStudent.notes || 'Chưa có ghi chú đặc biệt từ hồ sơ ban đầu.'}
                </p>
              </div>
            )}
          </div>

          {/* Agent Skills Deck */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                {skillsList.length} Nhóm Kỹ Năng Sư Phạm Của Agent
              </h2>
              <button
                type="button"
                onClick={() => setShowSkillInspectorModal(true)}
                className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
              >
                <span>Chi tiết</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>

            <div className="space-y-2">
              {skillsList.map((skill) => {
                const Icon = getSkillIcon(skill.iconName);
                const isSelected = selectedSkillRoute === skill.id;
                return (
                  <div
                    key={skill.id}
                    onClick={() => {
                      setSelectedSkillRoute(skill.id);
                      handleSendMessage(getContextualSkillPrompt(skill.id, skill.samplePrompt), skill.id);
                    }}
                    className={`group p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500/20'
                        : 'border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${skill.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                            {skill.name}
                          </h3>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-emerald-100 group-hover:text-emerald-800 group-hover:border-emerald-200 transition-colors">
                        {skill.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed pl-9">
                      {skill.description}
                    </p>

                    <div className="pl-9 flex items-center justify-between text-[10px] pt-0.5">
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded">
                          {skill.actionType}
                        </span>
                      </div>
                      <span className="text-slate-400 font-medium group-hover:text-emerald-600 flex items-center gap-0.5">
                        <span>Kích hoạt</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pedagogical Ethics & Anti-Bias Assurance */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/70 p-3.5 flex items-start gap-2.5 text-[11px] text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-snug">
              <strong>Nguyên tắc sư phạm:</strong> Agent tuân thủ nghiêm ngặt chuẩn mực Thông tư 27, không so sánh học sinh, không phán xét tiêu cực, tuyệt đối bảo mật thông tin gia đình.
            </p>
          </div>
        </div>

        {/* Right Column: Conversational Console (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden h-[680px]">
          {/* Console Header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800">
                Phiên làm việc trực tiếp cùng AI Agent
              </span>
            </div>
            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'welcome_reset',
                    sender: 'agent',
                    content: 'Đã làm mới phiên đối thoại sư phạm. Thầy/Cô muốn em hỗ trợ điều gì tiếp theo?',
                    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                    followUps: ['Xem báo cáo chuyên cần', 'Soạn tin nhắn Zalo', 'Thiết kế tranh ảnh minh họa'],
                  },
                ]);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-200/60 transition-colors"
              title="Làm mới hội thoại"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Làm mới
            </button>
          </div>

          {/* Active Skill Dispatcher Bar */}
          <div className="px-4 py-2 bg-slate-100/80 border-b border-slate-200/70 flex items-center justify-between gap-2 overflow-x-auto text-[11px]">
            <div className="flex items-center gap-1.5 shrink-0 text-slate-500 font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Phân luồng:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedSkillRoute('auto')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                  selectedSkillRoute === 'auto'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tự động (AI Router)
              </button>
              <button
                type="button"
                onClick={() => setSelectedSkillRoute('circular_27')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 ${
                  selectedSkillRoute === 'circular_27'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Award className="w-3 h-3 text-emerald-600" />
                <span>Nhận xét TT27</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSkillRoute('early_warning')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 ${
                  selectedSkillRoute === 'early_warning'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                <span>Can thiệp sớm</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSkillRoute('parent_bridge')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 ${
                  selectedSkillRoute === 'parent_bridge'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Heart className="w-3 h-3 text-rose-500" />
                <span>Zalo Phụ huynh</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSkillRoute('classroom_dynamics')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 ${
                  selectedSkillRoute === 'classroom_dynamics'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Eye className="w-3 h-3 text-sky-500" />
                <span>Sơ đồ & Thị lực</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSkillRoute('image_design')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 ${
                  selectedSkillRoute === 'image_design'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Palette className="w-3 h-3 text-amber-500" />
                <span>Thiết kế Ảnh AI</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSkillRoute('lesson_schedule')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 ${
                  selectedSkillRoute === 'lesson_schedule'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Calendar className="w-3 h-3 text-indigo-500" />
                <span>Sinh hoạt & Báo giảng</span>
              </button>
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'agent' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2.5 shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none'
                  }`}
                >
                  {/* Routed Skill Badge */}
                  {msg.routedSkill && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[10px] font-bold text-emerald-800 w-fit">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>Kỹ Năng: {msg.routedSkill.name}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-mono text-slate-500">{msg.routedSkill.badge}</span>
                    </div>
                  )}

                  {/* Message Content with line breaks */}
                  <div className="whitespace-pre-wrap font-sans text-xs">
                    {msg.content}
                  </div>

                  {/* 8-Block Image Prompt Blueprint Card */}
                  {msg.imagePromptBlueprint && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-950 text-slate-100 border border-slate-800 shadow-md space-y-3 font-mono text-[11px]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Palette className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white font-sans flex items-center gap-2">
                              <span>Cấu Trúc Tạo Prompt Cho Ảnh Chuẩn 8 Khối</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono font-bold">
                                NANO BANANA 2
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                              Chủ đề: {msg.imagePromptBlueprint.subject} · Tỷ lệ: {msg.imagePromptBlueprint.aspectRatio} · Preset: {msg.imagePromptBlueprint.stylePreset}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyContent(msg.imagePromptBlueprint?.masterPrompt8Block || '')}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-sans font-semibold flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy Prompt 8 Khối</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('ai-image-design')}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] font-sans flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          >
                            <span>Mở Xưởng Vẽ</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* 8-block Code preview */}
                      <pre className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 overflow-x-auto text-[10.5px] leading-relaxed text-emerald-300 whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                        {msg.imagePromptBlueprint.masterPrompt8Block}
                      </pre>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans pt-1 border-t border-slate-900">
                        <span>Chữ khóa tiếng Việt: {msg.imagePromptBlueprint.exactVietnameseText?.join(', ') || 'Không chữ'}</span>
                        <span className="text-emerald-400 font-mono">100% Anti-AI Cliché & Cultural Grounding</span>
                      </div>
                    </div>
                  )}

                  {/* Interactive Agent Skill Action Card */}
                  {msg.actionCard && (
                    <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white border border-emerald-500/30 shadow-md space-y-2.5 font-sans">
                      <div className="flex items-center justify-between gap-2 border-b border-emerald-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
                            <Zap className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-emerald-200">
                              {msg.actionCard.title || 'Hành Động Khả Thi Tức Thì'}
                            </span>
                            {msg.actionCard.description && (
                              <p className="text-[10px] text-slate-300 mt-0.5">
                                {msg.actionCard.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-semibold border border-emerald-400/30 shrink-0">
                          Thực Thi 1-Chạm
                        </span>
                      </div>

                      {/* Action execution buttons depending on type */}
                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        {msg.actionCard.type === 'zalo_message' && (
                          <button
                            type="button"
                            onClick={() => handleOpenZaloFromMessage(msg.actionCard?.payload?.message || msg.content)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Mở Zalo Gửi Ngay</span>
                          </button>
                        )}

                        {msg.actionCard.type === 'image_design' && (
                          <button
                            type="button"
                            onClick={() => handleExecuteAction(msg.actionCard)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <Palette className="w-3.5 h-3.5" />
                            <span>Chuyển Sang Xưởng Vẽ AI</span>
                          </button>
                        )}

                        {msg.actionCard.type === 'seating_view' && (
                          <button
                            type="button"
                            onClick={() => handleExecuteAction(msg.actionCard)}
                            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Mở Sơ Đồ Lớp Học</span>
                          </button>
                        )}

                        {msg.actionCard.type === 'assessment_input' && (
                          <button
                            type="button"
                            onClick={() => handleExecuteAction(msg.actionCard)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Lưu Vào Sổ Đánh Giá</span>
                          </button>
                        )}

                        {msg.actionCard.type === 'task_create' && (
                          <button
                            type="button"
                            onClick={() => handleExecuteAction(msg.actionCard)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Tạo Nhiệm Vụ Kèm Cặp</span>
                          </button>
                        )}

                        {msg.actionCard.type === 'schedule_view' && (
                          <button
                            type="button"
                            onClick={() => handleExecuteAction(msg.actionCard)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Xem Lịch Sinh Hoạt & Báo Giảng</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCopyContent(msg.content)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-semibold flex items-center gap-1 border border-white/20 transition-all cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Agent Action Toolbar */}
                  {msg.sender === 'agent' && (
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{msg.timestamp}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyContent(msg.content)}
                          className="px-2 py-0.5 rounded-md hover:bg-slate-200/70 text-slate-600 flex items-center gap-1 transition-colors"
                          title="Sao chép nội dung"
                        >
                          <Copy className="w-3 h-3" />
                          Sao chép
                        </button>
                        <button
                          onClick={() => handleOpenZaloFromMessage(msg.content)}
                          className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 flex items-center gap-1 transition-colors font-medium"
                          title="Gửi nội dung này qua Zalo"
                        >
                          <MessageCircle className="w-3 h-3 text-blue-600" />
                          Gửi Zalo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Follow-up suggestions */}
                  {msg.followUps && msg.followUps.length > 0 && (
                    <div className="pt-1.5 flex flex-wrap gap-1.5">
                      {msg.followUps.map((fu, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(fu)}
                          className="text-[11px] bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800 font-medium px-2.5 py-1 rounded-full transition-all text-left"
                        >
                          ✨ {fu}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-xs mt-0.5 font-bold text-xs">
                    GV
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-500 flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" />
                  </div>
                  <span>Agent đang phân tích dữ liệu sư phạm và đối chiếu Thông tư 27...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
            <span className="text-slate-400 font-medium shrink-0">Gợi ý nhanh:</span>
            <button
              onClick={() => handleSendMessage('Đưa ra 3 khuyến nghị can thiệp cho học sinh nghỉ học nhiều tuần này')}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 text-slate-600 transition-all font-medium"
            >
              ⚠️ Xử lý chuyên cần
            </button>
            <button
              onClick={() => handleSendMessage('Soạn kịch bản 35 phút tiết sinh hoạt lớp chủ đề An toàn giao thông')}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 text-slate-600 transition-all font-medium"
            >
              📅 Kịch bản sinh hoạt
            </button>
            <button
              onClick={() => handleSendMessage('Tư vấn cách xếp chỗ ngồi cân bằng giữa học sinh cận thị và bạn cùng tiến')}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 text-slate-600 transition-all font-medium"
            >
              🪑 Sắp xếp chỗ ngồi
            </button>
            <button
              onClick={() => handleSendMessage('Soạn lời nhắn Zalo động viên phụ huynh đồng hành cùng con ôn bài cuối tuần')}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 text-slate-600 transition-all font-medium"
            >
              💬 Nhắn tin phụ huynh
            </button>
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={
                  selectedStudent
                    ? `Nhập câu hỏi sư phạm về em ${selectedStudent.fullName}...`
                    : 'Hỏi Trợ lý AI về học sinh, chuyên cần, sinh hoạt lớp, phụ huynh...'
                }
                disabled={loading}
                className="flex-1 text-xs px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-800 disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={loading || !inputQuery.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Send Zalo Modal */}
      {zaloModalOpen && (
        <SendZaloModal
          isOpen={zaloModalOpen}
          onClose={() => setZaloModalOpen(false)}
          initialMessage={zaloText}
          student={studentForZalo}
        />
      )}

      {/* Skill Architecture & Manifest Inspector Modal */}
      {showSkillInspectorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200/80">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Compass className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Đặc Tả Kiến Trúc Kỹ Năng Agent (Skill Manifest)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Standard v3.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Hệ thống kỹ năng sư phạm chuyên biệt tích hợp thực thi công cụ (Action Execution Hooks)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSkillInspectorModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-slate-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Architecture Core Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <h4 className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>Cơ Chế Phân Luồng</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Hỗ trợ chỉ định trực tiếp qua <strong>Dispatcher Bar</strong> hoặc tự động phân luồng theo ý đồ câu hỏi với độ trễ thấp.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100">
                  <h4 className="font-bold text-sky-900 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span>Chuẩn Sư Phạm Việt Nam</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Tuân thủ nghiêm ngặt <strong>Thông tư 27/2020/TT-BGDĐT</strong>, mô hình Can-Need-Action và triết lý GDPT 2018 không phán xét.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100">
                  <h4 className="font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Hành Động Khả Thi 1-Chạm</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Mỗi Skill xuất ra <strong>Action Card</strong> tương tác: Mở Zalo, Lưu vào sổ đánh giá, Chuyển sơ đồ lớp, Mở Xưởng vẽ AI.
                  </p>
                </div>
              </div>

              {/* Skills Manifest Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Danh Mục {skillsList.length} Kỹ Năng Sư Phạm Đã Triển Khai
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {skillsList.map((skill) => {
                    const Icon = getSkillIcon(skill.iconName);
                    return (
                      <div
                        key={skill.id}
                        className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${skill.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="font-bold text-slate-800 text-xs">
                                {skill.name}
                              </h5>
                              <span className="font-mono text-[10px] text-slate-400">
                                id: {skill.id}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 border border-emerald-200">
                            {skill.badge}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {skill.description}
                        </p>

                        {/* Capabilities Pills */}
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200/60">
                          {skill.capabilities.map((cap, i) => (
                            <span
                              key={i}
                              className="text-[9.5px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-medium"
                            >
                              ✓ {cap}
                            </span>
                          ))}
                        </div>

                        {/* Action Trigger Button */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] font-semibold text-emerald-700">
                            Hành động: {skill.actionType}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowSkillInspectorModal(false);
                              setSelectedSkillRoute(skill.id);
                              handleSendMessage(getContextualSkillPrompt(skill.id, skill.samplePrompt), skill.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <span>Thử Nghiệm</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Kiến trúc tuân thủ chuẩn Enterprise Agentic Tooling
              </span>
              <button
                type="button"
                onClick={() => setShowSkillInspectorModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
