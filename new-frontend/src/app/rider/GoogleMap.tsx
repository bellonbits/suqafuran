'use client';

import { useEffect, useRef, useState } from 'react';

interface Location {
  lat: number;
  lng: number;
  label?: string;
}

interface Delivery {
  order_id: string;
  delivery_address: string;
  distance_km: number;
  delivery_fee: number;
  items_count: number;
  pickup_location: string;
  customer_rating: number;
  total_amount: number;
  location?: Location;
}

interface GoogleMapProps {
  riderLocation: Location;
  deliveries: Delivery[];
  selectedDelivery?: Delivery | null;
  liveDeliveryLocation?: { latitude: number; longitude: number } | null;
  onDeliverySelect: (delivery: Delivery) => void;
}

export default function GoogleMap({
  riderLocation,
  deliveries,
  selectedDelivery,
  onDeliverySelect,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [distanceService, setDistanceService] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<{
    [key: string]: { distance: string; duration: string };
  }>({});
  const markersRef = useRef<{ [key: string]: any }>({});
  const riderMarkerRef = useRef<any>(null);

  useEffect(() => {
    const initializeMap = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        console.warn('Google Maps API key not configured');
        return;
      }

      try {
        const { Loader } = await import('@googlemaps/js-api-loader');
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
        });
        await (loader as any).load();
        const google = window.google.maps;

        if (!mapRef.current) return;

        const mapInstance = new google.Map(mapRef.current, {
          zoom: 14,
          center: { lat: riderLocation.lat, lng: riderLocation.lng },
          mapTypeId: 'roadmap',
          styles: [
            {
              featureType: 'poi',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        setMap(mapInstance);

        // Create distance matrix service
        const distanceMatrix = new google.DistanceMatrixService();
        setDistanceService(distanceMatrix);

        // Add rider marker
        if (riderMarkerRef.current) {
          riderMarkerRef.current.setMap(null);
        }

        riderMarkerRef.current = new google.Marker({
          position: { lat: riderLocation.lat, lng: riderLocation.lng },
          map: mapInstance,
          title: 'Your Location',
          icon: {
            path: google.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4F46E5',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
          zIndex: 1000,
        });

        // Add delivery markers
        deliveries.forEach((delivery) => {
          if (markersRef.current[delivery.order_id]) {
            markersRef.current[delivery.order_id].setMap(null);
          }

          const marker = new google.Marker({
            position: {
              lat: delivery.location?.lat || 0,
              lng: delivery.location?.lng || 0,
            },
            map: mapInstance,
            title: delivery.delivery_address,
            icon: {
              path: google.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: selectedDelivery?.order_id === delivery.order_id ? '#EF4444' : '#10B981',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            },
          });

          marker.addListener('click', () => {
            onDeliverySelect(delivery);
          });

          markersRef.current[delivery.order_id] = marker;
        });

        // Calculate distances and durations
        if (deliveries.length > 0 && distanceMatrix) {
          const origins = [{ lat: riderLocation.lat, lng: riderLocation.lng }];
          const destinations = deliveries.map((d) => ({
            lat: d.location?.lat || 0,
            lng: d.location?.lng || 0,
          }));

          distanceMatrix.getDistanceMatrix(
            {
              origins: origins,
              destinations: destinations,
              travelMode: google.TravelMode.DRIVING,
            },
            (response: any, status: any) => {
              if (status === google.DistanceMatrixStatus.OK) {
                const routeData: { [key: string]: { distance: string; duration: string } } = {};

                response.rows[0].elements.forEach((element: any, index: number) => {
                  if (element.status === google.DistanceMatrixElementStatus.OK) {
                    routeData[deliveries[index].order_id] = {
                      distance: element.distance.text,
                      duration: element.duration.text,
                    };
                  }
                });

                setRouteInfo(routeData);
              }
            }
          );
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    initializeMap();
  }, [riderLocation, deliveries, selectedDelivery, onDeliverySelect]);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
}

export { type Delivery, type Location };
