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
  User,
  Phone,
  MessageSquare,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Loader,
  Shield,
  Star,
  Edit as EditIcon,
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
      console.log('Not authenticated or not a seller');
    }
  };

  const loadListing = async () => {
    try {
      setLoading(true);
      setError(null);
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
      alert('Message sent successfully!');
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#5bc0e8]" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Listing Not Found
          </h1>
          <p className="text-gray-600 dark:text-slate-400 mb-6">
            {error || 'This listing does not exist or has been removed.'}
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[#5bc0e8] text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const conditionColors: Record<string, string> = {
    new: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    like_new: 'bg-[#e0f7ff] text-blue-800 dark:bg-blue-900/30 dark:text-[#6cd4ff]',
    good: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    fair: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
            <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-slate-300" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1 mx-4 truncate">
            {listing.title_en}
          </h1>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSaved(!isSaved)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Heart
                className={`w-6 h-6 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-700 dark:text-slate-300'}`}
              />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Share2 className="w-6 h-6 text-gray-700 dark:text-slate-300" />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            <div className="relative bg-gray-100 dark:bg-slate-900 rounded-xl overflow-hidden aspect-square mb-4">
              {listing.images && listing.images.length > 0 ? (
                <>
                  <img
                    src={listing.images[currentImageIndex]}
                    alt={listing.title_en}
                    className="w-full h-full object-cover"
                  />
                  {listing.images.length > 1 && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 transition-colors"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </motion.button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full text-white text-sm font-semibold">
                        {currentImageIndex + 1} / {listing.images.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Image
                      width={48}
                      height={48}
                      src="/placeholder.png"
                      alt="No image"
                      className="w-12 h-12 mx-auto text-gray-400"
                    />
                    <p className="text-gray-500 dark:text-slate-400 mt-2">No images available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {listing.images && listing.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
                {listing.images.map((img, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      idx === currentImageIndex
                        ? 'border-blue-600'
                        : 'border-gray-300 dark:border-slate-700'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="mt-8 bg-gray-50 dark:bg-slate-900 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Description
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
                  {listing.description_en}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-slate-400 font-semibold mb-1">
                  Condition
                </p>
                <span
                  className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${
                    conditionColors[listing.condition] ||
                    'bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-slate-200'
                  }`}
                >
                  {listing.condition === 'like_new' ? 'Like New' : listing.condition?.toUpperCase()}
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-slate-400 font-semibold mb-1">
                  Location
                </p>
                <p className="text-gray-900 dark:text-white font-semibold flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {listing.location}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-slate-400 font-semibold mb-1">
                  Posted
                </p>
                <p className="text-gray-900 dark:text-white font-semibold flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(listing.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-slate-400 font-semibold mb-1">
                  Views
                </p>
                <p className="text-gray-900 dark:text-white font-semibold">
                  {listing.views || 0} views
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Price Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-900 dark:to-blue-800 rounded-xl p-6 text-white mb-6 sticky top-24"
            >
              <p className="text-sm font-semibold opacity-90 mb-2">Price</p>
              <h3 className="text-4xl font-black mb-4">
                {listing.currency} {listing.price.toLocaleString()}
              </h3>

              {listing.is_negotiable && (
                <div className="bg-white/20 rounded-lg px-3 py-2 text-sm font-semibold mb-4">
                  Price is negotiable
                </div>
              )}

              {listing.is_sold && (
                <div className="bg-red-500/20 rounded-lg px-3 py-2 text-sm font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Sold
                </div>
              )}

              {isOwner ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/listings/${id}/edit`)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <EditIcon className="w-5 h-5" />
                  Edit Listing
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowContactModal(true)}
                  disabled={listing.is_sold}
                  className="w-full bg-white text-[#5bc0e8] font-bold py-3 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Contact Seller
                </motion.button>
              )}
            </motion.div>

            {/* Seller Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-50 dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-slate-800"
            >
              <div className="flex items-start gap-4 mb-4">
                {resolveMediaUrl(listing.owner.avatar_url) && (
                  <img
                    src={resolveMediaUrl(listing.owner.avatar_url)!}
                    alt={listing.owner.full_name}
                    className="w-16 h-16 rounded-full object-cover bg-gray-200"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                      {listing.owner.full_name}
                    </h4>
                    {listing.owner.is_verified && (
                      <span title="Verified seller">
                        <Shield className="w-5 h-5 text-[#5bc0e8]" />
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    {listing.owner.verified_level ? listing.owner.verified_level.toUpperCase() : 'Verified'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Ratings Section */}
                {(listing.owner as any).rating && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.round((listing.owner as any).rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300 dark:text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">{(listing.owner as any).rating.toFixed(1)}</span>
                    </div>
                    {(listing.owner as any).reviews_count && (
                      <p className="text-xs text-gray-600 dark:text-slate-400">
                        Based on {(listing.owner as any).reviews_count} reviews
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{listing.owner.response_time}</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowContactModal(true)}
                  className="w-full bg-[#5bc0e8] hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send Message
                </motion.button>

                <a
                  href={`tel:${listing.owner.phone}`}
                  className="w-full bg-[#02CCFE] hover:bg-[#02CCFE] text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-center"
                >
                  <Phone className="w-4 h-4" />
                  Call Seller
                </a>
              </div>
            </motion.div>

            {/* Safety Tips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4"
            >
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-yellow-900 dark:text-yellow-200 mb-1">Safety Tips</h4>
                  <ul className="text-xs text-yellow-800 dark:text-yellow-300 space-y-1">
                    <li>• Meet in a safe, public place</li>
                    <li>• Inspect the item before paying</li>
                    <li>• Pay only after receiving the item</li>
                    <li>• Report suspicious activity</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-slate-800"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Contact {listing.owner.full_name}
            </h2>

            <textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Write your message here..."
              rows={5}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowContactModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSendMessage}
                disabled={!contactMessage.trim() || sendingMessage}
                className="flex-1 px-4 py-2 bg-[#5bc0e8] text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingMessage ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
