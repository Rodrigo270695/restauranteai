import { useLanguageSync } from '@/hooks/use-language-sync';
import { Navbar } from '@/components/navbar';

interface TouristLayoutProps {
    children: React.ReactNode;
}

export default function TouristLayout({ children }: TouristLayoutProps) {
    useLanguageSync();

    return (
        <div
            className="min-h-screen"
            style={{ background: 'linear-gradient(160deg, #eef3fb 0%, #FFFFFF 50%, #fff8eb 100%)' }}
        >
            <Navbar />
            {/* pt-16 para compensar el navbar fixed */}
            <main className="pt-16">{children}</main>
        </div>
    );
}
