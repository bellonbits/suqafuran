import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { riderService } from '../../../services/riderService';
import './DeliveryPages.css';

const DeliveryPage: React.FC = () => {
    const { deliveryId } = useParams<{ deliveryId: string }>();
    const navigate = useNavigate();
    const [proofPhotoUrl, setProofPhotoUrl] = useState<string>('');
    const [showCamera, setShowCamera] = useState(false);
    const [customerSignature, setCustomerSignature] = useState('');
    const [riderRating, setRiderRating] = useState(0);
    const [showRatingModal, setShowRatingModal] = useState(false);

    // Complete delivery mutation
    const completeDeliveryMutation = useMutation({
        mutationFn: () => {
            if (!deliveryId) throw new Error('Delivery ID required');
            if (!proofPhotoUrl) throw new Error('Proof photo required');
            return riderService.completeDelivery(deliveryId, proofPhotoUrl);
        },
        onSuccess: () => {
            setShowRatingModal(true);
        },
        onError: (error: any) => {
            alert(`Error: ${error.response?.data?.detail || 'Failed to complete delivery'}`);
        }
    });

    const handleCompleteDelivery = () => {
        if (!proofPhotoUrl) {
            alert('Please take a proof photo to complete delivery');
            return;
        }
        completeDeliveryMutation.mutate();
    };

    const handlePhotoCapture = (url: string) => {
        setProofPhotoUrl(url);
        setShowCamera(false);
    };

    const handleSubmitRating = async () => {
        if (riderRating === 0) {
            alert('Please select a rating');
            return;
        }
        try {
            await riderService.rateCustomer(deliveryId || '', 5 - riderRating, 'Good service');
            alert('Thank you for your feedback!');
            navigate('/rider/dashboard');
        } catch (error) {
            console.error('Error submitting rating:', error);
        }
    };

    return (
        <div className="delivery-page">
            <header className="delivery-header">
                <h1>Complete Delivery</h1>
                <div className="header-status">Step 3/3</div>
            </header>

            {/* Customer Location */}
            <div className="location-section">
                <h2>Delivery Location</h2>
                <div className="location-card">
                    <h3>456 Westlands Avenue</h3>
                    <p className="location-address">
                        Nairobi, Kenya 00100
                    </p>
                    <div className="customer-info">
                        <h4>Customer: John Doe</h4>
                        <button className="call-btn">📞 Call Customer</button>
                    </div>
                </div>
            </div>

            {/* Proof of Delivery Photo */}
            <div className="photo-section">
                <h2>Proof of Delivery</h2>
                <p className="photo-hint">Take a photo of the delivery at the customer's location</p>
                <div className="photo-container">
                    {proofPhotoUrl ? (
                        <div className="photo-preview">
                            <img src={proofPhotoUrl} alt="Proof of Delivery" />
                            <button
                                className="retake-btn"
                                onClick={() => setShowCamera(true)}
                            >
                                Retake Photo
                            </button>
                        </div>
                    ) : (
                        <div className="photo-placeholder">
                            <div className="placeholder-icon">📸</div>
                            <p>Take proof of delivery photo</p>
                            <button
                                className="camera-btn"
                                onClick={() => setShowCamera(true)}
                            >
                                Open Camera
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Customer Signature */}
            <div className="signature-section">
                <h2>Customer Signature</h2>
                <input
                    type="text"
                    placeholder="Enter customer name to confirm receipt"
                    value={customerSignature}
                    onChange={(e) => setCustomerSignature(e.target.value)}
                    className="signature-input"
                />
            </div>

            {/* Completion Summary */}
            <div className="summary-section">
                <h2>Delivery Summary</h2>
                <div className="summary-items">
                    <div className="summary-item">
                        <span className="summary-label">Items Delivered</span>
                        <span className="summary-value">3</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Earnings</span>
                        <span className="summary-value earnings">+KSh 150</span>
                    </div>
                </div>
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <div className="camera-modal">
                    <div className="camera-content">
                        <h2>Take Proof Photo</h2>
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

            {/* Rating Modal */}
            {showRatingModal && (
                <div className="modal-overlay">
                    <div className="modal-content rating-modal">
                        <h2>Rate Customer</h2>
                        <p>How would you rate this customer?</p>

                        <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    className={`star-btn ${riderRating >= star ? 'active' : ''}`}
                                    onClick={() => setRiderRating(star)}
                                >
                                    ⭐
                                </button>
                            ))}
                        </div>

                        <div className="modal-actions">
                            <button
                                className="close-btn"
                                onClick={() => setShowRatingModal(false)}
                            >
                                Skip
                            </button>
                            <button
                                className="submit-btn"
                                onClick={handleSubmitRating}
                            >
                                Submit Rating
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Complete Delivery Button */}
            <div className="action-section">
                <button
                    className="complete-btn"
                    onClick={handleCompleteDelivery}
                    disabled={!proofPhotoUrl || completeDeliveryMutation.isPending}
                >
                    {completeDeliveryMutation.isPending ? 'Processing...' : 'Complete Delivery'}
                </button>
                <p className="hint">
                    Take a photo and enter customer name to complete
                </p>
            </div>
        </div>
    );
};

export default DeliveryPage;
