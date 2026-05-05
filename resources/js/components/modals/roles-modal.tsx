/**
 * RolesModal — selector de roles (Spatie) con el mismo patrón visual que PermissionsModal.
 */

import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export type RoleOption = { id: number; name: string };

export type RolesModalProps = {
    open: boolean;
    onClose: () => void;
    allRoles: RoleOption[];
    selected: string[];
    onSave: (roleNames: string[]) => void;
    isProcessing?: boolean;
};

export function RolesModal({
    open,
    onClose,
    allRoles,
    selected,
    onSave,
    isProcessing = false,
}: RolesModalProps) {
    const [localSelected, setLocalSelected] = useState<Set<string>>(new Set(selected));
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (open) {
            setLocalSelected(new Set(selected));
            setSearch('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleOpenChange = (o: boolean) => {
        if (!o) onClose();
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return allRoles;
        return allRoles.filter((r) => r.name.toLowerCase().includes(q));
    }, [allRoles, search]);

    const toggle = (name: string) =>
        setLocalSelected((prev) => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });

    const selectAll = () => setLocalSelected(new Set(allRoles.map((r) => r.name)));
    const clearAll = () => setLocalSelected(new Set());

    const handleSave = () => {
        onSave(Array.from(localSelected));
        onClose();
    };

    const totalSelected = localSelected.size;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="flex max-h-[88dvh] flex-col gap-0 p-0 sm:max-w-lg"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="shrink-0 px-5 pt-5 pb-3">
                    <DialogTitle className="text-base font-semibold">Asignar roles</DialogTitle>
                    <DialogDescription className="text-xs">
                        Selecciona los roles que tendrá este usuario.{' '}
                        <span className="font-semibold text-foreground">{totalSelected} seleccionados</span>
                    </DialogDescription>
                </DialogHeader>

                <Separator className="shrink-0" />

                <div className="shrink-0 space-y-2 px-4 py-3">
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Filtrar roles…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 pl-8 text-xs"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={selectAll}
                            className="cursor-pointer text-[11px] font-medium underline-offset-2 hover:underline"
                            style={{ color: '#cc0010' }}
                        >
                            Seleccionar todos
                        </button>
                        <span className="text-muted-foreground text-[11px]">·</span>
                        <button
                            type="button"
                            onClick={clearAll}
                            className="cursor-pointer text-[11px] font-medium text-muted-foreground underline-offset-2 hover:underline"
                        >
                            Limpiar selección
                        </button>
                    </div>
                </div>

                <Separator className="shrink-0" />

                <div className="flex-1 overflow-y-auto px-3 py-2.5">
                    {filtered.length === 0 ? (
                        <p className="py-6 text-center text-xs text-muted-foreground">No se encontraron roles.</p>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-border/60">
                            <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 bg-background/70 px-3 py-2">
                                {filtered.map((role) => {
                                    const checked = localSelected.has(role.name);
                                    return (
                                        <label
                                            key={role.id}
                                            title={role.name}
                                            className={cn(
                                                'flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-1 transition-colors hover:bg-muted/40',
                                                checked && 'bg-red-50/60 dark:bg-red-950/10',
                                            )}
                                        >
                                            <BrandCheckbox checked={checked} />
                                            <span className="font-mono text-[11px] text-foreground/80">{role.name}</span>
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={checked}
                                                onChange={() => toggle(role.name)}
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <Separator className="shrink-0" />

                <DialogFooter className="shrink-0 flex-row items-center justify-between gap-2 px-5 py-3.5">
                    <span className="text-xs text-muted-foreground">
                        {totalSelected} de {allRoles.length} roles
                    </span>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="cursor-pointer"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            variant="brand"
                            size="sm"
                            onClick={handleSave}
                            disabled={isProcessing}
                            className="cursor-pointer font-semibold"
                        >
                            Guardar roles
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function BrandCheckbox({
    checked,
    indeterminate = false,
}: {
    checked: boolean;
    indeterminate?: boolean;
}) {
    const dim = 'size-3.5';

    if (checked) {
        return (
            <span
                className={cn('flex shrink-0 items-center justify-center rounded-sm border', dim)}
                style={{
                    background: 'linear-gradient(135deg,#e8001a,#8b0008)',
                    borderColor: '#cc0010',
                }}
            >
                <svg viewBox="0 0 10 10" className="size-2.5 text-white" fill="none">
                    <path
                        d="M2 5l2.5 2.5L8 3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </span>
        );
    }

    if (indeterminate) {
        return (
            <span
                className={cn('flex shrink-0 items-center justify-center rounded-sm border', dim)}
                style={{ borderColor: '#cc0010', background: '#fff1f2' }}
            >
                <span className="block h-0.5 w-2" style={{ background: '#cc0010' }} />
            </span>
        );
    }

    return <span className={cn('flex shrink-0 rounded-sm border border-border/70 bg-background', dim)} />;
}
