import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { listingService } from '../services/listingService';
import {
    Image as ImageIcon, Upload, CheckCircle2,
    ChevronRight, ChevronLeft, Loader2, X
} from 'lucide-react';
import { cn } from '../utils/cn';
import { getImageUrl } from '../utils/imageUtils';
import { getCategoryIcon } from '../utils/categoryIcons';

const steps = ['Basic Info', 'Category & Details', 'Pricing', 'Photos'];

const EditAdPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    const { data: listing, isLoading: loadingListing } = useQuery({
        queryKey: ['listing', id],
        queryFn: () => listingService.getListing(Number(id)),
        enabled: !!id
    });

    const { data: categories, isLoading: catsLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: listingService.getCategories,
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => listingService.updateListing(Number(id), data),
        onSuccess: () => {
            setSubmitted(true);
        },
    });

    if (loadingListing) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
                </div>
            </DashboardLayout>
        );
    }

    if (!listing) return null;

    const initialValues = {
        title: listing.title,
        description: listing.description,
        category: listing.category_id,
        price: listing.price.toString(),
        location: listing.location,
        condition: listing.condition,
        images: listing.images || [],
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
        }),
        Yup.object({}),
    ];

    const handleNext = () => setCurrentStep(prev => prev + 1);
    const handleBack = () => setCurrentStep(prev => prev - 1);

    if (submitted) {
        return (
            <DashboardLayout>
                <div className="max-w-xl mx-auto py-20 text-center">
                    <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-10 w-10 text-primary-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Ad Updated Successfully!</h2>
                    <p className="text-gray-600 mb-8">
                        Your changes have been saved and are now live.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button variant="outline" className="rounded-xl" onClick={() => navigate('/my-ads')}>Back to My Ads</Button>
                        <Button className="rounded-xl" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
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
                        onSubmit={async (values, { setSubmitting }) => {
                            if (currentStep < steps.length - 1) {
                                handleNext();
                                setSubmitting(false);
                            } else {
                                updateMutation.mutate({
                                    title: values.title,
                                    description: values.description,
                                    price: Number(values.price),
                                    location: values.location,
                                    category_id: values.category!,
                                    images: values.images,
                                    condition: values.condition,
                                    status: listing.status
                                });
                                setSubmitting(false);
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
                                        <Input
                                            label="Location"
                                            name="location"
                                            placeholder="e.g. Westlands, Nairobi"
                                            value={values.location}
                                            onChange={(e) => setFieldValue('location', e.target.value)}
                                            error={touched.location ? errors.location : undefined}
                                        />
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
                                                    const Icon = getCategoryIcon(cat.icon_name);
                                                    return (
                                                        <button
                                                            key={cat.id}
                                                            type="button"
                                                            onClick={() => setFieldValue('category', cat.id)}
                                                            className={cn(
                                                                "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all group",
                                                                values.category === cat.id
                                                                    ? "border-primary-600 bg-primary-50 text-primary-700 shadow-md ring-4 ring-primary-100/50"
                                                                    : "border-gray-50 bg-white hover:bg-primary-50/30 hover:border-primary-200 text-gray-600"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                                                values.category === cat.id ? "bg-primary-600 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-white group-hover:text-primary-600"
                                                            )}>
                                                                <Icon className="h-6 w-6" />
                                                            </div>
                                                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">{cat.name}</span>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                        <div className="space-y-2 mt-4">
                                            <label className="text-sm font-medium text-gray-700">Detailed Description</label>
                                            <textarea
                                                className="w-full min-h-[150px] p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                                value={values.description}
                                                onChange={(e) => setFieldValue('description', e.target.value)}
                                            ></textarea>
                                            {touched.description && errors.description && (
                                                <p className="text-xs text-red-500 font-medium">{errors.description}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <h3 className="text-xl font-bold flex items-center gap-2">Pricing & Condition</h3>
                                        <Input
                                            label="Price (KES)"
                                            name="price"
                                            type="number"
                                            value={values.price}
                                            onChange={(e) => setFieldValue('price', e.target.value)}
                                            error={touched.price ? errors.price : undefined}
                                        />
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
                                        <h3 className="text-xl font-bold flex items-center gap-2">Add Photos</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-4 hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group">
                                                <Upload className="h-8 w-8 text-gray-300 group-hover:text-primary-500 mb-2" />
                                                <span className="text-[10px] text-gray-400 font-medium text-center">Click to upload photos</span>
                                                <input
                                                    type="file" multiple className="hidden"
                                                    onChange={async (e) => {
                                                        const files = Array.from(e.target.files || []);
                                                        for (const file of files) {
                                                            const result = await listingService.uploadImage(file);
                                                            setFieldValue('images', [...values.images, result.url]);
                                                        }
                                                    }}
                                                />
                                            </label>
                                            {values.images.map((url, i) => (
                                                <div key={i} className="aspect-square rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center relative overflow-hidden group">
                                                    <img src={getImageUrl(url)} alt="" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFieldValue('images', values.images.filter((_, idx) => idx !== i))}
                                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            {Array.from({ length: Math.max(0, 3 - values.images.length) }).map((_, i) => (
                                                <div key={i} className="aspect-square rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                                                    <ImageIcon className="h-10 w-10 text-gray-100" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-12 flex justify-between gap-4 border-t border-gray-100 pt-8">
                                    <Button
                                        type="button" variant="outline" onClick={handleBack}
                                        disabled={currentStep === 0 || isSubmitting} className="rounded-xl px-8"
                                    >
                                        <ChevronLeft className="h-5 w-5 mr-2" /> Back
                                    </Button>
                                    <Button
                                        type="submit" className="rounded-xl px-12"
                                        isLoading={isSubmitting || updateMutation.isPending}
                                    >
                                        {currentStep === steps.length - 1 ? 'Save Changes' : 'Continue'}
                                        <ChevronRight className="h-5 w-5 ml-2" />
                                    </Button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>
        </DashboardLayout>
    );
};

export { EditAdPage };
