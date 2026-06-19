import { useEffect, useMemo, useState } from 'react';
import { FormField } from '@/components/modals/resource-modal';
import { cn } from '@/lib/utils';

export type GeoDistrict = { id: number; name: string; province_id: number };
export type GeoProvince = { id: number; name: string; department_id: number; districts: GeoDistrict[] };
export type GeoDepartment = { id: number; name: string; provinces: GeoProvince[] };

type GeoSelection = {
    department_id: number | null;
    province_id: number | null;
    district_id: number | null;
};

type Props = {
    departments: GeoDepartment[];
    value: GeoSelection;
    onChange: (next: GeoSelection) => void;
    errors?: Partial<Record<'department_id' | 'province_id' | 'district_id', string>>;
    disabled?: boolean;
    required?: boolean;
    className?: string;
};

const selectClass = (invalid?: boolean) =>
    cn(
        'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs transition-colors',
        'focus-visible:border-brand-red focus-visible:ring-2 focus-visible:ring-brand-red/20 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        invalid ? 'border-red-400' : 'border-input',
    );

export function GeoCascadeSelect({
    departments,
    value,
    onChange,
    errors,
    disabled = false,
    required = false,
    className,
}: Props) {
    const [departmentId, setDepartmentId] = useState<number | ''>(value.department_id ?? '');
    const [provinceId, setProvinceId] = useState<number | ''>(value.province_id ?? '');
    const [districtId, setDistrictId] = useState<number | ''>(value.district_id ?? '');

    useEffect(() => {
        setDepartmentId(value.department_id ?? '');
        setProvinceId(value.province_id ?? '');
        setDistrictId(value.district_id ?? '');
    }, [value.department_id, value.province_id, value.district_id]);

    const provinces = useMemo(() => {
        if (!departmentId) return [];
        return departments.find((d) => d.id === departmentId)?.provinces ?? [];
    }, [departments, departmentId]);

    const districts = useMemo(() => {
        if (!provinceId) return [];
        return provinces.find((p) => p.id === provinceId)?.districts ?? [];
    }, [provinces, provinceId]);

    const emit = (dept: number | '', prov: number | '', dist: number | '') => {
        onChange({
            department_id: dept === '' ? null : dept,
            province_id: prov === '' ? null : prov,
            district_id: dist === '' ? null : dist,
        });
    };

    const onDepartment = (raw: string) => {
        const next = raw === '' ? '' : Number(raw);
        setDepartmentId(next);
        setProvinceId('');
        setDistrictId('');
        emit(next, '', '');
    };

    const onProvince = (raw: string) => {
        const next = raw === '' ? '' : Number(raw);
        setProvinceId(next);
        setDistrictId('');
        emit(departmentId, next, '');
    };

    const onDistrict = (raw: string) => {
        const next = raw === '' ? '' : Number(raw);
        setDistrictId(next);
        emit(departmentId, provinceId, next);
    };

    return (
        <div className={cn('grid gap-4 sm:grid-cols-3', className)}>
            <FormField label="Departamento" htmlFor="geo-department" error={errors?.department_id} required={required}>
                <select
                    id="geo-department"
                    className={selectClass(!!errors?.department_id)}
                    value={departmentId === '' ? '' : String(departmentId)}
                    onChange={(e) => onDepartment(e.target.value)}
                    disabled={disabled}
                >
                    <option value="">Seleccionar departamento…</option>
                    {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.name}
                        </option>
                    ))}
                </select>
            </FormField>

            <FormField label="Provincia" htmlFor="geo-province" error={errors?.province_id} required={required}>
                <select
                    id="geo-province"
                    className={selectClass(!!errors?.province_id)}
                    value={provinceId === '' ? '' : String(provinceId)}
                    onChange={(e) => onProvince(e.target.value)}
                    disabled={disabled || !departmentId}
                >
                    <option value="">
                        {departmentId ? 'Seleccionar provincia…' : 'Elige un departamento primero'}
                    </option>
                    {provinces.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name}
                        </option>
                    ))}
                </select>
            </FormField>

            <FormField label="Distrito" htmlFor="geo-district" error={errors?.district_id} required={required}>
                <select
                    id="geo-district"
                    className={selectClass(!!errors?.district_id)}
                    value={districtId === '' ? '' : String(districtId)}
                    onChange={(e) => onDistrict(e.target.value)}
                    disabled={disabled || !provinceId}
                >
                    <option value="">
                        {provinceId ? 'Seleccionar distrito…' : 'Elige una provincia primero'}
                    </option>
                    {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.name}
                        </option>
                    ))}
                </select>
            </FormField>
        </div>
    );
}
