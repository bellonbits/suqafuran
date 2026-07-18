"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader, AlertCircle, X, Upload, ImageOff } from 'lucide-react';
import api from '@/services/api';
import { useParams, useRouter } from 'next/navigation';

interface Category {
  id: number;
  name_en: string;
  subcategories?: SubCategory[];
}

interface SubCategory {
  id: number;
  name_en: string;
  subsubcategories?: SubSubCategory[];
}

interface SubSubCategory {
  id: number;
  name_en: string;
}

interface EditListingPageProps {
  params: { id: string };
}

const EditListingPage = () => {
  const params = useParams();
  const router = useRouter();
  const listingId = params?.id as string;

  const [listing, setListing] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title_en: '',
    title_so: '',
    description_en: '',
    description_so: '',
    price: '',
    location: '',
    condition: 'good',
    status: 'active',
    currency: 'USD',
    category_id: '',
    subcategory_id: '',
    subsubcategory_id: '',
    is_negotiable: false,
    is_sold: false,
  });
  const [images, setImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (listingId) {
      loadListing();
      loadCategories();
    }
  }, [listingId]);

  const loadListing = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/listings/${listingId}`).catch(() => null);
      if (res?.data) {
        setListing(res.data);
        setImages(res.data.images || []);
        setFormData({
          title_en: res.data.title_en || '',
          title_so: res.data.title_so || '',
          description_en: res.data.description_en || '',
          description_so: res.data.description_so || '',
          price: res.data.price?.toString() || '',
          location: res.data.location || '',
          condition: res.data.condition || 'good',
          status: res.data.status || 'active',
          currency: res.data.currency || 'USD',
          category_id: res.data.category_id?.toString() || '',
          subcategory_id: res.data.subcategory_id?.toString() || '',
          subsubcategory_id: res.data.subsubcategory_id?.toString() || '',
          is_negotiable: res.data.is_negotiable || false,
          is_sold: res.data.is_sold || false,
        });
      }
    } catch (error) {
      console.error('Error loading listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/listings/categories');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        title_en: formData.title_en,
        title_so: formData.title_so,
        description_en: formData.description_en,
        description_so: formData.description_so,
        price: parseFloat(formData.price),
        location: formData.location,
        condition: formData.condition,
        status: formData.status,
        currency: formData.currency,
        category_id: parseInt(formData.category_id),
        subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : null,
        subsubcategory_id: formData.subsubcategory_id ? parseInt(formData.subsubcategory_id) : null,
        is_negotiable: formData.is_negotiable,
        is_sold: formData.is_sold,
      };

      await api.patch(`/listings/${listingId}`, updateData).catch(() => null);
      router.push('/admin-listings');
    } catch (error) {
      console.error('Error saving listing:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={40} />
          <p className="text-gray-600 dark:text-gray-400 mb-4">Listing not found</p>
          <Link href="/admin-listings" className="text-orange-500 hover:text-orange-600">
            Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <Link
          href="/admin-listings"
          className="flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6 font-medium"
        >
          <ChevronLeft size={20} />
          Back
        </Link>

        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Edit Listing</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Update your listing details</p>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 rounded-lg p-6">

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Title (English)
            </label>
            <input
              type="text"
              name="title_en"
              value={formData.title_en}
              onChange={handleInputChange}
              placeholder="Listing title"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {/* Title Somali */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Title (Somali)
            </label>
            <input
              type="text"
              name="title_so"
              value={formData.title_so}
              onChange={handleInputChange}
              placeholder="Listing title in Somali"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Description (English)
            </label>
            <textarea
              name="description_en"
              value={formData.description_en}
              onChange={handleInputChange}
              placeholder="Listing description"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Description Somali */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Description (Somali)
            </label>
            <textarea
              name="description_so"
              value={formData.description_so}
              onChange={handleInputChange}
              placeholder="Listing description in Somali"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Price and Currency */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Price
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="SOS">SOS</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City, region"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Category
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name_en}</option>
              ))}
            </select>
          </div>

          {/* Subcategory Selection */}
          {formData.category_id && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Sub-Category
              </label>
              <select
                name="subcategory_id"
                value={formData.subcategory_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select sub-category</option>
                {categories
                  .find(cat => cat.id.toString() === formData.category_id)
                  ?.subcategories?.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name_en}</option>
                  ))}
              </select>
            </div>
          )}

          {/* SubSubcategory Selection */}
          {formData.subcategory_id && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Sub-Sub-Category
              </label>
              <select
                name="subsubcategory_id"
                value={formData.subsubcategory_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select sub-sub-category</option>
                {categories
                  .find(cat => cat.id.toString() === formData.category_id)
                  ?.subcategories?.find(sub => sub.id.toString() === formData.subcategory_id)
                  ?.subsubcategories?.map(subsub => (
                    <option key={subsub.id} value={subsub.id}>{subsub.name_en}</option>
                  ))}
              </select>
            </div>
          )}

          {/* Condition */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Condition
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="new">New</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_negotiable"
                checked={formData.is_negotiable}
                onChange={handleInputChange}
                className="w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-gray-700 dark:text-gray-300">Price is negotiable</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_sold"
                checked={formData.is_sold}
                onChange={handleInputChange}
                className="w-5 h-5 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-gray-700 dark:text-gray-300">Mark as sold</span>
            </label>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Images
            </label>

            {/* Existing Images */}
            {images.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current images</p>
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      {brokenImages.has(img) ? (
                        <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <ImageOff size={24} className="text-gray-400" />
                        </div>
                      ) : (
                        <img
                          src={img}
                          alt={`Image ${idx}`}
                          className="w-full h-32 object-cover rounded-lg"
                          onError={() => setBrokenImages(prev => new Set([...prev, img]))}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images Preview */}
            {newImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">New images to upload</p>
                <div className="grid grid-cols-3 gap-3">
                  {newImages.map((file, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`New ${idx}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New */}
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-orange-500 transition-colors">
                <Upload className="mx-auto mb-2 text-gray-400" size={24} />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload images</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG up to 5MB each</p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* Seller Info */}
          {listing.owner && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Seller Information (Read-only)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Name</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{listing.owner.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{listing.owner.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Email</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{listing.owner.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Verified</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{listing.owner.is_verified ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader className="animate-spin" size={20} />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditListingPage;
