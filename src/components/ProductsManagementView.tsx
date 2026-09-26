import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Boxes, 
  Search, 
  Check, 
  X, 
  Save, 
  Image as ImageIcon, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Send,
  Sliders,
  DollarSign
} from 'lucide-react';
import { ProductTier, SystemPaymentConfig } from '../types';
import { formatThb, formatUsd, playSuccessSound, playErrorSound, generateHex } from '../utils/helpers';
import { sendDiscordNotification } from '../utils/discordNotifier';
import { ImageUploadField } from './ImageUploadField';

interface ProductsManagementViewProps {
  products: ProductTier[];
  paymentConfig: SystemPaymentConfig;
  onUpdateProducts: (products: ProductTier[]) => void;
  onShowToast: (msg: string) => void;
  onNavigateToShop: () => void;
}

const PRESET_IMAGES = [
  { label: 'Cyber Bot VIP', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80' },
  { label: 'Neon Circuit', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80' },
  { label: 'Elite Matrix', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80' },
  { label: 'Gaming Shield', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80' },
  { label: 'Dark AI Core', url: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cyberpunk Purple', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80' },
];

export const ProductsManagementView: React.FC<ProductsManagementViewProps> = ({
  products,
  paymentConfig,
  onUpdateProducts,
  onShowToast,
  onNavigateToShop,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [restockProduct, setRestockProduct] = useState<ProductTier | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductTier | null>(null);
  const [deleteProductConfirm, setDeleteProductConfirm] = useState<ProductTier | null>(null);

  // Add Product Form State
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDuration, setNewDuration] = useState('1 DAY PLAN');
  const [newCategory, setNewCategory] = useState<'1 Day' | '7 Days' | '15 Days' | '30 Days' | 'Special'>('1 Day');
  const [newPriceThb, setNewPriceThb] = useState('150');
  const [newPriceUsd, setNewPriceUsd] = useState('4.50');
  const [newStock, setNewStock] = useState('50');
  const [newDescription, setNewDescription] = useState('แพ็กเกจลิขสิทธิ์ความเร็วสูง ปลดล็อคระบบ 100% ซัพพอร์ต Windows 10/11');
  const [newBadge, setNewBadge] = useState('HOT');
  const [newImageUrl, setNewImageUrl] = useState(PRESET_IMAGES[0].url);
  const [newFeatureText, setNewFeatureText] = useState('บายพาส Anti-Cheat สมบูรณ์แบบ\nซัพพอร์ตระบบตลอด 24 ชั่วโมง\nปลดแบน HWID อัตโนมัติ');

  // Restock Form State
  const [restockAmount, setRestockAmount] = useState<number>(20);
  const [restockKeysRaw, setRestockKeysRaw] = useState<string>('');

  // Edit Product Form State
  const [editFeatureText, setEditFeatureText] = useState('');

  // Total Stock Stats
  const totalStockCount = products.reduce((acc, p) => acc + p.stock, 0);
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.duration.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || p.durationCategory === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) return;

    const features = newFeatureText
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const created: ProductTier = {
      id: 'prod-' + Date.now(),
      name: newName.trim(),
      code: newCode.trim().toUpperCase(),
      duration: newDuration.trim(),
      durationCategory: newCategory,
      priceThb: parseFloat(newPriceThb) || 100,
      priceUsd: parseFloat(newPriceUsd) || 3.0,
      stock: parseInt(newStock) || 0,
      description: newDescription.trim(),
      badge: newBadge.trim() || undefined,
      imageUrl: newImageUrl.trim() || PRESET_IMAGES[0].url,
      features: features.length > 0 ? features : undefined,
    };

    onUpdateProducts([...products, created]);
    setShowAddModal(false);

    // Reset Form
    setNewName('');
    setNewCode('');
    onShowToast(`เพิ่มสินค้าใหม่ "${created.name}" เข้าสู่ร้านค้าเรียบร้อยแล้ว`);
    playSuccessSound();

    // Trigger Discord
    sendDiscordNotification({
      event: 'SUMMARY_REPORT',
      data: {
        message: `📦 มีการเพิ่มสินค้าใหม่: **${created.name}** (รหัส: \`${created.code}\`, ราคา: ฿${created.priceThb}, สต็อก: ${created.stock} คีย์)`,
      },
      stats: {
        totalUsersCount: 1,
        totalKeysCount: totalStockCount + created.stock,
        totalRevenueThb: 0,
        recentTransactions: [],
      },
    }, paymentConfig).catch(() => {});
  };

  const handleExecuteRestock = () => {
    if (!restockProduct) return;

    let addedCount = restockAmount;
    if (restockKeysRaw.trim()) {
      const lines = restockKeysRaw
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      if (lines.length > 0) {
        addedCount = lines.length;
      }
    }

    const updated = products.map((p) =>
      p.id === restockProduct.id ? { ...p, stock: p.stock + addedCount } : p
    );
    onUpdateProducts(updated);
    onShowToast(`เติมสต็อก "${restockProduct.name}" +${addedCount} คีย์เรียบร้อยแล้ว!`);
    playSuccessSound();
    setRestockProduct(null);
    setRestockKeysRaw('');
  };

  const handleStartEdit = (prod: ProductTier) => {
    setEditingProduct({ ...prod });
    setEditFeatureText(prod.features ? prod.features.join('\n') : '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const features = editFeatureText
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const updatedProduct = {
      ...editingProduct,
      features: features.length > 0 ? features : undefined,
    };

    const updated = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
    onUpdateProducts(updated);
    onShowToast(`อัปเดตข้อมูลสินค้า "${updatedProduct.name}" สำเร็จ`);
    playSuccessSound();
    setEditingProduct(null);
  };

  const handleDelete = () => {
    if (!deleteProductConfirm) return;
    const prodName = deleteProductConfirm.name;
    const updated = products.filter((p) => p.id !== deleteProductConfirm.id);
    onUpdateProducts(updated);
    onShowToast(`ลบสินค้า "${prodName}" ออกจากระบบเรียบร้อย`);
    playSuccessSound();
    setDeleteProductConfirm(null);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>ระบบจัดการสต็อก & สินค้าในเว็บ (Stock Management)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-[10px] font-mono font-bold">
                  เชื่อมกับหน้าร้านค้า 100%
                </span>
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            เพิ่มสินค้าใหม่, แก้ไขรูปภาพ & รายละเอียดสินค้า, เติมสต็อกคีย์แบบรวดเร็ว และเชื่อมต่อการตัดสต็อกอัตโนมัติ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateToShop}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-[#161a35] hover:bg-[#202750] border border-[#2b3464] hover:text-white transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span>ไปที่หน้าร้านค้า (Shop View)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ เพิ่มสินค้าใหม่ (Add Product)</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#12152b] border border-[#20254c] shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400">สินค้าทั้งหมดในเว็บ</span>
            <div className="text-2xl font-black text-white font-mono mt-0.5">{products.length} รายการ</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12152b] border border-[#20254c] shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400">สต็อกรวมทุกสินค้า</span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{totalStockCount} คีย์</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12152b] border border-[#20254c] shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400">สินค้าสต็อกใกล้หมด (&le; 5)</span>
            <div className={`text-2xl font-black font-mono mt-0.5 ${lowStockCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {lowStockCount} รายการ
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12152b] border border-[#20254c] shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400">สินค้าหมดสต็อก (Out of Stock)</span>
            <div className={`text-2xl font-black font-mono mt-0.5 ${outOfStockCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {outOfStockCount} รายการ
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <X className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111429] border border-[#1f254e] rounded-2xl p-4 shadow-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า, รหัสสินค้า, ระยะเวลา..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          {['ALL', '1 Day', '7 Days', '15 Days', '30 Days', 'Special'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-[#161a35] text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'ALL' ? 'ทุกหมวดหมู่' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredProducts.map((p) => {
          const stockStatus = p.stock > 10 ? 'high' : p.stock > 0 ? 'low' : 'empty';

          return (
            <div
              key={p.id}
              className="bg-[#12152b] border border-[#222852] rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-amber-500/40 transition-all group"
            >
              <div>
                {/* Product Cover Image */}
                <div className="h-40 w-full relative overflow-hidden bg-[#090b16]">
                  <img
                    src={p.imageUrl || PRESET_IMAGES[0].url}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PRESET_IMAGES[0].url;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12152b] via-transparent to-black/50"></div>

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-indigo-300">
                      {p.code}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                      {p.badge || 'PROJ3CT'}
                    </span>
                  </div>

                  {/* Stock Pill Badge */}
                  <div className="absolute bottom-2.5 left-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-black border flex items-center gap-1 shadow-md ${
                        stockStatus === 'high'
                          ? 'bg-emerald-950/90 text-emerald-400 border-emerald-600/70'
                          : stockStatus === 'low'
                          ? 'bg-amber-950/90 text-amber-300 border-amber-600/70'
                          : 'bg-rose-950/90 text-rose-400 border-rose-600/70'
                      }`}
                    >
                      <Boxes className="w-3 h-3" />
                      <span>คงเหลือ {p.stock} คีย์</span>
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {p.duration} ({p.durationCategory})
                    </span>
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1 mt-0.5">
                      {p.name}
                    </h4>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>

                  {/* Features tags if any */}
                  {p.features && p.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.features.slice(0, 2).map((feat, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-[#171c3b] border border-[#252d60] text-[10px] text-slate-300"
                        >
                          ✔ {feat}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-baseline justify-between pt-2 border-t border-[#1c2246]">
                    <div>
                      <span className="text-[10px] text-slate-400">ราคาจำหน่าย: </span>
                      <span className="text-base font-black text-emerald-400 font-mono">
                        {formatThb(p.priceThb)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {formatUsd(p.priceUsd)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 grid grid-cols-3 gap-1.5 border-t border-[#181d3c] mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRestockProduct(p);
                    setRestockAmount(20);
                    setRestockKeysRaw('');
                  }}
                  className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm shadow-emerald-600/30"
                  title="เติมสต็อกคีย์"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                  <span>เติมสต็อก</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartEdit(p)}
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

      {/* Modal 1: Add New Product */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12152b] border border-[#262f5e] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f254e]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">เพิ่มสินค้าใหม่ (Add New Product)</h3>
                  <p className="text-[11px] text-slate-400">สินค้าจะแสดงบนหน้าเว็บและพร้อมให้สมาชิกเบิกคีย์ทันที</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ชื่อสินค้า (Product Name):</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="เช่น Phantom VIP Bot (1 DAY)"
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">รหัสสินค้า (Product Code):</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="เช่น PHTM-VIP-1D"
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] font-mono text-amber-400 focus:outline-none focus:border-amber-400 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ระยะเวลาแพ็กเกจ:</label>
                  <input
                    type="text"
                    required
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="เช่น 1 DAY PLAN, 30 DAYS"
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">หมวดหมู่ระยะเวลา:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-white focus:outline-none"
                  >
                    <option value="1 Day">1 Day</option>
                    <option value="7 Days">7 Days</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="Special">Special / อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ป้ายกำกับ (Badge):</label>
                  <input
                    type="text"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    placeholder="เช่น HOT, VIP, NEW"
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-amber-400 font-bold focus:outline-none"
                  />
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
                    value={newPriceThb}
                    onChange={(e) => setNewPriceThb(e.target.value)}
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
                    value={newPriceUsd}
                    onChange={(e) => setNewPriceUsd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] font-mono text-slate-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">สต็อกเริ่มต้น (คีย์):</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] font-mono text-cyan-300 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Image Uploader: Folder on PC / Gallery on Mobile (ไม่ใช้ลิงก์) */}
              <ImageUploadField
                value={newImageUrl}
                onChange={(img) => setNewImageUrl(img)}
                label="รูปภาพสินค้า (เปิดโฟลเดอร์ในคอม / แกลเลอรีในมือถือ):"
              />

              {/* Detailed Description & Features (รายละเอียดต่างๆ) */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  รายละเอียดสินค้า (Description):
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="คำอธิบายสินค้าและคุณสมบัติหลัก..."
                  className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  จุดเด่น / ฟีเจอร์ของสินค้า (บรรทัดละ 1 ข้อ):
                </label>
                <textarea
                  rows={3}
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  placeholder="บายพาส Anti-Cheat สมบูรณ์แบบ&#10;ซัพพอร์ตระบบตลอด 24 ชั่วโมง&#10;ปลดแบน HWID อัตโนมัติ"
                  className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-white font-mono text-[11px] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1f254e]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>บันทึกและเพิ่มสินค้า</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Restock Keys (เติมสต็อกสินค้า) */}
      {restockProduct && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12152b] border border-emerald-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f254e]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">เติมสต็อกสินค้า (Restock)</h3>
                  <p className="text-[11px] text-slate-400">{restockProduct.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestockProduct(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#090b16] border border-[#1f254e] flex items-center justify-between text-xs">
              <span className="text-slate-400">สต็อกคงเหลือปัจจุบัน:</span>
              <span className="font-mono text-base font-bold text-emerald-400">{restockProduct.stock} คีย์</span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                เลือกจำนวนเติมด่วน (+Keys):
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setRestockAmount(amt);
                      setRestockKeysRaw('');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      restockAmount === amt && !restockKeysRaw.trim()
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-[#151936] text-slate-300 hover:bg-[#1e234c]'
                    }`}
                  >
                    +{amt} คีย์
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                หรือวางรหัส License Keys จริง (บรรทัดละ 1 คีย์):
              </label>
              <textarea
                rows={4}
                value={restockKeysRaw}
                onChange={(e) => setRestockKeysRaw(e.target.value)}
                placeholder="PHTM-XXXX-XXXX-XXXX&#10;PHTM-YYYY-YYYY-YYYY"
                className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-xs font-mono text-indigo-300 focus:outline-none"
              />
              {restockKeysRaw.trim() && (
                <p className="text-[10px] text-emerald-400 font-medium">
                  ✔ ตรวจพบคีย์จำนวน {restockKeysRaw.split('\n').filter(k => k.trim()).length} คีย์ที่จะถูกเติมเข้าสต็อก
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1f254e]">
              <button
                type="button"
                onClick={() => setRestockProduct(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExecuteRestock}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>ยืนยันเติมสต็อกสินค้า</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Edit Product */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12152b] border border-indigo-500/40 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f254e]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">แก้ไขข้อมูลสินค้า (Edit Product)</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ชื่อสินค้า:</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">รหัสสินค้า:</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.code}
                    onChange={(e) => setEditingProduct({ ...editingProduct, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] font-mono text-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ระยะเวลาแพ็กเกจ:</label>
                  <input
                    type="text"
                    value={editingProduct.duration}
                    onChange={(e) => setEditingProduct({ ...editingProduct, duration: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ราคา (THB):</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={editingProduct.priceThb}
                    onChange={(e) => setEditingProduct({ ...editingProduct, priceThb: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] font-mono text-emerald-400 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">สต็อก (คีย์):</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] font-mono text-cyan-300 font-bold focus:outline-none"
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
                <label className="block font-semibold text-slate-300 mb-1">รายละเอียดสินค้า (Description):</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">จุดเด่น / ฟีเจอร์ (บรรทัดละ 1 ข้อ):</label>
                <textarea
                  rows={3}
                  value={editFeatureText}
                  onChange={(e) => setEditFeatureText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#090b16] border border-[#232a54] text-white font-mono text-[11px] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1f254e]">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกการแก้ไข</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Delete Product Confirmation */}
      {deleteProductConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12152b] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#241e38]">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">ยืนยันลบสินค้านี้</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteProductConfirm(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า <strong className="text-rose-400">{deleteProductConfirm.name}</strong> ออกจากระบบและหน้าร้านค้า?
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
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบสินค้า</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
