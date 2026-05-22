import { Head } from '@inertiajs/react';
import { DataTable, type TableColumn } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationLinks, type PaginationMeta } from '@/components/shared/pagination-links';

type Row = Record<string, unknown> & { id: number };

type Props = {
    title: string;
    items: PaginationMeta & { data: Row[] };
    readonly?: boolean;
};

export function ReadonlyListPage({ title, items }: Props) {
    const rows = items?.data ?? [];

    const columns: TableColumn<Row>[] = [
        {
            key: 'id',
            header: 'ID',
            cell: (row) => <span className="text-sm tabular-nums">{row.id}</span>,
        },
        {
            key: 'summary',
            header: 'Resumen',
            cell: (row) => (
                <pre className="max-w-xl overflow-x-auto text-[11px] whitespace-pre-wrap text-muted-foreground">
                    {JSON.stringify(row, null, 0).slice(0, 200)}
                </pre>
            ),
        },
    ];

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
