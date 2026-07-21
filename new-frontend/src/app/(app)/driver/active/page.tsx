'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, MessageSquare, CheckCircle, Clock, Navigation } from 'lucide-react';
import { useDriverStore } from '@/stores/driverStore';
import { driverAPI, ActiveDelivery } from '@/services/driver';
import { createDeliveryTracker } from '@/services/websocket';
import Link from 'next/link';

declare global {
  interface Window {
    google?: any;
  }
}

export default function ActiveDeliveryPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<ActiveDelivery | null>(null);
  const [nextStep, setNextStep] = useState<'pickup' | 'delivery' | 'proof'>('pickup');
  const [proofImageUrl, setProofImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { activeDeliveries, setActiveDeliveries, setLocation } = useDriverStore();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/driver/login');
      return;
    }
    setToken(storedToken);

    // Load active deliveries
    loadDeliveries(storedToken);

    // Start location tracking
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(latitude, longitude);
        updateLocation(storedToken, latitude, longitude);
      },
      (error) => console.error('Geolocation error:', error),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [router, setLocation]);

  useEffect(() => {
    if (activeDeliveries.length > 0 && !selectedDelivery) {
      setSelectedDelivery(activeDeliveries[0]);
    }
  }, [activeDeliveries, selectedDelivery]);

  useEffect(() => {
    if (selectedDelivery && mapRef.current) {
      initializeMap();
    }
  }, [selectedDelivery]);

  const loadDeliveries = async (token: string) => {
    try {
      const deliveries = await driverAPI.getActiveDeliveries(token);
      setActiveDeliveries(deliveries);
    } catch (error) {
      console.error('Failed to load deliveries:', error);
    }
  };

  const updateLocation = async (token: string, lat: number, lng: number) => {
    try {
      await driverAPI.updateLocation(token, lat, lng);
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  const initializeMap = async () => {
    if (!mapRef.current || !selectedDelivery) return;

    // Load Google Maps
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${AIzaSyAk6rrT_DxxSanx0pwKjLruI-XhgN_zsko}`;
      script.async = true;
      script.onload = () => drawMap();
      document.head.appendChild(script);
    } else {
      drawMap();
    }

    function drawMap() {
      if (!selectedDelivery) return;
      const bounds = new window.google.maps.LatLngBounds();

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 14,
        mapTypeControl: false,
        fullscreenControl: false,
      });

      mapInstance.current = map;

      // Pickup marker
      new window.google.maps.Marker({
        position: { lat: selectedDelivery.pickup_lat, lng: selectedDelivery.pickup_lng },
        map,
        title: 'Pickup Location',
        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      });
      bounds.extend({ lat: selectedDelivery.pickup_lat, lng: selectedDelivery.pickup_lng });

      // Delivery marker
      new window.google.maps.Marker({
        position: { lat: selectedDelivery.dropoff_lat, lng: selectedDelivery.dropoff_lng },
        map,
        title: 'Delivery Location',
        icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
      });
      bounds.extend({ lat: selectedDelivery.dropoff_lat, lng: selectedDelivery.dropoff_lng });

      map.fitBounds(bounds);
    }
  };

  const handleUpdateStatus = async (status: 'picked_up' | 'in_transit' | 'delivered') => {
    if (!token || !selectedDelivery) return;
    try {
      const updated = await driverAPI.updateDeliveryStatus(token, selectedDelivery.id, status);
      setSelectedDelivery(updated);

      if (status === 'delivered') {
        setNextStep('proof');
      } else if (status === 'picked_up') {
        setNextStep('delivery');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSubmitProof = async () => {
    if (!token || !selectedDelivery) return;
    try {
      setIsSubmitting(true);
      await driverAPI.submitProofOfDelivery(token, selectedDelivery.id, proofImageUrl, notes);
      // Reload deliveries
      loadDeliveries(token);
    } catch (error) {
      console.error('Failed to submit proof:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedDelivery) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-white text-lg">No active deliveries</p>
          <Link href="/driver" className="text-[#6cd4ff] hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-6xl mx-auto">
        {/* Map */}
        <div
          ref={mapRef}
          className="w-full h-96 rounded-t-lg"
          style={{ backgroundColor: '#e5e7eb' }}
        />

        {/* Delivery Details */}
        <div className="bg-slate-700 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Delivery Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="bg-slate-600 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Customer</h2>
              <div className="space-y-3">
                <p className="text-white font-semibold">{selectedDelivery.customer_name}</p>
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${selectedDelivery.customer_phone}`} className="hover:text-[#6cd4ff]">
                    {selectedDelivery.customer_phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <MessageSquare className="w-4 h-4" />
                  <Link href={`/driver/chat/${selectedDelivery.id}`} className="hover:text-[#6cd4ff]">
                    Send Message
                  </Link>
                </div>
              </div>
            </div>

            {/* Locations */}
            <div className="bg-slate-600 rounded-lg p-6 space-y-4">
              <h3 className="font-bold text-white">Route</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        nextStep === 'pickup' ? 'bg-blue-500' : 'bg-[#02CCFE]'
                      }`}
                    />
                    {nextStep === 'pickup' && <div className="w-1 h-8 bg-blue-500" />}
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Pickup</p>
                    <p className="text-white font-semibold">{selectedDelivery.pickup_address}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        nextStep === 'delivery' ? 'bg-[#02CCFE]' : 'bg-slate-400'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Delivery</p>
                    <p className="text-white font-semibold">{selectedDelivery.dropoff_address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Proof of Delivery (if completed) */}
            {selectedDelivery.status === 'delivered' && nextStep === 'proof' && (
              <div className="bg-slate-600 rounded-lg p-6">
                <h3 className="font-bold text-white mb-4">Proof of Delivery</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Proof image URL (or upload)"
                    value={proofImageUrl}
                    onChange={(e) => setProofImageUrl(e.target.value)}
                    className="w-full bg-slate-500 text-white px-4 py-2 rounded-lg placeholder-slate-400 focus:outline-none"
                  />
                  <textarea
                    placeholder="Delivery notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-500 text-white px-4 py-2 rounded-lg placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    onClick={handleSubmitProof}
                    disabled={!proofImageUrl || isSubmitting}
                    className="w-full bg-[#02CCFE] text-white py-2 rounded-lg font-semibold hover:bg-[#02CCFE] transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Proof'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Status & Actions */}
          <div className="space-y-4">
            {/* Delivery Earnings */}
            <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-lg p-6 text-white">
              <p className="text-emerald-100 text-sm">Delivery Fee</p>
              <h3 className="text-3xl font-bold">KES {selectedDelivery.delivery_fee}</h3>
            </div>

            {/* Status */}
            <div className="bg-slate-600 rounded-lg p-6">
              <h3 className="font-bold text-white mb-4">Status</h3>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-[#6cd4ff] capitalize">
                  {selectedDelivery.status.replace('_', ' ')}
                </p>
                <p className="text-sm text-slate-400">
                  ETA: {selectedDelivery.eta_minutes} minutes
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-slate-600 rounded-lg p-6 space-y-3">
              {nextStep === 'pickup' && selectedDelivery.status !== 'picked_up' && (
                <button
                  onClick={() => handleUpdateStatus('picked_up')}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-[#5bc0e8] transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Pickup Complete
                </button>
              )}

              {nextStep === 'delivery' && selectedDelivery.status === 'picked_up' && (
                <button
                  onClick={() => handleUpdateStatus('in_transit')}
                  className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Navigation className="w-5 h-5" />
                  Start Delivery
                </button>
              )}

              {selectedDelivery.status === 'in_transit' && (
                <button
                  onClick={() => handleUpdateStatus('delivered')}
                  className="w-full bg-[#02CCFE] text-white py-3 rounded-lg font-semibold hover:bg-[#02CCFE] transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Mark Delivered
                </button>
              )}

              <Link
                href="/driver"
                className="w-full bg-slate-500 text-white py-3 rounded-lg font-semibold hover:bg-slate-400 transition-colors text-center"
              >
                Back to Dashboard
              </Link>
            </div>

            {/* ETA */}
            <div className="bg-slate-600 rounded-lg p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm text-slate-400">Est. Arrival</p>
                <p className="text-white font-bold">{selectedDelivery.eta_minutes} min</p>
              </div>
            </div>
          </div>
        </div>

        {/* Other Deliveries */}
        {activeDeliveries.length > 1 && (
          <div className="bg-slate-700 border-t border-slate-600 p-6">
            <h3 className="font-bold text-white mb-4">Other Active Deliveries</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeDeliveries
                .filter((d) => d.id !== selectedDelivery.id)
                .map((delivery) => (
                  <button
                    key={delivery.id}
                    onClick={() => setSelectedDelivery(delivery)}
                    className="bg-slate-600 p-4 rounded-lg hover:bg-slate-500 transition-colors text-left"
                  >
                    <p className="text-white font-semibold">{delivery.customer_name}</p>
                    <p className="text-sm text-slate-400">{delivery.pickup_address}</p>
                    <p className="text-green-400 font-bold mt-2">KES {delivery.delivery_fee}</p>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
