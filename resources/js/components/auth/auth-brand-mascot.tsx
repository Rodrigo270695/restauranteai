import { cn } from '@/lib/utils';

const AUTH_MASCOT = '/MASCOTA%20MISKITO.png';

type Props = {
    className?: string;
};

/** Mascota Miski — `mix-blend-screen` integra el fondo negro del PNG con el panel azul. */
export function AuthBrandMascot({ className }: Props) {
    return (
        <img
            src={AUTH_MASCOT}
            alt="Miski"
            className={cn(
                'w-auto object-contain object-bottom drop-shadow-[0_16px_40px_rgba(0,0,0,0.35)]',
                className,
            )}
            style={{ mixBlendMode: 'screen' }}
        />
    );
}

export function AuthBrandLogoRow({ size = 'desktop' }: { size?: 'desktop' | 'mobile' }) {
    const isMobile = size === 'mobile';

    return (
        <div
            className={cn(
                'flex items-end justify-center',
                isMobile ? 'gap-1' : 'gap-0 xl:gap-1',
            )}
        >
            <img
                src="/logo.png"
                alt="MiskiGO"
                className={cn(
                    'shrink-0 object-contain drop-shadow-[0_8px_32px_rgba(0,0,0,0.45)]',
                    isMobile ? 'h-[4.5rem] w-auto' : 'w-48 xl:w-56',
                )}
            />
            <AuthBrandMascot
                className={cn(
                    isMobile ? 'h-[5.5rem]' : 'h-40 xl:h-[11.5rem]',
                )}
            />
        </div>
    );
}
