import type { ReactNode } from 'react';
import { STAT_COLORS, type StatBadgeColor } from '@/components/shared/page-header';
import { cn } from '@/lib/utils';

export function FormSection({
    title,
    description,
    icon,
    palette,
    children,
    className,
    contentClassName,
}: {
    title: string;
    description?: string;
    icon: ReactNode;
    palette: StatBadgeColor;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
}) {
    return (
        <section
            className={cn('overflow-hidden rounded-xl border shadow-sm', className)}
            style={{
                borderColor: palette.border,
                background: `linear-gradient(135deg, ${palette.bg} 0%, #ffffff 72%)`,
            }}
        >
            <div
                className="flex items-start gap-3 border-b px-5 py-4"
                style={{ borderColor: palette.border, backgroundColor: `${palette.bg}99` }}
            >
                <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-white"
                    style={{ borderColor: palette.border, color: palette.iconColor ?? palette.text }}
                >
                    {icon}
                </span>
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold tracking-tight" style={{ color: palette.text }}>
                        {title}
                    </h2>
                    {description && (
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
                    )}
                </div>
            </div>
            <div className={cn('p-5', contentClassName)}>{children}</div>
        </section>
    );
}

export { STAT_COLORS };
