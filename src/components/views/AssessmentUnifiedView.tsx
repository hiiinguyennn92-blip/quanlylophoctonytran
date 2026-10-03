import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { LearningView } from './LearningView';
import { CompetencyView } from './CompetencyView';
import { AICommentView } from './AICommentView';
import { BookOpen, Award, Sparkles } from 'lucide-react';

interface AssessmentUnifiedViewProps {
  initialSubTab?: 'learning' | 'competency' | 'comments';
}

export const AssessmentUnifiedView: React.FC<AssessmentUnifiedViewProps> = ({
  initialSubTab = 'learning',
}) => {
  const { activeTab } = useApp();
  const [subTab, setSubTab] = useState<'learning' | 'competency' | 'comments'>(initialSubTab);

  useEffect(() => {
    if (activeTab === 'competency') setSubTab('competency');
    else if (activeTab === 'ai-comments') setSubTab('comments');
    else if (activeTab === 'learning') setSubTab('learning');
  }, [activeTab]);

  return (
    <div className="space-y-4">
      {/* Sub-navigation Header */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between flex-wrap gap-2 transition-colors">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSubTab('learning')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'learning'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Sổ học tập & Điểm số môn học (TT27)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('competency')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'competency'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Năng lực & Phẩm chất chủ yếu</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('comments')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'comments'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Soạn nhận xét học bạ</span>
          </button>
        </div>
      </div>

      {/* View Content */}
      <div>
        {subTab === 'learning' && <LearningView />}
        {subTab === 'competency' && <CompetencyView />}
        {subTab === 'comments' && <AICommentView />}
      </div>
    </div>
  );
};
