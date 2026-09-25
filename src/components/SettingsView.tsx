import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  Copy, 
  Check, 
  Lock, 
  ShieldCheck, 
  Smartphone, 
  CheckCircle2, 
  Zap, 
  Eye, 
  EyeOff,
  Code2,
  AlertCircle
} from 'lucide-react';
import { ResellerProfile } from '../types';
import { formatThb, playSuccessSound, playErrorSound } from '../utils/helpers';

interface SettingsViewProps {
  profile: ResellerProfile;
  onOpenDispense: () => void;
  onNavigateToApi: () => void;
  onUpdatePassword: (newPass: string) => void;
  onToggle2FA: () => void;
  onSetPin: (pin: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onOpenDispense,
  onNavigateToApi,
  onUpdatePassword,
  onToggle2FA,
  onSetPin,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // Modals for PIN and 2FA
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [show2faModal, setShow2faModal] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(profile.sellerKey);
    setCopiedKey(true);
    playSuccessSound();
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!currentPass) {
      setPassError('กรุณากรอกรหัสผ่านปัจจุบัน');
      playErrorSound();
      return;
    }
    if (newPass.length < 6) {
      setPassError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      playErrorSound();
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      playErrorSound();
      return;
    }

    onUpdatePassword(newPass);
    setPassSuccess('อัปเดตรหัสผ่านตัวแทนเรียบร้อยแล้ว!');
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    playSuccessSound();
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length !== 6 || !/^\d+$/.test(pinInput)) {
      alert('PIN ต้องเป็นตัวเลข 6 หลักเท่านั้น');
      return;
    }
    onSetPin(pinInput);
    setShowPinModal(false);
    setPinInput('');
    playSuccessSound();
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <span>Reseller Settings & Security</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage account credentials, partner key, 2FA security and system preferences
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToApi}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-[#151933] hover:bg-[#1e2348] border border-[#272e59] hover:text-white transition-all cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>API Reference</span>
          </button>

          <button
            onClick={onOpenDispense}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Generate Key</span>
          </button>
        </div>
      </div>

      {/* Main Row matching Screenshot 7 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Profile Overview Card */}
        <div className="lg:col-span-4 bg-[#12152a] border border-[#202548] rounded-2xl p-6 shadow-xl space-y-5 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/25">
            <div className="w-full h-full rounded-full bg-[#101326] flex items-center justify-center text-indigo-300">
              <span className="text-3xl font-black">P</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-extrabold text-white">{profile.username}</h3>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/50 px-2.5 py-0.5 rounded-full mt-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Verified Partner (Reseller)</span>
            </div>
          </div>

          {/* Partner Seller Key Box */}
          <div className="w-full p-3.5 rounded-xl bg-[#0c0e1b] border border-[#222850] text-left">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              PARTNER SELLER KEY
            </div>
            <div className="flex items-center justify-between mt-1 font-mono text-xs font-bold text-indigo-300">
              <span>{profile.sellerKey}</span>
              <button
                onClick={handleCopyKey}
                className="p-1 rounded hover:bg-[#1a2044] text-slate-400 hover:text-white transition-colors"
                title="Copy Key"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Details list */}
          <div className="w-full space-y-2.5 text-xs text-left border-t border-[#1b203c] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Current Balance:</span>
              <span className="font-bold text-emerald-400 font-mono">{formatThb(profile.balanceThb)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Keys In Portfolio:</span>
              <span className="font-bold text-white font-mono">{profile.keysCreatedCount} Keys</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Orders:</span>
              <span className="font-bold text-white font-mono">31</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Account Status:</span>
              <span className="font-bold text-indigo-300">{profile.status}</span>
            </div>
          </div>

          <button
            onClick={onOpenDispense}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Dispense Keys</span>
          </button>
        </div>

        {/* Right Security & Password Forms matching Screenshot 7 */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Change Password */}
          <div className="bg-[#12152a] border border-[#202548] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1b203c]">
              <Lock className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Change Reseller Password</h3>
                <p className="text-[11px] text-slate-400">
                  Update your login password regularly to protect your account and dollar credit allocation.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  CURRENT PASSWORD
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0b0d1a] border border-[#242b52] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    NEW PASSWORD
                  </label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0b0d1a] border border-[#242b52] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    CONFIRM NEW PASSWORD
                  </label>
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0b0d1a] border border-[#242b52] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {passError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{passSuccess}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: 6-Digit PIN matching Screenshot 7 */}
          <div className="bg-[#12152a] border border-[#202548] rounded-2xl p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">6-Digit Security PIN</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Add a secondary 6-digit PIN code required for withdrawals and sensitive authorization actions.
                  </p>
                </div>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                profile.pinConfigured
                  ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/40'
                  : 'text-slate-400 bg-slate-800/60 border border-slate-700/50'
              }`}>
                {profile.pinConfigured ? 'Configured' : 'Not Configured'}
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowPinModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors cursor-pointer"
              >
                + Set 6-Digit PIN
              </button>
            </div>
          </div>

          {/* Card 3: 2FA matching Screenshot 7 */}
          <div className="bg-[#12152a] border border-[#202548] rounded-2xl p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Two-Factor Authentication (2FA)</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Secure your session with Google Authenticator or Microsoft Authenticator time-based codes.
                  </p>
                </div>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                profile.twoFactorEnabled
                  ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/40'
                  : 'text-slate-400 bg-slate-800/60 border border-slate-700/50'
              }`}>
                {profile.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShow2faModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/50 transition-colors cursor-pointer"
              >
                {profile.twoFactorEnabled ? 'Manage 2FA' : 'Setup 2FA'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12152b] border border-[#242b58] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">ตั้งรหัสความปลอดภัย 6-Digit PIN</h3>
            <p className="text-xs text-slate-400">กรุณาระบุตัวเลข 6 หลักสำหรับยืนยันรายการสำคัญ</p>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="******"
                className="w-full text-center tracking-[0.5em] text-2xl font-mono px-4 py-3 rounded-xl bg-[#0b0d1a] border border-[#242b52] text-white focus:outline-none focus:border-amber-400"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300"
                >
                  บันทึก PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {show2faModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12152b] border border-[#242b58] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <h3 className="text-base font-bold text-white">Two-Factor Authentication (2FA)</h3>
            <p className="text-xs text-slate-400">
              สแกน QR Code ด้วยแอป Google Authenticator
            </p>
            <div className="w-36 h-36 bg-white p-2 rounded-xl mx-auto flex items-center justify-center">
              <div className="w-32 h-32 border-4 border-slate-900 flex items-center justify-center font-mono text-[10px] text-slate-900 font-bold p-1">
                PROJ3CTX-2FA-QR
              </div>
            </div>
            <div className="text-xs font-mono text-indigo-300">Secret: 4K92 MC81 00FA 77B9</div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onToggle2FA();
                  setShow2faModal(false);
                  playSuccessSound();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500"
              >
                {profile.twoFactorEnabled ? 'ปิดการใช้งาน 2FA' : 'เปิดใช้งาน 2FA'}
              </button>
              <button
                type="button"
                onClick={() => setShow2faModal(false)}
                className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
