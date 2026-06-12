import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type Slide = {
    src: string;
    titleKey: string;
};

const SLIDES: Slide[] = [
    {
        src: 'https://images.unsplash.com/photo-1594040221058-7a070085357c?auto=format&fit=crop&w=1800&q=85',
        titleKey: 'welcome.hero_slide_ceviche_title',
    },
    {
        src: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1800&q=85',
        titleKey: 'welcome.hero_slide_cabrito_title',
    },
    {
        src: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1800&q=85',
        titleKey: 'welcome.hero_slide_kingkong_title',
    },
];

const ROTATE_MS = 5500;

export function WelcomeHeroCarousel() {
    const { t } = useTranslation();
    const [active, setActive] = useState(0);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setActive(current => (current + 1) % SLIDES.length);
        }, ROTATE_MS);

        return () => window.clearInterval(timer);
    }, []);

    return (
        <>
            <div className="welcome-hero-media pointer-events-none absolute inset-0" aria-hidden>
                {SLIDES.map((item, index) => (
                    <img
                        key={item.src}
                        src={item.src}
                        alt=""
                        className={cn(
                            'absolute inset-0 size-full object-cover object-[72%_center] transition-opacity duration-[1400ms] ease-in-out sm:object-[68%_center] lg:object-right',
                            index === active ? 'opacity-100' : 'opacity-0',
                        )}
                        loading={index === 0 ? 'eager' : 'lazy'}
                    />
                ))}
            </div>

            <div className="welcome-hero-fade pointer-events-none absolute inset-0" aria-hidden />

            <div className="pointer-events-none absolute bottom-6 right-6 z-10 hidden gap-2 sm:flex">
                {SLIDES.map((_, index) => (
                    <span
                        key={index}
                        className={cn(
                            'h-1.5 rounded-full transition-all duration-300',
                            index === active ? 'w-8 bg-[#ffa300]' : 'w-1.5 bg-white/70',
                        )}
                        aria-hidden
                    />
                ))}
            </div>

            <p className="sr-only">{t(SLIDES[active].titleKey)}</p>
        </>
    );
}
