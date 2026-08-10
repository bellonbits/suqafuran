"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Loader2, Flame } from 'lucide-react';
import { listingsService, PublicShop } from '@/services/listings';
import type { Listing } from '@/types';
import { HomepageBannerRotation } from '@/components/ads/HomepageBannerRotation';
import { ProductCard } from '@/components/features/ProductCard';
import { GlovoShopCard } from '@/components/shared/GlovoShopCard';
import { ProductCarouselSection } from '@/components/shared/ProductCarouselSection';
import { ShopModeToggle } from '@/components/shared/ShopModeToggle';
import { getCategoryStickerIcon } from '@/lib/categoryIcons';
import { getMockProductInfo } from '@/lib/mockProductInfo';

interface Category {
    id: number;
    name_en: string;
    slug: string;
    active_listing_count?: number;
}

const PRODUCT_CARD_WIDTH = 'w-[160px] sm:w-[190px] shrink-0';
const SHOP_CARD_WIDTH = 'w-[220px] sm:w-[260px] shrink-0';
const TOP_CATEGORY_COUNT = 5;
const DEALS_PAGE_SIZE = 10;
const DEALS_ROTATION_MS = 20000;

// Fisher-Yates -- unbiased, unlike the common `sort(() => Math.random() - 0.5)` shortcut.
function shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export default function HomePage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [listingPool, setListingPool] = useState<Listing[]>([]);
    const [dealsPool, setDealsPool] = useState<Listing[]>([]);
    const [dealsPage, setDealsPage] = useState(0);
    const [shops, setShops] = useState<PublicShop[]>([]);
    const [categoryListings, setCategoryListings] = useState<Record<number, Listing[]>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [cats, pool, dealsCandidates, shopsData] = await Promise.all([
                    listingsService.getCategories(),
                    // Featured Products only ever needs one screenful.
                    listingsService.getListings({ limit: 10 }),
                    // Today's Deals needs a much bigger pool than it displays at
                    // once -- it rotates through DEALS_PAGE_SIZE at a time every
                    // DEALS_ROTATION_MS, cycling through everything eligible
                    // (not just whatever the first page happened to contain).
                    listingsService.getListings({ limit: 200 }),
                    listingsService.getShops({ limit: 30 }),
                ]);
                setCategories(cats || []);
                setListingPool(shuffle(pool || []));
                setDealsPool(shuffle((dealsCandidates || []).filter((l) => getMockProductInfo(l).hasPromo)));
                setShops(shopsData?.shops || []);
            } catch (err) {
                console.error('Failed to load homepage data:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Advance the deals window on a timer so it keeps cycling through the
    // whole pool for as long as someone stays on the page.
    useEffect(() => {
        if (dealsPool.length <= DEALS_PAGE_SIZE) return;
        const totalPages = Math.ceil(dealsPool.length / DEALS_PAGE_SIZE);
        const intervalId = setInterval(() => {
            setDealsPage((p) => (p + 1) % totalPages);
        }, DEALS_ROTATION_MS);
        return () => clearInterval(intervalId);
    }, [dealsPool.length]);

    // Real listing volume, not shop count -- this drives both the category
    // icon row and which categories get their own product carousel below.
    const topCategories = useMemo(
        () => [...categories].sort((a, b) => (b.active_listing_count ?? 0) - (a.active_listing_count ?? 0)),
        [categories]
    );

    useEffect(() => {
        if (topCategories.length === 0) return;
        const top = topCategories.slice(0, TOP_CATEGORY_COUNT);
        Promise.all(
            top.map((cat) =>
                listingsService.getListings({ category_id: cat.id, limit: 10 }).then((data) => [cat.id, data] as const)
            )
        )
            .then((results) => setCategoryListings(Object.fromEntries(results)))
            .catch((err) => console.error('Failed to load category listings:', err));
        // Only needs to re-run when the set of top categories actually changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topCategories.map((c) => c.id).join(',')]);

    const categoryNameById = useMemo(
        () => Object.fromEntries(categories.map((c) => [c.id, c.name_en])),
        [categories]
    );

    const featured = listingPool;

    const deals = useMemo(
        () => dealsPool.slice(dealsPage * DEALS_PAGE_SIZE, dealsPage * DEALS_PAGE_SIZE + DEALS_PAGE_SIZE),
        [dealsPool, dealsPage]
    );

    const popularShops = useMemo(
        () => [...shops].sort((a, b) => (b.listing_count ?? 0) - (a.listing_count ?? 0)).slice(0, 10),
        [shops]
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 pb-20">
            <div className="max-w-[1440px] mx-auto">
                <div className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6">
                    <HomepageBannerRotation />
                </div>

                <div className="px-4 md:px-6 lg:px-8 mt-4">
                    <ShopModeToggle active="products" />
                </div>

                {/* Shop by Category */}
                <section className="mt-6">
                    <div className="w-full overflow-x-auto overscroll-x-contain hide-scrollbar">
                        <div className="flex flex-row flex-nowrap items-start gap-4 pb-2 min-w-max px-4 md:px-6 lg:px-8">
                            {topCategories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/${cat.slug}`}
                                    className="flex flex-col items-center shrink-0 cursor-pointer group"
                                >
                                    <div className="relative w-16 h-16 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                                        <img
                                            src="/icons/fork.png"
                                            alt=""
                                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                        />
                                        <img
                                            src={getCategoryStickerIcon(cat.slug)}
                                            alt={cat.name_en}
                                            className="relative z-10 w-10 h-10 object-contain"
                                        />
                                    </div>
                                    <span className="text-[12px] font-bold mt-2 tracking-tight text-center w-20 leading-tight block text-gray-700 dark:text-slate-300 group-hover:text-orange-500 transition-colors">
                                        {cat.name_en}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="px-4 md:px-6 lg:px-8">
                    {featured.length > 0 && (
                        <ProductCarouselSection title="Featured Products">
                            {featured.map((listing) => (
                                <div key={listing.id} className={PRODUCT_CARD_WIDTH}>
                                    <ProductCard listing={listing} categoryName={categoryNameById[listing.category_id]} />
                                </div>
                            ))}
                        </ProductCarouselSection>
                    )}

                    {deals.length > 0 && (
                        <ProductCarouselSection title="Today's Deals" icon={<Flame className="w-5 h-5 text-[#e81f44]" />}>
                            {deals.map((listing) => {
                                const { discountPercent, originalPrice } = getMockProductInfo(listing);
                                return (
                                    <div key={listing.id} className={PRODUCT_CARD_WIDTH}>
                                        <ProductCard
                                            listing={listing}
                                            discountPercent={discountPercent}
                                            originalPrice={originalPrice}
                                            categoryName={categoryNameById[listing.category_id]}
                                        />
                                    </div>
                                );
                            })}
                        </ProductCarouselSection>
                    )}

                    {popularShops.length > 0 && (
                        <ProductCarouselSection title="Popular Shops" viewAllHref="/shops">
                            {popularShops.map((shop, i) => (
                                <div key={shop.id} className={SHOP_CARD_WIDTH}>
                                    <GlovoShopCard shop={shop} index={i} hideRating />
                                </div>
                            ))}
                        </ProductCarouselSection>
                    )}

                    {topCategories.slice(0, TOP_CATEGORY_COUNT).map((cat) => {
                        const listings = categoryListings[cat.id];
                        if (!listings || listings.length === 0) return null;
                        return (
                            <ProductCarouselSection key={cat.id} title={cat.name_en} viewAllHref={`/${cat.slug}`}>
                                {listings.map((listing) => (
                                    <div key={listing.id} className={PRODUCT_CARD_WIDTH}>
                                        <ProductCard listing={listing} categoryName={cat.name_en} />
                                    </div>
                                ))}
                            </ProductCarouselSection>
                        );
                    })}

                    <div className="flex justify-center mt-10">
                        <Link
                            href="/shops"
                            className="px-6 py-3 rounded-full border-2 border-orange-500 text-orange-500 font-bold text-sm hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
                        >
                            View All Shops →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
