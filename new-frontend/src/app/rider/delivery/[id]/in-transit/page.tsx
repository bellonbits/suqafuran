"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { riderService } from '@/services/riderService';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import '../delivery-pages.css';

export default function InTransitPage() {
    const params = useParams();
    const router = useRouter();
    const deliveryId = params.id as string;

    const [riderLocation, setRiderLocation] = useState({ lat: -1.286389, lng: 36.817223 });
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setRiderLocation({ lat: latitude, lng: longitude });
                }
            );
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((t) => t + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const startDeliveryMutation = useMutation({
        mutationFn: () => {
            if (!deliveryId) throw new Error('Delivery ID required');
            return riderService.startDelivery(deliveryId);
        },
        onSuccess: () => {
            alert('Delivery started!');
            router.push(`/rider/delivery/${deliveryId}/delivery`);
        },
        onError: (error: any) => {
            alert(`Error: ${error.response?.data?.detail || 'Failed to start delivery'}`);
        }
    });

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartDelivery = () => {
        startDeliveryMutation.mutate();
    };

    return (
        <div className="delivery-page">
            <header className="delivery-header">
                <button className="back-btn" onClick={() => router.push('/rider')}>
                    ← Back
                </button>
                <h1>In Transit</h1>
                <div className="header-status">Step 2/3</div>
            </header>

            <div className="map-section">
                <div className="map-container">
                    <MapContainer
                        center={[riderLocation.lat, riderLocation.lng]}
                        zoom={13}
                        className="delivery-map"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[riderLocation.lat, riderLocation.lng]}>
                            <Popup>Your Location</Popup>
                        </Marker>
                    </MapContainer>
                </div>
                <div className="map-distance">
                    <p>Distance to customer: <strong>3.2 km</strong></p>
                    <p>Estimated time: <strong>12 minutes</strong></p>
                </div>
            </div>

            <div className="timer-section">
                <div className="elapsed-time">
                    <h3>Elapsed Time</h3>
                    <div className="time-display">{formatTime(timer)}</div>
                </div>
            </div>

            <div className="delivery-info">
                <h2>Delivery Destination</h2>
                <div className="location-card">
                    <h3>Customer Name</h3>
                    <p className="address">456 Customer Ave, Nairobi</p>
                    <p className="phone">📞 +254 700 123 456</p>
                    <button className="contact-btn">Call Customer</button>
                </div>
            </div>

            <div className="status-updates">
                <h2>Delivery Status</h2>
                <div className="status-list">
                    <div className="status-item completed">
                        <div className="status-icon">✓</div>
                        <div className="status-text">
                            <h4>Pickup Confirmed</h4>
                            <p>Package picked up from seller</p>
                        </div>
                    </div>
                    <div className="status-item active">
                        <div className="status-icon">📍</div>
                        <div className="status-text">
                            <h4>In Transit</h4>
                            <p>Heading to customer location</p>
                        </div>
                    </div>
                    <div className="status-item pending">
                        <div className="status-icon">📦</div>
                        <div className="status-text">
                            <h4>Awaiting Delivery</h4>
                            <p>Will complete when you arrive</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="action-buttons">
                <button
                    className="confirm-btn"
                    onClick={handleStartDelivery}
                    disabled={startDeliveryMutation.isPending}
                >
                    {startDeliveryMutation.isPending ? 'Processing...' : 'Proceed to Delivery'}
                </button>
                <button
                    className="cancel-btn"
                    onClick={() => router.push('/rider')}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
