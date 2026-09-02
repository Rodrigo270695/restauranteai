import { Head, Link } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { login, register } from '@/routes';

const MASCOT = encodeURI('/ChatGPT Image 1 sept 2026, 04_03_03 a.m.png');

export default function AiRecommendationsGate() {
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('nav.ai')} />
            <div className="mx-auto flex min-h-[28rem] max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
                <img src={MASCOT} alt="" className="mb-6 h-36 w-auto -scale-x-100 object-contain" />
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-orange">
                    <Sparkles className="size-3.5" />
                    {t('welcome.hero_ai_badge')}
                </span>
                <h1 className="text-3xl font-bold text-brand-blue sm:text-4xl">{t('welcome.ai_gate_title')}</h1>
                <p className="mt-3 max-w-lg text-base text-gray-500">{t('welcome.ai_gate_desc')}</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                        href={login()}
                        className="inline-flex h-12 items-center justify-center rounded-2xl bg-brand-orange px-6 text-sm font-semibold text-white shadow-md hover:brightness-105"
                    >
                        {t('welcome.login')}
                    </Link>
                    <Link
                        href={register()}
                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 text-sm font-semibold text-brand-blue hover:bg-gray-50"
                    >
                        {t('welcome.register')}
                    </Link>
                </div>
            </div>
        </>
    );
}
