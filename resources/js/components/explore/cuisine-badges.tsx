import { cn } from '@/lib/utils';

export type CuisineBadge = { name: string; is_primary?: boolean };

export function CuisineBadges({ cuisines, size = 'sm' }: { cuisines: CuisineBadge[]; size?: 'sm' | 'xs' }) {
    if (!cuisines.length) return null;

    return (
        <div className="flex flex-wrap gap-1">
            {cuisines.map(c => (
                <span
                    key={c.name}
                    className={cn(
                        'rounded-full font-medium',
                        size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
                        c.is_primary
                            ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-200'
                            : 'bg-orange-50 text-orange-800',
                    )}
                >
                    {c.name}
                    {c.is_primary ? ' ★' : ''}
                </span>
            ))}
        </div>
    );
}
