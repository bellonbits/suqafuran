import { useEffect, useRef } from 'react';

interface ScrollPosition {
  x: number;
  y: number;
}

/**
 * Hook to save and restore scroll position when navigating.
 * Saves position when component unmounts and restores on mount.
 */
export function useScrollPosition(key: string, dependencies: any[] = []) {
  const scrollPositionRef = useRef<ScrollPosition>({ x: 0, y: 0 });

  // Restore scroll position on mount
  useEffect(() => {
    const savedPosition = sessionStorage.getItem(`scroll-${key}`);
    if (savedPosition) {
      try {
        const position = JSON.parse(savedPosition);
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          window.scrollTo(position.x, position.y);
        });
      } catch {
        // Ignore parse errors
      }
    }
  }, [key]);

  // Save scroll position on unmount or when dependencies change
  useEffect(() => {
    return () => {
      scrollPositionRef.current = {
        x: window.scrollX || window.pageXOffset,
        y: window.scrollY || window.pageYOffset,
      };
      sessionStorage.setItem(
        `scroll-${key}`,
        JSON.stringify(scrollPositionRef.current)
      );
    };
  }, [key, ...dependencies]);

  // Optional: Track scroll position in real-time
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = {
        x: window.scrollX || window.pageXOffset,
        y: window.scrollY || window.pageYOffset,
      };
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return scrollPositionRef.current;
}

/**
 * Clear saved scroll position for a key
 */
export function clearScrollPosition(key: string) {
  sessionStorage.removeItem(`scroll-${key}`);
}

/**
 * Get saved scroll position without affecting current scroll
 */
export function getSavedScrollPosition(key: string): ScrollPosition | null {
  const saved = sessionStorage.getItem(`scroll-${key}`);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}
