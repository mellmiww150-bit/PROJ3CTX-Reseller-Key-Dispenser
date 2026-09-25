import React, { useState } from 'react';
import { Zap, X, Copy, Check, AlertCircle, CheckCircle2, Wallet } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ProductTier, ResellerProfile } from '../types';
import { formatThb, generateLicenseKey, playSuccessSound, playErrorSound } from '../utils/helpers';

interface DispenseModalProps {
  products: ProductTier[];
  profile: ResellerProfile;
  initialProductId?: string;
  onClose: () => void;
  onNavigateToTopup: () => void;
  onDispenseSuccess: (product: ProductTier, quantity: number, generatedKeys: string[]) => void;
}

export const DispenseModal: React.FC<DispenseModalProps> = ({
  products,
  profile,
  initialProductId,
  onClose,
  onNavigateToTopup,
  onDispenseSuccess,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || products[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[] | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const totalPrice = selectedProduct ? selectedProduct.priceThb * quantity : 0;
  const canAfford = profile.balanceThb >= totalPrice;
  const remainingBalance = profile.balanceThb - totalPrice;

  const handleDispense = () => {
    if (!canAfford) {
      playErrorSound();
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);

      const prefix = selectedProduct.code.startsWith('WETV') ? 'WETV' : 'PHTM';
      const keys: string[] = [];
      for (let i = 0; i < quantity; i++) {
        keys.push(generateLicenseKey(prefix));
      }

      setGeneratedKeys(keys);
      onDispenseSuccess(selectedProduct, quantity, keys);
      playSuccessSound();

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#6366f1', '#10b981'],
      });
    }, 800);
  };

  const handleCopyAll = () => {
    if (!generatedKeys) return;
    navigator.clipboard.writeText(generatedKeys.join('\n'));
    setCopiedAll(true);
    playSuccessSound();
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#12152b] border border-[#242b58] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1f254e]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Zap className="w-4 h-4 fill-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">เบิก License Key (Instant Dispenser)</h3>
              <p className="text-[11px] text-slate-400">หักเครดิตอัตโนมัติและรับคีย์ทันที 0ms delay</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1c2246] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!generatedKeys ? (
          /* Dispense Selection Form */
          <div className="space-y-4">
            {/* Select Product */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                เลือกรุ่นสินค้า / ระยะเวลาแพ็กเกจ:
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c0e1b] border border-[#232953] text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatThb(p.priceThb)} (คงเหลือ {p.stock} คีย์)
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                จำนวนคีย์ที่ต้องการเบิก:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={selectedProduct.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-28 px-3.5 py-2 rounded-xl bg-[#0c0e1b] border border-[#232953] text-sm font-bold font-mono text-white text-center focus:outline-none focus:border-indigo-500"
                />

                <div className="flex items-center gap-1.5">
                  {[1, 2, 5, 10].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuantity(q)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        quantity === q
                          ? 'bg-indigo-600 text-white'
                          : 'bg-[#181d3d] text-slate-300 hover:bg-[#202652]'
                      }`}
                    >
                      {q} คีย์
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Price & Balance Calculation Card */}
            <div className="p-4 rounded-xl bg-[#0d0f20] border border-[#1e2348] space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>ราคาต่อหน่วย:</span>
                <span className="font-mono text-white">{formatThb(selectedProduct.priceThb)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>ยอดเงินที่ต้องชำระ:</span>
                <span className="font-mono font-bold text-base text-amber-400">
                  {formatThb(totalPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>เครดิตคงเหลือปัจจุบัน:</span>
                <span className="font-mono text-emerald-400">{formatThb(profile.balanceThb)}</span>
              </div>
              <div className="pt-2 border-t border-[#1a1f3f] flex items-center justify-between font-bold">
                <span className="text-slate-300">เครดิตหลังหักยอด:</span>
                <span
                  className={`font-mono ${canAfford ? 'text-emerald-400' : 'text-rose-400'}`}
                >
                  {formatThb(remainingBalance)}
                </span>
              </div>
            </div>

            {/* Insufficient Funds Warning */}
            {!canAfford && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>ยอดเครดิตของคุณไม่เพียงพอสำหรับการเบิกรายการนี้</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToTopup();
                  }}
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold text-white bg-amber-500 hover:bg-amber-400 shrink-0 ml-2"
                >
                  เติมเงินทันที
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                disabled={!canAfford || isProcessing}
                onClick={handleDispense}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>{isProcessing ? 'กำลังเบิกคีย์...' : `ยืนยันเบิกคีย์ (${formatThb(totalPrice)})`}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Success Screen with Generated Keys */
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">เบิก License Key สำเร็จเรียบร้อย!</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedProduct.name} จำนวน {quantity} คีย์ ได้รับการบันทึกเข้าพอร์ตแล้ว
              </p>
            </div>

            {/* Keys Display Box */}
            <div className="p-3.5 rounded-xl bg-[#0b0d1a] border border-[#20264d] text-left max-h-48 overflow-y-auto space-y-2">
              {generatedKeys.map((k, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#141834] font-mono text-xs text-amber-300 font-bold border border-[#232956]"
                >
                  <span>{k}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(k);
                      playSuccessSound();
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Copy Key"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleCopyAll}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
              >
                {copiedAll ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedAll ? 'คัดลอกทั้งหมดแล้ว!' : 'คัดลอกคีย์ทั้งหมด'}</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-[#1a1f3e] hover:bg-[#232a52] transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
