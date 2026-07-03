"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { riderService } from '@/services/riderService';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import '../delivery-pages.css';

export default function PickupPage() {
    const params = useParams();
    const router = useRouter();
    const deliveryId = params.id as string;

    const [showCamera, setShowCamera] = useState(false);
    const [photoUrl, setPhotoUrl] = useState<string>('');
    const [riderLocation, setRiderLocation] = useState({ lat: -1.286389, lng: 36.817223 });

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

    const confirmPickupMutation = useMutation({
        mutationFn: () => {
            if (!deliveryId) throw new Error('Delivery ID required');
            return riderService.confirmPickup(deliveryId);
        },
        onSuccess: () => {
            alert('Pickup confirmed! Proceeding to delivery.');
            router.push(`/rider/delivery/${deliveryId}/in-transit`);
        },
        onError: (error: any) => {
            alert(`Error: ${error.response?.data?.detail || 'Failed to confirm pickup'}`);
        }
    });

    const handleConfirmPickup = () => {
        if (!photoUrl && !showCamera) {
            alert('Please take a photo of the package to proceed');
            return;
        }
        confirmPickupMutation.mutate();
    };

    return (
        <div className="delivery-page">
            <header className="delivery-header">
                <button className="back-btn" onClick={() => router.push('/rider')}>
                    ← Back
                </button>
                <h1>Confirm Pickup</h1>
                <div className="header-status">Step 1/3</div>
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
                    <p>Distance to pickup: <strong>2.5 km</strong></p>
                    <p>Estimated time: <strong>8 minutes</strong></p>
                </div>
            </div>

            <div className="location-section">
                <h2>Pickup Location</h2>
                <div className="location-card">
                    <h3>Seller</h3>
                    <p className="address">123 Market Street, Nairobi</p>
                    <p className="phone">📞 +254 712 345 678</p>
                    <button className="contact-btn">Call Seller</button>
                </div>
            </div>

            <div className="items-section">
                <h2>Items ({1})</h2>
                <div className="items-list">
                    <div className="item-card">
                        <div className="item-image">📦</div>
                        <div className="item-info">
                            <h4>Sample Item</h4>
                            <p>Qty: 1</p>
                            <p className="item-price">KSh 500</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="verification-section">
                <h2>Verification</h2>
                <div className="verification-group">
                    <label className="verification-item">
                        <input type="checkbox" defaultChecked />
                        <span>Verify package count</span>
                    </label>
                    <label className="verification-item">
                        <input type="checkbox" defaultChecked />
                        <span>Package is undamaged</span>
                    </label>
                </div>
            </div>

            <div className="photo-section">
                <h2>Package Photo</h2>
                {photoUrl ? (
                    <img src={photoUrl} alt="Package" className="package-photo" />
                ) : (
                    <div className="photo-placeholder">
                        <span>📷</span>
                        <p>No photo yet</p>
                    </div>
                )}
                <button
                    className="camera-btn"
                    onClick={() => setShowCamera(true)}
                >
                    {photoUrl ? 'Retake Photo' : 'Take Photo'}
                </button>
            </div>

            <div className="action-buttons">
                <button
                    className="confirm-btn"
                    onClick={handleConfirmPickup}
                    disabled={confirmPickupMutation.isPending}
                >
                    {confirmPickupMutation.isPending ? 'Processing...' : 'Confirm Pickup'}
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
