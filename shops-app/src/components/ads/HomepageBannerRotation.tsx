'use client';

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { advertisingService, HomepageBanner } from '@/services/advertising';
import { useWindowSize } from '@/hooks/use-window-size';
import { optimizeCloudinaryUrl } from '@/services/api';

const AUTO_SLIDE_MS = 5000;
const TRANSITION_MS = 400;

export function HomepageBannerRotation() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<HomepageBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [impressionTracked, setImpressionTracked] = useState<Set<number>>(new Set());
  const { width } = useWindowSize();

  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const data = await advertisingService.getActiveBanners();
      setBanners(data);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    } finally {
      setLoading(false);
    }
  };

  // Track impression when banner changes
  useEffect(() => {
    if (banners.length === 0 || impressionTracked.has(banners[currentIndex].id)) return;

    const timer = setTimeout(async () => {
      await advertisingService.trackBannerImpression(banners[currentIndex].id);
      setImpressionTracked(prev => new Set([...prev, banners[currentIndex].id]));
    }, 100); // Small delay to ensure banner is visible

    return () => clearTimeout(timer);
  }, [currentIndex, banners, impressionTracked]);

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

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      goTo((currentIndex + 1) % banners.length, 'next');
    }, AUTO_SLIDE_MS);

    return () => clearInterval(interval);
  }, [banners.length, currentIndex]);

  if (loading || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];
  const isMobile = width < 768;
  const imageUrl = isMobile && currentBanner.mobile_image_url
    ? currentBanner.mobile_image_url
    : currentBanner.image_url;

  const handleClick = async () => {
    await advertisingService.trackBannerClick(currentBanner.id);

    const link = currentBanner.button_link;
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

  return (
    <div
      className="relative w-full bg-gray-900 overflow-hidden rounded-[20px] shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Banner Image — the uploaded creative is the whole message (title,
          offer, and CTA are already part of the designed graphic), so the
          entire image is just a clickable link with no extra overlay. */}
      <button
        onClick={handleClick}
        className="block w-full h-[110px] sm:h-[140px] md:h-[180px] lg:h-[210px]"
        aria-label={currentBanner.title}
      >
        <img
          key={currentBanner.id}
          src={optimizeCloudinaryUrl(imageUrl, { width: 1200 }) || imageUrl}
          alt={currentBanner.title}
          // This is the homepage's LCP element -- eager + high priority so
          // the browser fetches it immediately instead of treating it like
          // any other below-the-fold image.
          loading="eager"
          fetchPriority="high"
          className={`w-full h-full object-cover transition-all ease-out ${
            isTransitioning
              ? direction === 'next'
                ? 'opacity-0 -translate-x-6'
                : 'opacity-0 translate-x-6'
              : 'opacity-100 translate-x-0'
          }`}
          style={{ transitionDuration: `${TRANSITION_MS}ms` }}
        />
      </button>

      {/* Navigation arrows (desktop only — mobile uses swipe) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white rounded-full transition-colors"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <button
            onClick={handleNext}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white rounded-full transition-colors"
            aria-label="Next banner"
          >
            <ChevronRight className="w-6 h-6 text-gray-900" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index, index > currentIndex ? 'next' : 'prev')}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-8' : 'bg-white/50 w-2'
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
