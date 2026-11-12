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
import { resolveMediaUrl, optimizeCloudinaryUrl } from '@/services/api';

const ORANGE = '#FF9600';

/** The logo's orange smile, reused as the campaign's signature mark. */
const Swoosh: React.FC<{ className?: string; strokeWidth?: number }> = ({ className, strokeWidth = 7 }) => (
  <svg viewBox="0 0 200 40" fill="none" preserveAspectRatio="none" className={className} aria-hidden>
    <path d="M4 10 C 50 42, 150 42, 196 8" stroke={ORANGE} strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M182 4 L196 8 L188 20" stroke={ORANGE} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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
  mobileImage?: string;
  isCustomPromo?: boolean;
  banner?: HomepageBanner;
  bannerLink?: string;
}

function getOptimizedBannerUrl(rawUrl?: string, width = 1200): string | undefined {
  if (!rawUrl) return undefined;
  const resolved = resolveMediaUrl(rawUrl) || rawUrl;
  if (!resolved) return undefined;

  // Never apply on-the-fly transformations to GIFs -- Cloudinary returns 400 Bad Request
  if (/\.gif($|\?)/i.test(resolved)) {
    return resolved;
  }

  if (resolved.includes('cloudinary.com')) {
    const marker = '/image/upload/';
    const index = resolved.indexOf(marker);
    if (index !== -1) {
      const prefix = resolved.substring(0, index + marker.length);
      let rest = resolved.substring(index + marker.length);
      // Strip any conflicting manual transformation before version segment if present
      const versionMatch = rest.match(/v\d+\//);
      if (versionMatch && versionMatch.index !== undefined && versionMatch.index > 0) {
        rest = rest.substring(versionMatch.index);
      }
      return `${prefix}c_fill,g_auto,w_${width},q_auto,f_auto/${rest}`;
    }
    return optimizeCloudinaryUrl(resolved, { width, quality: 'auto', fetch_format: 'auto' }) || resolved;
  }
  return resolved;
}

export function buildCampaignSlides(
  categories: CampaignCategory[],
  customBanners: HomepageBanner[] = []
): Slide[] {
  // Map custom promotional banners to high-priority deal slides
  const promoSlides: Slide[] = customBanners.map((banner) => {
    const rawTitle = (banner.title || 'Special Promotion').trim();
    let h1 = rawTitle;
    let h2 = '';
    const words = rawTitle.split(/\s+/);
    if (words.length > 1) {
      const mid = Math.ceil(words.length / 2);
      h1 = words.slice(0, mid).join(' ');
      h2 = words.slice(mid).join(' ');
    } else {
      h2 = banner.subtitle ? 'Exclusive' : 'Deal';
    }

    const desktopImg = getOptimizedBannerUrl(banner.image_url, 1200);
    const mobileImg = getOptimizedBannerUrl(banner.mobile_image_url || banner.image_url, 750);

    return {
      category: {
        id: -1000 - banner.id,
        slug: (banner.button_link || '/shops').replace(/^\//, ''),
        name: banner.title,
        active_listing_count: undefined,
      },
      campaign: {
        eyebrow: 'Special Promotion & Deals',
        headline: [h1, h2],
        description: banner.subtitle || 'Discover exclusive promotional deals on Suqafuran',
        cta: banner.button_text || 'Shop Deals',
        image: desktopImg,
      },
      image: desktopImg,
      mobileImage: mobileImg,
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
    const catImage = campaign.image ?? getOptimizedBannerUrl(category.image_url, 800);
    return { 
      category, 
      campaign, 
      image: catImage,
      mobileImage: catImage,
      isCustomPromo: false,
    };
  });

  // When promotional banners are available, display ONLY those banners so the hero
  // reflects the exact campaigns configured by the administrator. Fallback to category
  // slides only when no custom promotional banners exist.
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
      const cached = localStorage.getItem('suqafuran_hero_banners') || localStorage.getItem('suqafuran_custom_banners');
      if (!cached) return [];
      const parsed = JSON.parse(cached);
      if (!Array.isArray(parsed)) return [];
      const heroOnly = parsed.filter((b: HomepageBanner) => b.placement === 'hero' || b.placement === 'all');
      return heroOnly;
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let mounted = true;

    const fetchHeroBanners = async () => {
      try {
        const banners = await advertisingService.getActiveBanners('hero');
        if (mounted && Array.isArray(banners)) {
          const heroBanners = banners.filter((b) => b.placement === 'hero' || b.placement === 'all');
          setCustomBanners(heroBanners);
          try {
            localStorage.setItem('suqafuran_custom_banners', JSON.stringify(banners));
            localStorage.setItem('suqafuran_hero_banners', JSON.stringify(heroBanners));
          } catch {}
        }
      } catch (err) {
        console.error('Failed to load hero banners', err);
      }
    };

    fetchHeroBanners();

    const onUpdate = () => {
      fetchHeroBanners();
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

  // Preload all banner images immediately on mount and on slide updates so transitions are instantaneous
  useEffect(() => {
    if (!slides || slides.length === 0) return;
    slides.forEach((s) => {
      if (s.image) {
        const img = new Image();
        img.src = s.image;
      }
      if (s.mobileImage && s.mobileImage !== s.image) {
        const mImg = new Image();
        mImg.src = s.mobileImage;
      }
    });
  }, [slides]);

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
      <div className="relative w-full aspect-[3/2] sm:aspect-auto sm:h-[350px] md:h-[400px] lg:h-auto lg:min-h-[420px] rounded-2xl bg-slate-100 dark:bg-neutral-900 animate-pulse" />
    );
  }

  const { category, campaign, image, mobileImage, isCustomPromo, banner, bannerLink } = currentSlide;

  const safeCampaign: Campaign = campaign || {
    eyebrow: 'Verified Deals',
    headline: [category?.name || 'Exclusive', 'Collection'],
    description: 'Explore quality products and verified sellers on Suqafuran',
    cta: 'Shop Now',
  };

  const variants = {
    enter: (dir: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * 50 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * -50 }),
  };

  const renderPosterContent = () => {
    const targetUrl = bannerLink || `/${category.slug}`;
    const isExternal = targetUrl.startsWith('http');

    const innerContent = isCustomPromo ? (
      /* ── Custom Promotional Flyer / Banner (Clean graphic display without overlaid buttons) ── */
      image ? (
        <div className="relative w-full h-full">
          <picture className="w-full h-full block">
            {mobileImage && (
              <source media="(max-width: 639px)" srcSet={mobileImage} />
            )}
            <img
              src={image}
              alt={banner?.title || category.name || 'Suqafuran Promotion'}
              draggable={false}
              loading={safeIndex === 0 ? 'eager' : 'lazy'}
              decoding="async"
              {...(safeIndex === 0 ? ({ fetchpriority: 'high' } as any) : {})}
              onError={(e) => {
                const target = e.currentTarget;
                if (banner?.image_url && target.src !== banner.image_url) {
                  target.src = banner.image_url;
                }
              }}
              className="w-full h-full object-cover object-center select-none transition-transform duration-700 group-hover:scale-[1.01]"
            />
          </picture>
        </div>
      ) : (
        <div className="w-full h-full bg-gradient-to-tr from-[#0078E8] via-indigo-600 to-[#FF9600] flex flex-col items-center justify-center text-white p-6 text-center">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight">
            {banner?.title || category.name}
          </h2>
          <p className="text-sm sm:text-lg text-white/90 mt-2 max-w-lg">
            {banner?.subtitle || 'Explore verified shops and best deals on Suqafuran'}
          </p>
        </div>
      )
    ) : (
      /* ── Outlined Category Campaign Banner with Headline, Swoosh & Button ── */
      <div className="relative w-full h-full grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center px-4 sm:px-8 lg:px-12 py-4 bg-gradient-to-br from-white via-[#F5FAFF] to-[#E8F4FF] dark:from-neutral-950 dark:via-neutral-950 dark:to-[#06203d]">
        {/* Soft background glow */}
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 w-[360px] h-[360px] rounded-full bg-[#00BFFF]/10 blur-2xl" />

        {/* Left Column: Eyebrow, Outlined Headline, Description, CTA */}
        <div className="relative z-10 flex flex-col justify-center pr-2">
          <p className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[#0078E8] dark:text-[#4DB0FF]">
            <span className="w-3.5 sm:w-6 h-[3px] rounded-full bg-[#FF9600] shrink-0" aria-hidden />
            {safeCampaign.eyebrow}
          </p>

          <h2 className="mt-1.5 sm:mt-3 font-black uppercase tracking-tight leading-[0.95] text-[clamp(17px,4.5vw,25px)] sm:text-[34px] lg:text-[40px] xl:text-[44px]">
            <span className="block text-[#0A1F44] dark:text-white truncate">{safeCampaign.headline[0]}</span>
            <span className="relative inline-block text-[#0078E8] dark:text-[#4DB0FF] truncate max-w-full">
              {safeCampaign.headline[1]}
              <Swoosh className="absolute left-0 -bottom-1.5 sm:-bottom-3.5 w-full h-2 sm:h-3.5" />
            </span>
          </h2>

          <p className="hidden sm:block mt-3 sm:mt-4 text-xs sm:text-sm lg:text-base text-gray-600 dark:text-neutral-300 line-clamp-2 max-w-sm">
            {safeCampaign.description}
          </p>

          <div className="mt-3 sm:mt-5 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 h-8 sm:h-10 px-3.5 sm:px-5 rounded-full bg-[#0078E8] hover:bg-[#0066C7] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95">
              <span>{safeCampaign.cta}</span>
              <SfIconChevronRight size="xs" className="w-3.5 h-3.5 text-white" />
            </span>
          </div>
        </div>

        {/* Right Column: Circular / Framed Image Visual */}
        <div className="relative h-full flex items-center justify-center">
          <div className="relative w-[110px] min-[380px]:w-[130px] aspect-square sm:w-[80%] max-w-[280px] lg:max-w-[320px]">
            {/* Soft decorative offset ring */}
            <div aria-hidden className="absolute inset-0 translate-x-2 translate-y-2 sm:translate-x-4 sm:translate-y-4 rounded-full bg-[#00BFFF]/20 dark:bg-[#00BFFF]/15" />
            <div aria-hidden className="absolute -inset-1.5 sm:-inset-2 rounded-full border-2 border-dashed border-[#0078E8]/25" />
            {image ? (
              <img
                src={image}
                alt={category.name}
                draggable={false}
                className="relative z-10 w-full h-full rounded-full object-cover shadow-lg border-2 border-white dark:border-neutral-800"
                style={{ objectPosition: safeCampaign.focus ?? 'center' }}
              />
            ) : (
              <div className="relative z-10 w-full h-full rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400">
                <span className="text-xs font-bold">{category.name}</span>
              </div>
            )}
            <Swoosh className="absolute -bottom-2 sm:-bottom-4 left-[8%] w-[84%] h-3 sm:h-7 pointer-events-none" strokeWidth={5} />
          </div>
        </div>
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
          {innerContent}
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
        {innerContent}
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
      className="relative w-full aspect-[3/2] sm:aspect-auto sm:h-[350px] md:h-[400px] lg:h-auto lg:min-h-[420px] lg:self-stretch overflow-hidden rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0078E8] shadow-sm select-none"
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
            className="hidden sm:flex absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-gray-900 dark:bg-neutral-900/90 dark:hover:bg-neutral-900 dark:text-white items-center justify-center border border-gray-200/80 dark:border-neutral-700 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <SfIconChevronLeft size="sm" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800 dark:text-white" />
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
            className="hidden sm:flex absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-gray-900 dark:bg-neutral-900/90 dark:hover:bg-neutral-900 dark:text-white items-center justify-center border border-gray-200/80 dark:border-neutral-700 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <SfIconChevronRight size="sm" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800 dark:text-white" />
          </button>

          {/* Pagination Indicators Pill */}
          <div className="absolute inset-x-0 bottom-2.5 sm:bottom-4 z-20 flex items-center justify-center pointer-events-none">
            <div 
              role="tablist" 
              aria-label="Slides" 
              className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md border border-gray-200/70 dark:border-neutral-700 pointer-events-auto shadow-sm"
            >
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
                    className="min-w-[28px] min-h-[28px] sm:min-w-[32px] sm:min-h-[32px] p-1 flex items-center justify-center group cursor-pointer"
                  >
                    <span
                      className={clsx(
                        'block h-1.5 sm:h-2 rounded-full transition-all duration-300',
                        active ? 'w-6 sm:w-7 bg-[#0062cc] shadow-xs' : 'w-1.5 sm:w-2 bg-gray-300 dark:bg-neutral-600 group-hover:bg-gray-400'
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
