import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
    const iconClass = size === 'md' ? 'size-4' : 'size-3.5';
    return (
        <span className="inline-flex items-center gap-0.5" aria-label={`${rating} de 5 estrellas`}>
            {Array.from({ length: 5 }, (_, i) => (
                <Star
                    key={i}
                    className={cn(
                        iconClass,
                        i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30',
                    )}
                />
            ))}
        </span>
    );
}
