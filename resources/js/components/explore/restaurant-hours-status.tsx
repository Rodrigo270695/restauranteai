import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RestaurantHoursData = {
    is_open: boolean;
    label: string;
    closes_soon: boolean;
    minutes_until_close?: number | null;
    opens_at_label?: string | null;
    closes_at_label?: string | null;
};

type Props = {
    hours?: RestaurantHoursData | null;
    /** compact = badge on card image; inline = text row under title */
    variant?: 'badge' | 'inline';
    className?: string;
};

export function RestaurantHoursStatus({ hours, variant = 'inline', className }: Props) {
    if (!hours?.label || hours.label === 'Horario no disponible') {
        return null;
    }

    const isUrgent = hours.is_open && hours.closes_soon;
    const isOpen = hours.is_open && !hours.closes_soon;

    if (variant === 'badge') {
        return (
            <span
                className={cn(
                    'absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm',
                    isUrgent && 'bg-red-600',
                    isOpen && 'bg-green-600',
                    !hours.is_open && 'bg-gray-600',
                    className,
                )}
            >
                {hours.label}
            </span>
        );
    }

    return (
        <p
            className={cn(
                'flex items-center gap-1.5 text-sm font-medium',
                isUrgent && 'text-red-600',
                isOpen && 'text-emerald-700',
                !hours.is_open && 'text-gray-500',
                className,
            )}
        >
            <Clock className={cn('size-4 shrink-0', isUrgent && 'text-red-600', isOpen && 'text-emerald-600')} />
            {hours.label}
        </p>
    );
}
