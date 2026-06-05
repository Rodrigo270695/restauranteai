import { router } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    restaurantSlug: string;
    restaurantName: string;
    /** Props de Inertia a recargar tras publicar (ej. ['route'] en vista de ruta). */
    reloadOnly?: string[];
};

export function RestaurantReviewModal({
    open,
    onOpenChange,
    restaurantSlug,
    restaurantName,
    reloadOnly,
}: Props) {
    const { t } = useTranslation();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!open) {
            setRating(5);
            setComment('');
            setProcessing(false);
        }
    }, [open]);

    const submit = () => {
        setProcessing(true);
        router.post(
            `/explore/restaurants/${restaurantSlug}/reviews`,
            { rating, comment: comment.trim() || undefined },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                    if (reloadOnly?.length) {
                        router.reload({ only: reloadOnly });
                    }
                    import('sonner').then(({ toast }) =>
                        toast.success(t('explore.review_submit_success')),
                    );
                },
                onError: errors => {
                    const msg =
                        Object.values(errors).flat().join(' ') ||
                        t('explore.reservation_error_generic');
                    import('sonner').then(({ toast }) => toast.error(msg));
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl border-orange-100 p-0">
                <DialogHeader className="border-b border-orange-50 bg-gradient-to-br from-amber-50 to-white px-5 py-4 text-left">
                    <DialogTitle className="text-base font-bold text-gray-900">
                        {t('explore.review_title')}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-600">
                        {t('explore.review_modal_desc', { name: restaurantName })}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 px-5 py-4">
                    <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => setRating(n)}
                                className="cursor-pointer rounded-lg p-1.5 transition hover:bg-amber-50"
                                aria-label={`${n} ${t('explore.review_stars')}`}
                            >
                                <Star
                                    className={cn(
                                        'size-9 transition',
                                        n <= rating
                                            ? 'fill-amber-400 text-amber-400 scale-110'
                                            : 'text-gray-300',
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                    <Input
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder={t('explore.review_comment_placeholder')}
                        className="rounded-xl border-amber-100 bg-white"
                    />
                </div>

                <DialogFooter className="flex-row gap-2 border-t border-gray-100 bg-gray-50/80 px-5 py-3">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1 cursor-pointer rounded-xl"
                        disabled={processing}
                        onClick={() => onOpenChange(false)}
                    >
                        {t('explore.back')}
                    </Button>
                    <Button
                        type="button"
                        disabled={processing}
                        className="flex-1 cursor-pointer rounded-xl bg-brand-orange text-white hover:bg-brand-orange-dark"
                        onClick={submit}
                    >
                        {processing ? t('explore.reservation_sending') : t('explore.review_submit')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
