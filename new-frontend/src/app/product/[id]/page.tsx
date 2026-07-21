"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star, Loader, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadProductData();
  }, [params.id]);

  const loadProductData = async () => {
    try {
      const res = await api.get(`/listings/${params.id}`).catch(() => null);

      if (res?.data) {
        const data = res.data;
        setProduct({
          id: data.id,
          name: data.title_en || data.title || 'Product',
          category: data.category || 'General',
          price: data.price || 0,
          originalPrice: data.original_price || data.price || 0,
          rating: data.rating || 0,
          reviews: data.review_count || 0,
          inStock: (data.quantity || data.stock || 0) > 0,
          stock: data.quantity || data.stock || 0,
          image: data.images?.[0] || '/placeholder.png',
          description: data.description || 'No description available',
          images: data.images || ['/placeholder.png'],
          seller: data.seller || {},
          created_at: data.created_at,
        });
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 pb-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-orange-600" />
          <p className="text-gray-500">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white pt-24 pb-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <p className="text-gray-500">Product not found</p>
          <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <div className="min-h-screen bg-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-8 text-[#5bc0e8] hover:text-#5bc0e8 font-semibold"
        >
          ← Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Left - Image */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="relative h-96 lg:h-full rounded-2xl overflow-hidden bg-gray-100 shadow-xl">
              <Image src={product.image} alt={product.name} fill className="object-cover" />

              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFavorite(!isFavorite)}
                className="absolute top-6 right-6 w-12 h-12 rounded-full border-2 border-white flex items-center justify-center bg-white/80 hover:bg-red-50 transition-all backdrop-blur"
              >
                <Heart
                  className={`w-6 h-6 transition-colors ${
                    isFavorite ? 'fill-red-600 text-red-600' : 'text-gray-400'
                  }`}
                />
              </motion.button>
            </div>

            {/* Image Thumbnails */}
            <div className="flex gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    idx === 0 ? 'border-#6cd4ff' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <Image src={img} alt={`View ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Right - Details */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            {/* Category & Stock Status */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[#5bc0e8] font-semibold text-sm">{product.category}</span>
              <span className={`px-3 py-1 rounded-full font-semibold text-xs ${
                product.stock > 20
                  ? 'bg-green-100 text-green-700'
                  : product.stock > 0
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
              </span>
            </div>

            {/* Product Name */}
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">{product.name}</h1>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black text-gray-900">KSh {(product.price || 0).toLocaleString()}</span>
              {product.originalPrice > product.price && (
                <span className="text-2xl text-gray-400 line-through">KSh {(product.originalPrice || 0).toLocaleString()}</span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">{product.description}</p>

            {/* Stock Information */}
            {product.stock <= 20 && product.stock > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 font-semibold">⚠️ Only {product.stock} items left in stock</p>
              </div>
            )}

            {/* Quantity & Actions */}
            <div className="flex items-center gap-4 pt-4">
              {/* Quantity Control */}
              <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={product.stock === 0}
                  className="px-4 py-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  −
                </button>
                <span className="px-6 py-3 font-bold text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={product.stock === 0 || quantity >= product.stock}
                  className="px-4 py-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <motion.button
                whileHover={product.stock > 0 ? { scale: 1.05 } : {}}
                whileTap={product.stock > 0 ? { scale: 0.95 } : {}}
                disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {product.stock > 0 ? 'Add to cart' : 'Out of Stock'}
              </motion.button>

              {/* Buy Now Button */}
              <motion.button
                whileHover={product.stock > 0 ? { scale: 1.05 } : {}}
                whileTap={product.stock > 0 ? { scale: 0.95 } : {}}
                disabled={product.stock === 0}
                className="flex-1 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors"
              >
                {product.stock > 0 ? 'Buy now' : 'Unavailable'}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        {product.reviews > 0 && (
          <div className="border-t-2 border-gray-200 pt-12 mt-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Rating & Distribution */}
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900">Rating & Reviews</h2>

                {/* Overall Rating */}
                <div>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-5xl font-black text-gray-900">{product.rating.toFixed(1)}</span>
                    <span className="text-gray-600">out of 5</span>
                  </div>
                  <div className="flex text-yellow-400 gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-6 h-6 ${i < Math.round(product.rating) ? 'fill-yellow-400' : ''}`} />
                    ))}
                  </div>
                  <p className="text-gray-600 font-semibold">({product.reviews} Reviews)</p>
                </div>
              </div>

              {/* Review Prompt */}
              <div className="lg:col-span-2">
                <h3 className="text-2xl font-black text-gray-900 mb-6">Review this product</h3>
                <p className="text-gray-600 mb-6">Share your thoughts with other customers</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors"
                >
                  Write a customer review
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
