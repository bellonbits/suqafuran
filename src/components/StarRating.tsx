import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../utils/cn';

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
  className?: string;
}

const sizeMap = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

/**
 * Star rating display component
 * @param rating - Rating value (0-5)
 * @param count - Optional count of reviews
 * @param size - Star size (sm, md, lg)
 * @param interactive - Allow clicking to rate
 * @param onRate - Callback when rating is clicked
 */
export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  count,
  size = 'md',
  interactive = false,
  onRate,
  className,
}) => {
  const sizeClass = sizeMap[size];
  const filledCount = Math.round(rating);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <button
            key={i}
            onClick={() => interactive && onRate?.(i + 1)}
            disabled={!interactive}
            className={cn(
              sizeClass,
              'transition-colors',
              interactive && 'cursor-pointer hover:scale-110',
              i < filledCount ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
            )}
          >
            <Star className={sizeClass} />
          </button>
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs font-bold text-slate-600 ml-1">
          {rating.toFixed(1)} ({count})
        </span>
      )}
    </div>
  );
};
