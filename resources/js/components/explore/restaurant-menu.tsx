import { Coffee, IceCream, Sparkles, Star, UtensilsCrossed, Wine } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
        <article className="group flex gap-4 py-4 first:pt-0 last:pb-0">
            <div className="size-[4.5rem] shrink-0 overflow-hidden rounded-2xl bg-stone-100 ring-1 ring-stone-200/60">
                {dish.image_url ? (
                    <img
                        src={dish.image_url}
                        alt=""
                        className="size-full object-cover transition duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center text-stone-300">
                        <UtensilsCrossed className="size-6" />
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1 border-b border-stone-100 pb-4 group-last:border-0 group-last:pb-0">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h4 className="font-semibold leading-snug text-stone-900">{dish.name}</h4>
                        {dish.description ? (
                            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-stone-500">
                                {dish.description}
                            </p>
                        ) : (
                            <p className="mt-1 text-sm italic text-stone-400">
                                {t('explore.menu_no_description')}
                            </p>
                        )}
                        {(dish.is_signature || dish.is_featured) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {dish.is_signature && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-900 uppercase ring-1 ring-amber-200/80">
                                        <Star className="size-3 fill-amber-500 text-amber-500" />
                                        {t('explore.menu_signature')}
                                    </span>
                                )}
                                {dish.is_featured && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-brand-orange-dark uppercase ring-1 ring-orange-200/80">
                                        <Sparkles className="size-3" />
                                        {t('explore.menu_featured')}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <span className="shrink-0 pt-0.5 font-serif text-lg font-semibold tabular-nums text-brand-blue">
                        S/ {dish.price.toFixed(2)}
                    </span>
                </div>
            </div>
        </article>
    );
}

type Props = {
    menu: RestaurantMenuData;
    className?: string;
    id?: string;
};

export function RestaurantMenu({ menu, className, id = 'menu' }: Props) {
    const { t } = useTranslation();

    if (menu.total_items === 0) {
        return null;
    }

    return (
        <section id={id} className={cn('scroll-mt-28 space-y-8', className)}>
            <header className="border-b border-stone-200/80 pb-4">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-brand-blue uppercase">
                    {t('explore.menu_kicker')}
                </p>
                <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-stone-900">
                    {t('explore.menu_title')}
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                    {t('explore.menu_subtitle', { count: menu.total_items })}
                </p>
            </header>

            {menu.sections.map(section => {
                const Icon = sectionIcon(section.slug);

                return (
                    <div key={section.slug + String(section.id)}>
                        <div className="mb-4 flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-xl bg-stone-100 text-brand-blue">
                                <Icon className="size-4" />
                            </span>
                            <div>
                                <h3 className="text-sm font-semibold tracking-wide text-stone-800 uppercase">
                                    {section.name}
                                </h3>
                                <p className="text-[11px] text-stone-400">
                                    {t('explore.menu_section_count', { count: section.items.length })}
                                </p>
                            </div>
                        </div>
                        <div className="rounded-3xl bg-white px-4 py-2 ring-1 ring-stone-200/70">
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
