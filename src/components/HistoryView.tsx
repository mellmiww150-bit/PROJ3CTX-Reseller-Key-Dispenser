import React, { useState } from 'react';
import { Clock, KeyRound, CheckCircle2, Eye, Copy, Check, ExternalLink, Package } from 'lucide-react';
import { OrderRecord } from '../types';
import { formatThb, playSuccessSound } from '../utils/helpers';

interface HistoryViewProps {
  orders: OrderRecord[];
  onNavigateToKeys: () => void;
  onViewOrderDetails: (order: OrderRecord) => void;
  currentUser?: { id: string; username: string; role: string };
  users?: { id: string; username: string; displayName: string }[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  orders,
  onNavigateToKeys,
  onViewOrderDetails,
  currentUser,
  users = [],
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<string>('ALL');

  const filteredOrders = orders.filter((order) => {
    if (userFilter === 'MY' && currentUser) {
      return order.userId === currentUser.id || order.username === currentUser.username;
    }
    if (userFilter !== 'ALL') {
      return order.username === userFilter || order.userId === userFilter;
    }
    return true;
  });

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    playSuccessSound();
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>ประวัติการสั่งซื้อ License Key</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            รายการคำสั่งซื้อสินค้าและประวัติ License Key ที่คุณได้รับผ่านระบบ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#12152b] px-3 py-2 rounded-xl border border-[#232952]">
            <span className="text-xs text-slate-400 font-semibold">ผู้สั่งซื้อ:</span>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-indigo-300 focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-[#12152b] text-white">ทุกคน (All Users)</option>
              {currentUser && (
                <option value="MY" className="bg-[#12152b] text-amber-300">⭐ ออเดอร์ของฉัน ({currentUser.username})</option>
              )}
              {users.map((u) => (
                <option key={u.id} value={u.username} className="bg-[#12152b] text-slate-200">
                  👤 {u.username}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onNavigateToKeys}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>ไปหน้าจัดการ License Key</span>
          </button>
        </div>
      </div>

      {/* Orders Table matching Screenshot 5 */}
      <div className="bg-[#12152b] border border-[#202549] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e1022] text-slate-400 font-semibold uppercase tracking-wider border-b border-[#1c2246]">
              <tr>
                <th className="px-5 py-3.5">Order No.</th>
                <th className="px-5 py-3.5">ผู้สั่งซื้อ</th>
                <th className="px-5 py-3.5">สินค้าที่สั่งซื้อ</th>
                <th className="px-5 py-3.5 text-center">จำนวน</th>
                <th className="px-5 py-3.5">ยอดเงินรวม</th>
                <th className="px-5 py-3.5">License Key ที่ได้รับ</th>
                <th className="px-5 py-3.5 text-center">สถานะ</th>
                <th className="px-5 py-3.5">วันที่ทำรายการ</th>
                <th className="px-5 py-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1f40]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-500">
                    ยังไม่มีรายการสั่งซื้อตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const firstKey = order.keys[0];
                  const remainingCount = order.keys.length - 1;

                  return (
                    <tr key={order.id} className="hover:bg-[#161a35] transition-colors">
                      {/* Order No */}
                      <td className="px-5 py-4 font-mono font-bold text-indigo-400 whitespace-nowrap">
                        {order.orderNo}
                      </td>

                      {/* Purchaser */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-[11px] font-semibold text-indigo-300">
                          <span>👤</span>
                          <span>{order.username || 'PROJ3CTX'}</span>
                        </span>
                      </td>

                      {/* Product Name with Package icon */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400">📦</span>
                          <span className="font-bold text-white">{order.productName}</span>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-[#1c2246] text-slate-300 font-medium">
                          {order.quantity} ชิ้น
                        </span>
                      </td>

                      {/* Total Price */}
                      <td className="px-5 py-4 font-mono font-black text-emerald-400 text-sm whitespace-nowrap">
                        {formatThb(order.totalPriceThb)}
                      </td>

                      {/* Keys Column */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {firstKey && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#181d3c] border border-[#272f5e] font-mono text-[11px] text-amber-300 font-semibold">
                              <span>{firstKey}</span>
                              <button
                                onClick={() => handleCopyKey(firstKey)}
                                className="text-slate-400 hover:text-white"
                                title="คัดลอกคีย์"
                              >
                                {copiedKey === firstKey ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}

                          {remainingCount > 0 && (
                            <span
                              onClick={() => onViewOrderDetails(order)}
                              className="text-[10px] font-bold text-indigo-300 bg-indigo-950/70 border border-indigo-800/60 px-1.5 py-0.5 rounded cursor-pointer hover:bg-indigo-900/80"
                            >
                              + อีก {remainingCount} คีย์
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{order.status}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {order.createdAt}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onViewOrderDetails(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-950/50 hover:bg-indigo-900/70 border border-indigo-800/50 hover:text-white transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ดูรายละเอียด</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
