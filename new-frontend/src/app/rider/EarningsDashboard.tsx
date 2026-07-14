'use client';

import { useState, useEffect } from 'react';
import './earnings-dashboard.css';

interface EarningsBreakdown {
  base_fees: number;
  distance_bonus: number;
  time_bonus: number;
  rating_bonus: number;
}

interface EarningsData {
  period: string;
  total_earnings: number;
  breakdown: EarningsBreakdown;
  deliveries_count: number;
  avg_per_delivery: number;
  date?: string;
  week?: string;
  month?: string;
}

interface EarningsDashboardProps {
  onClose?: () => void;
}

export default function EarningsDashboard({ onClose }: EarningsDashboardProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEarnings = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/v1/riders/me/earnings?period=${period}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          }
        );
        const data = await response.json();
        setEarnings(data);
      } catch (error) {
        console.error('Error fetching earnings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPercentage = (amount: number, total: number) => {
    return ((amount / total) * 100).toFixed(1);
  };

  if (!earnings) {
    return (
      <div className="earnings-container">
        <div className="earnings-loading">Loading earnings data...</div>
      </div>
    );
  }

  const breakdown = earnings.breakdown;
  const total = earnings.total_earnings;

  return (
    <div className="earnings-container">
      <div className="earnings-header">
        <h2>Earnings</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <div className="period-tabs">
        {(['daily', 'weekly', 'monthly'] as const).map((p) => (
          <button
            key={p}
            className={`period-tab ${period === p ? 'active' : ''}`}
            onClick={() => setPeriod(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="earnings-summary">
        <div className="total-box">
          <p className="label">Total Earnings</p>
          <p className="amount">{formatCurrency(total)}</p>
          <p className="meta">
            {earnings.deliveries_count} deliveries • {formatCurrency(earnings.avg_per_delivery)}/delivery
          </p>
        </div>
      </div>

      <div className="earnings-breakdown">
        <h3>Breakdown</h3>

        <div className="breakdown-items">
          {[
            { label: 'Base Fees', value: breakdown.base_fees, color: '#3b82f6' },
            { label: 'Distance Bonus', value: breakdown.distance_bonus, color: '#10b981' },
            { label: 'Time Bonus', value: breakdown.time_bonus, color: '#f59e0b' },
            { label: 'Rating Bonus', value: breakdown.rating_bonus, color: '#8b5cf6' },
          ].map((item) => (
            <div key={item.label} className="breakdown-item">
              <div className="item-header">
                <div className="item-label">
                  <div
                    className="color-dot"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.label}</span>
                </div>
                <span className="item-value">{formatCurrency(item.value)}</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${getPercentage(item.value, total)}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <span className="item-percentage">
                {getPercentage(item.value, total)}% of total
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="earnings-actions">
        <button className="withdraw-btn">Withdraw Earnings</button>
        <button className="details-btn">View Full History</button>
      </div>
    </div>
  );
}
