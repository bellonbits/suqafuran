/**
 * CampaignCarousel
 *
 * Homepage hero: Full-bleed promotional poster hero card.
 *
 * Requirements:
 * 1. The poster image occupies 100% of the hero card's width and height.
 * 2. Removed separate left-side promotional text layout.
 * 3. Removed small image container on the right.
 * 4. Uses object-fit: cover and object-position: center.
 * 5. Fills the card edge-to-edge without margins or distortion.
 * 6. Preserves carousel functionality: previous/next buttons, pagination indicators, auto-slide.
 * 7. Entire poster is clickable, linking to its configured promotional destination.
 * 8. Rounded corners and overflow clipping maintained.
 * 9. Responsive across mobile, tablet, and desktop.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SfIconChevronLeft, SfIconChevronRight } from '@storefront-ui/react';
import { clsx } from 'clsx';
import { advertisingService, HomepageBanner } from '@/services/advertising';

// ─── Campaign copy & art ─────────────────────────────────────────────────────
interface Campaign {
  eyebrow: string;
  headline: [string, string];
  description: string;
  cta: string;
  image?: string;
  focus?: string;
}

const CAMPAIGNS: Record<string, Campaign> = {
  fashion: {
    eyebrow: 'Trending now',
    headline: ['Fresh', 'Fashion'],
    description: 'Styles for Every Day',
    cta: 'Shop Fashion',
    image: '/categories/hero/fashion.webp',
    focus: '50% 20%',
  },
  'health-beauty': {
    eyebrow: 'Look & feel your best',
    headline: ['Beauty', 'Essentials'],
    description: 'Care Made for You',
    cta: 'Explore Beauty',
    image: '/categories/hero/health-beauty.webp?v=2',
  },
  'household-items': {
    eyebrow: 'Trending now',
    headline: ['Everyday', 'Essentials'],
    description: 'Household Items',
    cta: 'Shop Household',
    image: '/categories/hero/household-items.webp?v=2',
  },
  'food-groceries': {
    eyebrow: 'Fresh picks',
    headline: ['Fresh', 'Food & Groceries'],
    description: 'Everyday Essentials',
    cta: 'Shop Groceries',
    image: '/categories/hero/food-groceries.webp?v=2',
  },
  electronics: {
    eyebrow: 'Power your day',
    headline: ['Smart', 'Electronics'],
    description: 'Tech for Everyday Life',
    cta: 'Shop Electronics',
    image: '/categories/hero/electronics.webp?v=2',
  },
  vehicles: {
    eyebrow: 'Find your next ride',
    headline: ['Cars', '& Vehicles'],
    description: 'From Everyday Cars to More',
    cta: 'Explore Vehicles',
    image: '/categories/hero/vehicles.webp?v=2',
  },
  'leisure-sports': {
    eyebrow: 'Move. Play. Enjoy.',
    headline: ['Leisure', '& Sports'],
    description: 'Gear for Every Adventure',
    cta: 'Explore Sports',
  },
};

export interface CampaignCategory {
  id: number;
  slug: string;
  name: string;
  image_url?: string;
  active_listing_count?: number;
}

interface Slide {
  category: CampaignCategory;
  campaign: Campaign;
  image?: string;
  isCustomPromo?: boolean;
  banner?: HomepageBanner;
  bannerLink?: string;
}

function optimiseRemote(url?: string): string | undefined {
  if (!url) return url;
  const marker = '/image/upload/';
  if (url.includes('res.cloudinary.com') && url.includes(marker) && !url.includes('/c_fill')) {
    return url.replace(marker, `${marker}c_fill,g_auto,w_1200,h_600,q_auto,f_auto/`);
  }
  return url;
}

export function buildCampaignSlides(
  categories: CampaignCategory[],
  customBanners: HomepageBanner[] = []
): Slide[] {
  // Map custom promotional banners to high-priority deal slides
  const promoSlides: Slide[] = customBanners.map((banner) => {
    return {
      category: {
        id: -1000 - banner.id,
        slug: (banner.button_link || '/shops').replace(/^\//, ''),
        name: banner.title,
        active_listing_count: undefined,
      },
      campaign: {
        eyebrow: 'Special Promotion & Deals',
        headline: [banner.title, banner.subtitle || 'Exclusive Deal'],
        description: banner.subtitle || 'Discover exclusive promotional deals on Suqafuran',
        cta: banner.button_text || 'Shop Deals',
        image: banner.image_url,
      },
      image: banner.image_url,
      isCustomPromo: true,
      banner,
      bannerLink: banner.button_link || '/shops',
    };
  });

  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const categorySlides: Slide[] = Object.entries(CAMPAIGNS).map(([slug, campaign]) => {
    const category = bySlug.get(slug) || {
      id: 0,
      slug,
      name: campaign.headline.join(' '),
      active_listing_count: undefined,
    };
    return { 
      category, 
      campaign, 
      image: campaign.image ?? optimiseRemote(category.image_url),
      isCustomPromo: false,
    };
  });

  // When promotional banners are uploaded, they take over the hero carousel
  if (promoSlides.length > 0) {
    return promoSlides;
  }
  return categorySlides;
}

// ─── Carousel Configuration ──────────────────────────────────────────────────
const SLIDE_MS = 6000;
const SWIPE_PX = 50;

export const CampaignCarousel: React.FC<{ categories: CampaignCategory[] }> = ({ categories }) => {
  const [customBanners, setCustomBanners] = useState<HomepageBanner[]>(() => {
    try {
      const cached = localStorage.getItem('suqafuran_custom_banners');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let mounted = true;
    advertisingService.getActiveBanners().then((banners) => {
      if (mounted && Array.isArray(banners)) {
        setCustomBanners(banners);
        try {
          localStorage.setItem('suqafuran_custom_banners', JSON.stringify(banners));
        } catch {}
      }
    }).catch(() => {});

    const onUpdate = () => {
      try {
        const cached = localStorage.getItem('suqafuran_custom_banners');
        if (cached) setCustomBanners(JSON.parse(cached));
      } catch {}
    };
    window.addEventListener('suqafuran_banners_updated', onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('suqafuran_banners_updated', onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, []);

  const slides = buildCampaignSlides(categories, customBanners);
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  const count = slides.length;
  const paused = hovered || focused || pageHidden || !!reduceMotion;

  const go = useCallback((next: number, dir: 1 | -1) => {
    if (count === 0) return;
    setDirection(dir);
    setIndex(((next % count) + count) % count);
  }, [count]);
  const next = useCallback(() => go(index + 1, 1), [go, index]);
  const prev = useCallback(() => go(index - 1, -1), [go, index]);

  // Autoplay timer
  useEffect(() => {
    if (paused || count < 2) return;
    const id = setTimeout(next, SLIDE_MS);
    return () => clearTimeout(id);
  }, [paused, count, index, next]);

  useEffect(() => {
    const onVis = () => setPageHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Pre-load the next slide's image so transitions are instant
  useEffect(() => {
    const upcoming = slides[(index + 1) % Math.max(count, 1)]?.image;
    if (upcoming) new Image().src = upcoming;
  }, [index, count, slides]);

  const safeIndex = count > 0 ? index % count : 0;
  const currentSlide = slides[safeIndex];

  // Track impressions for promotional deal banners
  const trackedImpressions = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (currentSlide?.isCustomPromo && currentSlide.banner?.id) {
      const bId = currentSlide.banner.id;
      if (!trackedImpressions.current.has(bId)) {
        trackedImpressions.current.add(bId);
        advertisingService.trackBannerImpression(bId).catch(() => {});
      }
    }
  }, [currentSlide]);

  const handleBannerAction = (banner?: HomepageBanner) => {
    if (banner?.id) {
      advertisingService.trackBannerClick(banner.id).catch(() => {});
    }
  };

  if (count === 0) {
    return (
      <div className="relative w-full h-[200px] min-[380px]:h-[220px] sm:h-[350px] md:h-[400px] lg:h-[430px] rounded-2xl bg-slate-100 dark:bg-neutral-900 animate-pulse" />
    );
  }

  const { category, image, isCustomPromo, banner, bannerLink } = currentSlide;

  const variants = {
    enter: (dir: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * 50 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * -50 }),
  };

  const renderPosterContent = () => {
    const targetUrl = bannerLink || `/${category.slug}`;
    const isExternal = targetUrl.startsWith('http');

    const posterImage = image ? (
      <picture className="w-full h-full block">
        {banner?.mobile_image_url && (
          <source media="(max-width: 639px)" srcSet={banner.mobile_image_url} />
        )}
        <img
          src={image}
          alt={banner?.title || category.name || 'Suqafuran Promotion'}
          draggable={false}
          loading={safeIndex === 0 ? 'eager' : 'lazy'}
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          className="w-full h-full object-cover object-center select-none transition-transform duration-700 group-hover:scale-[1.01]"
        />
      </picture>
    ) : (
      <div className="w-full h-full bg-gradient-to-tr from-[#0078E8] via-indigo-600 to-[#FF9600] flex flex-col items-center justify-center text-white p-6 text-center">
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight">
          {banner?.title || category.name}
        </h2>
        <p className="text-sm sm:text-lg text-white/90 mt-2 max-w-lg">
          {banner?.subtitle || 'Explore verified shops and best deals on Suqafuran'}
        </p>
      </div>
    );

    if (isExternal) {
      return (
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleBannerAction(banner)}
          className="absolute inset-0 w-full h-full block cursor-pointer group"
          aria-label={banner?.title || category.name || 'Promotional Poster'}
        >
          {posterImage}
        </a>
      );
    }

    return (
      <Link
        to={targetUrl}
        onClick={() => handleBannerAction(banner)}
        className="absolute inset-0 w-full h-full block cursor-pointer group"
        aria-label={banner?.title || category.name || 'Promotional Poster'}
      >
        {posterImage}
      </Link>
    );
  };

  return (
    <section
      ref={regionRef}
      aria-roledescription="carousel"
      aria-label="Featured promotions and deals"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false); }}
      className="relative w-full h-[200px] min-[380px]:h-[220px] sm:h-[350px] md:h-[400px] lg:h-auto lg:min-h-[420px] lg:self-stretch overflow-hidden rounded-2xl border border-gray-100 dark:border-neutral-800 bg-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0078E8] shadow-sm select-none"
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={category.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: reduceMotion ? 0.15 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          drag={count > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => {
            if (info.offset.x < -SWIPE_PX) next();
            else if (info.offset.x > SWIPE_PX) prev();
          }}
          role="group"
          aria-roledescription="slide"
          aria-label={`${safeIndex + 1} of ${count}: ${banner?.title || category.name}`}
          className="absolute inset-0 w-full h-full touch-pan-y"
        >
          {renderPosterContent()}
        </motion.div>
      </AnimatePresence>

      {/* ── Carousel Controls: Layered floating controls ── */}
      {count > 1 && (
        <>
          {/* Previous Arrow Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous slide"
            className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <SfIconChevronLeft size="sm" className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>

          {/* Next Arrow Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              next();
            }}
            aria-label="Next slide"
            className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <SfIconChevronRight size="sm" className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>

          {/* Pagination Indicators Pill */}
          <div className="absolute inset-x-0 bottom-2.5 sm:bottom-4 z-20 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15 pointer-events-auto shadow-md">
              {slides.map((s, i) => {
                const active = i === safeIndex;
                return (
                  <button
                    key={s.category.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      go(i, i > safeIndex ? 1 : -1);
                    }}
                    className="p-0.5 group cursor-pointer"
                  >
                    <span
                      className={clsx(
                        'block h-1.5 sm:h-2 rounded-full transition-all duration-300',
                        active ? 'w-6 sm:w-7 bg-white shadow-sm' : 'w-1.5 sm:w-2 bg-white/40 group-hover:bg-white/70'
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Screen-reader announcement */}
      <p className="sr-only" aria-live={paused ? 'polite' : 'off'}>
        {`Slide ${safeIndex + 1} of ${count}: ${banner?.title || category.name}`}
      </p>
    </section>
  );
};
