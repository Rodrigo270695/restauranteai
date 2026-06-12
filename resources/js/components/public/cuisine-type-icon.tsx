import type { Icon } from '@phosphor-icons/react';
import {
    BowlFood,
    BowlSteam,
    Coffee,
    Fish,
    Flame,
    ForkKnife,
    Globe,
    Hamburger,
    Leaf,
    Pepper,
    Pizza,
    Shrimp,
    Sparkle,
    Wine,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

type IconConfig = {
    Icon: Icon;
    color: string;
};

const SLUG_ICONS: Record<string, IconConfig> = {
    criolla: { Icon: BowlFood, color: '#f97316' },
    marina: { Icon: Fish, color: '#2563eb' },
    ceviche: { Icon: Shrimp, color: '#0891b2' },
    chifa: { Icon: BowlSteam, color: '#dc2626' },
    lambayecana: { Icon: Pepper, color: '#ca8a04' },
    parrillas: { Icon: Flame, color: '#ea580c' },
    parrilla: { Icon: Flame, color: '#ea580c' },
    cafeteria: { Icon: Coffee, color: '#92400e' },
    cafe: { Icon: Coffee, color: '#92400e' },
    'comida-rapida': { Icon: Hamburger, color: '#f59e0b' },
    fusion: { Icon: Sparkle, color: '#8b5cf6' },
    internacional: { Icon: Globe, color: '#073577' },
    cocteleria: { Icon: Wine, color: '#be185d' },
    vegetariano: { Icon: Leaf, color: '#16a34a' },
    pizza: { Icon: Pizza, color: '#ef4444' },
};

type Props = {
    slug?: string;
    size?: number;
    className?: string;
};

export function CuisineTypeIcon({ slug, size = 26, className }: Props) {
    const config = SLUG_ICONS[slug ?? ''] ?? { Icon: ForkKnife, color: '#073577' };
    const { Icon: CuisineIcon, color } = config;

    return (
        <CuisineIcon
            size={size}
            weight="duotone"
            color={color}
            aria-hidden
            className={cn('shrink-0', className)}
        />
    );
}
