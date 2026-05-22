import { Head, Link } from '@inertiajs/react';
import {
    BarChart3,
    Building2,
    MessageSquareText,
    Star,
    Store,
    Users,
    Wine,
} from 'lucide-react';
import { PageHeader, STAT_COLORS, type StatBadge } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';
import { dashboard } from '@/routes';

type PlatformStats = {
    restaurants_total: number;
    restaurants_active: number;
    restaurants_verified: number;
    owners_total: number;
    reviews_total: number;
    reviews_pending: number;
    avg_rating: number;
};

type Props = {
    variant: 'owner' | 'platform';
    stats?: PlatformStats;
};

function PlatformDashboard({ stats }: { stats: PlatformStats }) {
    const badges: StatBadge[] = [
        { icon: <Wine className="size-3.5" />, label: 'Restaurantes', value: stats.restaurants_total, color: STAT_COLORS.violet },
        { icon: <Store className="size-3.5" />, label: 'Activos', value: stats.restaurants_active, color: STAT_COLORS.emerald },
        { icon: <Building2 className="size-3.5" />, label: 'Verificados', value: stats.restaurants_verified, color: STAT_COLORS.sky },
        { icon: <Users className="size-3.5" />, label: 'Dueños', value: stats.owners_total, color: STAT_COLORS.amber },
        { icon: <MessageSquareText className="size-3.5" />, label: 'Reseñas', value: stats.reviews_total, color: STAT_COLORS.rose },
        { icon: <Star className="size-3.5" />, label: 'Promedio', value: stats.avg_rating.toFixed(1), color: STAT_COLORS.orange },
    ];

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <PageHeader
                title="Panel de plataforma"
                description="Vista global de RestauranteAI. Gestiona locales, reseñas y métricas desde Administración."
                stats={badges}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                    href={APP_HREF.adminRestaurants}
                    className="group rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                    <Wine className="mb-3 size-8 text-violet-600" />
                    <h3 className="font-semibold">Restaurantes</h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Lista global, edición y gestión por local.
                    </p>
                    <Button variant="link" className="mt-3 h-auto p-0 text-[#cc0010]">
                        Ir →
                    </Button>
                </Link>
                <Link
                    href={APP_HREF.adminReviews}
                    className="group rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                    <MessageSquareText className="mb-3 size-8 text-rose-600" />
                    <h3 className="font-semibold">Reseñas</h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {stats.reviews_pending > 0
                            ? `${stats.reviews_pending} sin respuesta en la plataforma.`
                            : 'Todas las reseñas respondidas.'}
                    </p>
                    <Button variant="link" className="mt-3 h-auto p-0 text-[#cc0010]">
                        Ver reseñas →
                    </Button>
                </Link>
                <Link
                    href={APP_HREF.adminAnalytics}
                    className="group rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                    <BarChart3 className="mb-3 size-8 text-sky-600" />
                    <h3 className="font-semibold">Estadísticas global</h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Vistas, top restaurantes y actividad agregada.
                    </p>
                    <Button variant="link" className="mt-3 h-auto p-0 text-[#cc0010]">
                        Ver métricas →
                    </Button>
                </Link>
            </div>
        </div>
    );
}

function OwnerDashboard() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            <PageHeader
                title="Bienvenido"
                description="Usa el menú lateral para gestionar tu restaurante: datos, carta, galería y reseñas."
            />
            <div className="grid gap-3 sm:grid-cols-2">
                <Link
                    href={APP_HREF.restaurants}
                    className="rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                    <Store className="mb-2 size-6 text-violet-600" />
                    <span className="font-medium">Datos del local</span>
                </Link>
                <Link
                    href={APP_HREF.analytics}
                    className="rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                    <BarChart3 className="mb-2 size-6 text-sky-600" />
                    <span className="font-medium">Estadísticas</span>
                </Link>
            </div>
        </div>
    );
}

export default function Dashboard({ variant, stats }: Props) {
    return (
        <>
            <Head title="Dashboard" />
            {variant === 'platform' && stats ? <PlatformDashboard stats={stats} /> : <OwnerDashboard />}
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: appBreadcrumbs('Dashboard', dashboard()),
};
