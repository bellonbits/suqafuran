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
  // Step 1: Details
  title: string;
  description: string;
  price: number;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  negotiable: boolean;

  // Step 2: Category
  category_id: number;
  subcategory_id?: number;
  subsubcategory_id?: number;

  // Step 3: Images
  images: Array<{ url: string; filename: string }>;

  // Additional
  location?: string;
  attributes?: Record<string, any>;
}

const STEPS = [
  { id: 1, title: 'Details', description: 'Title, description & price' },
  { id: 2, title: 'Category', description: 'Select category' },
  { id: 3, title: 'Images', description: 'Add photos' },
  { id: 4, title: 'Review', description: 'Review & publish' },
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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateFormData = (data: Partial<ListingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = async () => {
    // Validate current step
    if (currentStep === 1) {
      if (!formData.title.trim()) {
        setError('Title is required');
        return;
      }
      if (!formData.description.trim()) {
        setError('Description is required');
        return;
      }
      if (formData.price <= 0) {
        setError('Price must be greater than 0');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.category_id) {
        setError('Please select a category');
        return;
      }
    } else if (currentStep === 3) {
      if (formData.images.length === 0) {
        setError('Please upload at least one image');
        return;
      }
    }

    setError('');
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const listingData = {
        title_en: formData.title,
        description_en: formData.description,
        price: formData.price,
        currency: 'KES',
        condition: formData.condition,
        is_negotiable: formData.negotiable,
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id,
        subsubcategory_id: formData.subsubcategory_id,
        images: formData.images.map((img) => img.url),
        location: formData.location || 'Nairobi',
      };

      const response = await listingsService.createListing(listingData);

      // Redirect to listing detail page
      router.push(`/listings/${response.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create listing. Please try again.');
      console.error('Listing creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ListingStep1Details
            data={formData}
            onUpdate={updateFormData}
            onError={setError}
          />
        );
      case 2:
        return (
          <ListingStep2Category
            data={formData}
            onUpdate={updateFormData}
            onError={setError}
          />
        );
      case 3:
        return (
          <ListingStep3Images
            data={formData}
            onUpdate={updateFormData}
            onError={setError}
          />
        );
      case 4:
        return (
          <ListingStep4Review
            data={formData}
            onUpdate={updateFormData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Post a New Listing
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Sell your items in minutes with our smart listing wizard
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center flex-1 ${
                  step.id < STEPS.length ? 'relative' : ''
                }`}
              >
                <motion.div
                  animate={{
                    scale: step.id === currentStep ? 1.1 : 1,
                    backgroundColor:
                      step.id < currentStep
                        ? '#10b981'
                        : step.id === currentStep
                          ? '#3b82f6'
                          : '#e5e7eb',
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white dark:text-gray-900 relative z-10"
                >
                  {step.id < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </motion.div>

                {step.id < STEPS.length && (
                  <div
                    className={`absolute top-5 left-1/2 w-full h-1 -z-10 ${
                      step.id < currentStep
                        ? 'bg-[#02CCFE]'
                        : 'bg-gray-200 dark:bg-slate-700'
                    }`}
                    style={{
                      transform: 'translateY(-50%)',
                      width: 'calc(100% + 40px)',
                      left: '-20px',
                    }}
                  />
                )}

                <div className="text-center mt-3 text-sm">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8 mb-8"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </motion.div>
          )}

          {renderStep()}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </motion.button>

          {currentStep < STEPS.length ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#5bc0e8] hover:bg-blue-700 text-white font-semibold transition-colors"
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#02CCFE] hover:bg-[#02CCFE] text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Publishing...' : 'Publish Listing'}
              <Check className="h-5 w-5" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};
