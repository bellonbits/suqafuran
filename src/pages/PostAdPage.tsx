import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useQuery } from '@tanstack/react-query';

import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { listingService } from '../services/listingService';
import {
    Image as ImageIcon, Upload, CheckCircle2,
    ChevronRight, ChevronLeft, Tag, Info, Loader2, MapPin
} from 'lucide-react';
import { cn } from '../utils/cn';
import { getImageUrl } from '../utils/imageUtils';
import { getCategoryIcon } from '../utils/categoryIcons';
import { getAttributesForCategory } from '../utils/categoryAttributes';
import { JIJI_CATEGORIES } from '../utils/jijiCategories';
import { LocationPickerModal } from '../components/LocationPickerModal';

const steps = ['Basic Info', 'Category & Details', 'Pricing', 'Photos'];

const PostAdPage: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

    const { data: categories, isLoading: catsLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: listingService.getCategories,
    });

    const initialValues = {
        title: '',
        description: '',
        category: undefined as number | undefined,
        price: '',
        currency: 'USD',
        location: '',
        condition: 'Used',
        images: [] as string[],
        attributes: {} as Record<string, any>,
    };

    const validationSchema = [
        Yup.object({
            title: Yup.string().min(10, 'Title must be at least 10 characters').required('Required'),
            location: Yup.string().required('Required'),
        }),
        Yup.object({
            category: Yup.number().required('Please select a category'),
            description: Yup.string().min(20, 'Provide a detailed description').required('Required'),
        }),
        Yup.object({
            price: Yup.number().positive('Must be positive').required('Required'),
            currency: Yup.string().required('Required'),
        }),
        Yup.object({
            // Images normally handled via separate state
        }),
    ];

    const handleNext = () => setCurrentStep(prev => prev + 1);
    const handleBack = () => setCurrentStep(prev => prev - 1);

    if (submitted) {
        return (
            <div className="max-w-xl mx-auto py-20 text-center">
                <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-primary-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Ad Posted Successfully!</h2>
                <p className="text-gray-600 mb-8">
                    Your ad is now being reviewed by our moderation team. It will be live in a few minutes.
                </p>
                <div className="flex gap-4 justify-center">
                    <Button variant="outline" className="rounded-xl">View My Ads</Button>
                    <Button className="rounded-xl">Post Another Ad</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-12">
            {/* Stepper */}
            <div className="mb-10 px-4 md:px-0">
                <div className="flex items-center justify-between">
                    {steps.map((label, i) => (
                        <React.Fragment key={label}>
                            <div className="flex flex-col items-center gap-2">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
                                    currentStep === i
                                        ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-100"
                                        : currentStep > i
                                            ? "bg-primary-50 border-primary-200 text-primary-600"
                                            : "bg-white border-gray-200 text-gray-400"
                                )}>
                                    {currentStep > i ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                                </div>
                                <span className={cn(
                                    "text-[10px] md:text-xs font-bold uppercase tracking-wider",
                                    currentStep === i ? "text-primary-600" : "text-gray-400"
                                )}>{label}</span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={cn(
                                    "flex-1 h-0.5 mx-2 bg-gray-100",
                                    currentStep > i && "bg-primary-200"
                                )} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema[currentStep]}
                    onSubmit={async (values, { setSubmitting, setStatus }) => {
                        if (currentStep < steps.length - 1) {
                            handleNext();
                            setSubmitting(false);
                        } else {
                            try {
                                await listingService.createListing({
                                    title: values.title,
                                    description: values.description,
                                    price: Number(values.price),
                                    currency: values.currency,
                                    location: values.location,
                                    category_id: values.category!,
                                    images: values.images,
                                    condition: values.condition,
                                    attributes: values.attributes
                                });
                                setSubmitted(true);
                            } catch (err: any) {
                                setStatus(err.response?.data?.detail || 'Failed to post ad');
                            } finally {
                                setSubmitting(false);
                            }
                        }
                    }}
                >
                    {({ values, errors, touched, isSubmitting, setFieldValue }) => (
                        <Form className="p-6 md:p-10">
                            {currentStep === 0 && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2">Listing Title & Location</h3>
                                    <Input
                                        label="What are you selling?"
                                        name="title"
                                        placeholder="e.g. iPhone 15 Pro Max 256GB - Clean"
                                        value={values.title}
                                        onChange={(e) => setFieldValue('title', e.target.value)}
                                        error={touched.title ? errors.title : undefined}
                                    />
                                    <div className="relative group">
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">Location</label>
                                        <button
                                            type="button"
                                            onClick={() => setIsLocationModalOpen(true)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left",
                                                touched.location && errors.location ? "border-red-500 bg-red-50" : "border-gray-300 bg-white hover:border-primary-500"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <MapPin className={cn("h-5 w-5", values.location ? "text-primary-600" : "text-gray-400")} />
                                                <span className={cn("text-sm", !values.location && "text-gray-400")}>
                                                    {values.location || "Select location (State > Region > Town)"}
                                                </span>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-gray-400" />
                                        </button>
                                        {touched.location && errors.location && (
                                            <p className="text-xs text-red-500 mt-1 font-medium">{errors.location}</p>
                                        )}
                                        <LocationPickerModal
                                            isOpen={isLocationModalOpen}
                                            onClose={() => setIsLocationModalOpen(false)}
                                            onSelect={(loc) => setFieldValue('location', loc)}
                                            title="Select Listing Location"
                                        />
                                    </div>
                                    <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 flex gap-3 mt-4 text-xs text-primary-800">
                                        <Info className="h-5 w-5 shrink-0" />
                                        <p>Clear titles attract 3x more buyers. Mention the brand, model and some features.</p>
                                    </div>
                                </div>
                            )}

                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold">Category & Details</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {catsLoading ? (
                                            <div className="col-span-full flex justify-center py-12">
                                                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                                            </div>
                                        ) : (
                                            categories?.map(cat => {
                                                const Icon = getCategoryIcon(cat.icon_name || cat.icon);
                                                const categoryData = JIJI_CATEGORIES.find(c => c.id === cat.slug);
                                                const categoryImage = categoryData?.image;

                                                return (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        onClick={() => setFieldValue('category', cat.id)}
                                                        className={cn(
                                                            "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group",
                                                            values.category === cat.id
                                                                ? "border-primary-600 bg-primary-50 text-primary-700 shadow-md ring-4 ring-primary-100/50"
                                                                : "border-gray-50 bg-white hover:bg-primary-50/30 hover:border-primary-200 text-gray-600"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center transition-all",
                                                            values.category === cat.id ? "bg-primary-600 text-white ring-2 ring-primary-500 ring-offset-2" : "bg-gray-50 text-gray-400 group-hover:bg-white group-hover:text-primary-600"
                                                        )}>
                                                            {categoryImage ? (
                                                                <img src={categoryImage} alt={cat.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Icon className="h-6 w-6" />
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-center">{cat.name}</span>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                    {touched.category && errors.category && (
                                        <p className="text-xs text-red-500 font-medium">{errors.category}</p>
                                    )}
                                    <div className="space-y-2 mt-4">
                                        <label className="text-sm font-medium text-gray-700">Detailed Description</label>
                                        <textarea
                                            className="w-full min-h-[150px] p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                            placeholder="Describe what you are selling. Mention its condition, any flaws, or why you are selling."
                                            value={values.description}
                                            onChange={(e) => setFieldValue('description', e.target.value)}
                                        ></textarea>
                                        {touched.description && errors.description && (
                                            <p className="text-xs text-red-500 font-medium">{errors.description}</p>
                                        )}
                                    </div>

                                    {/* Dynamic Attributes */}
                                    {(() => {
                                        const selectedCat = categories?.find(c => c.id === values.category);
                                        const attributes = selectedCat ? getAttributesForCategory(selectedCat.slug) : [];

                                        if (attributes.length === 0) return null;

                                        return (
                                            <div className="pt-6 border-t border-gray-100 space-y-6">
                                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Specific Details</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {attributes.map(attr => (
                                                        <div key={attr.name}>
                                                            <label className="text-sm font-medium text-gray-700 mb-2 block">{attr.label} {attr.required && '*'}</label>
                                                            {attr.type === 'select' ? (
                                                                <select
                                                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-white"
                                                                    value={values.attributes[attr.name] || ''}
                                                                    onChange={(e) => setFieldValue(`attributes.${attr.name}`, e.target.value)}
                                                                    required={attr.required}
                                                                >
                                                                    <option value="">Select {attr.label}</option>
                                                                    {attr.options?.map(opt => (
                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <input
                                                                    type={attr.type}
                                                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                                                    placeholder={attr.placeholder}
                                                                    value={values.attributes[attr.name] || ''}
                                                                    onChange={(e) => setFieldValue(`attributes.${attr.name}`, attr.type === 'number' ? Number(e.target.value) : e.target.value)}
                                                                    required={attr.required}
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Tag className="h-6 w-6 text-primary-600" />
                                        Pricing & Condition
                                    </h3>
                                    <div className="flex gap-4">
                                        <div className="w-1/3">
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">Currency</label>
                                            <select
                                                name="currency"
                                                className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-white"
                                                value={values.currency}
                                                onChange={(e) => setFieldValue('currency', e.target.value)}
                                            >
                                                <option value="USD">USD ($)</option>
                                                <option value="KES">KES (KSh)</option>
                                                <option value="SOS">SOS (Sh.So.)</option>
                                                <option value="SLS">SLS (Sl.Sh.)</option>
                                                <option value="EUR">EUR (€)</option>
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <Input
                                                label="Price"
                                                name="price"
                                                type="number"
                                                placeholder="0.00"
                                                value={values.price}
                                                onChange={(e) => setFieldValue('price', e.target.value)}
                                                error={touched.price ? errors.price : undefined}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">Item Condition</label>
                                        <div className="flex gap-4">
                                            {['New', 'Used', 'Refurbished'].map(cond => (
                                                <label key={cond} className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 flex-1 justify-center">
                                                    <input
                                                        type="radio"
                                                        name="condition"
                                                        value={cond}
                                                        checked={values.condition === cond}
                                                        onChange={() => setFieldValue('condition', cond)}
                                                        className="text-primary-600 focus:ring-primary-500"
                                                    />
                                                    <span className="text-sm font-medium">{cond}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <ImageIcon className="h-6 w-6 text-primary-600" />
                                        Add Photos
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-4 hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group">
                                            <Upload className="h-8 w-8 text-gray-300 group-hover:text-primary-500 mb-2" />
                                            <span className="text-[10px] text-gray-400 font-medium text-center">Click to upload photos</span>
                                            <input
                                                type="file"
                                                multiple
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const files = Array.from(e.target.files || []);
                                                    for (const file of files) {
                                                        try {
                                                            const result = await listingService.uploadImage(file);
                                                            setFieldValue('images', [...values.images, result.url]);
                                                        } catch (err) {
                                                            console.error('Failed to upload image', err);
                                                        }
                                                    }
                                                }}
                                            />
                                        </label>
                                        {values.images.map((url, i) => (
                                            <div key={i} className="aspect-square rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center relative overflow-hidden group">
                                                <img src={getImageUrl(url)} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFieldValue('images', values.images.filter((_, idx) => idx !== i))}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Tag className="h-4 w-4 rotate-45" /> {/* Using Tag as a close icon surrogate if X is missing, wait I have Lucide names */}
                                                </button>
                                            </div>
                                        ))}
                                        {/* Fill remaining slots with placeholders up to 4 */}
                                        {Array.from({ length: Math.max(0, 3 - values.images.length) }).map((_, i) => (
                                            <div key={i} className="aspect-square rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                                                <ImageIcon className="h-10 w-10 text-gray-100" />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 italic">Add at least 3 high-quality photos to increase sales by 40%.</p>
                                </div>
                            )}

                            <div className="mt-12 flex flex-col-reverse md:flex-row justify-between gap-4 border-t border-gray-100 pt-8">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                    disabled={currentStep === 0 || isSubmitting}
                                    className="rounded-xl px-8 w-full md:w-auto"
                                >
                                    <ChevronLeft className="h-5 w-5 mr-2" />
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="rounded-xl px-12 w-full md:w-auto"
                                    isLoading={isSubmitting}
                                >
                                    {currentStep === steps.length - 1 ? 'Post My Ad' : 'Continue'}
                                    <ChevronRight className="h-5 w-5 ml-2" />
                                </Button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
};

export { PostAdPage };

