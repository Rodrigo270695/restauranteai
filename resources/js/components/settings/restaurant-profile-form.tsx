import { useForm } from '@inertiajs/react';
import { AlignLeft, Globe, MapPin, Phone, Store } from 'lucide-react';
import Heading from '@/components/common/heading';
import InputError from '@/components/common/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { update as restaurantProfileRoute } from '@/routes/profile/restaurant';

const INPUT_CLS =
    'border-gray-200 bg-white placeholder:text-gray-400 focus-visible:border-brand-red focus-visible:ring-brand-red/20';

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
    saved?: boolean;
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

export default function RestaurantProfileForm({ restaurantProfile, saved }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        description: restaurantProfile.description ?? '',
        address: restaurantProfile.address ?? '',
        district: restaurantProfile.district ?? '',
        phone: restaurantProfile.phone ?? '',
        website: restaurantProfile.website ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        patch(restaurantProfileRoute.url(), { preserveScroll: true });
    }

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title="Perfil del restaurante"
                description="Información visible para los clientes en la plataforma"
            />

            {/* Tarjeta info de solo lectura */}
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-red/10">
                    <Store className="h-4 w-4 text-brand-red" />
                </div>
                <div>
                    <p className="font-semibold text-gray-800">
                        {restaurantProfile.business_name}
                    </p>
                    {restaurantProfile.ruc && (
                        <p className="text-xs text-gray-500">
                            RUC: {restaurantProfile.ruc}
                        </p>
                    )}
                    <p className="text-xs text-gray-400">
                        Estado:{' '}
                        <span
                            className={cn(
                                'font-medium',
                                STATUS_COLORS[restaurantProfile.status] ??
                                    'text-gray-500',
                            )}
                        >
                            {STATUS_LABELS[restaurantProfile.status] ??
                                restaurantProfile.status}
                        </span>
                    </p>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
                {/* Descripción */}
                <div className="grid gap-1.5">
                    <Label htmlFor="description">
                        Descripción{' '}
                        <span className="text-brand-red">*</span>
                    </Label>
                    <div className="relative">
                        <AlignLeft className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-brand-red opacity-60" />
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            rows={3}
                            placeholder="Describe tu restaurante, especialidades, ambiente..."
                            className={cn(
                                'resize-none pl-9',
                                INPUT_CLS,
                                errors.description && 'border-red-400 bg-red-50',
                            )}
                        />
                    </div>
                    <InputError message={errors.description} />
                </div>

                {/* Dirección + Distrito */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                        <Label htmlFor="address">Dirección</Label>
                        <div className="relative">
                            <MapPin className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-brand-red opacity-60" />
                            <Input
                                id="address"
                                value={data.address}
                                onChange={(e) =>
                                    setData('address', e.target.value)
                                }
                                placeholder="Av. Juan Pablo II 123"
                                className={cn(
                                    'pl-9',
                                    INPUT_CLS,
                                    errors.address && 'border-red-400 bg-red-50',
                                )}
                            />
                        </div>
                        <InputError message={errors.address} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="district">Distrito</Label>
                        <div className="relative">
                            <MapPin className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-brand-red opacity-60" />
                            <Input
                                id="district"
                                value={data.district}
                                onChange={(e) =>
                                    setData('district', e.target.value)
                                }
                                placeholder="Chiclayo"
                                className={cn(
                                    'pl-9',
                                    INPUT_CLS,
                                    errors.district &&
                                        'border-red-400 bg-red-50',
                                )}
                            />
                        </div>
                        <InputError message={errors.district} />
                    </div>
                </div>

                {/* Teléfono */}
                <div className="grid gap-1.5">
                    <Label htmlFor="phone">Teléfono</Label>
                    <div className="relative">
                        <Phone className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-brand-red opacity-60" />
                        <Input
                            id="phone"
                            type="tel"
                            value={data.phone}
                            onChange={(e) =>
                                setData('phone', e.target.value)
                            }
                            placeholder="+51 999 999 999"
                            className={cn(
                                'pl-9',
                                INPUT_CLS,
                                errors.phone && 'border-red-400 bg-red-50',
                            )}
                        />
                    </div>
                    <InputError message={errors.phone} />
                </div>

                {/* Sitio web */}
                <div className="grid gap-1.5">
                    <Label htmlFor="website">Sitio web</Label>
                    <div className="relative">
                        <Globe className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-brand-red opacity-60" />
                        <Input
                            id="website"
                            type="url"
                            value={data.website}
                            onChange={(e) =>
                                setData('website', e.target.value)
                            }
                            placeholder="https://mirestaurante.pe"
                            className={cn(
                                'pl-9',
                                INPUT_CLS,
                                errors.website && 'border-red-400 bg-red-50',
                            )}
                        />
                    </div>
                    <InputError message={errors.website} />
                </div>

                {saved && (
                    <p className="text-sm font-medium text-green-600">
                        Perfil del restaurante actualizado correctamente.
                    </p>
                )}

                <Button type="submit" variant="brand" disabled={processing} className="cursor-pointer">
                    Guardar perfil del restaurante
                </Button>
            </form>
        </div>
    );
}
