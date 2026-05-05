import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useLanguageSync } from '@/hooks/use-language-sync';

interface PublicLayoutProps {
    children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
    useLanguageSync();

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
        </div>
    );
}
