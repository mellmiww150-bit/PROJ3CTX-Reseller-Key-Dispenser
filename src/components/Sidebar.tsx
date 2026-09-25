import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Zap, 
  Wallet, 
  KeyRound, 
  Clock, 
  Code2, 
  Settings, 
  LogOut, 
  CheckCircle2, 
  Copy, 
  Check, 
  ShieldCheck,
  Sparkles,
  Sliders,
  Users,
  ShieldAlert,
  Crown
} from 'lucide-react';
import { UserAccount } from '../types';
import { formatThb } from '../utils/helpers';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: UserAccount;
  totalKeysCount: number;
  totalOrdersCount: number;
  onCopySellerKey: () => void;
  onLogout: () => void;
  onSwitchUser: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  totalKeysCount,
  totalOrdersCount,
  onCopySellerKey,
  onLogout,
  onSwitchUser,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopySellerKey();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdminOrHigher = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'SUPER_ADMIN':
        return {
          label: '👑 SUPER ADMIN',
          color: 'text-amber-300 bg-amber-950/80 border border-amber-500/50 shadow-sm shadow-amber-500/20',
        };
      case 'ADMIN':
        return {
          label: '⚡ ADMIN OPERATOR',
          color: 'text-indigo-300 bg-indigo-950/80 border border-indigo-500/50',
        };
      case 'SENIOR_RESELLER':
        return {
          label: '⭐ SENIOR PARTNER',
          color: 'text-teal-300 bg-teal-950/80 border border-teal-500/50',
        };
      case 'RESELLER':
        return {
          label: '✔ VERIFIED PARTNER',
          color: 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/50',
        };
      default:
        return {
          label: 'MEMBER USER',
          color: 'text-slate-400 bg-slate-900 border border-slate-700/50',
        };
    }
  };

  const roleInfo = getRoleBadge();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: formatThb(currentUser.balanceThb),
      badgeColor: 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40',
    },
    {
      id: 'dispenser',
      label: 'Generate Keys',
      icon: Zap,
      badge: '8 Plans',
      badgeColor: 'text-slate-300 bg-slate-800/80 border border-slate-700/60',
    },
    {
      id: 'topup',
      label: 'Top-up Credit',
      icon: Wallet,
    },
    {
      id: 'keys',
      label: isAdminOrHigher ? 'Keys Suite (ดูทุกคีย์)' : 'My Keys List',
      icon: KeyRound,
      badge: totalKeysCount.toString(),
      badgeColor: 'text-purple-300 bg-purple-950/50 border border-purple-800/40',
    },
    {
      id: 'history',
      label: 'Dispense History',
      icon: Clock,
      badge: totalOrdersCount.toString(),
      badgeColor: 'text-slate-300 bg-slate-800/80 border border-slate-700/60',
    },
    {
      id: 'api-bot',
      label: 'REST API & Bot',
      icon: Code2,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
    // Admin / Super Admin Only Tabs
    ...(isAdminOrHigher
      ? [
          {
            id: 'users_management',
            label: 'จัดการผู้ใช้ & ยศ (Users)',
            icon: Users,
            badge: isSuperAdmin ? 'สูงสุด' : 'Admin',
            badgeColor: isSuperAdmin
              ? 'text-amber-300 bg-amber-950/80 border border-amber-500/60'
              : 'text-indigo-300 bg-indigo-950/80 border border-indigo-700/60',
          },
          {
            id: 'backoffice',
            label: 'จัดการหลังบ้าน (Admin)',
            icon: Sliders,
            badge: 'แก้เลขบัญชี',
            badgeColor: 'text-rose-300 bg-rose-950/70 border border-rose-800/60',
          },
        ]
      : []),
  ];

  return (
    <aside className="w-72 bg-[#0c0e1a] border-r border-[#1a1e36] flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none">
      <div className="flex flex-col overflow-y-auto">
        {/* Brand Header */}
        <div className="p-5 pb-4 flex items-center gap-3 border-b border-[#181b31]">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-900 via-purple-700 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#0d0f1e] rounded-[10px] flex items-center justify-center overflow-hidden">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0c0e1a]"></div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-wider text-white">PROJ3CTX AUTH</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/40">
                {isSuperAdmin ? 'SUPER' : 'AUTH'}
              </span>
            </div>
            <span className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
              RESELLERS CORE
            </span>
          </div>
        </div>

        {/* User Reseller Profile Box */}
        <div className="m-4 p-3.5 rounded-2xl bg-[#13162b] border border-[#212646] shadow-sm relative overflow-hidden">
          {isSuperAdmin && (
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
          )}

          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full bg-gradient-to-br ${currentUser.avatarColor || 'from-indigo-500 to-purple-600'} flex items-center justify-center text-white font-black text-sm shadow-inner shrink-0`}
            >
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white truncate">{currentUser.username}</span>
                {isSuperAdmin && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              </div>
              <div
                className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 truncate ${roleInfo.color}`}
              >
                <span>{roleInfo.label}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#1d223f] flex items-center justify-between">
            <span className="font-mono text-xs text-indigo-300 font-semibold">{currentUser.sellerKey}</span>
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-[#1f2547] text-slate-400 hover:text-white transition-colors"
              title="Copy Seller Key"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white shadow-md shadow-indigo-600/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#151933]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold shrink-0 ml-1 ${
                      item.badgeColor || 'text-slate-300 bg-slate-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[#181b31] space-y-2">
        <div className="w-full px-3 py-2 rounded-xl bg-[#111427] border border-[#1e2343] flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-xs font-mono font-semibold text-emerald-400">
            ● LIVE BALANCE {formatThb(currentUser.balanceThb)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onSwitchUser}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-semibold text-slate-300 hover:text-white bg-[#151933] hover:bg-[#1d2244] border border-[#242a54] transition-colors cursor-pointer"
            title="สลับบัญชีผู้ใช้"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>สลับยูส</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
