import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Bell,
  ChevronDown,
  Plus,
  LogOut,
  Sparkles,
  Menu,
  CheckCircle2,
  CalendarDays,
  User,
  ExternalLink,
  Heart,
  Info,
  Sun,
  Moon,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AuthorAboutModal } from '../common/AuthorAboutModal';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  onOpenQuickSearch?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu, onOpenQuickSearch }) => {
  const {
    currentUser,
    classes,
    activeClass,
    setActiveClassId,
    students,
    parents,
    tasks,
    journalEntries,
    classEvents,
    notifications,
    markNotificationRead,
    setShowOnboarding,
    setActiveTab,
    setSelectedStudentForDetail,
    seedDemoClass,
    logout,
    setWelcomeModalUser,
    darkMode,
    toggleDarkMode,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const searchRef = useRef<HTMLDivElement>(null);
  const classRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (classRef.current && !classRef.current.contains(e.target as Node)) {
        setShowClassDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global search filtering
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matchedStudents = students.filter(
      (s) => s.fullName.toLowerCase().includes(q) || (s.studentCode && s.studentCode.toLowerCase().includes(q))
    );
    const matchedParents = parents.filter(
      (p) => p.fullName.toLowerCase().includes(q) || p.phone.includes(q)
    );
    const matchedTasks = tasks.filter((t) => t.title.toLowerCase().includes(q));
    const matchedJournals = journalEntries.filter((j) => j.content.toLowerCase().includes(q));
    const matchedEvents = classEvents.filter((e) => e.title.toLowerCase().includes(q));

    return {
      students: matchedStudents.slice(0, 5),
      parents: matchedParents.slice(0, 3),
      tasks: matchedTasks.slice(0, 3),
      journals: matchedJournals.slice(0, 3),
      events: matchedEvents.slice(0, 3),
      total:
        matchedStudents.length +
        matchedParents.length +
        matchedTasks.length +
        matchedJournals.length +
        matchedEvents.length,
    };
  }, [searchQuery, students, parents, tasks, journalEntries, classEvents]);

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const todayFormatted = React.useMemo(() => {
    try {
      return format(new Date(), "EEEE, 'ngày' dd/MM/yyyy", { locale: vi });
    } catch {
      return new Date().toLocaleDateString('vi-VN');
    }
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 py-2.5 transition-colors duration-200">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile hamburger + Class selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Mở danh mục"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Class switcher */}
          <div className="relative" ref={classRef}>
            <button
              onClick={() => setShowClassDropdown(!showClassDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors border border-slate-200/60 dark:border-slate-700"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                {activeClass ? `Lớp ${activeClass.className}` : 'Chọn lớp'}
              </span>
              {activeClass && (
                <span className="hidden sm:inline text-slate-400 dark:text-slate-400 font-normal">
                  ({activeClass.schoolYear})
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            </button>

            {showClassDropdown && (
              <div className="absolute left-0 mt-1.5 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                  Danh sách lớp học của bạn
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {classes.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveClassId(c.id);
                        setShowClassDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                        c.id === activeClass?.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-medium">Lớp {c.className}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-400 font-normal">
                          {c.schoolName} · {c.schoolYear}
                        </div>
                      </div>
                      {c.id === activeClass?.id && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1 px-1">
                  <button
                    onClick={() => {
                      setShowClassDropdown(false);
                      setShowOnboarding(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm lớp học mới</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Today's date */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium pl-2">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize">{todayFormatted}</span>
          </div>
        </div>

        {/* Center: Global Search */}
        <div className="flex-1 max-w-md relative" ref={searchRef}>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              onClick={() => {
                if (onOpenQuickSearch) {
                  onOpenQuickSearch();
                }
              }}
              placeholder="Tìm kiếm học sinh, phụ huynh, nhiệm vụ..."
              className="w-full pl-9 pr-16 py-1.5 bg-slate-100/70 hover:bg-slate-100 focus:bg-white dark:bg-slate-800/70 dark:hover:bg-slate-800 dark:focus:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg border border-transparent focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-text"
            />
            <button
              type="button"
              onClick={onOpenQuickSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer"
              title="Phím tắt: Ctrl + K hoặc Cmd + K"
            >
              <span>⌘K</span>
            </button>
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-h-96 overflow-y-auto p-2 z-50">
              {searchResults.total === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-400">
                  Không tìm thấy kết quả nào khớp với "{searchQuery}"
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Students */}
                  {searchResults.students.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-2 mb-1">
                        Học sinh ({searchResults.students.length})
                      </div>
                      {searchResults.students.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSelectedStudentForDetail(s);
                            setActiveTab('students');
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-xs transition-colors cursor-pointer"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{s.fullName}</span>
                            <span className="text-slate-400 dark:text-slate-400 ml-2">({s.studentCode || s.groupId})</span>
                          </div>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            Xem hồ sơ <ExternalLink className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Parents */}
                  {searchResults.parents.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-2 mb-1">
                        Phụ huynh ({searchResults.parents.length})
                      </div>
                      {searchResults.parents.map((p) => {
                        const matchingStudent = students.find((s) => s.id === p.studentId);
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              if (matchingStudent) {
                                setSelectedStudentForDetail(matchingStudent);
                                setActiveTab('students');
                              } else {
                                setActiveTab('parents');
                              }
                              setShowSearchResults(false);
                              setSearchQuery('');
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-xs transition-colors cursor-pointer"
                          >
                            <div>
                              <span className="font-medium text-slate-800 dark:text-slate-200">{p.fullName}</span>
                              <span className="text-slate-400 dark:text-slate-400 ml-2 text-[11px]">
                                ({p.type} · {p.phone})
                              </span>
                              {matchingStudent && (
                                <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                                  Học sinh: {matchingStudent.fullName} ({matchingStudent.groupId})
                                </div>
                              )}
                            </div>
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              Xem hồ sơ <ExternalLink className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Tasks */}
                  {searchResults.tasks.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-2 mb-1">
                        Nhiệm vụ ({searchResults.tasks.length})
                      </div>
                      {searchResults.tasks.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setActiveTab('tasks');
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left text-xs transition-colors cursor-pointer"
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{t.title}</span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-400 shrink-0">Hạn: {t.dueAt}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Theme Toggle + Notification + Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Network Health & CTO System State Indicator */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title={isOnline ? 'Hệ thống trực tuyến (Online) - Nhấn để xem Bảng kiểm toán CTO' : 'Đang làm việc ngoại tuyến (Offline) - Dữ liệu lưu cục bộ an toàn'}
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-slate-600 dark:text-slate-300 font-mono text-[10px] uppercase font-bold tracking-wider">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </button>

          {/* Dark Mode Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={darkMode ? 'Chuyển sang chế độ sáng (Giao diện ban ngày)' : 'Chuyển sang chế độ tối (Bảo vệ mắt ban đêm)'}
            aria-label="Chuyển đổi chế độ tối"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400 stroke-[2.2]" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300 stroke-[2.2]" />
            )}
          </button>

          {/* Notification Center */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Thông báo"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Thông báo & Nhắc nhở</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{notifications.length} tin</span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/80">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-400">
                      Không có thông báo mới hôm nay
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.studentId) {
                            const targetStudent = students.find((s) => s.id === n.studentId);
                            if (targetStudent) {
                              setSelectedStudentForDetail(targetStudent);
                            }
                          }
                          if (n.actionRoute) {
                            setActiveTab(n.actionRoute);
                          }
                          setShowNotifDropdown(false);
                        }}
                        className={`p-3 text-left cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                          !n.read ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Account Menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold text-xs">
                {currentUser?.displayName?.charAt(0) || 'G'}
              </div>
              <span className="hidden sm:inline font-semibold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                {currentUser?.displayName || 'Giáo viên'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {currentUser?.displayName || 'Giáo viên Chủ nhiệm'}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate mt-0.5">
                    {currentUser?.email || 'Tài khoản giáo viên'}
                  </p>
                </div>

                {/* Dark Mode Fast Switch in Menu */}
                <button
                  type="button"
                  onClick={() => {
                    toggleDarkMode();
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {darkMode ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-500" />
                    )}
                    <span>{darkMode ? 'Chế độ Sáng' : 'Chế độ Tối (Dark Mode)'}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    darkMode
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {darkMode ? 'BẬT' : 'TẮT'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowAuthorModal(true);
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors font-semibold"
                >
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span>Giới thiệu ứng dụng & Hướng dẫn</span>
                </button>

                {currentUser && (
                  <button
                    onClick={() => {
                      setWelcomeModalUser(currentUser);
                      setShowUserDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-medium transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Xem hiệu ứng chào mừng</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    seedDemoClass();
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-medium transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Nạp dữ liệu mẫu Lớp 3A1</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Cài đặt hệ thống</span>
                </button>

                <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Author About Modal */}
      <AuthorAboutModal
        isOpen={showAuthorModal}
        onClose={() => setShowAuthorModal(false)}
      />
    </header>
  );
};
