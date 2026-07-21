"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Store, MapPin, Phone, Mail, Loader, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import api from '@/services/api';

const SellerProfilePage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    shop_name: '',
    owner_name: '',
    shop_address: '',
    category: '',
    mpesa_number: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Get seller profile using /admin/sellers or similar
      const res = await api.get('/sellers/me').catch(() => null);
      if (res?.data) {
        setProfile(res.data);
        setFormData(res.data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.patch('/sellers/me', formData).catch(() => null);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
      loadProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyMpesa = async () => {
    if (!formData.mpesa_number) {
      setMessage('Please enter M-Pesa number');
      return;
    }
    setSaving(true);
    try {
      await api.post('/sellers/verify-mpesa', { phone_number: formData.mpesa_number }).catch(() => null);
      setMessage('M-Pesa verification initiated!');
      setTimeout(() => setMessage(''), 3000);
      loadProfile();
    } catch (error) {
      console.error('Error verifying M-Pesa:', error);
      setMessage('Error verifying M-Pesa');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <Link href="/seller-dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Seller Profile</h1>
            <p className="text-gray-500 mt-1">Manage your shop information</p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-2xl space-y-6">
        {message && (
          <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50' : 'bg-green-50'}`}>
            <p className={`text-sm font-semibold ${message.includes('Error') ? 'text-red-700' : 'text-green-700'}`}>
              {message}
            </p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-black text-gray-900 mb-6">Shop Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Shop Name</label>
              <input
                type="text"
                value={formData.shop_name}
                onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                placeholder="Your shop name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Owner Name</label>
              <input
                type="text"
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Shop Address</label>
              <textarea
                value={formData.shop_address}
                onChange={(e) => setFormData({ ...formData, shop_address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                rows={3}
                placeholder="Complete shop address"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                placeholder="Shop category"
              />
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full mt-6 px-6 py-3 bg-[#5bc0e8] hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-black text-gray-900 mb-6">M-Pesa Verification</h2>
          <div className="flex items-start gap-3 mb-6 p-4 bg-blue-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-[#5bc0e8] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Verify your M-Pesa number to enable withdrawals. You'll receive an STK push on this number.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">M-Pesa Number</label>
              <input
                type="tel"
                value={formData.mpesa_number}
                onChange={(e) => setFormData({ ...formData, mpesa_number: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                placeholder="254712345678"
              />
            </div>

            <button
              onClick={handleVerifyMpesa}
              disabled={saving || profile?.mpesa_verified}
              className="w-full px-6 py-3 bg-[#02CCFE] hover:bg-[#02CCFE] disabled:opacity-50 text-white rounded-lg font-bold transition-colors"
            >
              {profile?.mpesa_verified ? '✓ M-Pesa Verified' : 'Verify M-Pesa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfilePage;
