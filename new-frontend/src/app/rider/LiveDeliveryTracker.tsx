'use client';

import { useEffect, useState, useRef } from 'react';
import { deliveryTrackingService, DeliveryStatus } from '@/services/deliveryTrackingService';
import './live-tracker.css';

interface LiveDeliveryTrackerProps {
  orderId: string;
  isRider?: boolean;
  onLocationUpdate?: (location: DeliveryStatus) => void;
}

export default function LiveDeliveryTracker({
  orderId,
  isRider = false,
  onLocationUpdate,
}: LiveDeliveryTrackerProps) {
  const [delivery, setDelivery] = useState<DeliveryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollerRef = useRef<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // Initial fetch
    const fetchDelivery = async () => {
      try {
        setLoading(true);
        const status = await deliveryTrackingService.getDeliveryLocation(orderId);
        setDelivery(status);
        setError(null);

        if (onLocationUpdate) {
          onLocationUpdate(status);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch delivery');
      } finally {
        setLoading(false);
      }
    };

    fetchDelivery();

    // Setup polling for live updates
    pollerRef.current = deliveryTrackingService.setupLocationPolling(
      orderId,
      (location) => {
        setDelivery(location);
        if (onLocationUpdate) {
          onLocationUpdate(location);
        }
      },
      5000 // Poll every 5 seconds
    );

    return () => {
      if (pollerRef.current) {
        deliveryTrackingService.stopLocationPolling(pollerRef.current);
      }
    };
  }, [orderId, onLocationUpdate]);

  // Track elapsed time
  useEffect(() => {
    if (delivery?.timeline.started_at) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [delivery?.timeline.started_at]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  if (loading) {
    return <div className="live-tracker-loading">Loading delivery tracking...</div>;
  }

  if (error) {
    return <div className="live-tracker-error">Error: {error}</div>;
  }

  if (!delivery) {
    return <div className="live-tracker-error">Delivery not found</div>;
  }

  const distanceRemaining = delivery.current_location
    ? calculateDistance(
        delivery.current_location.latitude,
        delivery.current_location.longitude,
        delivery.delivery_location.lat,
        delivery.delivery_location.lng
      )
    : null;

  const estimatedMinutesRemaining = distanceRemaining
    ? Math.ceil(distanceRemaining * 2) // Rough estimate: 2 min per km
    : null;

  return (
    <div className="live-tracker-container">
      <div className="tracker-status-bar">
        <div className="status-item">
          <span className="status-label">Status</span>
          <span className={`status-badge ${delivery.status}`}>{delivery.status.toUpperCase()}</span>
        </div>

        {delivery.current_location && distanceRemaining !== null && (
          <>
            <div className="status-item">
              <span className="status-label">Distance</span>
              <span className="status-value">{distanceRemaining.toFixed(1)} km</span>
            </div>

            <div className="status-item">
              <span className="status-label">ETA</span>
              <span className="status-value">
                {estimatedMinutesRemaining} min{estimatedMinutesRemaining !== 1 ? 's' : ''}
              </span>
            </div>
          </>
        )}

        {delivery.timeline.started_at && (
          <div className="status-item">
            <span className="status-label">Elapsed</span>
            <span className="status-value">{formatTime(elapsedTime)}</span>
          </div>
        )}
      </div>

      {!isRider && delivery.rider && (
        <div className="rider-info-bar">
          <div className="rider-avatar">{delivery.rider.name.charAt(0)}</div>
          <div className="rider-details">
            <span className="rider-name">{delivery.rider.name}</span>
            <span className="rider-phone">{delivery.rider.phone}</span>
          </div>
          <div className="rider-actions">
            <button className="action-btn call-btn" title="Call rider">
              
            </button>
            <button className="action-btn message-btn" title="Message rider">
              💬
            </button>
          </div>
        </div>
      )}

      {delivery.current_location && (
        <div className="location-accuracy">
          <span className="accuracy-label">GPS Accuracy:</span>
          <span className="accuracy-value">
            ±{(delivery.current_location.accuracy || 0).toFixed(0)}m
          </span>
          <span className="last-update">
            Updated: {new Date(delivery.current_location.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}

      <div className="progress-indicator">
        <div className="step">
          <div className={`dot ${delivery.status === 'accepted' ? 'active' : ''}`} />
          <span>Accepted</span>
        </div>
        <div className="line" />
        <div className="step">
          <div className={`dot ${delivery.status === 'in_transit' ? 'active' : ''}`} />
          <span>In Transit</span>
        </div>
        <div className="line" />
        <div className="step">
          <div className={`dot ${delivery.status === 'completed' ? 'active' : ''}`} />
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}
