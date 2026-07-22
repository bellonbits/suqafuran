"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { ListingStep1Details } from './listing-wizard/Step1Details';
import { ListingStep2Category } from './listing-wizard/Step2Category';
import { ListingStep3Images } from './listing-wizard/Step3Images';
import { ListingStep4Review } from './listing-wizard/Step4Review';
import { listingsService } from '../../services/listings';
import { useRouter } from 'next/navigation';

export interface ListingFormData {
  // Step 1: Shop
  shop_id?: number;

  // Step 2: Category
  category_id: number;

  // Step 3: Subcategory
  subcategory_id?: number;
  subsubcategory_id?: number;

  // Step 4: Details
  title: string;
  description: string;
  location?: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';

  // Step 5: Images
  images: Array<{ url: string; filename: string }>;

  // Step 6: Attributes
  attributes?: Record<string, any>;

  // Step 7: Pricing
  price: number;
  negotiable: boolean;
  price_type: 'fixed' | 'negotiable' | 'contact';
  tags?: string[];
}

const STEPS = [
  { id: 1, number: '01', title: 'Shop' },
  { id: 2, number: '02', title: 'Category' },
  { id: 3, number: '03', title: 'Subcategory' },
  { id: 4, number: '04', title: 'Details' },
  { id: 5, number: '05', title: 'Media' },
  { id: 6, number: '06', title: 'Attributes' },
  { id: 7, number: '07', title: 'Pricing' },
  { id: 8, number: '08', title: 'Preview' },
  { id: 9, number: '09', title: 'Publish' },
];

export const ListingWizard: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    price: 0,
    condition: 'good',
    negotiable: false,
    category_id: 0,
    images: [],
    price_type: 'fixed',
    tags: [],
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateFormData = (data: Partial<ListingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = async () => {
    setError('');

    // Validation for each step
    if (currentStep === 1) {
      if (!formData.shop_id) {
        setError('Please select a shop');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.category_id) {
        setError('Please select a category');
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.subcategory_id) {
        setError('Please select a subcategory');
        return;
      }
    } else if (currentStep === 4) {
      if (!formData.title.trim()) {
        setError('Title is required');
        return;
      }
      if (!formData.description.trim()) {
        setError('Description is required');
        return;
      }
      if (!formData.location?.trim()) {
        setError('Location is required');
        return;
      }
    } else if (currentStep === 5) {
      if (formData.images.length === 0) {
        setError('Please upload at least one image');
        return;
      }
    } else if (currentStep === 7) {
      if (formData.price <= 0) {
        setError('Price must be greater than 0');
        return;
      }
    }

    if (currentStep < 9) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        condition: formData.condition,
        negotiable: formData.negotiable,
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id,
        location: formData.location,
        images: formData.images.map((img) => img.url),
        attributes: formData.attributes || {},
        price_type: formData.price_type,
        tags: formData.tags || [],
      };

      const result = await listingsService.createListing(payload);

      if (result?.id) {
        router.push(`/listings/${result.id}`);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to create listing'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Select Your Shop</h2>
              <p className="text-gray-600 dark:text-slate-400 text-sm">Choose which shop this listing belongs to</p>
            </div>
            <select
              value={formData.shop_id || ''}
              onChange={(e) => updateFormData({ shop_id: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            >
              <option value="">Select a shop</option>
              <option value="1">My Shop</option>
            </select>
          </div>
        );

      case 2:
        return <ListingStep2Category data={formData} onUpdate={updateFormData} onError={setError} />;

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Select Subcategory</h2>
              <p className="text-gray-600 dark:text-slate-400 text-sm">Narrow down to a specific subcategory</p>
            </div>
            <p className="text-gray-600 dark:text-slate-400">Subcategories will be loaded based on selected category</p>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Product Details</h2>
              <p className="text-gray-600 dark:text-slate-400 text-sm">Enter the details about your product</p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Location *
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => updateFormData({ location: e.target.value })}
                placeholder="City, Region"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                placeholder="e.g., iPhone 14 Pro Max 128GB, Gold, Like New"
                maxLength={100}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Be specific and descriptive (max 100 characters)
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Describe your item in detail. Mention condition, features, any defects..."
                rows={5}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {formData.description.length}/2000 characters
              </p>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Condition *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['new', 'like_new', 'good', 'fair'] as const).map((condition) => (
                  <button
                    key={condition}
                    onClick={() => updateFormData({ condition })}
                    className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                      formData.condition === condition
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {condition === 'like_new' ? 'Like New' : condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return <ListingStep3Images data={formData} onUpdate={updateFormData} onError={setError} />;

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Product Attributes</h2>
              <p className="text-gray-600 dark:text-slate-400 text-sm">Fill in specific details about your product</p>
            </div>
            <p className="text-gray-600 dark:text-slate-400">Category-specific attributes form will be integrated here</p>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pricing</h2>
              <p className="text-gray-600 dark:text-slate-400 text-sm">Set the price for your product</p>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Price (KES) *
              </label>
              <input
                type="number"
                value={formData.price || ''}
                onChange={(e) => updateFormData({ price: parseFloat(e.target.value) || 0 })}
                placeholder="e.g., 5000, 25000, 150000"
                step="1"
                min="0"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>

            {/* Price Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Price Type *
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-3 rounded-lg border border-gray-300 dark:border-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
                  <input
                    type="radio"
                    name="price_type"
                    value="fixed"
                    checked={formData.price_type === 'fixed'}
                    onChange={() => updateFormData({ price_type: 'fixed' })}
                    className="w-4 h-4"
                  />
                  <span className="ml-3 font-medium text-gray-900 dark:text-white">Fixed Price</span>
                </label>

                <label className="flex items-center p-3 rounded-lg border border-gray-300 dark:border-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
                  <input
                    type="radio"
                    name="price_type"
                    value="negotiable"
                    checked={formData.price_type === 'negotiable'}
                    onChange={() => updateFormData({ price_type: 'negotiable' })}
                    className="w-4 h-4"
                  />
                  <span className="ml-3 font-medium text-gray-900 dark:text-white">Negotiable</span>
                </label>

                <label className="flex items-center p-3 rounded-lg border border-gray-300 dark:border-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
                  <input
                    type="radio"
                    name="price_type"
                    value="contact"
                    checked={formData.price_type === 'contact'}
                    onChange={() => updateFormData({ price_type: 'contact' })}
                    className="w-4 h-4"
                  />
                  <span className="ml-3 font-medium text-gray-900 dark:text-white">Contact Seller</span>
                </label>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Tags (up to 5)
              </label>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Tags help buyers find your listing</p>
              <div className="flex gap-2">
                {formData.tags?.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      onClick={() => updateFormData({
                        tags: formData.tags?.filter((_, i) => i !== idx) || []
                      })}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 8:
        return <ListingStep4Review data={formData} />;

      case 9:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ready to Publish?</h2>
              <p className="text-gray-600 dark:text-slate-400 text-sm">Your listing is ready to go live!</p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg p-6">
              <p className="text-green-900 dark:text-green-200 font-medium">
                ✓ All required fields are complete. Your listing will be visible to buyers immediately after publishing.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Step Indicator */}
        <div className="mb-12">
          {/* Desktop View */}
          <div className="hidden md:flex items-center justify-between gap-2">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex-1 flex items-center">
                <motion.div
                  animate={{
                    backgroundColor: idx + 1 <= currentStep ? '#3b82f6' : '#e5e7eb',
                    color: idx + 1 <= currentStep ? '#ffffff' : '#6b7280',
                  }}
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 flex items-center justify-center"
                >
                  {idx + 1 <= currentStep ? <Check size={18} /> : step.number}
                </motion.div>
                <p className={`text-xs font-semibold ml-2 ${idx + 1 <= currentStep ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                  {step.title}
                </p>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${idx + 1 < currentStep ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-700'}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Mobile View */}
          <div className="md:hidden mb-4">
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                {currentStep}
              </div>
            </div>
            <p className="text-center text-sm font-semibold text-gray-900 dark:text-white">{STEPS[currentStep - 1]?.title}</p>
            <p className="text-center text-xs text-gray-500 dark:text-slate-400">{currentStep} of {STEPS.length}</p>
            <div className="w-full bg-gray-300 dark:bg-slate-700 rounded-full h-2 mt-3">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 md:p-10 mb-8"
        >
          {renderStepContent()}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-3 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            Back
          </motion.button>

          {currentStep === 9 ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? 'Publishing...' : 'Publish Listing'}
              <Check size={20} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              Next
              <ChevronRight size={20} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};
