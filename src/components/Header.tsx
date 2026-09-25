import React, { useState } from 'react';
import { Zap, RotateCw } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  onOpenDispense: () => void;
  onRefresh: () => void;
  primaryActionLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenDispense,
  onRefresh,
  primaryActionLabel = 'Generate Key',
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <header className="px-8 py-5 border-b border-[#171a33] bg-[#0c0e1c]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenDispense}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>{primaryActionLabel}</span>
        </button>

        <button
          onClick={handleRefreshClick}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-[#15182f] hover:bg-[#1d2242] border border-[#262b50] hover:text-white transition-all cursor-pointer"
          title="Refresh Data"
        >
          <RotateCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
};
