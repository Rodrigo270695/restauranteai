import { MapPinned, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AiRouteGeneratingModal } from '@/components/explore/ai-route-generating-modal';
import { useGenerateAiRoute } from '@/hooks/use-generate-ai-route';
import { cn } from '@/lib/utils';

type Props = {
    className?: string;
    compact?: boolean;
};

export function AiRouteGenerateButton({ className, compact = false }: Props) {
    const { t } = useTranslation();
    const { open, generate } = useGenerateAiRoute();

    if (compact) {
        return (
            <>
                <button
                    type="button"
                    disabled={open}
                    onClick={generate}
                    className={cn(
                        'inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-blue to-brand-orange px-4 text-sm font-semibold text-white shadow-md hover:brightness-105 disabled:cursor-wait',
                        className,
                    )}
                >
                    <Sparkles className="size-4" />
                    {t('explore.ai_route_generate')}
                </button>
                <AiRouteGeneratingModal open={open} />
            </>
        );
    }

    return (
        <section
            className={cn(
                'relative overflow-hidden rounded-2xl border border-orange-100 bg-white p-5 shadow-sm',
                className,
            )}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-xl bg-orange-100 text-brand-orange">
                            <MapPinned className="size-4" />
                        </span>
                        <h2 className="text-base font-bold text-brand-blue">{t('explore.ai_route_title')}</h2>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-500">{t('explore.ai_route_desc')}</p>
                </div>
                <button
                    type="button"
                    disabled={open}
                    onClick={generate}
                    className="inline-flex h-11 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-blue to-brand-orange px-5 text-sm font-semibold text-white shadow-md hover:brightness-105 disabled:cursor-wait sm:w-auto"
                >
                    <Sparkles className="size-4" />
                    {t('explore.ai_route_generate')}
                </button>
            </div>
            <AiRouteGeneratingModal open={open} />
        </section>
    );
}
