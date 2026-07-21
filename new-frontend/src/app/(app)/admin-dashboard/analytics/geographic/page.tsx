"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, TrendingUp, Calendar, RefreshCw, Users, Globe } from 'lucide-react';
import { analyticsService } from '../../../../../services/analytics';

interface CityData {
  city: string;
  latitude: number;
  longitude: number;
  country: string;
  visitor_count: number;
  unique_users: number;
}

interface CountryData {
  country: string;
  visitor_count: number;
  unique_users: number;
}

export default function GeographicAnalytics() {
  const [cities, setCities] = useState<CityData[]>([]);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    document.body.appendChild(script);
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getGeographicAnalytics(days);
      const citiesData = res.data?.cities || [];
      setCities(citiesData);
      setCountries(res.data?.countries || []);
      setLastRefresh(new Date());

      if (mapLoaded) {
        drawMap(citiesData);
      }
    } catch (error) {
      console.error('Failed to fetch geographic analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const drawMap = (citiesData: CityData[]) => {
    const mapElement = document.getElementById('analytics-map');
    if (!mapElement || typeof (window as any).google === 'undefined') return;

    // Default center (world view)
    let center = { lat: 20, lng: 0 };
    let zoom = 2;

    // If there's data, center on average location
    if (citiesData.length > 0) {
      const avgLat = citiesData.reduce((sum, c) => sum + c.latitude, 0) / citiesData.length;
      const avgLng = citiesData.reduce((sum, c) => sum + c.longitude, 0) / citiesData.length;
      center = { lat: avgLat, lng: avgLng };
      zoom = 6;
    }

    const map = new (window as any).google.maps.Map(mapElement, {
      zoom,
      center,
      styles: [
        {
          featureType: 'all',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#616161' }],
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#e9e9e9' }],
        },
      ],
    });

    // Only add markers if there's data
    if (citiesData.length > 0) {
      const maxVisitors = Math.max(...citiesData.map(c => c.visitor_count));

      citiesData.forEach((city) => {
        const size = Math.max(20, Math.min(50, (city.visitor_count / maxVisitors) * 50));

        const marker = new (window as any).google.maps.Marker({
          position: { lat: city.latitude, lng: city.longitude },
          map,
          title: city.city,
          icon: {
            path: (window as any).google.maps.SymbolPath.CIRCLE,
            scale: size,
            fillColor: '#ff9900',
            fillOpacity: 0.8,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
        });

        const infoWindow = new (window as any).google.maps.InfoWindow({
          content: `
            <div style="font-family: system-ui;">
              <strong>${city.city}, ${city.country}</strong><br/>
              Visitors: ${city.visitor_count}<br/>
              Unique Users: ${city.unique_users}
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
          setSelectedCity(city);
        });
      });
    }
  };

  useEffect(() => {
    if (mapLoaded) {
      fetchAnalytics();
    }
  }, [days, mapLoaded]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Geographic Analytics</h1>
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800 flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600 dark:text-slate-400" />
            <label className="text-sm font-semibold text-gray-900 dark:text-white">Period:</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-sm font-semibold text-gray-900 dark:text-white"
            >
              <option value={1}>1 day</option>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
          {lastRefresh && (
            <span className="text-xs text-gray-500 dark:text-slate-500 ml-auto">
              Last: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div id="analytics-map" style={{ width: '100%', height: '500px' }} />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50">
              <p className="text-gray-600">Loading map...</p>
            </div>
          )}
        </div>

        {cities.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Visitors by City</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">City</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">Country</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">Visitors</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300">Users</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {cities.map((city, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer">
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white">{city.city}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{city.country}</td>
                      <td className="px-6 py-3 text-sm font-bold text-blue-600">{city.visitor_count.toLocaleString()}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{city.unique_users}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {countries.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Visitors by Country</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {countries.map((country, idx) => (
                <div key={idx} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-white">{country.country}</p>
                  <p className="text-2xl font-black text-purple-600 mt-2">{country.visitor_count.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{country.unique_users} unique</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
