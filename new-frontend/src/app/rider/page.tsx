"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { riderService } from '@/services/riderService';
import { useAuthStore } from '@/store/useAuthStore';
import './dashboard.css';

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
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setRiderLocation({ lat: latitude, lng: longitude });
                    riderService.updateLocation(latitude, longitude).catch(err =>
                        console.error('Error updating location:', err)
                    );
                },
                (error) => console.error('Error getting location:', error),
                { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
            );
        }
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
                <h1>Rider Dashboard</h1>
                <p className="user-name">{user?.full_name || 'Rider'}</p>
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

                        {deliveriesData?.deliveries.map((delivery) => (
                            <Marker
                                key={delivery.order_id}
                                position={[0, 0]}
                                icon={deliveryIcon}
                                onClick={() => setSelectedDelivery(delivery)}
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
                                    <span className="distance">{delivery.distance_km} km away</span>
                                </div>
                                <div className="delivery-info">
                                    <span className="info-item">
                                        📦 {delivery.items_count} item{delivery.items_count !== 1 ? 's' : ''}
                                    </span>
                                    <span className="info-item">
                                        ⭐ {delivery.customer_rating}
                                    </span>
                                    <span className="info-item">
                                        KSh {delivery.total_amount}
                                    </span>
                                </div>
                                <div className="delivery-fee">
                                    <span className="fee-label">Delivery Fee:</span>
                                    <span className="fee-amount">KSh {delivery.delivery_fee}</span>
                                </div>
                                <div className="delivery-actions">
                                    <button
                                        className="accept-btn"
                                        onClick={() => handleAcceptDelivery(delivery.order_id)}
                                    >
                                        Accept
                                    </button>
                                    <button className="decline-btn">Decline</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
