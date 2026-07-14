'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Store, MapPin, Phone, Globe } from 'lucide-react';
import { useDriverStore } from '@/stores/driverStore';
import { merchantAPI, Merchant } from '@/services/merchant';
import Link from 'next/link';

export default function MerchantSettingsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    store_name: '',
    description_en: '',
    address: '',
    phone: '',
    location_lat: 0,
    location_lng: 0,
  });

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/merchant/login');
      return;
    }
    setToken(storedToken);
    loadMerchant(storedToken);
  }, [router]);

  const loadMerchant = async (token: string) => {
    try {
      const data = await merchantAPI.getProfile(token);
      setMerchant(data);
      setFormData({
        store_name: data.store_name,
        description_en: data.description_en,
        address: data.address,
        phone: data.phone,
        location_lat: data.location_lat,
        location_lng: data.location_lng,
      });
    } catch (error) {
      console.error('Failed to load merchant:', error);
    }
  };

  const handleSave = async () => {
    if (!token) return;
    try {
      setIsSaving(true);
      await merchantAPI.updateProfile(token, formData);
      setIsEditing(false);
      loadMerchant(token);
    } catch (error) {
      console.error('Failed to save merchant:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 pb-20">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Settings className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Store Settings</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Store Info Card */}
        <div className="bg-slate-700 rounded-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <Store className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{merchant.store_name}</h2>
                <p className="text-slate-400">{merchant.slug}</p>
                {merchant.is_verified && <p className="text-green-400 text-sm">✓ Verified</p>}
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-[#6cd4ff] hover:text-blue-300 px-4 py-2 border border-blue-400 rounded-lg transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-600 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Rating</p>
              <p className="text-2xl font-bold text-yellow-400">{merchant.rating.toFixed(1)}</p>
            </div>
            <div className="bg-slate-600 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Status</p>
              <p className={`text-lg font-bold ${merchant.is_active ? 'text-green-400' : 'text-red-400'}`}>
                {merchant.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="bg-slate-700 rounded-lg p-6 mb-6 space-y-4">
            <h3 className="font-bold text-white text-lg">Edit Store Information</h3>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Store Name</label>
              <input
                type="text"
                value={formData.store_name}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                className="w-full bg-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Description</label>
              <textarea
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                rows={4}
                className="w-full bg-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.location_lat}
                  onChange={(e) => setFormData({ ...formData, location_lat: parseFloat(e.target.value) })}
                  className="w-full bg-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.location_lng}
                  onChange={(e) => setFormData({ ...formData, location_lng: parseFloat(e.target.value) })}
                  className="w-full bg-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-[#5bc0e8] transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Display Info */}
        {!isEditing && (
          <div className="space-y-4">
            {/* Description */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="font-bold text-white mb-2">Description</h3>
              <p className="text-slate-300">{merchant.description_en || 'No description'}</p>
            </div>

            {/* Location */}
            <div className="bg-slate-700 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-[#6cd4ff] mt-1" />
                <div>
                  <p className="font-bold text-white">{merchant.address}</p>
                  <p className="text-sm text-slate-400">
                    {merchant.location_lat.toFixed(4)}, {merchant.location_lng.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-green-400" />
                <a href={`tel:${merchant.phone}`} className="text-white hover:text-[#6cd4ff]">
                  {merchant.phone}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 mt-8">
          <h3 className="font-bold text-red-400 mb-4">Danger Zone</h3>
          <button className="text-red-400 hover:text-red-300 text-sm">
            Deactivate Store
          </button>
        </div>

        {/* Back Button */}
        <Link href="/merchant" className="inline-block mt-8 text-[#6cd4ff] hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
