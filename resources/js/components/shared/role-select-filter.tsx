import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type RoleOption = { id: number; name: string };

export type RoleSelectFilterProps = {
    /** Nombre del rol en BD; cadena vacía = todos */
    value: string;
    onChange: (roleNameOrEmpty: string) => void;
    roles: RoleOption[];
    labelForRole?: (name: string) => string;
    className?: string;
    /** Texto de la opción “ver todos” */
    allLabel?: string;
    placeholder?: string;
};

/**
 * Select para filtrar por rol (misma altura `h-9` que el Input de SearchFilter).
 */
export function RoleSelectFilter({
    value,
    onChange,
    roles,
    labelForRole = (n) => n,
    className,
    allLabel = 'Todos los roles',
    placeholder = 'Filtrar por rol',
}: RoleSelectFilterProps) {
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
                {roles.map((r) => (
                    <SelectItem key={r.id} value={r.name}>
                        {labelForRole(r.name)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
