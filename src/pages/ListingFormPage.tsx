import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import ListingAttributeForm from '@/components/ListingAttributeForm';
import StepIndicator from '@/components/StepIndicator';

interface Category {
  id: number;
  name_en: string;
  slug: string;
}

interface Subcategory {
  id: number;
  name_en: string;
  slug: string;
  category_id: number;
}

type Step = 'details' | 'media' | 'template' | 'submit';

interface FormState {
  title_en: string;
  title_so: string;
  description_en: string;
  description_so: string;
  price: string;
  location: string;
  condition: string;
  category_id: string;
  subcategory_id: string;
  bedrooms?: string;
  bathrooms?: string;
  sqft?: string;
  carport?: string;
  is_negotiable: boolean;
}

const ListingFormPage: React.FC = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!listingId;

  const [step, setStep] = useState<Step>('details');
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
    is_negotiable: false,
  });

  const [attributes, setAttributes] = useState<Record<string, string | string[]>>({});
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

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
            title_en: listing.title_en || '',
            title_so: listing.title_so || '',
            description_en: listing.description_en || '',
            description_so: listing.description_so || '',
            price: listing.price.toString(),
            location: listing.location,
            condition: listing.condition,
            category_id: listing.category_id.toString(),
            subcategory_id: listing.subcategory_id?.toString() || '',
            is_negotiable: listing.is_negotiable,
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
    if (formData.category_id) {
      const cat = categories.find((c) => c.id === parseInt(formData.category_id));
      if (cat) {
        // Filter subcategories by category (would need API call in production)
        setSubcategories([]); // Placeholder
      }
    }
  }, [formData.category_id, categories]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
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
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNextStep = () => {
    setError('');

    if (step === 'details') {
      if (!formData.title_en || !formData.price || !formData.location || !formData.category_id) {
        setError('Please fill in all required fields');
        return;
      }
      setStep('media');
    } else if (step === 'media') {
      if (images.length === 0) {
        setError('Please upload at least one image');
        return;
      }
      setStep('template');
    } else if (step === 'template') {
      setStep('submit');
    }
  };

  const handlePrevStep = () => {
    if (step === 'media') setStep('details');
    else if (step === 'template') setStep('media');
    else if (step === 'submit') setStep('template');
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
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: 'details', number: '01', title: 'Detail Properties' },
    { key: 'media', number: '02', title: 'Properties Media' },
    { key: 'template', number: '03', title: 'Edit Template' },
    { key: 'submit', number: '04', title: 'Submit Listing' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Listing' : 'Create Listing'}
            </h1>
            <div className="text-sm text-gray-500">
              {isEditing ? 'Update your property details' : 'List your property today'}
            </div>
          </div>

          {/* Step Indicator */}
          <StepIndicator steps={steps} currentStep={step as any} />
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Detail Properties */}
            {step === 'details' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  Detail Properties
                </h2>
                <p className="text-gray-600">
                  Fill in the details below to move to the next step.
                </p>

                {/* Address Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Address
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Type Address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Category and Condition */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Category
                    </label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Choose category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name_en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Condition
                    </label>
                    <select
                      name="condition"
                      value={formData.condition}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="new">New</option>
                      <option value="like-new">Like New</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                    </select>
                  </div>
                </div>

                {/* Title and Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Title (English) *
                    </label>
                    <input
                      type="text"
                      name="title_en"
                      value={formData.title_en}
                      onChange={handleInputChange}
                      placeholder="Type Full Name"
                      maxLength={120}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Price (USD) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Description (English)
                  </label>
                  <textarea
                    name="description_en"
                    value={formData.description_en}
                    onChange={handleInputChange}
                    placeholder="Type any message"
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Negotiable */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_negotiable"
                    checked={formData.is_negotiable}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="ml-3 text-sm font-medium text-gray-900">
                    Price is negotiable
                  </label>
                </div>
              </div>
            )}

            {/* Step 2: Properties Media */}
            {step === 'media' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  Properties Media
                </h2>
                <p className="text-gray-600">
                  Upload high-quality images of your property.
                </p>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-4">
                    Upload Images (up to 10)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
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
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
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
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  {images.length}/10 images uploaded
                </p>
              </div>
            )}

            {/* Step 3: Edit Template */}
            {step === 'template' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  Edit Template
                </h2>
                <p className="text-gray-600">
                  Add specific details about your property.
                </p>

                {formData.category_id && (
                  <ListingAttributeForm
                    categoryId={parseInt(formData.category_id)}
                    subcategoryId={
                      formData.subcategory_id
                        ? parseInt(formData.subcategory_id)
                        : undefined
                    }
                    onAttributesChange={setAttributes}
                    initialValues={attributes}
                  />
                )}
              </div>
            )}

            {/* Step 4: Submit */}
            {step === 'submit' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  Review & Submit
                </h2>
                <p className="text-gray-600">
                  Review your listing before submitting.
                </p>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Title</p>
                      <p className="font-semibold text-gray-900">
                        {formData.title_en}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Price</p>
                      <p className="font-semibold text-gray-900">
                        ${parseFloat(formData.price).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Location</p>
                      <p className="font-semibold text-gray-900">
                        {formData.location}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Condition</p>
                      <p className="font-semibold text-gray-900">
                        {formData.condition}
                      </p>
                    </div>
                  </div>

                  <hr />

                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-2">
                      Images ({images.length})
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {images.slice(0, 4).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-12 pt-8 border-t">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={step === 'details'}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ← Back
              </button>

              {step === 'submit' ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                  {loading ? 'Submitting...' : isEditing ? 'Update Listing' : 'Publish Listing'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-8 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium flex items-center gap-2"
                >
                  Next →
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ListingFormPage;
