'use client';

import { useState, useEffect } from 'react';
import './completion-analytics.css';

interface PerformanceMetrics {
  completion_rate: number;
  on_time_percentage: number;
  average_rating: number;
  total_deliveries: number;
  total_distance_km: number;
  ratings_breakdown: {
    [key: string]: number;
  };
  customer_feedback: string[];
  safety_score: number;
  milestones: {
    [key: string]: boolean;
  };
}

interface CompletionAnalyticsProps {
  onClose?: () => void;
}

export default function CompletionAnalytics({
  onClose,
}: CompletionAnalyticsProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/v1/riders/me/performance', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (!metrics) {
    return (
      <div className="analytics-container">
        <div className="analytics-loading">Loading analytics...</div>
      </div>
    );
  }

  const totalRatings = Object.values(metrics.ratings_breakdown).reduce(
    (a, b) => a + b,
    0
  );

  const getRatingPercentage = (count: number) => {
    return ((count / totalRatings) * 100).toFixed(1);
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>Performance Analytics</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <div className="analytics-content">
        <div className="key-metrics">
          <div className="metric-card">
            <div className="metric-icon completion"></div>
            <p className="metric-label">Completion Rate</p>
            <p className="metric-value">{metrics.completion_rate}%</p>
            <div className="metric-bar">
              <div
                className="metric-fill"
                style={{ width: `${metrics.completion_rate}%` }}
              />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon ontime">⏱</div>
            <p className="metric-label">On-Time %</p>
            <p className="metric-value">{metrics.on_time_percentage}%</p>
            <div className="metric-bar">
              <div
                className="metric-fill ontime-fill"
                style={{ width: `${metrics.on_time_percentage}%` }}
              />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon safety">🛡</div>
            <p className="metric-label">Safety Score</p>
            <p className="metric-value">{metrics.safety_score}</p>
            <div className="metric-bar">
              <div
                className="metric-fill safety-fill"
                style={{ width: `${metrics.safety_score}%` }}
              />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon rating"></div>
            <p className="metric-label">Avg Rating</p>
            <p className="metric-value">
              {metrics.average_rating.toFixed(1)}/5
            </p>
            <div className="stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`star ${
                    i < Math.round(metrics.average_rating) ? 'filled' : 'empty'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="stats-section">
          <div className="stat-item">
            <span className="stat-label">Total Deliveries</span>
            <span className="stat-value">{metrics.total_deliveries}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Distance Covered</span>
            <span className="stat-value">{metrics.total_distance_km} km</span>
          </div>
        </div>

        <div className="ratings-breakdown">
          <h3>Rating Distribution</h3>
          <div className="ratings-list">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count =
                metrics.ratings_breakdown[`${stars}_stars`] || 0;
              return (
                <div key={stars} className="rating-row">
                  <div className="rating-stars">
                    {Array.from({ length: stars }).map((_, i) => (
                      <span key={i} className="star filled">
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="rating-bar">
                    <div
                      className="rating-fill"
                      style={{
                        width: `${getRatingPercentage(count)}%`,
                      }}
                    />
                  </div>
                  <span className="rating-count">
                    {count} ({getRatingPercentage(count)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {metrics.customer_feedback.length > 0 && (
          <div className="feedback-section">
            <h3>Customer Feedback Highlights</h3>
            <div className="feedback-tags">
              {metrics.customer_feedback.map((feedback, index) => (
                <span key={index} className="feedback-tag">
                  {feedback}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="milestones-section">
          <h3>Milestones</h3>
          <div className="milestones-list">
            {Object.entries(metrics.milestones).map(
              ([milestone, achieved]) => {
                const milestoneLabel = milestone
                  .replace(/_/g, ' ')
                  .replace(/^\w/, (c) => c.toUpperCase());
                return (
                  <div
                    key={milestone}
                    className={`milestone-item ${
                      achieved ? 'achieved' : 'not-achieved'
                    }`}
                  >
                    <span className="milestone-icon">
                      {achieved ? '✓' : '○'}
                    </span>
                    <span className="milestone-label">{milestoneLabel}</span>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
