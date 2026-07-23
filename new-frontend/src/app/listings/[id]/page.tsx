"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Heart,
  Share2,
  MapPin,
  Clock,
  MessageSquare,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Loader,
  Shield,
  Star,
  Edit as EditIcon,
  Phone,
  Eye,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import api, { resolveMediaUrl } from '@/services/api';

interface Listing {
  id: number;
  title_en: string;
  description_en: string;
  price: number;
  location: string;
  condition: string;
  category_id: number;
  status: string;
  currency: string;
  images: string[];
  is_negotiable: boolean;
  is_sold: boolean;
  views: number;
  created_at: string;
  owner: {
    id: number;
    full_name: string;
    phone: string;
    email: string;
    is_verified: boolean;
    verified_level: string;
    avatar_url: string;
    response_time: string;
    trust_level: string;
  };
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    loadListing();
    loadCurrentUser();
  }, [id]);

  useEffect(() => {
    if (listing && currentUserId) {
      setIsOwner(listing.owner.id === currentUserId);
    }
  }, [listing, currentUserId]);

  const loadCurrentUser = async () => {
    try {
      const response = await api.get('/sellers/me');
      setCurrentUserId(response.data.user_id);
    } catch (err) {
      console.log('Not authenticated');
    }
  };

  const loadListing = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/listings/${id}`);
      setListing(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (listing?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
    }
  };

  const prevImage = () => {
    if (listing?.images) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? listing.images.length - 1 : prev - 1
      );
    }
  };

  const handleSendMessage = async () => {
    if (!contactMessage.trim()) return;
    setSendingMessage(true);
    try {
      await api.post(`/messages/send`, {
        recipient_id: listing?.owner.id,
        content: contactMessage,
        listing_id: listing?.id,
      });
      setContactMessage('');
      setShowContactModal(false);
      alert('Message sent!');
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Listing Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getVerificationBadge = () => {
    const level = listing.owner.verified_level;
    const badgeConfig: { [key: string]: { label: string; color: string; icon: string } } = {
      tier1: { label: 'Verified', color: 'bg-blue-50 text-blue-700', icon: '✓' },
      tier2: { label: 'ID Verified', color: 'bg-emerald-50 text-emerald-700', icon: '✓✓' },
      tier3: { label: 'Trusted', color: 'bg-purple-50 text-purple-700', icon: '⭐' },
    };
    const config = badgeConfig[level] || { label: 'New Seller', color: 'bg-gray-50 text-gray-700', icon: '•' };
    return config;
  };

  const verification = getVerificationBadge();
  const daysSince = Math.floor((Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate flex-1 px-4">
            {listing.title_en}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsSaved(!isSaved)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              <Heart className={`w-6 h-6 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition">
              <Share2 className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Image & Gallery */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative bg-gray-100 dark:bg-slate-800 rounded-2xl overflow-hidden aspect-square group"
            >
              {listing.images && listing.images[currentImageIndex] && (
                <Image
                  src={resolveMediaUrl(listing.images[currentImageIndex])}
                  alt={listing.title_en}
                  fill
                  className="object-cover"
                  priority
                />
              )}

              {/* Sold Badge */}
              {listing.is_sold && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white text-4xl font-bold">SOLD</div>
                </div>
              )}

              {/* Navigation Arrows */}
              {listing.images && listing.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-900" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-900" />
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {currentImageIndex + 1} / {listing.images.length}
                  </div>
                </>
              )}
            </motion.div>

            {/* Thumbnail Gallery */}
            {listing.images && listing.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {listing.images.map((img, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                      idx === currentImageIndex
                        ? 'border-blue-500 shadow-md'
                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={resolveMediaUrl(img)}
                      alt={`View ${idx + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            )}

            {/* Product Details */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 space-y-6">
              {/* Condition & Status */}
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm font-medium capitalize">
                  {listing.condition}
                </span>
                {listing.is_negotiable && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 rounded-full text-sm font-medium">
                    Negotiable
                  </span>
                )}
                <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                  {daysSince === 0 ? 'Today' : `${daysSince}d ago`}
                </span>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">About this item</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {listing.description_en}
                </p>
              </div>

              {/* Key Details */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{listing.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Views</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{listing.views.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-8 shadow-lg"
            >
              <p className="text-sm font-medium text-blue-100 mb-2">Price</p>
              <h2 className="text-4xl font-bold mb-6">{formatPrice(listing.price)}</h2>

              <div className="space-y-3">
                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-full bg-white text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition shadow-md"
                >
                  Contact Seller
                </button>
                <button className="w-full border-2 border-white/50 text-white py-3 rounded-xl font-semibold hover:bg-white/10 transition">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Call Seller
                </button>
              </div>
            </motion.div>

            {/* Seller Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-start gap-4 mb-4">
                {listing.owner.avatar_url && (
                  <Image
                    src={resolveMediaUrl(listing.owner.avatar_url)}
                    alt={listing.owner.full_name}
                    width={60}
                    height={60}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{listing.owner.full_name}</h3>
                  <div className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${verification.color}`}>
                    {verification.label}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" />
                {listing.owner.response_time}
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 font-semibold transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send Message
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 font-semibold transition">
                  <Shield className="w-4 h-4" />
                  Report Listing
                </button>
              </div>
            </motion.div>

            {/* Safety Tips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6"
            >
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Safety Tips
              </h4>
              <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Meet in a safe, public place</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Inspect the item before paying</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Pay only after receiving item</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Report suspicious activity</span>
                </li>
              </ul>
            </motion.div>

            {isOwner && (
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 font-semibold transition">
                <EditIcon className="w-4 h-4" />
                Edit Listing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl w-full sm:max-w-md shadow-xl"
          >
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Message Seller</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{listing.owner.full_name}</p>
            </div>

            <div className="p-6 space-y-4">
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Ask about the product, negotiate price, or set a meeting time..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !contactMessage.trim()}
                  className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  {sendingMessage ? <Loader className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
