"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { riderService } from '@/services/riderService';
import '../common-pages.css';

export default function RiderPerformance() {
    const [page, setPage] = useState(1);

    const { data: performanceData, isLoading: performanceLoading } = useQuery({
        queryKey: ['riderPerformance'],
        queryFn: riderService.getPerformance
    });

    const { data: historyData, isLoading: historyLoading } = useQuery({
        queryKey: ['deliveryHistory', page],
        queryFn: () => riderService.getDeliveryHistory(page, 10),
        enabled: true
    });

    const renderStars = (rating: number) => {
        return '⭐'.repeat(Math.round(rating));
    };

    return (
        <div className="common-page">
            <header className="page-header">
                <h1>Performance</h1>
                <p>Your delivery performance metrics</p>
            </header>

            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon">✓</div>
                    <h3>Completion Rate</h3>
                    <div className="metric-value">
                        {performanceLoading ? '...' : performanceData?.completion_rate_percent.toFixed(1) || 0}%
                    </div>
                    <p className="metric-subtitle">
                        {performanceData?.completed_deliveries || 0} of {performanceData?.total_deliveries || 0}
                    </p>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">⭐</div>
                    <h3>Average Rating</h3>
                    <div className="metric-value">
                        {performanceLoading ? '...' : performanceData?.average_rating.toFixed(1) || 0}
                    </div>
                    <p className="metric-subtitle">
                        {performanceData?.total_ratings_received || 0} ratings received
                    </p>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">⏱</div>
                    <h3>Avg Response Time</h3>
                    <div className="metric-value">
                        {performanceLoading ? '...' : performanceData?.response_time_avg_minutes.toFixed(0) || 0} min
                    </div>
                    <p className="metric-subtitle">Time to confirm pickup</p>
                </div>

                <div className="metric-card">
                    <div className="metric-icon">📍</div>
                    <h3>On-Time Delivery</h3>
                    <div className="metric-value">
                        {performanceLoading ? '...' : performanceData?.on_time_delivery_percent.toFixed(1) || 0}%
                    </div>
                    <p className="metric-subtitle">Within 2 hours</p>
                </div>
            </div>

            <div className="rating-breakdown-section">
                <h2>Rating Breakdown</h2>
                <div className="rating-bars">
                    {performanceData && [5, 4, 3, 2, 1].map((star) => (
                        <div key={star} className="rating-bar">
                            <label>{star} Star{star !== 1 ? 's' : ''}</label>
                            <div className="bar-container">
                                <div
                                    className="bar-fill"
                                    style={{
                                        width: `${(performanceData.rating_breakdown[`${star}_star` as keyof typeof performanceData.rating_breakdown] / performanceData.total_ratings_received * 100) || 0}%`
                                    }}
                                ></div>
                            </div>
                            <span className="bar-count">
                                {performanceData.rating_breakdown[`${star}_star` as keyof typeof performanceData.rating_breakdown] || 0}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="history-section">
                <h2>Recent Deliveries</h2>
                <div className="history-list">
                    {historyLoading ? (
                        <div className="loading">Loading delivery history...</div>
                    ) : historyData?.history.length === 0 ? (
                        <div className="empty-state">No deliveries yet</div>
                    ) : (
                        historyData?.history.map((item) => (
                            <div key={item.delivery_id} className="history-item">
                                <div className="history-info">
                                    <h4>{item.delivery_location}</h4>
                                    <p className="history-meta">
                                        📦 {item.items_count} items • {item.status}
                                    </p>
                                    <p className="history-date">
                                        {new Date(item.completed_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="history-rating">
                                    {typeof item.rating === 'number'
                                        ? renderStars(item.rating)
                                        : 'Not rated'}
                                </div>
                                <div className="history-earnings">
                                    KSh {item.earnings.toFixed(0)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {historyData && historyData.total > 10 && (
                    <div className="pagination">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Previous
                        </button>
                        <span>Page {page} of {Math.ceil(historyData.total / 10)}</span>
                        <button
                            disabled={page * 10 >= historyData.total}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
