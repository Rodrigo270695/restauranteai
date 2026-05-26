import { router, usePage } from '@inertiajs/react';
import { Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
    actingRestaurant?: { id: number; name: string } | null;
};

export function ActingRestaurantBanner({ actingRestaurant }: Props) {
    if (!actingRestaurant) return null;

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 bg-amber-50 px-4 py-2 text-sm text-amber-950">
            <span className="flex items-center gap-2">
                <Eye className="size-4 shrink-0" />
                Gestionando como dueño: <strong>{actingRestaurant.name}</strong>
                <span className="text-amber-800/80 hidden sm:inline">
                    — puedes editar datos, galería y platos. Los cambios se guardan en este local.
                </span>
            </span>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 cursor-pointer gap-1 border-amber-300 bg-white text-xs"
                onClick={() => router.post('/app/admin/stop-impersonating')}
            >
                <X className="size-3.5" />
                Salir
            </Button>
        </div>
    );
}

export function ActingRestaurantBannerFromPage() {
    const acting = usePage<{ actingRestaurant?: { id: number; name: string } | null }>().props
        .actingRestaurant;
    return <ActingRestaurantBanner actingRestaurant={acting} />;
}
