import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ChefHat, ImagePlus, Pencil, Plus, Sparkles, Trash2, UtensilsCrossed } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormSection, STAT_COLORS } from '@/components/app/owner/form-section';
import { DishFormModal, type DishFormData } from '@/components/app/owner/dish-form-modal';
import { ConfirmModal } from '@/components/modals/confirm-modal';
import { PageHeader, type StatBadge } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminPanelBanner } from '@/components/layout/admin-panel-banner';
import { useCan } from '@/hooks/use-can';
import { useOwnerReadOnly } from '@/hooks/use-owner-read-only';
import { scopedPath, type PanelContext } from '@/lib/scoped-app-path';
import { cn } from '@/lib/utils';

export type DishRow = {
    id: number;
    name: string;
    description: string | null;
    price: number;
    dish_category_id: number | null;
    category_name: string | null;
    image_url: string | null;
    has_image: boolean;
    is_available: boolean;
    is_signature: boolean;
    display_order: number;
};

type Props = {
    restaurant: { id: number; name: string };
    owner: { name: string; business_name?: string | null };
    dishes: DishRow[];
    categories: { id: number; name: string }[];
    stats: { total: number; available: number; with_photo: number };
    panel?: PanelContext;
};

const emptyDishForm = (): DishFormData => ({
    name: '',
    description: '',
    price: '',
    dish_category_id: '',
    image: null,
    is_available: true,
    is_signature: false,
});

export function RestaurantDishesPage({ restaurant, owner, dishes, categories, stats, panel }: Props) {
    const can = useCan();
    const readOnly = useOwnerReadOnly();
    const canManage = can('manage_dishes') && !readOnly;
    const dishesBase = scopedPath('/dishes', panel);
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<DishRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DishRow | null>(null);

    const createForm = useForm(emptyDishForm());
    const editForm = useForm(emptyDishForm());

    useEffect(() => {
        if (!flash?.success && !flash?.error) return;
        import('sonner').then(({ toast }) => {
            if (flash.success) toast.success(flash.success);
            if (flash.error) toast.error(flash.error);
        });
    }, [flash]);

    const displayName = owner.business_name || restaurant.name;

    const statBadges: StatBadge[] = [
        { icon: <UtensilsCrossed className="size-3.5" />, label: 'Platos', value: stats.total, color: STAT_COLORS.violet },
        {
            icon: <ChefHat className="size-3.5" />,
            label: 'Disponibles',
            value: stats.available,
            color: STAT_COLORS.emerald,
        },
        {
            icon: <ImagePlus className="size-3.5" />,
            label: 'Con foto',
            value: stats.with_photo,
            color: stats.with_photo > 0 ? STAT_COLORS.sky : STAT_COLORS.amber,
        },
    ];

    const openEdit = (dish: DishRow) => {
        setEditTarget(dish);
        editForm.setData({
            name: dish.name,
            description: dish.description ?? '',
            price: dish.price,
            dish_category_id: dish.dish_category_id ?? '',
            image: null,
            is_available: dish.is_available,
            is_signature: dish.is_signature,
        });
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
        createForm.post(dishesBase, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly || !editTarget) return;
        editForm.transform((data) => ({ ...data, _method: 'put' })).post(`${dishesBase}/${editTarget.id}`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setEditTarget(null);
                editForm.reset();
            },
        });
    };

    const formatPrice = (n: number) =>
        new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);

    return (
        <>
            <Head title="Platos" />
            <AdminPanelBanner panel={panel} restaurantName={restaurant.name} />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="Platos"
                    description="Carta digital: nombre, precio y foto de cada plato. Las fotos del local (fachada, salón) van en Galería."
                    stats={statBadges}
                    actions={
                        canManage ? (
                            <Button
                                variant="brand"
                                size="sm"
                                className="cursor-pointer gap-1.5 font-semibold"
                                onClick={() => setCreateOpen(true)}
                            >
                                <Plus className="size-4" />
                                Nuevo plato
                            </Button>
                        ) : null
                    }
                />

                <FormSection
                    title="Tu carta"
                    description="Cada plato puede tener foto propia. Los turistas la ven al explorar tu menú."
                    icon={<ChefHat className="size-4" />}
                    palette={STAT_COLORS.violet}
                    contentClassName="p-4 md:p-5"
                >
                    {dishes.length === 0 ? (
                        <div
                            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center"
                            style={{ borderColor: STAT_COLORS.violet.border, background: STAT_COLORS.violet.bg }}
                        >
                            <UtensilsCrossed className="size-10 text-muted-foreground/50" />
                            <p className="text-sm font-medium text-foreground">Aún no hay platos</p>
                            <p className="text-muted-foreground max-w-sm text-xs">
                                Agrega el primer plato con precio y foto para armar tu carta en {displayName}.
                            </p>
                            {canManage && (
                                <Button variant="brand" size="sm" onClick={() => setCreateOpen(true)}>
                                    Agregar primer plato
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {dishes.map((dish) => (
                                <article
                                    key={dish.id}
                                    className={cn(
                                        'overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md',
                                        !dish.is_available && 'opacity-75',
                                    )}
                                >
                                    <div className="relative aspect-[4/3] bg-muted/30">
                                        {dish.image_url ? (
                                            <img
                                                src={dish.image_url}
                                                alt={dish.name}
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground/60">
                                                <ImagePlus className="size-8" />
                                                <span className="text-[10px]">Sin foto</span>
                                            </div>
                                        )}
                                        {dish.is_signature && (
                                            <Badge className="absolute top-2 left-2 gap-1 border-violet-300 bg-violet-50 text-violet-900">
                                                <Sparkles className="size-3" />
                                                Emblema
                                            </Badge>
                                        )}
                                        {!dish.is_available && (
                                            <Badge variant="secondary" className="absolute top-2 right-2 text-[10px]">
                                                No disponible
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="space-y-2 p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="line-clamp-1 text-sm font-semibold">{dish.name}</h3>
                                            <span className="shrink-0 text-sm font-bold text-[#cc0010]">
                                                {formatPrice(dish.price)}
                                            </span>
                                        </div>
                                        {dish.category_name && (
                                            <p className="text-muted-foreground text-[11px]">{dish.category_name}</p>
                                        )}
                                        {dish.description && (
                                            <p className="text-muted-foreground line-clamp-2 text-xs">{dish.description}</p>
                                        )}
                                        {canManage && (
                                            <div className="flex gap-1.5 pt-1">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 flex-1 cursor-pointer text-[11px] text-violet-700 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-900 dark:hover:border-violet-800 dark:hover:bg-violet-950/40"
                                                    onClick={() => openEdit(dish)}
                                                >
                                                    <Pencil className="size-3" />
                                                    Editar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    title="Eliminar plato"
                                                    className="h-7 w-7 cursor-pointer rounded-md border p-0 text-rose-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800 dark:hover:border-rose-800 dark:hover:bg-rose-950/40"
                                                    onClick={() => setDeleteTarget(dish)}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </FormSection>
            </div>

            <DishFormModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                editing={null}
                form={createForm}
                categories={categories}
                onSubmit={submitCreate}
            />

            <DishFormModal
                open={!!editTarget}
                onClose={() => setEditTarget(null)}
                editing={editTarget}
                form={editForm}
                categories={categories}
                onSubmit={submitEdit}
                previewUrl={editTarget?.image_url ?? null}
            />

            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Eliminar plato"
                description={`¿Quitar "${deleteTarget?.name}" de la carta?`}
                confirmLabel="Eliminar"
                variant="destructive"
                onConfirm={() => {
                    if (deleteTarget) {
                        router.delete(`${dishesBase}/${deleteTarget.id}`, {
                            preserveScroll: true,
                            onFinish: () => setDeleteTarget(null),
                        });
                    }
                }}
            />
        </>
    );
}

export default RestaurantDishesPage;
