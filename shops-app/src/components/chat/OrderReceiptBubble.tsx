"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, MapPin, User, ShieldCheck, ChevronRight, CheckCheck, Package, ExternalLink, Sparkles, MessageSquare } from 'lucide-react';
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
  const [fetchedPrice, setFetchedPrice] = useState<string | null>(null);

  const parsed = useMemo(() => {
    // 1. Extract embedded product image tag [PRODUCT_IMAGE]: url or [IMAGE]: url
    const imgMatch = content.match(/\[PRODUCT_IMAGE\]:\s*([^\n\r]+)/i) || content.match(/\[IMAGE\]:\s*([^\n\r]+)/i);
    const rawImage = imgMatch ? imgMatch[1].trim() : '';

    // 2. Clean content to remove system tags and accidental duplicate URLs for display
    const cleanContent = content
      .replace(/\[PRODUCT_IMAGE\]:\s*[^\n\r]+/gi, '')
      .replace(/\[IMAGE\]:\s*[^\n\r]+/gi, '')
      .replace(/https?:\/\/[^\s]+suqafuran\.com\/listing\/\d+/gi, '')
      .replace(/View details here/gi, '')
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

    // 10. Extract friendly message body (fully preserved)
    let displayMessage = '';
    const cleanWithoutHeaders = cleanContent
      .replace(/🛍️\s*(?:NEW ORDER INQUIRY|INQUIRY)[^\n\r]*/gi, '')
      .replace(/----------------------------------------[\s\S]*?----------------------------------------/gi, '')
      .trim();

    if (cleanWithoutHeaders) {
      displayMessage = cleanWithoutHeaders;
    } else if (items.length > 0) {
      displayMessage = `I would like to purchase the following item${items.length > 1 ? 's' : ''} from your shop:`;
    } else {
      displayMessage = inquiryTitle
        ? `Hi! 👋 I just came across your listing for "${inquiryTitle}" — is it still available? I'd love to know a bit more.`
        : `Hi! I'm interested in this product — is it still available?`;
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

  // Load listing image, title, and price in background if not already embedded
  useEffect(() => {
    if (parsed.productImage && parsed.inquiryTitle && (parsed.total || fetchedPrice)) return;
    if (!listingId) return;

    listingsService.getListing(listingId)
      .then((l) => {
        if (!parsed.productImage && l?.images?.[0]) setFetchedImage(l.images[0]);
        if (!parsed.inquiryTitle && l?.title) setFetchedTitle(l.title);
        if (!parsed.total && l?.price) setFetchedPrice(Number(l.price).toLocaleString());
      })
      .catch(() => {});
  }, [listingId, parsed.productImage, parsed.inquiryTitle, parsed.total, fetchedPrice]);

  const activeImage = parsed.productImage || fetchedImage;
  const primaryTitle = parsed.inquiryTitle || fetchedTitle || (parsed.items.length > 0 ? parsed.items[0].title : 'Featured Product');
  const displayTotal = parsed.total || fetchedPrice;

  return (
    <div className="w-full max-w-[420px] sm:max-w-[460px] bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.07)] text-slate-900 dark:text-neutral-50 transition-all select-text space-y-3.5">
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-0.5">
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

      {/* Clean Product Card without tacky gradient halo */}
      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50/90 dark:bg-neutral-800/60 border border-slate-200/80 dark:border-neutral-700/70">
        {listingId ? (
          <Link
            to={`/listing/${listingId}`}
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-700 shrink-0 shadow-xs flex items-center justify-center hover:opacity-90 transition-opacity"
            title="View listing"
          >
            {activeImage ? (
              <img
                src={optimizeCloudinaryUrl(activeImage, { width: 180 }) || activeImage}
                alt={primaryTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
            )}
          </Link>
        ) : (
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-700 shrink-0 shadow-xs flex items-center justify-center">
            {activeImage ? (
              <img
                src={optimizeCloudinaryUrl(activeImage, { width: 180 }) || activeImage}
                alt={primaryTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
            Product
          </p>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug mt-0.5">
            {primaryTitle}
          </h4>
          <div className="flex items-center justify-between gap-2 mt-1">
            {displayTotal ? (
              <p className="text-xs font-black text-[#0078E8] dark:text-sky-400">
                KSh {displayTotal}
              </p>
            ) : <span />}
            {listingId && (
              <Link
                to={`/listing/${listingId}`}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0078E8] dark:text-sky-400 hover:text-[#005fb8] hover:underline"
              >
                <span>View Product</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Prominent, Creative & Fully Visible Message Bubble */}
      <div className="bg-slate-50/80 dark:bg-neutral-800/50 rounded-2xl p-3 sm:p-3.5 border border-slate-100 dark:border-neutral-800 space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-neutral-400">
          <MessageSquare className="w-3.5 h-3.5 text-[#0078E8]" />
          <span>Message:</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-800 dark:text-neutral-100 font-normal leading-relaxed break-words">
          {parsed.displayMessage}
        </p>

        {/* Multi-item breakdown if Cart inquiry */}
        {parsed.items.length > 0 && (
          <div className="space-y-1.5 pt-2 mt-2 border-t border-slate-200/60 dark:border-neutral-700/60">
            {parsed.items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-neutral-200">
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

        {/* Delivery / Meetup Location if present */}
        {parsed.location && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-neutral-300 pt-1 border-t border-slate-200/60 dark:border-neutral-700/60">
            <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span>Meetup / Delivery: <strong className="text-slate-900 dark:text-white">{parsed.location}</strong></span>
          </div>
        )}

        {/* Buyer Note if present */}
        {parsed.note && (
          <p className="text-[11px] italic text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-2.5 py-1.5 border border-amber-200/50 dark:border-amber-900/40">
            Note: "{parsed.note}"
          </p>
        )}
      </div>

      {/* Secondary Bottom Info & Safety Footer */}
      <div className="flex items-center justify-between pt-0.5 px-1 text-[10px] text-gray-500 dark:text-neutral-400">
        <span className="flex items-center gap-1 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Inspect products before payment
        </span>
        <span className="font-semibold text-gray-400 dark:text-neutral-500">Suqafuran Deals</span>
      </div>
    </div>
  );
};
