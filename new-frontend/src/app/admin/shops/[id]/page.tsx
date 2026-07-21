"use client";
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader, Upload, Trash2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import api from '@/services/api';
import { useParams } from 'next/navigation';

interface Shop {
  id: number;
  business_name: string;
  full_name: string;
  shop_description?: string;
  shop_page_banner?: string;
  shop_detail_banner?: string;
  is_featured: boolean;
  is_verified: boolean;
  free_delivery: boolean;
  is_active: boolean;
  email: string;
}

export default function EditShopPage() {
  const params = useParams();
  const shopId = params.id as string;

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    business_name: '',
    shop_description: '',
    shop_page_banner: null as File | null,
    shop_detail_banner: null as File | null,
    is_featured: false,
    is_verified: false,
    free_delivery: false,
    is_active: true,
  });

  const [previews, setPreviews] = useState({
    shop_page_banner: '',
    shop_detail_banner: '',
  });

  useEffect(() => {
    loadShop();
  }, [shopId]);

  const loadShop = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/shops/${shopId}`);
      setShop(response.data);
      setFormData({
        business_name: response.data.business_name || '',
        shop_description: response.data.shop_description || '',
        shop_page_banner: null,
        shop_detail_banner: null,
        is_featured: response.data.is_featured,
        is_verified: response.data.is_verified,
        free_delivery: response.data.free_delivery,
        is_active: response.data.is_active,
      });
      setPreviews({
        shop_page_banner: response.data.shop_page_banner || '',
        shop_detail_banner: response.data.shop_detail_banner || '',
      });
    } catch (error: any) {
      console.error('Error loading shop:', error);
      if (error.response?.status === 401) {
        alert('⚠️ Admin access required! Please log in as an administrator.');
      } else if (error.response?.status === 403) {
        alert('⚠️ Permission denied! Only superadmins can edit shops.');
      } else if (error.response?.status === 404) {
        alert(' Shop not found!');
      } else {
        alert('Failed to load shop details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, bannerType: 'shop_page_banner' | 'shop_detail_banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only JPG, PNG, and WEBP files are allowed');
      return;
    }

    setFormData({ ...formData, [bannerType]: file });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews({ ...previews, [bannerType]: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleToggle = (field: keyof typeof formData) => {
    setFormData({ ...formData, [field]: !formData[field] });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Upload banners to Cloudinary first if they're files
      if (formData.shop_page_banner) {
        await uploadBannerToCloudinary(formData.shop_page_banner, 'shop_page_banner');
      }
      if (formData.shop_detail_banner) {
        await uploadBannerToCloudinary(formData.shop_detail_banner, 'shop_detail_banner');
      }

      // Prepare update data (without banners since they're uploaded separately)
      const updateData: any = {
        business_name: formData.business_name,
        shop_description: formData.shop_description,
        is_featured: formData.is_featured,
        is_verified: formData.is_verified,
        free_delivery: formData.free_delivery,
        is_active: formData.is_active,
      };

      await submitUpdate(updateData);
    } catch (error) {
      console.error('Error saving shop:', error);
      alert('Failed to save shop details');
      setSaving(false);
    }
  };

  // Compress image before upload
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if larger than 1920x1080
          if (width > 1920 || height > 1080) {
            const ratio = Math.min(1920 / width, 1080 / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob || ''], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            0.8
          );
        };
      };
    });
  };

  const uploadBannerToCloudinary = async (
    file: File,
    bannerType: 'shop_page_banner' | 'shop_detail_banner',
    retries = 3
  ) => {
    let lastError: any;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(
          `📤 Uploading ${bannerType} to Cloudinary... (attempt ${attempt}/${retries})`
        );

        // Compress image before upload
        const compressedFile = await compressImage(file);
        console.log(
          `Image compressed: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`
        );

        const uploadFormData = new FormData();
        uploadFormData.append('file', compressedFile);

        const response = await api.post(
          `/admin/shops/${shopId}/banners/upload?banner_type=${bannerType}`,
          uploadFormData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000, // 30 second timeout (increased from 15s)
          }
        );

        console.log(` ${bannerType} uploaded successfully:`, response.data.url);
        setPreviews({ ...previews, [bannerType]: response.data.url });
        return;
      } catch (error: any) {
        lastError = error;
        console.warn(
          `⚠️ Attempt ${attempt} failed for ${bannerType}:`,
          error.message
        );

        // Wait before retrying (exponential backoff)
        if (attempt < retries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`Retrying in ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    // All retries failed
    throw new Error(
      `Failed to upload ${bannerType} after ${retries} attempts: ${lastError.response?.data?.detail || lastError.message}`
    );
  };

  const submitUpdate = async (data: any) => {
    try {
      console.log('📤 Submitting shop details update...', data);
      const response = await api.put(`/admin/shops/${shopId}`, data);
      console.log('✅ Update successful:', response.data);
      alert('Shop details updated successfully');
      loadShop();
    } catch (error: any) {
      console.error('Error saving:', error);

      let errorMsg = 'Failed to save shop details';
      if (error.code === 'ECONNABORTED') {
        errorMsg = 'Request timeout - please try again.';
      } else if (error.response?.data?.detail) {
        errorMsg = error.response.data.detail;
      } else if (error.message) {
        errorMsg = error.message;
      }

      alert(`Failed to save shop details: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = async (bannerType: 'shop_page_banner' | 'shop_detail_banner') => {
    if (!confirm(`Delete ${bannerType === 'shop_page_banner' ? 'card' : 'detail'} banner?`)) return;

    try {
      await api.delete(`/admin/shops/${shopId}/banner/${bannerType === 'shop_page_banner' ? 'shop_page' : 'shop_detail'}`);
      setPreviews({ ...previews, [bannerType]: '' });
      alert('Banner deleted successfully');
      loadShop();
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Failed to delete banner');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-[#5bc0e8]" size={32} />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop not found</h2>
          <Link href="/admin/shops">
            <button className="text-[#5bc0e8] hover:underline">Back to Shops</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/shops">
            <button className="p-2 hover:bg-gray-200 rounded">
              <ArrowLeft size={24} />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Shop</h1>
            <p className="text-gray-600 mt-1">{shop.business_name}</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-8 space-y-8">
          {/* Basic Information */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Name *
                </label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleInputChange}
                  placeholder="Enter shop name"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Description
                </label>
                <textarea
                  name="shop_description"
                  value={formData.shop_description}
                  onChange={handleInputChange}
                  placeholder="Enter shop description"
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">Shown on shop detail page</p>
              </div>
            </div>
          </section>

          {/* Shop Card Banner */}
          <section className="border-t pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Shop Card Banner</h2>
            <p className="text-sm text-gray-600 mb-4">Used on /shops page. Recommended: 1200 × 700 px (16:9)</p>

            {previews.shop_page_banner && (
              <div className="mb-6">
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={previews.shop_page_banner}
                    alt="Shop card banner preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleDeleteBanner('shop_page_banner')}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileChange(e, 'shop_page_banner')}
                className="hidden"
                id="shop-page-banner-input"
              />
              <label htmlFor="shop-page-banner-input" className="cursor-pointer">
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="font-medium text-gray-900">Drag and drop or click to upload</p>
                <p className="text-sm text-gray-500 mt-1">JPG, PNG, or WEBP (Max 5MB)</p>
              </label>
            </div>
          </section>

          {/* Shop Detail Banner */}
          <section className="border-t pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Shop Detail Banner</h2>
            <p className="text-sm text-gray-600 mb-4">Used on shop detail page. Recommended: 1920 × 500 px (4:1)</p>

            {previews.shop_detail_banner && (
              <div className="mb-6">
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={previews.shop_detail_banner}
                    alt="Shop detail banner preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleDeleteBanner('shop_detail_banner')}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileChange(e, 'shop_detail_banner')}
                className="hidden"
                id="shop-detail-banner-input"
              />
              <label htmlFor="shop-detail-banner-input" className="cursor-pointer">
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="font-medium text-gray-900">Drag and drop or click to upload</p>
                <p className="text-sm text-gray-500 mt-1">JPG, PNG, or WEBP (Max 5MB)</p>
              </label>
            </div>
          </section>

          {/* Shop Settings */}
          <section className="border-t pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Shop Settings</h2>
            <div className="space-y-4">
              {[
                { key: 'is_active' as const, label: 'Active Shop', desc: 'Shop is visible to customers' },
                { key: 'is_verified' as const, label: 'Verified Shop', desc: 'Show verification badge' },
                { key: 'is_featured' as const, label: 'Featured Shop', desc: 'Show in featured section' },
                { key: 'free_delivery' as const, label: 'Free Delivery', desc: 'Show free delivery badge' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(key)}
                    className={`relative w-14 h-8 rounded-full transition ${
                      formData[key] ? 'bg-[#02CCFE]' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition ${
                      formData[key] ? 'translate-x-6' : ''
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Save Button */}
          <div className="border-t pt-8 flex justify-end gap-4">
            <Link href="/admin/shops">
              <button className="px-6 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-[#5bc0e8] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
