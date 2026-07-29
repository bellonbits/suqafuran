"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck, Store, MapPin, Star, Package, X, ChevronLeft, ChevronRight, Percent, ThumbsUp } from 'lucide-react';
import { listingsService, PublicShop } from '@/services/listings';
import api, { resolveMediaUrl } from '@/services/api';
import { useLocationStore } from '@/store/useLocation';
import { MARKET_TO_CITY } from '@/constants/markets';

interface Category {
  id: number;
  name_en: string;
  name_so?: string;
  slug: string;
  icon_name?: string;
  image_url?: string;
  active_listing_count?: number;
}

// ─── Category Stickers Icon Mapping ──────────────────────────────────────────
const CATEGORY_ICONS: Record<string, string> = {
  'food-groceries':      '/icons/fruits.png',
  'grocery':             '/icons/fruits.png',
  'agriculture-food':    '/icons/fruits.png',
  'health-beauty':       '/icons/beauty.png',
  'beauty-personal-care':'/icons/beauty.png',
  'leisure-sports':      '/icons/soccer-ball.png',
  'clothing-shoes':      '/icons/street-market.png',
  'electronics':         '/icons/keyboard.png',
  'household-items':     '/icons/households.png',
  'vehicles':            '/icons/classic-car.png',
  'livestock':           '/icons/cow.png',
  'property':            '/icons/for-rent.png',
  'services':            '/icons/24-hours-support.png',
  'commercial-equipment':'/icons/container.png',
  'land-farms':          '/icons/farm.png',
  'repair-construction': '/icons/repair.png',
  'jobs':                '/icons/job-search.png',
  'mobiles':             '/icons/mobile-app.png',
  'phones':              '/icons/mobile-app.png',
  'babies-kids':         '/icons/baby.png',
};


// Helper function to build category breadcrumb path
function getCategoryBreadcrumb(category: Category): string {
  // If category has a slug with multiple parts, split them
  if (category.slug && category.slug.includes('-')) {
    const parts = category.slug.split('-').map(p => 
      p.charAt(0).toUpperCase() + p.slice(1)
    );
    return parts.join(' > ');
  }
  // Otherwise just use the category name
  return category.name_en || 'Products';
}


function getCategoryStickerIcon(slug: string): string {
  const normalized = slug.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return icon;
    }
  }
  return '/icons/street-market.png';
}


function getShopBanner(shop: PublicShop): string | null {
  // Prioritize custom shop page banner (Cloudinary URL)
  if (shop.shop_page_banner && typeof shop.shop_page_banner === 'string') {
    if (shop.shop_page_banner.startsWith('http')) return shop.shop_page_banner;
    if (shop.shop_page_banner.startsWith('data:')) return shop.shop_page_banner;
    const resolved = resolveMediaUrl(shop.shop_page_banner);
    if (resolved) return resolved;
  }

  // Fallback to first listing image
  if (shop.cover_image && typeof shop.cover_image === 'string') {
    // If it's already a data URL (base64), use it directly
    if (shop.cover_image.startsWith('data:')) return shop.cover_image;
    // Otherwise resolve it
    const resolved = resolveMediaUrl(shop.cover_image);
    if (resolved) return resolved;
  }

  // No fallback — return null if no custom banner or cover image
  return null;
}


// ─── Promotional Banner Carousel ───────────────────────────────────────────
