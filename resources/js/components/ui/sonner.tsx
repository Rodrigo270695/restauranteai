import { useAppearance } from '@/hooks/use-appearance';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { resolvedAppearance } = useAppearance();

    return (
        <Sonner
            theme={resolvedAppearance}
            className="toaster group"
            position="top-right"
            gap={8}
            toastOptions={{
                classNames: {
                    toast:       'rounded-xl! border! shadow-lg! text-sm! font-medium! px-4! py-3.5!',
                    title:       'font-semibold! text-sm!',
                    description: 'text-xs! opacity-90!',
                    icon:        'size-4.5!',
                    // success
                    success:     'border-emerald-200! bg-emerald-50! text-emerald-800! dark:border-emerald-800! dark:bg-emerald-950/70! dark:text-emerald-300!',
                    // error
                    error:       'border-red-200! bg-red-50! text-red-800! dark:border-red-800! dark:bg-red-950/70! dark:text-red-300!',
                    // warning
                    warning:     'border-amber-200! bg-amber-50! text-amber-800! dark:border-amber-800! dark:bg-amber-950/70! dark:text-amber-300!',
                    // info
                    info:        'border-sky-200! bg-sky-50! text-sky-800! dark:border-sky-800! dark:bg-sky-950/70! dark:text-sky-300!',
                },
            }}
            style={{ '--width': '360px' } as React.CSSProperties}
            {...props}
        />
    );
}

export { Toaster };
