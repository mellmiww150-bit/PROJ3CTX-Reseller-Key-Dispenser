import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, Sparkles, LogOut } from 'lucide-react';
import { UserAccount } from '../types';
import { playSuccessSound, playErrorSound } from '../utils/helpers';

interface PinVerifyModalProps {
  user: UserAccount;
  onVerifySuccess: () => void;
  onCancel: () => void;
}

export const PinVerifyModal: React.FC<PinVerifyModalProps> = ({
  user,
  onVerifySuccess,
  onCancel,
}) => {
  const [pinDigits, setPinDigits] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (pinDigits === user.securityPin) {
      playSuccessSound();
      onVerifySuccess();
    } else {
      setErrorMsg('รหัส PIN 6 หลักไม่ถูกต้อง');
      playErrorSound();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#12152b] border border-[#262e5e] rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 shadow-lg shadow-indigo-600/30 mx-auto">
          <div className="w-full h-full bg-[#0d0f1e] rounded-[14px] flex items-center justify-center text-amber-400">
            <Lock className="w-7 h-7 animate-bounce" />
          </div>
        </div>

        <div>
          <h3 className="text-base font-extrabold text-white">ยืนยันรหัสความปลอดภัย (Security PIN)</h3>
          <p className="text-xs text-slate-400 mt-1">
            ยินดีต้อนรับ <span className="text-indigo-400 font-bold">{user.username}</span> กรุณาใส่รหัส 6 หลักเพื่อปลดล็อคแผงควบคุม
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="password"
            maxLength={6}
            autoFocus
            value={pinDigits}
            onChange={(e) => setPinDigits(e.target.value)}
            placeholder="••••••"
            className="w-full text-center tracking-[0.6em] text-2xl font-mono px-4 py-3 rounded-2xl bg-[#090b16] border border-[#242b58] text-amber-400 font-bold focus:outline-none focus:border-amber-400 shadow-inner"
          />

          <div className="text-[11px] text-slate-500 font-mono">
            (เดโม PIN ของบัญชีนี้คือ: <strong className="text-indigo-300">{user.securityPin}</strong>)
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-[#161a35] hover:bg-[#1f244a] transition-colors cursor-pointer"
            >
              สลับบัญชี / ออก
            </button>

            <button
              type="submit"
              disabled={pinDigits.length !== 6}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 disabled:opacity-40 transition-all cursor-pointer"
            >
              ปลดล็อค &rarr;
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
