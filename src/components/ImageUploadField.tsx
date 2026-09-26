import React, { useRef, useState } from 'react';
import { Upload, FolderOpen, Image as ImageIcon, Trash2, RefreshCw, CheckCircle2, Sparkles } from 'lucide-react';
import { processImageFileToDataUrl } from '../utils/helpers';

interface ImageUploadFieldProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  className?: string;
  showPresets?: boolean;
}

export const PRESET_GAME_IMAGES = [
  { label: 'Cyberpunk Neon', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80' },
  { label: 'Motherboard Core', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80' },
  { label: 'Matrix Code', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80' },
  { label: 'Game Controller', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80' },
  { label: 'Red Cyber Grid', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80' },
];

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  value,
  onChange,
  label = 'รูปภาพสินค้า (เปิดโฟลเดอร์/แกลเลอรี):',
  className = '',
  showPresets = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelected = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP, GIF)');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const dataUrl = await processImageFileToDataUrl(file);
      onChange(dataUrl);
    } catch (err: any) {
      setErrorMessage('ไม่สามารถโหลดรูปภาพได้: ' + (err.message || 'โปรดลองใหม่อีกครั้ง'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`space-y-2 p-3.5 rounded-xl bg-[#090b16] border border-[#1f254e] ${className}`}>
      {/* Hidden Native File Input: triggers folder on PC & photo gallery on mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelected(e.target.files[0]);
          }
        }}
      />

      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <FolderOpen className="w-4 h-4 text-amber-400" />
          <span>{label}</span>
        </label>
        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded font-medium">
          📁 เปิดโฟลเดอร์ในคอม / แกลเลอรีในมือถือ
        </span>
      </div>

      {/* Main Image Display / Dropzone Area */}
      {value ? (
        <div className="relative rounded-xl border border-[#2b3363] overflow-hidden bg-[#05060d] group">
          <div className="flex flex-col sm:flex-row items-center gap-4 p-3">
            <div className="relative w-28 h-28 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0 shadow-md">
              <img
                src={value}
                alt="Product preview"
                className="w-full h-full object-cover"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left w-full">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>เลือกรูปภาพเรียบร้อยแล้ว</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                รูปนี้ถูกแปลงและปรับขนาดให้โหลดเร็วทันใจ พร้อมแสดงบนหน้าร้านค้าและหลังบ้าน
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#181d3d] hover:bg-[#222a57] text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>เปลี่ยนรูป (เปิดโฟลเดอร์/แกลเลอรี)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 flex items-center gap-1 transition-colors cursor-pointer"
                  title="ลบรูปภาพ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบรูป</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-amber-400 bg-amber-950/20'
              : 'border-[#29315c] hover:border-amber-400/80 bg-[#0d0f20] hover:bg-[#121630]'
          }`}
        >
          {isProcessing ? (
            <div className="py-4 space-y-2">
              <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
              <div className="text-xs text-amber-300 font-semibold">กำลังประมวลผลรูปภาพ...</div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto transition-transform hover:scale-110">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-white">
                คลิกเพื่อเปิดโฟลเดอร์ในคอม หรือแกลเลอรีในมือถือ
              </div>
              <div className="text-[11px] text-slate-400">
                (บนคอมจะเปิด Folder เลือกไฟล์ภาพ / บนมือถือจะเปิดคลังรูปภาพ Gallery ทันที)
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="text-[11px] text-rose-400 font-medium px-2 py-1 rounded bg-rose-950/40 border border-rose-800/40">
          {errorMessage}
        </div>
      )}

      {/* Quick Gaming Presets */}
      {showPresets && (
        <div className="pt-2 border-t border-[#181d3d] space-y-1.5">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>หรือคลิกเลือกรูปตัวอย่างแนวเกม / ไซเบอร์:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_GAME_IMAGES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChange(preset.url)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors cursor-pointer ${
                  value === preset.url
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                    : 'bg-[#141834] text-slate-400 border-[#222850] hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
