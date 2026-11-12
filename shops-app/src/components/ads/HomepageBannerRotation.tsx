'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { advertisingService, HomepageBanner } from '@/services/advertising';
import { useWindowSize } from '@/hooks/use-window-size';
import { optimizeCloudinaryUrl } from '@/services/api';
import { useT } from '@/lib/i18n';

const AUTO_SLIDE_MS = 5000;
const TRANSITION_MS = 400;
const CARD_SLIDE_MS = 10000;

interface HomepageBannerRotationProps {
  /**
   * Show every banner as a card in a horizontally swipeable strip (about
   * 1.2 cards visible on phones, 3 on desktop) instead of one rotating
   * strip. `secondary` is appended as the last card.
   */
  pair?: boolean;
  secondary?: ReactNode;
  /**
   * Built-in cards used only to top the strip up to a full row of 3 when
   * there aren't enough banners.
   */
  fillers?: ReactNode[];
  /** Optional custom title override */
  title?: ReactNode;
  /** Show creative "Sponsored Ads" section title. Defaults to true */
  showTitle?: boolean;
}

const MIN_CARDS = 3;

export function HomepageBannerRotation({
  pair = false,
  secondary,
  fillers = [],
  title,
  showTitle = true,
}: HomepageBannerRotationProps = {}) {
  const translate = useT();
  const navigate = useNavigate();
  const [banners, setBanners] = useState<HomepageBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [impressionTracked, setImpressionTracked] = useState<Set<number>>(new Set());
  const { width } = useWindowSize();

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBanners();

    const onUpdate = () => {
      fetchBanners();
    };
    window.addEventListener('suqafuran_banners_updated', onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener('suqafuran_banners_updated', onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, []);

  const fetchBanners = async () => {
    try {
      const data = await advertisingService.getActiveBanners();
      // Show banners that are NOT hero-only (i.e. sponsored, all, or legacy unassigned)
      let sponsored = data.filter((b) => b.placement !== 'hero');
      if (sponsored.length === 0 && data.length > 0) {
        // Fallback: if all banners happen to be hero, hero gets data[0], sponsored gets the rest
        sponsored = data.length > 1 ? data.slice(1) : data;
      }
      setBanners(sponsored);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const isMobile = width < 768;

  // Rotator: track an impression for the banner on screen
  useEffect(() => {
    if (pair || banners.length === 0) return;
    const id = banners[currentIndex].id;
    if (impressionTracked.has(id)) return;

    const timer = setTimeout(async () => {
      await advertisingService.trackBannerImpression(id);
      setImpressionTracked(prev => new Set([...prev, id]));
    }, 100); // Small delay to ensure banner is visible

    return () => clearTimeout(timer);
  }, [pair, currentIndex, banners, impressionTracked]);

  // Card strip: track an impression once a card is at least half scrolled
  // into view.
  useEffect(() => {
    const strip = stripRef.current;
    if (!pair || !strip || banners.length === 0) return;
    const seen = new Set<number>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const id = Number((entry.target as HTMLElement).dataset.bannerId);
        if (!entry.isIntersecting || seen.has(id)) return;
        seen.add(id);
        advertisingService.trackBannerImpression(id);
      });
    }, { root: strip, threshold: 0.5 });
    strip.querySelectorAll<HTMLElement>('[data-banner-id]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pair, banners]);

  const goTo = (index: number, dir: 'next' | 'prev') => {
    setDirection(dir);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, TRANSITION_MS / 2);
  };

  const handlePrev = () => {
    goTo((currentIndex - 1 + banners.length) % banners.length, 'prev');
  };

  const handleNext = () => {
    goTo((currentIndex + 1) % banners.length, 'next');
  };

  // Card strip: advance one card every CARD_SLIDE_MS, wrapping back to the
  // start at the end. Pauses while the user hovers or touches the strip.
  useEffect(() => {
    const strip = stripRef.current;
    if (!pair || !strip) return;
    let paused = false;
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    strip.addEventListener('pointerenter', pause);
    strip.addEventListener('pointerleave', resume);
    strip.addEventListener('touchstart', pause, { passive: true });
    strip.addEventListener('touchend', resume);

    const interval = setInterval(() => {
      const first = strip.firstElementChild as HTMLElement | null;
      const max = strip.scrollWidth - strip.clientWidth;
      if (paused || !first || max <= 0) return;
      const step = first.offsetWidth + parseFloat(getComputedStyle(strip).columnGap || '0');
      const next = strip.scrollLeft >= max - 4 ? 0 : Math.min(strip.scrollLeft + step, max);
      strip.scrollTo({ left: next, behavior: 'smooth' });
    }, CARD_SLIDE_MS);

    return () => {
      clearInterval(interval);
      strip.removeEventListener('pointerenter', pause);
      strip.removeEventListener('pointerleave', resume);
      strip.removeEventListener('touchstart', pause);
      strip.removeEventListener('touchend', resume);
    };
  }, [pair, loading, banners.length]);

  // Auto-rotate banners (rotator only; the card strip slides on its own timer)
  const rotates = !pair && banners.length > 1;
  useEffect(() => {
    if (!rotates) return;

    const interval = setInterval(() => {
      goTo((currentIndex + 1) % banners.length, 'next');
    }, AUTO_SLIDE_MS);

    return () => clearInterval(interval);
  }, [rotates, banners.length, currentIndex]);



  const updateScrollState = () => {
    const strip = stripRef.current;
    if (!strip) return;
    const max = strip.scrollWidth - strip.clientWidth;
    if (max <= 4) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    setCanScrollLeft(strip.scrollLeft > 6);
    setCanScrollRight(strip.scrollLeft < max - 6);

    const first = strip.firstElementChild as HTMLElement | null;
    if (first) {
      const step = first.offsetWidth + parseFloat(getComputedStyle(strip).columnGap || '16');
      if (step > 0) {
        const idx = Math.min(
          Math.max(0, Math.round(strip.scrollLeft / step)),
          banners.length + (secondary ? 1 : 0) + fillers.length - 1
        );
        setActiveCardIndex(idx);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(updateScrollState, 100);
    window.addEventListener('resize', updateScrollState);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [banners.length, pair]);

  if (loading || (banners.length === 0 && !(pair && secondary))) return null;

  const imageFor = (banner: HomepageBanner) =>
    isMobile && banner.mobile_image_url ? banner.mobile_image_url : banner.image_url;

  const openBanner = async (banner: HomepageBanner) => {
    await advertisingService.trackBannerClick(banner.id);

    const link = banner.button_link;
    const isExternal = /^https?:\/\//i.test(link) && !link.includes(window.location.host);

    if (isExternal) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      // Internal path (may be a full URL on our own host, or a relative path)
      const path = link.replace(/^https?:\/\/[^/]+/i, '');
      navigate(path);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (banners.length <= 1) return;
    const SWIPE_THRESHOLD = 50;
    if (touchDeltaX.current > SWIPE_THRESHOLD) {
      handlePrev();
    } else if (touchDeltaX.current < -SWIPE_THRESHOLD) {
      handleNext();
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  // Offer-card look: 3:2 ratio matching creative assets (1200x800) with a 16px radius.
  const frame = pair ? 'aspect-[3/2]' : 'aspect-[3/2] md:aspect-auto md:h-[260px] lg:h-[300px]';
  const radius = 'rounded-2xl';



  const scrollToCard = (index: number) => {
    const strip = stripRef.current;
    if (!strip) return;
    const first = strip.firstElementChild as HTMLElement | null;
    if (!first) return;
    const step = first.offsetWidth + parseFloat(getComputedStyle(strip).columnGap || '16');
    strip.scrollTo({ left: index * step, behavior: 'smooth' });
  };

  const handleStripPrev = () => {
    const strip = stripRef.current;
    if (!strip) return;
    const first = strip.firstElementChild as HTMLElement | null;
    if (!first) return;
    const step = first.offsetWidth + parseFloat(getComputedStyle(strip).columnGap || '16');
    strip.scrollBy({ left: -step, behavior: 'smooth' });
  };

  const handleStripNext = () => {
    const strip = stripRef.current;
    if (!strip) return;
    const first = strip.firstElementChild as HTMLElement | null;
    if (!first) return;
    const step = first.offsetWidth + parseFloat(getComputedStyle(strip).columnGap || '16');
    strip.scrollBy({ left: step, behavior: 'smooth' });
  };

  const poster = (banner: HomepageBanner, primary: boolean) => {
    const imgUrl = optimizeCloudinaryUrl(imageFor(banner), { width: pair ? 1000 : 1920 }) || imageFor(banner);
    return (
      <button
        onClick={() => openBanner(banner)}
        className={`relative block w-full h-full ${frame} overflow-hidden group`}
        aria-label={banner.title}
      >
        <img
          key={banner.id}
          src={imgUrl}
          alt={banner.title}
          loading={primary ? 'eager' : 'lazy'}
          fetchpriority={primary ? 'high' : undefined}
          className={`w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-[1.02] ${
            !pair && isTransitioning
              ? direction === 'next'
                ? 'opacity-0 -translate-x-6'
                : 'opacity-0 translate-x-6'
              : 'opacity-100 translate-x-0'
          }`}
          style={{ transitionDuration: `${TRANSITION_MS}ms` }}
        />
      </button>
    );
  };

  if (pair) {
    const fillerCount = Math.max(0, MIN_CARDS - banners.length - (secondary ? 1 : 0));
    const activeFillers = fillers.slice(0, fillerCount);
    const totalCount = banners.length + (secondary ? 1 : 0) + activeFillers.length;

    // Ensure cards fit the container cleanly:
    // 1 card: 100% width
    // 2 cards: 50% width each on tablet and desktop (fills container without gaps or awkward cuts)
    // 3+ cards: 100% mobile, 50% tablet, 33.333% desktop
    const card =
      totalCount === 1
        ? 'shrink-0 snap-start w-full'
        : totalCount === 2
        ? 'shrink-0 snap-start w-full sm:w-[calc((100%-1rem)/2)]'
        : 'shrink-0 snap-start w-full sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)]';

    return (
      <section className="w-full">
        {/* Creative "Sponsored Ads" Section Title */}
        {showTitle && (
          title ? (
            <div className="mb-3">{title}</div>
          ) : (
            <div className="flex items-center justify-between mb-3.5 px-0.5">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-[#0078E8] text-white shadow-sm shadow-orange-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                      <span className="italic font-extrabold text-gray-900 dark:text-white">{translate('Sponsored Ads')}</span>
                    </h2>
                    <span className="hidden sm:inline-block text-xs italic text-gray-500 dark:text-neutral-400">
                      — {translate('Featured Deals & Top Seller Spotlights')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold italic text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-800/50 px-2.5 py-0.5 rounded-full shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  {translate('Featured')}
                </span>
              </div>
            </div>
          )
        )}

        <div className="relative group/strip">
          {/* Navigation arrows (desktop/tablet) */}
          {totalCount > 1 && canScrollLeft && (
            <button
              onClick={handleStripPrev}
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-md border border-gray-100 hover:scale-105 transition-all"
              aria-label="Previous cards"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {totalCount > 1 && canScrollRight && (
            <button
              onClick={handleStripNext}
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-md border border-gray-100 hover:scale-105 transition-all"
              aria-label="Next cards"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Horizontal card strip: fits full width on phones, 2 cards on tablet, 3 on desktop */}
          <div
            ref={stripRef}
            onScroll={updateScrollState}
            className="flex gap-4 overflow-x-auto overscroll-x-contain snap-x snap-mandatory hide-scrollbar py-3 -my-3"
          >
            {banners.map((banner, i) => (
              <div
                key={banner.id}
                data-banner-id={banner.id}
                className={`${card} relative bg-gray-900 overflow-hidden ${radius} shadow-[0_4px_12px_rgba(0,0,0,0.08)]`}
              >
                {poster(banner, i === 0)}
              </div>
            ))}
            {secondary && <div className={card}>{secondary}</div>}
            {activeFillers.map((filler, i) => (
              <div key={`filler-${i}`} className={card}>{filler}</div>
            ))}
          </div>

          {/* Mobile/Tablet dot indicators */}
          {totalCount > 1 && (
            <div className="flex justify-center items-center gap-0.5 mt-2 md:hidden">
              {Array.from({ length: totalCount }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollToCard(i)}
                  className="min-w-[28px] min-h-[28px] p-1 flex items-center justify-center cursor-pointer"
                  aria-label={`Go to banner ${i + 1}`}
                >
                  <span
                    className={`h-1.5 rounded-full transition-all block ${
                      i === activeCardIndex
                        ? 'w-6 bg-[#0062cc]'
                        : 'w-1.5 bg-gray-300 dark:bg-neutral-700 hover:bg-gray-400'
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <div
      className={`relative w-full bg-gray-900 overflow-hidden ${radius} shadow-[0_10px_40px_rgba(0,0,0,0.08)]`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {poster(currentBanner, true)}

      {/* Navigation arrows (desktop only — mobile uses swipe) */}
      {rotates && (
        <>
          <button
            onClick={handlePrev}
            className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full transition-colors left-4 p-2`}
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <button
            onClick={handleNext}
            className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full transition-colors right-4 p-2`}
            aria-label="Next banner"
          >
            <ChevronRight className="w-6 h-6 text-gray-900" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {rotates && (
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 bottom-3">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index, index > currentIndex ? 'next' : 'prev')}
              className="min-w-[28px] min-h-[28px] p-1 flex items-center justify-center cursor-pointer"
              aria-label={`Go to banner ${index + 1}`}
            >
              <span
                className={`h-2 rounded-full transition-all block ${
                  index === currentIndex ? 'bg-white w-8' : 'bg-white/50 w-2'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
