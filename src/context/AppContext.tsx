import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  UserProfile,
  ClassInfo,
  Student,
  ParentContact,
  AttendanceRecord,
  Assessment,
  CompetencyEvaluation,
  CompetitionEntry,
  Task,
  TaskCompletion,
  ParentInteraction,
  JournalEntry,
  ClassEvent,
  AttentionSignal,
  NotificationItem,
  TimetableCell,
  SeatingAssignment,
  TeachingScheduleEntry,
  TeachingScheduleRule,
  StudentLearningJournalEntry,
} from '../types';
import { AuthService } from '../services/authService';
import {
  ClassRepository,
  StudentRepository,
  ParentRepository,
  AttendanceRepository,
  LearningRepository,
  CompetitionRepository,
  TaskRepository,
  JournalRepository,
  EventRepository,
  TimetableRepository,
  SeatingRepository,
  TeachingScheduleRepository,
  StudentLearningJournalRepository,
} from '../repositories/dataRepository';

import { SampleDataService } from '../services/sampleDataService';
import { format, isThisWeek, isThisMonth } from 'date-fns';
import { isBirthdayToday } from '../utils/dateUtils';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

const SUBJECT_NAME_MAP: Record<string, string> = {
  toan: 'Toán',
  tieng_viet: 'Tiếng Việt',
  tieng_anh: 'Tiếng Anh',
  khoa_hoc: 'Khoa học',
  lich_su_dia_ly: 'Lịch sử & Địa lý',
  dao_duc: 'Đạo đức',
  tin_hoc: 'Tin học',
  cong_nghe: 'Công nghệ',
  my_thuat: 'Mỹ thuật',
  am_nhac: 'Âm nhạc',
  the_duc: 'Giáo dục thể chất',
  hoat_dong_trai_nghiem: 'HĐTN',
};

interface AppContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  loadingAuth: boolean;
  classes: ClassInfo[];
  activeClass: ClassInfo | null;
  setActiveClassId: (idOrUpdater: string | ((prev: string) => string)) => void;
  refreshClasses: () => Promise<void>;
  
  // Data for active class
  students: Student[];
  parents: ParentContact[];
  attendanceRecords: AttendanceRecord[];
  assessments: Assessment[];
  competencies: CompetencyEvaluation[];
  competitionEntries: CompetitionEntry[];
  tasks: Task[];
  taskCompletions: TaskCompletion[];
  parentInteractions: ParentInteraction[];
  journalEntries: JournalEntry[];
  classEvents: ClassEvent[];
  timetable: TimetableCell[];
  seatingAssignments: SeatingAssignment[];

  // Module: Lịch dạy (Teaching Schedule)
  teachingSchedules: TeachingScheduleEntry[];
  teachingRules: TeachingScheduleRule[];
  addTeachingScheduleEntry: (entry: Omit<TeachingScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TeachingScheduleEntry>;
  updateTeachingScheduleEntry: (id: string, updates: Partial<TeachingScheduleEntry>) => Promise<void>;
  deleteTeachingScheduleEntry: (id: string) => Promise<void>;
  completeTeachingScheduleEntry: (id: string) => Promise<void>;
  addTeachingRule: (rule: Omit<TeachingScheduleRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TeachingScheduleRule>;
  updateTeachingRule: (id: string, updates: Partial<TeachingScheduleRule>) => Promise<void>;
  deleteTeachingRule: (id: string) => Promise<void>;
  generateSchedulesFromRules: (startDate: string, endDate: string) => Promise<void>;

  // Module: Nhật ký học tập học sinh (Student Learning Journal)
  studentLearningJournals: StudentLearningJournalEntry[];
  addStudentLearningJournal: (entry: Omit<StudentLearningJournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<StudentLearningJournalEntry>;
  bulkAddStudentLearningJournals: (items: Array<Omit<StudentLearningJournalEntry, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<StudentLearningJournalEntry[]>;
  updateStudentLearningJournal: (id: string, updates: Partial<StudentLearningJournalEntry>) => Promise<void>;
  deleteStudentLearningJournal: (id: string) => Promise<void>;

  // Cross-module linking / prefill states
  learningJournalPrefill: {
    studentId?: string;
    studentName?: string;
    subject?: string;
    lessonTitle?: string;
    date?: string;
    scheduleEntryId?: string;
  } | null;
  setLearningJournalPrefill: (prefill: {
    studentId?: string;
    studentName?: string;
    subject?: string;
    lessonTitle?: string;
    date?: string;
    scheduleEntryId?: string;
  } | null) => void;

  taskPrefill: {
    title?: string;
    subject?: string;
    dueDate?: string;
  } | null;
  setTaskPrefill: (prefill: {
    title?: string;
    subject?: string;
    dueDate?: string;
  } | null) => void;
  
  // Computed / Derived
  attentionSignals: AttentionSignal[];
  notifications: NotificationItem[];
  
  // Theme / Dark Mode
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  toggleDarkMode: () => void;
  markNotificationRead: (id: string) => void;
  
  // UI states
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  
  // Modals & Navigation
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  welcomeModalUser: UserProfile | null;
  setWelcomeModalUser: (user: UserProfile | null) => void;
  quickActionTarget: string | null;
  setQuickActionTarget: (target: string | null) => void;
  selectedStudentForDetail: Student | null;
  setSelectedStudentForDetail: (student: Student | null) => void;
  
  // Reload & Scalable Domain Refreshers (avoids multi-user database overload)
  refreshActiveData: () => Promise<void>;
  refreshStudents: () => Promise<void>;
  refreshAttendance: () => Promise<void>;
  refreshAssessments: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  refreshParents: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  refreshTimetable: () => Promise<void>;
  refreshSeating: () => Promise<void>;
  refreshTeachingSchedules: () => Promise<void>;
  refreshStudentLearningJournals: () => Promise<void>;
  seedDemoClass: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [activeClassId, setActiveClassIdState] = useState<string>(() => {
    return localStorage.getItem('last_selected_class_id') || '';
  });
  const [activeTab, setActiveTabState] = useState<string>('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Class data
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<ParentContact[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [competencies, setCompetencies] = useState<CompetencyEvaluation[]>([]);
  const [competitionEntries, setCompetitionEntries] = useState<CompetitionEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([]);
  const [parentInteractions, setParentInteractions] = useState<ParentInteraction[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [classEvents, setClassEvents] = useState<ClassEvent[]>([]);
  const [timetable, setTimetable] = useState<TimetableCell[]>([]);
  const [seatingAssignments, setSeatingAssignments] = useState<SeatingAssignment[]>([]);

  // Teaching schedules & rules
  const [teachingSchedules, setTeachingSchedules] = useState<TeachingScheduleEntry[]>([]);
  const [teachingRules, setTeachingRules] = useState<TeachingScheduleRule[]>([]);

  // Student Learning Journals
  const [studentLearningJournals, setStudentLearningJournals] = useState<StudentLearningJournalEntry[]>([]);

  // Cross-module linking / prefill
  const [learningJournalPrefill, setLearningJournalPrefill] = useState<{
    studentId?: string;
    studentName?: string;
    subject?: string;
    lessonTitle?: string;
    date?: string;
    scheduleEntryId?: string;
  } | null>(null);

  const [taskPrefill, setTaskPrefill] = useState<{
    title?: string;
    subject?: string;
    dueDate?: string;
  } | null>(null);


  // Modals
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [welcomeModalUser, setWelcomeModalUser] = useState<UserProfile | null>(null);
  const [quickActionTarget, setQuickActionTarget] = useState<string | null>(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);

  // Read notifications
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('read_notifications') || '[]');
    } catch {
      return [];
    }
  });

  // Dark Mode Theme State
  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('app_dark_mode');
      if (saved !== null) return saved === 'true';
      return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('app_dark_mode', 'true');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('app_dark_mode', 'false');
      }
    } catch (e) {
      console.warn('Failed to update dark mode:', e);
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkModeState((prev) => !prev);
  }, []);

  const setDarkMode = useCallback((val: boolean | ((prev: boolean) => boolean)) => {
    setDarkModeState(val);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setActiveClassId = useCallback((idOrUpdater: string | ((prev: string) => string)) => {
    setActiveClassIdState((prev) => {
      const nextId = typeof idOrUpdater === 'function' ? idOrUpdater(prev) : idOrUpdater;
      if (nextId) localStorage.setItem('last_selected_class_id', nextId);
      return nextId;
    });
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen to Auth state
  useEffect(() => {
    const unsubscribe = AuthService.onAuth(async (user) => {
      if (user) {
        try {
          const profile = await AuthService.syncUserProfile(user);
          setCurrentUser(profile);
        } catch {
          setCurrentUser({
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || 'Giáo viên',
            email: user.email || '',
            role: 'teacher',
          });
        }
      } else {
        // Fallback demo/guest user to ensure teacher can always evaluate without blocker
        const savedDemo = localStorage.getItem('demo_teacher_user');
        if (savedDemo) {
          try {
            setCurrentUser(JSON.parse(savedDemo));
          } catch {
            const fallbackGuest = {
              uid: 'guest_teacher_preview',
              displayName: 'Cô Nguyễn Thị Mai',
              email: 'giaovien.tieuhoc@demo.vn',
              role: 'teacher' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            localStorage.setItem('demo_teacher_user', JSON.stringify(fallbackGuest));
            setCurrentUser(fallbackGuest);
          }
        } else {
          const wasExplicitlyLoggedOut = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('user_logged_out') === 'true';
          if (!wasExplicitlyLoggedOut) {
            const defaultDemo = {
              uid: 'guest_teacher_preview',
              displayName: 'Cô Nguyễn Thị Mai',
              email: 'giaovien.tieuhoc@demo.vn',
              role: 'teacher' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            localStorage.setItem('demo_teacher_user', JSON.stringify(defaultDemo));
            setCurrentUser(defaultDemo);
          } else {
            setCurrentUser(null);
          }
        }
      }
      setLoadingAuth(false);
    });

    const safetyTimeout = setTimeout(() => {
      setLoadingAuth(false);
    }, 1500);

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, []);

  // Listen for real-time online/offline network events
  useEffect(() => {
    const handleOnline = () => {
      showToast('🟢 Đã khôi phục kết nối mạng Internet. Hệ thống sẵn sàng đồng bộ!', 'success');
    };
    const handleOffline = () => {
      showToast('⚡ Mất kết nối Internet: Hệ thống chuyển sang chế độ lưu trữ ngoại tuyến an toàn.', 'info');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Fetch classes when user is authenticated
  const refreshClasses = useCallback(async () => {
    if (!currentUser) {
      setClasses([]);
      return;
    }
    try {
      let cls = await ClassRepository.getClassesByOwner(currentUser.uid);
      if (cls.length === 0 && currentUser.uid.startsWith('guest_teacher_')) {
        const demoId = await SampleDataService.seedDemoData(currentUser.uid, currentUser.displayName);
        cls = await ClassRepository.getClassesByOwner(currentUser.uid);
        setClasses(cls);
        setActiveClassId(demoId);
        setShowOnboarding(false);
        return;
      }
      setClasses(cls);
      if (cls.length > 0) {
        setActiveClassId((prev) => (!prev || !cls.find((c) => c.id === prev) ? cls[0].id : prev));
        setShowOnboarding(false);
      } else {
        setShowOnboarding(true);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
      setShowOnboarding(true);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refreshClasses();
    }
  }, [currentUser, refreshClasses]);

  const activeClass = classes.find((c) => c.id === activeClassId) || null;

  // In-flight deduplication ref to prevent concurrent duplicate round-trips
  const inFlightFullRefreshRef = useRef<Promise<void> | null>(null);

  const dedupeItems = <T extends { id: string }>(arr: T[] | undefined): T[] => {
    if (!arr) return [];
    const seen = new Set<string>();
    return arr.filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  // Scalable Domain Refreshers: update only affected sub-modules instead of full 16-query storm
  const refreshStudents = useCallback(async () => {
    if (!currentUser || !activeClassId) return;
    try {
      const data = await StudentRepository.getStudents(activeClassId, currentUser.uid);
      setStudents(dedupeItems(data));
    } catch (e) {
      console.error('refreshStudents error:', e);
    }
  }, [currentUser, activeClassId]);

  const refreshAttendance = useCallback(async () => {
    if (!currentUser || !activeClassId) return;
    try {
      const data = await AttendanceRepository.getAllAttendance(activeClassId, currentUser.uid);
      setAttendanceRecords(dedupeItems(data));
    } catch (e) {
      console.error('refreshAttendance error:', e);
    }
  }, [currentUser, activeClassId]);

  const refreshAssessments = useCallback(async () => {
    if (!currentUser || !activeClassId) return;
    try {
      const [assess, comp] = await Promise.all([
        LearningRepository.getAssessments(activeClassId, currentUser.uid),
        LearningRepository.getCompetencies(activeClassId, currentUser.uid),
      ]);
      setAssessments(dedupeItems(assess));
      setCompetencies(dedupeItems(comp));
    } catch (e) {
      console.error('refreshAssessments error:', e);
    }
  }, [currentUser, activeClassId]);

  const refreshTasks = useCallback(async () => {
    if (!currentUser || !activeClassId) return;
    try {
      const [tsks, cmpls] = await Promise.all([
        TaskRepository.getTasks(activeClassId, currentUser.uid),
        TaskRepository.getCompletions(activeClassId, currentUser.uid),
      ]);
      setTasks(dedupeItems(tsks));
      setTaskCompletions(dedupeItems(cmpls));
    } catch (e) {
      console.error('refreshTasks error:', e);
    }
  }, [currentUser, activeClassId]);

  const refreshParents = useCallback(async () => {
    if (!currentUser || !activeClassId) return;
    try {
      const [pts, interact] = await Promise.all([
        ParentRepository.getContacts(activeClassId, currentUser.uid),
        ParentRepository.getInteractions(activeClassId, currentUser.uid),
      ]);
      setParents(dedupeItems(pts));
      setParentInteractions(dedupeItems(interact));
    } catch (e) {
      console.error('refreshParents error:', e);
    }
  }, [currentUser, activeClassId]);

  const refreshEvents = useCallback(async () => {
    if (!currentUser || !activeClassId) return;
    try {
      const [events, journals, entries] = await Promise.all([
        EventRepository.getEvents(activeClassId, currentUser.uid),
        JournalRepository.getEntries(activeClassId, currentUser.uid),
        CompetitionRepository.getEntries(activeClassId, currentUser.uid),
      ]);
      setClassEvents(dedupeItems(events));
      setJournalEntries(dedupeItems(journals));
      setCompetitionEntries(dedupeItems(entries));
    } catch (e) {
      console.error('refreshEvents error:', e);
    }
  }, [currentUser, activeClassId]);

  const refreshTimetable = useCallback(async () => {
    if (!currentUser || !activeClassId) return;
    try {
      const data = await TimetableRepository.getTimetable(activeClassId, currentUser.uid);
      setTimetable(dedupeItems(data));
    } catch (e) {
      console.error('refreshTimetable error:', e);
    }
  }, [currentUser, activeClassId]);

  const refreshSeating = useCallback(async () => {
    if (!currentUser || !activeClassId) return;
    try {
      const data = await SeatingRepository.getSeating(activeClassId, currentUser.uid);
      setSeatingAssignments(dedupeItems(data));
    } catch (e) {
      console.error('refreshSeating error:', e);
    }
  }, [currentUser, activeClassId]);

  const refreshTeachingSchedules = useCallback(async () => {
    if (!currentUser || !activeClassId) return;
    try {
      const [schedules, rules] = await Promise.all([
        TeachingScheduleRepository.getByClass(currentUser.uid, activeClassId),
        TeachingScheduleRepository.getRules(currentUser.uid, activeClassId),
      ]);
      setTeachingSchedules(dedupeItems(schedules));
      setTeachingRules(dedupeItems(rules));
    } catch (e) {
      console.error('refreshTeachingSchedules error:', e);
    }
  }, [currentUser, activeClassId]);

  const refreshStudentLearningJournals = useCallback(async () => {
    if (!currentUser || !activeClassId) return;
    try {
      const data = await StudentLearningJournalRepository.getByClass(currentUser.uid, activeClassId);
      setStudentLearningJournals(dedupeItems(data));
    } catch (e) {
      console.error('refreshStudentLearningJournals error:', e);
    }
  }, [currentUser, activeClassId]);

  // Load all child data for active class with in-flight deduplication
  const refreshActiveData = useCallback(async () => {
    if (!currentUser || !activeClassId) {
      setStudents([]);
      setParents([]);
      setAttendanceRecords([]);
      setAssessments([]);
      setCompetencies([]);
      setCompetitionEntries([]);
      setTasks([]);
      setTaskCompletions([]);
      setParentInteractions([]);
      setJournalEntries([]);
      setClassEvents([]);
      setTeachingSchedules([]);
      setTeachingRules([]);
      setStudentLearningJournals([]);
      return;
    }

    // Coalesce concurrent requests into a single in-flight Promise
    if (inFlightFullRefreshRef.current) {
      return inFlightFullRefreshRef.current;
    }

    const fetchPromise = (async () => {
      try {
        const [
          stus,
          pts,
          att,
          assess,
          comp,
          entries,
          tsks,
          cmpls,
          interact,
          journals,
          events,
          ttable,
          seating,
          schedules,
          rules,
          lJournals,
        ] = await Promise.all([
          StudentRepository.getStudents(activeClassId, currentUser.uid),
          ParentRepository.getContacts(activeClassId, currentUser.uid),
          AttendanceRepository.getAllAttendance(activeClassId, currentUser.uid),
          LearningRepository.getAssessments(activeClassId, currentUser.uid),
          LearningRepository.getCompetencies(activeClassId, currentUser.uid),
          CompetitionRepository.getEntries(activeClassId, currentUser.uid),
          TaskRepository.getTasks(activeClassId, currentUser.uid),
          TaskRepository.getCompletions(activeClassId, currentUser.uid),
          ParentRepository.getInteractions(activeClassId, currentUser.uid),
          JournalRepository.getEntries(activeClassId, currentUser.uid),
          EventRepository.getEvents(activeClassId, currentUser.uid),
          TimetableRepository.getTimetable(activeClassId, currentUser.uid),
          SeatingRepository.getSeating(activeClassId, currentUser.uid),
          TeachingScheduleRepository.getByClass(currentUser.uid, activeClassId),
          TeachingScheduleRepository.getRules(currentUser.uid, activeClassId),
          StudentLearningJournalRepository.getByClass(currentUser.uid, activeClassId),
        ]);

        setStudents(dedupeItems(stus));
        setParents(dedupeItems(pts));
        setAttendanceRecords(dedupeItems(att));
        setAssessments(dedupeItems(assess));
        setCompetencies(dedupeItems(comp));
        setCompetitionEntries(dedupeItems(entries));
        setTasks(dedupeItems(tsks));
        setTaskCompletions(dedupeItems(cmpls));
        setParentInteractions(dedupeItems(interact));
        setJournalEntries(dedupeItems(journals));
        setClassEvents(dedupeItems(events));
        setTimetable(dedupeItems(ttable));
        setSeatingAssignments(dedupeItems(seating));
        setTeachingSchedules(dedupeItems(schedules));
        setTeachingRules(dedupeItems(rules));
        setStudentLearningJournals(dedupeItems(lJournals));
      } catch (error) {
        console.error('Failed to load active classroom data:', error);
      } finally {
        inFlightFullRefreshRef.current = null;
      }
    })();

    inFlightFullRefreshRef.current = fetchPromise;
    return fetchPromise;
  }, [currentUser, activeClassId]);

  // Teaching Schedule CRUD Handlers
  const addTeachingScheduleEntry = useCallback(
    async (entryData: Omit<TeachingScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      const created = await TeachingScheduleRepository.create(entryData);
      setTeachingSchedules((prev) =>
        [...prev, created].sort((a, b) => {
          const d = a.date.localeCompare(b.date);
          if (d !== 0) return d;
          return a.startTime.localeCompare(b.startTime);
        })
      );
      return created;
    },
    []
  );

  const updateTeachingScheduleEntry = useCallback(
    async (id: string, updates: Partial<TeachingScheduleEntry>) => {
      if (!currentUser) return;
      await TeachingScheduleRepository.update(id, updates, currentUser.uid);
      setTeachingSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s))
      );
    },
    [currentUser]
  );

  const deleteTeachingScheduleEntry = useCallback(
    async (id: string) => {
      if (!currentUser) return;
      await TeachingScheduleRepository.delete(id, currentUser.uid);
      setTeachingSchedules((prev) => prev.filter((s) => s.id !== id));
    },
    [currentUser]
  );

  const completeTeachingScheduleEntry = useCallback(
    async (id: string) => {
      await updateTeachingScheduleEntry(id, { status: 'completed' });
    },
    [updateTeachingScheduleEntry]
  );

  const addTeachingRule = useCallback(
    async (ruleData: Omit<TeachingScheduleRule, 'id' | 'createdAt' | 'updatedAt'>) => {
      const created = await TeachingScheduleRepository.createRule(ruleData);
      setTeachingRules((prev) => [...prev, created]);
      return created;
    },
    []
  );

  const updateTeachingRule = useCallback(
    async (id: string, updates: Partial<TeachingScheduleRule>) => {
      if (!currentUser) return;
      await TeachingScheduleRepository.updateRule(id, updates, currentUser.uid);
      setTeachingRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r))
      );
    },
    [currentUser]
  );

  const deleteTeachingRule = useCallback(
    async (id: string) => {
      if (!currentUser) return;
      await TeachingScheduleRepository.deleteRule(id, currentUser.uid);
      setTeachingRules((prev) => prev.filter((r) => r.id !== id));
    },
    [currentUser]
  );

  const generateSchedulesFromRules = useCallback(
    async (startDate: string, endDate: string) => {
      if (!currentUser || !activeClassId) return;
      const generated = await TeachingScheduleRepository.generateFromRules(
        currentUser.uid,
        activeClassId,
        startDate,
        endDate
      );
      if (generated.length > 0) {
        setTeachingSchedules((prev) => {
          const map = new Map(prev.map((e) => [e.id, e]));
          generated.forEach((g) => map.set(g.id, g));
          return Array.from(map.values()).sort((a, b) => {
            const d = a.date.localeCompare(b.date);
            if (d !== 0) return d;
            return a.startTime.localeCompare(b.startTime);
          });
        });
      }
    },
    [currentUser, activeClassId]
  );

  // Student Learning Journal CRUD Handlers
  const addStudentLearningJournal = useCallback(
    async (data: Omit<StudentLearningJournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      const created = await StudentLearningJournalRepository.create(data);
      setStudentLearningJournals((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const bulkAddStudentLearningJournals = useCallback(
    async (items: Array<Omit<StudentLearningJournalEntry, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const created = await StudentLearningJournalRepository.bulkCreate(items);
      setStudentLearningJournals((prev) => [...created, ...prev]);
      return created;
    },
    []
  );

  const updateStudentLearningJournal = useCallback(
    async (id: string, updates: Partial<StudentLearningJournalEntry>) => {
      if (!currentUser) return;
      await StudentLearningJournalRepository.update(id, updates, currentUser.uid);
      setStudentLearningJournals((prev) =>
        prev.map((j) => (j.id === id ? { ...j, ...updates, updatedAt: new Date().toISOString() } : j))
      );
    },
    [currentUser]
  );

  const deleteStudentLearningJournal = useCallback(
    async (id: string) => {
      if (!currentUser) return;
      await StudentLearningJournalRepository.delete(id, currentUser.uid);
      setStudentLearningJournals((prev) => prev.filter((j) => j.id !== id));
    },
    [currentUser]
  );


  useEffect(() => {
    // Reset selected student detail and cross-module prefills when switching classrooms to avoid state bleeding
    setSelectedStudentForDetail(null);
    setLearningJournalPrefill(null);
    setTaskPrefill(null);

    if (activeClassId && currentUser) {
      refreshActiveData();
    } else {
      setStudents([]);
      setParents([]);
      setAttendanceRecords([]);
      setAssessments([]);
      setCompetencies([]);
      setCompetitionEntries([]);
      setTasks([]);
      setTaskCompletions([]);
      setParentInteractions([]);
      setJournalEntries([]);
      setClassEvents([]);
      setTimetable([]);
      setSeatingAssignments([]);
      setTeachingSchedules([]);
      setTeachingRules([]);
      setStudentLearningJournals([]);
    }
  }, [activeClassId, currentUser, refreshActiveData]);

  // Derived: Students requiring teacher attention (Optimized O(N) Deterministic Rules with Indexed Lookups)
  const attentionSignals: AttentionSignal[] = React.useMemo(() => {
    if (!students.length) return [];
    const signals: AttentionSignal[] = [];
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // Fast Single-Pass Index Maps (O(Records) instead of O(Students * Records))
    const attByStudent = new Map<string, AttendanceRecord[]>();
    for (const r of attendanceRecords) {
      const arr = attByStudent.get(r.studentId);
      if (arr) arr.push(r);
      else attByStudent.set(r.studentId, [r]);
    }

    const assessByStudent = new Map<string, Assessment[]>();
    for (const a of assessments) {
      const arr = assessByStudent.get(a.studentId);
      if (arr) arr.push(a);
      else assessByStudent.set(a.studentId, [a]);
    }

    const completedTaskIdsByStudent = new Map<string, Set<string>>();
    for (const c of taskCompletions) {
      if (c.completed) {
        let set = completedTaskIdsByStudent.get(c.studentId);
        if (!set) {
          set = new Set();
          completedTaskIdsByStudent.set(c.studentId, set);
        }
        set.add(c.taskId);
      }
    }

    const overdueCandidateTasks = tasks.filter((t) => t.dueAt < todayStr);

    students.forEach((s) => {
      // 1. Attendance: 2 or more unexcused or 3+ total absences
      const studentAtt = attByStudent.get(s.id) || [];
      const unexcused: AttendanceRecord[] = [];
      const excused: AttendanceRecord[] = [];
      const lates: AttendanceRecord[] = [];

      for (const r of studentAtt) {
        if (r.status === 'unexcused_absence') unexcused.push(r);
        else if (r.status === 'excused_absence') excused.push(r);
        else if (r.status === 'late') lates.push(r);
      }

      if (unexcused.length >= 1 || excused.length >= 3) {
        signals.push({
          id: `sig_${s.id}_absence`,
          studentId: s.id,
          studentName: s.fullName,
          groupId: s.groupId,
          signalType: 'high_absence',
          title: 'Vắng học nhiều buổi',
          description: `Đã vắng ${unexcused.length} buổi không phép, ${excused.length} buổi có phép.`,
          evidence: {
            count: unexcused.length + excused.length,
            dates: [...unexcused, ...excused].map((r) => r.date),
            details: 'Cần liên hệ phụ huynh để nắm tình hình sức khỏe hoặc gia đình.',
          },
        });
      }

      if (lates.length >= 2) {
        signals.push({
          id: `sig_${s.id}_late`,
          studentId: s.id,
          studentName: s.fullName,
          groupId: s.groupId,
          signalType: 'frequent_late',
          title: 'Đi học muộn nhiều lần',
          description: `Đã ghi nhận ${lates.length} buổi đi muộn.`,
          evidence: {
            count: lates.length,
            dates: lates.map((r) => r.date),
            details: 'Cần trao đổi nhẹ nhàng với học sinh và nhắc nhở gia đình chuẩn bị giờ giấc sớm hơn.',
          },
        });
      }

      // 2. Learning: Has "Chưa hoàn thành" assessment or score <= 5
      const studentAssess = assessByStudent.get(s.id) || [];
      const lowAssess = studentAssess.filter(
        (a) => a.level === 'Chưa hoàn thành' || (a.score !== undefined && a.score <= 5)
      );
      if (lowAssess.length > 0) {
        const uniqueSubjects = Array.from(
          new Set(lowAssess.map((a) => SUBJECT_NAME_MAP[a.subjectId] || a.subjectId))
        );
        signals.push({
          id: `sig_${s.id}_learning`,
          studentId: s.id,
          studentName: s.fullName,
          groupId: s.groupId,
          signalType: 'learning_support',
          title: 'Cần hỗ trợ học tập',
          description: `Gặp khó khăn ở môn ${uniqueSubjects.join(', ')}.`,
          evidence: {
            count: lowAssess.length,
            details: `Đánh giá gần nhất đạt mức Chưa hoàn thành hoặc điểm thấp. Cần kèm thêm trong tiết phụ đạo.`,
          },
        });
      }

      // 3. Outstanding assignments
      const completedTaskIds = completedTaskIdsByStudent.get(s.id) || new Set();
      const overdueTasks = overdueCandidateTasks.filter((t) => !completedTaskIds.has(t.id));

      if (overdueTasks.length >= 2) {
        signals.push({
          id: `sig_${s.id}_tasks`,
          studentId: s.id,
          studentName: s.fullName,
          groupId: s.groupId,
          signalType: 'uncompleted_tasks',
          title: 'Nhiều nhiệm vụ quá hạn',
          description: `Chưa hoàn thành ${overdueTasks.length} bài tập/nhiệm vụ đã qua hạn nộp.`,
          evidence: {
            count: overdueTasks.length,
            details: overdueTasks.map((t) => t.title).join('; '),
          },
        });
      }
    });

    return signals;
  }, [students, attendanceRecords, assessments, tasks, taskCompletions]);

  // Derived: Notifications
  const notifications: NotificationItem[] = React.useMemo(() => {
    const list: NotificationItem[] = [];
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // 1. Birthdays
    students.forEach((s) => {
      if (s.dob && isBirthdayToday(s.dob)) {
        list.push({
          id: `bday_${s.id}_today`,
          type: 'birthday',
          studentId: s.id,
          title: `Sinh nhật hôm nay: ${s.fullName}`,
          message: `Hôm nay là sinh nhật của em ${s.fullName} (${s.groupId}). Thầy/Cô gửi lời chúc mừng nhé!`,
          date: todayStr,
          read: readNotificationIds.includes(`bday_${s.id}_today`),
          actionRoute: 'birthdays',
        });
      }
    });

    // 2. Urgent Attention Signals
    attentionSignals.slice(0, 5).forEach((sig) => {
      const nid = `sig_${sig.studentId}_${sig.signalType}_${todayStr}`;
      list.push({
        id: nid,
        type: 'attendance_alert',
        studentId: sig.studentId,
        title: `${sig.title}: ${sig.studentName}`,
        message: sig.description,
        date: todayStr,
        read: readNotificationIds.includes(nid),
        actionRoute: 'attention',
      });
    });

    // 3. Tasks due today or tomorrow
    tasks.forEach((t) => {
      if (t.dueAt === todayStr) {
        list.push({
          id: `task_${t.id}`,
          type: 'task_due',
          taskId: t.id,
          title: `Nhiệm vụ đến hạn hôm nay: ${t.title}`,
          message: `Nhiệm vụ "${t.title}" đến hạn hôm nay. Thầy/Cô kiểm tra tiến độ học sinh nộp bài.`,
          date: todayStr,
          read: readNotificationIds.includes(`task_${t.id}`),
          actionRoute: 'tasks',
        });
      }
    });

    // Deduplicate notifications by id
    const seenNotifIds = new Set<string>();
    return list.filter((n) => {
      if (seenNotifIds.has(n.id)) return false;
      seenNotifIds.add(n.id);
      return true;
    });
  }, [students, attentionSignals, tasks, readNotificationIds]);

  const markNotificationRead = useCallback((id: string) => {
    setReadNotificationIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      localStorage.setItem('read_notifications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const seedDemoClass = useCallback(async () => {
    if (!currentUser) return;
    try {
      showToast('Đang nạp dữ liệu mẫu Lớp 3A1...', 'info');
      const newClassId = await SampleDataService.seedDemoData(currentUser.uid, currentUser.displayName);
      await refreshClasses();
      setActiveClassId(newClassId);
      showToast('Đã nạp thành công bộ dữ liệu mẫu Lớp 3A1!', 'success');
    } catch (err: any) {
      console.error('Seed demo error:', err);
      showToast('Không thể nạp dữ liệu mẫu: ' + (err.message || ''), 'error');
    }
  }, [currentUser, refreshClasses, setActiveClassId, showToast]);

  const logout = useCallback(async () => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('user_logged_out', 'true');
      }
    } catch {}
    localStorage.removeItem('demo_teacher_user');
    await AuthService.signOut();
    setCurrentUser(null);
    setClasses([]);
    showToast('Đã đăng xuất tài khoản.', 'info');
  }, [showToast]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        loadingAuth,
        classes,
        activeClass,
        setActiveClassId,
        refreshClasses,
        students,
        parents,
        attendanceRecords,
        assessments,
        competencies,
        competitionEntries,
        tasks,
        taskCompletions,
        parentInteractions,
        journalEntries,
        classEvents,
        timetable,
        seatingAssignments,
        teachingSchedules,
        teachingRules,
        addTeachingScheduleEntry,
        updateTeachingScheduleEntry,
        deleteTeachingScheduleEntry,
        completeTeachingScheduleEntry,
        addTeachingRule,
        updateTeachingRule,
        deleteTeachingRule,
        generateSchedulesFromRules,
        studentLearningJournals,
        addStudentLearningJournal,
        bulkAddStudentLearningJournals,
        updateStudentLearningJournal,
        deleteStudentLearningJournal,
        learningJournalPrefill,
        setLearningJournalPrefill,
        taskPrefill,
        setTaskPrefill,
        attentionSignals,
        notifications,
        markNotificationRead,
        darkMode,
        setDarkMode,
        toggleDarkMode,
        activeTab,
        setActiveTab,
        toasts,
        showToast,
        removeToast,
        showOnboarding,
        setShowOnboarding,
        welcomeModalUser,
        setWelcomeModalUser,
        quickActionTarget,
        setQuickActionTarget,
        selectedStudentForDetail,
        setSelectedStudentForDetail,
        refreshActiveData,
        refreshStudents,
        refreshAttendance,
        refreshAssessments,
        refreshTasks,
        refreshParents,
        refreshEvents,
        refreshTimetable,
        refreshSeating,
        refreshTeachingSchedules,
        refreshStudentLearningJournals,
        seedDemoClass,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
