import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentsView } from './StudentsView';
import { AttentionView } from './AttentionView';
import { BirthdaysView } from './BirthdaysView';
import { ParentsView } from './ParentsView';
import {
  Users,
  AlertCircle,
  Cake,
  HeartHandshake,
} from 'lucide-react';

interface StudentsUnifiedViewProps {
  initialSubTab?: 'list' | 'attention' | 'birthdays' | 'parents';
}

export const StudentsUnifiedView: React.FC<StudentsUnifiedViewProps> = ({ initialSubTab = 'list' }) => {
  const { activeTab, attentionSignals, students } = useApp();
  const [subTab, setSubTab] = useState<'list' | 'attention' | 'birthdays' | 'parents'>(initialSubTab);

  // Sync subTab if activeTab specifies an alias
  useEffect(() => {
    if (activeTab === 'attention') setSubTab('attention');
    else if (activeTab === 'birthdays') setSubTab('birthdays');
    else if (activeTab === 'parents') setSubTab('parents');
    else if (activeTab === 'students') {
      // Keep current or default to list if coming from outside
    }
  }, [activeTab]);

  return (
    <div className="space-y-4">
      {/* Sub-navigation Header */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between flex-wrap gap-2 transition-colors">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSubTab('list')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'list'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Danh sách học sinh ({students.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('attention')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'attention'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>Tín hiệu cần quan tâm</span>
            {attentionSignals.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  subTab === 'attention'
                    ? 'bg-white text-amber-700'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                }`}
              >
                {attentionSignals.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubTab('birthdays')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'birthdays'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Cake className="w-4 h-4" />
            <span>Sinh nhật học sinh</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('parents')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'parents'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Sổ Phụ huynh & Zalo</span>
          </button>
        </div>
      </div>

      {/* View Content */}
      <div>
        {subTab === 'list' && <StudentsView />}
        {subTab === 'attention' && <AttentionView />}
        {subTab === 'birthdays' && <BirthdaysView />}
        {subTab === 'parents' && <ParentsView />}
      </div>
    </div>
  );
};
