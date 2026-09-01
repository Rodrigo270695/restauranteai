import { cn } from '@/lib/utils';

const LOGO_SRC = '/MISKILOGO-09-07.png';

type Props = {
    className?: string;
    /** El PNG trae fondo negro: `screen` lo integra en paneles azules. */
    onDark?: boolean;
};

export function MiskiLogo({ className, onDark = false }: Props) {
    return (
        <img
            src={LOGO_SRC}
            alt="MiskiGO"
            className={cn('h-auto w-auto object-contain', className)}
            style={onDark ? { mixBlendMode: 'screen' } : undefined}
        />
    );
}
