"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../../store/useCart';
import { useLocationStore } from '../../../store/useLocation';
import { useAuthStore } from '../../../store/useAuth';
import { ChevronLeft, MapPin, Download, Send, MessageCircle, Phone, CheckCircle, AlertCircle, Map } from 'lucide-react';
import { motion } from 'framer-motion';

interface CheckoutItem {
  id: number;
  title_en: string;
  price: number;
  images?: string[];
  owner?: {
    full_name: string;
    phone: string;
    email: string;
    avatar_url?: string;
  };
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
        }
      );
    }
  }, [city]);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Cart Empty</h2>
          <p className="text-gray-600 dark:text-slate-400 mb-6">Add items to your cart before checking out.</p>
          <button
            onClick={() => router.push('/shops')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-full"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const platformFee = Math.round(subtotal * 0.02); // 2% platform fee only
  const total = subtotal + platformFee;

  const generateReceipt = () => {
    const itemsText = cartItems
      .map((item: CheckoutItem, idx: number) => `${idx + 1}. ${item.title_en} - KSh ${item.price.toLocaleString()}`)
      .join('\n');

    const receipt = `
    ╔════════════════════════════════════════════════════╗
    ║           SUQAFURAN ORDER RECEIPT                  ║
    ╚════════════════════════════════════════════════════╝

    ORDER #${orderNumber}
    Date: ${new Date().toLocaleString()}

    ─── BUYER INFORMATION ───
    Name: ${buyerName}
    Phone: ${buyerPhone}
    Location: ${currentLocation?.address}
    Coordinates: ${currentLocation?.lat.toFixed(4)}, ${currentLocation?.lng.toFixed(4)}

    ─── ITEMS ───
    ${itemsText}

    ─── PRICING ───
    Subtotal:     KSh ${subtotal.toLocaleString()}
    Platform Fee: KSh ${platformFee}
    ─────────────────────────
    TOTAL:        KSh ${total.toLocaleString()}

    ─── HOW IT WORKS ───
    This is a P2P (peer-to-peer) transaction.

    1. You have shared your location with the seller
    2. Contact the seller via WhatsApp or message
    3. Discuss and agree on:
       • Meeting location and time
       • Payment method
       • Product condition and quantity
    4. Complete the transaction directly

    Suqafuran's role: Connect buyers and sellers
    Your payment: Directly with seller (not through platform)
    Your delivery: Arrange with seller

    ════════════════════════════════════════════════════════
    `;

    return receipt;
  };

  const downloadReceipt = () => {
    const receipt = generateReceipt();
    const element = document.createElement('a');
    const file = new Blob([receipt], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `receipt-${orderNumber}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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

    const newOrderNumber = `ORD-${Date.now()}`;
    setOrderNumber(newOrderNumber);
    setReceiptGenerated(true);
  };

  const handleContactSeller = (method: 'whatsapp' | 'message') => {
    if (!receiptGenerated) {
      alert('Please generate receipt first');
      return;
    }

    setIsProcessing(true);

    // Group items by seller
    const sellerGroups = new Map();
    cartItems.forEach((item: CheckoutItem) => {
      if (item.owner) {
        const sellerId = item.owner.phone;
        if (!sellerGroups.has(sellerId)) {
          sellerGroups.set(sellerId, {
            phone: item.owner.phone,
            name: item.owner.full_name,
            items: []
          });
        }
        sellerGroups.get(sellerId).items.push(item);
      }
    });

    if (sellerGroups.size === 0) {
      alert('No seller information available');
      setIsProcessing(false);
      return;
    }

    const firstSeller = Array.from(sellerGroups.values())[0];
    const itemsList = firstSeller.items
      .map((item: CheckoutItem) => `• ${item.title_en} - KSh ${item.price.toLocaleString()}`)
      .join('\n');

    const message = `Hi ${firstSeller.name},

I'm interested in your products:
${itemsList}

📍 MY LOCATION:
Address: ${currentLocation?.address}
Coordinates: ${currentLocation?.lat.toFixed(4)}, ${currentLocation?.lng.toFixed(4)}

MY DETAILS:
Name: ${buyerName}
Phone: ${buyerPhone}

Order #: ${orderNumber}
Total Amount: KSh ${total.toLocaleString()}

Please let me know about availability and we can arrange payment and meeting location.

Thanks!`;

    if (method === 'whatsapp') {
      const encodedMessage = encodeURIComponent(message);
      const whatsappPhone = firstSeller.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${whatsappPhone}?text=${encodedMessage}`, '_blank');
    } else if (method === 'message') {
      router.push(`/messages?sellerId=${firstSeller.phone}&message=${encodeURIComponent(message)}`);
    }

    setIsProcessing(false);
    setTimeout(() => {
      clearCart();
      router.push('/shops');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Checkout</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step 1: Buyer Info & Location */}
        {!receiptGenerated && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Buyer Information */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Information</h2>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="tel"
                  placeholder="Phone Number (e.g., +254712345678)"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Location Display with Map Info */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Location</h2>
              </div>

              {locationLoading ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 dark:text-slate-400">Getting your location...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Location Display */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">📍 Your Location</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">{currentLocation?.address}</p>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-2">Latitude: {currentLocation?.lat.toFixed(6)}</p>
                    <p className="text-xs text-gray-600 dark:text-slate-400">Longitude: {currentLocation?.lng.toFixed(6)}</p>
                  </div>

                  {/* Map Link */}
                  <a
                    href={`https://maps.google.com/?q=${currentLocation?.lat},${currentLocation?.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-400 font-bold py-3 rounded-lg transition-colors"
                  >
                    <Map className="w-4 h-4" />
                    View on Google Maps
                  </a>

                  <p className="text-xs text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 p-3 rounded-lg">
                    ℹ️ Your location will be shared with the seller so they know where you're located. You'll arrange the exact meeting point directly with them.
                  </p>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                {cartItems.map((item: CheckoutItem) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">${item.title_en}</p>
                      <p className="text-sm text-gray-600 dark:text-slate-400">from ${item.owner?.full_name}</p>
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white">KSh ${item.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-slate-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-700 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span>KSh ${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-slate-400">
                  <span>Platform Fee (2%)</span>
                  <span>KSh ${platformFee}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-slate-700">
                  <span>Total</span>
                  <span className="text-orange-600">KSh ${total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Proceed Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleProceed}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Generate Receipt & Continue
            </motion.button>
          </motion.div>
        )}

        {/* Step 2: Receipt Generated - Contact Seller */}
        {receiptGenerated && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1 shrink-0" />
                <div>
                  <h3 className="font-bold text-green-900 dark:text-green-300 mb-2">Receipt Generated!</h3>
                  <p className="text-green-800 dark:text-green-200 text-sm">
                    Order #${orderNumber} has been created. Now contact the seller(s) to arrange payment and meeting location.
                  </p>
                </div>
              </div>
            </div>

            {/* Receipt Preview */}
            <div className="bg-gray-900 dark:bg-black rounded-2xl p-6 font-mono text-xs text-gray-300 overflow-x-auto whitespace-pre max-h-96 overflow-y-auto">
              {generateReceipt()}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={downloadReceipt}
                className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                <Download className="w-5 h-5" />
                Download
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const receipt = generateReceipt();
                  navigator.clipboard.writeText(receipt);
                  alert('Receipt copied to clipboard!');
                }}
                className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                <Send className="w-5 h-5" />
                Copy
              </motion.button>
            </div>

            {/* Contact Seller Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Contact Seller(s)</h2>
              <p className="text-gray-600 dark:text-slate-400 mb-6">Choose how you want to contact the seller. They'll see your location and order details.</p>

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleContactSeller('whatsapp')}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Send via WhatsApp
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleContactSeller('message')}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors"
                >
                  <Send className="w-5 h-5" />
                  Send via Message
                </motion.button>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6">
              <p className="text-blue-900 dark:text-blue-300 text-sm leading-relaxed">
                <strong>How it works:</strong> You've shared your location with the seller. They can see exactly where you are on the map. Contact them to confirm the meeting point, payment method, and complete the transaction directly.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
