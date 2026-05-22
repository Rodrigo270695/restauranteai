import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BarChart3,
    ChefHat,
    ImageIcon,
    Languages,
    LogIn,
    Mail,
    MapPin,
    Settings2,
    Sparkles,
    Star,
    Store,
    Tag,
    Timer,
    User,
    UtensilsCrossed,
} from 'lucide-react';
import { PageHeader, STAT_COLORS, type StatBadge } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';
import { cn } from '@/lib/utils';

type Restaurant = {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    is_verified: boolean;
    avg_rating: number;
    total_reviews: number;
    total_views: number;
    owner: { id: number; name: string; email: string } | null;
    cuisine: string | null;
    cuisines: Array<{ id: number; name: string; is_primary: boolean }>;
    district: string | null;
};

type Props = {
    restaurant: Restaurant;
    counts: { dishes: number; promotions: number; images: number; reviews: number };
    baseUrl: string;
};

type ModuleDef = {
    label: string;
    description: string;
    href: string;
    icon: typeof Store;
    palette: (typeof STAT_COLORS)[keyof typeof STAT_COLORS];
    count?: number;
    countLabel?: string;
};

function HubModuleCard({ baseUrl, mod }: { baseUrl: string; mod: ModuleDef }) {
    const Icon = mod.icon;
    const p = mod.palette;

    return (
        <Link
            href={`${baseUrl}${mod.href}`}
            className={cn(
                'group relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-xl border p-4 shadow-sm',
                'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
            )}
            style={{
                borderColor: p.border,
                background: `linear-gradient(145deg, ${p.bg} 0%, #ffffff 65%)`,
            }}
        >
            <div className="flex items-start justify-between gap-2">
                <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg border shadow-sm transition-transform group-hover:scale-105"
                    style={{
                        borderColor: p.border,
                        backgroundColor: '#fff',
                        color: p.iconColor ?? p.text,
                    }}
                >
                    <Icon className="size-5" />
                </span>
                {mod.count !== undefined && (
                    <span
                        className="rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                        style={{ borderColor: p.border, color: p.text, backgroundColor: '#fff' }}
                    >
                        {mod.count} {mod.countLabel ?? ''}
                    </span>
                )}
            </div>
            <div>
                <p className="font-semibold tracking-tight" style={{ color: p.text }}>
                    {mod.label}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{mod.description}</p>
            </div>
            <span
                className="text-[11px] font-medium opacity-0 transition-opacity group-hover:opacity-100"
                style={{ color: p.text }}
            >
                Abrir módulo →
            </span>
        </Link>
    );
}

function Page({ restaurant, counts, baseUrl }: Props) {
    const impersonate = () => {
        router.post(`${baseUrl}/impersonate`, {}, { preserveScroll: true });
    };

    const statBadges: StatBadge[] = [
        {
            icon: <BarChart3 className="size-3.5" />,
            label: 'Vistas',
            value: restaurant.total_views,
            color: STAT_COLORS.sky,
        },
        {
            icon: <Star className="size-3.5" />,
            label: 'Reseñas',
            value: restaurant.total_reviews,
            color: STAT_COLORS.violet,
        },
        {
            icon: <Sparkles className="size-3.5" />,
            label: 'Rating',
            value: restaurant.avg_rating.toFixed(1),
            color: STAT_COLORS.amber,
        },
        {
            icon: <ChefHat className="size-3.5" />,
            label: 'Platos',
            value: counts.dishes,
            color: STAT_COLORS.emerald,
        },
    ];

    const modules: ModuleDef[] = [
        {
            label: 'Perfil del local',
            description: 'Datos, ubicación y contacto',
            href: '/profile',
            icon: Store,
            palette: STAT_COLORS.violet,
        },
        {
            label: 'Horarios',
            description: 'Apertura por día',
            href: '/schedules',
            icon: Timer,
            palette: STAT_COLORS.sky,
        },
        {
            label: 'Galería',
            description: 'Fotos del local',
            href: '/gallery',
            icon: ImageIcon,
            palette: STAT_COLORS.rose,
            count: counts.images,
            countLabel: 'fotos',
        },
        {
            label: 'Servicios',
            description: 'Comodidades del negocio',
            href: '/services',
            icon: Settings2,
            palette: STAT_COLORS.emerald,
        },
        {
            label: 'Idiomas',
            description: 'Atención al cliente',
            href: '/languages',
            icon: Languages,
            palette: STAT_COLORS.blue,
        },
        {
            label: 'Platos',
            description: 'Carta y precios',
            href: '/dishes',
            icon: UtensilsCrossed,
            palette: STAT_COLORS.amber,
            count: counts.dishes,
            countLabel: 'platos',
        },
        {
            label: 'Promociones',
            description: 'Ofertas activas',
            href: '/promotions',
            icon: Tag,
            palette: STAT_COLORS.orange,
            count: counts.promotions,
            countLabel: 'promos',
        },
        {
            label: 'Estadísticas',
            description: 'Rendimiento del local',
            href: '/analytics',
            icon: BarChart3,
            palette: STAT_COLORS.violet,
            count: counts.reviews,
            countLabel: 'reseñas',
        },
    ];

    return (
        <>
            <Head title={`Gestionar · ${restaurant.name}`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={restaurant.name}
                    description="Centro de gestión del restaurante para super administrador."
                    stats={statBadges}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="cursor-pointer gap-1.5 border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                                onClick={impersonate}
                            >
                                <LogIn className="size-4" />
                                Ver como dueño
                            </Button>
                            <Link href={APP_HREF.adminRestaurants}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer gap-1.5 border-slate-200 hover:bg-slate-50"
                                >
                                    <ArrowLeft className="size-4" />
                                    Volver a lista
                                </Button>
                            </Link>
                        </div>
                    }
                />

                <section
                    className="overflow-hidden rounded-xl border shadow-sm"
                    style={{
                        borderColor: STAT_COLORS.violet.border,
                        background: `linear-gradient(135deg, ${STAT_COLORS.violet.bg} 0%, #ffffff 55%)`,
                    }}
                >
                    <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            {restaurant.is_active && (
                                <Badge className="border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-600">
                                    Activo
                                </Badge>
                            )}
                            {!restaurant.is_active && (
                                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">
                                    Inactivo
                                </Badge>
                            )}
                            {restaurant.is_verified && (
                                <Badge className="border-sky-300 bg-sky-600 text-white hover:bg-sky-600">
                                    Verificado
                                </Badge>
                            )}
                            {(restaurant.cuisines?.length
                                ? restaurant.cuisines
                                : restaurant.cuisine
                                  ? [{ id: 0, name: restaurant.cuisine, is_primary: true }]
                                  : []
                            ).map(c => (
                                <Badge
                                    key={c.id || c.name}
                                    variant="outline"
                                    className={cn(
                                        'gap-1',
                                        c.is_primary
                                            ? 'border-amber-300 bg-amber-100 text-amber-900'
                                            : 'border-amber-200 bg-amber-50 text-amber-800',
                                    )}
                                >
                                    <UtensilsCrossed className="size-3" />
                                    {c.name}
                                    {c.is_primary ? ' ★' : ''}
                                </Badge>
                            ))}
                            {restaurant.district && (
                                <Badge variant="outline" className="gap-1 border-sky-200 bg-sky-50 text-sky-900">
                                    <MapPin className="size-3" />
                                    {restaurant.district}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {restaurant.owner && (
                        <div
                            className="flex flex-wrap items-center gap-4 border-t px-5 py-3 text-sm"
                            style={{ borderColor: STAT_COLORS.violet.border }}
                        >
                            <span className="flex items-center gap-2 text-foreground">
                                <span
                                    className="flex size-8 items-center justify-center rounded-full border bg-white"
                                    style={{ borderColor: STAT_COLORS.violet.border, color: STAT_COLORS.violet.text }}
                                >
                                    <User className="size-4" />
                                </span>
                                <span>
                                    <span className="text-muted-foreground">Dueño · </span>
                                    <strong>{restaurant.owner.name}</strong>
                                </span>
                            </span>
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Mail className="size-3.5 shrink-0" />
                                {restaurant.owner.email}
                            </span>
                        </div>
                    )}
                </section>

                <div>
                    <h2 className="mb-3 text-sm font-semibold tracking-tight text-foreground">
                        Módulos del local
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {modules.map((mod) => (
                            <HubModuleCard key={mod.href} baseUrl={baseUrl} mod={mod} />
                        ))}
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    {[
                        { label: 'Fotos en galería', value: counts.images, palette: STAT_COLORS.rose },
                        { label: 'Promociones', value: counts.promotions, palette: STAT_COLORS.orange },
                        { label: 'Reseñas visibles', value: counts.reviews, palette: STAT_COLORS.violet },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="rounded-lg border px-4 py-3"
                            style={{
                                borderColor: item.palette.border,
                                backgroundColor: item.palette.bg,
                            }}
                        >
                            <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: item.palette.text }}>
                                {item.label}
                            </p>
                            <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: item.palette.text }}>
                                {item.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default Page;
Page.layout = {
    breadcrumbs: [
        ...appBreadcrumbs('Restaurantes', APP_HREF.adminRestaurants),
        { title: 'Gestionar', href: '#' },
    ],
};
