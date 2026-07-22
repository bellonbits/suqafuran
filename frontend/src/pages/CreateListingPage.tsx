import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import ListingAttributeForm from '@/components/ListingAttributeForm';

interface Category {
  id: number;
  name_en: string;
  name_so: string;
  slug: string;
}

interface Subcategory {
  id: number;
  name_en: string;
  name_so: string;
  slug: string;
}

const CreateListingPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title_en: '',
    title_so: '',
    description_en: '',
    description_so: '',
    price: '',
    location: '',
    condition: 'used',
    category_id: '',
    subcategory_id: '',
    images: [] as string[],
    is_negotiable: false,
  });

  const [attributes, setAttributes] = useState<Record<string, string | string[]>>({});

  // Load categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/listings/categories');
        setCategories(response.data);
      } catch (err) {
        setError('Failed to load categories');
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    if (!formData.category_id) {
      setSubcategories([]);
      return;
    }

    const fetchSubcategories = async () => {
      try {
        const category = categories.find((c) => c.id === parseInt(formData.category_id));
        if (!category) return;

        // Filter subcategories by category_id from the full list
        // In a real app, you'd have a dedicated endpoint
        setSubcategories([]);
        // Placeholder - replace with actual API call if needed
      } catch (err) {
        console.error('Failed to load subcategories:', err);
      }
    };

    fetchSubcategories();
  }, [formData.category_id, categories]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAttributesChange = (attrs: Record<string, string | string[]>) => {
    setAttributes(attrs);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setLoading(true);
    try {
      const uploadedImages = [];

      for (let i = 0; i < Math.min(files.length, 10); i++) {
        const formDataImg = new FormData();
        formDataImg.append('file', files[i]);

        const response = await api.post('/listings/upload', formDataImg, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        uploadedImages.push(response.data.url);
      }

      setFormData((prev) => ({
        ...prev,
        images: uploadedImages,
      }));
    } catch (err) {
      setError('Failed to upload images');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (
        !formData.title_en ||
        !formData.price ||
        !formData.location ||
        !formData.category_id
      ) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Create listing payload
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        category_id: parseInt(formData.category_id),
        subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : null,
        attributes,
      };

      const response = await api.post('/listings', payload);

      setSuccess('Listing created successfully!');
      setFormData({
        title_en: '',
        title_so: '',
        description_en: '',
        description_so: '',
        price: '',
        location: '',
        condition: 'used',
        category_id: '',
        subcategory_id: '',
        images: [],
        is_negotiable: false,
      });
      setAttributes({});

      // Redirect to listing
      setTimeout(() => {
        window.location.href = `/listings/${response.data.id}`;
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create listing');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold mb-8">Create New Listing</h1>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Category Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category *
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                {subcategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Subcategory
                    </label>
                    <select
                      name="subcategory_id"
                      value={formData.subcategory_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a subcategory</option>
                      {subcategories.map((subcat) => (
                        <option key={subcat.id} value={subcat.id}>
                          {subcat.name_en}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Title (English) *
                </label>
                <input
                  type="text"
                  name="title_en"
                  value={formData.title_en}
                  onChange={handleInputChange}
                  placeholder="e.g., iPhone 14 Pro Max, Brand New"
                  maxLength={120}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Title (Somali)
                </label>
                <input
                  type="text"
                  name="title_so"
                  value={formData.title_so}
                  onChange={handleInputChange}
                  maxLength={120}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description (English) *
                </label>
                <textarea
                  name="description_en"
                  value={formData.description_en}
                  onChange={handleInputChange}
                  placeholder="Describe your item in detail..."
                  rows={5}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Price & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Price (USD) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City, State/Region"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload Images (up to 10)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={loading}
                    className="w-full"
                  />
                  {formData.images.length > 0 && (
                    <p className="mt-2 text-sm text-green-600">
                      {formData.images.length} image(s) uploaded
                    </p>
                  )}
                </div>
              </div>

              {/* Dynamic Attributes Form */}
              {formData.category_id && (
                <div className="border-t pt-8">
                  <ListingAttributeForm
                    categoryId={parseInt(formData.category_id)}
                    subcategoryId={
                      formData.subcategory_id
                        ? parseInt(formData.subcategory_id)
                        : undefined
                    }
                    onAttributesChange={handleAttributesChange}
                  />
                </div>
              )}

              {/* Negotiable Checkbox */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_negotiable"
                    checked={formData.is_negotiable}
                    onChange={handleInputChange}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2">Price is negotiable</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Listing...' : 'Create Listing'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateListingPage;
