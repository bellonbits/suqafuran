"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingCart, Star } from 'lucide-react';

interface ProductQuickViewModalProps {
  isOpen: boolean;
  product?: {
    id: number;
    name: string;
    image: string;
    price: number;
    originalPrice: number;
    rating: number;
    reviews: number;
    description: string;
    category: string;
  };
  onClose: () => void;
  onAddToCart?: (productId: number) => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  isOpen,
  product,
  onClose,
  onAddToCart,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log('🎯 ProductQuickViewModal render', { isOpen, productName: product?.name, mounted });
  }, [isOpen, product?.name, mounted]);

  if (!product || !mounted) return null;

  const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
          />

          {/* Modal - Glovo Style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative pointer-events-auto">
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full border-2 border-#6cd4ff text-[#5bc0e8] hover:bg-#e0f7ff flex items-center justify-center shadow-lg transition-all"
              >
                <X className="w-6 h-6" />
              </motion.button>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8"
              >
                {/* Product Image */}
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center mb-6">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />

                  {/* Discount Badge - Glovo Style */}
                  {discountPercent > 0 && (
                    <div className="absolute bottom-4 left-4 bg-red-600 text-white px-3 py-2 rounded-lg font-bold text-base">
                      -{discountPercent}%
                    </div>
                  )}
                </div>

                {/* Product Title */}
                <h2 className="text-2xl font-black text-gray-900 mb-4 line-clamp-3 leading-tight">
                  {product.name}
                </h2>

                {/* Price - Glovo Style */}
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-3xl font-black text-gray-900">
                    KSh{product.price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="text-lg text-gray-400 line-through">
                      KSh{product.originalPrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    </span>
                  )}
                </div>

                {/* Description - Prominent Display */}
                <p className="text-gray-700 leading-relaxed text-base mb-8">
                  {product.description}
                </p>

                {/* Quantity Selector - Glovo Style */}
                <div className="flex items-center justify-center gap-4 mb-6 bg-gray-100 rounded-full p-2 w-fit mx-auto">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full hover:bg-gray-200 text-gray-700 font-bold text-lg transition-colors flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-bold text-gray-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full hover:bg-gray-200 text-gray-700 font-bold text-lg transition-colors flex items-center justify-center"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart Button - Glovo Style */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onAddToCart?.(product.id);
                    onClose();
                  }}
                  className="w-full bg-#6cd4ff hover:bg-#5bc0e8 text-white font-black py-4 px-6 rounded-full text-lg transition-colors shadow-lg"
                >
                  Add {quantity} for KSh{(product.price * quantity).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </motion.button>

                {/* Favorite Button - Bottom */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="w-full mt-4 py-3 rounded-full border-2 border-gray-300 hover:border-red-600 flex items-center justify-center gap-2 transition-all"
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${
                      isFavorite ? 'fill-red-600 text-red-600' : 'text-gray-400'
                    }`}
                  />
                  <span className={`font-semibold ${isFavorite ? 'text-red-600' : 'text-gray-700'}`}>
                    {isFavorite ? 'Saved' : 'Save'}
                  </span>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
