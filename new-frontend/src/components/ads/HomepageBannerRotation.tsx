'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { advertisingService, HomepageBanner } from '@/services/advertising';
import { useWindowSize } from '@/hooks/use-window-size';

export function HomepageBannerRotation() {
  const [banners, setBanners] = useState<HomepageBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [impressionTracked, setImpressionTracked] = useState<Set<number>>(new Set());
  const { width } = useWindowSize();

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

  // Auto-rotate banners every 8 seconds
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [banners.length]);

  if (loading || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];
  const isMobile = width < 768;
  const imageUrl = isMobile && currentBanner.mobile_image_url
    ? currentBanner.mobile_image_url
    : currentBanner.image_url;

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % banners.length);
  };

  const handleClick = async () => {
    await advertisingService.trackBannerClick(currentBanner.id);
    window.open(currentBanner.button_link, '_blank');
  };

  return (
    <div className="relative w-full bg-gray-900 overflow-hidden rounded-lg">
      {/* Banner Image */}
      <div className="relative aspect-video md:aspect-[3/1] w-full">
        <img
          src={imageUrl}
          alt={currentBanner.title}
          className="w-full h-full object-cover"
        />

        {/* Overlay with content */}
        <div className="absolute inset-0 bg-black/30 flex flex-col justify-center items-start p-6 md:p-12">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">
            {currentBanner.title}
          </h2>
          {currentBanner.subtitle && (
            <p className="text-sm md:text-lg text-gray-100 mb-6">
              {currentBanner.subtitle}
            </p>
          )}
          <button
            onClick={handleClick}
            className="px-6 py-2 md:px-8 md:py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            {currentBanner.button_text}
          </button>
        </div>
      </div>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white rounded-full transition-colors"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 hover:bg-white rounded-full transition-colors"
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
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-8' : 'bg-white/50'
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
