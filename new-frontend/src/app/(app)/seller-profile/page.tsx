'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Upload, Pencil, Check, X } from 'lucide-react';
import api from '@/services/api';

interface SellerProfile {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  business_name: string;
  shop_description: string;
  avatar_url: string;
  logo_url: string;
  location: string;
  trust_level: string;
  trust_score: number;
  is_verified: boolean;
  created_at: string;
}

interface EditingField {
  [key: string]: boolean;
}

interface FormData {
  full_name: string;
  phone: string;
  business_name: string;
  location: string;
  market: string;
  shop_description: string;
}

export default function SellerProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingField>({});
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    phone: '',
    business_name: '',
    location: '',
    market: '',
    shop_description: '',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/sellers/me');
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        business_name: data.business_name || '',
        location: data.location || '',
        market: data.market || 'Eastleigh Market',
        shop_description: data.shop_description || '',
      });
      if (data.logo_url) {
        setLogoPreview(data.logo_url);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
        return;
      }
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field: string) => {
    setEditing(prev => ({ ...prev, [field]: true }));
  };

  const handleCancel = (field: string) => {
    setEditing(prev => ({ ...prev, [field]: false }));
    if (profile) {
      setFormData(prev => ({
        ...prev,
        [field]: profile[field as keyof SellerProfile] || '',
      }));
    }
  };

  const handleSave = async (field: string) => {
    try {
      const updateData: Partial<FormData> = {};
      updateData[field as keyof FormData] = formData[field as keyof FormData];

      await api.put('/sellers/me', updateData);

      setEditing(prev => ({ ...prev, [field]: false }));
      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploadingLogo(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);

      await api.post('/users/me/avatar', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Profile not found'}</p>
          <button
            onClick={() => router.push('/shops')}
            className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
          >
            Back to Shops
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/shops')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {profile.business_name || profile.full_name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 text-xs font-semibold rounded-full">
                    SELLER
                  </span>
                  {profile.is_verified && (
                    <span className="text-green-600 dark:text-green-400 text-sm font-medium">✓ Verified</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Logo Section */}
          <div className="relative w-28 h-28">
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-900 dark:to-sky-800 overflow-hidden border-2 border-sky-200 dark:border-sky-700 flex items-center justify-center">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Shop Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-sky-400 text-3xl font-bold">
                  {profile.business_name?.[0] || profile.full_name?.[0]}
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-orange-500 hover:bg-orange-600 rounded-full cursor-pointer shadow-lg transition transform hover:scale-110">
              <Upload className="w-4 h-4 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Personal Information
              </h3>
              {!editing.full_name && !editing.phone && (
                <button
                  onClick={() => {
                    setEditing(prev => ({ ...prev, full_name: true }));
                  }}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  <Pencil className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              )}
            </div>

            {editing.full_name || editing.phone ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      handleSave('full_name');
                      handleSave('phone');
                      setEditing(prev => ({ ...prev, full_name: false, phone: false }));
                    }}
                    className="flex-1 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      handleCancel('full_name');
                      handleCancel('phone');
                      setEditing(prev => ({ ...prev, full_name: false, phone: false }));
                    }}
                    className="flex-1 px-4 py-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Full Name</p>
                  <p className="text-slate-900 dark:text-white font-medium">{formData.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Phone</p>
                  <p className="text-slate-900 dark:text-white font-medium">{formData.phone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Shop Information */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Shop Information
              </h3>
              {!editing.business_name && !editing.market && (
                <button
                  onClick={() => {
                    setEditing(prev => ({ ...prev, business_name: true }));
                  }}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  <Pencil className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              )}
            </div>

            {editing.business_name || editing.market ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Shop Name
                  </label>
                  <input
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Market
                  </label>
                  <input
                    type="text"
                    value={formData.market}
                    onChange={(e) => setFormData(prev => ({ ...prev, market: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      handleSave('business_name');
                      handleSave('market');
                      setEditing(prev => ({ ...prev, business_name: false, market: false }));
                    }}
                    className="flex-1 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      handleCancel('business_name');
                      handleCancel('market');
                      setEditing(prev => ({ ...prev, business_name: false, market: false }));
                    }}
                    className="flex-1 px-4 py-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Shop Name</p>
                  <p className="text-slate-900 dark:text-white font-medium">{formData.business_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Market</p>
                  <p className="text-slate-900 dark:text-white font-medium">{formData.market}</p>
                </div>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Location
              </h3>
              {!editing.location && (
                <button
                  onClick={() => setEditing(prev => ({ ...prev, location: true }))}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  <Pencil className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              )}
            </div>

            {editing.location ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    City / Region
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      handleSave('location');
                      setEditing(prev => ({ ...prev, location: false }));
                    }}
                    className="flex-1 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      handleCancel('location');
                      setEditing(prev => ({ ...prev, location: false }));
                    }}
                    className="flex-1 px-4 py-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-900 dark:text-white font-medium">{formData.location}</p>
            )}
          </div>

          {/* Description */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Description
              </h3>
              {!editing.shop_description && (
                <button
                  onClick={() => setEditing(prev => ({ ...prev, shop_description: true }))}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  <Pencil className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              )}
            </div>

            {editing.shop_description ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Shop Description
                  </label>
                  <textarea
                    value={formData.shop_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, shop_description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      handleSave('shop_description');
                      setEditing(prev => ({ ...prev, shop_description: false }));
                    }}
                    className="flex-1 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      handleCancel('shop_description');
                      setEditing(prev => ({ ...prev, shop_description: false }));
                    }}
                    className="flex-1 px-4 py-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-900 dark:text-white whitespace-pre-wrap">
                {formData.shop_description || 'No description yet'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
