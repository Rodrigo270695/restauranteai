type Point = { lat: number; lng: number };

function project(points: Point[], width: number, height: number, pad = 12) {
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const latSpan = Math.max(maxLat - minLat, 0.002);
    const lngSpan = Math.max(maxLng - minLng, 0.002);

    return points.map((p) => ({
        x: pad + ((p.lng - minLng) / lngSpan) * (width - pad * 2),
        y: pad + ((maxLat - p.lat) / latSpan) * (height - pad * 2),
    }));
}

export function FavoriteMiniMap({
    path,
    stops,
    accent = '#FF8C00',
}: {
    path: [number, number][];
    stops: Array<{ lat: number; lng: number; position: number }>;
    accent?: string;
}) {
    const points: Point[] =
        path.length >= 2
            ? path.map(([lat, lng]) => ({ lat, lng }))
            : stops.map((s) => ({ lat: s.lat, lng: s.lng }));

    if (points.length === 0) {
        return <div className="size-full bg-sky-50" />;
    }

    const w = 160;
    const h = 160;
    const projected = project(points, w, h);
    const d = projected.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const stopPts = project(
        stops.map((s) => ({ lat: s.lat, lng: s.lng })),
        w,
        h,
    );

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="size-full" aria-hidden>
            <rect width={w} height={h} fill="#e8f1fb" />
            <path d={d} fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            {stopPts.map((p, i) => (
                <g key={`${p.x}-${i}`}>
                    <circle cx={p.x} cy={p.y} r="8" fill={accent} stroke="#fff" strokeWidth="2" />
                    <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff">
                        {stops[i]?.position ?? i + 1}
                    </text>
                </g>
            ))}
        </svg>
    );
}
