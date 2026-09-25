import React, { useState } from 'react';
import { X, Copy, Check, CheckCircle2, Clock, Package, DollarSign } from 'lucide-react';
import { OrderRecord } from '../types';
import { formatThb, playSuccessSound } from '../utils/helpers';

interface OrderDetailsModalProps {
  order: OrderRecord;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    playSuccessSound();
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(order.keys.join('\n'));
    setCopiedAll(true);
    playSuccessSound();
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#12152b] border border-[#242b58] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2448]">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">รายละเอียดคำสั่งซื้อ</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1f3d]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Info */}
        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#0b0d1a] border border-[#1f254e] flex items-center justify-between">
            <span className="text-slate-400">เลขที่คำสั่งซื้อ:</span>
            <span className="font-mono font-bold text-indigo-400">{order.orderNo}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#151933]">
              <div className="text-[10px] text-slate-400 uppercase">สินค้า</div>
              <div className="font-bold text-white mt-0.5">{order.productName}</div>
            </div>

            <div className="p-3 rounded-xl bg-[#151933]">
              <div className="text-[10px] text-slate-400 uppercase">สถานะรายการ</div>
              <div className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{order.status}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#151933]">
              <div className="text-[10px] text-slate-400 uppercase">จำนวนที่สั่งซื้อ</div>
              <div className="font-bold text-white mt-0.5">{order.quantity} ชิ้น</div>
            </div>

            <div className="p-3 rounded-xl bg-[#151933]">
              <div className="text-[10px] text-slate-400 uppercase">ยอดเงินรวม</div>
              <div className="font-mono font-black text-emerald-400 text-sm mt-0.5">
                {formatThb(order.totalPriceThb)}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-400 font-semibold">License Keys ที่ได้รับ ({order.keys.length} คีย์):</span>
              <button
                onClick={handleCopyAll}
                className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedAll ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedAll ? 'คัดลอกแล้ว' : 'คัดลอกทั้งหมด'}</span>
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-[#0b0d1a] border border-[#20254b]">
              {order.keys.map((k, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#141834] font-mono text-xs font-bold text-amber-300"
                >
                  <span>{k}</span>
                  <button
                    onClick={() => handleCopy(k)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {copiedKey === k ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 text-right">
            บันทึกเวลาทำรายการ: {order.createdAt}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-[#1c2246] hover:bg-[#252c58] transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
