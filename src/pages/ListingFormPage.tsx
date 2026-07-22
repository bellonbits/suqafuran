import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Upload, X } from 'lucide-react';
import api from '@/services/api';
import ListingAttributeForm from '@/components/ListingAttributeForm';
import StepIndicator from '@/components/StepIndicator';

interface Category {
  id: number;
  name_en: string;
  slug: string;
  icon?: string;
}

interface Subcategory {
  id: number;
  name_en: string;
  slug: string;
  category_id: number;
}

type Step = 'shop' | 'category' | 'subcategory' | 'details' | 'media' | 'attributes' | 'pricing' | 'preview' | 'publish';

interface FormState {
  shop_id?: string;
  title_en: string;
  title_so: string;
  description_en: string;
  description_so: string;
  price: string;
  location: string;
  condition: string;
  category_id: string;
  subcategory_id: string;
  price_type: 'fixed' | 'negotiable' | 'contact';
  status: 'draft' | 'active';
  is_negotiable: boolean;
  tags: string[];
}

const steps = [
  { key: 'shop', number: '01', title: 'Shop' },
  { key: 'category', number: '02', title: 'Category' },
  { key: 'subcategory', number: '03', title: 'Subcategory' },
  { key: 'details', number: '04', title: 'Details' },
  { key: 'media', number: '05', title: 'Media' },
  { key: 'attributes', number: '06', title: 'Attributes' },
  { key: 'pricing', number: '07', title: 'Pricing' },
  { key: 'preview', number: '08', title: 'Preview' },
  { key: 'publish', number: '09', title: 'Publish' },
];

const ListingFormPage: React.FC = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!listingId;

  const [step, setStep] = useState<Step>('shop');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<FormState>({
    title_en: '',
    title_so: '',
    description_en: '',
    description_so: '',
    price: '',
    location: '',
    condition: 'good',
    category_id: '',
    subcategory_id: '',
    price_type: 'fixed',
    status: 'active',
    is_negotiable: false,
    tags: [],
  });

  const [attributes, setAttributes] = useState<Record<string, string | string[]>>({});
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Load categories and listing (if editing)
  useEffect(() => {
    const loadData = async () => {
      try {
        const catResponse = await api.get('/listings/categories');
        setCategories(catResponse.data);

        if (isEditing) {
          const listingResponse = await api.get(`/listings/${listingId}`);
          const listing = listingResponse.data;

          setFormData({
            shop_id: listing.shop_id?.toString(),
            title_en: listing.title_en || '',
            title_so: listing.title_so || '',
            description_en: listing.description_en || '',
            description_so: listing.description_so || '',
            price: listing.price.toString(),
            location: listing.location,
            condition: listing.condition,
            category_id: listing.category_id.toString(),
            subcategory_id: listing.subcategory_id?.toString() || '',
            price_type: listing.is_negotiable ? 'negotiable' : 'fixed',
            status: listing.status,
            is_negotiable: listing.is_negotiable,
            tags: listing.tags || [],
          });
          setImages(listing.images || []);
          setAttributes(listing.attributes || {});
        }
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      }
    };

    loadData();
  }, [isEditing, listingId]);

  // Load subcategories when category changes
  useEffect(() => {
    if (!formData.category_id) {
      setSubcategories([]);
      return;
    }

    const fetchSubcategories = async () => {
      try {
        const response = await api.get(`/subcategories?category_id=${formData.category_id}`);
        setSubcategories(response.data);
      } catch (err) {
        console.error('Failed to load subcategories:', err);
      }
    };

    fetchSubcategories();
  }, [formData.category_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingImages(true);
    try {
      const uploadedImages = [];

      for (let i = 0; i < Math.min(files.length, 10 - images.length); i++) {
        const formDataImg = new FormData();
        formDataImg.append('file', files[i]);

        const response = await api.post('/listings/upload', formDataImg, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedImages.push(response.data.url);
      }

      setImages((prev) => [...prev, ...uploadedImages]);
    } catch (err) {
      setError('Failed to upload images');
      console.error(err);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && formData.tags.length < 5) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleNextStep = () => {
    setError('');

    const stepValidation = {
      shop: () => !!formData.shop_id,
      category: () => !!formData.category_id,
      subcategory: () => !!formData.subcategory_id,
      details: () => formData.title_en && formData.description_en && formData.location,
      media: () => images.length > 0,
      attributes: () => true,
      pricing: () => formData.price && formData.price_type,
      preview: () => true,
      publish: () => true,
    };

    if (!stepValidation[step]?.()) {
      setError('Please complete this step before proceeding');
      return;
    }

    const stepOrder: Step[] = ['shop', 'category', 'subcategory', 'details', 'media', 'attributes', 'pricing', 'preview', 'publish'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  };

  const handlePrevStep = () => {
    const stepOrder: Step[] = ['shop', 'category', 'subcategory', 'details', 'media', 'attributes', 'pricing', 'preview', 'publish'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        category_id: parseInt(formData.category_id),
        subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : null,
        images,
        attributes,
      };

      if (isEditing) {
        await api.put(`/listings/${listingId}`, payload);
        setSuccess('Listing updated successfully!');
      } else {
        const response = await api.post('/listings', payload);
        setSuccess('Listing created successfully!');
        setTimeout(() => {
          navigate(`/listings/${response.data.id}`);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save listing');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-6"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? 'Edit Listing' : 'Create New Listing'}
          </h1>
          <p className="text-gray-600">Step {stepOrder.indexOf(step) + 1} of 9</p>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <StepIndicator steps={steps} currentStep={step} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Shop Selection */}
            {step === 'shop' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Shop</h2>
                  <p className="text-gray-600">Choose which shop this listing belongs to</p>
                </div>
                <select
                  name="shop_id"
                  value={formData.shop_id || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a shop</option>
                  <option value="1">My Shop</option>
                </select>
              </div>
            )}

            {/* Step 2: Category Selection */}
            {step === 'category' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Category</h2>
                  <p className="text-gray-600">What category does your item belong to?</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          category_id: cat.id.toString(),
                          subcategory_id: '',
                        }));
                      }}
                      className={`p-4 rounded-lg border-2 text-left transition ${
                        formData.category_id === cat.id.toString()
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{cat.name_en}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Subcategory Selection */}
            {step === 'subcategory' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Subcategory</h2>
                  <p className="text-gray-600">Narrow down your listing category</p>
                </div>
                {subcategories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subcategories.map((subcat) => (
                      <button
                        key={subcat.id}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            subcategory_id: subcat.id.toString(),
                          }));
                        }}
                        className={`p-4 rounded-lg border-2 text-left transition ${
                          formData.subcategory_id === subcat.id.toString()
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-semibold text-gray-900">{subcat.name_en}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Please select a category first</p>
                )}
              </div>
            )}

            {/* Step 4: Product Details */}
            {step === 'details' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Details</h2>
                  <p className="text-gray-600">Enter the details about your product</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Title (English) *
                  </label>
                  <input
                    type="text"
                    name="title_en"
                    value={formData.title_en}
                    onChange={handleInputChange}
                    placeholder="e.g., iPhone 14 Pro Max"
                    maxLength={120}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
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
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Description (English) *
                  </label>
                  <textarea
                    name="description_en"
                    value={formData.description_en}
                    onChange={handleInputChange}
                    placeholder="Describe your product in detail..."
                    rows={5}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Condition
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="new">New</option>
                    <option value="like_new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City, Region"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Media Upload */}
            {step === 'media' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Images</h2>
                  <p className="text-gray-600">Add up to 10 images of your product</p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
                  <Upload className="mx-auto mb-4 text-gray-400" size={32} />
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImages || images.length >= 10}
                    className="w-full"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    {uploadingImages ? 'Uploading...' : 'Click to upload or drag and drop'}
                  </p>
                </div>

                {/* Image Preview */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500">{images.length}/10 images uploaded</p>
              </div>
            )}

            {/* Step 6: Attributes */}
            {step === 'attributes' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Attributes</h2>
                  <p className="text-gray-600">Fill in specific details about your product</p>
                </div>

                {formData.category_id && (
                  <ListingAttributeForm
                    categoryId={parseInt(formData.category_id)}
                    subcategoryId={formData.subcategory_id ? parseInt(formData.subcategory_id) : undefined}
                    onAttributesChange={setAttributes}
                    initialValues={attributes}
                  />
                )}
              </div>
            )}

            {/* Step 7: Pricing */}
            {step === 'pricing' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Pricing</h2>
                  <p className="text-gray-600">Set the price for your product</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
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
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Price Type *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="price_type"
                        value="fixed"
                        checked={formData.price_type === 'fixed'}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <span className="ml-2">Fixed Price</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="price_type"
                        value="negotiable"
                        checked={formData.price_type === 'negotiable'}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <span className="ml-2">Negotiable</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="price_type"
                        value="contact"
                        checked={formData.price_type === 'contact'}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <span className="ml-2">Contact Seller</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Tags (up to 5)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Add a tag and press Enter"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={formData.tags.length >= 5}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      disabled={formData.tags.length >= 5}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(idx)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 8: Preview */}
            {step === 'preview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Preview Listing</h2>
                  <p className="text-gray-600">Review your listing before publishing</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Images */}
                  {images.length > 0 && (
                    <div>
                      <img
                        src={images[0]}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Details */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-600 text-sm">Title</p>
                      <p className="text-xl font-bold text-gray-900">{formData.title_en}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Price</p>
                      <p className="text-2xl font-bold text-blue-600">${parseFloat(formData.price).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Location</p>
                      <p className="text-gray-900">{formData.location}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Condition</p>
                      <p className="capitalize text-gray-900">{formData.condition}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Price Type</p>
                      <p className="capitalize text-gray-900">{formData.price_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-gray-600 text-sm mb-2">Description</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{formData.description_en}</p>
                </div>

                {formData.tags.length > 0 && (
                  <div>
                    <p className="text-gray-600 text-sm mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, idx) => (
                        <span key={idx} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 9: Publish */}
            {step === 'publish' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Publish?</h2>
                  <p className="text-gray-600">Your listing is ready to go live!</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <p className="text-green-900">
                    ✓ All required fields are complete. Your listing will be visible to buyers immediately after publishing.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.status === 'active'}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.checked ? 'active' : 'draft',
                        }));
                      }}
                      className="w-4 h-4"
                    />
                    <span className="ml-2">Publish immediately (make listing active)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-12 pt-8 border-t">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={step === 'shop'}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                <ChevronLeft size={18} />
                Back
              </button>

              {step === 'publish' ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                  {loading ? 'Publishing...' : isEditing ? 'Update Listing' : 'Publish Listing'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const stepOrder: Step[] = ['shop', 'category', 'subcategory', 'details', 'media', 'attributes', 'pricing', 'preview', 'publish'];

export default ListingFormPage;
