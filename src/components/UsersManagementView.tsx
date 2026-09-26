import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Crown, 
  Plus, 
  DollarSign, 
  Edit3, 
  Trash2, 
  Ban, 
  CheckCircle2, 
  X, 
  Save, 
  Lock, 
  Key, 
  Search,
  ArrowUpRight,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { formatThb, playSuccessSound } from '../utils/helpers';

interface UsersManagementViewProps {
  currentUser: UserAccount;
  users: UserAccount[];
  onUpdateUserRole: (userId: string, newRole: UserRole) => void;
  onAdjustUserBalance: (userId: string, newBalance: number, note: string) => void;
  onToggleUserStatus: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onCreateUser: (newUser: Partial<UserAccount>) => void;
  onShowToast: (msg: string) => void;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  currentUser,
  users,
  onUpdateUserRole,
  onAdjustUserBalance,
  onToggleUserStatus,
  onDeleteUser,
  onCreateUser,
  onShowToast,
}) => {
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  // Balance Adjustment Modal
  const [balanceModalUser, setBalanceModalUser] = useState<UserAccount | null>(null);
  const [newBalanceInput, setNewBalanceInput] = useState<string>('');
  const [balanceAdjustMode, setBalanceAdjustMode] = useState<'SET' | 'ADD' | 'SUBTRACT'>('SET');
  const [adjustNote, setAdjustNote] = useState<string>('แอดมินปรับยอดยอดเงินสด');

  // Role Edit Modal
  const [roleModalUser, setRoleModalUser] = useState<UserAccount | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('RESELLER');

  // Delete User Confirmation Modal
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserAccount | null>(null);

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newPin, setNewPin] = useState('888888');
  const [newInitialBalance, setNewInitialBalance] = useState('100');
  const [newRoleSelect, setNewRoleSelect] = useState<UserRole>('RESELLER');

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.sellerKey.toLowerCase().includes(searchTerm.toLowerCase());

    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const handleOpenBalanceModal = (u: UserAccount) => {
    setBalanceModalUser(u);
    setNewBalanceInput(u.balanceThb.toString());
    setBalanceAdjustMode('SET');
  };

  const handleSaveBalance = () => {
    if (!balanceModalUser) return;
    const inputVal = parseFloat(newBalanceInput) || 0;
    let finalVal = inputVal;

    if (balanceAdjustMode === 'ADD') {
      finalVal = balanceModalUser.balanceThb + inputVal;
    } else if (balanceAdjustMode === 'SUBTRACT') {
      finalVal = Math.max(0, balanceModalUser.balanceThb - inputVal);
    }

    onAdjustUserBalance(balanceModalUser.id, finalVal, adjustNote);
    setBalanceModalUser(null);
    onShowToast(`ปรับยอดเงินของ ${balanceModalUser.username} เป็น ${formatThb(finalVal)} เรียบร้อย`);
    playSuccessSound();
  };

  const handleOpenRoleModal = (u: UserAccount) => {
    setRoleModalUser(u);
    setSelectedRole(u.role);
  };

  const handleSaveRole = () => {
    if (!roleModalUser) return;
    if (roleModalUser.id === currentUser.id && selectedRole !== 'SUPER_ADMIN') {
      alert('คุณไม่สามารถลดยศ Super Admin ของตัวเองได้');
      return;
    }

    onUpdateUserRole(roleModalUser.id, selectedRole);
    setRoleModalUser(null);
    onShowToast(`ปรับยศ ${roleModalUser.username} เป็น ${selectedRole} สำเร็จ`);
    playSuccessSound();
  };

  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    onCreateUser({
      username: newUsername.trim(),
      passwordHash: newPassword,
      securityPin: newPin,
      balanceThb: parseFloat(newInitialBalance) || 0,
      role: newRoleSelect,
      displayName: newUsername.trim(),
    });

    setShowCreateModal(false);
    setNewUsername('');
    onShowToast(`สร้างบัญชีผู้ใช้ ${newUsername} สำเร็จ`);
    playSuccessSound();
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { text: 'แอดมินใหญ่สุด (Super Admin)', bg: 'bg-amber-950/80 text-amber-300 border-amber-500/60' };
      case 'ADMIN':
        return { text: 'แอดมิน (Admin)', bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/60' };
      case 'SENIOR_RESELLER':
        return { text: 'ตัวแทนอาวุโส (Senior)', bg: 'bg-teal-950/80 text-teal-300 border-teal-500/60' };
      case 'RESELLER':
        return { text: 'ตัวแทนจำหน่าย (Reseller)', bg: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' };
      default:
        return { text: 'สมาชิกทั่วไป (Member)', bg: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-800/50 text-[11px] font-bold text-amber-400 mb-1">
            <Crown className="w-3.5 h-3.5" />
            <span>CENTRAL USERS & RBAC ROLE SUITE</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>ระบบจัดการผู้ใช้ สิทธิ์ และปรับยอดเงินเครดิต</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ตรวจดูยูสเซอร์อื่นๆ, ปรับยอดยอดเงินสด, เลื่อนขั้นยศแอดมิน, ดูจำนวนคีย์ที่สร้าง และระงับบัญชี
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ เพิ่มบัญชีผู้ใช้ใหม่</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12152b] border border-[#202549] p-3 rounded-2xl">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อผู้ใช้, Seller Key, ชื่อแสดงผล..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0d0f1e] border border-[#272d54] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#0d0f1e] p-1 rounded-xl border border-[#252b4f]">
          {['ALL', 'SUPER_ADMIN', 'ADMIN', 'SENIOR_RESELLER', 'RESELLER', 'MEMBER'].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterRole === r
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === 'ALL' ? 'ทั้งหมด' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#12152b] border border-[#202549] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e1022] text-slate-400 font-semibold uppercase tracking-wider border-b border-[#1c2246]">
              <tr>
                <th className="px-5 py-3.5">ผู้ใช้งาน (Username)</th>
                <th className="px-5 py-3.5">ยศ / ระดับสิทธิ์</th>
                <th className="px-5 py-3.5">Seller Key</th>
                <th className="px-5 py-3.5">ยอดเครดิตคงเหลือ</th>
                <th className="px-5 py-3.5 text-center">คีย์ที่สร้าง</th>
                <th className="px-5 py-3.5 text-center">สถานะ</th>
                <th className="px-5 py-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2042]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleBadge = getRoleLabel(u.role);
                  const isCurrent = u.id === currentUser.id;

                  return (
                    <tr key={u.id} className="hover:bg-[#161a35] transition-colors">
                      {/* User Column */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full bg-gradient-to-br ${
                              u.avatarColor || 'from-indigo-500 to-purple-600'
                            } flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}
                          >
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{u.username}</span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 font-normal">
                                  คุณเอง
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              PIN: {u.securityPin} • รหัส: {u.passwordHash}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${roleBadge.bg}`}
                        >
                          {u.role === 'SUPER_ADMIN' && <Crown className="w-3 h-3 text-amber-400" />}
                          <span>{roleBadge.text}</span>
                        </span>
                      </td>

                      {/* Seller Key */}
                      <td className="px-5 py-4 font-mono font-bold text-indigo-300 text-xs">
                        {u.sellerKey}
                      </td>

                      {/* Balance */}
                      <td className="px-5 py-4 font-mono font-black text-emerald-400 text-sm">
                        <div className="flex items-center gap-1.5">
                          <span>{formatThb(u.balanceThb)}</span>
                          <button
                            onClick={() => handleOpenBalanceModal(u)}
                            className="p-1 rounded bg-[#1b2144] hover:bg-emerald-950 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                            title="ปรับยอดเงินผู้ใช้นี้"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Keys Created */}
                      <td className="px-5 py-4 text-center font-mono font-bold text-cyan-300">
                        {u.keysCreatedCount} คีย์
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            u.status === 'ACTIVE'
                              ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/40'
                              : 'text-rose-400 bg-rose-950/60 border border-rose-800/40'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Change Role Button */}
                          <button
                            onClick={() => handleOpenRoleModal(u)}
                            disabled={!isSuperAdmin && u.role === 'SUPER_ADMIN'}
                            className="px-2.5 py-1.5 rounded-lg bg-[#181d3d] hover:bg-[#222955] text-amber-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-30"
                            title="เปลี่ยนยศ/ระดับสิทธิ์"
                          >
                            <Crown className="w-3 h-3" />
                            <span>ปรับยศ</span>
                          </button>

                          {/* Adjust Balance Button */}
                          <button
                            onClick={() => handleOpenBalanceModal(u)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#181d3d] hover:bg-[#222955] text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="ปรับยอดเครดิต"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>ปรับเงิน</span>
                          </button>

                          {/* Toggle Ban */}
                          {!isCurrent && (
                            <button
                              onClick={() => onToggleUserStatus(u.id)}
                              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                u.status === 'ACTIVE'
                                  ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300'
                                  : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300'
                              }`}
                              title={u.status === 'ACTIVE' ? 'ระงับการใช้งานยูสเซอร์' : 'ปลดแบน'}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete User Button */}
                          {!isCurrent && u.role !== 'SUPER_ADMIN' && (
                            <button
                              onClick={() => setDeleteConfirmUser(u)}
                              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/70 border border-rose-800/40 text-rose-400 hover:text-white transition-colors cursor-pointer"
                              title={`ลบผู้ใช้งาน ${u.username}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Balance Adjustment */}
      {balanceModalUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12152b] border border-[#262f5e] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f254e]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">ปรับยอดเงินสด / เครดิต</h3>
              </div>
              <button
                onClick={() => setBalanceModalUser(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#0c0e1b] border border-[#1e2448] flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">ผู้ใช้งาน:</span>{' '}
                <strong className="text-white">{balanceModalUser.username}</strong>
              </div>
              <div>
                <span className="text-slate-400">ยอดเงินปัจจุบัน:</span>{' '}
                <strong className="text-emerald-400 font-mono">{formatThb(balanceModalUser.balanceThb)}</strong>
              </div>
            </div>

            {/* Mode selection */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBalanceAdjustMode('SET')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  balanceAdjustMode === 'SET'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-[#161a35] text-slate-300'
                }`}
              >
                ตั้งค่ายอดเงินใหม่
              </button>
              <button
                type="button"
                onClick={() => setBalanceAdjustMode('ADD')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  balanceAdjustMode === 'ADD'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-[#161a35] text-slate-300'
                }`}
              >
                + เติมเงินเพิ่ม
              </button>
              <button
                type="button"
                onClick={() => setBalanceAdjustMode('SUBTRACT')}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  balanceAdjustMode === 'SUBTRACT'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-[#161a35] text-slate-300'
                }`}
              >
                - หักยอดเงินออก
              </button>
            </div>

            {/* Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                จำนวนเงิน (THB):
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={newBalanceInput}
                onChange={(e) => setNewBalanceInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#090b16] border border-[#232a54] font-mono text-xl font-black text-emerald-400 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                หมายเหตุการปรับยอด:
              </label>
              <input
                type="text"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1e254e]">
              <button
                type="button"
                onClick={() => setBalanceModalUser(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveBalance}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/20"
              >
                บันทึกการปรับยอดเงิน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Role Management */}
      {roleModalUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12152b] border border-[#262f5e] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f254e]">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">ปรับยศ / สิทธิ์ผู้ใช้งาน</h3>
              </div>
              <button
                onClick={() => setRoleModalUser(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              กำลังปรับยศให้ผู้ใช้: <strong className="text-white">{roleModalUser.username}</strong>
            </div>

            <div className="space-y-2">
              {[
                { id: 'SUPER_ADMIN', name: '👑 SUPER_ADMIN (แอดมินใหญ่สุด)', desc: 'จัดการระบบทั้งหมด, ยศทุกคน, ปรับเงิน, ดูคีย์ทุกคน' },
                { id: 'ADMIN', name: '⚡ ADMIN (แอดมินฝ่ายระบบ)', desc: 'จัดการคีย์, หลังบ้าน, ดูประวัติ' },
                { id: 'SENIOR_RESELLER', name: '⭐ SENIOR_RESELLER (ตัวแทนอาวุโส)', desc: 'ราคาส่วนลดพิเศษ สิทธิ์เบิกคีย์ไม่อั้น' },
                { id: 'RESELLER', name: '✔ RESELLER (ตัวแทนทั่วไป)', desc: 'เบิกคีย์ตามสต็อก ใช้บอทเติมเงินได้' },
                { id: 'MEMBER', name: '👤 MEMBER (สมาชิกเริ่มต้น)', desc: 'ใช้งานทั่วไป' },
              ].map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRole(r.id as UserRole)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRole === r.id
                      ? 'bg-indigo-950/80 border-indigo-500 shadow-md'
                      : 'bg-[#0d0f1e] border-[#22284d] hover:bg-[#141834]'
                  }`}
                >
                  <div className="font-bold text-xs text-white">{r.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{r.desc}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1f254e]">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
              >
                ยืนยันการเปลี่ยนยศ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Create New User */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12152b] border border-[#262f5e] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f254e]">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">เพิ่มบัญชีผู้ใช้งานใหม่</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">ชื่อผู้ใช้งาน (Username):</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="เช่น NewReseller_01"
                  className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">รหัสผ่าน (Password):</label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] font-mono text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Security PIN (6 หลัก):</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] font-mono text-amber-400 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ยอดเงินเริ่มต้น (THB):</label>
                  <input
                    type="number"
                    value={newInitialBalance}
                    onChange={(e) => setNewInitialBalance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] font-mono text-emerald-400 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ระดับยศเริ่มต้น:</label>
                  <select
                    value={newRoleSelect}
                    onChange={(e) => setNewRoleSelect(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-white focus:outline-none"
                  >
                    <option value="RESELLER">RESELLER (ตัวแทน)</option>
                    <option value="SENIOR_RESELLER">SENIOR_RESELLER (อาวุโส)</option>
                    <option value="ADMIN">ADMIN (แอดมิน)</option>
                    <option value="MEMBER">MEMBER (สมาชิก)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1f254e]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
                >
                  สร้างบัญชี
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Delete User Confirmation */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12152b] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#241e38]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-950/80 border border-rose-600/50 flex items-center justify-center text-rose-400">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">ยืนยันการลบผู้ใช้งาน</h3>
              </div>
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2 text-xs">
              <p className="text-slate-200">
                คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งาน <strong className="text-rose-400 font-mono text-sm">{deleteConfirmUser.username}</strong> ออกจากระบบอย่างถาวร?
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rose-900/30 text-slate-400">
                <div>ระดับยศ: <span className="text-white font-semibold">{deleteConfirmUser.role}</span></div>
                <div>เครดิตคงเหลือ: <span className="text-emerald-400 font-mono font-semibold">{formatThb(deleteConfirmUser.balanceThb)}</span></div>
                <div>คีย์ที่เคยเบิก: <span className="text-cyan-300 font-mono font-semibold">{deleteConfirmUser.keysCreatedCount} คีย์</span></div>
                <div>Seller Key: <span className="text-indigo-300 font-mono text-[10px]">{deleteConfirmUser.sellerKey}</span></div>
              </div>
            </div>

            <p className="text-[11px] text-rose-400/90 font-medium">
              ⚠️ คำเตือน: การลบนี้จะไม่สามารถย้อนกลับได้ บัญชีผู้ใช้และโทเค็นจะถูกเพิกถอนทันที
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1f254e]">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUser(deleteConfirmUser.id);
                  setDeleteConfirmUser(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบผู้ใช้งาน</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
