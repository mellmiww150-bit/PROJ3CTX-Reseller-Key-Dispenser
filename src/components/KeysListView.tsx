import React, { useState, useMemo } from 'react';
import { 
  KeyRound, 
  CheckCircle2, 
  Ban, 
  RotateCcw, 
  Search, 
  Copy, 
  Check, 
  LayoutGrid, 
  Table as TableIcon, 
  ShieldAlert, 
  Info,
  Clock,
  Smartphone
} from 'lucide-react';
import { LicenseKey } from '../types';
import { playSuccessSound } from '../utils/helpers';

interface KeysListViewProps {
  keys: LicenseKey[];
  onResetHwid: (keyId: string) => void;
  onToggleBan: (keyId: string) => void;
  onOpenDispense: () => void;
  currentUser?: { id: string; username: string; role: string };
  users?: { id: string; username: string; displayName: string }[];
}

export const KeysListView: React.FC<KeysListViewProps> = ({
  keys,
  onResetHwid,
  onToggleBan,
  onOpenDispense,
  currentUser,
  users = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('All Plans');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Status');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [inspectKey, setInspectKey] = useState<LicenseKey | null>(null);

  const handleCopy = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    playSuccessSound();
    setTimeout(() => setCopiedKeyId(null), 1500);
  };

  // Stats
  const totalKeys = keys.length;
  const activeKeys = keys.filter((k) => k.status === 'ACTIVE').length;
  const bannedKeys = keys.filter((k) => k.status === 'BANNED').length;
  const totalHwidResets = keys.reduce((acc, k) => acc + k.hwidResetCount, 0);

  // Filtered keys
  const filteredKeys = useMemo(() => {
    return keys.filter((k) => {
      const matchesSearch = 
        k.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.lastIp.includes(searchTerm) ||
        (k.dispensedByUsername && k.dispensedByUsername.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesPlan = true;
      if (selectedPlan === '1 Day') {
        matchesPlan = k.durationLabel.includes('1 Day') || k.durationLabel.includes('12 HR');
      } else if (selectedPlan === '7 Days') {
        matchesPlan = k.durationLabel.includes('7 Day') || k.durationLabel.includes('3 Day');
      } else if (selectedPlan === '15 Days') {
        matchesPlan = k.durationLabel.includes('14 Day') || k.durationLabel.includes('15 Day');
      } else if (selectedPlan === '30 Days') {
        matchesPlan = k.durationLabel.includes('30 Day');
      }

      let matchesStatus = true;
      if (selectedStatus === 'Active') matchesStatus = k.status === 'ACTIVE';
      else if (selectedStatus === 'Banned') matchesStatus = k.status === 'BANNED';

      let matchesUser = true;
      if (selectedUserFilter === 'MY' && currentUser) {
        matchesUser = k.dispensedByUserId === currentUser.id || k.dispensedByUsername === currentUser.username;
      } else if (selectedUserFilter !== 'ALL') {
        matchesUser = k.dispensedByUsername === selectedUserFilter || k.dispensedByUserId === selectedUserFilter;
      }

      return matchesSearch && matchesPlan && matchesStatus && matchesUser;
    });
  }, [keys, searchTerm, selectedPlan, selectedStatus, selectedUserFilter, currentUser]);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Stats Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-400" />
            <span>Created Keys & Lifecycle Suite</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ระบบจัดการ License Key, รีเซ็ต HWID, สั่งปลดล็อค และระงับคีย์แบบเรียลไทม์
          </p>
        </div>

        <button
          onClick={onOpenDispense}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
        >
          + สั่งซื้อ / เบิกคีย์ใหม่
        </button>
      </div>

      {/* 4 Stat Cards matching screenshot 4 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#12152b] border border-[#21264b] rounded-xl p-4 flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-400 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">TOTAL KEYS</div>
            <div className="text-xl font-black text-white font-mono">{totalKeys}</div>
          </div>
        </div>

        <div className="bg-[#12152b] border border-[#21264b] rounded-xl p-4 flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">ACTIVE / USED</div>
            <div className="text-xl font-black text-emerald-400 font-mono">{activeKeys}</div>
          </div>
        </div>

        <div className="bg-[#12152b] border border-[#21264b] rounded-xl p-4 flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/40 text-rose-400 flex items-center justify-center shrink-0">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">BANNED</div>
            <div className="text-xl font-black text-rose-400 font-mono">{bannedKeys}</div>
          </div>
        </div>

        <div className="bg-[#12152b] border border-[#21264b] rounded-xl p-4 flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">HWID RESETS</div>
            <div className="text-xl font-black text-cyan-300 font-mono">{totalHwidResets}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar matching Screenshot 4 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12152b] border border-[#202549] p-3 rounded-2xl">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหา License Key, Plan, IP..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0d0f1e] border border-[#272d54] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* Duration Filters */}
        <div className="flex items-center gap-1 bg-[#0d0f1e] p-1 rounded-xl border border-[#252b4f]">
          {['All Plans', '1 Day', '7 Days', '15 Days', '30 Days'].map((plan) => (
            <button
              key={plan}
              onClick={() => setSelectedPlan(plan)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedPlan === plan
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {plan}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-[#0d0f1e] p-1 rounded-xl border border-[#252b4f]">
          {['All Status', 'Active', 'Banned'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedStatus === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Filter by Reseller / User */}
        <div className="flex items-center gap-1.5 bg-[#0d0f1e] px-2.5 py-1.5 rounded-xl border border-[#252b4f]">
          <span className="text-[11px] text-slate-400 font-semibold shrink-0">เช็คคีย์ของ:</span>
          <select
            value={selectedUserFilter}
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            className="bg-transparent text-xs font-semibold text-indigo-300 focus:outline-none cursor-pointer pr-1"
          >
            <option value="ALL" className="bg-[#0d0f1e] text-white">ทุกคน (All Users)</option>
            {currentUser && (
              <option value="MY" className="bg-[#0d0f1e] text-amber-300">⭐ คีย์ของฉัน ({currentUser.username})</option>
            )}
            {users.map((u) => (
              <option key={u.id} value={u.username} className="bg-[#0d0f1e] text-slate-200">
                👤 {u.username} ({u.displayName})
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#0d0f1e] p-1 rounded-xl border border-[#252b4f]">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              viewMode === 'cards' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Card View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Table View"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cards View (Exact match to Screenshot 4) */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKeys.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs">
              ไม่พบคีย์ที่ตรงกับเงื่อนไขการค้นหา
            </div>
          ) : (
            filteredKeys.map((item) => (
              <div
                key={item.id}
                className="bg-[#12152b] border border-[#202549] hover:border-indigo-500/50 rounded-xl p-4 flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Card Header: Duration Pill & Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1 truncate max-w-[180px]">
                      <span>🕒</span>
                      <span className="truncate">{item.durationLabel}</span>
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                        item.status === 'ACTIVE'
                          ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/40'
                          : 'text-rose-400 bg-rose-950/60 border border-rose-800/40'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      <span>{item.status}</span>
                    </span>
                  </div>

                  {/* License Key with Key Icon */}
                  <div className="mt-3 flex items-center justify-between bg-[#0b0d1a] px-3 py-2 rounded-lg border border-[#1b203d]">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white tracking-wide truncate">
                      <span className="text-amber-400">🔑</span>
                      <span className="truncate">{item.key}</span>
                    </div>

                    <button
                      onClick={() => handleCopy(item.key, item.id)}
                      className="ml-2 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-sm"
                    >
                      {copiedKeyId === item.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-300" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Dispensed by User / Reseller info */}
                  <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-[#0e1124] border border-[#1b2144] flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <span className="text-slate-500 text-[10px]">ผู้เบิก:</span>
                      <span className="font-semibold text-indigo-300">👤 {item.dispensedByUsername || 'PROJ3CTX'}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {item.createdAt.slice(0, 16)}
                    </span>
                  </div>
                </div>

                {/* Card Actions: HWID Reset, Ban/Unban, Inspect */}
                <div className="mt-3 pt-2.5 border-t border-[#1a1f3c] flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1 text-slate-400">
                    <span>HWID:</span>
                    <span className="font-mono text-slate-300 truncate max-w-[90px]">{item.hwid}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onResetHwid(item.id)}
                      className="p-1 rounded hover:bg-[#1f2549] text-slate-400 hover:text-cyan-400 transition-colors"
                      title="รีเซ็ต HWID (เครื่อง)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onToggleBan(item.id)}
                      className={`p-1 rounded hover:bg-[#1f2549] transition-colors ${
                        item.status === 'ACTIVE' ? 'text-slate-400 hover:text-rose-400' : 'text-emerald-400'
                      }`}
                      title={item.status === 'ACTIVE' ? 'ระงับคีย์' : 'ปลดแบนคีย์'}
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setInspectKey(item)}
                      className="p-1 rounded hover:bg-[#1f2549] text-slate-400 hover:text-indigo-400 transition-colors"
                      title="ดูรายละเอียดคีย์"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-[#12152b] border border-[#202549] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e1022] text-slate-400 font-semibold uppercase tracking-wider border-b border-[#1c2246]">
                <tr>
                  <th className="px-4 py-3">License Key</th>
                  <th className="px-4 py-3">ผู้เบิก (Reseller)</th>
                  <th className="px-4 py-3">Plan / Duration</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">HWID / Device</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2042]">
                {filteredKeys.map((item) => (
                  <tr key={item.id} className="hover:bg-[#161a35] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-300">
                      <div className="flex items-center gap-2">
                        <span>{item.key}</span>
                        <button
                          onClick={() => handleCopy(item.key, item.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedKeyId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-indigo-300 font-semibold">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-[11px]">
                        <span>👤</span>
                        <span>{item.dispensedByUsername || 'PROJ3CTX'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{item.durationLabel}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          item.status === 'ACTIVE'
                            ? 'text-emerald-400 bg-emerald-950/60'
                            : 'text-rose-400 bg-rose-950/60'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{item.hwid}</td>
                    <td className="px-4 py-3 text-slate-400">{item.createdAt}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onResetHwid(item.id)}
                          className="px-2 py-1 rounded bg-[#1c2246] hover:bg-cyan-900/60 text-cyan-300 text-[11px] font-semibold transition-colors"
                        >
                          Reset HWID
                        </button>
                        <button
                          onClick={() => onToggleBan(item.id)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                            item.status === 'ACTIVE'
                              ? 'bg-[#1c2246] hover:bg-rose-900/60 text-rose-300'
                              : 'bg-emerald-900/60 text-emerald-300'
                          }`}
                        >
                          {item.status === 'ACTIVE' ? 'Ban' : 'Unban'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Key Modal */}
      {inspectKey && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12152b] border border-[#242b58] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2448]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">License Key Diagnostics</h3>
              </div>
              <button
                onClick={() => setInspectKey(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1"
              >
                ✕ ปิด
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#0c0e1b] border border-[#20264d] flex items-center justify-between font-mono">
                <span className="text-slate-400">KEY:</span>
                <span className="text-indigo-300 font-bold text-sm">{inspectKey.key}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div className="p-3 rounded-xl bg-[#151933]">
                  <div className="text-slate-400 text-[10px] uppercase">Plan Name</div>
                  <div className="font-bold text-white mt-0.5">{inspectKey.planName}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#151933]">
                  <div className="text-slate-400 text-[10px] uppercase">ผู้สั่งซื้อ / เบิกคีย์</div>
                  <div className="font-bold text-indigo-400 mt-0.5 flex items-center gap-1">
                    <span>👤</span>
                    <span>{inspectKey.dispensedByUsername || 'PROJ3CTX'}</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#151933]">
                  <div className="text-slate-400 text-[10px] uppercase">Status</div>
                  <div className="font-bold text-emerald-400 mt-0.5">{inspectKey.status}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#151933]">
                  <div className="text-slate-400 text-[10px] uppercase">HWID Lock</div>
                  <div className="font-mono text-white mt-0.5 truncate">{inspectKey.hwid}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#151933]">
                  <div className="text-slate-400 text-[10px] uppercase">HWID Reset Count</div>
                  <div className="font-mono text-cyan-400 mt-0.5">{inspectKey.hwidResetCount} times</div>
                </div>
                <div className="p-3 rounded-xl bg-[#151933]">
                  <div className="text-slate-400 text-[10px] uppercase">Created At</div>
                  <div className="text-slate-300 mt-0.5">{inspectKey.createdAt}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#151933]">
                  <div className="text-slate-400 text-[10px] uppercase">Last Binding IP</div>
                  <div className="font-mono text-slate-300 mt-0.5">{inspectKey.lastIp}</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1e2448]">
              <button
                onClick={() => {
                  onResetHwid(inspectKey.id);
                  setInspectKey({ ...inspectKey, hwidResetCount: inspectKey.hwidResetCount + 1 });
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/50"
              >
                รีเซ็ต HWID ตอนนี้
              </button>
              <button
                onClick={() => setInspectKey(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-[#1d2242] hover:bg-[#252c56]"
              >
                เรียบร้อย
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
