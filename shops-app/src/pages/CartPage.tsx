"use client";

import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Store, 
  ArrowLeft, 
  MessageSquare, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  Loader2,
  PackageOpen,
  CheckCheck
} from 'lucide-react';
import { useCart, CartItem } from '@/store/useCart';
import { useAuthStore } from '@/store/useAuth';
import { useLocationStore } from '@/store/useLocation';
import { useAuthModal } from '@/store/useAuthModal';
import { messageService } from '@/services/messageService';
import { orderActivityService } from '@/services/orderActivityService';
import { trackEvent } from '@/lib/analytics';
import { resolveMediaUrl } from '@/services/api';

interface SellerCartGroup {
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  items: CartItem[];
  subtotal: number;
}

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearSellerItems, clearCart, getTotalPrice, getTotalCount } = useCart();
  const { user, isAuthenticated } = useAuthStore();
  const { city } = useLocationStore();
  const openAuthModal = useAuthModal((s) => s.open);

  const [deliveryLocation, setDeliveryLocation] = useState(city || 'Nairobi, Kenya');
  const [buyerNotes, setBuyerNotes] = useState('');
  const [checkingOutSellerId, setCheckingOutSellerId] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);

  // Group cart items by seller
  const sellerGroups: SellerCartGroup[] = useMemo(() => {
    const map = new Map<string, SellerCartGroup>();

    items.forEach((item) => {
      const sellerId = String(
        item.seller_id || 
        item.owner_id || 
        item.owner?.id || 
        'marketplace_seller'
      );
      const sellerName = 
        item.shop_name || 
        item.seller_name || 
        item.owner?.business_name || 
        item.owner?.full_name || 
        (sellerId !== 'marketplace_seller' ? `Shop #${sellerId}` : 'Marketplace Shop');
      const sellerAvatar = item.owner?.avatar_url;
      const itemSubtotal = (item.price || 0) * (item.quantity || 1);

      if (!map.has(sellerId)) {
        map.set(sellerId, {
          sellerId,
          sellerName,
          sellerAvatar,
          items: [],
          subtotal: 0,
        });
      }

      const group = map.get(sellerId)!;
      group.items.push(item);
      group.subtotal += itemSubtotal;
      if (!group.sellerAvatar && sellerAvatar) group.sellerAvatar = sellerAvatar;
      if (group.sellerName.startsWith('Shop #') && sellerName && !sellerName.startsWith('Shop #')) {
        group.sellerName = sellerName;
      }
    });

    return Array.from(map.values());
  }, [items]);

  const totalCount = getTotalCount();
  const totalPrice = getTotalPrice();

  const handleCheckoutSeller = async (group: SellerCartGroup) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (!group.sellerId || group.sellerId === 'marketplace_seller') {
      alert('Seller account ID is unavailable for this item.');
      return;
    }

    setCheckingOutSellerId(group.sellerId);

    try {
      // Build order details message
      const itemsList = group.items
        .map((item, idx) => `${idx + 1}. ${item.title || item.title_en || 'Product'} (x${item.quantity || 1}) — KSh ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}`)
        .join('\n');

      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      const firstItemImage = group.items[0]?.image || '';
      const orderMessage = `🛍️ NEW ORDER INQUIRY #${orderNumber}
${firstItemImage ? `[PRODUCT_IMAGE]: ${firstItemImage}\n` : ''}
Hello ${group.sellerName},
I would like to purchase the following item(s) from your shop on Suqafuran:

${itemsList}

----------------------------------------
💰 Total: KSh ${group.subtotal.toLocaleString()}
📍 Delivery/Meetup Location: ${deliveryLocation}
${buyerNotes ? `📝 Note: ${buyerNotes}\n` : ''}Buyer: ${user?.full_name || 'Buyer'}
----------------------------------------

Please confirm availability so we can agree on delivery and payment. Thank you!`;

      // 1. Send order message to seller in-app chat
      await messageService.sendMessage({
        receiver_id: group.sellerId,
        content: orderMessage,
        listing_id: group.items[0]?.id ? String(group.items[0].id) : undefined,
      });

      // 2. Clear this seller's items from the cart
      clearSellerItems(group.sellerId);

      // 3. Record in order & deal activity pipeline
      try {
        await orderActivityService.recordInquiry({
          orderNumber,
          shopId: group.sellerId,
          shopName: group.sellerName,
          items: group.items.map(it => ({
            id: it.id,
            title: it.title || it.title_en || 'Product',
            quantity: it.quantity || 1,
            price: it.price || 0,
            image: it.image,
          })),
          totalAmount: group.subtotal,
          deliveryLocation,
          buyerNotes,
        });
      } catch (recErr) {
        console.error('Failed to record order inquiry:', recErr);
      }

      // 4. Track analytics event
      trackEvent('Cart Checkout to Chat', {
        seller_id: group.sellerId,
        seller_name: group.sellerName,
        items_count: group.items.length,
        subtotal: group.subtotal,
        order_number: orderNumber,
      });

      setCheckoutSuccess(group.sellerId);

      // 5. Direct user to the chat thread with this seller
      setTimeout(() => {
        navigate(`/messages?user=${group.sellerId}${group.items[0]?.id ? `&listing_id=${group.items[0].id}` : ''}`);
      }, 400);
    } catch (err: any) {
      console.error('Failed to send order to seller chat:', err);
      // Fallback navigation directly to chat so buyer isn't blocked
      navigate(`/messages?user=${group.sellerId}${group.items[0]?.id ? `&listing_id=${group.items[0].id}` : ''}`);
    } finally {
      setCheckingOutSellerId(null);
    }
  };

  // Checkout all sellers sequentially
  const handleCheckoutAll = async () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    if (sellerGroups.length === 0) return;
    if (sellerGroups.length === 1) {
      return handleCheckoutSeller(sellerGroups[0]);
    }

    setCheckingOutSellerId('all');
    try {
      for (const group of sellerGroups) {
        if (!group.sellerId || group.sellerId === 'marketplace_seller') continue;
        const itemsList = group.items
          .map((item, idx) => `${idx + 1}. ${item.title || item.title_en || 'Product'} (x${item.quantity || 1}) — KSh ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}`)
          .join('\n');

        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
        const orderMessage = `🛍️ NEW ORDER INQUIRY #${orderNumber}

Hello ${group.sellerName},
I would like to purchase the following item(s) from your shop on Suqafuran:

${itemsList}

----------------------------------------
💰 Total: KSh ${group.subtotal.toLocaleString()}
📍 Delivery/Meetup Location: ${deliveryLocation}
Buyer: ${user?.full_name || 'Buyer'}
----------------------------------------

Please confirm availability so we can arrange delivery and payment. Thank you!`;

        await messageService.sendMessage({
          receiver_id: group.sellerId,
          content: orderMessage,
          listing_id: group.items[0]?.id ? String(group.items[0].id) : undefined,
        });
      }

      clearCart();
      trackEvent('Cart Checkout All to Chat', {
        seller_count: sellerGroups.length,
        total_price: totalPrice,
      });

      // Direct to messages hub
      navigate('/messages');
    } catch (err) {
      console.error('Error during batch checkout:', err);
      navigate('/messages');
    } finally {
      setCheckingOutSellerId(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50/60 dark:bg-black py-6 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between pb-5 border-b border-gray-200/80 dark:border-neutral-800 gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-white dark:hover:bg-neutral-900 border border-transparent hover:border-gray-200 dark:hover:border-neutral-800 transition-colors shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-neutral-300" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
                <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-[#0078E8] shrink-0" />
                <span className="truncate">Shopping Cart</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 font-medium mt-0.5">
                {totalCount} {totalCount === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
          </div>

          {items.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your cart?')) {
                  clearCart();
                }
              }}
              className="text-xs font-bold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shrink-0 whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </button>
          )}
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="py-16 sm:py-24 text-center max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-[#0078E8] mb-6 shadow-sm">
              <PackageOpen className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
              Your cart is empty
            </h2>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mb-8 leading-relaxed">
              Looks like you haven't added any items to your cart yet. Explore verified sellers and thousands of local listings.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-[#0078E8] text-white font-bold text-sm hover:bg-[#0066cc] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              Start Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Cart Content Layout */
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Items grouped by seller */}
            <div className="lg:col-span-8 space-y-6">
              {sellerGroups.map((group) => (
                <div
                  key={group.sellerId}
                  className="bg-white dark:bg-neutral-950 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm overflow-hidden"
                >
                  {/* Seller Header */}
                  <div className="px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50/80 dark:bg-neutral-900/60 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center font-black text-xs shrink-0">
                        {group.sellerAvatar ? (
                          <img src={resolveMediaUrl(group.sellerAvatar)} alt="" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <Store className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate max-w-[130px] xs:max-w-[170px] sm:max-w-none">
                            {group.sellerName}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md shrink-0 whitespace-nowrap">
                            <ShieldCheck className="w-3 h-3 shrink-0" />
                            <span>Verified</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/shop/${group.sellerId}`}
                      className="text-xs font-bold text-[#0078E8] hover:underline shrink-0 whitespace-nowrap px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/30"
                    >
                      Visit Shop
                    </Link>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-gray-100 dark:divide-neutral-850 p-2 sm:p-4">
                    {group.items.map((item) => {
                      const itemImg = item.image || (item.images && item.images[0]) || '';
                      const displayImg = resolveMediaUrl(itemImg);

                      return (
                        <div key={item.id} className="p-3 sm:p-4 flex gap-3 sm:gap-4 items-center">
                          {/* Thumbnail */}
                          <Link
                            to={`/listing/${item.id}`}
                            className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 dark:bg-neutral-900 shrink-0 overflow-hidden border border-slate-200/70 dark:border-neutral-800 block"
                          >
                            {displayImg ? (
                              <img
                                src={displayImg}
                                alt={item.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Store className="w-6 h-6" />
                              </div>
                            )}
                          </Link>

                          {/* Info */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <Link
                              to={`/listing/${item.id}`}
                              className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white hover:text-[#0078E8] line-clamp-1 sm:line-clamp-2 transition-colors block"
                            >
                              {item.title || item.title_en || 'Product Listing'}
                            </Link>

                            <p className="text-xs sm:text-sm font-extrabold text-[#0078E8]">
                              KSh {(item.price || 0).toLocaleString()}
                            </p>

                            {/* Quantity & Remove Buttons */}
                            <div className="flex items-center gap-2 sm:gap-3 pt-1">
                              <div className="flex items-center border border-gray-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-900 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                                  className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-gray-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-800 active:scale-95 transition-all"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                </button>
                                <span className="w-7 sm:w-8 text-center text-xs font-bold text-gray-900 dark:text-white">
                                  {item.quantity || 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                                  className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-gray-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-800 active:scale-95 transition-all"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                                title="Remove item"
                                aria-label="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Line total */}
                          <div className="text-right shrink-0 pl-1">
                            <span className="text-[11px] sm:text-xs text-gray-400 block font-medium">Subtotal</span>
                            <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white whitespace-nowrap">
                              KSh {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Group Action: Direct Checkout To Seller Chat */}
                  <div className="px-5 py-3.5 bg-slate-50/50 dark:bg-neutral-900/40 border-t border-gray-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-gray-500 dark:text-neutral-400 text-center sm:text-left">
                      Shop subtotal: <span className="font-extrabold text-gray-900 dark:text-white text-sm">KSh {group.subtotal.toLocaleString()}</span>
                    </div>

                    <button
                      type="button"
                      disabled={checkingOutSellerId === group.sellerId}
                      onClick={() => handleCheckoutSeller(group)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20 active:scale-95 disabled:opacity-50 transition-all"
                    >
                      {checkingOutSellerId === group.sellerId ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Directing to Chat...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-3.5 h-3.5" />
                          Checkout & Chat with {group.sellerName.split(' ')[0]}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Order Summary & Instant Action */}
            <div className="lg:col-span-4 sticky top-24 space-y-5">
              <div className="bg-white dark:bg-neutral-950 rounded-3xl border border-gray-100 dark:border-neutral-800 p-5 sm:p-6 shadow-sm space-y-5">
                <h2 className="text-lg font-black text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-neutral-800">
                  Order Summary
                </h2>

                {/* Delivery Location Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-neutral-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0078E8]" />
                    Delivery / Meetup Location
                  </label>
                  <input
                    type="text"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    placeholder="e.g. Eastleigh, Nairobi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-xs font-semibold focus:outline-none focus:border-[#0078E8] text-gray-900 dark:text-white"
                  />
                </div>

                {/* Buyer Notes Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-neutral-400">
                    Order Notes (optional)
                  </label>
                  <input
                    type="text"
                    value={buyerNotes}
                    onChange={(e) => setBuyerNotes(e.target.value)}
                    placeholder="e.g. Need delivery this afternoon"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-xs font-semibold focus:outline-none focus:border-[#0078E8] text-gray-900 dark:text-white"
                  />
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2.5 pt-3 border-t border-gray-100 dark:border-neutral-800 text-xs">
                  <div className="flex justify-between text-gray-600 dark:text-neutral-400 font-medium">
                    <span>Items ({totalCount})</span>
                    <span className="font-bold text-gray-900 dark:text-white">KSh {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-neutral-400 font-medium">
                    <span>Sellers in Cart</span>
                    <span className="font-bold text-gray-900 dark:text-white">{sellerGroups.length} Shop(s)</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-neutral-400 font-medium">
                    <span>Delivery Fee</span>
                    <span className="font-bold text-emerald-600">Agree with seller in chat</span>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-3 border-t border-gray-100 dark:border-neutral-800 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Estimated Total</span>
                  <span className="text-xl font-black text-[#0078E8]">
                    KSh {totalPrice.toLocaleString()}
                  </span>
                </div>

                {/* Main Action Button */}
                <button
                  type="button"
                  disabled={checkingOutSellerId !== null}
                  onClick={handleCheckoutAll}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#0078E8] hover:bg-[#0066cc] text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {checkingOutSellerId ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Directing to Chat...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      {sellerGroups.length > 1
                        ? `Checkout & Chat with All ${sellerGroups.length} Shops`
                        : 'Checkout & Chat with Seller'}
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-gray-400 dark:text-neutral-400 leading-relaxed font-medium">
                  Direct peer-to-peer checkout. When you checkout, your items and location are immediately delivered to the seller's chat to confirm delivery and payment.
                </p>
              </div>

              {/* Safety banner */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>Safe Trading:</strong> Agree on payment and delivery with each seller directly in chat. Always inspect items before completing payment.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

