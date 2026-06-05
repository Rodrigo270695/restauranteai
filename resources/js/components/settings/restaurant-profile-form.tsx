import { Link } from '@inertiajs/react';
import { ArrowRight, Building2, MapPin, Store } from 'lucide-react';
import Heading from '@/components/common/heading';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { restaurants as appRestaurantsRoute } from '@/routes/app';

export interface RestaurantProfileData {
    business_name: string;
    ruc: string | null;
    phone: string | null;
    address: string | null;
    district: string | null;
    website: string | null;
    description: string | null;
    status: 'pending' | 'approved' | 'rejected';
}

interface Props {
    restaurantProfile: RestaurantProfileData;
    needsOnboarding?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
    approved: 'Aprobado',
    rejected: 'Rechazado',
    pending: 'En revisión',
};
const STATUS_COLORS: Record<string, string> = {
    approved: 'text-green-600',
    rejected: 'text-red-500',
    pending: 'text-amber-600',
};

/**
 * Datos operativos del local (dirección, mapa, cocinas, etc.) viven en
 * «Datos del local» (/app/restaurants), no aquí.
 */
export default function RestaurantProfileForm({ restaurantProfile, needsOnboarding = false }: Props) {
    return (
        <div className="space-y-5">
            <Heading
                variant="small"
                title="Tu negocio en la plataforma"
                description="Razón social y estado de la cuenta. La ficha que ven los turistas se edita en Datos del local."
            />

            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-red/10">
                    <Store className="h-4 w-4 text-brand-red" />
                </div>
                <div>
                    <p className="font-semibold text-gray-800">{restaurantProfile.business_name}</p>
                    {restaurantProfile.ruc && (
                        <p className="text-xs text-gray-500">RUC: {restaurantProfile.ruc}</p>
                    )}
                    <p className="text-xs text-gray-400">
                        Estado:{' '}
                        <span
                            className={cn(
                                'font-medium',
                                STATUS_COLORS[restaurantProfile.status] ?? 'text-gray-500',
                            )}
                        >
                            {STATUS_LABELS[restaurantProfile.status] ?? restaurantProfile.status}
                        </span>
                    </p>
                </div>
            </div>

            {needsOnboarding && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <p className="font-semibold">Completa tu primer local</p>
                    <p className="mt-1 text-xs leading-relaxed">
                        Indica dirección, ubicación en el mapa y datos del restaurante en{' '}
                        <strong>Datos del local</strong>. No hace falta repetir esa información aquí.
                    </p>
                </div>
            )}

            <div className="grid gap-3 rounded-xl border border-orange-100 bg-orange-50/40 p-4 sm:grid-cols-2">
                <div className="flex gap-3 text-sm text-gray-700">
                    <Building2 className="mt-0.5 size-4 shrink-0 text-brand-red" />
                    <div>
                        <p className="font-semibold text-gray-900">Configuración (aquí)</p>
                        <p className="mt-0.5 text-xs text-gray-600">
                            Cuenta, correo y datos legales del negocio (razón social, RUC).
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 text-sm text-gray-700">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-brand-orange" />
                    <div>
                        <p className="font-semibold text-gray-900">Datos del local</p>
                        <p className="mt-0.5 text-xs text-gray-600">
                            Cada sucursal: nombre, descripción, dirección, mapa, contacto y cocinas.
                        </p>
                    </div>
                </div>
            </div>

            <Button variant="brand" className="cursor-pointer" asChild>
                <Link href={appRestaurantsRoute.url()}>
                    Ir a Datos del local
                    <ArrowRight className="ml-2 size-4" />
                </Link>
            </Button>
        </div>
    );
}
