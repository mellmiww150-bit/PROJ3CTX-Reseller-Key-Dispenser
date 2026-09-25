import React from 'react';
import { Zap, Layers, PackageCheck, AlertCircle, ShoppingCart } from 'lucide-react';
import { ProductTier, ResellerProfile } from '../types';
import { formatThb } from '../utils/helpers';

interface DispenserViewProps {
  products: ProductTier[];
  profile: ResellerProfile;
  onSelectProduct: (product: ProductTier) => void;
  onOpenQuickDispense: () => void;
}

export const DispenserView: React.FC<DispenserViewProps> = ({
  products,
  profile,
  onSelectProduct,
  onOpenQuickDispense,
}) => {
  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Hero Dispenser Banner */}
      <div className="bg-gradient-to-r from-[#12142a] via-[#171a39] to-[#12142b] border border-[#232952] rounded-2xl p-8 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-2xl mx-auto space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1b2046] border border-[#2a326c] text-[11px] font-semibold text-slate-300">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-indigo-300 font-mono">INSTANT STOCK DISPENSER</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 font-mono">PURE DATABASE CORE</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
            Dispense License Keys
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Select your plan duration (1, 7, 15, or 30 Days) to pull stocked keys directly from the local database. Automated real-time balance deduction with zero upstream API delay.
          </p>

          <div className="pt-2">
            <button
              onClick={onOpenQuickDispense}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 shadow-xl shadow-indigo-600/35 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Dispense Key Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stock & Tiers Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white tracking-tight">
            Supported License Tiers & Live Stock
          </h3>
        </div>
        <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Real-time Stock & Balance Updates</span>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {products.map((product) => {
          const isLowStock = product.stock <= 5;
          const canAfford = profile.balanceThb >= product.priceThb;

          return (
            <div
              key={product.id}
              className="bg-[#13162d] border border-[#21274d] hover:border-indigo-500/60 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-950/40 group relative overflow-hidden"
            >
              <div>
                {/* Duration Badge & Stock Pill */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#1d234d] text-indigo-300 font-mono">
                    {product.duration}
                  </span>

                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 font-mono ${
                      isLowStock
                        ? 'text-amber-400 bg-amber-950/60 border border-amber-800/40'
                        : 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/40'
                    }`}
                  >
                    <PackageCheck className="w-3 h-3" />
                    <span>{product.stock} In Stock</span>
                  </span>
                </div>

                {/* Product Name */}
                <h4 className="text-base font-bold text-white mt-4 group-hover:text-indigo-300 transition-colors leading-snug">
                  {product.name}
                </h4>

                {/* Price */}
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {formatThb(product.priceThb)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    (${product.priceUsd.toFixed(2)})
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-[#1d2242]">
                <button
                  onClick={() => onSelectProduct(product)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    canAfford
                      ? 'bg-[#1a2046] hover:bg-indigo-600 text-indigo-200 hover:text-white border border-[#2b356f] hover:border-indigo-500 shadow-sm group-hover:bg-indigo-600 group-hover:text-white'
                      : 'bg-[#1a2046] hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-800/50'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>
                    Select {product.durationCategory !== 'Special' ? product.durationCategory : product.duration.split(' ')[0]}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
