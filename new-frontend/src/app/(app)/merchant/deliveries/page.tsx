'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, MapPin, Clock, Navigation } from 'lucide-react';
import { merchantAPI, MerchantDelivery } from '@/services/merchant';
import Link from 'next/link';

declare global {
  interface Window {
    google?: any;
  }
}

export default function MerchantDeliveriesPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<MerchantDelivery[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<MerchantDelivery | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/merchant/login');
      return;
    }
    setToken(storedToken);
    loadDeliveries(storedToken);
  }, [router]);

  const loadDeliveries = async (token: string) => {
    try {
      setIsLoading(true);
      const data = await merchantAPI.getDeliveries(token);
      setDeliveries(data);
      if (data.length > 0) {
        setSelectedDelivery(data[0]);
      }
    } catch (error) {
      console.error('Failed to load deliveries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDelivery && mapRef.current) {
      initializeMap();
    }
  }, [selectedDelivery]);

  const initializeMap = async () => {
    if (!mapRef.current || !selectedDelivery) return;

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
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 14,
        center: {
          lat: selectedDelivery.pickup_lat,
          lng: selectedDelivery.pickup_lng,
        },
        mapTypeControl: false,
        fullscreenControl: false,
      });

      // Pickup
      new window.google.maps.Marker({
        position: { lat: selectedDelivery.pickup_lat, lng: selectedDelivery.pickup_lng },
        map,
        title: 'Store',
        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      });

      // Delivery
      new window.google.maps.Marker({
        position: { lat: selectedDelivery.dropoff_lat, lng: selectedDelivery.dropoff_lng },
        map,
        title: 'Customer',
        icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
      });

      // Driver current location
      if (selectedDelivery.current_lat && selectedDelivery.current_lng) {
        new window.google.maps.Marker({
          position: { lat: selectedDelivery.current_lat, lng: selectedDelivery.current_lng },
          map,
          title: 'Driver',
          icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 pb-20">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Truck className="w-6 h-6 text-orange-400" />
          <h1 className="text-2xl font-bold text-white">Active Deliveries</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div
            ref={mapRef}
            className="w-full h-96 rounded-lg"
            style={{ backgroundColor: '#e5e7eb' }}
          />

          {selectedDelivery && (
            <div className="bg-slate-700 rounded-lg p-6 mt-6">
              <h2 className="text-xl font-bold text-white mb-4">Delivery Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400">Driver</p>
                  <p className="text-white font-semibold">{selectedDelivery.driver_name}</p>
                  <a
                    href={`tel:${selectedDelivery.driver_phone}`}
                    className="text-[#6cd4ff] hover:underline text-sm"
                  >
                    {selectedDelivery.driver_phone}
                  </a>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <p className="text-white font-semibold capitalize">{selectedDelivery.status}</p>
                </div>

                {selectedDelivery.eta_minutes && (
                  <div className="flex items-center gap-2 bg-slate-600 p-4 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-sm text-slate-400">ETA</p>
                      <p className="text-white font-bold">{selectedDelivery.eta_minutes} minutes</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Deliveries List */}
        <div className="bg-slate-700 rounded-lg p-6">
          <h3 className="font-bold text-white mb-4">
            Deliveries ({deliveries.length})
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : deliveries.length === 0 ? (
            <p className="text-slate-400 text-sm">No active deliveries</p>
          ) : (
            <div className="space-y-2">
              {deliveries.map((delivery) => (
                <button
                  key={delivery.id}
                  onClick={() => setSelectedDelivery(delivery)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedDelivery?.id === delivery.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  <p className="font-semibold">{delivery.driver_name}</p>
                  <p className="text-xs"># {delivery.order_id.slice(0, 8)}</p>
                  <p className={`text-xs mt-1 ${
                    delivery.status === 'delivered' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {delivery.status}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        <Link href="/merchant" className="text-[#6cd4ff] hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
