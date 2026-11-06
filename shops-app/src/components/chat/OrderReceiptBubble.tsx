"use client";

import React, { useMemo } from 'react';
import { ShoppingBag, MapPin, User, ShieldCheck, CheckCircle2, ChevronRight, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OrderItemParsed {
  index: number;
  title: string;
  quantity: number;
  price: string;
}

interface OrderReceiptBubbleProps {
  content: string;
  isMe: boolean;
  listingId?: number;
}

export const OrderReceiptBubble: React.FC<OrderReceiptBubbleProps> = ({ content, isMe, listingId }) => {
  const parsed = useMemo(() => {
    // Extract Order Number
    const orderMatch = content.match(/#(ORD-[\w-]+)/i) || content.match(/(ORD-[\w-]+)/i);
    const orderNumber = orderMatch ? orderMatch[1] : 'ORDER';

    // Extract Total
    const totalMatch = content.match(/(?:💰\s*)?Total:\s*(?:KSh|Ksh|KES)?\s*([\d,]+)/i);
    const total = totalMatch ? totalMatch[1] : '';

    // Extract Location
    const locMatch = content.match(/(?:📍\s*)?(?:Delivery\/Meetup\s+)?Location:\s*([^\n\r-]+?)(?:\s+Buyer:|\s+Note:|\s*---|\s*$)/i);
    const location = locMatch ? locMatch[1].trim() : '';

    // Extract Buyer
    const buyerMatch = content.match(/Buyer:\s*([^\n\r-]+?)(?:\s+Please|\s*---|\s*$)/i);
    const buyer = buyerMatch ? buyerMatch[1].trim() : '';

    // Extract Note
    const noteMatch = content.match(/(?:📝\s*)?Note:\s*([^\n\r-]+?)(?:\s+Buyer:|\s*---|\s*$)/i);
    const note = noteMatch ? noteMatch[1].trim() : '';

    // Extract Items
    // Matches patterns like "1. suitcase set (x1) — KSh 22,500" or "1. item (x2) - KSh 500"
    const items: OrderItemParsed[] = [];
    const itemRegex = /(\d+)\.\s*([^(—–\n\r]+?)(?:\s*\([xX]?(\d+)\))?\s*[—–-]+\s*(?:KSh|Ksh|KES)?\s*([\d,]+)/gi;
    let match;
    while ((match = itemRegex.exec(content)) !== null) {
      items.push({
        index: parseInt(match[1], 10),
        title: match[2].trim(),
        quantity: match[3] ? parseInt(match[3], 10) : 1,
        price: match[4].trim(),
      });
    }

    return {
      orderNumber,
      total,
      location,
      buyer,
      note,
      items,
    };
  }, [content]);

  return (
    <div className={`w-full max-w-md rounded-3xl overflow-hidden shadow-lg border transition-all ${
      isMe 
        ? 'bg-gradient-to-br from-sky-900 to-[#0284c7] border-sky-500/40 text-white' 
        : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-neutral-50'
    }`}>
      {/* Receipt Top Header */}
      <div className={`px-4 sm:px-5 py-3 border-b flex items-center justify-between ${
        isMe 
          ? 'bg-sky-950/40 border-sky-400/20' 
          : 'bg-slate-50 dark:bg-neutral-850 border-slate-100 dark:border-neutral-800'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
            isMe ? 'bg-sky-500 text-white' : 'bg-orange-500 text-white shadow-xs'
          }`}>
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black tracking-tight flex items-center gap-1.5">
              <span>Marketplace Order Inquiry</span>
            </h4>
            <p className={`text-[10px] font-bold ${isMe ? 'text-sky-200' : 'text-gray-400 dark:text-neutral-400'}`}>
              #{parsed.orderNumber}
            </p>
          </div>
        </div>

        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
          isMe 
            ? 'bg-sky-400/20 text-sky-200 border border-sky-400/30' 
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40'
        }`}>
          Direct Deal
        </span>
      </div>

      {/* Body: Items List */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Item Rows */}
        <div className="space-y-2">
          <p className={`text-[11px] font-bold uppercase tracking-wider ${isMe ? 'text-sky-200' : 'text-gray-400 dark:text-neutral-400'}`}>
            Requested Items ({parsed.items.length || 1})
          </p>

          <div className="space-y-2">
            {parsed.items.length > 0 ? (
              parsed.items.map((it, i) => (
                <div 
                  key={i} 
                  className={`p-2.5 rounded-2xl flex items-center justify-between gap-3 border ${
                    isMe 
                      ? 'bg-sky-950/30 border-sky-500/20' 
                      : 'bg-slate-50 dark:bg-neutral-950 border-slate-100 dark:border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isMe ? 'bg-sky-400/30 text-white' : 'bg-slate-200 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300'
                    }`}>
                      {it.quantity}x
                    </span>
                    <span className="text-xs font-bold truncate">
                      {it.title}
                    </span>
                  </div>

                  <span className="text-xs font-black shrink-0">
                    KSh {it.price}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs font-medium py-1">
                Order details listed below.
              </div>
            )}
          </div>
        </div>

        {/* Total Highlight */}
        {parsed.total && (
          <div className={`p-3 rounded-2xl flex items-center justify-between border ${
            isMe 
              ? 'bg-sky-400/10 border-sky-400/30 text-white' 
              : 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/30 text-emerald-900 dark:text-emerald-200'
          }`}>
            <span className="text-xs font-bold uppercase tracking-wider">Order Total</span>
            <span className={`text-base font-black ${isMe ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
              KSh {parsed.total}
            </span>
          </div>
        )}

        {/* Location & Details Info */}
        <div className={`space-y-1.5 text-xs pt-1 border-t ${
          isMe ? 'border-sky-400/20 text-sky-100' : 'border-slate-100 dark:border-neutral-800 text-gray-600 dark:text-neutral-300'
        }`}>
          {parsed.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="font-semibold truncate">Meetup / Delivery: <strong>{parsed.location}</strong></span>
            </div>
          )}
          {parsed.buyer && (
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="font-semibold truncate">Buyer: <strong>{parsed.buyer}</strong></span>
            </div>
          )}
          {parsed.note && (
            <div className="text-[11px] italic pt-1 text-amber-300 dark:text-amber-400">
              Note: "{parsed.note}"
            </div>
          )}
        </div>

        {/* Safety Note */}
        <div className={`p-2.5 rounded-xl flex items-start gap-2 text-[10px] leading-relaxed ${
          isMe 
            ? 'bg-sky-950/40 text-sky-200/90' 
            : 'bg-amber-50/80 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/30'
        }`}>
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
          <span>Agree on payment & delivery in chat. Always inspect products before making payment.</span>
        </div>

        {listingId && (
          <Link
            to={`/listing/${listingId}`}
            className={`w-full py-2 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
              isMe 
                ? 'bg-sky-500 hover:bg-sky-400 text-white' 
                : 'bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 text-gray-800 dark:text-neutral-100'
            }`}
          >
            <span>View Related Listing</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};

