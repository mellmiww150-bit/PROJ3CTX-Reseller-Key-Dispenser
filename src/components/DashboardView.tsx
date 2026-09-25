import React from 'react';
import { 
  Zap, 
  Code2, 
  Wallet, 
  Banknote, 
  TrendingUp, 
  KeyRound, 
  CreditCard,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { ResellerProfile, ProductTier, OrderRecord } from '../types';
import { formatThb, formatUsd } from '../utils/helpers';

interface DashboardViewProps {
  profile: ResellerProfile;
  products: ProductTier[];
  recentOrders: OrderRecord[];
  onOpenDispense: (productId?: string) => void;
  onNavigateToApi: () => void;
  onNavigateToTopup: () => void;
  onNavigateToKeys: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  products,
  recentOrders,
  onOpenDispense,
  onNavigateToApi,
  onNavigateToTopup,
  onNavigateToKeys,
}) => {
  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Virtual Card Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Welcome Back Card */}
        <div className="lg:col-span-7 bg-gradient-to-br from-[#12152a] to-[#151936] border border-[#21264b] rounded-2xl p-7 relative overflow-hidden flex flex-col justify-between shadow-xl">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1b2044] border border-[#2d346b] text-[11px] font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-emerald-400">VERIFIED RESELLER</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">PURE DATABASE CORE</span>
            </div>

            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {profile.username}!
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
              Generate license keys with automated credit deduction. Distribute access through our high-speed web portal or connect directly into Discord and Telegram bots via REST API.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-6 relative z-10">
            <button
              onClick={() => onOpenDispense()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Generate Key</span>
            </button>

            <button
              onClick={onNavigateToApi}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-[#191d3d] hover:bg-[#222852] border border-[#2b3366] hover:text-white transition-all cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span>API Integration</span>
            </button>

            <button
              onClick={onNavigateToTopup}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-800/40 transition-all cursor-pointer ml-auto"
            >
              <Wallet className="w-4 h-4 text-amber-400" />
              <span>เติมเงินด่วน</span>
            </button>
          </div>
        </div>

        {/* Virtual Credit Card Widget */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#13162c] via-[#161a38] to-[#101326] border border-[#262c55] rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[220px]">
          {/* Card Top Row */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Gold Chip */}
              <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/60 shadow-inner flex items-center justify-center relative overflow-hidden">
                <div className="w-full h-[1px] bg-amber-700/40"></div>
                <div className="absolute w-[1px] h-full bg-amber-700/40"></div>
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-wider text-slate-200 uppercase">PROJ3CTX AUTH</div>
                <div className="text-[9px] font-medium text-slate-400 tracking-widest uppercase">RESELLERS</div>
              </div>
            </div>

            <div className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-700/50 px-2 py-0.5 rounded-full">
              PLATINUM PARTNER
            </div>
          </div>

          {/* Balance */}
          <div className="my-4">
            <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              AVAILABLE BALANCE (THB / USD)
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                {formatThb(profile.balanceThb)}
              </span>
              <span className="text-sm font-semibold text-slate-400 font-mono">
                ({formatUsd(profile.balanceThb / 32.5)})
              </span>
            </div>
          </div>

          {/* Card Bottom Row */}
          <div className="flex items-end justify-between pt-2 border-t border-[#20254a]">
            <div>
              <div className="text-xs font-bold text-white tracking-wide">{profile.username}</div>
              <div className="text-[11px] font-mono font-medium text-indigo-300 flex items-center gap-1 mt-0.5">
                <span>🔑</span>
                <span>{profile.sellerKey}</span>
              </div>
            </div>

            {/* Mastercard Style Overlapping Circles */}
            <div className="flex items-center -space-x-2">
              <div className="w-6 h-6 rounded-full bg-rose-500/90 shadow-md"></div>
              <div className="w-6 h-6 rounded-full bg-amber-500/80 shadow-md"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Current Balance */}
        <div className="bg-[#12152b] border border-[#1f244a] rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">CURRENT BALANCE</span>
            <div className="w-8 h-8 rounded-xl bg-[#16292b] border border-emerald-800/50 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {formatThb(profile.balanceThb)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Ready for license generation</div>
          </div>
        </div>

        {/* Card 2: Total Deposited */}
        <div className="bg-[#12152b] border border-[#1f244a] rounded-2xl p-5 flex flex-col justify-between hover:border-purple-500/40 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">TOTAL DEPOSITED</span>
            <div className="w-8 h-8 rounded-xl bg-[#201838] border border-purple-800/50 flex items-center justify-center text-purple-400">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono">
              {formatThb(profile.totalDepositedThb)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Lifetime credit allocation</div>
          </div>
        </div>

        {/* Card 3: Total Spent */}
        <div className="bg-[#12152b] border border-[#1f244a] rounded-2xl p-5 flex flex-col justify-between hover:border-rose-500/40 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">TOTAL SPENT</span>
            <div className="w-8 h-8 rounded-xl bg-[#2d1825] border border-rose-800/50 flex items-center justify-center text-rose-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-400 font-mono">
              {formatThb(profile.totalSpentThb)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Used across all dispensations</div>
          </div>
        </div>

        {/* Card 4: Keys Created */}
        <div className="bg-[#12152b] border border-[#1f244a] rounded-2xl p-5 flex flex-col justify-between hover:border-cyan-500/40 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">KEYS CREATED</span>
            <div className="w-8 h-8 rounded-xl bg-[#142639] border border-cyan-800/50 flex items-center justify-center text-cyan-400">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-cyan-300 font-mono">
              {profile.keysCreatedCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Licenses successfully generated</div>
          </div>
        </div>
      </div>

      {/* Quick Action Products Preview */}
      <div className="bg-[#111429] border border-[#1d2247] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>Available License Tiers & Fast Dispense</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any tier to instantly pull stocked keys from database
            </p>
          </div>
          <button
            onClick={() => onOpenDispense()}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            <span>View All Plans</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.slice(0, 4).map((p) => (
            <div
              key={p.id}
              className="bg-[#151933] border border-[#242b58] rounded-xl p-4 flex flex-col justify-between hover:border-indigo-500/50 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1c224a] text-indigo-300 font-mono">
                    {p.duration}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                    {p.stock} In Stock
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-2 group-hover:text-indigo-300 transition-colors">
                  {p.name}
                </h4>
                <div className="text-lg font-black text-emerald-400 font-mono mt-1">
                  {formatThb(p.priceThb)}
                </div>
              </div>

              <button
                onClick={() => onOpenDispense(p.id)}
                className="w-full mt-3 py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-indigo-600/80 hover:bg-indigo-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Zap className="w-3 h-3" />
                <span>Dispense Now</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
