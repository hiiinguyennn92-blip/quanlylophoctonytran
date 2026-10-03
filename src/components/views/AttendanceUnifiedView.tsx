import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AttendanceView } from './AttendanceView';
import { CompetitionView } from './CompetitionView';
import { CheckSquare, Trophy } from 'lucide-react';

interface AttendanceUnifiedViewProps {
  initialSubTab?: 'attendance' | 'competition';
}

export const AttendanceUnifiedView: React.FC<AttendanceUnifiedViewProps> = ({
  initialSubTab = 'attendance',
}) => {
  const { activeTab } = useApp();
  const [subTab, setSubTab] = useState<'attendance' | 'competition'>(initialSubTab);

  useEffect(() => {
    if (activeTab === 'competition') setSubTab('competition');
    else if (activeTab === 'attendance') setSubTab('attendance');
  }, [activeTab]);

  return (
    <div className="space-y-4">
      {/* Sub-navigation Header */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between flex-wrap gap-2 transition-colors">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSubTab('attendance')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'attendance'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Điểm danh 1 chạm hàng ngày</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('competition')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'competition'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Thi đua & Nề nếp các tổ</span>
          </button>
        </div>
      </div>

      {/* View Content */}
      <div>
        {subTab === 'attendance' && <AttendanceView />}
        {subTab === 'competition' && <CompetitionView />}
      </div>
    </div>
  );
};
