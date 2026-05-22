import { Head, useForm, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    CalendarCheck,
    Car,
    CheckCircle2,
    CreditCard,
    Dog,
    Languages,
    Music,
    Search,
    Settings2,
    Truck,
    UtensilsCrossed,
    Wifi,
    Accessibility,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FormSection, STAT_COLORS } from '@/components/app/owner/form-section';
import { PageHeader, type StatBadge } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminPanelBanner } from '@/components/layout/admin-panel-banner';
import { useCan } from '@/hooks/use-can';
import { useOwnerReadOnly } from '@/hooks/use-owner-read-only';
import type { PanelContext } from '@/lib/scoped-app-path';
import { cn } from '@/lib/utils';

export type PivotItem = {
    id: number;
    name: string;
    slug?: string;
    icon?: string | null;
    code?: string;
};

type PivotVariant = 'services' | 'languages';

type Props = {
    variant: PivotVariant;
    restaurant: { id: number; name: string };
    owner: { name: string; business_name?: string | null };
    items: PivotItem[];
    selectedIds: number[];
    stats: { total: number; selected: number };
    saveUrl: string;
    permission: string;
    panel?: PanelContext;
};

const COPY: Record<
    PivotVariant,
    {
        title: string;
        description: string;
        sectionTitle: string;
        sectionDescription: string;
        empty: string;
        saveLabel: string;
        searchPlaceholder: string;
    }
> = {
    services: {
        title: 'Servicios del local',
        description:
            'Indica qué comodidades ofrece tu restaurante (WiFi, delivery, reservas…). Los turistas las verán al explorar tu ficha.',
        sectionTitle: 'Servicios disponibles',
        sectionDescription: 'Marca todo lo que aplica a tu negocio.',
        empty: 'No hay servicios configurados en la plataforma.',
        saveLabel: 'Guardar servicios',
        searchPlaceholder: 'Buscar servicio…',
    },
    languages: {
        title: 'Idiomas de atención',
        description:
            'Selecciona los idiomas en los que puedes atender a tus clientes. Ayuda a turistas a encontrarte.',
        sectionTitle: 'Idiomas',
        sectionDescription: 'Marca los idiomas que maneja tu equipo.',
        empty: 'No hay idiomas configurados en la plataforma.',
        saveLabel: 'Guardar idiomas',
        searchPlaceholder: 'Buscar idioma…',
    },
};

const SERVICE_ICONS: Record<string, LucideIcon> = {
    wifi: Wifi,
    estacionamiento: Car,
    delivery: Truck,
    reservas: CalendarCheck,
    terraza: UtensilsCrossed,
    'musica-en-vivo': Music,
    'acceso-silla-de-ruedas': Accessibility,
    'acepta-mascotas': Dog,
    'pago-con-tarjeta': CreditCard,
    'para-llevar': Truck,
};

function serviceIcon(slug?: string): LucideIcon {
    if (!slug) return Settings2;
    return SERVICE_ICONS[slug] ?? Settings2;
}

function BrandCheckbox({ checked }: { checked: boolean }) {
    const dim = 'size-4';
    if (checked) {
        return (
            <span
                className={cn('flex shrink-0 items-center justify-center rounded-sm border', dim)}
                style={{
                    background: 'linear-gradient(135deg,#e8001a,#8b0008)',
                    borderColor: '#cc0010',
                }}
            >
                <svg viewBox="0 0 10 10" className="size-2.5 text-white" fill="none">
                    <path
                        d="M2 5l2.5 2.5L8 3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </span>
        );
    }
    return <span className={cn('flex shrink-0 rounded-sm border border-border/70 bg-background', dim)} />;
}

export function RestaurantPivotPage({
    variant,
    restaurant,
    owner,
    items,
    selectedIds,
    stats,
    saveUrl,
    permission,
    panel,
}: Props) {
    const can = useCan();
    const readOnly = useOwnerReadOnly();
    const canManage = can(permission) && !readOnly;
    const copy = COPY[variant];
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const [search, setSearch] = useState('');

    const form = useForm({ ids: selectedIds });

    useEffect(() => {
        form.setData('ids', selectedIds);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(selectedIds)]);

    useEffect(() => {
        if (!flash?.success && !flash?.error) return;
        import('sonner').then(({ toast }) => {
            if (flash.success) toast.success(flash.success);
            if (flash.error) toast.error(flash.error);
        });
    }, [flash]);

    const displayName = owner.business_name || restaurant.name;
    const palette = variant === 'services' ? STAT_COLORS.violet : STAT_COLORS.sky;

    const statBadges: StatBadge[] = [
        {
            icon: variant === 'services' ? <Settings2 className="size-3.5" /> : <Languages className="size-3.5" />,
            label: 'Catálogo',
            value: stats.total,
            color: palette,
        },
        {
            icon: <CheckCircle2 className="size-3.5" />,
            label: 'Seleccionados',
            value: form.data.ids.length,
            color: form.data.ids.length > 0 ? STAT_COLORS.emerald : STAT_COLORS.amber,
        },
        {
            icon: <UtensilsCrossed className="size-3.5" />,
            label: 'Local',
            value: displayName,
            color: STAT_COLORS.violet,
        },
    ];

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter(
            (item) =>
                item.name.toLowerCase().includes(q) ||
                item.code?.toLowerCase().includes(q) ||
                item.slug?.toLowerCase().includes(q),
        );
    }, [items, search]);

    const toggle = (id: number) => {
        if (readOnly) return;
        const set = new Set(form.data.ids);
        set.has(id) ? set.delete(id) : set.add(id);
        form.setData('ids', Array.from(set));
    };

    const selectAll = () => {
        if (readOnly) return;
        form.setData('ids', items.map((i) => i.id));
    };
    const clearAll = () => {
        if (readOnly) return;
        form.setData('ids', []);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
        form.put(saveUrl, { preserveScroll: true });
    };

    const SectionIcon = variant === 'services' ? Settings2 : Languages;

    return (
        <>
            <Head title={copy.title} />
            <AdminPanelBanner panel={panel} restaurantName={restaurant.name} />

            <form onSubmit={submit} className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader title={copy.title} description={copy.description} stats={statBadges} />

                <FormSection
                    title={copy.sectionTitle}
                    description={copy.sectionDescription}
                    icon={<SectionIcon className="size-4" />}
                    palette={palette}
                    contentClassName="p-4 md:p-5"
                >
                    {items.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">{copy.empty}</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="relative max-w-sm flex-1">
                                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder={copy.searchPlaceholder}
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="h-9 pl-8 text-sm"
                                    />
                                </div>
                                {!readOnly && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <button
                                            type="button"
                                            onClick={selectAll}
                                            className="cursor-pointer font-medium underline-offset-2 hover:underline"
                                            style={{ color: '#cc0010' }}
                                        >
                                            Seleccionar todos
                                        </button>
                                        <span className="text-muted-foreground">·</span>
                                        <button
                                            type="button"
                                            onClick={clearAll}
                                            className="cursor-pointer font-medium text-muted-foreground underline-offset-2 hover:underline"
                                        >
                                            Limpiar
                                        </button>
                                    </div>
                                )}
                            </div>

                            {filtered.length === 0 ? (
                                <p className="py-6 text-center text-xs text-muted-foreground">
                                    No hay resultados para tu búsqueda.
                                </p>
                            ) : (
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {filtered.map((item) => {
                                        const checked = form.data.ids.includes(item.id);
                                        const Icon =
                                            variant === 'services'
                                                ? serviceIcon(item.slug)
                                                : Languages;

                                        return (
                                            <label
                                                key={item.id}
                                                className={cn(
                                                    'flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors',
                                                    readOnly
                                                        ? 'cursor-default opacity-90'
                                                        : 'cursor-pointer hover:bg-muted/30',
                                                    checked && 'border-red-200/80 bg-red-50/40 dark:bg-red-950/10',
                                                )}
                                            >
                                                <BrandCheckbox checked={checked} />
                                                <span
                                                    className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-white"
                                                    style={{
                                                        borderColor: palette.border,
                                                        color: palette.iconColor ?? palette.text,
                                                    }}
                                                >
                                                    {variant === 'languages' ? (
                                                        <span className="text-[10px] font-bold uppercase">
                                                            {item.code}
                                                        </span>
                                                    ) : (
                                                        <Icon className="size-4" />
                                                    )}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-sm font-medium">{item.name}</span>
                                                    {variant === 'languages' && item.code ? (
                                                        <span className="text-muted-foreground text-[11px]">
                                                            Código {item.code}
                                                        </span>
                                                    ) : null}
                                                </span>
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={checked}
                                                    disabled={readOnly}
                                                    onChange={() => toggle(item.id)}
                                                />
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {canManage && (
                                <div className="flex justify-end border-t border-border/60 pt-4">
                                    <Button
                                        type="submit"
                                        variant="brand"
                                        size="sm"
                                        disabled={form.processing}
                                        className="cursor-pointer gap-1.5 font-semibold"
                                    >
                                        {copy.saveLabel}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </FormSection>
            </form>
        </>
    );
}

export default RestaurantPivotPage;
