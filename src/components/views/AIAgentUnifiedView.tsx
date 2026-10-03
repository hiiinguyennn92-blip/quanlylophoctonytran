import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useApp } from '../../context/AppContext';
import { AIAgentHubView } from './AIAgentHubView';
import { Bot, Sparkles, Palette } from 'lucide-react';

const AICommentView = lazy(() =>
  import('./AICommentView').then((m) => ({ default: m.AICommentView }))
);
const AIImageDesignView = lazy(() =>
  import('./AIImageDesignView').then((m) => ({ default: m.AIImageDesignView }))
);

const SubTabFallback: React.FC = () => (
  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
    <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
    <p className="text-xs text-slate-500">Đang khởi tạo công cụ AI...</p>
  </div>
);

interface AIAgentUnifiedViewProps {
  initialSubTab?: 'hub' | 'comments' | 'design';
}

export const AIAgentUnifiedView: React.FC<AIAgentUnifiedViewProps> = ({
  initialSubTab = 'hub',
}) => {
  const { activeTab } = useApp();
  const [subTab, setSubTab] = useState<'hub' | 'comments' | 'design'>(initialSubTab);

  useEffect(() => {
    if (activeTab === 'ai-comments') setSubTab('comments');
    else if (activeTab === 'ai-image-design') setSubTab('design');
    else if (activeTab === 'ai-agent') setSubTab('hub');
  }, [activeTab]);

  return (
    <div className="space-y-4">
      {/* Sub-navigation Header */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between flex-wrap gap-2 transition-colors">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSubTab('hub')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'hub'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Trợ lý Trò chuyện & Nghiệp vụ</span>
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

          <button
            type="button"
            onClick={() => setSubTab('design')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'design'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Nhà thiết kế hình ảnh học đường AI</span>
          </button>
        </div>
      </div>

      {/* View Content */}
      <Suspense fallback={<SubTabFallback />}>
        {subTab === 'hub' && <AIAgentHubView />}
        {subTab === 'comments' && <AICommentView />}
        {subTab === 'design' && <AIImageDesignView />}
      </Suspense>
    </div>
  );
};
