import React, { useState, useRef } from 'react';
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
  ToggleRight,
  FileSearch,
  UploadCloud,
  CheckCircle2,
  Zap,
  RefreshCw
} from 'lucide-react';
import { BankAccountConfig, SystemPaymentConfig, ProductTier, TopUpTransaction } from '../types';
import { formatThb, playSuccessSound, playErrorSound, generateHex } from '../utils/helpers';
import { ImageUploadField } from './ImageUploadField';
import { analyzeSlipForensics, testBankSlipApi } from '../utils/paymentApi';

interface AdminBackofficeViewProps {
  bankAccounts: BankAccountConfig[];
  onUpdateBankAccounts: (accounts: BankAccountConfig[]) => void;
  paymentConfig: SystemPaymentConfig;
  onUpdatePaymentConfig: (config: SystemPaymentConfig) => void;
  products: ProductTier[];
  onUpdateProducts: (products: ProductTier[]) => void;
  onAddProduct?: (newProd: ProductTier) => void;
  onDeleteProduct?: (productId: string) => void;
  onRestockProduct?: (productId: string, addCount: number, customKeys?: string[]) => void;
  onShowToast: (msg: string) => void;
  totalUsersCount?: number;
  totalKeysCount?: number;
  totalRevenueThb?: number;
  recentTransactions?: TopUpTransaction[];
}

export const AdminBackofficeView: React.FC<AdminBackofficeViewProps> = ({
  bankAccounts,
  onUpdateBankAccounts,
  paymentConfig,
  onUpdatePaymentConfig,
  products,
  onUpdateProducts,
  onAddProduct,
  onDeleteProduct,
  onRestockProduct,
  onShowToast,
  totalUsersCount = 1,
  totalKeysCount = 0,
  totalRevenueThb = 0,
  recentTransactions = [],
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
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestStatus, setWebhookTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Bank Slip API Testing State
  const [isTestingBankApi, setIsTestingBankApi] = useState(false);
  const [bankApiTestResult, setBankApiTestResult] = useState<{ success: boolean; message: string; quota?: any } | null>(null);

  const handleTestBankApi = async () => {
    setIsTestingBankApi(true);
    setBankApiTestResult(null);
    try {
      const res = await testBankSlipApi(tempPaymentConfig);
      setBankApiTestResult(res);
      if (res.success) {
        playSuccessSound();
      } else {
        playErrorSound();
      }
    } catch (err: any) {
      setBankApiTestResult({ success: false, message: err.message || 'เกิดข้อผิดพลาดในการทดสอบ' });
      playErrorSound();
    } finally {
      setIsTestingBankApi(false);
    }
  };

  // Live Slip Inspection Sandbox States
  const [testSlipImage, setTestSlipImage] = useState<string>('');
  const [isAnalyzingSlip, setIsAnalyzingSlip] = useState(false);
  const [slipAnalysisResult, setSlipAnalysisResult] = useState<any>(null);
  const [slipAnalysisError, setSlipAnalysisError] = useState<string>('');
  const sandboxFileInputRef = useRef<HTMLInputElement>(null);

  const handleRunSlipAnalysis = async (imgData?: string) => {
    const targetImage = imgData || testSlipImage;
    if (!targetImage) {
      setSlipAnalysisError('กรุณาเลือกรูปภาพสลิปที่ต้องการทดสอบก่อน');
      return;
    }

    setIsAnalyzingSlip(true);
    setSlipAnalysisError('');
    setSlipAnalysisResult(null);

    try {
      const result = await analyzeSlipForensics(targetImage);
      if (result) {
        setSlipAnalysisResult(result);
        playSuccessSound();
      } else {
        setSlipAnalysisError('ไม่สามารถวิเคราะห์ข้อมูลจากรูปภาพสลิปนี้ได้ หรือรูปภาพไม่ชัดเจน');
        playErrorSound();
      }
    } catch (err: any) {
      setSlipAnalysisError('เกิดข้อผิดพลาดในการวิเคราะห์: ' + (err.message || String(err)));
      playErrorSound();
    } finally {
      setIsAnalyzingSlip(false);
    }
  };

  // Product Edit / Add / Restock States
  const [editingProduct, setEditingProduct] = useState<ProductTier | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [restockProductTarget, setRestockProductTarget] = useState<ProductTier | null>(null);
  const [restockCountInput, setRestockCountInput] = useState<number>(10);
  const [restockKeysText, setRestockKeysText] = useState<string>('');
  const [deleteProductConfirm, setDeleteProductConfirm] = useState<ProductTier | null>(null);

  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdDuration, setNewProdDuration] = useState('1 DAY PLAN');
  const [newProdCategory, setNewProdCategory] = useState<'1 Day' | '7 Days' | '15 Days' | '30 Days' | 'Special'>('1 Day');
  const [newProdPriceThb, setNewProdPriceThb] = useState('20');
  const [newProdPriceUsd, setNewProdPriceUsd] = useState('0.60');
  const [newProdStock, setNewProdStock] = useState('20');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdImageUrl, setNewProdImageUrl] = useState('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80');
  const [newProdBadge, setNewProdBadge] = useState('NEW');
  const [newProdFeaturesText, setNewProdFeaturesText] = useState('ใช้งานได้ทันที, อัปเดตตลอด 24 ชม., รองรับทุก Windows');

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
    setEditingProduct({ ...prod });
  };

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdCode.trim()) {
      alert('กรุณากรอกชื่อสินค้าและรหัสสินค้า');
      return;
    }

    const feats = newProdFeaturesText.split(/[\n,]/).map(f => f.trim()).filter(Boolean);
    const newProduct: ProductTier = {
      id: 'prod-' + Date.now(),
      name: newProdName.trim(),
      code: newProdCode.trim().toUpperCase(),
      duration: newProdDuration.trim(),
      durationCategory: newProdCategory,
      priceThb: parseFloat(newProdPriceThb) || 10,
      priceUsd: parseFloat(newProdPriceUsd) || 0.3,
      stock: parseInt(newProdStock, 10) || 0,
      description: newProdDescription.trim() || 'สินค้าพรีเมียมรองรับการใช้งาน 24 ชั่วโมง',
      badge: newProdBadge.trim() || 'NEW',
      imageUrl: newProdImageUrl.trim() || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
      features: feats.length > 0 ? feats : ['ระบบอัตโนมัติ', 'ใช้งานได้ทันที'],
    };

    if (onAddProduct) {
      onAddProduct(newProduct);
    } else {
      onUpdateProducts([...products, newProduct]);
    }

    setShowAddProductModal(false);
    setNewProdName('');
    setNewProdCode('');
    onShowToast(`เพิ่มสินค้าใหม่ ${newProduct.name} เรียบร้อยแล้ว`);
    playSuccessSound();
  };

  const handleExecuteRestock = () => {
    if (!restockProductTarget) return;

    let keysList: string[] = [];
    if (restockKeysText.trim()) {
      keysList = restockKeysText
        .split('\n')
        .map(k => k.trim())
        .filter(k => k.length > 0);
    }

    const addedAmount = keysList.length > 0 ? keysList.length : restockCountInput;

    if (onRestockProduct) {
      onRestockProduct(restockProductTarget.id, addedAmount, keysList.length > 0 ? keysList : undefined);
    } else {
      onUpdateProducts(
        products.map(p => p.id === restockProductTarget.id ? { ...p, stock: p.stock + addedAmount } : p)
      );
    }

    onShowToast(`เติมสต็อกสินค้า ${restockProductTarget.name} +${addedAmount} คีย์เรียบร้อย`);
    setRestockProductTarget(null);
    setRestockKeysText('');
    playSuccessSound();
  };

  const handleSaveEditingProduct = () => {
    if (!editingProduct) return;
    onUpdateProducts(
      products.map(p => p.id === editingProduct.id ? editingProduct : p)
    );
    setEditingProduct(null);
    onShowToast(`อัปเดตข้อมูลสินค้า ${editingProduct.name} สำเร็จ`);
    playSuccessSound();
  };

  const handleDeleteProduct = (prodId: string) => {
    if (onDeleteProduct) {
      onDeleteProduct(prodId);
    } else {
      onUpdateProducts(products.filter(p => p.id !== prodId));
    }
    setDeleteProductConfirm(null);
    onShowToast('ลบสินค้าออกจากระบบเรียบร้อย');
    playSuccessSound();
  };

  // --- Discord Webhook Test Handler ---
  const handleTestDiscordWebhook = async () => {
    if (!tempPaymentConfig.discordWebhookUrl?.trim()) {
      alert('กรุณากรอก Discord Webhook URL ก่อนกดทดสอบ');
      return;
    }

    setIsTestingWebhook(true);
    setWebhookTestStatus(null);

    try {
      const res = await fetch('/api/webhook/discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: tempPaymentConfig.discordWebhookUrl.trim(),
          event: 'SUMMARY_REPORT',
          stats: {
            totalUsersCount,
            totalKeysCount,
            totalRevenueThb,
            recentTransactions,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWebhookTestStatus({ success: true, message: 'ส่งรายงานสถิติสดไปยังห้อง Discord เรียบร้อยแล้ว! 🚀' });
        playSuccessSound();
        onShowToast('ส่งแจ้งเตือนเข้า Discord สำเร็จ!');
      } else {
        setWebhookTestStatus({ success: false, message: data.error || 'เกิดข้อผิดพลาดในการส่ง Webhook' });
        playErrorSound();
      }
    } catch (err: any) {
      setWebhookTestStatus({ success: false, message: err.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้' });
      playErrorSound();
    } finally {
      setIsTestingWebhook(false);
    }
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
            {/* Exclusive Policy Banner */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/50 to-emerald-950/30 border border-amber-500/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>🛡️ นโยบายความปลอดภัย: บังคับรับเฉพาะซอง TrueMoney Wallet</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">100% Anti-Fake</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    หน้าเว็บปิดรับสลิปโอนเงินธนาคารและพร้อมเพย์ เพื่อป้องกันปัญหาสลิปปลอม สลิปตัดต่อ และสลิปซ้ำทุกรูปแบบ
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pb-3 border-b border-[#1b203c]">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">ตั้งค่าระบบรับชำระเงิน & เบอร์ TrueMoney</h3>
                <p className="text-xs text-slate-400">
                  จัดการเบอร์รับเงิน TrueMoney Wallet, โหมด API และยอดฝากขั้นต่ำ
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
                    value={tempPaymentConfig.slipProvider || 'AI_FORENSIC'}
                    onChange={(e) =>
                      setTempPaymentConfig({
                        ...tempPaymentConfig,
                        slipProvider: e.target.value as any,
                      })
                    }
                    className="bg-[#141834] border border-[#2a3260] text-xs font-semibold text-teal-300 px-3 py-1.5 rounded-lg focus:outline-none focus:border-teal-500"
                  >
                    <option value="SLIPOK">🌐 SlipOK API (เช็คตรงกับฐานข้อมูลธนาคาร 100% - แนะนำ)</option>
                    <option value="EASYSLIP">⚡ EasySlip API Gateway (เช็คตรงกับธนาคาร)</option>
                    <option value="CUSTOM_API">🛠️ Custom Slip API (API อื่นๆ ที่ซื้อมา / Webhook)</option>
                    <option value="HYBRID">🛡️ Hybrid Shield (เช็คธนาคาร + AI สำรอง)</option>
                    <option value="AI_FORENSIC">🔍 AI Forensic Pro (วิเคราะห์ภาพตัดต่อและฟอนต์)</option>
                  </select>
                </div>

                {/* Info banner for purchased API */}
                <div className="p-2.5 rounded-lg bg-teal-950/40 border border-teal-800/50 text-[11px] text-teal-300 flex items-start gap-2">
                  <Zap className="w-4 h-4 shrink-0 text-teal-400 mt-0.5" />
                  <div>
                    <strong>การเชื่อมต่อ API เช็คสลิปที่ซื้อมา:</strong> นำ API Key ที่ท่านซื้อมา (เช่น SlipOK, EasySlip หรือ API อื่นๆ) ใส่ในช่องด้านล่าง แล้วกด <strong>"ทดสอบเชื่อมต่อ API"</strong> เพื่อยืนยันความพร้อม ระบบจะตรวจสอบยอดเงินและรายการโอนเงินตรงกับธนาคาร 100% ป้องกันสลิปปลอมได้ทุกรูปแบบ
                  </div>
                </div>

                {/* Additional controls for slip matching & age */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#1b203c] text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                      อายุสลิปสูงสุดที่ยอมรับ:
                    </label>
                    <select
                      value={tempPaymentConfig.maxSlipAgeDays ?? 30}
                      onChange={(e) =>
                        setTempPaymentConfig({
                          ...tempPaymentConfig,
                          maxSlipAgeDays: Number(e.target.value),
                        })
                      }
                      className="w-full bg-[#141834] border border-[#2a3260] text-xs font-semibold text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-teal-500"
                    >
                      <option value={1}>1 วัน (สลิปภายใน 24 ชม. เท่านั้น)</option>
                      <option value={3}>3 วัน</option>
                      <option value={7}>7 วัน (1 สัปดาห์)</option>
                      <option value={30}>30 วัน (แนะนำ - รองรับสลิปทั้งเดือน)</option>
                      <option value={0}>ไม่จำกัดอายุ (โหมดทดสอบ / Test Mode)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                      การตรวจสอบชื่อบัญชีผู้รับเงิน:
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setTempPaymentConfig({
                          ...tempPaymentConfig,
                          matchReceiverName: !tempPaymentConfig.matchReceiverName,
                        })
                      }
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between border cursor-pointer ${
                        tempPaymentConfig.matchReceiverName
                          ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                      }`}
                    >
                      <span>{tempPaymentConfig.matchReceiverName ? '🔒 เข้มงวด: ต้องตรงกับร้านค้า' : '🔓 ยืดหยุ่น: รับสลิปจริงทุกบัญชี'}</span>
                      <span className="text-[10px] opacity-80">(คลิกเพื่อเปลี่ยน)</span>
                    </button>
                  </div>
                </div>

                {/* SlipOK Fields */}
                {(tempPaymentConfig.slipProvider === 'SLIPOK' || tempPaymentConfig.slipProvider === 'HYBRID') && (
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

                {/* EasySlip Fields */}
                {tempPaymentConfig.slipProvider === 'EASYSLIP' && (
                  <div className="pt-2 border-t border-[#1b203c] text-xs">
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                      EasySlip API Key (Bearer Token):
                    </label>
                    <input
                      type="password"
                      value={tempPaymentConfig.easySlipApiKey || ''}
                      onChange={(e) =>
                        setTempPaymentConfig({ ...tempPaymentConfig, easySlipApiKey: e.target.value })
                      }
                      placeholder="ey..."
                      className="w-full px-3 py-1.5 rounded-lg bg-[#070914] border border-[#2b3363] text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                )}

                {/* Custom API Fields */}
                {tempPaymentConfig.slipProvider === 'CUSTOM_API' && (
                  <div className="space-y-3 pt-2 border-t border-[#1b203c] text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                        Custom Slip API Endpoint URL:
                      </label>
                      <input
                        type="text"
                        value={tempPaymentConfig.customSlipApiUrl || ''}
                        onChange={(e) =>
                          setTempPaymentConfig({ ...tempPaymentConfig, customSlipApiUrl: e.target.value })
                        }
                        placeholder="https://api.your-provider.com/v1/verify"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#070914] border border-[#2b3363] text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                          API Key / Secret Token:
                        </label>
                        <input
                          type="password"
                          value={tempPaymentConfig.customSlipApiKey || ''}
                          onChange={(e) =>
                            setTempPaymentConfig({ ...tempPaymentConfig, customSlipApiKey: e.target.value })
                          }
                          placeholder="your-api-secret-key"
                          className="w-full px-3 py-1.5 rounded-lg bg-[#070914] border border-[#2b3363] text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                          Header Name:
                        </label>
                        <input
                          type="text"
                          value={tempPaymentConfig.customSlipApiHeader || 'Authorization'}
                          onChange={(e) =>
                            setTempPaymentConfig({ ...tempPaymentConfig, customSlipApiHeader: e.target.value })
                          }
                          placeholder="Authorization หรือ x-api-key"
                          className="w-full px-3 py-1.5 rounded-lg bg-[#070914] border border-[#2b3363] text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Test Purchased Bank API Connection Button */}
                {(tempPaymentConfig.slipProvider === 'SLIPOK' || tempPaymentConfig.slipProvider === 'EASYSLIP' || tempPaymentConfig.slipProvider === 'CUSTOM_API') && (
                  <div className="pt-2 border-t border-[#1b203c] flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      disabled={isTestingBankApi}
                      onClick={handleTestBankApi}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-teal-500/20"
                    >
                      {isTestingBankApi ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>กำลังตรวจสอบการเชื่อมต่อ...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 fill-slate-950" />
                          <span>🧪 ทดสอบเชื่อมต่อ API ที่ซื้อมา (Test API)</span>
                        </>
                      )}
                    </button>

                    {bankApiTestResult && (
                      <div className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                        bankApiTestResult.success 
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/80' 
                          : 'bg-rose-950/80 text-rose-300 border border-rose-700/80'
                      }`}>
                        {bankApiTestResult.success ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span>{bankApiTestResult.message}</span>
                      </div>
                    )}
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

              {/* LIVE SLIP INSPECTION & DIAGNOSTIC SANDBOX */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#0c1228] to-[#0f1738] border border-[#233268] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                      <FileSearch className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">กล่องทดสอบบอทตรวจสลิป (Live AI Slip Audit Sandbox)</h4>
                      <p className="text-[10px] text-slate-400">
                        ลองอัปโหลดสลิปธนาคารเพื่อดูรายงานวิเคราะห์ภาพตัดต่อ ยอดเงิน รหัสอ้างอิง และข้อมูลเชิงลึกแบบ Realtime
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
                  <div className="md:col-span-4">
                    <input
                      ref={sandboxFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const res = ev.target?.result as string;
                            setTestSlipImage(res);
                            handleRunSlipAnalysis(res);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />

                    <div
                      onClick={() => sandboxFileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#2f3f78] hover:border-teal-400 rounded-xl p-3 text-center cursor-pointer bg-[#080c1d] hover:bg-[#0e1635] transition-all flex flex-col items-center justify-center min-h-[120px]"
                    >
                      {testSlipImage ? (
                        <div className="space-y-1">
                          <img
                            src={testSlipImage}
                            alt="Slip test"
                            className="max-h-24 mx-auto rounded border border-slate-700 object-contain"
                          />
                          <div className="text-[10px] text-teal-300">คลิกเพื่อเปลี่ยนรูปสลิป</div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <UploadCloud className="w-6 h-6 text-teal-400 mx-auto" />
                          <div className="text-xs font-bold text-slate-200">เลือกรูปสลิปเพื่อทดสอบ</div>
                          <div className="text-[9px] text-slate-400">รองรับรูปถ่ายสลิปทุกธนาคาร</div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isAnalyzingSlip || !testSlipImage}
                      onClick={() => handleRunSlipAnalysis()}
                      className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-teal-500/20"
                    >
                      {isAnalyzingSlip ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>กำลังวิเคราะห์สลิป...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 fill-slate-950" />
                          <span>สั่งวิเคราะห์สลิปด้วย AI</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="md:col-span-8 bg-[#070b1a] border border-[#1b2550] rounded-xl p-3 text-xs">
                    {isAnalyzingSlip && (
                      <div className="h-full flex flex-col items-center justify-center py-6 text-teal-300 space-y-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-teal-400" />
                        <div className="text-xs font-semibold">Gemini Vision กำลังตรวจสอบฟอนต์, รหัสอ้างอิง, และร่องรอยการตัดต่อ...</div>
                      </div>
                    )}

                    {slipAnalysisError && !isAnalyzingSlip && (
                      <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                          <span>ผลการตรวจสอบ:</span>
                        </div>
                        <div className="text-[11px]">{slipAnalysisError}</div>
                      </div>
                    )}

                    {slipAnalysisResult && !isAnalyzingSlip && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-[#1b2550]">
                          <div className="flex items-center gap-1.5 font-bold">
                            {slipAnalysisResult.isTamperedOrFake ? (
                              <span className="text-rose-400 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" /> ตรวจพบสลิปปลอม / ผิดปกติ
                              </span>
                            ) : (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> สลิปธนาคารแท้ 100% (Genuine)
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-teal-300 font-mono">
                            ความมั่นใจ: {slipAnalysisResult.confidenceScore ?? 95}%
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px]">ธนาคาร:</span>
                            <span className="text-white font-semibold">{slipAnalysisResult.sendingBank || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">ยอดเงินในสลิป:</span>
                            <span className="text-emerald-400 font-bold font-mono text-xs">฿{Number(slipAnalysisResult.amount || 0).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">ผู้โอน:</span>
                            <span className="text-slate-200">{slipAnalysisResult.senderName || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">ผู้รับเงิน:</span>
                            <span className="text-slate-200">{slipAnalysisResult.receiverName || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">วัน-เวลาที่โอน:</span>
                            <span className="text-slate-200">{slipAnalysisResult.transferDate} {slipAnalysisResult.transferTime}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Mini QR Code:</span>
                            <span className={slipAnalysisResult.hasMiniQr ? 'text-teal-400' : 'text-slate-400'}>
                              {slipAnalysisResult.hasMiniQr ? '✓ ตรวจพบ Mini QR' : 'ไม่พบ'}
                            </span>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-[#1b2550]">
                            <span className="text-slate-400 block text-[10px]">รหัสอ้างอิงธุรกรรม (transRef):</span>
                            <span className="font-mono text-teal-300 text-xs font-bold">{slipAnalysisResult.transRef || '-'}</span>
                          </div>
                          {slipAnalysisResult.tamperReason && (
                            <div className="col-span-2 p-2 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-[10px]">
                              เหตุผลที่ปฏิเสธ: {slipAnalysisResult.tamperReason}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {!testSlipImage && !isAnalyzingSlip && !slipAnalysisResult && !slipAnalysisError && (
                      <div className="h-full flex flex-col items-center justify-center py-6 text-slate-500 text-center">
                        <FileSearch className="w-8 h-8 opacity-40 mb-1" />
                        <div>ยังไม่ได้เลือกรูปภาพสลิป</div>
                        <div className="text-[10px] text-slate-600">อัปโหลดสลิปด้านซ้ายเพื่อทดสอบระบบบอท</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Discord Webhook Integration Section */}
              <div className="p-4 rounded-xl bg-[#0d0f22] border border-[#232958] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Discord Webhook แจ้งเตือนยอด & สถิติสด</h4>
                      <p className="text-[10px] text-slate-400">
                        แจ้งเตือนจำนวนสมาชิกสมัครใหม่, บอทจ่ายคีย์, ยอดเงินเข้า และประวัติเติมเงินไปยัง Discord
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isTestingWebhook || !tempPaymentConfig.discordWebhookUrl?.trim()}
                    onClick={handleTestDiscordWebhook}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{isTestingWebhook ? 'กำลังส่ง...' : '🚀 ทดสอบส่ง Discord'}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Discord Webhook URL:
                  </label>
                  <input
                    type="url"
                    value={tempPaymentConfig.discordWebhookUrl || ''}
                    onChange={(e) =>
                      setTempPaymentConfig({ ...tempPaymentConfig, discordWebhookUrl: e.target.value })
                    }
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#070814] border border-[#2b3363] text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">คัดลอกจาก Discord Channel Settings ➔ Integrations ➔ Webhooks</p>
                </div>

                {webhookTestStatus && (
                  <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    webhookTestStatus.success 
                      ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                  }`}>
                    <span>{webhookTestStatus.success ? '✔' : '✖'}</span>
                    <span>{webhookTestStatus.message}</span>
                  </div>
                )}

                {/* Event Checkboxes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-[#1c224a] text-xs">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPaymentConfig.discordNotifyNewUser ?? true}
                      onChange={(e) => setTempPaymentConfig({ ...tempPaymentConfig, discordNotifyNewUser: e.target.checked })}
                      className="rounded accent-indigo-500"
                    />
                    <span>แจ้งเตือนสมาชิกใหม่</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPaymentConfig.discordNotifyKeyDispense ?? true}
                      onChange={(e) => setTempPaymentConfig({ ...tempPaymentConfig, discordNotifyKeyDispense: e.target.checked })}
                      className="rounded accent-indigo-500"
                    />
                    <span>แจ้งเตือนเมื่อบอทจ่ายคีย์</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempPaymentConfig.discordNotifyTopup ?? true}
                      onChange={(e) => setTempPaymentConfig({ ...tempPaymentConfig, discordNotifyTopup: e.target.checked })}
                      className="rounded accent-indigo-500"
                    />
                    <span>แจ้งเตือนเมื่อมีเงินเข้า</span>
                  </label>
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
              <span>ภาพรวมสถิติระบบที่เชื่อมกับ Discord</span>
            </h4>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#0b0d1a] border border-[#1d2244] flex items-center justify-between text-xs">
                <span className="text-slate-400">👥 จำนวนสมาชิกทั้งหมด:</span>
                <span className="font-bold text-white font-mono text-sm">{totalUsersCount} คน</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0b0d1a] border border-[#1d2244] flex items-center justify-between text-xs">
                <span className="text-slate-400">🔑 คีย์ที่ออกไปแล้วทั้งหมด:</span>
                <span className="font-bold text-indigo-400 font-mono text-sm">{totalKeysCount} คีย์</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0b0d1a] border border-[#1d2244] flex items-center justify-between text-xs">
                <span className="text-slate-400">💰 จำนวนเงินที่ได้ทั้งหมด:</span>
                <span className="font-black text-emerald-400 font-mono text-sm">{formatThb(totalRevenueThb)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1d2244]">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                ประวัติการเติมเงินล่าสุด ({recentTransactions.length} รายการ)
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {recentTransactions.slice(0, 4).map((tx) => (
                  <div key={tx.id} className="p-2 rounded-lg bg-[#090b16] border border-[#181d3a] flex items-center justify-between text-[11px]">
                    <div>
                      <div className="font-bold text-white">{tx.username} • {tx.method === 'truemoney' ? 'TrueMoney' : 'PromptPay'}</div>
                      <div className="text-[9px] text-slate-500 font-mono">{tx.reference}</div>
                    </div>
                    <div className="font-bold text-emerald-400 font-mono">+{formatThb(tx.amountThb)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Products & Stock Management */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Top Actions & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111429] border border-[#1f254e] rounded-2xl p-5 shadow-xl">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>ระบบจัดการสินค้าและสต็อก License Keys</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                เพิ่มสินค้าใหม่, แก้ไขรูปภาพ/รายละเอียด, และเติมสต็อกแบบระบุจำนวนหรือวางคีย์ได้ทันที
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddProductModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มสินค้าใหม่ (Add Product)</span>
            </button>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((p) => {
              const stockHealth = p.stock > 10 ? 'high' : p.stock > 0 ? 'low' : 'empty';

              return (
                <div
                  key={p.id}
                  className="bg-[#12152b] border border-[#212750] rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-indigo-500/40 transition-all group"
                >
                  <div>
                    {/* Product Cover Image */}
                    <div className="h-36 w-full relative overflow-hidden bg-[#0a0c16]">
                      <img
                        src={p.imageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#12152b] via-transparent to-black/40"></div>

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-indigo-300">
                          {p.code}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/90 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                          {p.badge || 'HOT'}
                        </span>
                      </div>

                      {/* Stock badge overlay */}
                      <div className="absolute bottom-2.5 left-2.5">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-black border ${
                          stockHealth === 'high'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60'
                            : stockHealth === 'low'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                            : 'bg-rose-950/80 text-rose-400 border-rose-700/60'
                        }`}>
                          สต็อก: {p.stock} คีย์
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {p.duration}
                        </span>
                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {p.name}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>

                      <div className="flex items-baseline justify-between pt-2 border-t border-[#1c2246]">
                        <div>
                          <span className="text-[10px] text-slate-400">ราคาขาย: </span>
                          <span className="text-base font-black text-emerald-400 font-mono">
                            {formatThb(p.priceThb)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          (${p.priceUsd.toFixed(2)})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 pt-0 grid grid-cols-3 gap-1.5 border-t border-[#181d3c] mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRestockProductTarget(p);
                        setRestockCountInput(10);
                        setRestockKeysText('');
                      }}
                      className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm shadow-emerald-600/30"
                      title="เติมสต็อกสินค้า"
                    >
                      <Plus className="w-3 h-3" />
                      <span>เติมสต็อก</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEditProduct(p)}
                      className="py-1.5 px-2 rounded-lg bg-[#191e40] hover:bg-[#232a58] text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer border border-[#2b3464]"
                      title="แก้ไขข้อมูลสินค้า"
                    >
                      <Edit3 className="w-3 h-3 text-indigo-400" />
                      <span>แก้ไข</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteProductConfirm(p)}
                      className="py-1.5 px-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer border border-rose-800/40"
                      title="ลบสินค้านี้"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>ลบ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Add New Product */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12152b] border border-[#262f5e] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f254e]">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">เพิ่มสินค้าใหม่เข้าร้านค้า (Add Product)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ชื่อสินค้า:</label>
                  <input
                    type="text"
                    required
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="เช่น Phantom VIP (1 DAY)"
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">รหัสสินค้า (Product Code):</label>
                  <input
                    type="text"
                    required
                    value={newProdCode}
                    onChange={(e) => setNewProdCode(e.target.value)}
                    placeholder="เช่น PHTM-VIP-1D"
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] font-mono text-amber-400 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ระยะเวลาแพ็กเกจ:</label>
                  <input
                    type="text"
                    required
                    value={newProdDuration}
                    onChange={(e) => setNewProdDuration(e.target.value)}
                    placeholder="เช่น 1 DAY PLAN, 7 DAYS PLAN"
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">หมวดหมู่ระยะเวลา:</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-white focus:outline-none"
                  >
                    <option value="1 Day">1 Day</option>
                    <option value="7 Days">7 Days</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="Special">Special / อื่นๆ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ราคา (THB):</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={newProdPriceThb}
                    onChange={(e) => setNewProdPriceThb(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] font-mono text-emerald-400 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ราคา (USD):</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    required
                    value={newProdPriceUsd}
                    onChange={(e) => setNewProdPriceUsd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] font-mono text-slate-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">สต็อกเริ่มต้น:</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Image Uploader: Folder on PC / Gallery on Mobile (ไม่ใช้ลิงก์) */}
              <ImageUploadField
                value={newProdImageUrl}
                onChange={(img) => setNewProdImageUrl(img)}
                label="รูปภาพสินค้า (เปิดโฟลเดอร์ในคอม / แกลเลอรีในมือถือ):"
              />

              <div>
                <label className="block font-semibold text-slate-300 mb-1">ป้ายกำกับสินค้า (Badge):</label>
                <input
                  type="text"
                  value={newProdBadge}
                  onChange={(e) => setNewProdBadge(e.target.value)}
                  placeholder="เช่น HOT, VIP, POPULAR, NEW"
                  className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-xs text-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">รายละเอียดสินค้า:</label>
                <textarea
                  rows={2}
                  value={newProdDescription}
                  onChange={(e) => setNewProdDescription(e.target.value)}
                  placeholder="อธิบายจุดเด่น การซิงค์เซิร์ฟเวอร์ และการใช้งาน"
                  className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1f254e]">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  บันทึกและเพิ่มสินค้า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Restock Product */}
      {restockProductTarget && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12152b] border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f254e]">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">เติมสต็อกสินค้า (Restock)</h3>
              </div>
              <button
                type="button"
                onClick={() => setRestockProductTarget(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090b16] border border-[#1f254e] flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">สินค้า:</span>{' '}
                <strong className="text-white">{restockProductTarget.name}</strong>
              </div>
              <div>
                <span className="text-slate-400">สต็อกคงเหลือ:</span>{' '}
                <strong className="text-emerald-400 font-mono">{restockProductTarget.stock} คีย์</strong>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  จำนวนสต็อกที่ต้องการเพิ่ม (+คีย์):
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={restockCountInput}
                  onChange={(e) => setRestockCountInput(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] font-mono text-xl font-black text-emerald-400 focus:outline-none"
                />

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-slate-500">เพิ่มด่วน:</span>
                  {[10, 25, 50, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRestockCountInput(num)}
                      className="px-2 py-0.5 rounded bg-[#181d3d] hover:bg-[#252e60] text-emerald-300 font-mono text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  หรือวางรหัส License Keys ล็อตใหม่ (1 บรรทัดต่อ 1 คีย์):
                </label>
                <textarea
                  rows={4}
                  value={restockKeysText}
                  onChange={(e) => setRestockKeysText(e.target.value)}
                  placeholder="PHTM-XXXX-YYYY-ZZZZ&#10;PHTM-AAAA-BBBB-CCCC"
                  className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] font-mono text-xs text-indigo-300 focus:outline-none placeholder:text-slate-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  หากวางคีย์ ระบบจะนับจำนวนคีย์ที่วางและเพิ่มสต็อกให้โดยอัตโนมัติ
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1f254e]">
              <button
                type="button"
                onClick={() => setRestockProductTarget(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExecuteRestock}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                ยืนยันการเติมสต็อก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Product Details & Image */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12152b] border border-[#262f5e] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f254e]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">แก้ไขรายละเอียดสินค้า</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">ชื่อสินค้า:</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ราคา (THB):</label>
                  <input
                    type="number"
                    value={editingProduct.priceThb}
                    onChange={(e) => setEditingProduct({ ...editingProduct, priceThb: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] font-mono text-emerald-400 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">สต็อกคงเหลือ:</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Edit Image Uploader: Folder on PC / Gallery on Mobile (ไม่ใช้ลิงก์) */}
              <ImageUploadField
                value={editingProduct.imageUrl || ''}
                onChange={(img) => setEditingProduct({ ...editingProduct, imageUrl: img })}
                label="รูปภาพสินค้า (เปิดโฟลเดอร์ในคอม / แกลเลอรีในมือถือ):"
              />

              <div>
                <label className="block font-semibold text-slate-300 mb-1">รายละเอียดสินค้า:</label>
                <textarea
                  rows={3}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">ป้ายกำกับ (Badge):</label>
                <input
                  type="text"
                  value={editingProduct.badge || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1f254e]">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveEditingProduct}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Product Confirmation */}
      {deleteProductConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12152b] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#241e38]">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">ยืนยันการลบสินค้า</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteProductConfirm(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-200">
              คุณต้องการลบสินค้า <strong className="text-rose-400">{deleteProductConfirm.name}</strong> ออกจากร้านค้าใช่หรือไม่?
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1f254e]">
              <button
                type="button"
                onClick={() => setDeleteProductConfirm(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProduct(deleteProductConfirm.id)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
