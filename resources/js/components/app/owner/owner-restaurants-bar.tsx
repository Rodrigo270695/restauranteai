import { router, useForm } from '@inertiajs/react';
import { Check, MapPin, Plus, Store } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type OwnedRestaurantItem = {
    id: number;
    name: string;
    slug: string;
    address?: string | null;
    has_location: boolean;
    is_active: boolean;
};

type Props = {
    restaurants: OwnedRestaurantItem[];
    activeRestaurantId: number;
    readOnly?: boolean;
};

export function OwnerRestaurantsBar({ restaurants, activeRestaurantId, readOnly = false }: Props) {
    const [addOpen, setAddOpen] = useState(false);
    const form = useForm({ name: '' });

    if (readOnly) {
        return null;
    }

    const submitNew = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/app/restaurants/locations', {
            preserveScroll: true,
            onSuccess: () => {
                setAddOpen(false);
                form.reset();
            },
        });
    };

    return (
        <>
            <section className="rounded-xl border border-orange-100 bg-gradient-to-r from-orange-50/80 to-white p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">Mis locales</h2>
                        <p className="text-xs text-gray-500">
                            Cambia de sucursal o añade otro restaurante bajo tu cuenta
                        </p>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="cursor-pointer rounded-lg"
                        onClick={() => setAddOpen(true)}
                    >
                        <Plus className="mr-1 size-3.5" />
                        Añadir local
                    </Button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {restaurants.map(r => {
                        const active = r.id === activeRestaurantId;

                        return (
                            <button
                                key={r.id}
                                type="button"
                                disabled={active}
                                onClick={() => {
                                    if (active) return;
                                    router.post('/app/restaurants/switch', { restaurant_id: r.id });
                                }}
                                className={cn(
                                    'min-w-[10rem] shrink-0 rounded-xl border px-3 py-2.5 text-left transition',
                                    active
                                        ? 'border-brand-orange bg-brand-orange text-white shadow-md'
                                        : 'cursor-pointer border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/50',
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <Store className={cn('size-4 shrink-0', active ? 'text-white' : 'text-brand-orange')} />
                                    {active && <Check className="size-4 shrink-0" />}
                                </div>
                                <p className="mt-1 line-clamp-1 text-xs font-bold">{r.name}</p>
                                <p
                                    className={cn(
                                        'mt-0.5 flex items-center gap-0.5 text-[10px]',
                                        active ? 'text-white/90' : 'text-gray-500',
                                    )}
                                >
                                    <MapPin className="size-2.5 shrink-0" />
                                    {r.has_location ? 'En mapa' : 'Sin ubicación'}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </section>

            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={submitNew}>
                        <DialogHeader>
                            <DialogTitle>Nuevo local</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Input
                                value={form.data.name}
                                onChange={e => form.setData('name', e.target.value)}
                                placeholder="Ej. La Casona — Sucursal Centro"
                                className="rounded-xl"
                                autoFocus
                            />
                            {form.errors.name && (
                                <p className="mt-1 text-xs text-red-600">{form.errors.name}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.processing} className="btn-brand-cta text-white">
                                Crear local
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
