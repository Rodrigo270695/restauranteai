export type District = {
    id: number;
    name: string;
    code: string;
};

export type Province = {
    id: number;
    name: string;
    code: string;
    districts: District[];
};

export type Department = {
    id: number;
    name: string;
    code: string;
    provinces: Province[];
};

export type GeoStats = {
    departments: number;
    provinces: number;
    districts: number;
};

/** Estado del formulario compartido entre los tres niveles geográficos */
export type GeoFormState = {
    name: string;
    code: string;
};
