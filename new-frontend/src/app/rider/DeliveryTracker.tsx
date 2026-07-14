'use client';

import { useState, useEffect } from 'react';
import './delivery-tracker.css';

interface Delivery {
    order_id: string;
    delivery_address: string;
    distance_km: number;
    delivery_fee: number;
    items_count: number;
    pickup_location: string;
    customer_rating: number;
    total_amount: number;
}

interface DeliveryTrackerProps {
    delivery: Delivery | null;
    routeInfo?: { distance: string; duration: string };
    onClose: () => void;
}

export default function DeliveryTracker({ delivery, routeInfo, onClose }: DeliveryTrackerProps) {
    const [status, setStatus] = useState<'accepted' | 'at_pickup' | 'in_transit' | 'delivered'>('accepted');
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (!delivery) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusColor = (currentStatus: string) => {
        switch (currentStatus) {
            case 'accepted':
                return '#667eea';
            case 'at_pickup':
                return '#f39c12';
            case 'in_transit':
                return '#e74c3c';
            case 'delivered':
                return '#2ecc71';
            default:
                return '#999';
        }
    };

    const statuses = [
        { key: 'accepted', label: 'Accepted', icon: '✓' },
        { key: 'at_pickup', label: 'At Pickup', icon: '📍' },
        { key: 'in_transit', label: 'In Transit', icon: '' },
        { key: 'delivered', label: 'Delivered', icon: '✓' },
    ];

    return (
        <div className="delivery-tracker-overlay">
            <div className="delivery-tracker-modal">
                <div className="tracker-header">
                    <h2>Delivery Tracking</h2>
                    <button className="close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="tracker-content">
                    {/* Route Summary */}
                    <div className="route-summary">
                        <div className="location-item">
                            <div className="location-icon pickup"></div>
                            <div className="location-details">
                                <span className="location-type">Pickup</span>
                                <span className="location-address">{delivery.pickup_location}</span>
                            </div>
                        </div>

                        <div className="route-line">
                            <div className="line"></div>
                            <div className="route-distance">
                                {routeInfo?.distance || `${delivery.distance_km} km`}
                            </div>
                            <div className="route-duration">
                                {routeInfo?.duration || '-- mins'}
                            </div>
                        </div>

                        <div className="location-item">
                            <div className="location-icon delivery">🚩</div>
                            <div className="location-details">
                                <span className="location-type">Delivery</span>
                                <span className="location-address">{delivery.delivery_address}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status Progress */}
                    <div className="status-progress">
                        <div className="progress-steps">
                            {statuses.map((s, index) => (
                                <div key={s.key} className="progress-step">
                                    <div
                                        className={`step-circle ${status === s.key ? 'active' : ''}`}
                                        style={{
                                            borderColor: getStatusColor(s.key),
                                            color: getStatusColor(s.key),
                                        }}
                                    >
                                        {s.icon}
                                    </div>
                                    <span className="step-label">{s.label}</span>
                                    {index < statuses.length - 1 && (
                                        <div
                                            className={`step-connector ${status === s.key || (statuses.findIndex((st) => st.key === status) > index) ? 'completed' : ''}`}
                                        ></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="delivery-info-panel">
                        <div className="info-row">
                            <span className="info-label">Order ID:</span>
                            <span className="info-value">{delivery.order_id}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Items:</span>
                            <span className="info-value">{delivery.items_count}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Customer Rating:</span>
                            <span className="info-value"> {delivery.customer_rating}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Delivery Fee:</span>
                            <span className="info-value fee">KSh {delivery.delivery_fee}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Total Order:</span>
                            <span className="info-value total">KSh {delivery.total_amount}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Elapsed Time:</span>
                            <span className="info-value">{formatTime(elapsedTime)}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="tracker-actions">
                        <button className="action-btn primary">
                            Navigate
                        </button>
                        <button className="action-btn secondary">
                            Call Customer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
