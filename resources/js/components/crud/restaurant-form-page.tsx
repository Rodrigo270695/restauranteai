import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Building2,
    Globe,
    MapPin,
    Phone,
    Save,
    Sparkles,
    Store,
    UtensilsCrossed,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormField } from '@/components/modals/resource-modal';
import { PageHeader, STAT_COLORS, type StatBadge } from '@/components/shared/page-header';
import { CatalogChipMultiSelect } from '@/components/shared/catalog-chip-multi-select';
import { CuisineTypeMultiSelect } from '@/components/shared/cuisine-type-multi-select';
import {
    GeoCascadeSelect,
    type GeoDepartment,
} from '@/components/shared/geo-cascade-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AdminPanelBanner } from '@/components/layout/admin-panel-banner';
import { useCan } from '@/hooks/use-can';
import { useOwnerReadOnly } from '@/hooks/use-owner-read-only';
import type { PanelContext } from '@/lib/scoped-app-path';
import { cn } from '@/lib/utils';

type Option = { id: number; name: string };
type Restaurant = Record<string, unknown> & {
    id: number;
    name: string;
    slug?: string;
};

type Props = {
    restaurant: Restaurant;
    owner: { name: string; business_name?: string | null };
    departments: GeoDepartment[];
    geoSelection: {
        department_id: number | null;
        province_id: number | null;
        district_id: number | null;
    };
    cuisineTypes: Option[];
    cuisineSelection: { ids: number[]; primary_id: number | null };
    ambiances: Option[];
    partyTypes: Option[];
    dietaryOptions: Option[];
    restaurantEnvironments: Option[];
    recommendedMoments: Option[];
    audienceSelection: {
        party_type_ids: number[];
        dietary_option_ids: number[];
        restaurant_environment_ids: number[];
        recommended_moment_ids: number[];
    };
    stats: {
        is_active: boolean;
        is_verified: boolean;
        avg_rating: number;
        total_reviews: number;
    };
    panel?: PanelContext;
};

const SECTION = {
    identity: STAT_COLORS.violet,
    location: STAT_COLORS.sky,
    experience: STAT_COLORS.amber,
    contact: STAT_COLORS.emerald,
    visibility: STAT_COLORS.rose,
} as const;

function FormSection({
    title,
    description,
    icon,
    palette,
    children,
    className,
}: {
    title: string;
    description?: string;
    icon: React.ReactNode;
    palette: (typeof STAT_COLORS)[keyof typeof STAT_COLORS];
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn('overflow-hidden rounded-xl border shadow-sm', className)}
            style={{
                borderColor: palette.border,
                background: `linear-gradient(135deg, ${palette.bg} 0%, #ffffff 72%)`,
            }}
        >
            <div
                className="flex items-start gap-3 border-b px-5 py-4"
                style={{ borderColor: palette.border, backgroundColor: `${palette.bg}99` }}
            >
                <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg border"
                    style={{ borderColor: palette.border, color: palette.iconColor ?? palette.text, background: '#fff' }}
                >
                    {icon}
                </span>
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold tracking-tight" style={{ color: palette.text }}>
                        {title}
                    </h2>
                    {description && (
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
                    )}
                </div>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2">{children}</div>
        </section>
    );
}

function FieldSpan({ children, full }: { children: React.ReactNode; full?: boolean }) {
    return <div className={cn(full && 'md:col-span-2')}>{children}</div>;
}

const selectClass = (invalid?: boolean) =>
    cn(
        'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm shadow-xs transition-colors',
        'focus-visible:border-brand-red focus-visible:ring-2 focus-visible:ring-brand-red/20 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        invalid ? 'border-red-400' : 'border-input',
    );

export function RestaurantFormPage({
    restaurant,
    owner,
    departments,
    geoSelection,
    cuisineTypes,
    cuisineSelection,
    ambiances,
    partyTypes,
    dietaryOptions,
    restaurantEnvironments,
    recommendedMoments,
    audienceSelection,
    stats,
    panel,
}: Props) {
    const can = useCan();
    const readOnly = useOwnerReadOnly();
    const canManage = can('manage_own_restaurant') && !readOnly;
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;
    const [geo, setGeo] = useState(geoSelection);

    const form = useForm({
        name: restaurant.name ?? '',
        short_description: restaurant.short_description ?? '',
        description: restaurant.description ?? '',
        address: restaurant.address ?? '',
        district_id: restaurant.district_id ?? ('' as number | ''),
        cuisine_type_ids: cuisineSelection.ids ?? [],
        primary_cuisine_type_id: cuisineSelection.primary_id,
        ambiance_id: restaurant.ambiance_id ?? ('' as number | ''),
        party_type_ids: audienceSelection.party_type_ids ?? [],
        dietary_option_ids: audienceSelection.dietary_option_ids ?? [],
        phone: restaurant.phone ?? '',
        whatsapp: restaurant.whatsapp ?? '',
        email: restaurant.email ?? '',
        website: restaurant.website ?? '',
        price_range: restaurant.price_range ?? 'moderado',
        avg_price_per_person: restaurant.avg_price_per_person ?? '',
        capacity: restaurant.capacity ?? '',
        is_active: Boolean(restaurant.is_active),
    });

    useEffect(() => {
        if (!flash?.success && !flash?.error) return;
        import('sonner').then(({ toast }) => {
            if (flash.success) toast.success(flash.success);
            if (flash.error) toast.error(flash.error);
        });
    }, [flash]);

    const displayName = owner.business_name || restaurant.name || owner.name;

    const statBadges: StatBadge[] = [
        {
            icon: <Store className="size-3.5" />,
            label: 'Visible',
            value: stats.is_active ? 'Sí' : 'No',
            color: stats.is_active ? STAT_COLORS.emerald : STAT_COLORS.amber,
        },
        {
            icon: <Sparkles className="size-3.5" />,
            label: 'Verificado',
            value: stats.is_verified ? 'Sí' : 'Pendiente',
            color: stats.is_verified ? STAT_COLORS.blue : STAT_COLORS.orange,
        },
        {
            icon: <UtensilsCrossed className="size-3.5" />,
            label: 'Rating',
            value: stats.avg_rating > 0 ? stats.avg_rating.toFixed(1) : '—',
            color: STAT_COLORS.violet,
        },
        {
            icon: <Building2 className="size-3.5" />,
            label: 'Reseñas',
            value: stats.total_reviews,
            color: STAT_COLORS.rose,
        },
    ];

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
        const putUrl = panel?.baseUrl ? `${panel.baseUrl}/profile` : '/app/restaurants';
        form.put(putUrl, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Datos del local" />
            <AdminPanelBanner panel={panel} restaurantName={restaurant.name} />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="Datos del local"
                    description="Tu ficha pública en discover LAMB. Solo tú puedes editar la información de tu restaurante."
                    stats={statBadges}
                />

                {/* Tarjeta personal del dueño */}
                <div
                    className="relative overflow-hidden rounded-xl border px-5 py-4 shadow-sm"
                    style={{
                        borderColor: '#fecdd3',
                        background:
                            'radial-gradient(ellipse 120% 100% at 100% 0%, rgba(232,0,26,0.08) 0%, rgba(255,255,255,0.98) 55%)',
                    }}
                >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                            <span
                                className="flex size-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
                                style={{
                                    background: 'linear-gradient(135deg, #e8001a 0%, #8b0008 100%)',
                                }}
                            >
                                <Store className="size-6" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                                    Tu negocio
                                </p>
                                <p className="truncate text-lg font-semibold tracking-tight text-foreground">
                                    {displayName}
                                </p>
                                <p className="text-muted-foreground truncate text-sm">{owner.name}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge
                                variant="outline"
                                className="border-emerald-200 bg-emerald-50 text-emerald-800"
                            >
                                {stats.is_active ? 'Publicado' : 'Borrador'}
                            </Badge>
                            {restaurant.slug && (
                                <Badge variant="secondary" className="font-mono text-[11px]">
                                    /{String(restaurant.slug)}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-5">
                    <FormSection
                        title="Identidad del local"
                        description="Nombre y descripciones que verán los turistas."
                        icon={<Store className="size-4" />}
                        palette={SECTION.identity}
                    >
                        <FieldSpan full>
                            <FormField label="Nombre del restaurante" htmlFor="r-name" error={form.errors.name} required>
                                <Input
                                    id="r-name"
                                    value={String(form.data.name)}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    disabled={form.processing || readOnly}
                                    className="bg-white"
                                />
                            </FormField>
                        </FieldSpan>
                        <FieldSpan full>
                            <FormField label="Descripción corta" htmlFor="r-short" error={form.errors.short_description}>
                                <Input
                                    id="r-short"
                                    placeholder="Una línea para tarjetas y listados"
                                    value={String(form.data.short_description)}
                                    onChange={(e) => form.setData('short_description', e.target.value)}
                                    disabled={form.processing || readOnly}
                                    className="bg-white"
                                />
                            </FormField>
                        </FieldSpan>
                        <FieldSpan full>
                            <FormField label="Descripción completa" htmlFor="r-desc" error={form.errors.description}>
                                <Textarea
                                    id="r-desc"
                                    rows={4}
                                    placeholder="Historia, especialidades, ambiente…"
                                    value={String(form.data.description)}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    disabled={form.processing || readOnly}
                                    className="resize-y bg-white"
                                />
                            </FormField>
                        </FieldSpan>
                    </FormSection>

                    <FormSection
                        title="Ubicación"
                        description="Departamento, provincia y distrito en cascada (datos INEI)."
                        icon={<MapPin className="size-4" />}
                        palette={SECTION.location}
                    >
                        <FieldSpan full>
                            <GeoCascadeSelect
                                departments={departments}
                                value={geo}
                                onChange={(next) => {
                                    setGeo(next);
                                    form.setData('district_id', next.district_id ?? '');
                                }}
                                errors={{
                                    district_id: form.errors.district_id,
                                }}
                                disabled={form.processing || readOnly}
                            />
                        </FieldSpan>
                        <FieldSpan full>
                            <FormField label="Dirección" htmlFor="r-address" error={form.errors.address}>
                                <Input
                                    id="r-address"
                                    placeholder="Calle, número, referencia"
                                    value={String(form.data.address)}
                                    onChange={(e) => form.setData('address', e.target.value)}
                                    disabled={form.processing || readOnly}
                                    className="bg-white"
                                />
                            </FormField>
                        </FieldSpan>
                    </FormSection>

                    <FormSection
                        title="Experiencia gastronómica"
                        description="Cocinas, ambiente, tipos de salida y opciones dietéticas que ofrece el local (para recomendaciones IA)."
                        icon={<UtensilsCrossed className="size-4" />}
                        palette={SECTION.experience}
                    >
                        <FieldSpan full>
                            <FormField
                                label="Tipos de cocina"
                                htmlFor="r-cuisines"
                                error={
                                    (form.errors as Record<string, string | undefined>)['cuisine_type_ids'] ??
                                    (form.errors as Record<string, string | undefined>)['primary_cuisine_type_id']
                                }
                            >
                                <CuisineTypeMultiSelect
                                    options={cuisineTypes}
                                    selectedIds={form.data.cuisine_type_ids as number[]}
                                    primaryId={
                                        (form.data.primary_cuisine_type_id as number | null) ?? null
                                    }
                                    onChange={(ids, primaryId) => {
                                        form.setData('cuisine_type_ids', ids);
                                        form.setData('primary_cuisine_type_id', primaryId);
                                    }}
                                    disabled={form.processing || readOnly}
                                />
                            </FormField>
                        </FieldSpan>
                        <FieldSpan>
                            <FormField label="Ambiente" htmlFor="r-ambiance" error={form.errors.ambiance_id}>
                                <select
                                    id="r-ambiance"
                                    className={selectClass(!!form.errors.ambiance_id)}
                                    value={String(form.data.ambiance_id)}
                                    onChange={(e) =>
                                        form.setData('ambiance_id', e.target.value ? Number(e.target.value) : '')
                                    }
                                    disabled={form.processing || readOnly}
                                >
                                    <option value="">Seleccionar…</option>
                                    {ambiances.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.name}
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                        </FieldSpan>
                        <FieldSpan full>
                            <FormField
                                label="Tipos de salida adecuados"
                                htmlFor="r-party-types"
                                error={(form.errors as Record<string, string | undefined>)['party_type_ids']}
                            >
                                <p className="mb-2 text-xs text-muted-foreground">
                                    Indica para qué visitas es ideal tu local (puedes marcar varias).
                                </p>
                                <CatalogChipMultiSelect
                                    options={partyTypes}
                                    selectedIds={form.data.party_type_ids as number[]}
                                    onChange={(ids) => form.setData('party_type_ids', ids)}
                                    disabled={form.processing || readOnly}
                                />
                            </FormField>
                        </FieldSpan>
                        <FieldSpan full>
                            <FormField
                                label="Opciones dietéticas que atiendes"
                                htmlFor="r-dietary"
                                error={(form.errors as Record<string, string | undefined>)['dietary_option_ids']}
                            >
                                <p className="mb-2 text-xs text-muted-foreground">
                                    Marca las restricciones o estilos que tu carta puede cubrir.
                                </p>
                                <CatalogChipMultiSelect
                                    options={dietaryOptions}
                                    selectedIds={form.data.dietary_option_ids as number[]}
                                    onChange={(ids) => form.setData('dietary_option_ids', ids)}
                                    disabled={form.processing || readOnly}
                                />
                            </FormField>
                        </FieldSpan>
                        <FieldSpan full>
                            <FormField
                                label="Entorno del restaurante"
                                htmlFor="r-environments"
                                error={(form.errors as Record<string, string | undefined>)['restaurant_environment_ids']}
                            >
                                <p className="mb-2 text-xs text-muted-foreground">
                                    Describe el entorno físico de tu local (puedes marcar varios).
                                </p>
                                <CatalogChipMultiSelect
                                    options={restaurantEnvironments}
                                    selectedIds={form.data.restaurant_environment_ids as number[]}
                                    onChange={(ids) => form.setData('restaurant_environment_ids', ids)}
                                    disabled={form.processing || readOnly}
                                />
                            </FormField>
                        </FieldSpan>
                        <FieldSpan full>
                            <FormField
                                label="Momento recomendado"
                                htmlFor="r-moments"
                                error={(form.errors as Record<string, string | undefined>)['recommended_moment_ids']}
                            >
                                <p className="mb-2 text-xs text-muted-foreground">
                                    Indica en qué momentos del día recomiendas visitar tu local.
                                </p>
                                <CatalogChipMultiSelect
                                    options={recommendedMoments}
                                    selectedIds={form.data.recommended_moment_ids as number[]}
                                    onChange={(ids) => form.setData('recommended_moment_ids', ids)}
                                    disabled={form.processing || readOnly}
                                />
                            </FormField>
                        </FieldSpan>
                        <FieldSpan>
                            <FormField label="Rango de precio" htmlFor="r-price" error={form.errors.price_range} required>
                                <select
                                    id="r-price"
                                    className={selectClass(!!form.errors.price_range)}
                                    value={String(form.data.price_range)}
                                    onChange={(e) => form.setData('price_range', e.target.value)}
                                    disabled={form.processing || readOnly}
                                >
                                    <option value="economico">Económico</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="premium">Premium</option>
                                </select>
                            </FormField>
                        </FieldSpan>
                        <FieldSpan>
                            <FormField
                                label="Precio promedio (S/)"
                                htmlFor="r-avg"
                                error={form.errors.avg_price_per_person}
                            >
                                <Input
                                    id="r-avg"
                                    type="number"
                                    min={0}
                                    step="0.5"
                                    value={String(form.data.avg_price_per_person)}
                                    onChange={(e) => form.setData('avg_price_per_person', e.target.value)}
                                    disabled={form.processing || readOnly}
                                    className="bg-white"
                                />
                            </FormField>
                        </FieldSpan>
                        <FieldSpan>
                            <FormField label="Capacidad (personas)" htmlFor="r-cap" error={form.errors.capacity}>
                                <Input
                                    id="r-cap"
                                    type="number"
                                    min={1}
                                    value={String(form.data.capacity)}
                                    onChange={(e) => form.setData('capacity', e.target.value)}
                                    disabled={form.processing || readOnly}
                                    className="bg-white"
                                />
                            </FormField>
                        </FieldSpan>
                    </FormSection>

                    <FormSection
                        title="Contacto"
                        description="Canales para reservas y consultas de turistas."
                        icon={<Phone className="size-4" />}
                        palette={SECTION.contact}
                    >
                        <FieldSpan>
                            <FormField label="Teléfono" htmlFor="r-phone" error={form.errors.phone}>
                                <Input
                                    id="r-phone"
                                    value={String(form.data.phone)}
                                    onChange={(e) => form.setData('phone', e.target.value)}
                                    disabled={form.processing || readOnly}
                                    className="bg-white"
                                />
                            </FormField>
                        </FieldSpan>
                        <FieldSpan>
                            <FormField label="WhatsApp" htmlFor="r-wa" error={form.errors.whatsapp}>
                                <Input
                                    id="r-wa"
                                    value={String(form.data.whatsapp)}
                                    onChange={(e) => form.setData('whatsapp', e.target.value)}
                                    disabled={form.processing || readOnly}
                                    className="bg-white"
                                />
                            </FormField>
                        </FieldSpan>
                        <FieldSpan>
                            <FormField label="Correo" htmlFor="r-email" error={form.errors.email}>
                                <Input
                                    id="r-email"
                                    type="email"
                                    value={String(form.data.email)}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                    disabled={form.processing || readOnly}
                                    className="bg-white"
                                />
                            </FormField>
                        </FieldSpan>
                        <FieldSpan>
                            <FormField label="Sitio web" htmlFor="r-web" error={form.errors.website}>
                                <Input
                                    id="r-web"
                                    placeholder="https://"
                                    value={String(form.data.website)}
                                    onChange={(e) => form.setData('website', e.target.value)}
                                    disabled={form.processing || readOnly}
                                    className="bg-white"
                                />
                            </FormField>
                        </FieldSpan>
                    </FormSection>

                    <FormSection
                        title="Visibilidad"
                        description="Controla si tu local aparece en el portal público."
                        icon={<Globe className="size-4" />}
                        palette={SECTION.visibility}
                    >
                        <FieldSpan full>
                            <label
                                className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-3 transition-colors hover:bg-white/80"
                                style={{ borderColor: SECTION.visibility.border }}
                            >
                                <input
                                    type="checkbox"
                                    className="size-4 rounded border-input accent-[#cc0010]"
                                    checked={Boolean(form.data.is_active)}
                                    onChange={(e) => form.setData('is_active', e.target.checked)}
                                    disabled={form.processing || readOnly}
                                />
                                <span className="text-sm">
                                    <span className="font-medium text-foreground">Visible en la plataforma</span>
                                    <span className="mt-0.5 block text-xs text-muted-foreground">
                                        Si está desactivado, los turistas no verán tu restaurante en explore.
                                    </span>
                                </span>
                            </label>
                        </FieldSpan>
                    </FormSection>

                    {canManage && (
                        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border/60 pt-2">
                            <p className="text-muted-foreground mr-auto text-xs">
                                Los cambios aplican solo a tu local.
                            </p>
                            <Button
                                type="submit"
                                variant="brand"
                                size="sm"
                                disabled={form.processing || readOnly}
                                className="cursor-pointer gap-1.5 font-semibold shadow-md"
                            >
                                <Save className="size-4 opacity-80" />
                                {form.processing ? 'Guardando…' : 'Guardar cambios'}
                            </Button>
                        </div>
                    )}
                </form>
            </div>
        </>
    );
}

export default RestaurantFormPage;
