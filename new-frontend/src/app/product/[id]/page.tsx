"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [selectedWeight, setSelectedWeight] = useState('500g');
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  // Mock product data - in real app, fetch from API using params.id
  const product = {
    id: parseInt(params.id),
    name: 'Fresh Orange',
    category: 'Fruits',
    price: 12.0,
    originalPrice: 15.0,
    rating: 5.0,
    reviews: 245,
    inStock: true,
    image: '/hero_skincare.png',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore.',
    images: ['/hero_skincare.png', '/hero_clothes.png', '/seller_hero.png'],
    weights: ['500g', '1 Kg', '2 Kg', '5 Kg'],
    ratingDistribution: {
      5: 180,
      4: 45,
      3: 15,
      2: 4,
      1: 1,
    },
  };

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
            {/* Category & In Stock */}
            <div className="flex items-center gap-3">
              <span className="text-[#5bc0e8] font-semibold text-sm">{product.category}</span>
              <span className="px-3 py-1 bg-teal-100 text-#5bc0e8 rounded-full font-semibold text-xs">
                In Stock
              </span>
            </div>

            {/* Product Name */}
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">{product.name}</h1>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black text-gray-900">${product.price.toFixed(2)}</span>
              <span className="text-2xl text-gray-400 line-through">${product.originalPrice.toFixed(2)}</span>
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">{product.description}</p>

            {/* Weight Selection */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Weight</h3>
              <div className="flex gap-3 flex-wrap">
                {product.weights.map((weight) => (
                  <button
                    key={weight}
                    onClick={() => setSelectedWeight(weight)}
                    className={`px-6 py-2.5 rounded-lg font-bold transition-all ${
                      selectedWeight === weight
                        ? 'bg-green-700 text-white'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {weight}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity & Actions */}
            <div className="flex items-center gap-4 pt-4">
              {/* Quantity Control */}
              <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 hover:bg-gray-100 transition-colors"
                >
                  −
                </button>
                <span className="px-6 py-3 font-bold text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 hover:bg-gray-100 transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to cart
              </motion.button>

              {/* Buy Now Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-3 px-6 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold transition-colors"
              >
                Buy now
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div className="border-t-2 border-gray-200 pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Rating & Distribution */}
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-gray-900">Rating & Reviews</h2>

              {/* Overall Rating */}
              <div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-5xl font-black text-gray-900">{product.rating}</span>
                  <span className="text-gray-600">out of 5</span>
                </div>
                <div className="flex text-yellow-400 gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 font-semibold">({product.reviews} Reviews)</p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-600 w-12">{stars} Star</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{
                          width: `${(product.ratingDistribution[stars as keyof typeof product.ratingDistribution] / product.reviews) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Form */}
            <div className="lg:col-span-2">
              <h3 className="text-2xl font-black text-gray-900 mb-6">Review this product</h3>
              <p className="text-gray-600 mb-6">Share your thoughts with other customers</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 border-2 border-gray-900 text-gray-900 font-bold rounded-full hover:bg-gray-100 transition-colors"
              >
                Write a customer review
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
