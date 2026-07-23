"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingCart } from 'lucide-react';
import { optimizeCloudinaryUrl } from '@/services/api';
import { ProductQuickViewModal } from './ProductQuickViewModal';

interface ProductCardProps {
  id: number;
  name: string;
  category: string;
  image: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews?: number;
  weight: string;
  description?: string;
  discount?: number;
  delay?: number;
  onAddToCart?: (productId: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  category,
  image,
  price,
  originalPrice,
  rating,
  reviews = 0,
  weight,
  description = 'High-quality product with excellent features.',
  discount = 0,
  delay = 0,
  onAddToCart,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const discountPercent = discount || Math.round(((originalPrice - price) / originalPrice) * 100);

  const handleCardClick = () => {
    console.log('🖱️ Product card clicked, opening modal for:', name);
    setIsModalOpen(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay }}
        whileHover={{ y: -8 }}
        onClick={handleCardClick}
        className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
        style={{ pointerEvents: 'auto' }}
      >
      {/* Image Container */}
      <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <img
          src={optimizeCloudinaryUrl(image, { width: 500, quality: 'auto', fetch_format: 'auto' }) || image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-4 left-4 bg-[#02CCFE] text-white px-4 py-2 rounded-full font-bold text-sm">
            {discountPercent}% off
          </div>
        )}

        {/* Favorite Button */}
        <motion.button
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-4 right-4 w-10 h-10 rounded-full border-2 border-gray-300 hover:border-red-600 flex items-center justify-center bg-white hover:bg-red-50 transition-all"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isFavorite ? 'fill-red-600 text-red-600' : 'text-gray-400'
            }`}
          />
        </motion.button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category & Rating */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#5bc0e8]">{category}</span>
          <div className="flex items-center gap-1">
            <span className="text-yellow-400">★</span>
            <span className="text-sm font-bold text-gray-900">{rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-gray-900 text-base mb-3 line-clamp-2 group-hover:text-[#5bc0e8] transition-colors">
          {name}
        </h3>

        {/* Weight */}
        <p className="text-sm text-gray-600 mb-4">{weight}</p>

        {/* Price */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl font-black text-gray-900">${price.toFixed(2)}</span>
          {originalPrice > price && (
            <span className="text-sm text-gray-500 line-through">${originalPrice.toFixed(2)}</span>
          )}
        </div>

        {/* Add Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(true);
          }}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-100 hover:bg-teal-200 text-#5bc0e8 font-semibold transition-colors group/btn"
        >
          <ShoppingCart className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
          Add
        </button>
      </div>
    </motion.div>

    {/* Product Quick View Modal */}
    <ProductQuickViewModal
      isOpen={isModalOpen}
      product={{
        id,
        name,
        category,
        image,
        price,
        originalPrice,
        rating,
        reviews,
        description,
      }}
      onClose={() => setIsModalOpen(false)}
      onAddToCart={(productId) => {
        onAddToCart?.(productId);
        setIsModalOpen(false);
      }}
    />
    </>
  );
};
