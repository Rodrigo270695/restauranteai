import { Head } from '@inertiajs/react';

type AppPlaceholderShellProps = {
    title: string;
    description: string;
};

export function AppPlaceholderShell({ title, description }: AppPlaceholderShellProps) {
    return (
        <>
            <Head title={title} />
            <div className="flex flex-1 flex-col gap-3 p-4 md:p-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        {title}
                    </h1>
                    <p className="text-muted-foreground max-w-prose text-sm leading-relaxed md:text-base">
                        {description}
                    </p>
                </div>
                <div className="border-border/60 bg-muted/30 text-muted-foreground mt-2 rounded-xl border border-dashed px-4 py-8 text-center text-sm">
                    Vista básica — aquí irá el listado o formulario cuando conectemos la capa de datos.
                </div>
            </div>
        </>
    );
}
