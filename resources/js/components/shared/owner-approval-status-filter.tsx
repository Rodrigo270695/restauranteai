import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type OwnerApprovalStatus = 'pending' | 'approved' | 'rejected';

const OPTIONS: { value: OwnerApprovalStatus; label: string }[] = [
    { value: 'pending', label: 'Pendiente de aprobación' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'rejected', label: 'Rechazado' },
];

export type OwnerApprovalStatusFilterProps = {
    value: string;
    onChange: (statusOrEmpty: string) => void;
    className?: string;
    allLabel?: string;
    placeholder?: string;
};

/**
 * Filtro por estado de aprobación del negocio (restaurant_profiles.status), solo aplica a dueños.
 * Misma altura `h-9` que búsqueda y RoleSelectFilter.
 */
export function OwnerApprovalStatusFilter({
    value,
    onChange,
    className,
    allLabel = 'Estado (dueños)',
    placeholder = 'Estado de aprobación',
}: OwnerApprovalStatusFilterProps) {
    return (
        <Select value={value ? value : '__all'} onValueChange={(v) => onChange(v === '__all' ? '' : v)}>
            <SelectTrigger
                size="default"
                className={cn(
                    'h-9 min-h-9 w-full shadow-xs sm:w-56 sm:min-w-56',
                    className,
                )}
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="__all">{allLabel}</SelectItem>
                {OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                        {o.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
