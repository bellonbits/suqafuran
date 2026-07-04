"use client";

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { riderService } from '@/services/riderService';
import { useAuthStore } from '@/stores/useAuthStore';
import './dashboard.css';

const GoogleMap = dynamic(() => import('./GoogleMap'), { ssr: false });
const DeliveryMessaging = dynamic(() => import('./DeliveryMessaging'), { ssr: false });
const EarningsDashboard = dynamic(() => import('./EarningsDashboard'), { ssr: false });
const CompletionAnalytics = dynamic(() => import('./CompletionAnalytics'), { ssr: false });

import DeliveryTracker from './DeliveryTracker';
import LiveDeliveryTracker from './LiveDeliveryTracker';

interface DashboardData {
    today_earnings: number;
    deliveries_this_week: number;
    average_rating: number;
    completion_rate_percent: number;
    total_deliveries: number;
    next_delivery: any;
    availability_status: string;
}

interface AvailableDelivery {
    order_id: string;
    distance_km: number;
    delivery_fee: number;
    items_count: number;
    pickup_location: string;
    delivery_address: string;
    customer_rating: number;
    total_amount: number;
}

export default function RiderDashboard() {
    const user = useAuthStore((state) => state.user);
    const [selectedDelivery, setSelectedDelivery] = useState<AvailableDelivery | null>(null);
    const [riderLocation, setRiderLocation] = useState({ lat: -1.286389, lng: 36.817223 });
    const [routeInfo, setRouteInfo] = useState<{ [key: string]: { distance: string; duration: string } }>({});
    const [showTracker, setShowTracker] = useState(false);
    const [liveDeliveryLocation, setLiveDeliveryLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [showMessaging, setShowMessaging] = useState(false);
    const [showEarnings, setShowEarnings] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);

    const { data: dashboard, isLoading: dashboardLoading } = useQuery({
        queryKey: ['riderDashboard'],
        queryFn: riderService.getDashboard,
        refetchInterval: 30000
    });

    const { data: deliveriesData, isLoading: deliveriesLoading } = useQuery({
        queryKey: ['availableDeliveries'],
        queryFn: () => riderService.getAvailableDeliveries(50, 1, 20),
        refetchInterval: 30000
    });

    useEffect(() => {
        if (typeof window === 'undefined' || !navigator?.geolocation) return;

        navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setRiderLocation({ lat: latitude, lng: longitude });
                riderService.updateLocation(latitude, longitude).catch(err =>
                    console.error('Error updating location:', err)
                );
            },
            (error) => console.error('Error getting location:', error?.message || 'Unknown error'),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
    }, []);

    const handleAcceptDelivery = async (orderId: string) => {
        try {
            alert(`Accepted delivery: ${orderId}`);
        } catch (error) {
            console.error('Error accepting delivery:', error);
            alert('Failed to accept delivery. Please try again.');
        }
    };

    return (
        <div className="rider-dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <div>
                        <h1>Rider Dashboard</h1>
                        <p className="user-name">{user?.full_name || 'Rider'}</p>
                    </div>
                    <div className="header-buttons">
                        <button
                            className={`feature-btn ${showMessaging ? 'active' : ''}`}
                            onClick={() => setShowMessaging(!showMessaging)}
                            title="Customer Messaging"
                        >
                            💬
                        </button>
                        <button
                            className={`feature-btn ${showEarnings ? 'active' : ''}`}
                            onClick={() => setShowEarnings(!showEarnings)}
                            title="Earnings Dashboard"
                        >
                            💰
                        </button>
                        <button
                            className={`feature-btn ${showAnalytics ? 'active' : ''}`}
                            onClick={() => setShowAnalytics(!showAnalytics)}
                            title="Performance Analytics"
                        >
                            📊
                        </button>
                    </div>
                </div>
            </header>

            <div className="stats-grid">
                <div className="stat-card earnings">
                    <div className="stat-label">Today's Earnings</div>
                    <div className="stat-value">
                        KSh {dashboardLoading ? '...' : dashboard?.today_earnings || 0}
                    </div>
                    <div className="stat-meta">
                        {dashboard?.deliveries_this_week || 0} deliveries this week
                    </div>
                </div>

                <div className="stat-card deliveries">
                    <div className="stat-label">Completed This Week</div>
                    <div className="stat-value">
                        {dashboardLoading ? '...' : dashboard?.deliveries_this_week || 0}
                    </div>
                    <div className="stat-meta">
                        {dashboard?.completion_rate_percent.toFixed(1) || 0}% completion rate
                    </div>
                </div>

                <div className="stat-card rating">
                    <div className="stat-label">Average Rating</div>
                    <div className="stat-value">
                        {dashboardLoading ? '...' : dashboard?.average_rating.toFixed(1) || 0} ⭐
                    </div>
                    <div className="stat-meta">
                        From {dashboard?.total_deliveries || 0} deliveries
                    </div>
                </div>

                <div className="stat-card completion">
                    <div className="stat-label">Completion Rate</div>
                    <div className="stat-value">
                        {dashboardLoading ? '...' : dashboard?.completion_rate_percent.toFixed(1) || 0}%
                    </div>
                    <div className="stat-meta">
                        Status: {dashboard?.availability_status || 'offline'}
                    </div>
                </div>
            </div>

            {dashboard?.next_delivery && (
                <div className="next-delivery-alert">
                    <div className="alert-icon">📍</div>
                    <div className="alert-content">
                        <h3>Next Delivery</h3>
                        <p>{dashboard.next_delivery.destination}</p>
                        <small>Status: {dashboard.next_delivery.status}</small>
                    </div>
                    <button className="view-btn">View</button>
                </div>
            )}

            <div className="map-section">
                <h2>Available Orders Nearby</h2>
                <div className="map-container">
                    <Suspense fallback={<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading map...</div>}>
                        <GoogleMap
                            riderLocation={liveDeliveryLocation ? { lat: liveDeliveryLocation.latitude, lng: liveDeliveryLocation.longitude } : riderLocation}
                            deliveries={(deliveriesData?.deliveries || []).map((d: any) => ({
                                ...d,
                                location: { lat: 0, lng: 0 }, // Will be updated with real coordinates
                            }))}
                            selectedDelivery={selectedDelivery}
                            liveDeliveryLocation={liveDeliveryLocation}
                            onDeliverySelect={setSelectedDelivery}
                        />
                    </Suspense>
                </div>
            </div>

            <div className="deliveries-section">
                <h2>Available Orders ({deliveriesData?.total || 0})</h2>
                <div className="deliveries-list">
                    {deliveriesLoading ? (
                        <div className="loading">Loading deliveries...</div>
                    ) : deliveriesData?.deliveries.length === 0 ? (
                        <div className="empty-state">
                            <p>No deliveries available nearby</p>
                            <p className="hint">Check back in a few minutes</p>
                        </div>
                    ) : (
                        deliveriesData?.deliveries.map((delivery) => (
                            <div
                                key={delivery.order_id}
                                className={`delivery-card ${selectedDelivery?.order_id === delivery.order_id ? 'selected' : ''}`}
                                onClick={() => setSelectedDelivery(delivery)}
                            >
                                <div className="delivery-header">
                                    <h3>{delivery.delivery_address}</h3>
                                    <span className="distance">
                                        {routeInfo[delivery.order_id]?.distance || `${delivery.distance_km} km`}
                                    </span>
                                </div>
                                <div className="delivery-info">
                                    <span className="info-item">
                                        ⏱️ {routeInfo[delivery.order_id]?.duration || '-- mins'}
                                    </span>
                                    <span className="info-item">
                                        📦 {delivery.items_count} item{delivery.items_count !== 1 ? 's' : ''}
                                    </span>
                                    <span className="info-item">
                                        ⭐ {delivery.customer_rating}
                                    </span>
                                </div>
                                <div className="delivery-route">
                                    <div className="pickup-info">
                                        <span className="label">Pickup:</span>
                                        <span className="address">{delivery.pickup_location}</span>
                                    </div>
                                    <div className="delivery-info-route">
                                        <span className="label">Delivery:</span>
                                        <span className="address">{delivery.delivery_address}</span>
                                    </div>
                                </div>
                                <div className="delivery-fee">
                                    <span className="fee-label">Delivery Fee:</span>
                                    <span className="fee-amount">KSh {delivery.delivery_fee}</span>
                                    <span className="total-label">Total Order:</span>
                                    <span className="total-amount">KSh {delivery.total_amount}</span>
                                </div>
                                <div className="delivery-actions">
                                    {selectedDelivery?.order_id === delivery.order_id ? (
                                        <>
                                            <button
                                                className="accept-btn"
                                                onClick={() => {
                                                    handleAcceptDelivery(delivery.order_id);
                                                    setShowTracker(true);
                                                }}
                                            >
                                                Accept Delivery
                                            </button>
                                            <button
                                                className="track-btn"
                                                onClick={() => setShowTracker(true)}
                                            >
                                                Track
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="accept-btn"
                                                onClick={() => {
                                                    setSelectedDelivery(delivery);
                                                    handleAcceptDelivery(delivery.order_id);
                                                }}
                                            >
                                                Accept
                                            </button>
                                            <button className="decline-btn">Decline</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showTracker && selectedDelivery && (
                <>
                    <LiveDeliveryTracker
                        orderId={selectedDelivery.order_id}
                        onLocationUpdate={(status) => {
                            if (status.current_location) {
                                setLiveDeliveryLocation({
                                    latitude: status.current_location.latitude,
                                    longitude: status.current_location.longitude,
                                });
                            }
                        }}
                    />
                    <DeliveryTracker
                        delivery={selectedDelivery}
                        routeInfo={selectedDelivery ? routeInfo[selectedDelivery.order_id] : undefined}
                        onClose={() => setShowTracker(false)}
                    />
                </>
            )}

            {showMessaging && selectedDelivery && (
                <div className="feature-panel messaging-panel">
                    <DeliveryMessaging
                        orderId={selectedDelivery.order_id}
                        customerName="Customer"
                        onClose={() => setShowMessaging(false)}
                    />
                </div>
            )}

            {showEarnings && (
                <div className="feature-panel earnings-panel">
                    <EarningsDashboard onClose={() => setShowEarnings(false)} />
                </div>
            )}

            {showAnalytics && (
                <div className="feature-panel analytics-panel">
                    <CompletionAnalytics onClose={() => setShowAnalytics(false)} />
                </div>
            )}
        </div>
    );
}
