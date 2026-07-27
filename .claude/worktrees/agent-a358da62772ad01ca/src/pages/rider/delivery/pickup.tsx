import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { riderService } from '../../../services/riderService';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import './DeliveryPages.css';

const PickupPage: React.FC = () => {
    const { deliveryId } = useParams<{ deliveryId: string }>();
    const navigate = useNavigate();
    const [showCamera, setShowCamera] = useState(false);
    const [photoUrl, setPhotoUrl] = useState<string>('');
    const [riderLocation, setRiderLocation] = useState({ lat: -1.286389, lng: 36.817223 });

    // Get rider location
    React.useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setRiderLocation({ lat: latitude, lng: longitude });
                }
            );
        }
    }, []);

    // Confirm pickup mutation
    const confirmPickupMutation = useMutation({
        mutationFn: () => {
            if (!deliveryId) throw new Error('Delivery ID required');
            return riderService.confirmPickup(deliveryId);
        },
        onSuccess: () => {
            alert('Pickup confirmed! Proceeding to delivery.');
            navigate(`/rider/delivery/${deliveryId}/in-transit`);
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

    const handleTakePhoto = () => {
        setShowCamera(true);
    };

    const handlePhotoCapture = (url: string) => {
        setPhotoUrl(url);
        setShowCamera(false);
    };

    return (
        <div className="delivery-page">
            <header className="delivery-header">
                <button className="back-btn" onClick={() => navigate('/rider/dashboard')}>
                    ← Back
                </button>
                <h1>Confirm Pickup</h1>
                <div className="header-status">Step 1/3</div>
            </header>

            {/* Map */}
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

            {/* Seller Info */}
            <div className="location-section">
                <h2>Pickup Location</h2>
                <div className="location-card">
                    <div className="location-header">
                        <h3>Seller Name</h3>
                        <div className="location-address">
                            123 Market Street, Nairobi
                        </div>
                    </div>
                    <div className="location-contact">
                        <button className="call-btn">📞 Call Seller</button>
                    </div>
                </div>
            </div>

            {/* Order Verification */}
            <div className="verification-section">
                <h2>Order Items</h2>
                <div className="items-list">
                    <div className="item">
                        <span className="item-name">Product 1</span>
                        <span className="item-qty">Qty: 2</span>
                    </div>
                    <div className="item">
                        <span className="item-name">Product 2</span>
                        <span className="item-qty">Qty: 1</span>
                    </div>
                </div>
            </div>

            {/* Package Photo */}
            <div className="photo-section">
                <h2>Package Photo</h2>
                <div className="photo-container">
                    {photoUrl ? (
                        <div className="photo-preview">
                            <img src={photoUrl} alt="Package" />
                            <button
                                className="retake-btn"
                                onClick={handleTakePhoto}
                            >
                                Retake Photo
                            </button>
                        </div>
                    ) : (
                        <div className="photo-placeholder">
                            <div className="placeholder-icon">📸</div>
                            <p>Take a photo of the package</p>
                            <button
                                className="camera-btn"
                                onClick={handleTakePhoto}
                            >
                                Open Camera
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <div className="camera-modal">
                    <div className="camera-content">
                        <h2>Take Photo</h2>
                        <div className="camera-feed">
                            <p>Camera feed would go here</p>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const url = URL.createObjectURL(file);
                                        handlePhotoCapture(url);
                                    }
                                }}
                            />
                        </div>
                        <button
                            className="close-camera"
                            onClick={() => setShowCamera(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Confirm Button */}
            <div className="action-section">
                <button
                    className="confirm-btn"
                    onClick={handleConfirmPickup}
                    disabled={confirmPickupMutation.isPending}
                >
                    {confirmPickupMutation.isPending ? 'Confirming...' : 'Confirm Pickup'}
                </button>
            </div>
        </div>
    );
};

export default PickupPage;
