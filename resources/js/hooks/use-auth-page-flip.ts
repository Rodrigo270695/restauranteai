import { router } from '@inertiajs/react';
import { useLayoutEffect, useState } from 'react';
import { AUTH_FLIP_MS } from '@/lib/auth-styles';

export function useAuthPageFlip(backUrl: string) {
    const [mounted, setMounted] = useState(false);
    const [exiting, setExiting] = useState(false);

    useLayoutEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));

        return () => cancelAnimationFrame(id);
    }, []);

    const flipBack = () => {
        if (exiting) {
            return;
        }

        setExiting(true);
        setTimeout(() => router.visit(backUrl), AUTH_FLIP_MS);
    };

    const wrapStyle: React.CSSProperties = { perspective: '1200px' };

    const cardWrapStyle: React.CSSProperties = {
        transform: exiting ? 'rotateY(-90deg)' : mounted ? 'rotateY(0deg)' : 'rotateY(90deg)',
        transition: mounted ? `transform ${AUTH_FLIP_MS}ms cubic-bezier(0.4, 0, 0.2, 1)` : 'none',
        willChange: 'transform',
    };

    return { wrapStyle, cardWrapStyle, flipBack, flipMs: AUTH_FLIP_MS };
}

export function useAuthMountFlip() {
    const [mounted, setMounted] = useState(false);
    const [exiting, setExiting] = useState(false);

    useLayoutEffect(() => {
        const id = requestAnimationFrame(() => setMounted(true));

        return () => cancelAnimationFrame(id);
    }, []);

    const flipTo = (url: string) => {
        if (exiting) {
            return;
        }

        setExiting(true);
        setTimeout(() => router.visit(url), AUTH_FLIP_MS);
    };

    const wrapStyle: React.CSSProperties = { perspective: '1200px' };

    const cardWrapStyle: React.CSSProperties = {
        transform: exiting ? 'rotateY(-90deg)' : mounted ? 'rotateY(0deg)' : 'rotateY(90deg)',
        transition: mounted ? `transform ${AUTH_FLIP_MS}ms cubic-bezier(0.4, 0, 0.2, 1)` : 'none',
        willChange: 'transform',
    };

    return { wrapStyle, cardWrapStyle, flipTo, exiting, mounted };
}
