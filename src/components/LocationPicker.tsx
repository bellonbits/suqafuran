import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

// What3Words API Key - Ideally this should be in an env variable
const W3W_API_KEY = 'YOUR_W3W_API_KEY'; // User will need to provide this or I'll use a placeholder/mock if not available

interface LocationPickerProps {
    onLocationSelect: (lat: number, lng: number, words?: string) => void;
    initialCenter?: [number, number];
}

const W3WGrid: React.FC = () => {
    const map = useMap();

    useEffect(() => {
        const layerGroup = L.layerGroup().addTo(map);

        const updateGrid = async () => {
            const zoom = map.getZoom();
            const bounds = map.getBounds();

            layerGroup.clearLayers();

            if (zoom >= 18) {
                const sw = bounds.getSouthWest();
                const ne = bounds.getNorthEast();

                try {
                    const response = await fetch(
                        `https://api.what3words.com/v3/grid-section?key=${W3W_API_KEY}&bounding-box=${sw.lat},${sw.lng},${ne.lat},${ne.lng}&format=json`
                    );
                    const data = await response.json();

                    if (data.lines) {
                        data.lines.forEach((line: any) => {
                            L.polyline(
                                [
                                    [line.start.lat, line.start.lng],
                                    [line.end.lat, line.end.lng],
                                ],
                                { color: '#e5e7eb', weight: 0.5 }
                            ).addTo(layerGroup);
                        });
                    }
                } catch (error) {
                    console.error('Error fetching W3W grid:', error);
                }
            }
        };

        map.on('moveend', updateGrid);
        updateGrid();

        return () => {
            map.off('moveend', updateGrid);
            map.removeLayer(layerGroup);
        };
    }, [map]);

    return null;
};

const MapEvents: React.FC<{ onClick: (lat: number, lng: number) => void }> = ({ onClick }) => {
    useMapEvents({
        click(e: L.LeafletMouseEvent) {
            onClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialCenter = [2.0469, 45.3182] }) => {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [w3wAddress, setW3wAddress] = useState<string>('');

    const handleMapClick = async (lat: number, lng: number) => {
        setPosition([lat, lng]);

        try {
            const response = await fetch(
                `https://api.what3words.com/v3/convert-to-3wa?key=${W3W_API_KEY}&coordinates=${lat},${lng}`
            );
            const data = await response.json();
            if (data.words) {
                setW3wAddress(data.words);
                onLocationSelect(lat, lng, data.words);
            } else {
                onLocationSelect(lat, lng);
            }
        } catch (error) {
            console.error('Error converting coordinates to W3W:', error);
            onLocationSelect(lat, lng);
        }
    };

    return (
        <div className="space-y-4">
            <div className="h-[300px] w-full rounded-2xl overflow-hidden border-2 border-primary-100 shadow-inner relative">
                <MapContainer
                    center={initialCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <W3WGrid />
                    <MapEvents onClick={handleMapClick} />
                    {position && <Marker position={position} />}
                </MapContainer>

                {!position && (
                    <div className="absolute inset-0 bg-black/5 flex items-center justify-center pointer-events-none z-[1000]">
                        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold text-gray-500 shadow-sm border border-gray-100 animate-bounce">
                            Tap to precision pin
                        </div>
                    </div>
                )}
            </div>

            {w3wAddress && (
                <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary-500 p-1.5 rounded-lg">
                            <img src="https://what3words.com/assets/images/w3w_logo.png" className="w-4 h-4 invert" alt="w3w" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest leading-none mb-1">Precise Address</p>
                            <p className="text-sm font-bold text-primary-900">///{w3wAddress}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationPicker;
