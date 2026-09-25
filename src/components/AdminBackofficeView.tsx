import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ShieldCheck, 
  Save, 
  QrCode, 
  Smartphone, 
  AlertCircle, 
  Power, 
  Layers, 
  DollarSign, 
  Wallet,
  RotateCcw,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { BankAccountConfig, SystemPaymentConfig, ProductTier } from '../types';
import { formatThb, playSuccessSound } from '../utils/helpers';

interface AdminBackofficeViewProps {
  bankAccounts: BankAccountConfig[];
  onUpdateBankAccounts: (accounts: BankAccountConfig[]) => void;
  paymentConfig: SystemPaymentConfig;
  onUpdatePaymentConfig: (config: SystemPaymentConfig) => void;
  products: ProductTier[];
  onUpdateProducts: (products: ProductTier[]) => void;
  onShowToast: (msg: string) => void;
}

export const AdminBackofficeView: React.FC<AdminBackofficeViewProps> = ({
  bankAccounts,
  onUpdateBankAccounts,
  paymentConfig,
  onUpdatePaymentConfig,
  products,
  onUpdateProducts,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'banks' | 'payment_config' | 'products'>('banks');

  // Bank Edit / Add State
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [editBankForm, setEditBankForm] = useState<BankAccountConfig>({
    id: '',
    bankName: '',
    bankShortCode: 'KBANK',
    accountName: '',
    accountNumber: '',
    badgeColor: 'bg-emerald-600',
    isActive: true,
    type: 'บัญชีออมทรัพย์',
  });
  const [isAddingNewBank, setIsAddingNewBank] = useState(false);

  // System Payment Config State
  const [tempPaymentConfig, setTempPaymentConfig] = useState<SystemPaymentConfig>(paymentConfig);

  // Product Edit State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProductForm, setEditProductForm] = useState<ProductTier | null>(null);

  // --- Bank Account Handlers ---
  const handleStartEditBank = (bank: BankAccountConfig) => {
    setEditingBankId(bank.id);
    setEditBankForm({ ...bank });
    setIsAddingNewBank(false);
  };

  const handleSaveBank = () => {
    if (!editBankForm.accountNumber || !editBankForm.accountName) {
      alert('กรุณากรอกเลขที่บัญชีและชื่อบัญชีให้ครบถ้วน');
      return;
    }

    if (isAddingNewBank) {
      const newBank: BankAccountConfig = {
        ...editBankForm,
        id: 'bank-' + Date.now(),
      };
      onUpdateBankAccounts([...bankAccounts, newBank]);
      setIsAddingNewBank(false);
      onShowToast('เพิ่มบัญชีธนาคารใหม่เรียบร้อยแล้ว');
    } else {
      onUpdateBankAccounts(
        bankAccounts.map((b) => (b.id === editingBankId ? editBankForm : b))
      );
      setEditingBankId(null);
      onShowToast('อัปเดตข้อมูลบัญชีธนาคารสำเร็จ');
    }
    playSuccessSound();
  };

  const handleDeleteBank = (id: string) => {
    if (confirm('ยืนยันการลบบัญชีธนาคารนี้?')) {
      onUpdateBankAccounts(bankAccounts.filter((b) => b.id !== id));
      onShowToast('ลบบัญชีธนาคารเรียบร้อยแล้ว');
      playSuccessSound();
    }
  };

  const handleToggleBankActive = (id: string) => {
    onUpdateBankAccounts(
      bankAccounts.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
    );
    playSuccessSound();
  };

  // --- Payment Config Handlers ---
  const handleSavePaymentConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePaymentConfig(tempPaymentConfig);
    onShowToast('บันทึกการตั้งค่าระบบบอทและพร้อมเพย์เรียบร้อยแล้ว');
    playSuccessSound();
  };

  // --- Product Edit Handlers ---
  const handleStartEditProduct = (prod: ProductTier) => {
    setEditingProductId(prod.id);
    setEditProductForm({ ...prod });
  };

  const handleSaveProduct = () => {
    if (!editProductForm) return;
    onUpdateProducts(
      products.map((p) => (p.id === editingProductId ? editProductForm : p))
    );
    setEditingProductId(null);
    setEditProductForm(null);
    onShowToast(`อัปเดตราคาและสต็อก ${editProductForm.name} สำเร็จ`);
    playSuccessSound();
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/50 text-[11px] font-bold text-rose-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>PROJ3CTX BACKOFFICE & ADMIN MANAGEMENT</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>ระบบจัดการหลังบ้าน (Admin Panel)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            จัดการบัญชีธนาคารรับเงิน, เลขพร้อมเพย์, ระบบบอทเช็คสลิป/ซองวอเล็ท และราคาสินค้าสต็อก
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1f254e] pb-1">
        <button
          onClick={() => setActiveTab('banks')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'banks'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-[#141832]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. จัดการเลขบัญชีธนาคาร ({bankAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payment_config')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'payment_config'
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-[#141832]'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>2. ตั้งค่าบอทเช็คสลิป & ซอง TrueMoney</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-[#141832]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>3. ปรับราคา & สต็อกคีย์สินค้า ({products.length})</span>
        </button>
      </div>

      {/* Tab 1: Bank Accounts Management */}
      {activeTab === 'banks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>รายการบัญชีธนาคารที่แสดงในหน้าเติมเงินของลูกค้า</span>
            </h3>

            {!isAddingNewBank && !editingBankId && (
              <button
                onClick={() => {
                  setIsAddingNewBank(true);
                  setEditingBankId(null);
                  setEditBankForm({
                    id: '',
                    bankName: 'ธนาคารกสิกรไทย (Kasikornbank)',
                    bankShortCode: 'KBANK',
                    accountName: 'บจก. โปรเจกต์เอ็กซ์ (PROJ3CTX)',
                    accountNumber: '',
                    badgeColor: 'bg-emerald-600',
                    isActive: true,
                    type: 'บัญชีออมทรัพย์ สำหรับเติมเครดิต',
                  });
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มบัญชีธนาคารใหม่</span>
              </button>
            )}
          </div>

          {/* Add / Edit Bank Form Modal or Card */}
          {(isAddingNewBank || editingBankId) && (
            <div className="bg-[#12152a] border-2 border-indigo-500/80 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e2448]">
                <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  <span>{isAddingNewBank ? 'เพิ่มบัญชีธนาคารใหม่' : 'แก้ไขข้อมูลบัญชีธนาคาร'}</span>
                </h4>
                <button
                  onClick={() => {
                    setIsAddingNewBank(false);
                    setEditingBankId(null);
                  }}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {/* Bank Select */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">เลือกธนาคาร:</label>
                  <select
                    value={editBankForm.bankShortCode}
                    onChange={(e) => {
                      const code = e.target.value as BankAccountConfig['bankShortCode'];
                      let name = 'ธนาคารกสิกรไทย (Kasikornbank)';
                      let color = 'bg-emerald-600';
                      if (code === 'SCB') {
                        name = 'ธนาคารไทยพาณิชย์ (Siam Commercial Bank)';
                        color = 'bg-purple-600';
                      } else if (code === 'KTB') {
                        name = 'ธนาคารกรุงไทย (Krungthai Bank)';
                        color = 'bg-sky-500';
                      } else if (code === 'BBL') {
                        name = 'ธนาคารกรุงเทพ (Bangkok Bank)';
                        color = 'bg-blue-700';
                      } else if (code === 'GSB') {
                        name = 'ธนาคารออมสิน (Government Savings Bank)';
                        color = 'bg-pink-600';
                      } else if (code === 'TTB') {
                        name = 'ธนาคารทหารไทยธนชาต (ttb)';
                        color = 'bg-blue-600';
                      }
                      setEditBankForm({
                        ...editBankForm,
                        bankShortCode: code,
                        bankName: name,
                        badgeColor: color,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#0b0d1a] border border-[#232953] text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value="KBANK">กสิกรไทย (KBANK)</option>
                    <option value="SCB">ไทยพาณิชย์ (SCB)</option>
                    <option value="KTB">กรุงไทย (KTB)</option>
                    <option value="BBL">กรุงเทพ (BBL)</option>
                    <option value="GSB">ออมสิน (GSB)</option>
                    <option value="TTB">ทหารไทยธนชาต (TTB)</option>
                  </select>
                </div>

                {/* Account Number */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    เลขที่บัญชี (เช่น 098-1-84920-3) <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="text"
                    value={editBankForm.accountNumber}
                    onChange={(e) => setEditBankForm({ ...editBankForm, accountNumber: e.target.value })}
                    placeholder="xxx-x-xxxxx-x"
                    className="w-full px-3 py-2 rounded-xl bg-[#0b0d1a] border border-[#232953] font-mono text-emerald-400 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Account Name */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    ชื่อบัญชี (Account Name) <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="text"
                    value={editBankForm.accountName}
                    onChange={(e) => setEditBankForm({ ...editBankForm, accountName: e.target.value })}
                    placeholder="เช่น บจก. โปรเจกต์เอ็กซ์"
                    className="w-full px-3 py-2 rounded-xl bg-[#0b0d1a] border border-[#232953] text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Account Type / Description */}
                <div className="lg:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    ประเภทบัญชี / หมายเหตุที่แสดง:
                  </label>
                  <input
                    type="text"
                    value={editBankForm.type}
                    onChange={(e) => setEditBankForm({ ...editBankForm, type: e.target.value })}
                    placeholder="เช่น บัญชีออมทรัพย์ สำหรับเติมเครดิต PROJ3CTX"
                    className="w-full px-3 py-2 rounded-xl bg-[#0b0d1a] border border-[#232953] text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Active Switch */}
                <div className="flex items-center gap-3 pt-4">
                  <label className="font-semibold text-slate-300">สถานะเปิดรับเงิน:</label>
                  <button
                    type="button"
                    onClick={() => setEditBankForm({ ...editBankForm, isActive: !editBankForm.isActive })}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer ${
                      editBankForm.isActive
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {editBankForm.isActive ? 'เปิดใช้งาน (Active)' : 'ปิดชั่วคราว (Disabled)'}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#1e2448]">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewBank(false);
                    setEditingBankId(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveBank}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกข้อมูลบัญชี</span>
                </button>
              </div>
            </div>
          )}

          {/* Banks Grid List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bankAccounts.map((bank) => (
              <div
                key={bank.id}
                className={`bg-[#12152a] border rounded-2xl p-5 shadow-xl space-y-3 flex flex-col justify-between transition-all ${
                  bank.isActive ? 'border-[#202548]' : 'border-rose-900/40 opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl ${bank.badgeColor} flex items-center justify-center text-white font-black text-sm shadow-md`}
                      >
                        {bank.bankShortCode}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">{bank.bankName}</h4>
                        <div className="text-[10px] text-slate-400 mt-0.5">{bank.type}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleBankActive(bank.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                        bank.isActive
                          ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40'
                          : 'text-rose-400 bg-rose-950/60 border-rose-800/40'
                      }`}
                      title="คลิกเพื่อสลับเปิด/ปิด"
                    >
                      {bank.isActive ? 'ออนไลน์' : 'ปิดรับยอด'}
                    </button>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-[#0c0e1b] border border-[#1f254e]">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">เลขที่บัญชี</div>
                    <div className="text-lg font-black text-emerald-400 font-mono tracking-wider">
                      {bank.accountNumber}
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5 truncate font-medium">
                      ชื่อบัญชี: {bank.accountName}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1b203c] flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleStartEditBank(bank)}
                    className="p-1.5 rounded-lg bg-[#161a35] hover:bg-[#202750] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>แก้ไข</span>
                  </button>

                  <button
                    onClick={() => handleDeleteBank(bank.id)}
                    className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-950/60 text-rose-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: System Payment Config */}
      {activeTab === 'payment_config' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-[#12152a] border border-[#202548] rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-[#1b203c]">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">ตั้งค่า PromptPay & บอทอัตโนมัติ</h3>
                <p className="text-xs text-slate-400">
                  ปรับเปลี่ยนเบอร์พร้อมเพย์รับเงิน, ชื่อบัญชีแสดงบน QR และระบบป้องกันการสลิปซ้ำ
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePaymentConfig} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    เบอร์พร้อมเพย์ / เลขประจำตัวผู้เสียภาษี (PromptPay ID):
                  </label>
                  <input
                    type="text"
                    value={tempPaymentConfig.promptPayId}
                    onChange={(e) =>
                      setTempPaymentConfig({ ...tempPaymentConfig, promptPayId: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0d1a] border border-[#242b52] font-mono text-sm text-teal-400 font-bold focus:outline-none focus:border-teal-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">ใช้สร้าง Dynamic QR บนหน้าเว็บ</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ชื่อบัญชีพร้อมเพย์ (Account Display Name):
                  </label>
                  <input
                    type="text"
                    value={tempPaymentConfig.promptPayName}
                    onChange={(e) =>
                      setTempPaymentConfig({ ...tempPaymentConfig, promptPayName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0d1a] border border-[#242b52] text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">แสดงใต้รูป QR Code ให้ลูกค้าตรวจสอบ</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    เบอร์ TrueMoney รับเงินบอท:
                  </label>
                  <input
                    type="text"
                    value={tempPaymentConfig.truemoneyMobile}
                    onChange={(e) =>
                      setTempPaymentConfig({ ...tempPaymentConfig, truemoneyMobile: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0d1a] border border-[#242b52] font-mono text-xs text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">เบอร์สำหรับเคลมซองของขวัญอัตโนมัติ</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ยอดเงินฝากขั้นต่ำ (THB):
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={tempPaymentConfig.minDepositThb}
                    onChange={(e) =>
                      setTempPaymentConfig({
                        ...tempPaymentConfig,
                        minDepositThb: Number(e.target.value) || 20,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0d1a] border border-[#242b52] font-mono text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* TrueMoney Voucher Engine Settings */}
              <div className="p-4 rounded-xl bg-[#0d0f1e] border border-[#1f254e] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-amber-400" />
                    <span>โหมดระบบรับซอง TrueMoney:</span>
                  </label>
                  <select
                    value={tempPaymentConfig.truemoneyMode || 'SMART_AUTO'}
                    onChange={(e) =>
                      setTempPaymentConfig({
                        ...tempPaymentConfig,
                        truemoneyMode: e.target.value as any,
                      })
                    }
                    className="bg-[#141834] border border-[#2a3260] text-xs font-semibold text-amber-300 px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500"
                  >
                    <option value="SMART_AUTO">⚡ ระบบอัตโนมัติ (Live API + Smart Engine ป้องกัน Cloudflare 100%)</option>
                    <option value="LIVE_DIRECT">🌐 Direct TrueMoney API เท่านั้น</option>
                    <option value="RELAY_PROXY">🔄 TrueMoney Relay Proxy (ผ่านเซิร์ฟเวอร์สำรอง)</option>
                  </select>
                </div>

                {tempPaymentConfig.truemoneyMode === 'RELAY_PROXY' && (
                  <div className="pt-2 border-t border-[#1b203c] text-xs">
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                      TrueMoney Relay Proxy URL:
                    </label>
                    <input
                      type="text"
                      value={tempPaymentConfig.truemoneyProxyUrl || ''}
                      onChange={(e) =>
                        setTempPaymentConfig({ ...tempPaymentConfig, truemoneyProxyUrl: e.target.value })
                      }
                      placeholder="https://your-proxy-domain.com/redeem"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#070914] border border-[#2b3363] text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Slip Verification Gateway Provider Selection */}
              <div className="p-4 rounded-xl bg-[#0d0f1e] border border-[#1f254e] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    <span>เกตเวย์บอทเช็คสลิป (Slip Verification Provider):</span>
                  </label>
                  <select
                    value={tempPaymentConfig.slipProvider || 'AUTO_QR'}
                    onChange={(e) =>
                      setTempPaymentConfig({
                        ...tempPaymentConfig,
                        slipProvider: e.target.value as any,
                      })
                    }
                    className="bg-[#141834] border border-[#2a3260] text-xs font-semibold text-teal-300 px-3 py-1.5 rounded-lg focus:outline-none focus:border-teal-500"
                  >
                    <option value="AUTO_QR">🤖 บอทถอดรหัส Mini QR อัตโนมัติ (Built-in QR Engine)</option>
                    <option value="SLIPOK">🌐 SlipOK API (เช็คสลิปออนไลน์ ธนาคารไทย)</option>
                    <option value="OPENSLIPVERIFY">⚡ OpenSlipVerify Gateway</option>
                  </select>
                </div>

                {tempPaymentConfig.slipProvider === 'SLIPOK' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#1b203c] text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        SlipOK Branch ID:
                      </label>
                      <input
                        type="text"
                        value={tempPaymentConfig.slipOkBranchId || ''}
                        onChange={(e) =>
                          setTempPaymentConfig({ ...tempPaymentConfig, slipOkBranchId: e.target.value })
                        }
                        placeholder="เช่น 1234"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#070914] border border-[#2b3363] text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        SlipOK API Key (x-authorization):
                      </label>
                      <input
                        type="password"
                        value={tempPaymentConfig.slipOkApiKey || ''}
                        onChange={(e) =>
                          setTempPaymentConfig({ ...tempPaymentConfig, slipOkApiKey: e.target.value })
                        }
                        placeholder="slp_live_..."
                        className="w-full px-3 py-1.5 rounded-lg bg-[#070914] border border-[#2b3363] text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-[#1b203c] space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0d1a]">
                  <div>
                    <div className="text-xs font-bold text-white">ระบบบอทตรวจเช็คสลิปอัตโนมัติ (Slip Bot)</div>
                    <div className="text-[10px] text-slate-400">ตรวจสอบ QR Code และยอดเงินในสลิป 24 ชม.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setTempPaymentConfig({
                        ...tempPaymentConfig,
                        slipBotEnabled: !tempPaymentConfig.slipBotEnabled,
                      })
                    }
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      tempPaymentConfig.slipBotEnabled
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {tempPaymentConfig.slipBotEnabled ? 'ON เปิดใช้งาน' : 'OFF ปิดการทำงาน'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0d1a]">
                  <div>
                    <div className="text-xs font-bold text-white">ระบบบอทรับซอง TrueMoney (Angpao Bot)</div>
                    <div className="text-[10px] text-slate-400">เคลมซองของขวัญและเติมเครดิตทันที</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setTempPaymentConfig({
                        ...tempPaymentConfig,
                        truemoneyBotEnabled: !tempPaymentConfig.truemoneyBotEnabled,
                      })
                    }
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      tempPaymentConfig.truemoneyBotEnabled
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {tempPaymentConfig.truemoneyBotEnabled ? 'ON เปิดใช้งาน' : 'OFF ปิดการทำงาน'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b0d1a]">
                  <div>
                    <div className="text-xs font-bold text-white">ระบบป้องกันการใช้สลิปซ้ำ (Anti-Duplicate Check)</div>
                    <div className="text-[10px] text-slate-400">บล็อกสลิปที่มีรหัสอ้างอิงซ้ำในระบบทันที</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setTempPaymentConfig({
                        ...tempPaymentConfig,
                        antiDuplicateSlip: !tempPaymentConfig.antiDuplicateSlip,
                      })
                    }
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      tempPaymentConfig.antiDuplicateSlip
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {tempPaymentConfig.antiDuplicateSlip ? 'ON ป้องกัน 100%' : 'OFF ปิดการป้องกัน'}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 shadow-md shadow-teal-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกการตั้งค่าบอททั้งหมด</span>
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-4 bg-[#12152a] border border-[#202548] rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ความปลอดภัยระบบบอทรับเงิน</span>
            </h4>

            <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✔</span>
                <span>เมื่อบันทึกข้อมูลแล้ว หน้าเติมเงินของผู้ใช้จะอัปเดตเป็นเลขบัญชีใหม่ทันที</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✔</span>
                <span>PromptPay QR จะสร้างโค้ดที่มีข้อมูลบัญชีล่าสุดโดยอัตโนมัติ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✔</span>
                <span>บอทเช็คสลิปจะตรวจสอบชื่อผู้รับให้ตรงกับชื่อบัญชีที่ระบุไว้</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 3: Products & Stock Management */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>จัดการราคาสินค้าและสต็อก License Keys</span>
              </h3>
              <p className="text-xs text-slate-400">
                แก้ไขราคาต่อคีย์ หรือเพิ่ม/ลดจำนวนสต็อกที่มีให้ตัวแทนเบิก
              </p>
            </div>
          </div>

          <div className="bg-[#12152b] border border-[#202549] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e1022] text-slate-400 font-semibold uppercase tracking-wider border-b border-[#1c2246]">
                  <tr>
                    <th className="px-4 py-3">ชื่อสินค้า / แพ็กเกจ</th>
                    <th className="px-4 py-3">รหัสสินค้า</th>
                    <th className="px-4 py-3">ระยะเวลา</th>
                    <th className="px-4 py-3">ราคา (THB)</th>
                    <th className="px-4 py-3">ราคา (USD)</th>
                    <th className="px-4 py-3 text-center">สต็อกคงเหลือ</th>
                    <th className="px-4 py-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b2042]">
                  {products.map((p) => {
                    const isEditing = editingProductId === p.id && editProductForm;

                    return (
                      <tr key={p.id} className="hover:bg-[#161a35] transition-colors">
                        <td className="px-4 py-3 font-bold text-white">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editProductForm.name}
                              onChange={(e) =>
                                setEditProductForm({ ...editProductForm, name: e.target.value })
                              }
                              className="px-2 py-1 rounded bg-[#0b0d1a] border border-[#232953] text-white text-xs w-full"
                            />
                          ) : (
                            p.name
                          )}
                        </td>

                        <td className="px-4 py-3 font-mono text-indigo-300">{p.code}</td>

                        <td className="px-4 py-3 text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-[#1c224a] text-indigo-300 font-mono text-[11px]">
                            {p.duration}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editProductForm.priceThb}
                              onChange={(e) =>
                                setEditProductForm({
                                  ...editProductForm,
                                  priceThb: Number(e.target.value) || 0,
                                })
                              }
                              className="w-20 px-2 py-1 rounded bg-[#0b0d1a] border border-[#232953] text-emerald-400 font-mono font-bold text-xs"
                            />
                          ) : (
                            formatThb(p.priceThb)
                          )}
                        </td>

                        <td className="px-4 py-3 font-mono text-slate-400">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.05"
                              value={editProductForm.priceUsd}
                              onChange={(e) =>
                                setEditProductForm({
                                  ...editProductForm,
                                  priceUsd: Number(e.target.value) || 0,
                                })
                              }
                              className="w-16 px-2 py-1 rounded bg-[#0b0d1a] border border-[#232953] text-slate-300 font-mono text-xs"
                            />
                          ) : (
                            `$${p.priceUsd.toFixed(2)}`
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editProductForm.stock}
                              onChange={(e) =>
                                setEditProductForm({
                                  ...editProductForm,
                                  stock: Number(e.target.value) || 0,
                                })
                              }
                              className="w-16 text-center px-2 py-1 rounded bg-[#0b0d1a] border border-[#232953] text-white font-mono text-xs"
                            />
                          ) : (
                            <span className="font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 font-bold">
                              {p.stock} คีย์
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={handleSaveProduct}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500"
                              >
                                บันทึก
                              </button>
                              <button
                                onClick={() => {
                                  setEditingProductId(null);
                                  setEditProductForm(null);
                                }}
                                className="px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEditProduct(p)}
                              className="px-2.5 py-1 rounded-lg bg-[#181d3c] hover:bg-[#202750] text-slate-300 hover:text-white text-xs font-semibold"
                            >
                              แก้ไขราคา/สต็อก
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
