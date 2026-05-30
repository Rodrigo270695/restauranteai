import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import TouristExploreLayout from '@/layouts/tourist-explore-layout';
import { index as exploreIndex } from '@/routes/explore';
import { store as tamStore } from '@/routes/explore/tam-survey';

type Question = { key: string; group: string; text: string };

type Props = {
    completed: boolean;
    survey: Record<string, string | number | null> | null;
    questions: Question[];
};

import { AUTH_BTN_STYLE } from '@/lib/auth-styles';

const LIKERT = [1, 2, 3, 4, 5] as const;

function TamSurveyPage({ completed, survey, questions }: Props) {
    const { t } = useTranslation();
    const { flash } = usePage().props as { flash?: { info?: string } };

    const initial = Object.fromEntries(
        questions.map(q => [q.key, survey?.[q.key] ?? 3]),
    ) as Record<string, number>;

    const [answers, setAnswers] = useState<Record<string, number>>(initial);
    const [comment, setComment] = useState((survey?.open_comment as string) ?? '');
    const [saving, setSaving] = useState(false);

    const handleSubmit = () => {
        setSaving(true);
        router.post(
            tamStore.url(),
            { ...answers, open_comment: comment || null },
            { onFinish: () => setSaving(false) },
        );
    };

    if (completed) {
        return (
            <>
                <Head title={t('explore.tam_title')} />
                <div className="mx-auto max-w-2xl px-4 py-12 text-center">
                    <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-500" />
                    <h1 className="text-2xl font-bold text-gray-900">{t('explore.tam_done_title')}</h1>
                    <p className="mt-2 text-sm text-gray-500">{t('explore.tam_done_desc')}</p>
                    <Link
                        href={exploreIndex.url()}
                        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-orange hover:underline"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t('explore.explore_btn')}
                    </Link>
                </div>
            </>
        );
    }

    const groups = ['PU', 'PEOU', 'BI'] as const;
    const groupLabels: Record<string, string> = {
        PU: t('explore.tam_group_pu'),
        PEOU: t('explore.tam_group_peou'),
        BI: t('explore.tam_group_bi'),
    };

    return (
        <>
            <Head title={t('explore.tam_title')} />
            <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
                <Link
                    href={exploreIndex.url()}
                    className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-orange"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t('explore.nav_explore')}
                </Link>

                <div className="mb-8 flex items-start gap-3">
                    <div className="rounded-2xl bg-orange-50 p-3">
                        <ClipboardList className="h-6 w-6 text-brand-orange" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('explore.tam_title')}</h1>
                        <p className="mt-1 text-sm text-gray-500">{t('explore.tam_subtitle')}</p>
                        <p className="mt-2 text-xs text-gray-400">{t('explore.tam_scale_hint')}</p>
                    </div>
                </div>

                {flash?.info === 'already_submitted' && (
                    <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
                        {t('explore.tam_already')}
                    </p>
                )}

                <div className="space-y-8">
                    {groups.map(group => (
                        <section key={group} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-brand-orange">
                                {groupLabels[group]}
                            </h2>
                            <div className="space-y-6">
                                {questions
                                    .filter(q => q.group === group)
                                    .map(q => (
                                        <div key={q.key}>
                                            <Label className="mb-2 block text-sm font-medium text-gray-800">
                                                {q.text}
                                            </Label>
                                            <div className="flex flex-wrap gap-2">
                                                {LIKERT.map(n => (
                                                    <button
                                                        key={n}
                                                        type="button"
                                                        onClick={() => setAnswers(prev => ({ ...prev, [q.key]: n }))}
                                                        className={cn(
                                                            'h-10 w-10 rounded-xl border text-sm font-semibold transition-all',
                                                            answers[q.key] === n
                                                                ? 'border-brand-orange bg-brand-orange text-white shadow-md'
                                                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-orange-200',
                                                        )}
                                                    >
                                                        {n}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                                                <span>{t('explore.tam_disagree')}</span>
                                                <span>{t('explore.tam_agree')}</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </section>
                    ))}

                    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <Label htmlFor="open_comment" className="text-sm font-medium">
                            {t('explore.tam_comment_label')}
                        </Label>
                        <textarea
                            id="open_comment"
                            rows={4}
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
                            placeholder={t('explore.tam_comment_placeholder')}
                        />
                    </section>

                    <Button
                        type="button"
                        disabled={saving}
                        onClick={handleSubmit}
                        className="h-12 w-full rounded-2xl text-white"
                        style={AUTH_BTN_STYLE}
                    >
                        {saving ? <Spinner className="h-5 w-5" /> : t('explore.tam_submit')}
                    </Button>
                </div>
            </div>
        </>
    );
}

TamSurveyPage.layout = (page: React.ReactNode) => <TouristExploreLayout>{page}</TouristExploreLayout>;

export default TamSurveyPage;
