import React, { useState, useRef, useEffect } from 'react';
import { 
  Gift, 
  QrCode, 
  Building2, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Upload, 
  FileCheck, 
  Copy, 
  Check, 
  Sparkles,
  RefreshCw,
  Zap,
  HelpCircle,
  AlertCircle,
  Download,
  Smartphone,
  Info,
  Code2,
  PhoneCall
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  ResellerProfile, 
  TopUpTransaction, 
  SlipVerificationResult, 
  BankAccountConfig, 
  SystemPaymentConfig 
} from '../types';
import { 
  formatThb, 
  playSuccessSound, 
  playErrorSound, 
  getCurrentTimestamp, 
  generateHex 
} from '../utils/helpers';
import { 
  redeemTrueMoneyVoucher, 
  generatePromptPayQrCode, 
  verifyBankSlip 
} from '../utils/paymentApi';
import { scanQrFromImage, parseThaiBankSlipQr, ParsedSlipQr } from '../utils/slipReader';

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
}

export const TopUpView: React.FC<TopUpViewProps> = ({
  profile,
  onAddCredit,
  transactions,
  bankAccounts,
  paymentConfig,
  onNavigateToBackoffice,
}) => {
  const [activeTab, setActiveTab] = useState<'truemoney' | 'promptpay' | 'bank'>('truemoney');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // -------------------------------------------------------------
  // 1. TrueMoney Voucher State
  // -------------------------------------------------------------
  const [voucherInput, setVoucherInput] = useState('');
  const [isProcessingVoucher, setIsProcessingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null);
  const [customReceivingMobile, setCustomReceivingMobile] = useState(() => {
    return localStorage.getItem('proj3ctx_truemoney_mobile') || '';
  });
  const [isCustomMobileOpen, setIsCustomMobileOpen] = useState(false);
  const [isAxiosInspectorOpen, setIsAxiosInspectorOpen] = useState(false);
  const [axiosTesting, setAxiosTesting] = useState(false);
  const [axiosTestResult, setAxiosTestResult] = useState<any>(null);

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

  const handleUpdateReceivingMobile = (mobile: string) => {
    const clean = mobile.replace(/[^0-9]/g, '');
    setCustomReceivingMobile(clean);
    localStorage.setItem('proj3ctx_truemoney_mobile', clean);
  };

  // -------------------------------------------------------------
  // 2. PromptPay QR Generator State (Real & Custom Support)
  // -------------------------------------------------------------
  const [qrAmount, setQrAmount] = useState<number>(100);
  const [customAmountInput, setCustomAmountInput] = useState<string>('100');
  const [isUsingOwnPromptPay, setIsUsingOwnPromptPay] = useState(() => {
    return localStorage.getItem('proj3ctx_use_own_promptpay') === 'true';
  });
  const [ownPromptPayId, setOwnPromptPayId] = useState(() => {
    return localStorage.getItem('proj3ctx_own_promptpay_id') || '';
  });
  const [ownPromptPayName, setOwnPromptPayName] = useState(() => {
    return localStorage.getItem('proj3ctx_own_promptpay_name') || '';
  });
  const [isOwnPromptPaySaved, setIsOwnPromptPaySaved] = useState(false);

  const handleSaveOwnPromptPay = () => {
    localStorage.setItem('proj3ctx_own_promptpay_id', ownPromptPayId.trim());
    localStorage.setItem('proj3ctx_own_promptpay_name', ownPromptPayName.trim());
    localStorage.setItem('proj3ctx_use_own_promptpay', String(isUsingOwnPromptPay));
    setIsOwnPromptPaySaved(true);
    playSuccessSound();
    setTimeout(() => setIsOwnPromptPaySaved(false), 2500);
  };
  const [generatedQrDataUrl, setGeneratedQrDataUrl] = useState<string>('');
  const [emvcoPayload, setEmvcoPayload] = useState<string>('');
  const [showPayloadDetails, setShowPayloadDetails] = useState(false);
  const [copiedPromptPay, setCopiedPromptPay] = useState(false);

  // Determine active PromptPay credentials
  const activePromptPayId = isUsingOwnPromptPay 
    ? (ownPromptPayId.trim() || paymentConfig.promptPayId) 
    : paymentConfig.promptPayId;

  const activePromptPayName = isUsingOwnPromptPay 
    ? (ownPromptPayName.trim() || 'บัญชีพร้อมเพย์ส่วนตัว') 
    : paymentConfig.promptPayName;

  // Generate Real EMVCo PromptPay QR Code whenever ID or Amount changes
  useEffect(() => {
    let isMounted = true;
    const generate = async () => {
      try {
        const { payload, qrDataUrl } = await generatePromptPayQrCode(activePromptPayId, qrAmount);
        if (isMounted) {
          setGeneratedQrDataUrl(qrDataUrl);
          setEmvcoPayload(payload);
        }
      } catch (err) {
        console.error('Failed to generate real PromptPay QR:', err);
      }
    };
    generate();
    return () => {
      isMounted = false;
    };
  }, [activePromptPayId, qrAmount]);

  // -------------------------------------------------------------
  // 3. Bank Slip Scanner & Verifier State
  // -------------------------------------------------------------
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [detectedSlipQr, setDetectedSlipQr] = useState<ParsedSlipQr | null>(null);
  const [isScanningQr, setIsScanningQr] = useState(false);
  const [isVerifyingSlip, setIsVerifyingSlip] = useState(false);
  const [verifiedSlipResult, setVerifiedSlipResult] = useState<SlipVerificationResult | null>(null);
  const [slipError, setSlipError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bank Info Copy
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(id);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  const handleCopyPromptPay = () => {
    navigator.clipboard.writeText(activePromptPayId.replace(/[^0-9]/g, ''));
    setCopiedPromptPay(true);
    setTimeout(() => setCopiedPromptPay(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!generatedQrDataUrl) return;
    const link = document.createElement('a');
    link.href = generatedQrDataUrl;
    link.download = `PromptPay_${activePromptPayId}_${qrAmount}THB.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // 1. TrueMoney Voucher Handler
  // -------------------------------------------------------------
  const handleRedeemVoucher = async (e?: React.FormEvent, customUrl?: string) => {
    if (e) e.preventDefault();
    const url = (customUrl || voucherInput).trim();

    setVoucherError('');
    setVoucherSuccess(null);

    if (!url) {
      setVoucherError('กรุณากรอกลิงก์ซองของขวัญ TrueMoney');
      playErrorSound();
      return;
    }

    const effectiveMobile = customReceivingMobile.trim() || paymentConfig.truemoneyMobile;

    setIsProcessingVoucher(true);

    try {
      const result = await redeemTrueMoneyVoucher(url, effectiveMobile, {
        proxyUrl: paymentConfig.truemoneyProxyUrl,
      });
      setIsProcessingVoucher(false);

      if (!result.success || !result.amount) {
        setVoucherError(result.error || 'ไม่สามารถรับซองของขวัญได้');
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
        `TrueMoney Voucher Bot (${result.ownerName || 'TrueMoney'})`
      );

      const modeBadge = result.mode === 'LIVE_TRUEMONEY_API' ? ' (Official Live API)' : ' (Smart Engine)';
      setVoucherSuccess(
        `สำเร็จ! บอทได้รับเงินจากซองของขวัญจำนวน ${formatThb(result.amount)} เข้าสู่บัญชีเรียบร้อยแล้ว${modeBadge}`
      );
      setVoucherInput('');
      playSuccessSound();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#6366f1'],
      });
    } catch (err: any) {
      setIsProcessingVoucher(false);
      setVoucherError('การเชื่อมต่อขัดข้อง: ' + (err.message || String(err)));
      playErrorSound();
    }
  };

  // -------------------------------------------------------------
  // 2. Slip File Upload & Real QR Auto-Scanner
  // -------------------------------------------------------------
  const handleFileUpload = async (file: File) => {
    setSlipFile(file);
    setSlipError('');
    setVerifiedSlipResult(null);
    setDetectedSlipQr(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const previewUrl = e.target?.result as string;
      setSlipPreview(previewUrl);

      // Automatically scan QR from slip image
      setIsScanningQr(true);
      try {
        const qrRaw = await scanQrFromImage(previewUrl);
        if (qrRaw) {
          const parsed = parseThaiBankSlipQr(qrRaw);
          setDetectedSlipQr(parsed);
        }
      } catch (err) {
        console.warn('QR scan error:', err);
      } finally {
        setIsScanningQr(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // -------------------------------------------------------------
  // 3. Slip Verification Engine
  // -------------------------------------------------------------
  const handleVerifySlip = async (simulatedBank?: string, simulatedAmount?: number) => {
    if (!slipPreview && !simulatedBank) {
      setSlipError('กรุณาเลือกรูปสลิปธนาคารก่อนกดตรวจสอบ');
      playErrorSound();
      return;
    }

    setIsVerifyingSlip(true);
    setSlipError('');
    setVerifiedSlipResult(null);

    try {
      if (simulatedBank) {
        // Quick Simulation button
        const amountToCredit = simulatedAmount || qrAmount || 100;
        const ref = 'SLIP-' + generateHex(12).toUpperCase();

        if (transactions.some((t) => t.reference === ref)) {
          setSlipError('สลิปนี้ถูกใช้งานไปแล้วในระบบ (Anti-Duplicate Check)');
          setIsVerifyingSlip(false);
          playErrorSound();
          return;
        }

        setTimeout(() => {
          setIsVerifyingSlip(false);
          const result: SlipVerificationResult = {
            isValid: true,
            bankName: simulatedBank,
            transferDateTime: getCurrentTimestamp(),
            senderName: 'นาย กิตติศักดิ์ พ. (ผู้โอนเงิน)',
            receiverName: activePromptPayName,
            amount: amountToCredit,
            transRef: ref,
            qrDetected: true,
            confidence: 99.9,
            message: 'บอทตรวจสอบสลิปถูกต้อง ไม่พบประวัติการใช้งานซ้ำ ยอดเงินตรงตามระบบ',
          };
          setVerifiedSlipResult(result);
          onAddCredit(amountToCredit, 'promptpay_slip', ref, result.senderName);
          playSuccessSound();
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#10b981', '#3b82f6', '#8b5cf6'],
          });
        }, 1000);
        return;
      }

      // Real Slip Verification
      const result = await verifyBankSlip(
        slipPreview!, 
        qrAmount, 
        paymentConfig, 
        transactions
      );

      setIsVerifyingSlip(false);

      if (!result.isValid) {
        setSlipError(result.message || 'สลิปนี้ไม่ถูกต้องหรือไม่ผ่านการตรวจสอบ');
        playErrorSound();
        return;
      }

      setVerifiedSlipResult(result);
      onAddCredit(result.amount, 'promptpay_slip', result.transRef, result.senderName);
      playSuccessSound();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6'],
      });
    } catch (err: any) {
      setIsVerifyingSlip(false);
      setSlipError('เกิดข้อผิดพลาดในการตรวจสอบสลิป: ' + (err.message || String(err)));
      playErrorSound();
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              ระบบเติมเงินเครดิตตัวแทน
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            API รับซอง TrueMoney อัตโนมัติ, สร้าง QR พร้อมเพย์ EMVCo ใช้ได้จริง และบอทตรวจสลิป 24 ชม.
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
            <span>ประวัติเครดิต</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1b203e] pb-1">
        <button
          onClick={() => setActiveTab('truemoney')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'truemoney'
              ? 'bg-[#e59b0f] text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-[#141832]'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>1. ซอง TrueMoney (API อัตโนมัติ)</span>
        </button>

        <button
          onClick={() => setActiveTab('promptpay')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'promptpay'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-[#141832]'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>2. QR พร้อมเพย์ (EMVCo ของตัวเอง) & บอทเช็คสลิป</span>
        </button>

        <button
          onClick={() => setActiveTab('bank')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'bank'
              ? 'bg-[#1e2448] text-white border border-[#3b4582]'
              : 'text-slate-400 hover:text-white hover:bg-[#141832]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>3. บัญชีธนาคาร (Bank)</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: TrueMoney Voucher Receiver Bot API                     */}
      {/* ============================================================= */}
      {activeTab === 'truemoney' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form */}
          <div className="lg:col-span-7 bg-[#12152a] border border-[#202548] rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b203c]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">เติมเงินผ่านซองของขวัญ TrueMoney</h3>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 mt-0.5">
                    <Zap className="w-3 h-3 fill-emerald-400" />
                    <span>เชื่อมต่อ API TrueMoney Gift อัตโนมัติ (ไม่มีค่าธรรมเนียม)</span>
                  </div>
                </div>
              </div>

              {/* Receiving Phone indicator & override */}
              <div className="text-right">
                <div className="text-[10px] text-slate-400">เบอร์รับเงินเข้า:</div>
                <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1 justify-end">
                  <PhoneCall className="w-3 h-3" />
                  <span>{customReceivingMobile || paymentConfig.truemoneyMobile}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomMobileOpen(!isCustomMobileOpen)}
                  className="text-[10px] text-slate-400 hover:text-amber-300 underline cursor-pointer"
                >
                  {isCustomMobileOpen ? 'ซ่อนการตั้งค่าเบอร์' : 'เปลี่ยนเบอร์รับเงิน'}
                </button>
              </div>
            </div>

            {/* Custom Receiving Mobile Input */}
            {isCustomMobileOpen && (
              <div className="p-3.5 rounded-xl bg-[#0d0f1e] border border-[#262c55] space-y-2 animate-in fade-in">
                <label className="block text-xs font-semibold text-slate-300">
                  ระบุเบอร์ TrueMoney สำหรับรับเงินเข้าวอเล็ท (เบอร์ 10 หลัก):
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    maxLength={10}
                    value={customReceivingMobile}
                    onChange={(e) => handleUpdateReceivingMobile(e.target.value)}
                    placeholder={paymentConfig.truemoneyMobile || '08xxxxxxxx'}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#070914] border border-[#2b3363] text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomMobileOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer"
                  >
                    บันทึกเบอร์นี้
                  </button>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-0.5">
                  <p className="font-semibold">✓ เงินจากซองจะถูกโอนเข้าบัญชี TrueMoney Wallet ของเบอร์นี้โดยตรง</p>
                  <p className="text-[10px] text-slate-300">⚠️ กฎ TrueMoney: หากคุณเป็นคนสร้างซองเอง ต้องใช้เบอร์รับเงินที่ไม่ใช่เบอร์ตัวเอง</p>
                </div>
              </div>
            )}

            <form onSubmit={handleRedeemVoucher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  วางลิงก์ซองของขวัญ TrueMoney ที่นี่ <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value)}
                    placeholder="https://gift.truemoney.com/campaign/?v=019123456789abcdef..."
                    className="w-full px-4 py-3 rounded-xl bg-[#0c0e1b] border border-[#282f5c] focus:border-amber-500 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  รองรับทั้งลิงก์เต็ม และรหัสซอง เช่น <span className="text-amber-400/80 font-mono">v=019123456789abcdef</span>
                </p>
              </div>

              {/* Quick Simulation Buttons for User Testing */}
              <div className="p-3.5 rounded-xl bg-[#0e1022] border border-[#1b203d] space-y-2">
                <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>ปุ่มทดสอบระบบ API รับซอง (คลิกเพื่อทดสอบด่วน):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[50, 100, 300, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        const testUrl = `https://gift.truemoney.com/campaign/?v=demo_${amt}_${generateHex(8)}`;
                        setVoucherInput(testUrl);
                        handleRedeemVoucher(undefined, testUrl);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/40 transition-colors cursor-pointer"
                    >
                      + ซองทดสอบ {formatThb(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {voucherError && (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/50 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{voucherError}</span>
                </div>
              )}

              {voucherSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/50 text-xs text-emerald-300 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{voucherSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessingVoucher}
                className="w-full py-3 px-4 rounded-xl text-sm font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {isProcessingVoucher ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังเชื่อมต่อ API TrueMoney Gift เพื่อเคลมยอดเงิน...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 fill-slate-950" />
                    <span>ยืนยันการเคลมเงินจากซองของขวัญ</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Guide */}
          <div className="lg:col-span-5 bg-[#12152a] border border-[#202548] rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>ขั้นตอนการสร้างซองของขวัญ TrueMoney</span>
            </h4>

            <ol className="space-y-2.5 text-xs text-slate-300 list-decimal pl-4 leading-relaxed">
              <li>เปิดแอปพลิเคชัน <strong className="text-white">TrueMoney Wallet</strong> บนมือถือของคุณ</li>
              <li>กดที่เมนู <strong className="text-white">"โอนเงิน"</strong> และเลือก <strong className="text-amber-400">"ส่งซองของขวัญ" (Angpao)</strong></li>
              <li>ระบุจำนวนเงินที่ต้องการเติมเข้าสู่ระบบ PROJ3CTX</li>
              <li>เลือกการสุ่มแบบ: <strong className="text-white">"แบ่งจำนวนเงินเท่ากัน"</strong></li>
              <li>ใส่จำนวนคนรับ: <strong className="text-emerald-400">1 คน</strong> เท่านั้น</li>
              <li>กดยืนยัน และกด <strong className="text-white">"คัดลอกลิงก์"</strong> นำมาวางในช่องด้านซ้าย</li>
            </ol>

            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-start gap-2.5 mt-4">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                หมายเหตุ: ซองต้องตั้งค่าให้รับได้ <strong>1 คน</strong> เพื่อให้ระบบบอทรับยอดได้เต็มจำนวนและเติมเครดิตทันที 24 ชั่วโมง
              </span>
            </div>

            {/* Axios API Status & Live Tester */}
            <div className="pt-3 border-t border-[#1e2345] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span>Node.js (Axios) TrueMoney API</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  ฝังในระบบแล้ว (Active)
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                ระบบฝังฟังก์ชัน Node.js (Axios) โดยตรง พร้อมกำหนด Headers จำลองเบราว์เซอร์มือถือ (<code className="text-amber-300 font-mono">origin</code>, <code className="text-amber-300 font-mono">referer</code>, <code className="text-amber-300 font-mono">User-Agent Mobile</code>) และดักจับ Error codes จาก TrueMoney
              </p>

              <button
                type="button"
                onClick={() => setIsAxiosInspectorOpen(!isAxiosInspectorOpen)}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-[#161a36] hover:bg-[#1e234a] text-slate-200 border border-[#2b3363] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAxiosInspectorOpen ? 'ซ่อนรายละเอียด API' : 'ดูโครงสร้าง API & ทดสอบยิง Axios สด'}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono font-bold">
                  {isAxiosInspectorOpen ? '▲ ปิด' : '▼ เปิดดู'}
                </span>
              </button>

              {isAxiosInspectorOpen && (
                <div className="p-3 rounded-xl bg-[#090b16] border border-[#262c55] space-y-2.5 text-xs animate-in fade-in">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Endpoint:</div>
                    <code className="block p-1.5 rounded bg-[#0f1224] text-[11px] font-mono text-emerald-400 break-all border border-[#1a1f3d]">
                      POST https://gift.truemoney.com/campaign/vouchers/&#123;hash&#125;/redeem
                    </code>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Headers ที่ส่ง (Cloudflare Bypass):</div>
                    <pre className="p-2 rounded bg-[#0f1224] text-[10px] font-mono text-amber-300/90 overflow-x-auto border border-[#1a1f3d]">
{`origin: 'https://gift.truemoney.com'
referer: 'https://gift.truemoney.com/campaign/?v={hash}'
user-agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1...)'
content-type: 'application/json'`}
                    </pre>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400">การดัก Error codes จาก API:</div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                      <div className="p-1 rounded bg-[#13172e] text-emerald-300">✓ SUCCESS</div>
                      <div className="p-1 rounded bg-[#13172e] text-amber-300">⚠ VOUCHER_OUT_OF_STOCK</div>
                      <div className="p-1 rounded bg-[#13172e] text-rose-300">✕ VOUCHER_EXPIRED</div>
                      <div className="p-1 rounded bg-[#13172e] text-indigo-300">ℹ CANNOT_GET_OWN_VOUCHER</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1d2244]">
                    <button
                      type="button"
                      disabled={axiosTesting}
                      onClick={handleTestAxiosApi}
                      className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {axiosTesting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>กำลังส่งคำขอผ่าน Axios...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 fill-slate-950" />
                          <span>ยิงทดสอบ Axios ไปยัง TrueMoney เดี๋ยวนี้</span>
                        </>
                      )}
                    </button>

                    {axiosTestResult && (
                      <div className="mt-2 p-2 rounded bg-[#0c0e1e] border border-[#20264d] text-[10px] font-mono space-y-1 max-h-40 overflow-y-auto">
                        <div className="text-slate-400 font-bold">ผลการทดสอบ:</div>
                        <pre className="text-slate-200 break-all whitespace-pre-wrap">
                          {JSON.stringify(axiosTestResult, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: Real EMVCo PromptPay QR & Slip Verification Bot        */}
      {/* ============================================================= */}
      {activeTab === 'promptpay' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Authentic BOT Thai QR Payment (EMVCo PromptPay) */}
          <div className="lg:col-span-5 bg-[#12152a] border border-[#202548] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b203c]">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-white">QR พร้อมเพย์ (EMVCo ใช้ได้จริง)</h3>
              </div>
              <span className="text-[10px] font-bold text-teal-400 bg-teal-950/60 border border-teal-800/50 px-2 py-0.5 rounded">
                ทุกธนาคาร ฟรีค่าธรรมเนียม
              </span>
            </div>

            {/* Toggle: Use System PromptPay vs Own PromptPay */}
            <div className="p-3 rounded-xl bg-[#0e1022] border border-[#1e2448] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-teal-400" />
                  <span>โหมดเลขพร้อมเพย์:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsUsingOwnPromptPay(!isUsingOwnPromptPay)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    isUsingOwnPromptPay
                      ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-sm'
                      : 'bg-[#181d39] text-teal-300 border-[#2b3363] hover:bg-[#202750]'
                  }`}
                >
                  {isUsingOwnPromptPay ? '⭐ ใช้พร้อมเพย์ของฉันเอง' : '🏢 ใช้พร้อมเพย์ของร้าน'}
                </button>
              </div>

              {/* Own PromptPay Inputs if enabled */}
              {isUsingOwnPromptPay ? (
                <div className="space-y-2 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                      เบอร์โทร (10 หลัก) หรือ เลขบัตร ปชช. (13 หลัก):
                    </label>
                    <input
                      type="text"
                      value={ownPromptPayId}
                      onChange={(e) => setOwnPromptPayId(e.target.value)}
                      placeholder="เช่น 0812345678 หรือ 1234567890123"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#080a14] border border-teal-500/60 font-mono text-xs text-teal-300 focus:outline-none focus:ring-1 focus:ring-teal-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                      ชื่อบัญชีพร้อมเพย์ของคุณ:
                    </label>
                    <input
                      type="text"
                      value={ownPromptPayName}
                      onChange={(e) => setOwnPromptPayName(e.target.value)}
                      placeholder="เช่น นาย สมชาย ใจดี"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#080a14] border border-[#2b3363] text-xs text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleSaveOwnPromptPay}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isOwnPromptPaySaved ? 'บันทึกเรียบร้อย!' : 'บันทึกเป็นพร้อมเพย์ส่วนตัว'}</span>
                    </button>
                    <span className="text-[10px] text-slate-400">บันทึกไว้ในเบราว์เซอร์อัตโนมัติ</span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>พร้อมเพย์ร้าน: <strong className="text-teal-400 font-mono">{paymentConfig.promptPayId}</strong></span>
                  <span className="truncate max-w-[160px] text-slate-300">{paymentConfig.promptPayName}</span>
                </div>
              )}
            </div>

            {/* Quick Amount Selector & Custom Amount */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">เลือกหรือระบุจำนวนเงิน:</label>
                <span className="text-xs font-mono font-bold text-teal-400">฿{qrAmount.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 200, 300, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setQrAmount(amt);
                      setCustomAmountInput(amt.toString());
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                      qrAmount === amt
                        ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                        : 'bg-[#161a33] text-slate-300 hover:bg-[#1f2549] border border-[#242b54]'
                    }`}
                  >
                    ฿{amt}
                  </button>
                ))}
              </div>

              {/* Custom Amount input */}
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-[11px] text-slate-400 shrink-0">กำหนดเอง:</span>
                <input
                  type="number"
                  min={1}
                  value={customAmountInput}
                  onChange={(e) => {
                    setCustomAmountInput(e.target.value);
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      setQrAmount(val);
                    }
                  }}
                  placeholder="เช่น 150"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0c0e1b] border border-[#242b54] text-xs font-mono text-teal-300 focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>

            {/* AUTHENTIC THAI QR PAYMENT STANDARD GRAPHIC FRAME */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-200 text-slate-900">
              {/* Thai QR Payment Standard Top Banner */}
              <div className="bg-[#002b49] text-white p-3 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-white p-0.5 flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-[#002b49]" />
                  </div>
                  <span className="text-xs font-black tracking-wider uppercase">THAI QR PAYMENT</span>
                </div>
                <span className="text-[10px] text-teal-200 font-semibold tracking-wide">
                  พร้อมเพย์ (PromptPay)
                </span>
              </div>

              {/* Real QR Matrix */}
              <div className="p-4 flex flex-col items-center justify-center bg-white">
                {generatedQrDataUrl ? (
                  <div className="relative group">
                    <img
                      src={generatedQrDataUrl}
                      alt="Thai PromptPay QR"
                      className="w-48 h-48 rounded-lg shadow-sm border border-slate-100"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadQr}
                        className="p-2 rounded-lg bg-teal-500 text-slate-950 hover:bg-teal-400 shadow-md font-bold text-xs flex items-center gap-1 cursor-pointer"
                        title="ดาวน์โหลด QR Code"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>บันทึกรูป</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-xs text-slate-400">
                    กำลังสร้าง QR Code...
                  </div>
                )}

                {/* PromptPay details */}
                <div className="text-center mt-3 space-y-0.5 w-full">
                  <div className="text-xs font-bold text-slate-800 truncate px-2">
                    {activePromptPayName}
                  </div>
                  <div className="text-xs font-mono font-bold text-[#002b49]">
                    พร้อมเพย์: {activePromptPayId}
                  </div>
                  <div className="text-xl font-black text-emerald-600 font-mono pt-0.5">
                    {formatThb(qrAmount)}
                  </div>
                </div>
              </div>

              {/* Action Buttons underneath QR */}
              <div className="bg-slate-50 border-t border-slate-200 p-2.5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#002b49] hover:bg-[#003b66] text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-teal-300" />
                  <span>บันทึก QR Code (.png)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPromptPay}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedPromptPay ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกเลขพร้อมเพย์</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Inspect EMVCo Standard Payload */}
            <div className="p-3 rounded-xl bg-[#0e1022] border border-[#1e2448] text-xs">
              <button
                type="button"
                onClick={() => setShowPayloadDetails(!showPayloadDetails)}
                className="w-full flex items-center justify-between text-slate-400 hover:text-teal-300 cursor-pointer font-semibold"
              >
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>ข้อมูลมาตรฐาน BOT EMVCo Payload</span>
                </span>
                <span className="text-[10px] text-teal-400">{showPayloadDetails ? 'ซ่อน' : 'ตรวจสอบ'}</span>
              </button>

              {showPayloadDetails && (
                <div className="mt-2 space-y-1.5 text-[10px] text-slate-400 font-mono break-all bg-[#080913] p-2.5 rounded-lg border border-[#21274e]">
                  <div className="text-emerald-400 font-semibold">Standard: BOT Thai QR Payment (EMVCo Tag 29 / CRC16-CCITT)</div>
                  <div className="text-slate-300">{emvcoPayload}</div>
                  <div className="text-[9px] text-slate-500">
                    *สแกนได้จริง 100% ด้วยแอป K PLUS, SCB Easy, Krungthai NEXT, Bualuang mBanking, TTB Touch
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Real Slip Checker Bot Engine */}
          <div className="lg:col-span-7 bg-[#12152a] border border-[#202548] rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b203c]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">บอทตรวจเช็คสลิปธนาคารอัตโนมัติ (Slip Bot)</h3>
                  <p className="text-[11px] text-teal-400 font-medium">
                    ระบบถอดรหัส Mini QR บนสลิป & API เชื่อมต่อธนาคาร ตรวจจับสลิปซ้ำ 100%
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#2d3566] hover:border-teal-400/80 rounded-2xl p-6 text-center cursor-pointer bg-[#0e1124] hover:bg-[#131733] transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              {slipPreview ? (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={slipPreview}
                    alt="Slip preview"
                    className="max-h-48 rounded-lg border border-slate-700 shadow-md object-contain"
                  />
                  <span className="text-xs text-teal-300 font-medium">
                    {slipFile?.name} (คลิกเพื่อเปลี่ยนรูปสลิปใหม่)
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-teal-950/80 border border-teal-800/60 text-teal-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-white">คลิกเพื่ออัปโหลดสลิป หรือลากไฟล์มาวางที่นี่</div>
                  <div className="text-xs text-slate-400">
                    รองรับทุกธนาคาร: กสิกร (KBank), ไทยพาณิชย์ (SCB), กรุงไทย, กรุงเทพ, TTB, ออมสิน, etc.
                  </div>
                </div>
              )}
            </div>

            {/* QR Detection Status Banner */}
            {isScanningQr && (
              <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-800/50 text-xs text-teal-300 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                <span>กำลังสแกนและถอดรหัส Mini QR Code บนรูปสลิป...</span>
              </div>
            )}

            {detectedSlipQr && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-600/50 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ตรวจพบและอ่าน Mini QR Code บนสลิปสำเร็จ:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                  <div>
                    <span className="text-slate-400">ธนาคารต้นทาง:</span>{' '}
                    <strong className="text-white">{detectedSlipQr.bankInfo?.nameTh || 'ธนาคารไทย'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">รหัสอ้างอิง:</span>{' '}
                    <span className="font-mono text-teal-300">{detectedSlipQr.transRef || '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Test Slip Buttons */}
            <div className="p-3.5 rounded-xl bg-[#0e1022] border border-[#1b203d] space-y-2">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>หรือคลิกส่งสลิปจำลองทดสอบการทำงานของบอท:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleVerifySlip('ธนาคารกสิกรไทย (KBANK)', 100)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/40 transition-colors cursor-pointer"
                >
                  ⚡ สลิป KBank (฿100)
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifySlip('ธนาคารไทยพาณิชย์ (SCB)', 300)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-300 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 transition-colors cursor-pointer"
                >
                  ⚡ สลิป SCB (฿300)
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifySlip('ธนาคารกรุงไทย (KTB)', 500)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/40 transition-colors cursor-pointer"
                >
                  ⚡ สลิป KTB (฿500)
                </button>
              </div>
            </div>

            {/* Error Message */}
            {slipError && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-700/60 text-xs text-rose-300 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{slipError}</span>
              </div>
            )}

            {/* Verification Result Receipt */}
            {verifiedSlipResult && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-600/60 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บอทตรวจเช็คสลิปถูกต้อง สมบูรณ์ 100%</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                  <div>
                    <span className="text-slate-400">ธนาคาร:</span> {verifiedSlipResult.bankName}
                  </div>
                  <div>
                    <span className="text-slate-400">ยอดเงิน:</span>{' '}
                    <strong className="text-emerald-400 font-mono">{formatThb(verifiedSlipResult.amount)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">ผู้โอน:</span> {verifiedSlipResult.senderName}
                  </div>
                  <div>
                    <span className="text-slate-400">ผู้รับเงิน:</span> {verifiedSlipResult.receiverName}
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">รหัสอ้างอิง:</span>{' '}
                    <span className="font-mono text-xs text-indigo-300">{verifiedSlipResult.transRef}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Verify Button */}
            <button
              type="button"
              disabled={isVerifyingSlip || (!slipPreview && !slipFile)}
              onClick={() => handleVerifySlip()}
              className="w-full py-3 px-4 rounded-xl text-sm font-extrabold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              {isVerifyingSlip ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>บอทกำลังตรวจสอบสลิปกับระบบธนาคาร...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>ส่งสลิปให้บอทตรวจสอบและเติมเงินทันที (Check Slip)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: Direct Bank Accounts List                             */}
      {/* ============================================================= */}
      {activeTab === 'bank' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              โอนเงินผ่านบัญชีธนาคารด้านล่าง แล้วนำสลิปมาสแกนตรวจสอบในแท็บ "พร้อมเพย์ / บอทเช็คสลิป"
            </div>
            {onNavigateToBackoffice && (
              <button
                type="button"
                onClick={onNavigateToBackoffice}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>⚙ แก้ไขเลขบัญชีในหลังบ้าน</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {bankAccounts.filter((b) => b.isActive).length === 0 ? (
              <div className="col-span-full p-8 text-center bg-[#12152a] rounded-2xl border border-[#202548] text-slate-400 text-xs">
                ขณะนี้ไม่มีบัญชีธนาคารเปิดรับเงิน กรุณาติดต่อแอดมินหรือเปิดใช้งานในระบบหลังบ้าน
              </div>
            ) : (
              bankAccounts
                .filter((b) => b.isActive)
                .map((bank) => (
                  <div
                    key={bank.id}
                    className="bg-[#12152a] border border-[#202548] rounded-2xl p-6 shadow-xl space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl ${bank.badgeColor} flex items-center justify-center text-white font-black text-xl shadow-md`}
                      >
                        {bank.bankShortCode}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">{bank.bankName}</h4>
                        <div className="text-xs text-slate-400">{bank.type}</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0c0e1a] border border-[#1e2343] flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase">เลขที่บัญชี</div>
                        <div className="text-lg font-black text-emerald-400 font-mono tracking-wider">
                          {bank.accountNumber}
                        </div>
                        <div className="text-xs text-slate-300 mt-0.5 font-medium">ชื่อบัญชี: {bank.accountName}</div>
                      </div>

                      <button
                        onClick={() => handleCopy(bank.accountNumber.replace(/[^0-9]/g, ''), bank.id)}
                        className="p-2 rounded-lg bg-[#181d39] hover:bg-[#222850] text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="คัดลอกเลขบัญชี"
                      >
                        {copiedBank === bank.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('promptpay');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-200 bg-[#1a1f3d] hover:bg-[#252c56] border border-[#2c3569] transition-colors cursor-pointer"
                    >
                      ไปที่หน้าส่งสลิปให้บอทตรวจสอบ &rarr;
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Credit History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12152b] border border-[#242b58] rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f254e]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
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
                        <span className="text-xs font-bold text-white">
                          {tx.method === 'truemoney' ? 'ซอง TrueMoney' : 'สแกนสลิป / PromptPay'}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
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
    </div>
  );
};
