"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { riderService } from '@/services/riderService';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import '../delivery-pages.css';

export default function DeliveryPage() {
    const params = useParams();
    const router = useRouter();
    const deliveryId = params.id as string;

    const [riderLocation, setRiderLocation] = useState({ lat: -1.286389, lng: 36.817223 });
    const [photoUrl, setPhotoUrl] = useState<string>('');
    const [rating, setRating] = useState(5);
    const [review, setReview] = useState('');
    const [showRatingModal, setShowRatingModal] = useState(false);

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

    const completeDeliveryMutation = useMutation({
        mutationFn: () => {
            if (!deliveryId) throw new Error('Delivery ID required');
            return riderService.completeDelivery(deliveryId, photoUrl);
        },
        onSuccess: () => {
            setShowRatingModal(true);
        },
        onError: (error: any) => {
            alert(`Error: ${error.response?.data?.detail || 'Failed to complete delivery'}`);
        }
    });

    const rateCustomerMutation = useMutation({
        mutationFn: () => {
            if (!deliveryId) throw new Error('Delivery ID required');
            return riderService.rateCustomer(deliveryId, rating, review);
        },
        onSuccess: () => {
            alert('Delivery completed successfully!');
            setShowRatingModal(false);
            router.push('/rider');
        },
        onError: (error: any) => {
            alert(`Error: ${error.response?.data?.detail || 'Failed to rate customer'}`);
        }
    });

    const handleCompleteDelivery = () => {
        if (!photoUrl) {
            alert('Please take a photo of the delivery to proceed');
            return;
        }
        completeDeliveryMutation.mutate();
    };

    const handleSubmitRating = () => {
        rateCustomerMutation.mutate();
    };

    const renderStars = (count: number) => {
        return '⭐'.repeat(count);
    };

    return (
        <div className="delivery-page">
            <header className="delivery-header">
                <button className="back-btn" onClick={() => router.push('/rider')}>
                    ← Back
                </button>
                <h1>Complete Delivery</h1>
                <div className="header-status">Step 3/3</div>
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

            <div className="photo-section">
                <h2>Proof of Delivery</h2>
                {photoUrl ? (
                    <img src={photoUrl} alt="Delivery Proof" className="delivery-photo" />
                ) : (
                    <div className="photo-placeholder">
                        <span>📷</span>
                        <p>No photo yet</p>
                    </div>
                )}
                <button
                    className="camera-btn"
                    onClick={() => alert('Camera functionality coming soon')}
                >
                    {photoUrl ? 'Retake Photo' : 'Take Photo'}
                </button>
            </div>

            <div className="signature-section">
                <h2>Signature (Optional)</h2>
                <div className="signature-box">
                    <canvas
                        id="signatureCanvas"
                        width={300}
                        height={150}
                        style={{ border: '1px solid #ccc', borderRadius: '8px' }}
                    ></canvas>
                </div>
                <button className="clear-btn">Clear Signature</button>
            </div>

            <div className="delivery-summary">
                <h2>Delivery Summary</h2>
                <div className="summary-item">
                    <span>Base Fare:</span>
                    <strong>KSh 200</strong>
                </div>
                <div className="summary-item">
                    <span>Distance Bonus (5.2 km):</span>
                    <strong>KSh 26</strong>
                </div>
                <div className="summary-item highlight">
                    <span>Total Earnings:</span>
                    <strong>KSh 226</strong>
                </div>
            </div>

            <div className="action-buttons">
                <button
                    className="confirm-btn"
                    onClick={handleCompleteDelivery}
                    disabled={completeDeliveryMutation.isPending}
                >
                    {completeDeliveryMutation.isPending ? 'Processing...' : 'Complete Delivery'}
                </button>
                <button
                    className="cancel-btn"
                    onClick={() => router.push('/rider')}
                >
                    Cancel
                </button>
            </div>

            {showRatingModal && (
                <div className="modal-overlay" onClick={() => setShowRatingModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Rate Customer Behavior</h2>
                        <p>How was your experience delivering to this customer?</p>

                        <div className="rating-section">
                            <div className="stars-display">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        className={`star-btn ${star <= rating ? 'active' : ''}`}
                                        onClick={() => setRating(star)}
                                    >
                                        ⭐
                                    </button>
                                ))}
                            </div>
                            <p className="rating-label">{renderStars(rating)}</p>
                        </div>

                        <div className="review-section">
                            <textarea
                                placeholder="Optional: Leave a review (e.g., Customer was polite, gate was locked, etc.)"
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                className="review-input"
                            ></textarea>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="cancel-btn"
                                onClick={() => setShowRatingModal(false)}
                            >
                                Skip
                            </button>
                            <button
                                className="confirm-btn"
                                onClick={handleSubmitRating}
                                disabled={rateCustomerMutation.isPending}
                            >
                                {rateCustomerMutation.isPending ? 'Submitting...' : 'Submit Rating'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
