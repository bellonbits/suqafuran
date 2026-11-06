"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/store/useCart';
import { useLocationStore } from '@/store/useLocation';
import { useAuthStore } from '@/store/useAuth';
import api from '@/services/api';
import { 
  ChevronLeft, 
  MapPin, 
  Download, 
  Send, 
  Phone, 
  CheckCircle, 
  AlertCircle, 
  Map as MapIcon, 
  Package, 
  User, 
  Store,
  MessageSquare,
  CheckCheck,
  Loader2,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

import { FaWhatsapp } from 'react-icons/fa';
import { messageService } from '@/services/messageService';
import { checkoutReceiptService } from '@/services/checkoutReceipt';
import { trackEvent } from '@/lib/analytics';

interface CheckoutItem {
  id: string;
  title: string;
  title_en?: string;
  price: number;
  images?: string[];
  quantity?: number;
  owner_id?: string | number;
  seller_id?: string | number;
  owner?: {
    id?: string | number;
    full_name: string;
    phone: string;
    email?: string;
    avatar_url?: string;
    business_name?: string;
  };
}

interface SellerOrderGroup {
  sellerId: string;
  name: string;
  phone: string;
  avatar?: string;
  items: CheckoutItem[];
  subtotal: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items: cartItems, getTotalPrice, clearCart } = useCart();
  const { city } = useLocationStore();
  const { user, isAuthenticated } = useAuthStore();

  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [receiptGenerated, setReceiptGenerated] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerName, setBuyerName] = useState(user?.full_name || '');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Map of owner_id -> { phone, full_name } fetched from backend
  const [sellerInfoMap, setSellerInfoMap] = useState<Record<string, { phone: string; full_name: string; avatar?: string }>>({});
  // Map of owner_id -> backend checkout receipt id
  const [receiptsBySellerId, setReceiptsBySellerId] = useState<Record<string, number>>({});
  
  // Track chat distribution status per seller
  const [sellerChatStatus, setSellerChatStatus] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({});
  const [distributingAll, setDistributingAll] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);

  // Fetch seller info for cart items
  useEffect(() => {
    const ownerIds = [...new Set(
      cartItems
        .map((item: any) => String(item.owner_id || item.seller_id || item.owner?.id || ''))
        .filter(Boolean)
    )];
    if (ownerIds.length === 0) return;

    ownerIds.forEach(async (ownerId) => {
      try {
        const profileRes = await api.get(`/sellers/${ownerId}`);
        const phone = profileRes?.data?.phone || '';
        const full_name = profileRes?.data?.business_name || profileRes?.data?.full_name || `Seller #${ownerId}`;
        const avatar = profileRes?.data?.avatar_url || profileRes?.data?.logo_url;
        setSellerInfoMap(prev => ({ ...prev, [ownerId]: { phone, full_name, avatar } }));
      } catch {
        // seller endpoint fallback
      }
    });
  }, [cartItems]);

  // Get buyer's current location
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: city || `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
          });
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setCurrentLocation({
            lat: -1.2921,
            lng: 36.8219,
            address: city || 'Nairobi, Kenya',
          });
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    }
  }, [city]);

  // Group items by seller
  const sellerGroups: SellerOrderGroup[] = useMemo(() => {
    const map = new Map<string, SellerOrderGroup>();
    (cartItems as any[]).forEach((item) => {
      const ownerId = String(item.owner_id || item.seller_id || item.owner?.id || 'seller');
      const infoFromMap = ownerId !== 'seller' ? sellerInfoMap[ownerId] : null;
      const phone = item.owner?.phone || infoFromMap?.phone || '';
      const name = item.owner?.business_name || item.owner?.full_name || infoFromMap?.full_name || (ownerId !== 'seller' ? `Shop #${ownerId}` : 'Marketplace Seller');
      const avatar = item.owner?.avatar_url || infoFromMap?.avatar;
      const itemSubtotal = (item.price || 0) * (item.quantity || 1);

      if (!map.has(ownerId)) {
        map.set(ownerId, {
          sellerId: ownerId,
          name,
          phone,
          avatar,
          items: [],
          subtotal: 0,
        });
      }
      const grp = map.get(ownerId)!;
      grp.items.push(item);
      grp.subtotal += itemSubtotal;
      if (!grp.phone && phone) grp.phone = phone;
      if (grp.name.startsWith('Shop #') && name && !name.startsWith('Shop #')) grp.name = name;
      if (!grp.avatar && avatar) grp.avatar = avatar;
    });
    return Array.from(map.values());
  }, [cartItems, sellerInfoMap]);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Cart Empty</h2>
          <p className="text-gray-600 dark:text-neutral-300 mb-6">Add items to your cart before checking out.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-full transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const platformFee = Math.round(subtotal * 0.02); // 2% platform fee
  const total = subtotal + platformFee;

  const generateReceiptText = () => {
    const itemsText = cartItems
      .map((item: CheckoutItem, idx: number) => `${idx + 1}. ${item.title || item.title_en || 'Product'} (x${item.quantity || 1}) - KSh ${((item?.price || 0) * (item?.quantity || 1)).toLocaleString()}`)
      .join('\n');

    return `SUQAFURAN ORDER RECEIPT
========================================

ORDER #${orderNumber}
Date: ${new Date().toLocaleString()}

BUYER INFORMATION
Name: ${buyerName}
Phone: ${buyerPhone}
Location: ${currentLocation?.address || 'Kenya'}

ITEMS (${cartItems.length})
${itemsText}

PRICING
Subtotal: KSh ${subtotal.toLocaleString()}
Platform Fee (2%): KSh ${platformFee.toLocaleString()}
TOTAL: KSh ${total.toLocaleString()}

SELLER CONTACTS (${sellerGroups.length} Shop(s))
${sellerGroups.map(g => `• ${g.name}: ${g.items.length} items (KSh ${g.subtotal.toLocaleString()})`).join('\n')}

HOW IT WORKS
This is a peer-to-peer (P2P) transaction.
1. Each seller has received your order and location details.
2. Confirm item availability and pickup/delivery with each seller.
3. Pay directly on handover via Cash or direct M-Pesa.
========================================`;
  };

  const downloadReceipt = async () => {
    if (!receiptRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `receipt-${orderNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt');
    }
  };

  const handleProceed = async () => {
    if (!buyerName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!buyerPhone.trim()) {
      alert('Please enter your phone number');
      return;
    }

    const newOrderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    setOrderNumber(newOrderNumber);
    setReceiptGenerated(true);

    trackEvent('Initiated Checkout', {
      order_number: newOrderNumber,
      cart_size: cartItems.length,
      sellers_count: sellerGroups.length,
      total_amount: total,
    });

    // Create a real backend receipt per seller in the cart
    try {
      const receiptEntries = await Promise.all(
        sellerGroups.map(async (group) => {
          if (!group.sellerId || group.sellerId === 'seller') return null;
          try {
            const receipt = await checkoutReceiptService.createReceipt(
              Number(group.sellerId),
              group.items.map((item) => ({
                listing_id: Number(item.id),
                title: item.title || item.title_en || 'Product',
                price: item.price || 0,
                quantity: item.quantity || 1,
              })),
              group.subtotal
            );
            return [group.sellerId, receipt.id] as const;
          } catch {
            return null;
          }
        })
      );
      const validEntries = receiptEntries.filter(Boolean) as (readonly [string, number])[];
      setReceiptsBySellerId(Object.fromEntries(validEntries));
    } catch (error) {
      console.error('Failed to create checkout receipts:', error);
    }
  };

  // Build moderation-safe in-app message (no raw phone numbers or URLs to pass backend moderation)
  const buildSellerInAppMessage = (group: SellerOrderGroup) => {
    const itemsList = group.items
      .map((item, idx) => `${idx + 1}. ${item.title || item.title_en || 'Product'} (x${item.quantity || 1}) - KSh ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}`)
      .join('\n');

    return `📦 ORDER INQUIRY #${orderNumber}

Hello ${group.name},
I want to order the following item(s) from your shop on Suqafuran:

${itemsList}

Seller Subtotal: KSh ${group.subtotal.toLocaleString()}
📍 Handover Location: ${currentLocation?.address || 'Kenya'}
Buyer: ${buyerName}

Please confirm availability so we can arrange pickup/delivery and direct payment. Thank you!`;
  };

  // Send in-app chat message to a specific seller
  const handleSendChatToSeller = async (group: SellerOrderGroup, shouldNavigate = false) => {
    if (!receiptGenerated) {
      alert('Please generate receipt first');
      return;
    }

    const sellerId = group.sellerId;
    if (!sellerId || sellerId === 'seller') {
      alert('Seller account ID is unavailable for this item.');
      return;
    }

    setSellerChatStatus(prev => ({ ...prev, [sellerId]: 'sending' }));

    const receiptId = receiptsBySellerId[sellerId];
    if (receiptId) {
      checkoutReceiptService.trackContact(receiptId, 'message');
    }

    try {
      const content = buildSellerInAppMessage(group);
      await messageService.sendMessage({
        receiver_id: sellerId,
        content,
        listing_id: group.items[0]?.id,
      });

      setSellerChatStatus(prev => ({ ...prev, [sellerId]: 'sent' }));
      trackEvent('Order Distributed to Seller Chat', {
        seller_id: sellerId,
        seller_name: group.name,
        items_count: group.items.length,
        order_number: orderNumber,
      });

      if (shouldNavigate) {
        router.push(`/messages?userId=${sellerId}`);
      }
    } catch (err: any) {
      console.error(`Failed to send message to seller ${sellerId}:`, err);
      setSellerChatStatus(prev => ({ ...prev, [sellerId]: 'error' }));
      if (shouldNavigate) {
        router.push(`/messages?userId=${sellerId}`);
      }
    }
  };

  // Distribute order in-app messages to all sellers in parallel
  const handleDistributeToAllSellers = async () => {
    if (!receiptGenerated) {
      alert('Please generate receipt first');
      return;
    }

    setDistributingAll(true);
    trackEvent('Contacted Seller', { method: 'message_all_distributed', seller_count: sellerGroups.length });

    let sentCount = 0;
    for (const group of sellerGroups) {
      const sellerId = group.sellerId;
      if (!sellerId || sellerId === 'seller') continue;

      setSellerChatStatus(prev => ({ ...prev, [sellerId]: 'sending' }));
      try {
        const content = buildSellerInAppMessage(group);
        await messageService.sendMessage({
          receiver_id: sellerId,
          content,
          listing_id: group.items[0]?.id,
        });
        setSellerChatStatus(prev => ({ ...prev, [sellerId]: 'sent' }));
        sentCount++;
      } catch (e) {
        console.error('Error distributing to seller:', sellerId, e);
        setSellerChatStatus(prev => ({ ...prev, [sellerId]: 'error' }));
      }
    }

    setDistributingAll(false);
    if (sentCount > 0) {
      alert(`Order messages successfully sent to ${sentCount} seller(s)! You can track and reply to each in Messages.`);
    }
  };

  // WhatsApp seller with full formatted order text
  const handleWhatsAppSeller = (group: SellerOrderGroup) => {
    trackEvent('Contacted Seller', { method: 'whatsapp', seller_id: group.sellerId });
    const receiptId = receiptsBySellerId[group.sellerId];
    if (receiptId) {
      checkoutReceiptService.trackContact(receiptId, 'whatsapp');
    }

    const itemsSummary = group.items
      .map((it) => `• ${it.title || it.title_en || 'Product'} (x${it.quantity || 1}) - KSh ${((it.price || 0) * (it.quantity || 1)).toLocaleString()}`)
      .join('\n');

    const message = `Hi ${group.name},

I'm placing an order on Suqafuran:
${itemsSummary}

📍 MY LOCATION:
${currentLocation?.address || 'Kenya'}

MY DETAILS:
Name: ${buyerName}
Phone: ${buyerPhone}

Order #: ${orderNumber}
Seller Total: KSh ${group.subtotal.toLocaleString()}

Please confirm availability so we can arrange payment and handover. Thanks!`;

    const encoded = encodeURIComponent(message);
    if (group.phone) {
      let wp = group.phone.replace(/\D/g, '');
      if (wp.startsWith('0')) wp = '254' + wp.substring(1);
      else if (!wp.startsWith('254')) wp = '254' + wp;
      window.open(`https://wa.me/${wp}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  // Call seller
  const handleCallSeller = (group: SellerOrderGroup) => {
    trackEvent('Contacted Seller', { method: 'call', seller_id: group.sellerId });
    const receiptId = receiptsBySellerId[group.sellerId];
    if (receiptId) {
      checkoutReceiptService.trackContact(receiptId, 'call');
    }
    if (group.phone) {
      window.location.href = `tel:${group.phone}`;
    } else {
      alert(`Phone number for ${group.name} is not available.`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-900 rounded-lg">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white">Checkout & Order Flow</h1>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                {cartItems.length} item{cartItems.length > 1 ? 's' : ''} across {sellerGroups.length} shop{sellerGroups.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Link
            href="/messages"
            className="flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
          >
            <MessageSquare className="w-4 h-4" />
            <span>My Chats</span>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        {/* Step 1: Buyer Info & Location */}
        {!receiptGenerated && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Multi-seller overview alert */}
            <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-200 dark:border-orange-900/40 rounded-2xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
              <div className="text-xs text-gray-700 dark:text-neutral-300 leading-relaxed">
                <span className="font-bold text-gray-900 dark:text-white">Multi-Shop Chat Distribution:</span> After generating your order receipt, Suqafuran automatically separates items by seller and allows you to distribute in-app messages to each shop in one tap to track your purchases easily!
              </div>
            </div>

            {/* Buyer Information */}
            <div className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-gray-200 dark:border-neutral-800 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-500" />
                Buyer Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 dark:text-neutral-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 dark:text-neutral-400 mb-1">Phone Number (M-Pesa / WhatsApp)</label>
                  <input
                    type="tel"
                    placeholder="e.g. +254 712 345 678"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Location Display */}
            <div className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-gray-200 dark:border-neutral-800 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Delivery / Handover Location</h2>
              </div>

              {locationLoading ? (
                <div className="text-center py-4 text-xs text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-500" />
                  Detecting your current location...
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-900/40">
                    <p className="text-xs font-bold text-blue-900 dark:text-blue-300 mb-1">📍 Detected Location</p>
                    <p className="font-bold text-gray-900 dark:text-white text-base">{currentLocation?.address}</p>
                  </div>

                  <a
                    href={`https://maps.google.com/?q=${currentLocation?.lat},${currentLocation?.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-gray-800 dark:text-neutral-200 font-bold py-2.5 rounded-xl text-xs transition-colors"
                  >
                    <MapIcon className="w-4 h-4 text-orange-500" />
                    Preview Location on Google Maps
                  </a>
                </div>
              )}
            </div>

            {/* Items Grouped by Seller */}
            <div className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-gray-200 dark:border-neutral-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-orange-500" />
                  Items in Cart ({cartItems.length})
                </h2>
                <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400">
                  {sellerGroups.length} distinct shop{sellerGroups.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-4">
                {sellerGroups.map((group) => (
                  <div key={group.sellerId} className="border border-gray-200 dark:border-neutral-800 rounded-xl p-4 bg-gray-50/50 dark:bg-neutral-900/40">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-neutral-800 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-black text-xs flex items-center justify-center">
                          {group.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{group.name}</span>
                      </div>
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                        Subtotal: KSh {group.subtotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 flex-1 pr-2">
                            {item.images && item.images[0] ? (
                              <img src={item.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover bg-gray-100 dark:bg-neutral-800 shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-neutral-800 shrink-0 flex items-center justify-center text-gray-400">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">{item.title || item.title_en}</p>
                              <p className="text-gray-500 dark:text-neutral-400">Qty: {item.quantity || 1}</p>
                            </div>
                          </div>
                          <p className="font-bold text-gray-900 dark:text-white shrink-0">
                            KSh {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 dark:border-neutral-800 mt-6 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-700 dark:text-neutral-300">
                  <span>Cart Subtotal</span>
                  <span className="font-semibold">KSh {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-neutral-300">
                  <span>Platform Fee (2%)</span>
                  <span className="font-semibold">KSh {platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-neutral-800">
                  <span>Total Due on Handover</span>
                  <span className="text-orange-600">KSh {total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Proceed CTA */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleProceed}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 text-base"
            >
              <CheckCircle className="w-5 h-5" />
              Generate Order & Distribute to Sellers
            </motion.button>
          </motion.div>
        )}

        {/* Step 2: Receipt Generated & Multi-Seller Chat Distribution */}
        {receiptGenerated && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Success Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-800/60 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-black text-emerald-900 dark:text-emerald-300 text-base">Order Receipt #{orderNumber} Created!</h3>
                  <p className="text-emerald-800 dark:text-emerald-200 text-xs mt-1 leading-relaxed">
                    Now connect directly with each seller below to confirm stock and handover. Messages distributed here will appear right in your Suqafuran chat box.
                  </p>
                </div>
              </div>
            </div>

            {/* SELLER CHAT DISTRIBUTION PANEL */}
            <div className="bg-white dark:bg-neutral-950 rounded-2xl p-6 border-2 border-orange-500/30 dark:border-orange-500/20 shadow-md space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-orange-600" />
                    Distribute Order to Shops ({sellerGroups.length})
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                    Send order summaries directly into each vendor's in-app chat thread.
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDistributeToAllSellers}
                  disabled={distributingAll}
                  className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-full text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
                >
                  {distributingAll ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Distributing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send to All Shops in Chat
                    </>
                  )}
                </motion.button>
              </div>

              {/* Individual Seller Distribution Cards */}
              <div className="space-y-4">
                {sellerGroups.map((group) => {
                  const status = sellerChatStatus[group.sellerId] || 'idle';
                  return (
                    <div 
                      key={group.sellerId} 
                      className="border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 bg-gray-50/60 dark:bg-neutral-900/60 space-y-3"
                    >
                      {/* Shop Header */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-black text-sm flex items-center justify-center shrink-0">
                            {group.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-gray-900 dark:text-white">{group.name}</span>
                              <span className="text-[10px] font-semibold bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 px-2 py-0.5 rounded-full">
                                {group.items.length} item{group.items.length > 1 ? 's' : ''}
                              </span>
                            </div>
                            <span className="text-xs font-black text-orange-600 dark:text-orange-400">
                              Subtotal: KSh {group.subtotal.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {status === 'sent' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <CheckCheck className="w-3.5 h-3.5" /> Chat Sent ✓
                            </span>
                          )}
                          {status === 'sending' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                            </span>
                          )}
                          {status === 'error' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-full">
                              Error sending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Items mini list */}
                      <div className="bg-white dark:bg-neutral-950 rounded-xl p-3 border border-gray-100 dark:border-neutral-800/80 space-y-2">
                        {group.items.map((it) => (
                          <div key={it.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-800 dark:text-neutral-200 line-clamp-1 font-medium">
                              • {it.title || it.title_en} <span className="text-gray-400 font-normal">x{it.quantity || 1}</span>
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white shrink-0 ml-2">
                              KSh {((it.price || 0) * (it.quantity || 1)).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Actions for this specific seller */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        {status === 'sent' ? (
                          <Link
                            href={`/messages?userId=${group.sellerId}`}
                            className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Open In-App Chat
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleSendChatToSeller(group, false)}
                            disabled={status === 'sending'}
                            className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-colors disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Send In-App Chat
                          </button>
                        )}

                        <button
                          onClick={() => handleWhatsAppSeller(group)}
                          className="flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-colors"
                          title="WhatsApp this vendor"
                        >
                          <FaWhatsapp className="w-4 h-4" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>

                        {group.phone && (
                          <button
                            onClick={() => handleCallSeller(group)}
                            className="flex items-center justify-center gap-1 bg-gray-200 hover:bg-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-900 dark:text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-colors"
                            title="Call vendor"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Call</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Receipt Preview - Ticket Style */}
            <div className="flex justify-center py-4">
              <div className="w-full">
                <div ref={receiptRef} className="bg-white dark:bg-neutral-950 rounded-3xl p-6 md:p-8 border-2 border-gray-200 dark:border-neutral-800 shadow-xl relative">
                  <div className="text-center space-y-6">
                    {/* Logo & Header */}
                    <div className="flex justify-center">
                      <img src="/icon1.png" alt="Suqafuran" className="h-12 w-auto object-contain" />
                    </div>

                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white">Order Receipt</h2>
                      <p className="text-gray-500 dark:text-neutral-400 text-xs">Direct Peer-to-Peer Order Voucher</p>
                    </div>

                    <div className="border-t-2 border-dashed border-gray-300 dark:border-neutral-800 pt-4"></div>

                    {/* Order ID, Total, Date */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-left">
                        <p className="font-bold text-gray-400 uppercase">Order ID</p>
                        <p className="font-black text-gray-900 dark:text-white text-sm">{orderNumber}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-gray-400 uppercase">Total Due</p>
                        <p className="font-black text-orange-600 text-sm">KSh {total.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-400 uppercase">Date</p>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{new Date().toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Buyer Info */}
                    <div className="bg-orange-50/70 dark:bg-orange-950/20 rounded-xl p-3 border border-orange-200/80 dark:border-orange-900/40 text-left text-xs">
                      <p className="font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider mb-1">Buyer Details</p>
                      <p className="font-bold text-gray-900 dark:text-white">{buyerName}</p>
                      <p className="text-gray-600 dark:text-neutral-400">{buyerPhone}</p>
                      <p className="text-gray-600 dark:text-neutral-400 mt-1">📍 {currentLocation?.address}</p>
                    </div>

                    {/* Itemized list */}
                    <div className="text-left bg-gray-50 dark:bg-neutral-900 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-bold text-gray-400 uppercase">Ordered Products ({cartItems.length})</p>
                      {cartItems.map((item: CheckoutItem) => (
                        <div key={item.id} className="flex justify-between items-start text-xs border-b border-gray-200 dark:border-neutral-800 pb-2 last:border-b-0">
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{item.title || item.title_en}</p>
                            <p className="text-gray-400 text-[10px]">Qty: {item.quantity || 1}</p>
                          </div>
                          <p className="font-bold text-orange-600 dark:text-orange-400 shrink-0">
                            KSh {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                          </p>
                        </div>
                      ))}

                      {/* Pricing */}
                      <div className="border-t border-gray-200 dark:border-neutral-800 pt-3 space-y-1 text-xs">
                        <div className="flex justify-between text-gray-600 dark:text-neutral-400">
                          <span>Subtotal</span>
                          <span className="font-semibold text-gray-900 dark:text-white">KSh {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 dark:text-neutral-400">
                          <span>Platform Fee (2%)</span>
                          <span className="font-semibold text-gray-900 dark:text-white">KSh {platformFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-gray-900 dark:text-white pt-2 border-t border-gray-300 dark:border-neutral-700">
                          <span>Grand Total</span>
                          <span className="text-orange-600">KSh {total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t-2 border-dashed border-gray-300 dark:border-neutral-800 pt-2"></div>
                    <p className="text-[11px] text-gray-400 font-mono tracking-wider">SUQAFURAN DIRECT DEAL • VERIFY GOODS BEFORE PAYMENT</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: Download & Copy Receipt */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={downloadReceipt}
                className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-black dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-bold py-3.5 rounded-xl text-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Receipt Image
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const receipt = generateReceiptText();
                  navigator.clipboard.writeText(receipt);
                  alert('Receipt text copied to clipboard!');
                }}
                className="flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-gray-900 dark:text-white font-bold py-3.5 rounded-xl text-xs transition-colors"
              >
                <Send className="w-4 h-4" />
                Copy Summary Text
              </motion.button>
            </div>

            {/* Direct P2P Deal Explainer */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-2xl p-5 text-xs leading-relaxed text-blue-900 dark:text-blue-300 space-y-1">
              <p className="font-bold text-sm">💡 What happens next?</p>
              <p>Your order notifications are sent directly into each seller's conversation inbox on Suqafuran. You can click any seller's chat button above or open <Link href="/messages" className="underline font-bold">Messages</Link> anytime to see their replies, agree on meeting points, and finalize the deal.</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
