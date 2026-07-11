import { Star } from 'lucide-react';
import { cn } from '../lib/utils';

export function RatingStars({ rating, size = 'sm', showValue = true }: {
  rating: number;
  size?: 'xs' | 'sm' | 'md';
  showValue?: boolean;
}) {
  const px = size === 'xs' ? 'w-3 h-3' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={cn(px, i <= Math.round(rating) ? 'fill-accent-400 text-accent-400' : 'text-ink-300 dark:text-ink-600')}
          />
        ))}
      </div>
      {showValue && <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">{rating.toFixed(1)}</span>}
    </div>
  );
}
