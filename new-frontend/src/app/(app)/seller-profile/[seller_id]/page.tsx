"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/services/api';
import { motion } from 'framer-motion';
import { Star, MapPin, Phone, Mail, Clock, Package, Award } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  review_text: string;
  reviewer_name: string;
  is_verified_purchase: boolean;
  created_at: string;
}

interface SellerStats {
  seller_id: string;
  seller_name: string;
  total_ratings: number;
  average_rating: number;
  rating_distribution: Record<string, number>;
  verified_purchases: number;
  percentage_recommended: number;
}

export default function SellerProfilePage() {
  const params = useParams();
  const seller_id = params.seller_id as string;

  const [seller, setSeller] = useState<any>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerData();
  }, [seller_id]);

  const fetchSellerData = async () => {
    try {
      setLoading(true);
      const [sellerRes, statsRes, reviewsRes] = await Promise.all([
        api.get(`/sellers/${seller_id}`),
        api.get(`/ratings/seller/${seller_id}/stats`),
        api.get(`/ratings/seller/${seller_id}/reviews`)
      ]);

      setSeller(sellerRes.data);
      setStats(statsRes.data);
      setReviews(reviewsRes.data);
    } catch (error) {
      console.error('Failed to fetch seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Seller Header */}
        {seller && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
                  {seller.shop_name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{seller.owner_name}</p>
              </div>
              {stats && (
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-4xl font-black text-yellow-500">{stats.average_rating}</div>
                    <div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= Math.round(stats.average_rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {stats.total_ratings} review{stats.total_ratings !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-green-600">
                    {stats.percentage_recommended}% would recommend
                  </p>
                </div>
              )}
            </div>

            {/* Seller Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seller.phone && (
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <Phone className="w-5 h-5 text-[#6cd4ff]" />
                  <span>{seller.phone}</span>
                </div>
              )}
              {seller.email && (
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <Mail className="w-5 h-5 text-[#6cd4ff]" />
                  <span>{seller.email}</span>
                </div>
              )}
              {seller.shop_address && (
                <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300 md:col-span-2">
                  <MapPin className="w-5 h-5 text-[#6cd4ff]" />
                  <span>{seller.shop_address}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rating Stats */}
        {stats && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 mb-8 shadow-sm">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-500" />
              Rating Breakdown
            </h2>

            <div className="space-y-4">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.rating_distribution[rating.toString()] || 0;
                const percentage = stats.total_ratings > 0 ? (count / stats.total_ratings) * 100 : 0;

                return (
                  <div key={rating} className="flex items-center gap-4">
                    <div className="flex items-center gap-1 w-20">
                      <span className="text-sm font-bold">{rating}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-yellow-400 h-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">
            Customer Reviews ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-b border-gray-200 dark:border-slate-800 pb-6 last:border-0"
                >
                  {/* Review Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{review.reviewer_name}</p>
                      {review.is_verified_purchase && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded inline-block mt-1">
                          ✓ Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Review Text */}
                  {review.review_text && (
                    <p className="text-gray-700 dark:text-gray-300 mb-3">{review.review_text}</p>
                  )}

                  {/* Review Date */}
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
