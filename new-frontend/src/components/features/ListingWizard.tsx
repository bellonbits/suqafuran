"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { ListingStep1Details } from './listing-wizard/Step1Details';
import { ListingStep2Category } from './listing-wizard/Step2Category';
import { ListingStep3Images } from './listing-wizard/Step3Images';
import { ListingStep4Review } from './listing-wizard/Step4Review';
import { listingsService } from '../../services/listings';
import { useRouter } from 'next/navigation';

export interface ListingFormData {
  shop_id?: number;
  category_id: number;
  subcategory_id?: number;
  subsubcategory_id?: number;
  title: string;
  description: string;
  location?: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  images: Array<{ url: string; filename: string }>;
  attributes?: Record<string, any>;
  price: number;
  negotiable: boolean;
  price_type: 'fixed' | 'negotiable' | 'contact';
  tags?: string[];
}

const STEPS = [
  { id: 1, number: '01', title: 'Shop', description: 'Select shop' },
  { id: 2, number: '02', title: 'Category', description: 'Select category' },
  { id: 3, number: '03', title: 'Subcategory', description: 'Select subcategory' },
  { id: 4, number: '04', title: 'Details', description: 'Add details' },
  { id: 5, number: '05', title: 'Media', description: 'Add photos' },
  { id: 6, number: '06', title: 'Attributes', description: 'Product attributes' },
  { id: 7, number: '07', title: 'Pricing', description: 'Set price' },
  { id: 8, number: '08', title: 'Preview', description: 'Review listing' },
  { id: 9, number: '09', title: 'Publish', description: 'Publish' },
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

    if (currentStep === 1 && !formData.shop_id) {
      setError('Please select a shop');
      return;
    } else if (currentStep === 2 && !formData.category_id) {
      setError('Please select a category');
      return;
    } else if (currentStep === 3 && !formData.subcategory_id) {
      setError('Please select a subcategory');
      return;
    } else if (currentStep === 4) {
      if (!formData.title.trim() || !formData.description.trim() || !formData.location?.trim()) {
        setError('Please fill in all required fields');
        return;
      }
    } else if (currentStep === 5 && formData.images.length === 0) {
      setError('Please upload at least one image');
      return;
    } else if (currentStep === 7 && formData.price <= 0) {
      setError('Please set a valid price');
      return;
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
      setError(err?.response?.data?.detail || err?.message || 'Failed to create listing');
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
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Shop *</label>
              <select
                value={formData.shop_id || ''}
                onChange={(e) => updateFormData({ shop_id: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">Select a shop</option>
                <option value="1">My Shop</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return <ListingStep2Category data={formData} onUpdate={updateFormData} onError={setError} />;

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Subcategory *</label>
              <select
                value={formData.subcategory_id || ''}
                onChange={(e) => updateFormData({ subcategory_id: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">Choose the subcategory</option>
              </select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Location *</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => updateFormData({ location: e.target.value })}
                placeholder="Type Address"
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData({ title: e.target.value })}
                  placeholder="Product Title"
                  maxLength={100}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Condition *</label>
                <select
                  value={formData.condition}
                  onChange={(e) => updateFormData({ condition: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Type any message"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              />
            </div>
          </div>
        );

      case 5:
        return <ListingStep3Images data={formData} onUpdate={updateFormData} onError={setError} />;

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Attributes</label>
              <p className="text-gray-600 dark:text-slate-400 text-sm">Category-specific attributes form</p>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Price (KES) *</label>
                <input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => updateFormData({ price: parseFloat(e.target.value) || 0 })}
                  placeholder="5000"
                  step="1"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Price Type *</label>
                <select
                  value={formData.price_type}
                  onChange={(e) => updateFormData({ price_type: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="negotiable">Negotiable</option>
                  <option value="contact">Contact Seller</option>
                </select>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ready to Publish?</h3>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
                <p className="text-green-900 dark:text-green-200 text-sm">
                  ✓ All required fields are complete. Your listing will be visible to buyers immediately.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Suqafuran</h1>
              <p className="text-gray-600 dark:text-slate-400 text-sm mt-1">Marketplace Listing</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-slate-400">Step {currentStep} of {STEPS.length}</p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between gap-2">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      idx + 1 <= currentStep
                        ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                        : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                    }`}
                  >
                    {step.number}
                  </div>
                  <p className={`text-xs font-semibold mt-2 text-center whitespace-nowrap ${
                    idx + 1 <= currentStep ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                </div>

                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 transition-all ${
                      idx + 1 < currentStep ? 'bg-gray-900 dark:bg-gray-100' : 'bg-gray-200 dark:bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-lg mb-8"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {STEPS[currentStep - 1]?.title}
            </h2>
            <p className="text-gray-600 dark:text-slate-400 text-sm">
              Fill in the details below to move to the next step.
            </p>
          </div>

          {renderStepContent()}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-2 text-gray-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
            Back
          </button>

          {currentStep === 9 ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Publishing...' : 'Publish'}
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all"
            >
              Next
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
