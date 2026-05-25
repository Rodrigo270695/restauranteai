import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    FileJson,
    LayoutList,
    Monitor,
    Play,
    Sparkles,
    Timer,
} from 'lucide-react';
import { useState } from 'react';
import { DataTable, type SortDir, type TableColumn } from '@/components/shared/data-table';
import { PageHeader, STAT_COLORS } from '@/components/shared/page-header';
import type { StatBadge } from '@/components/shared/page-header';
import { PaginationLinks } from '@/components/shared/pagination-links';
import type { PaginationMeta } from '@/components/shared/pagination-links';
import { SearchFilter } from '@/components/shared/search-filter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { APP_HREF } from '@/config/app-sidebar-nav';
import { appBreadcrumbs } from '@/lib/app-breadcrumbs';
import { cn } from '@/lib/utils';

type TrainingRunRow = {
    id: number;
    status: 'success' | 'failed';
    message: string;
    started_at_display: string;
    finished_at_display: string;
    duration_seconds: number;
    result: Record<string, unknown> | null;
    triggered_by_name: string;
    triggered_by_email: string | null;
};

type RunsPaginated = PaginationMeta & { data: TrainingRunRow[] };

type PageProps = {
    runs: RunsPaginated;
    filters: { search: string; sort?: string; dir?: SortDir; status?: string };
    stats: {
        totalRuns: number;
        successCount: number;
        failedCount: number;
        currentPage: number;
        lastPage: number;
        onPage: number;
        lastRunAt: string;
    };
    canTrainMl: boolean;
};

const ONLY = ['runs', 'stats', 'filters'] as const;

const STATUS_STYLE: Record<
    'success' | 'failed',
    { bg: string; border: string; color: string; label: string }
> = {
    success: {
        bg: '#ecfdf5',
        border: '#a7f3d0',
        color: '#065f46',
        label: 'Éxito',
    },
    failed: {
        bg: '#fff1f2',
        border: '#fecdd3',
        color: '#be123c',
        label: 'Falló',
    },
};

export default function AppAdminMlTraining({ runs, filters, stats, canTrainMl }: PageProps) {
    const [training, setTraining] = useState(false);
    const [detailRun, setDetailRun] = useState<TrainingRunRow | null>(null);

    const sortKey = filters.sort ?? 'started_at';
    const sortDir = filters.dir ?? 'desc';

    const handleSort = (key: string, dir: SortDir) => {
        const params = new URLSearchParams(window.location.search);
        params.set('sort', key);
        params.set('dir', dir);
        params.delete('page');
        router.get(window.location.pathname + '?' + params.toString(), {}, {
            preserveState: true,
            preserveScroll: true,
            only: [...ONLY],
        });
    };

    const applyStatusFilter = (statusOrEmpty: string) => {
        const params = new URLSearchParams(window.location.search);
        if (statusOrEmpty) {
            params.set('status', statusOrEmpty);
        } else {
            params.delete('status');
        }
        params.delete('page');
        router.get(
            window.location.pathname + (params.toString() ? `?${params.toString()}` : ''),
            {},
            { preserveState: true, preserveScroll: true, only: [...ONLY] },
        );
    };

    const handleTrain = () => {
        setTraining(true);
        router.post(
            APP_HREF.adminMlTraining,
            {},
            {
                preserveScroll: true,
                onFinish: () => setTraining(false),
            },
        );
    };

    const columns: TableColumn<TrainingRunRow>[] = [
        {
            key: 'id',
            header: 'ID',
            sortable: true,
            cell: (row) => <span className="tabular-nums font-medium">{row.id}</span>,
        },
        {
            key: 'status',
            header: 'Estado',
            sortable: true,
            cell: (row) => {
                const cfg = STATUS_STYLE[row.status];
                return (
                    <Badge
                        variant="outline"
                        className="gap-1 font-normal"
                        style={{
                            backgroundColor: cfg.bg,
                            borderColor: cfg.border,
                            color: cfg.color,
                        }}
                    >
                        {row.status === 'success' ? (
                            <CheckCircle2 className="size-3" />
                        ) : (
                            <AlertCircle className="size-3" />
                        )}
                        {cfg.label}
                    </Badge>
                );
            },
        },
        {
            key: 'triggered_by_name',
            header: 'Ejecutado por',
            sortable: true,
            cardTitle: true,
            cell: (row) => (
                <div className="min-w-0">
                    <p className="truncate font-medium">{row.triggered_by_name}</p>
                    {row.triggered_by_email && (
                        <p className="truncate text-xs text-muted-foreground">{row.triggered_by_email}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'message',
            header: 'Mensaje',
            cell: (row) => (
                <span className="line-clamp-2 max-w-xs text-sm text-muted-foreground">{row.message}</span>
            ),
        },
        {
            key: 'started_at',
            header: 'Inicio',
            sortable: true,
            cell: (row) => (
                <span className="text-xs text-muted-foreground">{row.started_at_display}</span>
            ),
        },
        {
            key: 'finished_at',
            header: 'Fin',
            sortable: true,
            cell: (row) => (
                <span className="text-xs text-muted-foreground">{row.finished_at_display}</span>
            ),
        },
        {
            key: 'duration_seconds',
            header: 'Duración',
            sortable: true,
            cell: (row) => (
                <span className="tabular-nums text-sm">{row.duration_seconds}s</span>
            ),
        },
    ];

    const statBadges: StatBadge[] = [
        { icon: <Sparkles className="size-3.5" />, label: 'Ejecuciones', value: stats.totalRuns, color: STAT_COLORS.violet },
        { icon: <CheckCircle2 className="size-3.5" />, label: 'Éxitos', value: stats.successCount, color: STAT_COLORS.emerald },
        { icon: <AlertCircle className="size-3.5" />, label: 'Fallos', value: stats.failedCount, color: STAT_COLORS.rose },
        { icon: <LayoutList className="size-3.5" />, label: 'Página', value: `${stats.currentPage}/${stats.lastPage}`, color: STAT_COLORS.amber },
        { icon: <Monitor className="size-3.5" />, label: 'En pantalla', value: stats.onPage, color: STAT_COLORS.sky },
        { icon: <Clock className="size-3.5" />, label: 'Último fin', value: stats.lastRunAt, color: STAT_COLORS.blue },
    ];

    const showTrainButton = canTrainMl;

    return (
        <>
            <Head title="Entrenamiento ML" />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader
                    title="Entrenamiento ML"
                    description="Historial de entrenamientos del microservicio de recomendaciones (equivalente a php artisan ml:train --sync)."
                    stats={statBadges}
                    actions={
                        showTrainButton ? (
                            <Button
                                size="sm"
                                variant="brand"
                                className="cursor-pointer gap-1.5 font-semibold"
                                disabled={training}
                                onClick={handleTrain}
                            >
                                <Play className={cn('size-4', training && 'animate-pulse')} />
                                {training ? 'Entrenando…' : 'Entrenar ahora'}
                            </Button>
                        ) : null
                    }
                />

                <SearchFilter
                    initialValue={filters.search}
                    placeholder="Buscar por mensaje o usuario…"
                    paramName="search"
                    only={[...ONLY]}
                >
                    <Select
                        value={filters.status ? filters.status : '__all'}
                        onValueChange={(v) => applyStatusFilter(v === '__all' ? '' : v)}
                    >
                        <SelectTrigger size="default" className="h-9 min-h-9 w-full shadow-xs sm:w-48 sm:min-w-48">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all">Todos los estados</SelectItem>
                            <SelectItem value="success">Éxito</SelectItem>
                            <SelectItem value="failed">Falló</SelectItem>
                        </SelectContent>
                    </Select>
                </SearchFilter>

                <DataTable
                    columns={columns}
                    rows={runs.data}
                    rowKey="id"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                    emptyMessage="Sin entrenamientos registrados"
                    emptyDescription="Ejecuta el primer entrenamiento con el botón superior."
                    rowActions={(row) =>
                        row.result && Object.keys(row.result).length > 0 ? (
                            <Button
                                size="sm"
                                variant="ghost"
                                title="Ver respuesta del microservicio"
                                className="h-7 w-7 cursor-pointer rounded-md border p-0 text-indigo-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/40"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailRun(row);
                                }}
                            >
                                <FileJson className="size-3.5" />
                            </Button>
                        ) : null
                    }
                />

                <PaginationLinks meta={runs} only={[...ONLY]} />
            </div>

            <Dialog open={!!detailRun} onOpenChange={(open) => !open && setDetailRun(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Timer className="size-4 text-muted-foreground" />
                            Entrenamiento #{detailRun?.id}
                        </DialogTitle>
                        <DialogDescription>
                            {detailRun?.started_at_display} → {detailRun?.finished_at_display} ({detailRun?.duration_seconds}s)
                        </DialogDescription>
                    </DialogHeader>
                    <pre className="max-h-80 overflow-auto rounded-lg border bg-muted/40 p-3 text-[11px] leading-relaxed">
                        {detailRun?.result ? JSON.stringify(detailRun.result, null, 2) : '{}'}
                    </pre>
                </DialogContent>
            </Dialog>
        </>
    );
}

AppAdminMlTraining.layout = {
    breadcrumbs: appBreadcrumbs('Entrenamiento ML', APP_HREF.adminMlTraining),
};
