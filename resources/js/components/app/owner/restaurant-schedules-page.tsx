import { Head, useForm, usePage } from '@inertiajs/react';
import { Clock, Copy, Moon, Save, Sun } from 'lucide-react';
import { useEffect } from 'react';
import { FormSection, STAT_COLORS } from '@/components/app/owner/form-section';
import { PageHeader, type StatBadge } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { AdminPanelBanner } from '@/components/layout/admin-panel-banner';
import { useCan } from '@/hooks/use-can';
import { useOwnerReadOnly } from '@/hooks/use-owner-read-only';
import { scopedPath, type PanelContext } from '@/lib/scoped-app-path';
import { cn } from '@/lib/utils';

export type ScheduleDay = {
    id?: number | null;
    day_of_week: number;
    opens_at: string | null;
    closes_at: string | null;
    is_closed: boolean;
};

type Props = {
    restaurant: { id: number; name: string };
    owner: { name: string; business_name?: string | null };
    week: ScheduleDay[];
    stats: { open_days: number; closed_days: number };
    panel?: PanelContext;
};

const DAY_LABELS: Record<number, { label: string; short: string }> = {
    0: { label: 'Lunes', short: 'Lun' },
    1: { label: 'Martes', short: 'Mar' },
    2: { label: 'Miércoles', short: 'Mié' },
    3: { label: 'Jueves', short: 'Jue' },
    4: { label: 'Viernes', short: 'Vie' },
    5: { label: 'Sábado', short: 'Sáb' },
    6: { label: 'Domingo', short: 'Dom' },
};

const WEEKEND = new Set([5, 6]);

function timeInputClass(disabled: boolean, error?: boolean) {
    return cn(
        'flex h-10 w-full min-w-0 rounded-md border bg-white px-3 py-2 text-sm shadow-xs transition-colors',
        'focus-visible:border-brand-red focus-visible:ring-2 focus-visible:ring-brand-red/20 focus-visible:outline-none',
        disabled && 'cursor-not-allowed opacity-50',
        error ? 'border-red-400' : 'border-input',
    );
}

export function RestaurantSchedulesPage({ restaurant, owner, week, stats, panel }: Props) {
    const can = useCan();
    const readOnly = useOwnerReadOnly();
    const canManage = can('manage_schedules') && !readOnly;
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const form = useForm({
        schedules: week.map((d) => ({
            day_of_week: d.day_of_week,
            opens_at: d.opens_at ?? '12:00',
            closes_at: d.closes_at ?? '22:00',
            is_closed: d.is_closed,
        })),
    });

    useEffect(() => {
        if (!flash?.success && !flash?.error) return;
        import('sonner').then(({ toast }) => {
            if (flash.success) toast.success(flash.success);
            if (flash.error) toast.error(flash.error);
        });
    }, [flash]);

    const displayName = owner.business_name || restaurant.name;

    const statBadges: StatBadge[] = [
        {
            icon: <Sun className="size-3.5" />,
            label: 'Días abiertos',
            value: stats.open_days,
            color: STAT_COLORS.emerald,
        },
        {
            icon: <Moon className="size-3.5" />,
            label: 'Días cerrados',
            value: stats.closed_days,
            color: STAT_COLORS.amber,
        },
        {
            icon: <Clock className="size-3.5" />,
            label: 'Local',
            value: displayName,
            color: STAT_COLORS.sky,
        },
    ];

    const updateDay = (index: number, patch: Partial<(typeof form.data.schedules)[number]>) => {
        const next = [...form.data.schedules];
        next[index] = { ...next[index], ...patch };
        form.setData('schedules', next);
    };

    const applyWeekdayTemplate = () => {
        const next = form.data.schedules.map((row) =>
            row.day_of_week <= 4
                ? { ...row, is_closed: false, opens_at: '12:00', closes_at: '22:00' }
                : { ...row, is_closed: true, opens_at: '12:00', closes_at: '22:00' },
        );
        form.setData('schedules', next);
    };

    const copyMondayToWeekdays = () => {
        const mon = form.data.schedules.find((r) => r.day_of_week === 0);
        if (!mon) return;
        const next = form.data.schedules.map((row) =>
            row.day_of_week >= 1 && row.day_of_week <= 4
                ? { ...row, is_closed: mon.is_closed, opens_at: mon.opens_at, closes_at: mon.closes_at }
                : row,
        );
        form.setData('schedules', next);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
        form.put(scopedPath('/schedules', panel), { preserveScroll: true });
    };

    const scheduleErrors = form.errors as Record<string, string>;

    return (
        <>
            <Head title="Horarios" />
            <AdminPanelBanner panel={panel} restaurantName={restaurant.name} />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="Horarios"
                    description="Define cuándo atiendes cada día de la semana. Los turistas verán si tu local está abierto."
                    stats={statBadges}
                    actions={
                        canManage ? (
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer gap-1.5 text-xs"
                                    onClick={applyWeekdayTemplate}
                                    disabled={form.processing}
                                >
                                    <Clock className="size-3.5" />
                                    Plantilla Lun–Vie
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer gap-1.5 text-xs"
                                    onClick={copyMondayToWeekdays}
                                    disabled={form.processing}
                                >
                                    <Copy className="size-3.5" />
                                    Copiar lunes a Mar–Jue
                                </Button>
                            </div>
                        ) : null
                    }
                />

                <form onSubmit={submit} className="flex flex-col gap-5">
                    <FormSection
                        title="Semana de atención"
                        description="0 = Lunes · 6 = Domingo. Marca «Cerrado» o indica horario de apertura y cierre."
                        icon={<Clock className="size-4" />}
                        palette={STAT_COLORS.amber}
                        contentClassName="p-0"
                    >
                        <ul className="divide-y divide-border/50">
                            {form.data.schedules.map((row, index) => {
                                const meta = DAY_LABELS[row.day_of_week];
                                const closed = row.is_closed;
                                const openErr = scheduleErrors[`schedules.${index}.opens_at`];
                                const closeErr = scheduleErrors[`schedules.${index}.closes_at`];
                                const isWeekend = WEEKEND.has(row.day_of_week);

                                return (
                                    <li
                                        key={row.day_of_week}
                                        className={cn(
                                            'grid gap-3 px-4 py-4 transition-colors sm:grid-cols-[minmax(7rem,9rem)_1fr_1fr_auto] sm:items-center sm:gap-4 sm:px-5',
                                            closed ? 'bg-muted/25' : 'bg-white/60',
                                            isWeekend && !closed && 'bg-amber-50/40',
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={cn(
                                                    'flex size-10 shrink-0 items-center justify-center rounded-lg border text-xs font-bold',
                                                    closed
                                                        ? 'border-border bg-muted text-muted-foreground'
                                                        : 'border-amber-200 bg-amber-50 text-amber-800',
                                                )}
                                            >
                                                {meta.short}
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                                                <p className="text-muted-foreground text-[11px]">
                                                    {closed ? 'Cerrado' : `${row.opens_at} – ${row.closes_at}`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid gap-1.5">
                                            <label className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                                                Apertura
                                            </label>
                                            <input
                                                type="time"
                                                className={timeInputClass(closed, !!openErr)}
                                                value={row.opens_at ?? ''}
                                                disabled={closed || form.processing || readOnly}
                                                onChange={(e) => updateDay(index, { opens_at: e.target.value })}
                                            />
                                            {openErr && (
                                                <p className="text-xs text-destructive">{openErr}</p>
                                            )}
                                        </div>

                                        <div className="grid gap-1.5">
                                            <label className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
                                                Cierre
                                            </label>
                                            <input
                                                type="time"
                                                className={timeInputClass(closed, !!closeErr)}
                                                value={row.closes_at ?? ''}
                                                disabled={closed || form.processing || readOnly}
                                                onChange={(e) => updateDay(index, { closes_at: e.target.value })}
                                            />
                                            {closeErr && (
                                                <p className="text-xs text-destructive">{closeErr}</p>
                                            )}
                                        </div>

                                        <label
                                            className={cn(
                                                'flex cursor-pointer items-center justify-end gap-2 rounded-lg border px-3 py-2 sm:justify-center',
                                                closed
                                                    ? 'border-rose-200 bg-rose-50/80'
                                                    : 'border-emerald-200 bg-emerald-50/50',
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={closed}
                                                disabled={form.processing || readOnly}
                                                onChange={(e) =>
                                                    updateDay(index, { is_closed: e.target.checked })
                                                }
                                                className="size-4 rounded accent-[#cc0010]"
                                            />
                                            <span className="text-xs font-medium whitespace-nowrap">
                                                Cerrado
                                            </span>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    </FormSection>

                    {canManage && (
                        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border/60 pt-2">
                            <p className="text-muted-foreground mr-auto text-xs">
                                Los horarios aplican solo a <strong>{displayName}</strong>.
                            </p>
                            <Button
                                type="submit"
                                variant="brand"
                                size="sm"
                                disabled={form.processing}
                                className="cursor-pointer gap-1.5 font-semibold shadow-md"
                            >
                                <Save className="size-4 opacity-80" />
                                {form.processing ? 'Guardando…' : 'Guardar horarios'}
                            </Button>
                        </div>
                    )}
                </form>
            </div>
        </>
    );
}

export default RestaurantSchedulesPage;
