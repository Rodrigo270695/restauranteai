import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { home } from '@/routes';

type Props = {
    title: string;
    subtitle?: string;
    backHref?: string;
    onBack?: () => void;
    showHome?: boolean;
};

export function ExplorePageHeader({ title, subtitle, backHref, onBack, showHome = true }: Props) {
    const { t } = useTranslation();

    const handleBack = () => {
        if (onBack) {
            onBack();
            return;
        }
        if (backHref) {
            router.visit(backHref);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {(backHref || onBack) && (
                <button
                    type="button"
                    onClick={handleBack}
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm ring-1 ring-orange-100 transition hover:bg-orange-50"
                    aria-label={t('explore.back')}
                >
                    <ArrowLeft className="size-5" />
                </button>
            )}
            <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="truncate text-xs text-gray-500">{subtitle}</p>}
            </div>
            {showHome && (
                <Link
                    href={home.url()}
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-orange shadow-sm ring-1 ring-orange-100 transition hover:bg-orange-50"
                    title={t('explore.back_home')}
                >
                    <Home className="size-5" />
                </Link>
            )}
        </div>
    );
}
