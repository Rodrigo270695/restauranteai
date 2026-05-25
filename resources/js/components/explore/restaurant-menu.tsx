import { Coffee, IceCream, Sparkles, Star, UtensilsCrossed, Wine } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type MenuDish = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    is_signature: boolean;
    is_featured: boolean;
};

export type MenuSection = {
    id: number | null;
    name: string;
    slug: string;
    items: MenuDish[];
};

export type RestaurantMenuData = {
    sections: MenuSection[];
    total_items: number;
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
    entradas: UtensilsCrossed,
    'platos-de-fondo': UtensilsCrossed,
    postres: IceCream,
    bebidas: Wine,
    otros: Coffee,
};

function sectionIcon(slug: string): LucideIcon {
    return CATEGORY_ICONS[slug] ?? UtensilsCrossed;
}

function DishCard({ dish }: { dish: MenuDish }) {
    const { t } = useTranslation();

    return (
        <article className="flex gap-3 rounded-2xl border border-orange-100/80 bg-white p-3 shadow-sm">
            <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-red-50">
                {dish.image_url ? (
                    <img src={dish.image_url} alt="" className="size-full object-cover" />
                ) : (
                    <div className="flex size-full items-center justify-center text-orange-300">
                        <UtensilsCrossed className="size-7" />
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <h4 className="font-semibold leading-snug text-gray-900">{dish.name}</h4>
                    <span className="shrink-0 text-base font-bold text-[#E8001A]">
                        S/ {dish.price.toFixed(2)}
                    </span>
                </div>
                {dish.description ? (
                    <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-gray-600">
                        {dish.description}
                    </p>
                ) : (
                    <p className="mt-1 text-xs italic text-gray-400">{t('explore.menu_no_description')}</p>
                )}
                {(dish.is_signature || dish.is_featured) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {dish.is_signature && (
                            <Badge
                                variant="outline"
                                className="border-amber-200 bg-amber-50 text-[10px] font-semibold text-amber-800"
                            >
                                <Star className="mr-0.5 size-3 fill-amber-500 text-amber-500" />
                                {t('explore.menu_signature')}
                            </Badge>
                        )}
                        {dish.is_featured && (
                            <Badge
                                variant="outline"
                                className="border-red-200 bg-red-50 text-[10px] font-semibold text-[#E8001A]"
                            >
                                <Sparkles className="mr-0.5 size-3" />
                                {t('explore.menu_featured')}
                            </Badge>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
}

type Props = {
    menu: RestaurantMenuData;
    className?: string;
};

export function RestaurantMenu({ menu, className }: Props) {
    const { t } = useTranslation();

    if (menu.total_items === 0) {
        return null;
    }

    return (
        <section className={cn('space-y-5', className)}>
            <div>
                <h2 className="text-lg font-bold text-gray-900">{t('explore.menu_title')}</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                    {t('explore.menu_subtitle', { count: menu.total_items })}
                </p>
            </div>

            {menu.sections.map(section => {
                const Icon = sectionIcon(section.slug);

                return (
                    <div key={section.slug + String(section.id)}>
                        <div className="mb-3 flex items-center gap-2 border-b border-orange-100 pb-2">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-red-50 text-[#E8001A]">
                                <Icon className="size-4" />
                            </span>
                            <div>
                                <h3 className="text-sm font-bold tracking-wide text-gray-800 uppercase">
                                    {section.name}
                                </h3>
                                <p className="text-[11px] text-gray-400">
                                    {t('explore.menu_section_count', { count: section.items.length })}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            {section.items.map(dish => (
                                <DishCard key={dish.id} dish={dish} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </section>
    );
}
