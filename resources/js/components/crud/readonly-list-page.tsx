import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { DataTable, type TableColumn } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationLinks, type PaginationMeta } from '@/components/shared/pagination-links';

type Row = Record<string, unknown> & { id: number };

export type ReadonlyListType =
    | 'tam_surveys'
    | 'recommendations'
    | 'recommendation_requests'
    | 'user_interactions';

type Props = {
    title: string;
    items: PaginationMeta & { data: Row[] };
    listType: ReadonlyListType;
};

function cell(value: unknown): ReactNode {
    if (value === null || value === undefined || value === '') {
        return <span className="text-muted-foreground">—</span>;
    }
    return <span className="text-sm">{String(value)}</span>;
}

function columnsFor(listType: ReadonlyListType): TableColumn<Row>[] {
    const idCol: TableColumn<Row> = {
        key: 'id',
        header: 'ID',
        cell: (row) => <span className="text-sm tabular-nums font-medium">{row.id}</span>,
    };

    switch (listType) {
        case 'tam_surveys':
            return [
                idCol,
                { key: 'user_name', header: 'Usuario', cell: (r) => cell(r.user_name) },
                { key: 'user_email', header: 'Correo', cell: (r) => <span className="text-sm text-muted-foreground">{String(r.user_email ?? '—')}</span> },
                { key: 'pu_avg', header: 'PU (prom.)', cell: (r) => cell(r.pu_avg) },
                { key: 'peou_avg', header: 'PEOU (prom.)', cell: (r) => cell(r.peou_avg) },
                { key: 'bi_avg', header: 'BI (prom.)', cell: (r) => cell(r.bi_avg) },
                { key: 'bi1_intend_to_use', header: 'Intención uso', cell: (r) => cell(r.bi1_intend_to_use) },
                { key: 'bi2_recommend', header: 'Recomendaría', cell: (r) => cell(r.bi2_recommend) },
                {
                    key: 'open_comment',
                    header: 'Comentario',
                    cell: (r) => (
                        <span className="line-clamp-2 max-w-xs text-sm text-muted-foreground" title={String(r.open_comment ?? '')}>
                            {String(r.open_comment ?? '—')}
                        </span>
                    ),
                },
                { key: 'created_at', header: 'Fecha', cell: (r) => cell(r.created_at) },
            ];
        case 'recommendations':
            return [
                idCol,
                { key: 'restaurant_name', header: 'Restaurante', cell: (r) => <span className="text-sm font-medium">{String(r.restaurant_name ?? '—')}</span> },
                { key: 'user_name', header: 'Usuario', cell: (r) => cell(r.user_name) },
                { key: 'rank', header: 'Ranking', cell: (r) => cell(r.rank) },
                { key: 'score_pct', header: 'Score %', cell: (r) => cell(r.score_pct) },
                { key: 'was_viewed', header: 'Visto', cell: (r) => cell(r.was_viewed) },
                { key: 'was_accepted', header: 'Aceptado', cell: (r) => cell(r.was_accepted) },
                { key: 'request_id', header: 'Solicitud', cell: (r) => cell(r.request_id) },
            ];
        case 'recommendation_requests':
            return [
                idCol,
                { key: 'user_name', header: 'Usuario', cell: (r) => cell(r.user_name) },
                { key: 'budget', header: 'Presupuesto', cell: (r) => cell(r.budget) },
                { key: 'party_type', header: 'Compañía', cell: (r) => cell(r.party_type) },
                { key: 'results_count', header: 'Resultados', cell: (r) => cell(r.results_count) },
                { key: 'created_at', header: 'Fecha', cell: (r) => cell(r.created_at) },
            ];
        case 'user_interactions':
            return [
                idCol,
                { key: 'user_name', header: 'Usuario', cell: (r) => cell(r.user_name) },
                { key: 'restaurant_name', header: 'Restaurante', cell: (r) => cell(r.restaurant_name) },
                { key: 'interaction_type', header: 'Tipo', cell: (r) => cell(r.interaction_type) },
                { key: 'search_query', header: 'Búsqueda', cell: (r) => cell(r.search_query) },
                { key: 'created_at', header: 'Fecha', cell: (r) => cell(r.created_at) },
            ];
    }
}

export function ReadonlyListPage({ title, items, listType }: Props) {
    const rows = items?.data ?? [];
    const columns = columnsFor(listType);

    return (
        <>
            <Head title={title} />
            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <PageHeader title={title} description="Vista de solo lectura (datos de investigación / ML)." />
                <DataTable columns={columns} rows={rows} rowKey="id" emptyMessage="Sin registros." />
                <PaginationLinks meta={items} />
            </div>
        </>
    );
}

export default ReadonlyListPage;
