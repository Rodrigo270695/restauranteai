import type { PropsWithChildren } from 'react';
import { AUTH_CARD_STYLE } from '@/lib/auth-styles';
import { cn } from '@/lib/utils';

type Props = PropsWithChildren<{
    className?: string;
    padding?: 'default' | 'none';
}>;

export function AuthGlassCard({ children, className, padding = 'default' }: Props) {
    return (
        <div
            className={cn('w-full rounded-3xl', padding === 'default' && 'p-8', className)}
            style={AUTH_CARD_STYLE}
        >
            {children}
        </div>
    );
}
