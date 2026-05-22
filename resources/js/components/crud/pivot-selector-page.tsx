import { Head, router, useForm } from '@inertiajs/react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-can';

type Item = { id: number; name: string; code?: string };

type Props = {
    title: string;
    items: Item[];
    selectedIds: number[];
    saveUrl: string;
    permission: string;
};

export function PivotSelectorPage({ title, items, selectedIds, saveUrl, permission }: Props) {
    const can = useCan();
    const form = useForm({ ids: selectedIds });

    const toggle = (id: number) => {
        const set = new Set(form.data.ids);
        set.has(id) ? set.delete(id) : set.add(id);
        form.setData('ids', Array.from(set));
    };

    const save = () => {
        form.put(saveUrl, { preserveScroll: true });
    };

    return (
        <>
            <Head title={title} />
            <PageHeader title={title} description="Marca los elementos que aplican a tu restaurante." />
            <div className="mx-4 mb-8 max-w-2xl space-y-2 rounded-xl border p-4 md:mx-6">
                {items.map((item) => (
                    <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 px-3 py-2 hover:bg-muted/40"
                    >
                        <input
                            type="checkbox"
                            checked={form.data.ids.includes(item.id)}
                            onChange={() => toggle(item.id)}
                            className="size-4"
                        />
                        <span className="text-sm font-medium">
                            {item.name}
                            {item.code ? (
                                <span className="text-muted-foreground ml-1 text-xs">({item.code})</span>
                            ) : null}
                        </span>
                    </label>
                ))}
                {can(permission) && (
                    <Button type="button" variant="brand" className="mt-4" disabled={form.processing} onClick={save}>
                        Guardar selección
                    </Button>
                )}
            </div>
        </>
    );
}

export default PivotSelectorPage;
