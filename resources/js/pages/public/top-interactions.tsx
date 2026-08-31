import { Head } from '@inertiajs/react';

type Row = { name: string; interactions: number };

type Props = {
    leader: Row | null;
    ranking: Row[];
};

export default function TopInteractions({ leader, ranking }: Props) {
    return (
        <>
            <Head title="Restaurante con más interacciones" />
            <main className="mx-auto max-w-md px-4 py-24 font-sans">
                <h1 className="text-lg font-semibold">Restaurante con más interacciones</h1>

                {leader ? (
                    <div className="mt-6 rounded border border-gray-200 p-4">
                        <p className="text-xl font-bold">{leader.name}</p>
                        <p className="mt-1 text-sm text-gray-600">{leader.interactions} interacciones</p>
                    </div>
                ) : (
                    <p className="mt-6 text-sm text-gray-500">No hay interacciones registradas.</p>
                )}

                {ranking.length > 1 && (
                    <>
                        <h2 className="mt-8 text-sm font-medium text-gray-700">Ranking</h2>
                        <ul className="mt-2 space-y-1 text-sm">
                            {ranking.map((row, i) => (
                                <li key={`${row.name}-${i}`} className="flex justify-between border-b border-gray-100 py-1">
                                    <span>
                                        {i + 1}. {row.name}
                                    </span>
                                    <span className="text-gray-500">{row.interactions}</span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </main>
        </>
    );
}
