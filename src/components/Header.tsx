import React, { useState } from 'react';
import { Zap, RotateCw, Wallet, PlusCircle } from 'lucide-react';
import { formatThb } from '../utils/helpers';

interface HeaderProps {
  title: string;
  subtitle: string;
  onOpenDispense: () => void;
  onRefresh: () => void;
  primaryActionLabel?: string;
  balanceThb?: number;
  onNavigateToTopup?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenDispense,
  onRefresh,
  primaryActionLabel = 'Generate Key',
  balanceThb,
  onNavigateToTopup,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <header className="px-8 py-4 border-b border-[#171a33] bg-[#0c0e1c]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Live Balance Badge in Header */}
        {balanceThb !== undefined && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#121630] to-[#151a3a] border border-[#232b58] shadow-inner">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ยอดเงินในเว็บ</span>
              <span className="text-xs font-black text-emerald-400 font-mono tracking-tight">
                {formatThb(balanceThb)}
              </span>
            </div>
            {onNavigateToTopup && (
              <button
                type="button"
                onClick={onNavigateToTopup}
                className="ml-1 px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="เติมเงินเข้าบัญชี"
              >
                <PlusCircle className="w-3 h-3" />
                <span>เติมเงิน</span>
              </button>
            )}
          </div>
        )}

        <button
          onClick={onOpenDispense}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>{primaryActionLabel}</span>
        </button>

        <button
          onClick={handleRefreshClick}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-[#15182f] hover:bg-[#1d2242] border border-[#262b50] hover:text-white transition-all cursor-pointer"
          title="Refresh Data"
        >
          <RotateCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
};
