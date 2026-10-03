/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { ToastContainer } from './components/common/ToastContainer';
import { Student } from './types';
import { DashboardView } from './components/views/DashboardView';

// High Performance Code-Splitting: Lazy load non-initial heavy views
const TeachingScheduleView = lazy(() =>
  import('./components/views/TeachingScheduleView').then((m) => ({ default: m.TeachingScheduleView }))
);
const StudentLearningJournalView = lazy(() =>
  import('./components/views/StudentLearningJournalView').then((m) => ({ default: m.StudentLearningJournalView }))
);
const StudentsUnifiedView = lazy(() =>
  import('./components/views/StudentsUnifiedView').then((m) => ({ default: m.StudentsUnifiedView }))
);
const AttendanceUnifiedView = lazy(() =>
  import('./components/views/AttendanceUnifiedView').then((m) => ({ default: m.AttendanceUnifiedView }))
);
const AssessmentUnifiedView = lazy(() =>
  import('./components/views/AssessmentUnifiedView').then((m) => ({ default: m.AssessmentUnifiedView }))
);
const AIAgentUnifiedView = lazy(() =>
  import('./components/views/AIAgentUnifiedView').then((m) => ({ default: m.AIAgentUnifiedView }))
);
const ScheduleUnifiedView = lazy(() =>
  import('./components/views/ScheduleUnifiedView').then((m) => ({ default: m.ScheduleUnifiedView }))
);
const SeatingChartView = lazy(() =>
  import('./components/views/SeatingChartView').then((m) => ({ default: m.SeatingChartView }))
);
const ReportsUnifiedView = lazy(() =>
  import('./components/views/ReportsUnifiedView').then((m) => ({ default: m.ReportsUnifiedView }))
);

// Lazy loaded modals to keep initial bundle ultra lightweight
const OnboardingModal = lazy(() =>
  import('./components/common/OnboardingModal').then((m) => ({ default: m.OnboardingModal }))
);
const AuthModal = lazy(() =>
  import('./components/auth/AuthModal').then((m) => ({ default: m.AuthModal }))
);
const LoginWelcomeModal = lazy(() =>
  import('./components/common/LoginWelcomeModal').then((m) => ({ default: m.LoginWelcomeModal }))
);
const QuickSearchModal = lazy(() =>
  import('./components/common/QuickSearchModal').then((m) => ({ default: m.QuickSearchModal }))
);
const SendZaloModal = lazy(() =>
  import('./components/common/SendZaloModal').then((m) => ({ default: m.SendZaloModal }))
);
const StudentDetailDrawer = lazy(() =>
  import('./components/views/StudentsView').then((m) => ({ default: m.StudentDetailDrawer }))
);

const ViewSkeletonFallback: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-10 bg-slate-200/70 dark:bg-slate-800/70 rounded-xl w-64" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl" />
      ))}
    </div>
    <div className="h-96 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl" />
  </div>
);

const MainLayout: React.FC = () => {
  const {
    activeTab,
    currentUser,
    loadingAuth,
    selectedStudentForDetail,
    setSelectedStudentForDetail,
    parents,
    setActiveTab,
    welcomeModalUser,
    setWelcomeModalUser,
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [zaloTargetStudent, setZaloTargetStudent] = useState<Student | null>(null);

  // Global Keyboard Shortcuts (Cmd/Ctrl + K to open Quick Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowQuickSearch((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Đang tải dữ liệu lớp học...
          </p>
        </div>
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'teaching-schedule':
        return <TeachingScheduleView />;
      case 'learning-journal':
        return <StudentLearningJournalView />;
      case 'students':
        return <StudentsUnifiedView initialSubTab="list" />;
      case 'attention':
        return <StudentsUnifiedView initialSubTab="attention" />;
      case 'birthdays':
        return <StudentsUnifiedView initialSubTab="birthdays" />;
      case 'parents':
        return <StudentsUnifiedView initialSubTab="parents" />;
      case 'attendance':
        return <AttendanceUnifiedView initialSubTab="attendance" />;
      case 'competition':
        return <AttendanceUnifiedView initialSubTab="competition" />;
      case 'assessment':
      case 'learning':
        return <AssessmentUnifiedView initialSubTab="learning" />;
      case 'competency':
        return <AssessmentUnifiedView initialSubTab="competency" />;
      case 'ai-agent':
        return <AIAgentUnifiedView initialSubTab="hub" />;
      case 'ai-comments':
        return <AIAgentUnifiedView initialSubTab="comments" />;
      case 'ai-image-design':
        return <AIAgentUnifiedView initialSubTab="design" />;
      case 'schedule':
      case 'timetable':
        return <ScheduleUnifiedView initialSubTab="timetable" />;
      case 'tasks':
        return <ScheduleUnifiedView initialSubTab="tasks" />;
      case 'events':
        return <ScheduleUnifiedView initialSubTab="events" />;
      case 'journal':
        return <ScheduleUnifiedView initialSubTab="journal" />;
      case 'seating':
        return <SeatingChartView />;
      case 'reports':
        return <ReportsUnifiedView initialSubTab="reports" />;
      case 'settings':
        return <ReportsUnifiedView initialSubTab="settings" />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 antialiased selection:bg-emerald-100 dark:selection:bg-emerald-900 selection:text-emerald-900 dark:selection:text-emerald-100 transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Right Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenQuickSearch={() => setShowQuickSearch(true)}
        />

        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          <Suspense fallback={<ViewSkeletonFallback />}>
            {renderActiveView()}
          </Suspense>
        </main>
      </div>

      {/* Modal helpers */}
      <ToastContainer />
      <Suspense fallback={null}>
        <OnboardingModal />
        <AuthModal />
        
        {/* Google / Gmail Login Welcome Celebration Modal */}
        <LoginWelcomeModal
          user={welcomeModalUser}
          onClose={() => setWelcomeModalUser(null)}
          onExplore={() => setActiveTab('dashboard')}
        />
        
        {/* Quick Search Ctrl + K Modal */}
        <QuickSearchModal
          isOpen={showQuickSearch}
          onClose={() => setShowQuickSearch(false)}
          onOpenZalo={(stu) => setZaloTargetStudent(stu)}
        />

        {/* Send Zalo Modal from search if triggered */}
        {zaloTargetStudent && (
          <SendZaloModal
            isOpen={!!zaloTargetStudent}
            onClose={() => setZaloTargetStudent(null)}
            student={zaloTargetStudent}
            initialMessage=""
            defaultTopic="Trao đổi tình hình học sinh"
          />
        )}

        {/* Global Student Profile Drawer for Root Cause Inspection across any tab */}
        {selectedStudentForDetail && (
          <StudentDetailDrawer
            student={selectedStudentForDetail}
            parent={
              parents.find((p) => p.studentId === selectedStudentForDetail.id && p.primary) ||
              parents.find((p) => p.studentId === selectedStudentForDetail.id)
            }
            onClose={() => setSelectedStudentForDetail(null)}
            onEdit={() => {
              setActiveTab('students');
            }}
            onGoToAIComment={() => {
              setSelectedStudentForDetail(null);
              setActiveTab('ai-comments');
            }}
          />
        )}
      </Suspense>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
