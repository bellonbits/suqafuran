"use client";

import React, { useState, useEffect } from 'react';
import { Save, Loader } from 'lucide-react';
import api from '@/services/api';

export default function ShopPage() {
  const [shopData, setShopData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadShopData();
  }, []);

  const loadShopData = async () => {
    try {
      const res = await api.get('/seller/profile').catch(() => null);

      if (res?.data) {
        setShopData({
          name: res.data.shop_name || '',
          description: res.data.description || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
        });
      }
    } catch (error) {
      console.error('Error loading shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/seller/profile', {
        shop_name: shopData.name,
        description: shopData.description,
        phone: shopData.phone,
        email: shopData.email,
      });
      alert('Shop information updated successfully!');
    } catch (error) {
      console.error('Error saving shop data:', error);
      alert('Failed to save shop information');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-orange-600" />
          <p className="text-gray-500 text-sm">Loading shop information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Shop Management</h1>
        <p className="text-gray-600 dark:text-slate-400">Manage your shop information and branding</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Shop Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Shop Name</label>
            <input
              type="text"
              value={shopData.name}
              onChange={(e) => setShopData({...shopData, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</label>
            <textarea
              value={shopData.description}
              onChange={(e) => setShopData({...shopData, description: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Phone</label>
              <input
                type="tel"
                value={shopData.phone}
                onChange={(e) => setShopData({...shopData, phone: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Email</label>
              <input
                type="email"
                value={shopData.email}
                onChange={(e) => setShopData({...shopData, email: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2"
          >
            {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
