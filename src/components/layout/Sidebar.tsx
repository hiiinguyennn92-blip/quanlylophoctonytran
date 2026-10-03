import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  BookOpen,
  Award,
  Sparkles,
  Trophy,
  ListTodo,
  Users2,
  HeartHandshake,
  Cake,
  Calendar,
  BookMarked,
  AlertCircle,
  FileBarChart,
  BotMessageSquare,
  Bot,
  Settings,
  GraduationCap,
  X,
  Clock,
  Grid3X3,
  Heart,
  Palette,
  Sun,
  Moon,
} from 'lucide-react';
import { AuthorAboutModal } from '../common/AuthorAboutModal';

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, setMobileOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, attentionSignals, darkMode, toggleDarkMode } = useApp();
  const [showAuthorModal, setShowAuthorModal] = React.useState(false);

  const isItemActive = (itemId: string) => {
    if (activeTab === itemId) return true;
    if (itemId === 'teaching-schedule' && activeTab === 'teaching-schedule') return true;
    if (itemId === 'learning-journal' && activeTab === 'learning-journal') return true;
    if (itemId === 'students' && ['students', 'attention', 'birthdays', 'parents'].includes(activeTab)) return true;
    if (itemId === 'attendance' && ['attendance', 'competition'].includes(activeTab)) return true;
    if (itemId === 'assessment' && ['assessment', 'learning', 'competency', 'ai-comments'].includes(activeTab)) return true;
    if (itemId === 'ai-agent' && ['ai-agent', 'ai-image-design'].includes(activeTab)) return true;
    if (itemId === 'schedule' && ['schedule', 'timetable', 'tasks', 'events', 'journal'].includes(activeTab)) return true;
    if (itemId === 'reports' && ['reports', 'settings'].includes(activeTab)) return true;
    return false;
  };

  const navSections: NavSection[] = [
    {
      title: 'Giảng dạy & Chủ nhiệm',
      items: [
        { id: 'dashboard', label: 'Tổng quan lớp học', icon: LayoutDashboard },
        { id: 'teaching-schedule', label: 'Lịch dạy & Kế hoạch bài', icon: Calendar },
        { id: 'learning-journal', label: 'Nhật ký học tập học sinh', icon: BookOpen },
        {
          id: 'students',
          label: 'Học sinh & Phụ huynh',
          icon: Users,
          badge: attentionSignals.length > 0 ? attentionSignals.length : undefined,
        },
        { id: 'attendance', label: 'Điểm danh & Thi đua', icon: CheckSquare },
        { id: 'assessment', label: 'Sổ đánh giá TT27', icon: Award },
        { id: 'seating', label: 'Sơ đồ lớp học 2D', icon: Grid3X3 },
      ],
    },
    {
      title: 'Trợ lý AI & Lịch trình',
      items: [
        { id: 'ai-agent', label: 'Trợ lý AI Toàn năng', icon: Bot, highlight: true },
        { id: 'schedule', label: 'Thời khóa biểu & Sự kiện', icon: Clock },
        { id: 'reports', label: 'Báo cáo & Cài đặt', icon: FileBarChart },
      ],
    },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    if (setMobileOpen) setMobileOpen(false);
    if (onCloseMobile) onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 select-none transition-colors duration-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 ring-2 ring-emerald-500/20 shrink-0">
            <GraduationCap className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none truncate">
                Trợ Lý Chủ Nhiệm
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium leading-none truncate">
              Quản lý lớp học thông minh
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            if (setMobileOpen) setMobileOpen(false);
            if (onCloseMobile) onCloseMobile();
          }}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Đóng menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List grouped by Section */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full relative flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150 text-left cursor-pointer group ${
                    isActive
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 font-semibold shadow-2xs ring-1 ring-emerald-300/70 dark:ring-emerald-700/60'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {isActive && (
                    <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  )}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                        isActive
                          ? 'text-emerald-700 dark:text-emerald-400 stroke-[2.2]'
                          : item.highlight
                          ? 'text-indigo-500 dark:text-indigo-400 group-hover:text-indigo-600 stroke-[1.8]'
                          : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 stroke-[1.8]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="shrink-0 px-1.5 py-0.2 text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && !item.badge && (
                    <span className="shrink-0 text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.2 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 rounded">
                      AI
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Standard Note & App Info */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        {/* Dark Mode Quick Toggle */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer group text-left shadow-2xs"
          title={darkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối bảo vệ mắt'}
        >
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-50 text-indigo-600'
            }`}>
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </div>
            <div className="truncate">
              <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate">
                {darkMode ? 'Chế độ Ban đêm' : 'Chế độ Ban ngày'}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-400 truncate">
                {darkMode ? 'Bật bảo vệ mắt' : 'Bấm để đổi giao diện'}
              </div>
            </div>
          </div>
          <div className={`w-8 h-4 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
            darkMode ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
          }`}>
            <span className="w-3 h-3 rounded-full bg-white shadow-2xs" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setShowAuthorModal(true)}
          className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer group text-left shadow-2xs"
          title="Bấm để xem hướng dẫn sử dụng và giới thiệu ứng dụng"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
              AI
            </div>
            <div className="truncate">
              <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] group-hover:text-emerald-800 dark:group-hover:text-emerald-400 truncate">
                Sổ Chủ Nhiệm 4.0
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-400 truncate">Hướng dẫn & Trợ giúp</div>
            </div>
          </div>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 group-hover:scale-110 transition-transform shrink-0" />
        </button>

        <div className="flex items-center justify-between px-1 text-[10px] text-slate-400 dark:text-slate-400">
          <span className="font-semibold text-emerald-800 dark:text-emerald-400">Thông tư 27-BGDĐT</span>
          <span>v2.5</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => {
            if (setMobileOpen) setMobileOpen(false);
            if (onCloseMobile) onCloseMobile();
          }}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-200 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </div>

      {/* Author About Modal */}
      <AuthorAboutModal
        isOpen={showAuthorModal}
        onClose={() => setShowAuthorModal(false)}
      />
    </>
  );
};
