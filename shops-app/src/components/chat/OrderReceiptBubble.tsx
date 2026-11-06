"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, MapPin, User, ShieldCheck, ChevronRight, CheckCheck, Package, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listingsService } from '@/services/listings';
import { optimizeCloudinaryUrl } from '@/services/api';

interface OrderItemParsed {
  index: number;
  title: string;
  quantity: number;
  price: string;
}

interface OrderReceiptBubbleProps {
  content: string;
  isMe: boolean;
  listingId?: number | string;
}

export const OrderReceiptBubble: React.FC<OrderReceiptBubbleProps> = ({ content, isMe, listingId }) => {
  const [fetchedImage, setFetchedImage] = useState<string | null>(null);
  const [fetchedTitle, setFetchedTitle] = useState<string | null>(null);

  const parsed = useMemo(() => {
    // 1. Extract embedded product image tag [PRODUCT_IMAGE]: url or [IMAGE]: url
    const imgMatch = content.match(/\[PRODUCT_IMAGE\]:\s*([^\n\r]+)/i) || content.match(/\[IMAGE\]:\s*([^\n\r]+)/i);
    const rawImage = imgMatch ? imgMatch[1].trim() : '';

    // 2. Clean content to remove system tags for display
    const cleanContent = content
      .replace(/\[PRODUCT_IMAGE\]:\s*[^\n\r]+/gi, '')
      .replace(/\[IMAGE\]:\s*[^\n\r]+/gi, '')
      .trim();

    // 3. Extract Order Number
    const orderMatch = cleanContent.match(/#(ORD-[\w-]+)/i) || cleanContent.match(/(ORD-[\w-]+)/i);
    const orderNumber = orderMatch ? orderMatch[1] : '';

    // 4. Extract Total
    const totalMatch = cleanContent.match(/(?:💰\s*)?Total:\s*(?:KSh|Ksh|KES)?\s*([\d,]+)/i);
    const total = totalMatch ? totalMatch[1] : '';

    // 5. Extract Location
    const locMatch = cleanContent.match(/(?:📍\s*)?(?:Delivery\/Meetup\s+)?Location:\s*([^\n\r-]+?)(?:\s+Buyer:|\s+Note:|\s*---|\s*$)/i);
    const location = locMatch ? locMatch[1].trim() : '';

    // 6. Extract Buyer
    const buyerMatch = cleanContent.match(/Buyer:\s*([^\n\r-]+?)(?:\s+Please|\s*---|\s*$)/i);
    const buyer = buyerMatch ? buyerMatch[1].trim() : '';

    // 7. Extract Note
    const noteMatch = cleanContent.match(/(?:📝\s*)?Note:\s*([^\n\r-]+?)(?:\s+Buyer:|\s*---|\s*$)/i);
    const note = noteMatch ? noteMatch[1].trim() : '';

    // 8. Extract Listing Inquiry Title if present
    const inquiryTitleMatch = cleanContent.match(/🛍️\s*INQUIRY:\s*([^\n\r]+)/i) || cleanContent.match(/listing for "([^"]+)"/i);
    const inquiryTitle = inquiryTitleMatch ? inquiryTitleMatch[1].trim() : '';

    // 9. Extract Items list (Cart multi-item inquiry)
    const items: OrderItemParsed[] = [];
    const itemRegex = /(\d+)\.\s*([^(—–\n\r]+?)(?:\s*\([xX]?(\d+)\))?\s*[—–-]+\s*(?:KSh|Ksh|KES)?\s*([\d,]+)/gi;
    let match;
    while ((match = itemRegex.exec(cleanContent)) !== null) {
      items.push({
        index: parseInt(match[1], 10),
        title: match[2].trim(),
        quantity: match[3] ? parseInt(match[3], 10) : 1,
        price: match[4].trim(),
      });
    }

    // 10. Extract friendly message body
    let displayMessage = '';
    if (items.length > 0) {
      displayMessage = `I would like to purchase the following item${items.length > 1 ? 's' : ''} from your shop:`;
    } else if (cleanContent.includes('Hi! 👋') || cleanContent.includes('available?')) {
      displayMessage = `Hi! I just came across your listing — is this item still available?`;
    } else {
      displayMessage = cleanContent
        .replace(/🛍️\s*(?:NEW ORDER INQUIRY|INQUIRY)[^\n\r]*/gi, '')
        .replace(/----------------------------------------[\s\S]*?----------------------------------------/gi, '')
        .trim();
    }

    return {
      productImage: rawImage,
      orderNumber,
      total,
      location,
      buyer,
      note,
      inquiryTitle,
      items,
      displayMessage,
    };
  }, [content]);

  // Load listing image and title in background if not already embedded
  useEffect(() => {
    if (parsed.productImage) return;
    if (!listingId) return;

    listingsService.getListing(listingId)
      .then((l) => {
        if (l?.images?.[0]) setFetchedImage(l.images[0]);
        if (l?.title) setFetchedTitle(l.title);
      })
      .catch(() => {});
  }, [listingId, parsed.productImage]);

  const activeImage = parsed.productImage || fetchedImage;
  const primaryTitle = parsed.inquiryTitle || fetchedTitle || (parsed.items.length > 0 ? parsed.items[0].title : 'Featured Product');

  return (
    <div className="w-full max-w-[420px] sm:max-w-[460px] bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.07)] text-slate-900 dark:text-neutral-50 transition-all select-text space-y-3">
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
            isMe 
              ? 'bg-sky-50 dark:bg-sky-950/40 text-[#0078E8] dark:text-sky-300 border border-sky-100 dark:border-sky-800/40' 
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/40'
          }`}>
            {isMe ? (
              <>
                <CheckCheck className="w-3 h-3 text-[#0078E8]" />
                Sent Inquiry
              </>
            ) : (
              <>
                <Package className="w-3 h-3 text-emerald-600" />
                Order Inquiry
              </>
            )}
          </span>

          {parsed.orderNumber && (
            <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-neutral-400">
              #{parsed.orderNumber}
            </span>
          )}
        </div>

        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400">
          Direct Deal
        </span>
      </div>

      {/* Main Content Area: Halo Image on Left + Inner Rounded Message Box on Right */}
      <div className="flex items-start gap-3 sm:gap-3.5">
        {/* Glowing Halo Product Image (Matches Screenshot Design) */}
        <div className="shrink-0 relative group">
          <div className="p-[3px] rounded-2xl bg-gradient-to-tr from-sky-400 via-indigo-400 to-pink-400 shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-transform duration-200 group-hover:scale-105">
            <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-[13px] overflow-hidden bg-white dark:bg-neutral-950 flex items-center justify-center">
              {activeImage ? (
                <img
                  src={optimizeCloudinaryUrl(activeImage, { width: 140 }) || activeImage}
                  alt={primaryTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inner Message Box (Matches the soft gray rounded container from reference image) */}
        <div className="flex-1 min-w-0 bg-slate-50 dark:bg-neutral-800/60 rounded-2xl p-3 sm:p-3.5 border border-slate-100/90 dark:border-neutral-800 space-y-2">
          <div>
            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-snug">
              Hi, I'm interested in:
            </p>
            <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate mt-0.5">
              {primaryTitle}
            </p>
          </div>

          {/* If multi-item order inquiry */}
          {parsed.items.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-neutral-700/60">
              {parsed.items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-neutral-200">
                  <span className="truncate pr-2">
                    <span className="font-extrabold text-[#0078E8]">{it.quantity}x</span> {it.title}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white shrink-0">
                    KSh {it.price}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Buyer Note if present */}
          {parsed.note && (
            <p className="text-[11px] italic text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-2.5 py-1">
              Note: "{parsed.note}"
            </p>
          )}
        </div>
      </div>

      {/* Secondary Bottom Box (Matches "You can contact me here" in reference screenshot) */}
      <div className="bg-slate-50/90 dark:bg-neutral-800/60 rounded-2xl p-3 sm:p-3.5 border border-slate-100/90 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          {parsed.total ? (
            <div className="text-xs font-bold text-slate-700 dark:text-neutral-300">
              Total: <span className="text-sm font-black text-[#0078E8] dark:text-sky-400">KSh {parsed.total}</span>
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-700 dark:text-neutral-300">
              Direct Peer-to-Peer Inquiry
            </div>
          )}

          {parsed.location && (
            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-neutral-400 truncate">
              <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
              <span>Meetup: <strong>{parsed.location}</strong></span>
            </div>
          )}
        </div>

        {listingId ? (
          <Link
            to={`/listing/${listingId}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white hover:text-[#0078E8] dark:hover:text-sky-400 transition-colors shrink-0"
          >
            <span>View details <strong className="underline underline-offset-2">here</strong></span>
            <ExternalLink className="w-3.5 h-3.5 ml-0.5 text-[#0078E8]" />
          </Link>
        ) : (
          <span className="text-xs font-bold text-slate-800 dark:text-neutral-200">
            Confirm deal in chat
          </span>
        )}
      </div>

      {/* Micro Safety Footer */}
      <div className="flex items-center justify-between px-1 text-[9px] text-gray-400 dark:text-neutral-500">
        <span className="flex items-center gap-1 font-medium">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          Inspect products before payment
        </span>
        <span className="font-semibold">Suqafuran Deals</span>
      </div>
    </div>
  );
};
