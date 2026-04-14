import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useQuery, useMutation } from '@tanstack/react-query';

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
import { LocationPickerModal } from '../components/LocationPickerModal';
import { useLanguageField } from '../hooks/useLanguageField';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
interface EditAdValues {
    title_en: string;
    title_so: string;
    description_en: string;
    description_so: string;
    lang_available: 'en' | 'so' | 'both';
    category?: number;
    subcategory?: number;
    subsubcategory?: number;
    price: string;
    location: string;
    condition: string;
    images: string[];
    attributes: Record<string, any>;
}

const EditAdPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'en' | 'so'>('en');
    const [submitted, setSubmitted] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const { getField } = useLanguageField();

    const steps = [
        t('listing.basicInfo', 'Basic Info'),
        t('listing.categoryDetails', 'Category & Details'),
        t('listing.pricing', 'Pricing'),
        t('listing.photos', 'Photos'),
    ];

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
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
            </div>
        );
    }

    if (!listing) return null;

    const initialValues: EditAdValues = {
        title_en: listing.title_en || '',
        title_so: listing.title_so || '',
        description_en: listing.description_en || '',
        description_so: listing.description_so || '',
        lang_available: (listing as any).lang_available || 'en',
        category: listing.category_id,
        subcategory: listing.subcategory_id,
        subsubcategory: (listing as any).subsubcategory_id,
        price: listing.price.toString(),
        location: listing.location,
        condition: listing.condition,
        images: listing.images || [],
        attributes: listing.attributes || {},
    };

    const validationSchema = [
        Yup.object({
            lang_available: Yup.string().oneOf(['en', 'so', 'both']).required('Required'),
            title_en: Yup.string().when('lang_available', {
                is: (val: string) => val === 'en' || val === 'both',
                then: (schema) => schema.min(10, 'Title must be at least 10 characters').required('Required for English'),
                otherwise: (schema) => schema.notRequired()
            }),
            title_so: Yup.string().when('lang_available', {
                is: (val: string) => val === 'so' || val === 'both',
                then: (schema) => schema.min(10, 'Title must be at least 10 characters').required('Required for Somali'),
                otherwise: (schema) => schema.notRequired()
            }),
            location: Yup.string().required('Required'),
        }),
        Yup.object({
            category: Yup.number().required('Please select a category'),
            description_en: Yup.string().when('lang_available', {
                is: (val: string) => val === 'en' || val === 'both',
                then: (schema) => schema.min(20, 'Provide a detailed description').required('Required for English'),
                otherwise: (schema) => schema.notRequired()
            }),
            description_so: Yup.string().when('lang_available', {
                is: (val: string) => val === 'so' || val === 'both',
                then: (schema) => schema.min(20, 'Provide a detailed description').required('Required for Somali'),
                otherwise: (schema) => schema.notRequired()
            }),
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
            <div className="max-w-xl mx-auto py-20 text-center">
                <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-primary-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('editAd.successTitle', 'Ad Updated Successfully!')}</h2>
                <p className="text-gray-600 mb-8">
                    {t('editAd.successDesc', 'Your changes have been saved and are now live.')}
                </p>
                <div className="flex gap-4 justify-center">
                    <Button variant="outline" className="rounded-xl" onClick={() => navigate('/my-ads')}>{t('editAd.backToMyAds', 'Back to My Ads')}</Button>
                    <Button className="rounded-xl" onClick={() => navigate('/dashboard')}>{t('promotion.goToDashboard', 'Go to Dashboard')}</Button>
                </div>
            </div>
        );
    }

    return (
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
                <Formik<EditAdValues>
                    initialValues={initialValues}
                    validationSchema={validationSchema[currentStep]}
                    onSubmit={async (values, { setSubmitting }) => {
                        if (currentStep < steps.length - 1) {
                            handleNext();
                            setSubmitting(false);
                        } else {
                            updateMutation.mutate({
                                title_en: values.title_en,
                                title_so: values.title_so,
                                description_en: values.description_en,
                                description_so: values.description_so,
                                lang_available: values.lang_available,
                                price: Number(values.price),
                                location: values.location,
                                category_id: values.category!,
                                subcategory_id: values.subcategory,
                                subsubcategory_id: values.subsubcategory,
                                images: values.images,
                                attributes: values.attributes,
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
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">{t('editAd.step1Title', 'Step 1: Basic Info & Language')}</h3>

                                    {/* Language Availability Selector */}
                                    <div className="p-4 bg-primary-50/50 rounded-2xl border border-primary-100 mb-6">
                                        <label className="text-sm font-bold text-primary-900 mb-3 block uppercase tracking-wider">{t('editAd.langAvailableLabel', 'In which languages is this ad available?')}</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { id: 'en', label: t('editAd.englishOnly', 'English Only') },
                                                { id: 'so', label: t('editAd.somaliOnly', 'Somali Only') },
                                                { id: 'both', label: t('editAd.bilingual', 'Bilingual (Both)') }
                                            ].map((lang) => (
                                                <button
                                                    key={lang.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setFieldValue('lang_available', lang.id);
                                                        if (lang.id === 'en') setActiveTab('en');
                                                        if (lang.id === 'so') setActiveTab('so');
                                                    }}
                                                    className={cn(
                                                        "py-3 px-2 rounded-xl border-2 font-bold text-xs transition-all",
                                                        values.lang_available === lang.id
                                                            ? "bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-200"
                                                            : "bg-white border-gray-100 text-gray-400 hover:border-primary-200 hover:text-primary-600"
                                                    )}
                                                >
                                                    {lang.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tabbed Title Entry */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">{t('editAd.whatSellingLabel', 'What are you selling?')}</label>
                                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                                {(values.lang_available === 'en' || values.lang_available === 'both') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab('en')}
                                                        className={cn("px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all", activeTab === 'en' ? "bg-white text-primary-600 shadow-sm" : "text-gray-400")}
                                                    >
                                                        English
                                                    </button>
                                                )}
                                                {(values.lang_available === 'so' || values.lang_available === 'both') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab('so')}
                                                        className={cn("px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all", activeTab === 'so' ? "bg-white text-primary-600 shadow-sm" : "text-gray-400")}
                                                    >
                                                        Somali
                                                    </button>
                                                )}
                                                {values.lang_available === 'both' && (activeTab === 'en' ? values.title_en : values.title_so).length > 0 && (
                                                    <div className="ml-2 flex items-center pr-1 scale-75 origin-right">
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {activeTab === 'en' ? (
                                            <Input
                                                name="title_en"
                                                placeholder="e.g. iPhone 15 Pro Max 256GB - Clean"
                                                value={values.title_en}
                                                onChange={(e) => setFieldValue('title_en', e.target.value)}
                                                error={touched.title_en ? errors.title_en : undefined}
                                            />
                                        ) : (
                                            <Input
                                                name="title_so"
                                                placeholder="m.sh. iPhone 15 Pro Max 256GB - Aad u fiican"
                                                value={values.title_so}
                                                onChange={(e) => setFieldValue('title_so', e.target.value)}
                                                error={touched.title_so ? errors.title_so : undefined}
                                            />
                                        )}
                                    </div>
                                    <div className="relative group">
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">{t('listing.location', 'Location')}</label>
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
                                                    {values.location || t('listing.selectLocation', 'Select location (State › Region › Town)')}
                                                </span>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-gray-400" />
                                        </button>
                                        {touched.location && errors.location && (
                                            <p className="text-xs text-red-500 mt-1 font-medium">{errors.location}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {currentStep === 1 && (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold">{t('editAd.selectCategory', 'Select Category')}</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {catsLoading ? (
                                                <div className="col-span-full flex justify-center py-12">
                                                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                                                </div>
                                            ) : (
                                                categories?.map(cat => {
                                                    const Icon = getCategoryIcon(cat.icon_name || cat.slug);
                                                    return (
                                                        <button
                                                            key={cat.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setFieldValue('category', cat.id);
                                                                setFieldValue('subcategory', undefined);
                                                                setFieldValue('subsubcategory', undefined);
                                                            }}
                                                            className={cn(
                                                                "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group",
                                                                values.category === cat.id
                                                                    ? "border-primary-600 bg-primary-50 text-primary-700 shadow-md ring-4 ring-primary-100/50"
                                                                    : "border-gray-50 bg-white hover:bg-primary-50/30 hover:border-primary-200 text-gray-600"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center transition-all",
                                                                values.category === cat.id ? "bg-primary-600 text-white shadow-lg" : "bg-gray-50 text-gray-400 group-hover:bg-white group-hover:text-primary-600"
                                                            )}>
                                                                {cat.image_url ? (
                                                                    <img src={getImageUrl(cat.image_url)} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Icon className="h-6 w-6" />
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-center">{getField(cat, 'name')}</span>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Subcategory Selection */}
                                    {(() => {
                                        const selectedCat = categories?.find(c => c.id === values.category);
                                        if (!selectedCat || !selectedCat.subcategories || selectedCat.subcategories.length === 0) return null;

                                        return (
                                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('editAd.selectSubcategory', 'Select Subcategory')}</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {selectedCat.subcategories.map(sub => (
                                                        <button
                                                            key={sub.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setFieldValue('subcategory', sub.id);
                                                                setFieldValue('subsubcategory', undefined);
                                                            }}
                                                            className={cn(
                                                                "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                                                                values.subcategory === sub.id
                                                                    ? "border-secondary-500 bg-secondary-50 text-secondary-900 shadow-sm"
                                                                    : "border-gray-100 bg-white hover:border-secondary-200 text-gray-700"
                                                            )}
                                                        >
                                                            <div className="w-10 h-10 rounded-lg bg-gray-50 shrink-0 overflow-hidden">
                                                                {sub.image_url ? (
                                                                    <img src={getImageUrl(sub.image_url)} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                                        <ImageIcon size={16} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-sm font-semibold truncate">
                                                                {getField(sub, 'name').replace(/^\d+\s/, '')}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Sub-subcategory Selection */}
                                    {(() => {
                                        const selectedCat = categories?.find(c => c.id === values.category);
                                        const selectedSub = selectedCat?.subcategories?.find(s => s.id === values.subcategory);
                                        if (!selectedSub || !selectedSub.subsubcategories || selectedSub.subsubcategories.length === 0) return null;

                                        return (
                                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('editAd.selectSpecificType', 'Select Specific Type')}</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {selectedSub.subsubcategories.map(ss => (
                                                        <button
                                                            key={ss.id}
                                                            type="button"
                                                            onClick={() => setFieldValue('subsubcategory', ss.id)}
                                                            className={cn(
                                                                "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                                                                values.subsubcategory === ss.id
                                                                    ? "border-primary-500 bg-primary-50 text-primary-900 shadow-sm"
                                                                    : "border-gray-100 bg-white hover:border-primary-200 text-gray-700"
                                                            )}
                                                        >
                                                            <span className="text-sm font-semibold truncate pl-2">
                                                                {getField(ss, 'name')}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {touched.category && errors.category && (
                                        <p className="text-xs text-red-500 font-medium">{errors.category as string}</p>
                                    )}

                                    <div className="space-y-4 mt-6">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">{t('editAd.detailedDescription', 'Detailed Description')}</label>
                                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                                {(values.lang_available === 'en' || values.lang_available === 'both') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab('en')}
                                                        className={cn("px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all", activeTab === 'en' ? "bg-white text-primary-600 shadow-sm" : "text-gray-400")}
                                                    >
                                                        English
                                                    </button>
                                                )}
                                                {(values.lang_available === 'so' || values.lang_available === 'both') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab('so')}
                                                        className={cn("px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all", activeTab === 'so' ? "bg-white text-primary-600 shadow-sm" : "text-gray-400")}
                                                    >
                                                        Somali
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {activeTab === 'en' ? (
                                            <textarea
                                                className={cn(
                                                    "w-full min-h-[150px] p-4 rounded-xl border focus:ring-2 focus:ring-primary-500 outline-none transition-all",
                                                    touched.description_en && errors.description_en ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
                                                )}
                                                placeholder="Provide all details about your item in English..."
                                                value={values.description_en}
                                                onChange={(e) => setFieldValue('description_en', e.target.value)}
                                            ></textarea>
                                        ) : (
                                            <textarea
                                                className={cn(
                                                    "w-full min-h-[150px] p-4 rounded-xl border focus:ring-2 focus:ring-primary-500 outline-none transition-all",
                                                    touched.description_so && errors.description_so ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
                                                )}
                                                placeholder="Ka bixi faahfaahin buuxda alaabtaada af Somali..."
                                                value={values.description_so}
                                                onChange={(e) => setFieldValue('description_so', e.target.value)}
                                            ></textarea>
                                        )}
                                        {((activeTab === 'en' && touched.description_en && errors.description_en) ||
                                            (activeTab === 'so' && touched.description_so && errors.description_so)) && (
                                                <p className="text-xs text-red-500 font-medium">
                                                    {(activeTab === 'en' ? errors.description_en : errors.description_so) as string}
                                                </p>
                                            )}
                                    </div>

                                    {/* Dynamic Attributes (From API Schema) */}
                                    {(() => {
                                        const selectedCat = categories?.find(c => c.id === values.category);
                                        const selectedSub = selectedCat?.subcategories?.find(s => s.id === values.subcategory);
                                        const selectedSubSub = selectedSub?.subsubcategories?.find(ss => ss.id === values.subsubcategory);

                                        // Merge attributes from category, subcategory, and sub-subcategory
                                        const catAttrs = selectedCat?.attributes_schema?.fields || [];
                                        const subAttrs = selectedSub?.attributes_schema?.fields || [];
                                        const subSubAttrs = (selectedSubSub as any)?.attributes_schema?.fields || [];
                                        const attributes = [...catAttrs, ...subAttrs, ...subSubAttrs];

                                        if (attributes.length === 0) return null;

                                        return (
                                            <div className="pt-6 border-t border-gray-100 space-y-6">
                                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">{t('editAd.specificDetails', 'Specific Details')}</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {attributes.map(attr => (
                                                        <div key={attr.name}>
                                                            <label className="text-sm font-medium text-gray-700 mb-2 block">{attr.label} {attr.required && '*'}</label>
                                                            {attr.type === 'select' ? (
                                                                <select
                                                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-white"
                                                                    value={values.attributes[attr.name] || ''}
                                                                    onChange={(e) => setFieldValue(`attributes.${attr.name}`, e.target.value)}
                                                                >
                                                                    <option value="">Select {attr.label}</option>
                                                                    {attr.options?.map((opt: string) => (
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
                                    <h3 className="text-xl font-bold flex items-center gap-2">{t('editAd.pricingCondition', 'Pricing & Condition')}</h3>
                                    <Input
                                        label={t('listing.price', 'Price') + ' (USD)'}
                                        name="price"
                                        type="number"
                                        value={values.price}
                                        onChange={(e) => setFieldValue('price', e.target.value)}
                                        error={touched.price ? errors.price : undefined}
                                    />
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">{t('listing.condition', 'Condition')}</label>
                                        <div className="flex gap-4">
                                            {([
                                                { value: 'New', label: t('postAd.condNew', 'New') },
                                                { value: 'Used', label: t('postAd.condUsed', 'Used') },
                                                { value: 'Refurbished', label: t('postAd.condRefurbished', 'Refurbished') },
                                            ]).map((cond) => (
                                                <label key={cond.value} className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 flex-1 justify-center">
                                                    <input
                                                        type="radio"
                                                        name="condition"
                                                        value={cond.value}
                                                        checked={values.condition === cond.value}
                                                        onChange={() => setFieldValue('condition', cond.value)}
                                                        className="text-primary-600 focus:ring-primary-500"
                                                    />
                                                    <span className="text-sm font-medium">{cond.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2">{t('listing.addPhotos', 'Add Photos')}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-4 hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group">
                                            <Upload className="h-8 w-8 text-gray-300 group-hover:text-primary-500 mb-2" />
                                            <span className="text-[10px] text-gray-400 font-medium text-center">{t('listing.clickToUpload', 'Click to upload photos')}</span>
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
                                    <ChevronLeft className="h-5 w-5 mr-2" /> {t('listing.back', 'Back')}
                                </Button>
                                <Button
                                    type="submit" className="rounded-xl px-12"
                                    isLoading={isSubmitting || updateMutation.isPending}
                                >
                                    {currentStep === steps.length - 1 ? t('listing.saveChanges', 'Save Changes') : t('listing.next', 'Next')}
                                    <ChevronRight className="h-5 w-5 ml-2" />
                                </Button>
                            </div>

                            <LocationPickerModal
                                isOpen={isLocationModalOpen}
                                onClose={() => setIsLocationModalOpen(false)}
                                onSelect={(loc) => setFieldValue('location', loc)}
                                title="Update Listing Location"
                            />
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
};

export { EditAdPage };
