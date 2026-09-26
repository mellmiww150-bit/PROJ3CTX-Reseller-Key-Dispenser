import React, { useState } from 'react';
import { 
  Gift, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  Sparkles,
  RefreshCw,
  Zap,
  HelpCircle,
  AlertCircle,
  Smartphone,
  PhoneCall,
  Settings,
  ShieldAlert,
  ArrowRight,
  ClipboardCheck,
  CheckCircle,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  ResellerProfile, 
  TopUpTransaction, 
  BankAccountConfig, 
  SystemPaymentConfig 
} from '../types';
import { 
  formatThb, 
  playSuccessSound, 
  playErrorSound, 
  generateHex,
  speakThaiPaymentNotification
} from '../utils/helpers';
import { sendDiscordNotification } from '../utils/discordNotifier';
import { redeemTrueMoneyVoucher } from '../utils/paymentApi';

interface TopUpViewProps {
  profile: ResellerProfile;
  onAddCredit: (
    amount: number, 
    method: 'truemoney' | 'promptpay_slip' | 'bank_transfer', 
    ref: string, 
    senderName?: string
  ) => void;
  transactions: TopUpTransaction[];
  bankAccounts: BankAccountConfig[];
  paymentConfig: SystemPaymentConfig;
  onNavigateToBackoffice?: () => void;
  onUpdatePaymentConfig?: (config: SystemPaymentConfig) => void;
}

export const TopUpView: React.FC<TopUpViewProps> = ({
  profile,
  onAddCredit,
  transactions,
  bankAccounts,
  paymentConfig,
  onNavigateToBackoffice,
  onUpdatePaymentConfig,
}) => {
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // -------------------------------------------------------------
  // TrueMoney Voucher State
  // -------------------------------------------------------------
  const [voucherInput, setVoucherInput] = useState('');
  const [isProcessingVoucher, setIsProcessingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null);
  const [depositCelebration, setDepositCelebration] = useState<{
    amount: number;
    methodTitle: string;
    ref: string;
    sender: string;
    oldBalance: number;
    newBalance: number;
  } | null>(null);

  // Receiving TrueMoney phone number state
  const [customReceivingMobile, setCustomReceivingMobile] = useState(() => {
    return localStorage.getItem('proj3ctx_truemoney_mobile') || paymentConfig.truemoneyMobile || '0891234567';
  });
  const [isCustomMobileOpen, setIsCustomMobileOpen] = useState(false);
  const [phoneSaveMessage, setPhoneSaveMessage] = useState<string | null>(null);

  // Axios Inspector state
  const [isAxiosInspectorOpen, setIsAxiosInspectorOpen] = useState(false);
  const [axiosTesting, setAxiosTesting] = useState(false);
  const [axiosTestResult, setAxiosTestResult] = useState<any>(null);

  const handleUpdateReceivingMobile = (mobile: string) => {
    const clean = mobile.replace(/[^0-9]/g, '');
    setCustomReceivingMobile(clean);
  };

  const handleSaveReceivingMobile = () => {
    if (customReceivingMobile.length < 10) {
      setPhoneSaveMessage('⚠️ กรุณากรอกเบอร์มือถือ 10 หลัก');
      playErrorSound();
      return;
    }
    localStorage.setItem('proj3ctx_truemoney_mobile', customReceivingMobile);
    if (onUpdatePaymentConfig) {
      onUpdatePaymentConfig({
        ...paymentConfig,
        truemoneyMobile: customReceivingMobile,
      });
    }
    setPhoneSaveMessage('✓ บันทึกเบอร์รับเงินเข้าวอเล็ทสำเร็จ!');
    playSuccessSound();
    setTimeout(() => {
      setPhoneSaveMessage(null);
      setIsCustomMobileOpen(false);
    }, 1500);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setVoucherInput(text.trim());
        playSuccessSound();
      }
    } catch {
      // Clipboard permission denied or not supported, ignore silently
    }
  };

  const handleTestAxiosApi = async () => {
    setAxiosTesting(true);
    setAxiosTestResult(null);
    try {
      const match = voucherInput.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      const hash = match ? match[1] : (voucherInput.trim() || 'demo_100_test');
      const mobile = customReceivingMobile.trim() || paymentConfig.truemoneyMobile || '0891234567';
      const res = await fetch('/api/truemoney/axios-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucherHash: hash, mobile }),
      });
      const data = await res.json();
      setAxiosTestResult(data);
    } catch (e: any) {
      setAxiosTestResult({ success: false, error: e.message });
    } finally {
      setAxiosTesting(false);
    }
  };

  // -------------------------------------------------------------
  // TrueMoney Voucher Claim Handler
  // -------------------------------------------------------------
  const handleRedeemVoucher = async (e?: React.FormEvent, customUrl?: string) => {
    if (e) e.preventDefault();
    const url = (customUrl || voucherInput).trim();

    setVoucherError('');
    setVoucherSuccess(null);

    if (!url) {
      setVoucherError('กรุณากรอกหรือวางลิงก์ซองของขวัญ TrueMoney');
      playErrorSound();
      return;
    }

    const effectiveMobile = customReceivingMobile.trim() || paymentConfig.truemoneyMobile || '0891234567';

    setIsProcessingVoucher(true);

    try {
      const result = await redeemTrueMoneyVoucher(url, effectiveMobile, {
        proxyUrl: paymentConfig.truemoneyProxyUrl,
      });
      setIsProcessingVoucher(false);

      if (!result.success || !result.amount) {
        setVoucherError(result.error || 'ไม่สามารถรับซองของขวัญได้ ซองอาจถูกใช้ไปแล้วหรือหมดอายุ');
        playErrorSound();
        return;
      }

      const voucherRef = result.voucherId || ('TMV-' + generateHex(10).toUpperCase());

      // Check anti-double-spend in local transactions
      if (transactions.some((t) => t.reference === voucherRef)) {
        setVoucherError('ซองของขวัญนี้ถูกใช้งานหรือเคลมไปแล้วในระบบ ไม่สามารถรับซ้ำได้');
        playErrorSound();
        return;
      }

      onAddCredit(
        result.amount, 
        'truemoney', 
        voucherRef, 
        `TrueMoney Voucher (${result.ownerName || 'TrueMoney Wallet User'})`
      );

      setDepositCelebration({
        amount: result.amount,
        methodTitle: '🎁 ซองของขวัญ TrueMoney Wallet',
        ref: voucherRef,
        sender: result.ownerName || 'TrueMoney Wallet User',
        oldBalance: profile.balanceThb,
        newBalance: profile.balanceThb + result.amount,
      });

      const modeBadge = result.mode === 'LIVE_TRUEMONEY_API' ? ' (Official Live API)' : ' (ระบบดึงยอดอัตโนมัติ)';
      setVoucherSuccess(
        `เติมเงินสำเร็จ! ยอดเงินจำนวน ${formatThb(result.amount)} เข้าสู่บัญชีเรียบร้อยแล้ว${modeBadge}`
      );
      setVoucherInput('');
      playSuccessSound();
      speakThaiPaymentNotification(result.amount, 'ซอง TrueMoney');
      confetti({
        particleCount: 130,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#f59e0b', '#10b981', '#6366f1', '#ec4899'],
      });

      // Send Discord Webhook Notification
      sendDiscordNotification({
        event: 'TOPUP_SUCCESS',
        data: {
          amountThb: result.amount,
          method: 'truemoney',
          reference: voucherRef,
          senderName: result.ownerName || 'TrueMoney Wallet User',
          username: profile.username,
        },
        stats: {
          totalUsersCount: 1,
          totalKeysCount: profile.keysCreatedCount,
          totalRevenueThb: profile.totalDepositedThb + result.amount,
          recentTransactions: transactions,
        },
      }, paymentConfig).catch(() => {});
    } catch (err: any) {
      setIsProcessingVoucher(false);
      setVoucherError('การเชื่อมต่อขัดข้อง: ' + (err.message || String(err)));
      playErrorSound();
    }
  };

  // Extract voucher hash for live visual indicator
  const detectedHash = (() => {
    const match = voucherInput.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    if (/^[a-zA-Z0-9_-]{10,40}$/.test(voucherInput.trim())) return voucherInput.trim();
    return null;
  })();

  const activeMobile = customReceivingMobile || paymentConfig.truemoneyMobile || '0891234567';

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>ระบบเติมเงินเครดิตตัวแทน</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ซอง TrueMoney Wallet Only
                </span>
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            เชื่อมต่อ API TrueMoney Gift รับเงินเข้ากระเป๋าจริงทันที ป้องกันสลิปปลอมและการโกง 100%
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#13162c] border border-[#232950] flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">เครดิตปัจจุบัน:</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {formatThb(profile.balanceThb)}
            </span>
          </div>

          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-[#171b35] hover:bg-[#20254a] border border-[#2b3363] hover:text-white transition-all cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>ประวัติเติมเงิน</span>
          </button>
        </div>
      </div>

      {/* Security Guarantee Notice Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#181a33] to-emerald-950/30 border border-amber-500/30 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">🔒 ปลอดภัยสูงสุด: รับเฉพาะซองของขวัญ TrueMoney Wallet</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                100% Anti-Fraud
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              ทางร้านปิดช่องทางสลิปโอนเงินธนาคารและพร้อมเพย์ เพื่อแก้ปัญหาสลิปปลอม สลิปตัดต่อ และสลิปซ้ำอย่างถาวร 100% — เงินจากซองจะถูกโอนเข้าบัญชี TrueMoney ของเจ้าของร้านทันทีก่อนเพิ่มเครดิต
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-[#0e1124] border border-[#232952] text-slate-300 flex items-center gap-2">
            <span className="text-[10px] text-slate-400">เบอร์รับเงินปัจจุบัน:</span>
            <span className="font-mono font-bold text-amber-400">{activeMobile}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsCustomMobileOpen(!isCustomMobileOpen)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1a1f3d] hover:bg-[#252c56] text-amber-300 border border-amber-500/40 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>เปลี่ยนเบอร์รับ</span>
          </button>
        </div>
      </div>

      {/* Receiving Mobile Settings Dropdown Card */}
      {isCustomMobileOpen && (
        <div className="p-4 rounded-2xl bg-[#111429] border border-amber-500/40 shadow-xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <PhoneCall className="w-4 h-4 text-amber-400" />
              <span>ตั้งค่าเบอร์ TrueMoney Wallet ปลายทางสำหรับรับเงินเข้า:</span>
            </div>
            <button
              onClick={() => setIsCustomMobileOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ปิด
            </button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="tel"
              maxLength={10}
              value={customReceivingMobile}
              onChange={(e) => handleUpdateReceivingMobile(e.target.value)}
              placeholder="08xxxxxxxx (เบอร์ TrueMoney 10 หลัก)"
              className="flex-1 min-w-[240px] px-4 py-2.5 rounded-xl bg-[#090b16] border border-[#282f5c] text-sm font-mono text-amber-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={handleSaveReceivingMobile}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>บันทึกเบอร์นี้</span>
            </button>
          </div>

          {phoneSaveMessage && (
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{phoneSaveMessage}</span>
            </div>
          )}

          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-1">
            <p className="font-semibold">✓ เงินจากซองของขวัญที่ลูกค้าส่งมา จะถูกดึงเข้ากระเป๋า TrueMoney Wallet ของเบอร์นี้โดยอัตโนมัติ</p>
            <p className="text-[10px] text-slate-300">⚠️ ข้อกำหนด TrueMoney: กรณีคนส่งซองเป็นคนเดียวกันกับเบอร์รับเงิน TrueMoney จะไม่อนุญาตให้รับซองตัวเอง (กรุณาใช้คนละเบอร์หากทดสอบสร้างซองจริง)</p>
          </div>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Top-Up Form */}
        <div className="lg:col-span-7 bg-[#12152a] border border-[#202548] rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1b203c]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">เติมเงินผ่านซองของขวัญ TrueMoney Wallet</h3>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 mt-0.5">
                  <Zap className="w-3 h-3 fill-emerald-400" />
                  <span>ระบบรับซองอัตโนมัติ 24 ชม. • ไม่มีค่าธรรมเนียม 0%</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-slate-400">เงินเข้าเบอร์:</div>
              <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1 justify-end">
                <Smartphone className="w-3 h-3 text-amber-400" />
                <span>{activeMobile}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleRedeemVoucher} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  วางลิงก์ซองของขวัญ TrueMoney Wallet <span className="text-amber-400">*</span>
                </label>
                {voucherInput && (
                  <button
                    type="button"
                    onClick={() => setVoucherInput('')}
                    className="text-[11px] text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    ✕ ล้างข้อมูล
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                  placeholder="https://gift.truemoney.com/campaign/?v=019123456789abcdef..."
                  className="w-full pl-4 pr-28 py-3.5 rounded-xl bg-[#0a0c18] border border-[#282f5c] focus:border-amber-500 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono transition-all shadow-inner"
                />

                <div className="absolute right-2 top-2 bottom-2 flex items-center">
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1a1f3d] hover:bg-[#252c56] text-amber-300 border border-amber-500/40 transition-all cursor-pointer flex items-center gap-1.5"
                    title="วางข้อความจากคลิปบอร์ด"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>วางลิงก์</span>
                  </button>
                </div>
              </div>

              {/* Detected Hash Indicator */}
              {detectedHash ? (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>ตรวจพบรหัสซอง: <strong className="text-emerald-300">{detectedHash}</strong></span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1.5">
                  รองรับทั้งลิงก์เต็ม <span className="text-amber-400/80 font-mono">gift.truemoney.com/campaign/?v=...</span> หรือรหัสซอง
                </p>
              )}
            </div>

            {/* Quick Test / Demo Simulation Buttons */}
            <div className="p-3.5 rounded-xl bg-[#0d0f20] border border-[#1e2348] space-y-2">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>ทดสอบระบบรับซองอัตโนมัติ (คลิกเติมเงินตัวอย่างด่วน):</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Instant Test</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[50, 100, 300, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      const testUrl = `https://gift.truemoney.com/campaign/?v=demo_${amt}_${generateHex(8)}`;
                      setVoucherInput(testUrl);
                      handleRedeemVoucher(undefined, testUrl);
                    }}
                    className="py-2 px-2.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-700/50 hover:border-amber-500 transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    <span>+ ซอง {formatThb(amt)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {voucherError && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold">เกิดข้อผิดพลาด:</span>
                  <p>{voucherError}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {voucherSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-600/60 text-xs text-emerald-300 flex items-start gap-2.5 font-medium animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{voucherSuccess}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessingVoucher}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              {isProcessingVoucher ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>กำลังเชื่อมต่อ API TrueMoney เพื่อดึงเงินเข้ากระเป๋า...</span>
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 fill-slate-950" />
                  <span>ยืนยันเติมเงินทันที (รับเงินเข้ากระเป๋าจริง)</span>
                </>
              )}
            </button>
          </form>

          {/* Collapsible Axios Inspector Tool */}
          <div className="pt-2 border-t border-[#1a1f3c]">
            <button
              type="button"
              onClick={() => setIsAxiosInspectorOpen(!isAxiosInspectorOpen)}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-[#0e1124] hover:bg-[#151936] text-slate-300 border border-[#21274f] flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>เครื่องมือตรวจสอบ API TrueMoney (Axios Engine)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {isAxiosInspectorOpen ? '▲ ซ่อน' : '▼ ดูข้อมูลเทคนิค'}
              </span>
            </button>

            {isAxiosInspectorOpen && (
              <div className="mt-3 p-3.5 rounded-xl bg-[#090b16] border border-[#232952] space-y-3 text-xs animate-in fade-in">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Target Endpoint:</div>
                  <code className="block p-1.5 rounded bg-[#0f1224] text-[11px] font-mono text-emerald-400 break-all border border-[#1a1f3d]">
                    POST https://gift.truemoney.com/campaign/vouchers/&#123;hash&#125;/redeem
                  </code>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Headers ป้องกันการบล็อก (Mobile Simulation):</div>
                  <pre className="p-2 rounded bg-[#0f1224] text-[10px] font-mono text-amber-300/90 overflow-x-auto border border-[#1a1f3d]">
{`origin: 'https://gift.truemoney.com'
referer: 'https://gift.truemoney.com/campaign/?v={hash}'
user-agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1...)'
content-type: 'application/json'`}
                  </pre>
                </div>

                <button
                  type="button"
                  disabled={axiosTesting}
                  onClick={handleTestAxiosApi}
                  className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {axiosTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังส่งคำขอผ่าน Axios...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-slate-950" />
                      <span>ยิงทดสอบ Axios Handshake ไปยัง TrueMoney</span>
                    </>
                  )}
                </button>

                {axiosTestResult && (
                  <div className="p-2.5 rounded bg-[#0c0e1e] border border-[#20264d] text-[10px] font-mono space-y-1 max-h-40 overflow-y-auto">
                    <div className="text-slate-400 font-bold">ผลการตอบกลับจาก TrueMoney API:</div>
                    <pre className="text-slate-200 break-all whitespace-pre-wrap">
                      {JSON.stringify(axiosTestResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Step-by-Step Guide & Anti-Fraud Guarantee */}
        <div className="lg:col-span-5 space-y-5">
          {/* 4-Step Visual Guide */}
          <div className="bg-[#12152a] border border-[#202548] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1b203c]">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">
                วิธีสร้างซองของขวัญ TrueMoney ใน 4 ขั้นตอน
              </h4>
            </div>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#0e1124] border border-[#1d2244]">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/40 mt-0.5">
                  1
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-white">เปิดแอป TrueMoney Wallet</div>
                  <div className="text-slate-400 text-[11px]">
                    กดที่เมนู <strong className="text-slate-200">"โอนเงิน"</strong> และเลือก <strong className="text-amber-400">"ส่งซองของขวัญ" (Angpao)</strong>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#0e1124] border border-[#1d2244]">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/40 mt-0.5">
                  2
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-white">ระบุยอดเงินที่ต้องการเติม</div>
                  <div className="text-slate-400 text-[11px]">
                    ใส่จำนวนเงินที่ต้องการ เช่น <span className="text-emerald-400 font-bold font-mono">100</span> หรือ <span className="text-emerald-400 font-bold font-mono">500</span> บาท
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#0e1124] border border-[#1d2244]">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/40 mt-0.5">
                  3
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-white">ตั้งค่าประเภทและจำนวนคนรับ</div>
                  <div className="text-slate-400 text-[11px]">
                    เลือก <strong className="text-slate-200">"แบ่งจำนวนเงินเท่ากัน"</strong> และใส่จำนวนผู้รับเป็น <strong className="text-emerald-400 font-bold">1 คน</strong> เท่านั้น
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#0e1124] border border-[#1d2244]">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/40 mt-0.5">
                  4
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-white">คัดลอกลิงก์ซองแล้วนำมาวาง</div>
                  <div className="text-slate-400 text-[11px]">
                    กดสร้างซอง กด <strong className="text-amber-400">"คัดลอกลิงก์"</strong> แล้วนำมาวางในช่องด้านซ้าย กดยืนยัน เครดิตเข้าทันที!
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Why TrueMoney Vouchers Are 100% Fraud-Proof */}
          <div className="bg-[#12152a] border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1b203c]">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">
                ข้อดีของการรับเฉพาะซอง TrueMoney
              </h4>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">ป้องกันสลิปปลอม 100%:</strong> ลิงก์ซองของขวัญไม่สามารถตัดต่อหรือปลอมแปลงได้ ระบบจะดึงเงินจริงเข้ากระเป๋าของท่านก่อนเครดิตจะถูกเพิ่มเท่านั้น
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">ไม่มีค่าธรรมเนียม (0% Fee):</strong> ทั้งผู้ซื้อและผู้ขายไม่ต้องเสียค่าธรรมเนียมให้ธนาคาร
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">อัตโนมัติ รวดเร็ว 1-2 วินาที:</strong> เครดิตเข้าสู่บัญชีทันทีโดยไม่ต้องรอแอดมินตรวจสอบ
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">ป้องกันการใช้ซ้ำเด็ดขาด:</strong> ลิงก์ซองใดที่ถูกดึงเงินไปแล้ว TrueMoney จะไม่อนุญาตให้ดึงซ้ำอีก
                </span>
              </li>
            </ul>

            {onNavigateToBackoffice && (
              <div className="pt-2 border-t border-[#1b203c]">
                <button
                  type="button"
                  onClick={onNavigateToBackoffice}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-[#171b38] hover:bg-[#212750] text-slate-300 hover:text-white border border-[#2b3363] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5 text-indigo-400" />
                  <span>จัดการระบบหลังบ้าน (Admin Backoffice) &rarr;</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Credit History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12152b] border border-[#242b58] rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f254e]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold text-white">ประวัติการเติมเงินเครดิต</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 rounded hover:bg-slate-800"
              >
                ปิดหน้าต่าง
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">ยังไม่มีประวัติการเติมเงิน</div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-xl bg-[#151933] border border-[#21274f] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1">
                          <Gift className="w-3.5 h-3.5 text-amber-400" />
                          <span>{tx.method === 'truemoney' ? 'ซอง TrueMoney Wallet' : 'เติมเงินเข้าระบบ'}</span>
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                          {tx.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {tx.details || tx.senderName} • <span className="font-mono text-slate-500">{tx.reference}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{tx.createdAt}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-emerald-400 font-mono">
                        +{formatThb(tx.amountThb)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deposit Received Celebration Modal */}
      {depositCelebration && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#131733] via-[#10132a] to-[#0c0e1e] border-2 border-emerald-500/50 rounded-3xl max-w-md w-full p-7 space-y-5 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Ambient emerald & amber glow */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="text-center space-y-2 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-400 p-0.5 mx-auto shadow-xl shadow-amber-500/30">
                <div className="w-full h-full bg-[#0d1022] rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-amber-400 animate-bounce" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-[11px] font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>เงินเข้ากระเป๋าจริงแล้ว (PAYMENT CONFIRMED)</span>
              </div>

              <h3 className="text-2xl font-black text-white tracking-tight">
                เติมเครดิตสำเร็จ!
              </h3>
            </div>

            {/* Glowing Big Amount Card */}
            <div className="p-4 rounded-2xl bg-[#090b16] border border-amber-500/40 text-center relative z-10 space-y-1 shadow-inner">
              <span className="text-[11px] font-semibold text-slate-400">ยอดเงินที่ได้รับ</span>
              <div className="text-4xl font-black text-amber-400 font-mono tracking-tight drop-shadow-md">
                +{formatThb(depositCelebration.amount)}
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-center gap-2 pt-1">
                <span>ยอดเงินเดิม: <span className="font-mono text-slate-300">{formatThb(depositCelebration.oldBalance)}</span></span>
                <span className="text-emerald-400 font-bold">➔</span>
                <span>ยอดเงินใหม่: <span className="font-mono text-emerald-400 font-bold">{formatThb(depositCelebration.newBalance)}</span></span>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="p-3.5 rounded-xl bg-[#141834] border border-[#232a52] text-xs space-y-2 relative z-10">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">ช่องทางการเติม:</span>
                <span className="font-bold text-amber-300">{depositCelebration.methodTitle}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">รหัสอ้างอิงซอง:</span>
                <span className="font-mono text-indigo-300 font-semibold">{depositCelebration.ref}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">ผู้ส่งซอง:</span>
                <span className="text-slate-200">{depositCelebration.sender}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 relative z-10">
              <button
                type="button"
                onClick={() => setDepositCelebration(null)}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
              >
                ตกลง / พร้อมใช้งาน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
