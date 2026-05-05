/**
 * Geography — página de administración en cascada.
 *
 * Departamentos → Provincias → Distritos.
 * Toda la UI de columnas, filas y modales está en ./_components/.
 */

import { Head, router } from '@inertiajs/react';
import { Globe2, Map, MapPin } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { ConfirmModal } from '@/components/modals/confirm-modal';
import { PageHeader, STAT_COLORS } from '@/components/shared/page-header';
import type { StatBadge } from '@/components/shared/page-header';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { useCan } from '@/hooks/use-can';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';
import {
    destroy as deptDestroy,
    store as deptStore,
    update as deptUpdate,
} from '@/routes/app/admin/geography/departments';
import {
    destroy as distDestroy,
    store as distStore,
    update as distUpdate,
} from '@/routes/app/admin/geography/districts';
import {
    destroy as provDestroy,
    store as provStore,
    update as provUpdate,
} from '@/routes/app/admin/geography/provinces';

import { CascadeColumn } from './_components/cascade-column';
import { EmptyState } from './_components/empty-state';
import { GeoFormModal } from './_components/geo-form-modal';
import { ItemRow } from './_components/item-row';
import type { Department, District, GeoFormState, GeoStats, Province } from './_components/types';

// ─── tipos de página ──────────────────────────────────────────────────────────

type Props = {
    departments: Department[];
    stats: GeoStats;
    flash?: { success?: string; error?: string };
};

const EMPTY_FORM: GeoFormState = { name: '', code: '' };

// ─── página ───────────────────────────────────────────────────────────────────

export default function GeographyPage({ departments, stats, flash }: Props) {
    // ── toast de flash ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!flash?.success && !flash?.error) {
            return;
        }

        import('sonner').then(({ toast }) => {
            if (flash.success) {
                toast.success(flash.success);
            }

            if (flash.error) {
                toast.error(flash.error);
            }
        });
    }, [flash?.success, flash?.error]);

    // ── permisos ──────────────────────────────────────────────────────────────
    const can       = useCan();
    const canCreate = can('geography.create');
    const canEdit   = can('geography.edit');
    const canDelete = can('geography.delete');

    // ── selección en cascada ──────────────────────────────────────────────────
    const [selectedDept, setSelectedDept] = useState<Department | null>(null);
    const [selectedProv, setSelectedProv] = useState<Province | null>(null);

    // Sincroniza la selección cuando Inertia trae datos frescos del servidor.
    // Esto mantiene el objeto actualizado (con los nuevos hijos) sin perder la selección.
    const syncedDept = selectedDept
        ? (departments.find((d) => d.id === selectedDept.id) ?? null)
        : null;
    const syncedProv = syncedDept && selectedProv
        ? (syncedDept.provinces.find((p) => p.id === selectedProv.id) ?? null)
        : null;

    function selectDept(dept: Department) {
        setSelectedProv(null);
        setSelectedDept((prev) => (prev?.id === dept.id ? null : dept));
    }

    function selectProv(prov: Province) {
        setSelectedProv((prev) => (prev?.id === prov.id ? null : prov));
    }

    // ── estado de modales (genérico por nivel) ────────────────────────────────
    type GeoErrors = Partial<Record<'name' | 'code', string>>;
    type ModalState<T> = { open: boolean; editing: T | null; form: GeoFormState; processing: boolean; errors: GeoErrors };
    const modalDefaults = <T,>(): ModalState<T> => ({ open: false, editing: null, form: EMPTY_FORM, processing: false, errors: {} });

    const [deptModal, setDeptModal] = useState<ModalState<Department>>(modalDefaults());
    const [provModal, setProvModal] = useState<ModalState<Province>>(modalDefaults());
    const [distModal, setDistModal] = useState<ModalState<District>>(modalDefaults());

    function openModal<T extends { name: string; code: string }>(
        setter: React.Dispatch<React.SetStateAction<ModalState<T>>>,
        item?: T,
    ) {
        setter({ open: true, editing: item ?? null, form: item ? { name: item.name, code: item.code } : EMPTY_FORM, processing: false, errors: {} });
    }

    // ── confirmación de eliminación ───────────────────────────────────────────
    const [confirm, setConfirm] = useState<{ open: boolean; label: string; action: (() => void) | null; processing: boolean }>
        ({ open: false, label: '', action: null, processing: false });

    function promptDelete(label: string, action: () => void) {
        setConfirm({ open: true, label, action, processing: false });
    }

    // ── helpers CRUD ──────────────────────────────────────────────────────────
    function submitCrud<T>(
        modal: ModalState<T>,
        setModal: React.Dispatch<React.SetStateAction<ModalState<T>>>,
        storeUrl: string,
        updateUrl: (id: number) => string,
        extra?: Record<string, unknown>,
    ) {
        return (e: FormEvent) => {
            e.preventDefault();
            setModal((m) => ({ ...m, processing: true, errors: {} }));
            const isEdit = !!modal.editing;
            const id = (modal.editing as unknown as { id: number } | null)?.id ?? 0;
            const data = { ...modal.form, ...(!isEdit ? extra : {}) };
            router[isEdit ? 'put' : 'post'](isEdit ? updateUrl(id) : storeUrl, data, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setModal((m) => ({ ...m, open: false, processing: false, errors: {} })),
                onError: (errs) => setModal((m) => ({
                    ...m,
                    processing: false,
                    errors: { name: errs['name'], code: errs['code'] },
                })),
            });
        };
    }

    function destroyCrud(url: string, onSuccess?: () => void) {
        setConfirm((c) => ({ ...c, processing: true }));
        router.delete(url, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setConfirm((c) => ({ ...c, open: false, processing: false }));
                onSuccess?.();
            },
            onError: () => setConfirm((c) => ({ ...c, processing: false })),
        });
    }

    // ── stats dinámicos según selección ───────────────────────────────────────
    // Sin selección   → totales globales
    // Dpto. elegido   → provincias y distritos de ese dpto.
    // Prov. elegida   → distritos de esa provincia
    const deptDistrictsCount = syncedDept
        ? syncedDept.provinces.reduce((acc, p) => acc + p.districts.length, 0)
        : stats.districts;

    const statBadges: StatBadge[] = [
        {
            icon: <Globe2 className="size-3.5" />,
            label: syncedDept ? syncedDept.name : 'Departamentos',
            value: syncedDept ? syncedDept.provinces.length : stats.departments,
            color: syncedDept ? STAT_COLORS.orange : STAT_COLORS.blue,
        },
        {
            icon: <Map className="size-3.5" />,
            label: syncedProv
                ? syncedProv.name
                : syncedDept
                    ? 'Provincias en ' + syncedDept.name
                    : 'Provincias',
            value: syncedProv
                ? syncedProv.districts.length
                : syncedDept
                    ? syncedDept.provinces.length
                    : stats.provinces,
            color: syncedProv ? STAT_COLORS.rose : STAT_COLORS.violet,
        },
        {
            icon: <MapPin className="size-3.5" />,
            label: syncedProv ? 'Distritos en ' + syncedProv.name : 'Distritos',
            value: syncedProv ? syncedProv.districts.length : deptDistrictsCount,
            color: STAT_COLORS.emerald,
        },
    ];

    // Los datos siempre vienen de los props frescos de Inertia
    const provinces = syncedDept?.provinces ?? [];
    const districts = syncedProv?.districts ?? [];

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <>
            <Head title="Geografía" />

            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <PageHeader
                    title="Geografía"
                    description="Administra departamentos, provincias y distritos del país."
                    stats={statBadges}
                />

                {/* ── Tres columnas en cascada ─────────────────────────────── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

                    {/* Departamentos */}
                    <CascadeColumn
                        icon={<Globe2 className="size-3.5" />}
                        title="Departamentos"
                        subtitle={`${departments.length} registros`}
                        canCreate={canCreate}
                        onAdd={() => openModal(setDeptModal)}
                        addLabel="Nuevo"
                    >
                        {departments.length === 0 ? (
                            <EmptyState message="Sin departamentos. Crea el primero." />
                        ) : (
                            departments.map((dept) => (
                                <ItemRow
                                    key={dept.id}
                                    name={dept.name}
                                    code={dept.code}
                                    selected={syncedDept?.id === dept.id}
                                    hasChildren
                                    childCount={dept.provinces.length}
                                    onClick={() => selectDept(dept)}
                                    canEdit={canEdit}
                                    canDelete={canDelete}
                                    onEdit={() => openModal(setDeptModal, dept)}
                                    onDelete={() => promptDelete(
                                        `departamento «${dept.name}»`,
                                        () => destroyCrud(deptDestroy.url({ department: dept.id }), () => {
                                            if (syncedDept?.id === dept.id) {
                                                setSelectedDept(null);
                                                setSelectedProv(null);
                                            }
                                        }),
                                    )}
                                />
                            ))
                        )}
                    </CascadeColumn>

                    {/* Provincias */}
                    <CascadeColumn
                        icon={<Map className="size-3.5" />}
                        title="Provincias"
                        subtitle={syncedDept ? `de ${syncedDept.name}` : 'Selecciona un departamento'}
                        canCreate={canCreate && !!syncedDept}
                        onAdd={() => openModal(setProvModal)}
                        addLabel="Nueva"
                    >
                        {!syncedDept ? (
                            <EmptyState message="Selecciona un departamento para ver sus provincias." />
                        ) : provinces.length === 0 ? (
                            <EmptyState message="Sin provincias. Crea la primera." />
                        ) : (
                            provinces.map((prov) => (
                                <ItemRow
                                    key={prov.id}
                                    name={prov.name}
                                    code={prov.code}
                                    selected={syncedProv?.id === prov.id}
                                    hasChildren
                                    childCount={prov.districts.length}
                                    onClick={() => selectProv(prov)}
                                    canEdit={canEdit}
                                    canDelete={canDelete}
                                    onEdit={() => openModal(setProvModal, prov)}
                                    onDelete={() => promptDelete(
                                        `provincia «${prov.name}»`,
                                        () => destroyCrud(provDestroy.url({ province: prov.id }), () => {
                                            if (syncedProv?.id === prov.id) {
                                                setSelectedProv(null);
                                            }
                                        }),
                                    )}
                                />
                            ))
                        )}
                    </CascadeColumn>

                    {/* Distritos */}
                    <CascadeColumn
                        icon={<MapPin className="size-3.5" />}
                        title="Distritos"
                        subtitle={syncedProv ? `de ${syncedProv.name}` : 'Selecciona una provincia'}
                        canCreate={canCreate && !!syncedProv}
                        onAdd={() => openModal(setDistModal)}
                        addLabel="Nuevo"
                        className="sm:col-span-2 xl:col-span-1"
                    >
                        {!syncedProv ? (
                            <EmptyState message="Selecciona una provincia para ver sus distritos." />
                        ) : districts.length === 0 ? (
                            <EmptyState message="Sin distritos. Crea el primero." />
                        ) : (
                            districts.map((dist) => (
                                <ItemRow
                                    key={dist.id}
                                    name={dist.name}
                                    code={dist.code}
                                    canEdit={canEdit}
                                    canDelete={canDelete}
                                    onEdit={() => openModal(setDistModal, dist)}
                                    onDelete={() => promptDelete(
                                        `distrito «${dist.name}»`,
                                        () => destroyCrud(distDestroy.url({ district: dist.id })),
                                    )}
                                />
                            ))
                        )}
                    </CascadeColumn>
                </div>
            </div>

            {/* ── Modales de formulario ──────────────────────────────────────── */}
            <GeoFormModal
                open={deptModal.open}
                onClose={() => setDeptModal((m) => ({ ...m, open: false, errors: {} }))}
                title={deptModal.editing ? 'Editar departamento' : 'Nuevo departamento'}
                description={deptModal.editing ? `Modificando «${deptModal.editing.name}»` : 'Agrega un nuevo departamento.'}
                form={deptModal.form}
                onChange={(f) => setDeptModal((m) => ({ ...m, form: f, errors: {} }))}
                onSubmit={submitCrud(deptModal, setDeptModal, deptStore.url(), (id) => deptUpdate.url({ department: id }))}
                isProcessing={deptModal.processing}
                submitLabel={deptModal.editing ? 'Guardar cambios' : 'Crear departamento'}
                errors={deptModal.errors}
                codePlaceholder="Ej: 15"
            />

            <GeoFormModal
                open={provModal.open}
                onClose={() => setProvModal((m) => ({ ...m, open: false, errors: {} }))}
                title={provModal.editing ? 'Editar provincia' : 'Nueva provincia'}
                description={provModal.editing ? `Modificando «${provModal.editing.name}»` : `En el departamento «${syncedDept?.name}»`}
                form={provModal.form}
                onChange={(f) => setProvModal((m) => ({ ...m, form: f, errors: {} }))}
                onSubmit={submitCrud(provModal, setProvModal, provStore.url(), (id) => provUpdate.url({ province: id }), { department_id: syncedDept?.id })}
                isProcessing={provModal.processing}
                submitLabel={provModal.editing ? 'Guardar cambios' : 'Crear provincia'}
                errors={provModal.errors}
                codePlaceholder="Ej: 1501"
            />

            <GeoFormModal
                open={distModal.open}
                onClose={() => setDistModal((m) => ({ ...m, open: false, errors: {} }))}
                title={distModal.editing ? 'Editar distrito' : 'Nuevo distrito'}
                description={distModal.editing ? `Modificando «${distModal.editing.name}»` : `En la provincia «${syncedProv?.name}»`}
                form={distModal.form}
                onChange={(f) => setDistModal((m) => ({ ...m, form: f, errors: {} }))}
                onSubmit={submitCrud(distModal, setDistModal, distStore.url(), (id) => distUpdate.url({ district: id }), { province_id: syncedProv?.id })}
                isProcessing={distModal.processing}
                submitLabel={distModal.editing ? 'Guardar cambios' : 'Crear distrito'}
                errors={distModal.errors}
                namePlaceholder="Ej: Miraflores"
                codePlaceholder="Ej: 150122"
            />

            {/* ── Modal de confirmación ──────────────────────────────────────── */}
            <ConfirmModal
                open={confirm.open}
                onClose={() => setConfirm((c) => ({ ...c, open: false }))}
                onConfirm={() => confirm.action?.()}
                title={`¿Eliminar ${confirm.label}?`}
                description="Esta acción es permanente. Se eliminarán todos los registros dependientes."
                confirmLabel="Sí, eliminar"
                isProcessing={confirm.processing}
            />
        </>
    );
}

GeographyPage.layout = {
    breadcrumbs: appBreadcrumbs('Geografía', APP_HREF.adminGeography),
};
