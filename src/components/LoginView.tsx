import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Key, 
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';
import { UserAccount } from '../types';
import { playSuccessSound, playErrorSound } from '../utils/helpers';

interface LoginViewProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
  onQuickRegister: (username: string, pass: string, pin: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  onLoginSuccess,
  onQuickRegister,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [usernameInput, setUsernameInput] = useState('PROJ3CTX');
  const [passwordInput, setPasswordInput] = useState('admin1234');
  const [pinInput, setPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetUser = users.find(
      (u) => u.username.toLowerCase() === usernameInput.trim().toLowerCase()
    );

    if (!targetUser) {
      setErrorMsg('ไม่พบบัญชีผู้ใช้งานนี้ในระบบ');
      playErrorSound();
      return;
    }

    if (targetUser.status === 'BANNED' || targetUser.status === 'SUSPENDED') {
      setErrorMsg('บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อ Super Admin');
      playErrorSound();
      return;
    }

    if (targetUser.passwordHash !== passwordInput) {
      setErrorMsg('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      playErrorSound();
      return;
    }

    playSuccessSound();
    onLoginSuccess(targetUser);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (usernameInput.trim().length < 3) {
      setErrorMsg('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร');
      playErrorSound();
      return;
    }

    if (passwordInput.length < 4) {
      setErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      playErrorSound();
      return;
    }

    if (pinInput.length !== 6 || !/^\d+$/.test(pinInput)) {
      setErrorMsg('รหัสยืนยันตัวตน (Security PIN) ต้องเป็นตัวเลข 6 หลัก');
      playErrorSound();
      return;
    }

    const exists = users.some(
      (u) => u.username.toLowerCase() === usernameInput.trim().toLowerCase()
    );

    if (exists) {
      setErrorMsg('ชื่อผู้ใช้นี้มีคนใช้แล้ว กรุณาเลือกชื่ออื่น');
      playErrorSound();
      return;
    }

    onQuickRegister(usernameInput.trim(), passwordInput, pinInput);
  };

  const selectQuickAccount = (u: UserAccount) => {
    setUsernameInput(u.username);
    setPasswordInput(u.passwordHash);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#090a14] text-slate-100 flex items-center justify-center p-4 cyber-grid relative overflow-hidden">
      {/* Background glow elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-0.5 shadow-xl shadow-indigo-600/30 mb-2">
            <div className="w-full h-full bg-[#0d0f1e] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white">PROJ3CTX AUTH</h1>
          <p className="text-xs text-slate-400">
            ระบบเจเนอเรทคีย์ & แผงจัดการตัวแทน Reseller ศูนย์กลาง
          </p>
        </div>

        {/* Main Form Box */}
        <div className="bg-[#12152b]/90 backdrop-blur-xl border border-[#222852] rounded-3xl p-7 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1c2246]">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <span>{isRegisterMode ? 'สมัครสมาชิกตัวแทนใหม่' : 'เข้าสู่ระบบบัญชีตัวแทน'}</span>
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/60">
              v3.2 Pure Core
            </span>
          </div>

          <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-4 text-xs">
            {/* Username */}
            <div>
              <label className="block font-bold text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">
                ชื่อผู้ใช้งาน (Username) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="เช่น PROJ3CTX หรือชื่อร้านคุณ"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0b0d1c] border border-[#232a56] focus:border-indigo-500 text-white placeholder-slate-500 focus:outline-none font-semibold transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-bold text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">
                รหัสผ่าน (Password) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="กรอกรหัสผ่านของคุณ"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0b0d1c] border border-[#232a56] focus:border-indigo-500 text-white placeholder-slate-500 focus:outline-none font-mono transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* If Register: Require PIN */}
            {isRegisterMode && (
              <div>
                <label className="block font-bold text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">
                  รหัสยืนยัน 6 หลัก (Security PIN) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="ตัวเลข 6 หลัก (เช่น 888888)"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0b0d1c] border border-[#232a56] focus:border-amber-400 text-center tracking-[0.4em] font-mono text-base text-amber-300 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  ใช้สำหรับยืนยันสิทธิ์ตอนเข้าแผงเพื่อความปลอดภัยสูงสุด
                </p>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span>{isRegisterMode ? 'สร้างบัญชีและเข้าใช้งาน' : 'เข้าสู่ระบบ (Sign In)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle Register / Login mode */}
          <div className="pt-2 text-center text-[11px]">
            {isRegisterMode ? (
              <span className="text-slate-400">
                มีบัญชีอยู่แล้ว?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setErrorMsg('');
                  }}
                  className="text-indigo-400 font-bold hover:underline cursor-pointer"
                >
                  เข้าสู่ระบบที่นี่
                </button>
              </span>
            ) : (
              <span className="text-slate-400">
                ยังไม่มีบัญชีตัวแทน?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setErrorMsg('');
                  }}
                  className="text-indigo-400 font-bold hover:underline cursor-pointer"
                >
                  สมัครสมาชิกใหม่
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Quick Test Accounts Box for Convenience */}
        <div className="bg-[#12152a]/70 border border-[#1d2244] rounded-2xl p-4 space-y-2 text-xs">
          <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>คลิกเลือกบัญชีเพื่อทดสอบเข้าใช้งานทันที (Demo Quick Select):</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {users.slice(0, 4).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => selectQuickAccount(u)}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  usernameInput === u.username
                    ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-sm'
                    : 'bg-[#0d0f1e] border-[#22284d] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-white text-[11px] truncate flex items-center justify-between">
                  <span>{u.username}</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    u.role === 'SUPER_ADMIN' ? 'bg-amber-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {u.role === 'SUPER_ADMIN' ? 'แอดมินใหญ่' : u.role}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  รหัส: {u.passwordHash} (PIN: {u.securityPin})
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
