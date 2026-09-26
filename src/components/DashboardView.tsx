import React, { useState, useMemo } from 'react';
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
  ArrowRight,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { ResellerProfile, ProductTier, OrderRecord, TopUpTransaction } from '../types';
import { formatThb, formatUsd } from '../utils/helpers';

interface DashboardViewProps {
  profile: ResellerProfile;
  products: ProductTier[];
  recentOrders: OrderRecord[];
  transactions?: TopUpTransaction[];
  onOpenDispense: (productId?: string) => void;
  onNavigateToApi: () => void;
  onNavigateToTopup: () => void;
  onNavigateToKeys: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  products,
  recentOrders,
  transactions = [],
  onOpenDispense,
  onNavigateToApi,
  onNavigateToTopup,
  onNavigateToKeys,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d' | 'all'>('7d');
  const [chartMode, setChartMode] = useState<'total' | 'breakdown'>('total');

  // Parse YYYY-MM-DD from diverse timestamp formats
  const parseDateKey = (dateStr: string): string => {
    if (!dateStr) return '';
    const clean = dateStr.replace('T', ' ').trim();
    const parts = clean.split(' ');
    return parts[0] || '';
  };

  // Generate daily income trend dataset based on transactions state
  const { chartData, periodSummary } = useMemo(() => {
    const completedTxs = (transactions || []).filter(
      (tx) => tx.status === 'สำเร็จ' || !tx.status
    );

    const now = new Date();
    let daysCount = 7;
    if (timeRange === '14d') daysCount = 14;
    else if (timeRange === '30d') daysCount = 30;
    else if (timeRange === 'all') daysCount = 60;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateMap = new Map<string, {
      date: string;
      displayDate: string;
      timestamp: number;
      income: number;
      truemoney: number;
      promptpay: number;
      other: number;
      count: number;
    }>();

    // Pre-populate chronological date series so chart line is continuous
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;
      const displayDate = `${parseInt(dd, 10)} ${monthNames[d.getMonth()]}`;

      dateMap.set(dateKey, {
        date: dateKey,
        displayDate,
        timestamp: d.getTime(),
        income: 0,
        truemoney: 0,
        promptpay: 0,
        other: 0,
        count: 0,
      });
    }

    // Populate transaction figures
    completedTxs.forEach((tx) => {
      const dateKey = parseDateKey(tx.createdAt);
      if (!dateKey) return;

      let entry = dateMap.get(dateKey);
      if (!entry && timeRange === 'all') {
        const parts = dateKey.split('-');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          const displayDate = `${parseInt(parts[2], 10)} ${monthNames[d.getMonth()] || ''}`;
          entry = {
            date: dateKey,
            displayDate,
            timestamp: d.getTime(),
            income: 0,
            truemoney: 0,
            promptpay: 0,
            other: 0,
            count: 0,
          };
          dateMap.set(dateKey, entry);
        }
      }

      if (entry) {
        const amount = Number(tx.amountThb) || 0;
        entry.income += amount;
        entry.count += 1;
        if (tx.method === 'truemoney') {
          entry.truemoney += amount;
        } else if (tx.method === 'promptpay_slip' || tx.method === 'bank_transfer') {
          entry.promptpay += amount;
        } else {
          entry.other += amount;
        }
      }
    });

    const list = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate period aggregates
    const totalPeriodRevenue = list.reduce((sum, item) => sum + item.income, 0);
    const totalPeriodTxs = list.reduce((sum, item) => sum + item.count, 0);
    const activeDays = list.length || 1;
    const dailyAverage = totalPeriodRevenue / activeDays;
    const peakDay = list.reduce((max, item) => item.income > max.income ? item : max, list[0] || { income: 0, displayDate: '-' });

    return {
      chartData: list,
      periodSummary: {
        totalPeriodRevenue,
        totalPeriodTxs,
        dailyAverage,
        peakAmount: peakDay?.income || 0,
        peakDate: peakDay?.displayDate || '-',
      },
    };
  }, [transactions, timeRange]);

  // Custom Glassmorphic Tooltip for Recharts
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0e1124]/95 backdrop-blur-md border border-[#2b3363] rounded-xl p-3.5 shadow-2xl text-xs space-y-2.5 min-w-[210px] z-50">
          <div className="flex items-center justify-between border-b border-[#21274d] pb-1.5">
            <span className="font-bold text-white text-[13px]">{data.displayDate} ({data.date})</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
              {data.count} {data.count === 1 ? 'รายการ' : 'รายการ'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-200">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50"></span>
                <span>รายได้รวม (Total):</span>
              </span>
              <span className="font-black text-emerald-400 font-mono text-sm">
                {formatThb(data.income)}
              </span>
            </div>

            <div className="pt-1.5 border-t border-[#1c2242] space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-amber-400/90">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>ซอง TrueMoney:</span>
                </span>
                <span className="font-mono text-amber-300 font-semibold">{formatThb(data.truemoney)}</span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-cyan-400/90">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span>PromptPay / โอนธนาคาร:</span>
                </span>
                <span className="font-mono text-cyan-300 font-semibold">{formatThb(data.promptpay)}</span>
              </div>

              {data.other > 0 && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-purple-400/90">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    <span>ปรับยอดโดยแอดมิน:</span>
                  </span>
                  <span className="font-mono text-purple-300 font-semibold">{formatThb(data.other)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
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

      {/* Revenue Performance Chart (Recharts) */}
      <div className="bg-gradient-to-br from-[#11142a] via-[#141836] to-[#0f1226] border border-[#202652] rounded-2xl p-6 shadow-xl space-y-6">
        {/* Header row with Title and Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Revenue Performance</span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-700/50 text-emerald-400">
                  LIVE ANALYTICS
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Daily income trends and deposit velocity synchronized from wallet & payment transactions
            </p>
          </div>

          {/* Controls: Mode Switcher & Time Range */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-[#0c0e1e] p-1 rounded-xl border border-[#1f2650] flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setChartMode('total')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  chartMode === 'total'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ยอดรวม (Total)
              </button>
              <button
                type="button"
                onClick={() => setChartMode('breakdown')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  chartMode === 'breakdown'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                แยกช่องทาง (Gateways)
              </button>
            </div>

            {/* Time Range Selector */}
            <div className="bg-[#0c0e1e] p-1 rounded-xl border border-[#1f2650] flex items-center gap-0.5 text-xs font-mono">
              {(['7d', '14d', '30d', 'all'] as const).map((r) => {
                const labels: Record<string, string> = {
                  '7d': '7D',
                  '14d': '14D',
                  '30d': '30D',
                  'all': 'ALL',
                };
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTimeRange(r)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      timeRange === r
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {labels[r]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4 Quick Performance Metric Chips */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-[#0d1022] border border-[#1d2349] rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              PERIOD REVENUE
            </span>
            <div className="text-xl font-black text-emerald-400 font-mono mt-1">
              {formatThb(periodSummary.totalPeriodRevenue)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              จาก {periodSummary.totalPeriodTxs} รายการสำเร็จ
            </div>
          </div>

          <div className="bg-[#0d1022] border border-[#1d2349] rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              DAILY AVERAGE
            </span>
            <div className="text-xl font-black text-indigo-300 font-mono mt-1">
              {formatThb(periodSummary.dailyAverage)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              เฉลี่ยต่อวันในรอบนี้
            </div>
          </div>

          <div className="bg-[#0d1022] border border-[#1d2349] rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              PEAK DAY
            </span>
            <div className="text-xl font-black text-amber-300 font-mono mt-1">
              {formatThb(periodSummary.peakAmount)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>วันที่ {periodSummary.peakDate}</span>
            </div>
          </div>

          <div className="bg-[#0d1022] border border-[#1d2349] rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              DEPOSIT GATEWAYS
            </span>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>TrueMoney</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span>PromptPay</span>
              </span>
            </div>
            <div className="text-[10px] text-emerald-400/90 mt-0.5 font-medium">
              100% Real-Time Automated
            </div>
          </div>
        </div>

        {/* Recharts Area Container */}
        <div className="w-full h-80 pt-2">
          {chartData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-2 border border-dashed border-[#1f2650] rounded-xl">
              <BarChart3 className="w-8 h-8 text-slate-500" />
              <p className="text-xs">ยังไม่มีประวัติการเติมเงินในรอบนี้</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  {/* Total Income Gradient */}
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>

                  {/* TrueMoney Gradient */}
                  <linearGradient id="truemoneyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>

                  {/* PromptPay Gradient */}
                  <linearGradient id="promptpayGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#1c2247"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="displayDate"
                  stroke="#475569"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={{ stroke: '#334155' }}
                  axisLine={{ stroke: '#1e244d' }}
                />

                <YAxis
                  stroke="#475569"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={{ stroke: '#334155' }}
                  axisLine={{ stroke: '#1e244d' }}
                  tickFormatter={(val) => `฿${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                />

                <Tooltip content={<CustomChartTooltip />} />

                {chartMode === 'total' ? (
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="รายได้รวม"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                    activeDot={{
                      r: 6,
                      fill: '#10b981',
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                  />
                ) : (
                  <>
                    <Area
                      type="monotone"
                      dataKey="truemoney"
                      name="ซอง TrueMoney"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#truemoneyGradient)"
                      activeDot={{
                        r: 5,
                        fill: '#f59e0b',
                        stroke: '#ffffff',
                        strokeWidth: 2,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="promptpay"
                      name="PromptPay / ธนาคาร"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#promptpayGradient)"
                      activeDot={{
                        r: 5,
                        fill: '#06b6d4',
                        stroke: '#ffffff',
                        strokeWidth: 2,
                      }}
                    />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart Legend / Footer notes */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#1b2147] text-xs text-slate-400">
          <div className="flex items-center gap-4">
            {chartMode === 'total' ? (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                <span className="text-slate-300 font-semibold">รายได้รวมประจำวัน (Daily Total Income)</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  <span className="text-slate-300 font-semibold">TrueMoney Gift Vouchers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
                  <span className="text-slate-300 font-semibold">PromptPay & ธนาคาร</span>
                </div>
              </>
            )}
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            แสดงข้อมูลตามฐานข้อมูลธุรกรรม <code className="text-indigo-400 font-bold">transactions</code> แบบเรียลไทม์
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
