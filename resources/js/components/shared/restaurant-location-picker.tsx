import L from 'leaflet';
import { MapPin, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

type Props = {
    latitude: number | null;
    longitude: number | null;
    address?: string;
    defaultCenter: { lat: number; lng: number };
    onChange: (coords: { latitude: number | null; longitude: number | null }) => void;
    disabled?: boolean;
    geocodeUrl?: string;
    className?: string;
    height?: string;
};

const pinIcon = L.divIcon({
    className: 'location-pin',
    html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#E85D04;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25)"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
});

function MapClickHandler({
    disabled,
    onPick,
}: {
    disabled: boolean;
    onPick: (lat: number, lng: number) => void;
}) {
    useMapEvents({
        click(e) {
            if (disabled) return;
            onPick(e.latlng.lat, e.latlng.lng);
        },
    });

    return null;
}

function MapViewSync({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [map, center, zoom]);

    return null;
}

export function RestaurantLocationPicker({
    latitude,
    longitude,
    address = '',
    defaultCenter,
    onChange,
    disabled = false,
    geocodeUrl = '/app/restaurants/geocode',
    className,
    height = 'min-h-[220px]',
}: Props) {
    const [geocoding, setGeocoding] = useState(false);

    const hasCoords = latitude != null && longitude != null;
    const center = useMemo<[number, number]>(
        () => (hasCoords ? [latitude!, longitude!] : [defaultCenter.lat, defaultCenter.lng]),
        [hasCoords, latitude, longitude, defaultCenter.lat, defaultCenter.lng],
    );
    const zoom = hasCoords ? 16 : 13;

    const pick = (lat: number, lng: number) => {
        onChange({
            latitude: Math.round(lat * 1e7) / 1e7,
            longitude: Math.round(lng * 1e7) / 1e7,
        });
    };

    const geocodeFromAddress = async () => {
        const q = address.trim();
        if (!q || disabled) return;

        setGeocoding(true);
        try {
            const token =
                document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
            const res = await fetch(geocodeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ address: q }),
            });
            const data = (await res.json()) as { lat?: number; lng?: number; message?: string };
            if (!res.ok) {
                throw new Error(data.message ?? 'No encontramos la dirección');
            }
            if (data.lat == null || data.lng == null) {
                throw new Error('Respuesta de ubicación inválida');
            }
            pick(data.lat, data.lng);
            import('sonner').then(({ toast }) => toast.success('Ubicación encontrada en el mapa'));
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'No encontramos la dirección. Haz clic en el mapa.';
            import('sonner').then(({ toast }) => toast.error(msg));
        } finally {
            setGeocoding(false);
        }
    };

    return (
        <div className={cn('space-y-2', className)}>
            {!hasCoords && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Sin coordenadas este local no aparece en el mapa para turistas. Marca el punto en el mapa o
                    busca por dirección.
                </p>
            )}

            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    disabled={disabled || !address.trim() || geocoding}
                    onClick={geocodeFromAddress}
                >
                    <Search className="mr-1.5 size-3.5" />
                    {geocoding ? 'Buscando…' : 'Ubicar por dirección'}
                </Button>
                {hasCoords && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="cursor-pointer text-gray-600"
                        disabled={disabled}
                        onClick={() => onChange({ latitude: null, longitude: null })}
                    >
                        Quitar pin
                    </Button>
                )}
            </div>

            <div className={cn('overflow-hidden rounded-xl ring-1 ring-gray-200', height)}>
                <MapContainer
                    center={center}
                    zoom={zoom}
                    className="size-full min-h-[220px]"
                    scrollWheelZoom={!disabled}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapViewSync center={center} zoom={zoom} />
                    <MapClickHandler disabled={disabled} onPick={pick} />
                    {hasCoords && (
                        <Marker
                            position={[latitude!, longitude!]}
                            icon={pinIcon}
                            draggable={!disabled}
                            eventHandlers={{
                                dragend: e => {
                                    const pos = e.target.getLatLng();
                                    pick(pos.lat, pos.lng);
                                },
                            }}
                        />
                    )}
                </MapContainer>
            </div>

            {hasCoords && (
                <p className="flex items-center gap-1 text-[11px] text-gray-500">
                    <MapPin className="size-3 shrink-0 text-brand-orange" />
                    {latitude!.toFixed(6)}, {longitude!.toFixed(6)} — arrastra el pin o haz clic en el mapa
                </p>
            )}
        </div>
    );
}
