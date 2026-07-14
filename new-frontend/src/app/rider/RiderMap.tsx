'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const riderIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface RiderMapProps {
    riderLocation: { lat: number; lng: number };
    deliveriesData?: any;
    onDeliverySelect: (delivery: any) => void;
    selectedDeliveryId?: string;
}

export default function RiderMap({
    riderLocation,
    deliveriesData,
    onDeliverySelect,
    selectedDeliveryId
}: RiderMapProps) {
    return (
        <MapContainer
            center={[riderLocation.lat, riderLocation.lng]}
            zoom={13}
            scrollWheelZoom={true}
            className="rider-map"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={[riderLocation.lat, riderLocation.lng]} icon={riderIcon}>
                <Popup>Your Location</Popup>
            </Marker>

            {deliveriesData?.deliveries.map((delivery: any) => (
                <Marker
                    key={delivery.order_id}
                    position={[0, 0]}
                    icon={deliveryIcon}
                    eventHandlers={{
                        click: () => onDeliverySelect(delivery)
                    }}
                >
                    <Popup>
                        <div>
                            <p><strong>{delivery.delivery_address}</strong></p>
                            <p>Distance: {delivery.distance_km} km</p>
                            <p>Fee: KSh {delivery.delivery_fee}</p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
