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
const FEATURED_PAGE_SIZE = 10;
const FEATURED_ROTATION_MS = 20000;
const CATEGORY_PAGE_SIZE = 10;
const CATEGORY_ROTATION_MS = 30000;

// Fisher-Yates -- unbiased, unlike the common `sort(() => Math.random() - 0.5)` shortcut.
function shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// Greedily takes up to `count` listings, skipping any whose seller is
// already represented -- keeps "Featured Products" from being dominated by
// whichever seller happens to have the most active listings.
function pickDiverseBySeller(items: Listing[], count: number): Listing[] {
    const seenSellers = new Set<number>();
    const result: Listing[] = [];
    for (const item of items) {
        const sellerId = item.seller_id ?? item.owner_id;
        if (seenSellers.has(sellerId)) continue;
        seenSellers.add(sellerId);
        result.push(item);
        if (result.length === count) break;
    }
    return result;
}

export default function HomePage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [featuredPool, setFeaturedPool] = useState<Listing[]>([]);
    const [featuredSeed, setFeaturedSeed] = useState(0);
    const [dealsPool, setDealsPool] = useState<Listing[]>([]);
    const [dealsPage, setDealsPage] = useState(0);
    const [shops, setShops] = useState<PublicShop[]>([]);
    const [categoryListings, setCategoryListings] = useState<Record<number, Listing[]>>({});
    const [categorySeed, setCategorySeed] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [cats, pool, shopsData] = await Promise.all([
                    listingsService.getCategories(),
                    // Shared pool for both "Featured Products" and "Today's Deals" --
                    // each rotates through a subset of it periodically rather than a
                    // single static page, Featured Products picking distinct sellers
                    // and Today's Deals filtering down to promo listings.
                    listingsService.getListings({ limit: 200 }),
                    listingsService.getShops({ limit: 30 }),
                ]);
                setCategories(cats || []);
                setFeaturedPool(pool || []);
                setDealsPool(shuffle((pool || []).filter((l) => getMockProductInfo(l).hasPromo)));
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

    // Re-roll Featured Products on a timer, same as Today's Deals -- each
    // tick reshuffles the pool and picks a fresh set of distinct sellers.
    useEffect(() => {
        if (featuredPool.length <= FEATURED_PAGE_SIZE) return;
        const intervalId = setInterval(() => {
            setFeaturedSeed((s) => s + 1);
        }, FEATURED_ROTATION_MS);
        return () => clearInterval(intervalId);
    }, [featuredPool.length]);

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
                // Bigger-than-displayed pool per category so there's something
                // to rotate through, same idea as the featured/deals pools above.
                listingsService.getListings({ category_id: cat.id, limit: 40 }).then((data) => [cat.id, data] as const)
            )
        )
            .then((results) => setCategoryListings(Object.fromEntries(results)))
            .catch((err) => console.error('Failed to load category listings:', err));
        // Only needs to re-run when the set of top categories actually changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topCategories.map((c) => c.id).join(',')]);

    // Re-roll each category carousel on a timer too, same idea as Featured
    // Products -- reshuffles every category's pool and picks a fresh page.
    useEffect(() => {
        const hasRotatableCategory = Object.values(categoryListings).some((l) => l.length > CATEGORY_PAGE_SIZE);
        if (!hasRotatableCategory) return;
        const intervalId = setInterval(() => {
            setCategorySeed((s) => s + 1);
        }, CATEGORY_ROTATION_MS);
        return () => clearInterval(intervalId);
    }, [categoryListings]);

    const categoryNameById = useMemo(
        () => Object.fromEntries(categories.map((c) => [c.id, c.name_en])),
        [categories]
    );

    // featuredSeed carries no data of its own -- bumping it on a timer is
    // just what forces this to re-shuffle and re-pick periodically.
    const featured = useMemo(
        () => pickDiverseBySeller(shuffle(featuredPool), FEATURED_PAGE_SIZE),
        [featuredPool, featuredSeed]
    );

    // categorySeed carries no data of its own, same as featuredSeed -- it
    // just forces a re-shuffle of every category's pool on each tick.
    const visibleCategoryListings = useMemo(
        () =>
            Object.fromEntries(
                Object.entries(categoryListings).map(([catId, listings]) => [catId, shuffle(listings).slice(0, CATEGORY_PAGE_SIZE)])
            ),
        [categoryListings, categorySeed]
    );

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
        <div className="min-h-screen bg-white dark:bg-black pb-20">
            <div className="max-w-[1440px] mx-auto">
                <div className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6">
                    <HomepageBannerRotation />
                </div>

                {/* Shop by Category */}
                <section className="mt-6">
                    <div className="w-full overflow-x-auto overscroll-x-contain hide-scrollbar">
                        <div className="flex flex-row flex-nowrap items-start gap-2 md:gap-4 pb-2 min-w-max px-4 md:px-6 lg:px-8">
                            {topCategories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/${cat.slug}`}
                                    className="flex flex-col items-center shrink-0 cursor-pointer group"
                                >
                                    <div className="relative w-11 h-11 md:w-16 md:h-16 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                                        <img
                                            src="/icons/fork.png"
                                            alt=""
                                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                        />
                                        <img
                                            src={getCategoryStickerIcon(cat.slug)}
                                            alt={cat.name_en}
                                            className="relative z-10 w-7 h-7 md:w-10 md:h-10 object-contain"
                                        />
                                    </div>
                                    <span className="text-[10px] md:text-[12px] font-bold mt-1.5 md:mt-2 tracking-tight text-center w-14 md:w-20 leading-tight block text-gray-700 dark:text-neutral-200 group-hover:text-orange-500 transition-colors">
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
                        const listings = visibleCategoryListings[cat.id];
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
