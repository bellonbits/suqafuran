import React from 'react';
import { X, Check, AlertCircle, ShoppingCart, MessageSquare, Scale, Star } from 'lucide-react';
import type { ComparisonData, ShopperProduct } from '@/services/aiShopperService';
import { optimizeCloudinaryUrl } from '@/services/api';

interface ProductComparisonTableProps {
  comparison: ComparisonData;
  onClose?: () => void;
  onAddToCart?: (product: ShopperProduct) => void;
  onDirectChat?: (product: ShopperProduct) => void;
  className?: string;
}

export const ProductComparisonTable: React.FC<ProductComparisonTableProps> = ({
  comparison,
  onClose,
  onAddToCart,
  onDirectChat,
  className = "",
}) => {
  const { products, dimensions, strengths, limitations, verdict, best_overall_id, best_budget_id } = comparison;

  if (!products || products.length === 0) return null;

  return (
    <div className={`relative bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 p-5 sm:p-6 shadow-2xl max-w-4xl mx-auto overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#00BFFF]/10 flex items-center justify-center text-[#00BFFF]">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Side-by-Side Product Comparison
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Evaluated across pricing, specifications, condition, and seller trust
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Comparison Grid */}
      <div className="mt-4 overflow-x-auto hide-scrollbar">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-neutral-800">
              <th className="py-3 px-3 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase w-1/4">
                Feature / Dimension
              </th>
              {products.map((p) => {
                const isBestOverall = p.id === best_overall_id;
                const isBestBudget = p.id === best_budget_id;
                return (
                  <th key={p.id} className="py-3 px-3 text-center align-top w-1/3">
                    <div className="relative aspect-square w-24 h-24 mx-auto rounded-xl bg-slate-50 dark:bg-neutral-800 p-1 mb-2 border border-slate-100 dark:border-neutral-800 flex items-center justify-center">
                      <img
                        src={optimizeCloudinaryUrl(p.image, { width: 200 }) || p.image || '/icon1.png'}
                        alt={p.title}
                        className="w-full h-full object-contain"
                      />
                      {isBestOverall && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#00BFFF] text-white text-[9px] font-black uppercase whitespace-nowrap shadow-xs">
                          Best Overall
                        </span>
                      )}
                      {isBestBudget && !isBestOverall && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase whitespace-nowrap shadow-xs">
                          Best Budget
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                      {p.title}
                    </div>
                    <div className="text-xs font-black text-[#00BFFF] mt-1">
                      KSh {p.price.toLocaleString()}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-neutral-800 text-xs">
            {/* Dimensions */}
            {dimensions.map((dim, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/40">
                <td className="py-3 px-3 font-semibold text-slate-600 dark:text-neutral-300">
                  {dim.dimension}
                </td>
                {products.map((p) => {
                  const val = dim.values[String(p.id)] || dim.values[p.title] || "—";
                  const isWinner = dim.winner_id === p.id;
                  return (
                    <td key={p.id} className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-md ${
                        isWinner
                          ? 'bg-[#00BFFF]/10 text-[#00BFFF] font-bold'
                          : 'text-slate-800 dark:text-neutral-200 font-medium'
                      }`}>
                        {val}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Strengths */}
            <tr>
              <td className="py-3 px-3 font-semibold text-slate-600 dark:text-neutral-300 align-top">
                Key Strengths
              </td>
              {products.map((p) => {
                const pStrengths = strengths[String(p.id)] || [];
                return (
                  <td key={p.id} className="py-3 px-3 align-top">
                    <ul className="space-y-1">
                      {pStrengths.map((str, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                );
              })}
            </tr>

            {/* Action Row */}
            <tr>
              <td className="py-4 px-3 font-semibold text-slate-600 dark:text-neutral-300">
                Direct Actions
              </td>
              {products.map((p) => (
                <td key={p.id} className="py-4 px-3 text-center">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5">
                    {onAddToCart && (
                      <button
                        type="button"
                        onClick={() => onAddToCart(p)}
                        className="w-full sm:w-auto px-2.5 py-1.5 rounded-lg bg-[#00BFFF] text-white text-[11px] font-bold hover:bg-[#02CCFE] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>Add Cart</span>
                      </button>
                    )}
                    {onDirectChat && (
                      <button
                        type="button"
                        onClick={() => onDirectChat(p)}
                        className="w-full sm:w-auto px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 text-[11px] font-bold hover:bg-slate-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat</span>
                      </button>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* AI Verdict Box */}
      {verdict && (
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-800 text-xs">
          <span className="font-bold text-[#00BFFF] block mb-1">Suqafuran AI Recommendation:</span>
          <p className="text-slate-700 dark:text-neutral-300 leading-relaxed font-normal">
            {verdict}
          </p>
        </div>
      )}
    </div>
  );
};

