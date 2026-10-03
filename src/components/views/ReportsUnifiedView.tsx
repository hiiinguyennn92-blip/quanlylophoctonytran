import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useApp } from '../../context/AppContext';
import { FileBarChart, Settings, Sun, Moon } from 'lucide-react';

const ReportsView = lazy(() =>
  import('./ReportsView').then((m) => ({ default: m.ReportsView }))
);
const SettingsView = lazy(() =>
  import('./SettingsView').then((m) => ({ default: m.SettingsView }))
);

const SubTabFallback: React.FC = () => (
  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
    <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
    <p className="text-xs text-slate-500">Đang tải phân hệ...</p>
  </div>
);

interface ReportsUnifiedViewProps {
  initialSubTab?: 'reports' | 'settings';
}

export const ReportsUnifiedView: React.FC<ReportsUnifiedViewProps> = ({
  initialSubTab = 'reports',
}) => {
  const { activeTab, darkMode, toggleDarkMode } = useApp();
  const [subTab, setSubTab] = useState<'reports' | 'settings'>(initialSubTab);

  useEffect(() => {
    if (activeTab === 'settings') setSubTab('settings');
    else if (activeTab === 'reports') setSubTab('reports');
  }, [activeTab]);

  return (
    <div className="space-y-4">
      {/* Sub-navigation Header */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between flex-wrap gap-2 transition-colors">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSubTab('reports')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'reports'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileBarChart className="w-4 h-4" />
            <span>Báo cáo & Xuất file Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'settings'
                ? 'bg-slate-800 dark:bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Cài đặt hệ thống & Giao diện</span>
          </button>
        </div>

        {/* Quick Dark Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          title={darkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        >
          {darkMode ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-500" />
          )}
          <span>{darkMode ? 'Giao diện Tối' : 'Giao diện Sáng'}</span>
        </button>
      </div>

      {/* View Content */}
      <Suspense fallback={<SubTabFallback />}>
        {subTab === 'reports' && <ReportsView />}
        {subTab === 'settings' && <SettingsView />}
      </Suspense>
    </div>
  );
};
