"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { riderService } from '@/services/riderService';
import '../common-pages.css';

export default function RiderEarnings() {
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    const { data: earningsData, isLoading } = useQuery({
        queryKey: ['riderEarnings', period],
        queryFn: () => riderService.getEarnings(period)
    });

    return (
        <div className="common-page">
            <header className="page-header">
                <h1>Earnings</h1>
                <p>Track your earnings and bonuses</p>
            </header>

            <div className="period-toggle">
                {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                    <button
                        key={p}
                        className={`period-btn ${period === p ? 'active' : ''}`}
                        onClick={() => setPeriod(p)}
                    >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                ))}
            </div>

            <div className="summary-cards">
                <div className="summary-card">
                    <h3>Total Earned</h3>
                    <div className="card-value">
                        KSh {isLoading ? '...' : earningsData?.total_earned || 0}
                    </div>
                    <p className="card-meta">{earningsData?.total_deliveries || 0} deliveries</p>
                </div>

                <div className="summary-card">
                    <h3>Average per Delivery</h3>
                    <div className="card-value">
                        KSh {isLoading ? '...' : earningsData?.total_earned ? Math.round(earningsData.total_earned / earningsData.total_deliveries) : 0}
                    </div>
                    <p className="card-meta">{period}</p>
                </div>
            </div>

            <div className="breakdown-section">
                <h2>Breakdown</h2>
                <div className="breakdown-table">
                    <div className="table-header">
                        <div className="col-date">{period === 'daily' ? 'Date' : period === 'weekly' ? 'Week' : 'Month'}</div>
                        <div className="col-deliveries">Deliveries</div>
                        <div className="col-base">Base Fee</div>
                        <div className="col-bonuses">Bonuses</div>
                        <div className="col-total">Total</div>
                    </div>
                    <div className="table-body">
                        {isLoading ? (
                            <div className="loading">Loading earnings data...</div>
                        ) : earningsData?.breakdown.length === 0 ? (
                            <div className="empty-state">No earnings data for this period</div>
                        ) : (
                            earningsData?.breakdown.map((item, idx) => (
                                <div key={idx} className="table-row">
                                    <div className="col-date">
                                        {item.date || item.week || item.month}
                                    </div>
                                    <div className="col-deliveries">{item.deliveries}</div>
                                    <div className="col-base">KSh {item.base_fee}</div>
                                    <div className="col-bonuses">
                                        <span className="bonus-badge">
                                            +KSh {(item.distance_bonus + item.speed_bonus + item.rating_bonus).toFixed(0)}
                                        </span>
                                    </div>
                                    <div className="col-total">
                                        <strong>KSh {item.total.toFixed(0)}</strong>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="bonus-explanation">
                <h3>How Bonuses Work</h3>
                <ul>
                    <li>
                        <strong>Distance Bonus:</strong> KSh 5 per km
                    </li>
                    <li>
                        <strong>Speed Bonus:</strong> +10% for deliveries 5+ minutes early
                    </li>
                    <li>
                        <strong>Rating Bonus:</strong> +10% for 5-star ratings, +5% for 4-star
                    </li>
                </ul>
            </div>
        </div>
    );
}
