import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { riderService } from '../../../services/riderService';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import './DeliveryPages.css';

const InTransitPage: React.FC = () => {
    const { deliveryId } = useParams<{ deliveryId: string }>();
    const navigate = useNavigate();
    const [riderLocation, setRiderLocation] = useState({ lat: -1.286389, lng: 36.817223 });
    const [timeRemaining, setTimeRemaining] = useState('12 minutes');

    // Get rider location and update periodically
    useEffect(() => {
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setRiderLocation({ lat: latitude, lng: longitude });
                    // Update location in backend
                    riderService.updateLocation(latitude, longitude).catch(err =>
                        console.error('Error updating location:', err)
                    );
                },
                (error) => console.error('Error getting location:', error),
                { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    // Countdown timer
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                const parts = prev.split(' ');
                let minutes = parseInt(parts[0]);
                if (minutes > 1) {
                    minutes--;
                    return `${minutes} minutes`;
                }
                return 'Arriving soon';
            });
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Start delivery mutation
    const startDeliveryMutation = useMutation({
        mutationFn: () => {
            if (!deliveryId) throw new Error('Delivery ID required');
            return riderService.startDelivery(deliveryId);
        },
        onSuccess: () => {
            navigate(`/rider/delivery/${deliveryId}/delivery`);
        },
        onError: (error: any) => {
            alert(`Error: ${error.response?.data?.detail || 'Failed to start delivery'}`);
        }
    });

    return (
        <div className="delivery-page">
            <header className="delivery-header">
                <h1>In Transit</h1>
                <div className="header-status">Step 2/3</div>
            </header>

            {/* Live Map */}
            <div className="map-section full-map">
                <div className="map-container">
                    <MapContainer
                        center={[riderLocation.lat, riderLocation.lng]}
                        zoom={14}
                        className="delivery-map"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[riderLocation.lat, riderLocation.lng]}>
                            <Popup>Your Location (Live)</Popup>
                        </Marker>
                    </MapContainer>
                </div>
            </div>

            {/* Current Location Info */}
            <div className="current-location-section">
                <h3>Current Location</h3>
                <p className="location-address">
                    Kenyatta Avenue, Nairobi
                </p>
            </div>

            {/* Destination Info Card */}
            <div className="destination-card">
                <div className="destination-header">
                    <h3>📍 Delivery Destination</h3>
                </div>
                <div className="destination-info">
                    <p className="destination-address">
                        456 Westlands Avenue, Nairobi
                    </p>
                    <div className="destination-meta">
                        <span>Distance: <strong>3.2 km</strong></span>
                        <span>Time: <strong>{timeRemaining}</strong></span>
                    </div>
                </div>

                <div className="customer-contact">
                    <h4>Customer</h4>
                    <p className="customer-name">John Doe</p>
                    <button className="contact-btn">📞 Call Customer</button>
                    <button className="contact-btn secondary">📍 Share Location</button>
                </div>
            </div>

            {/* Delivery Status Indicator */}
            <div className="status-indicator">
                <div className="status-step completed">
                    <span>1</span>
                    <p>Pickup Confirmed</p>
                </div>
                <div className="status-step active">
                    <span>2</span>
                    <p>In Transit</p>
                </div>
                <div className="status-step">
                    <span>3</span>
                    <p>Delivered</p>
                </div>
            </div>

            {/* Arrival Action */}
            <div className="action-section">
                <button
                    className="primary-btn"
                    onClick={() => startDeliveryMutation.mutate()}
                    disabled={startDeliveryMutation.isPending}
                >
                    {startDeliveryMutation.isPending ? 'Processing...' : 'I\'ve Arrived at Delivery'}
                </button>
                <p className="hint">
                    Tap this when you reach the customer's location
                </p>
            </div>
        </div>
    );
};

export default InTransitPage;
