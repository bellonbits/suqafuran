"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../../store/useCart';
import { useLocationStore } from '../../../store/useLocation';
import { ChevronLeft, MapPin, Package, Send, Loader, MessageCircle, X, Clock, Gift, Phone, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../../services/api';
import api from '../../../services/api';

interface Message {
    id: string;
    sender: 'buyer' | 'seller';
    text: string;
    timestamp: Date;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { items: cartItems, getTotalPrice } = useCart();
    const { city } = useLocationStore();

    // Checkout states
    const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('delivery');
    const [selectedDelivery, setSelectedDelivery] = useState('standard');
    const [scheduledTime, setScheduledTime] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedTip, setSelectedTip] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [promoDiscount, setPromoDiscount] = useState(0);

    // Location states
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationLoading, setLocationLoading] = useState(true);
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [tempAddress, setTempAddress] = useState('');

    // Communication states
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showChat, setShowChat] = useState(false);

    // Get user's current location
    useEffect(() => {
        if (typeof window !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                    setLocationLoading(false);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    setCurrentLocation({
                        lat: -1.2921,
                        lng: 36.8219,
                    });
                    setLocationLoading(false);
                }
            );
        }
    }, []);

    const handlePromoCode = () => {
        // Simulate promo code validation
        if (promoCode.toUpperCase() === 'SAVE10') {
            setPromoDiscount(Math.round(getTotalPrice() * 0.1));
        } else if (promoCode) {
            alert('Invalid promo code');
        }
    };

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        const message: Message = {
            id: Date.now().toString(),
            sender: 'buyer',
            text: newMessage,
            timestamp: new Date(),
        };

        setMessages([...messages, message]);
        setNewMessage('');

        // Simulate seller response
        setTimeout(() => {
            const response: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'seller',
                text: 'Thanks for your order! We are preparing it now.',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, response]);
        }, 1000);
    };

    const handleSaveAddress = () => {
        setDeliveryAddress(tempAddress);
        setIsEditingAddress(false);
    };

    const subtotal = getTotalPrice();
    const deliveryFee = fulfillmentType === 'pickup' ? 0 : 149;
    const serviceFee = Math.round(subtotal * 0.1);
    const total = subtotal + deliveryFee + serviceFee - promoDiscount;

    const handleMpesaPayment = async () => {
        if (!phoneNumber.trim()) {
            alert('Please enter your phone number');
            return;
        }

        if (!currentLocation) {
            alert('Unable to get your location. Please refresh and try again.');
            return;
        }

        if (fulfillmentType === 'delivery' && !deliveryAddress && !isEditingAddress) {
            alert('Please confirm your delivery address');
            return;
        }

        setIsProcessing(true);
        try {
            const response = await api.post('/payments/mpesa', {
                phoneNumber,
                amount: total + (fulfillmentType === 'delivery' ? selectedTip : 0),
                orderId: `ORDER-${Date.now()}`,
                items: cartItems,
                fulfillmentType,
                deliveryOption: fulfillmentType === 'delivery' ? selectedDelivery : null,
                scheduledTime: fulfillmentType === 'delivery' && selectedDelivery === 'scheduled' ? scheduledTime : null,
                location: city,
                coordinates: {
                    latitude: currentLocation.lat,
                    longitude: currentLocation.lng,
                },
                deliveryAddress: fulfillmentType === 'delivery' ? (deliveryAddress || 'Current Location') : null,
                courierTip: fulfillmentType === 'delivery' ? selectedTip : 0,
                promoCode,
                discount: promoDiscount,
                messages: messages.filter(m => m.sender === 'buyer'),
            });

            const data = response.data;
            if (data.success) {
                alert(`Payment initiated successfully!\nOrder ID: ${data.order_id}\nCheck your phone for M-Pesa prompt.`);
                router.push('/orders');
            } else {
                alert(`Payment failed: ${data.message || 'Unknown error'}`);
                console.error('Payment response:', data);
            }
        } catch (error: any) {
            console.error('Payment error:', error);
            const errorMessage = error?.response?.data?.detail
                || error?.response?.data?.message
                || error?.message
                || 'Unknown error occurred';
            alert(`Payment failed: ${errorMessage}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">Your cart is empty</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-full"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Checkout</h1>
                </div>

                {/* Delivery/Pickup Toggle */}
                <div className="mb-8 flex gap-3 max-w-sm">
                    <button
                        onClick={() => setFulfillmentType('delivery')}
                        className={`flex-1 py-3 px-4 font-bold rounded-lg transition-all border-2 ${
                            fulfillmentType === 'delivery'
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-white text-gray-900 border-gray-200 dark:bg-slate-900 dark:text-white dark:border-slate-800'
                        }`}
                    >
                        Delivery
                    </button>
                    <button
                        onClick={() => setFulfillmentType('pickup')}
                        className={`flex-1 py-3 px-4 font-bold rounded-lg transition-all border-2 ${
                            fulfillmentType === 'pickup'
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-white text-gray-900 border-gray-200 dark:bg-slate-900 dark:text-white dark:border-slate-800'
                        }`}
                    >
                        Pickup
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Order Summary */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your order</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {cartItems.length} product{cartItems.length !== 1 ? 's' : ''} from store
                            </p>
                            <div className="space-y-3">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex gap-4 p-4 bg-gray-50 dark:bg-slate-900 rounded-lg">
                                        {item.image && (
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="w-16 h-16 rounded-lg object-cover"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900 dark:text-white">{item.title}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">×{item.quantity}</p>
                                        </div>
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            KSh{(item.price * item.quantity).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Delivery Address - Only show for delivery mode */}
                        {fulfillmentType === 'delivery' && (
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Delivery address</h2>

                            {/* Map Display */}
                            {locationLoading ? (
                                <div className="bg-gray-100 dark:bg-slate-800 rounded-lg h-80 mb-6 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader className="w-8 h-8 animate-spin text-orange-500" />
                                        <p className="text-gray-600 dark:text-gray-400">Loading your location...</p>
                                    </div>
                                </div>
                            ) : currentLocation ? (
                                <div className="relative bg-gray-100 dark:bg-slate-800 rounded-lg h-80 mb-6 overflow-hidden border-2 border-orange-200 dark:border-orange-900">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        allowFullScreen={true}
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${currentLocation.lat},${currentLocation.lng}&zoom=16`}
                                    />
                                    <div className="absolute bottom-4 right-4 bg-white dark:bg-slate-900 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-slate-800 flex items-center gap-2">
                                        <MapPin className="w-3 h-3 text-orange-500" />
                                        <p className="text-xs font-bold text-gray-900 dark:text-white">Your Location</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-100 dark:bg-slate-800 rounded-lg h-80 mb-6 flex items-center justify-center">
                                    <p className="text-gray-600 dark:text-gray-400">Unable to load map</p>
                                </div>
                            )}

                            {/* Address Details */}
                            {isEditingAddress ? (
                                <div className="space-y-4 mb-6 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                            Building/Landmark Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g., The Mirage Building, Next to KFC"
                                            value={tempAddress}
                                            onChange={(e) => setTempAddress(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveAddress}
                                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors"
                                        >
                                            ✓ Confirm Address
                                        </button>
                                        <button
                                            onClick={() => setIsEditingAddress(false)}
                                            className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white font-bold py-3 rounded-lg transition-colors"
                                        >
                                            ✕ Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500 rounded-lg mb-4">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                                    Delivery Location
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {deliveryAddress || 'Add building/landmark details for easy identification'}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{city}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setTempAddress(deliveryAddress);
                                                    setIsEditingAddress(true);
                                                }}
                                                className="text-orange-500 hover:text-orange-600 font-bold whitespace-nowrap"
                                            >
                                                Edit →
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Sending to Someone Else */}
                            <details className="mb-4 border border-gray-200 dark:border-slate-800 rounded-lg">
                                <summary className="cursor-pointer p-4 font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3">
                                    <Gift className="w-5 h-5 text-orange-500" />
                                    Sending to someone else?
                                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">Add their details</span>
                                </summary>
                                <div className="p-4 border-t border-gray-200 dark:border-slate-800 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Recipient's name"
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Recipient's phone number"
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                    />
                                    <textarea
                                        placeholder="Any special instructions for delivery"
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                        rows={3}
                                    />
                                </div>
                            </details>
                        </div>
                        )}

                        {/* Pickup Mode - Show pickup instructions */}
                        {fulfillmentType === 'pickup' && (
                        <div className="bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <Package className="w-8 h-8 text-orange-500 flex-shrink-0" />
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Ready for pickup</h2>
                                    <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                                        <div className="flex items-start gap-2">
                                            <Clock className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold">30-minute pickup window</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Order will be ready when you arrive</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold">24-hour limit</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">Pick up within 24 hours or order expires</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-semibold">Seller location</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">{city}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}

                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                <input type="checkbox" className="mr-2" defaultChecked />
                                Add your phone number
                            </label>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">We'll send you a message to validate it</p>
                            <input
                                type="tel"
                                placeholder="+254..."
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>

                        {/* Delivery Options - Only show for delivery mode */}
                        {fulfillmentType === 'delivery' && (
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery options</h2>
                                <span title="Select your preferred delivery time"><Clock className="w-6 h-6 text-orange-500" /></span>
                            </div>

                            <div className="space-y-3">
                                {/* Standard Delivery */}
                                <button
                                    onClick={() => setSelectedDelivery('standard')}
                                    className={`w-full p-5 text-left border-2 rounded-xl transition-all ${
                                        selectedDelivery === 'standard'
                                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
                                            : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Zap className="w-5 h-5 text-orange-500" />
                                                <p className="font-bold text-lg text-gray-900 dark:text-white">Standard Delivery</p>
                                                {selectedDelivery === 'standard' && (
                                                    <span className="ml-auto px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                                                        Selected
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                25-40 minutes delivery time
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                Perfect for urgent orders. Available now.
                                            </p>
                                        </div>
                                    </div>
                                </button>

                                {/* Scheduled Delivery */}
                                <button
                                    onClick={() => setSelectedDelivery('scheduled')}
                                    className={`w-full p-5 text-left border-2 rounded-xl transition-all ${
                                        selectedDelivery === 'scheduled'
                                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
                                            : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock className="w-5 h-5 text-orange-500" />
                                                <p className="font-bold text-lg text-gray-900 dark:text-white">Schedule for Later</p>
                                                {selectedDelivery === 'scheduled' && (
                                                    <span className="ml-auto px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                                                        Selected
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                                                <Package className="w-4 h-4" />
                                                Choose your preferred time
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                Schedule delivery up to 7 days in advance.
                                            </p>
                                        </div>
                                    </div>
                                </button>

                                {/* Scheduled Time Picker */}
                                {selectedDelivery === 'scheduled' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="p-5 bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-xl space-y-4"
                                    >
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-[#5bc0e8]" />
                                                Select Date & Time
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={scheduledTime}
                                                onChange={(e) => setScheduledTime(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-semibold"
                                            />
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Minimum 1 hour from now • Available 6 AM - 11 PM
                                            </p>
                                        </div>

                                        {/* Quick Time Slots */}
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Quick slots:</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { label: 'In 1 hour', offset: 60 },
                                                    { label: 'In 2 hours', offset: 120 },
                                                    { label: 'This evening', offset: 480 },
                                                    { label: 'Tomorrow', offset: 1440 },
                                                ].map((slot) => (
                                                    <button
                                                        key={slot.label}
                                                        onClick={() => {
                                                            const time = new Date();
                                                            time.setMinutes(time.getMinutes() + slot.offset);
                                                            setScheduledTime(time.toISOString().slice(0, 16));
                                                        }}
                                                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-semibold text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                    >
                                                        {slot.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                        )}

                        {/* Promo Code */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Got a promo code?</h2>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter promo code (Try: SAVE10)"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value)}
                                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                />
                                <button
                                    onClick={handlePromoCode}
                                    className="px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg"
                                >
                                    Apply
                                </button>
                            </div>
                            {promoDiscount > 0 && (
                                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                                    ✓ Discount applied: KSh{promoDiscount.toLocaleString()}
                                </p>
                            )}
                        </div>

                        {/* Courier Tip - Only show for delivery mode */}
                        {fulfillmentType === 'delivery' && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Courier tip</h2>
                            <div className="grid grid-cols-4 gap-3 mb-4">
                                {[0, 50, 100, 200].map((tip) => (
                                    <button
                                        key={tip}
                                        onClick={() => setSelectedTip(tip)}
                                        className={`py-3 px-4 rounded-lg font-bold transition-all ${
                                            selectedTip === tip
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {tip === 0 ? '0%' : `KSh${tip}`}
                                    </button>
                                ))}
                            </div>
                            <label className="flex items-center gap-2 text-gray-900 dark:text-white">
                                <input type="checkbox" defaultChecked className="w-5 h-5 rounded text-green-500" />
                                <span>Save tip for next order</span>
                            </label>
                        </div>
                        )}

                        {/* Communication Section */}
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 mt-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <MessageCircle className="w-6 h-6 text-orange-500" />
                                Communicate with seller
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Chat with the merchant before payment to discuss any special requests or questions
                            </p>

                            {/* Chat Box */}
                            <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 space-y-3 mb-4 h-64 overflow-y-auto border border-gray-200 dark:border-slate-800">
                                {messages.length === 0 ? (
                                    <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                                        Start a conversation with the seller
                                    </p>
                                ) : (
                                    messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.sender === 'buyer' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-xs px-4 py-2 rounded-lg ${
                                                    msg.sender === 'buyer'
                                                        ? 'bg-orange-500 text-white rounded-br-none'
                                                        : 'bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-white rounded-bl-none'
                                                }`}
                                            >
                                                <p className="text-sm">{msg.text}</p>
                                                <p className="text-xs opacity-70 mt-1">
                                                    {msg.timestamp.toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Message Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Type your message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') handleSendMessage();
                                    }}
                                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg flex items-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Panel */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-20 bg-gray-50 dark:bg-slate-900 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-6">
                                <Package className="w-6 h-6 text-orange-500" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Summary</h3>
                            </div>

                            <div className="space-y-3 border-b border-gray-200 dark:border-slate-800 pb-4">
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Products</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        KSh{subtotal.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Delivery</span>
                                    <span className="font-semibold">
                                        <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold mr-2">
                                            FREE
                                        </span>
                                        <span className="line-through">KSh{deliveryFee}</span>
                                    </span>
                                </div>
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center gap-1">Services</span>
                                    <span className="font-semibold">
                                        <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold mr-2">
                                            -90%
                                        </span>
                                        KSh{serviceFee}
                                    </span>
                                </div>
                                {promoDiscount > 0 && (
                                    <div className="flex justify-between text-green-600 dark:text-green-400">
                                        <span>Promo Discount</span>
                                        <span className="font-semibold">-KSh{promoDiscount.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center pt-4">
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">TOTAL</span>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                    KSh{total.toLocaleString()}
                                </span>
                            </div>

                            {selectedTip > 0 && (
                                <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-lg">
                                    <p className="text-sm text-orange-900 dark:text-orange-300">
                                        Tip: KSh{selectedTip.toLocaleString()}
                                        <br />
                                        Final Total: KSh{(total + selectedTip).toLocaleString()}
                                    </p>
                                </div>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleMpesaPayment}
                                disabled={isProcessing}
                                className="w-full bg-black hover:bg-gray-900 disabled:bg-gray-400 text-white font-bold py-4 rounded-full transition-all mt-6"
                            >
                                {isProcessing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </span>
                                ) : (
                                    'Pay with M-Pesa'
                                )}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
