import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TimetableView } from './TimetableView';
import { TasksView } from './TasksView';
import { EventsView } from './EventsView';
import { JournalView } from './JournalView';
import { Clock, ListTodo, Calendar, BookMarked } from 'lucide-react';

interface ScheduleUnifiedViewProps {
  initialSubTab?: 'timetable' | 'tasks' | 'events' | 'journal';
}

export const ScheduleUnifiedView: React.FC<ScheduleUnifiedViewProps> = ({
  initialSubTab = 'timetable',
}) => {
  const { activeTab } = useApp();
  const [subTab, setSubTab] = useState<'timetable' | 'tasks' | 'events' | 'journal'>(initialSubTab);

  useEffect(() => {
    if (activeTab === 'tasks') setSubTab('tasks');
    else if (activeTab === 'events') setSubTab('events');
    else if (activeTab === 'journal') setSubTab('journal');
    else if (activeTab === 'timetable') setSubTab('timetable');
  }, [activeTab]);

  return (
    <div className="space-y-4">
      {/* Sub-navigation Header */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between flex-wrap gap-2 transition-colors">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSubTab('timetable')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'timetable'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Thời khóa biểu</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('tasks')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'tasks'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>Nhiệm vụ & Bài tập</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('events')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'events'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Hoạt động & Lịch lớp</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('journal')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'journal'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>Nhật ký chủ nhiệm</span>
          </button>
        </div>
      </div>

      {/* View Content */}
      <div>
        {subTab === 'timetable' && <TimetableView />}
        {subTab === 'tasks' && <TasksView />}
        {subTab === 'events' && <EventsView />}
        {subTab === 'journal' && <JournalView />}
      </div>
    </div>
  );
};
