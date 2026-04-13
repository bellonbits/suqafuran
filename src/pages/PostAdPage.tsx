import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Plus, X, Shield, ShieldAlert, Clock, CheckCircle2, Loader2, Zap } from 'lucide-react';

import { listingService } from '../services/listingService';
import { getImageUrl } from '../utils/imageUtils';
import { getCategoryIcon } from '../utils/categoryIcons';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { useLanguageField } from '../hooks/useLanguageField';
import { LipanaPaymentModal } from '../components/LipanaPaymentModal';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../utils/cn';

const KES_RATE = 130;


const TITLE_MAX = 70;

type Negotiable = 'yes' | 'no' | 'not_sure';

interface FormValues {
    title_en: string;
    title_so: string;
    categoryId: number | null;
    subcategoryId: number | null;
    subsubcategoryId: number | null;
    location: string;
    images: string[];
    youtubeLink: string;
    description_en: string;
    description_so: string;
    price: string;
    condition: string;
    negotiable: Negotiable;
    phone: string;
    name: string;
    attributes: Record<string, any>;
    lang_available: 'en' | 'so' | 'both';
}

const PostAdPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<FormValues>({
        title_en: '',
        title_so: '',
        categoryId: null,
        subcategoryId: null,
        subsubcategoryId: null,
        location: '',
        images: [],
        youtubeLink: '',
        description_en: '',
        description_so: '',
        price: '',
        condition: 'Used',
        negotiable: 'not_sure',
        phone: user?.phone || '',
        name: user?.full_name || '',
        attributes: {},
        lang_available: (i18n.language as any) === 'so' ? 'so' : 'en',
    });
    const [formTab, setFormTab] = useState<'en' | 'so'>((i18n.language as any) === 'so' ? 'so' : 'en');

    const [step, setStep] = useState<1 | 2>(1);
    const [showBulkPrice, setShowBulkPrice] = useState(false);
    const [promoPlanId, setPromoPlanId] = useState<number>(0);
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const [isLocationOpen, setIsLocationOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const { getField } = useLanguageField();
    const [createdListingId, setCreatedListingId] = useState<number | null>(null);
    const [showLipanaModal, setShowLipanaModal] = useState(false);
    const [createdListingTitle, setCreatedListingTitle] = useState('');

    const { data: verificationStatus } = useQuery({
        queryKey: ['verification-status'],
        queryFn: () => import('../services/api').then(m => m.default.get('/verifications/me').then(r => r.data)),
        enabled: !!user && !user.is_verified,
    });

    const { data: categories = [], isLoading: catsLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: listingService.getCategories,
    });

    const { data: promotionPlans = [] } = useQuery({
        queryKey: ['promotionPlans'],
        queryFn: listingService.getPromotionPlans,
    });

    const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
        setForm(f => ({ ...f, [key]: value }));
        if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
    };

    const setAttribute = (key: string, value: any) => {
        setForm(f => ({ ...f, attributes: { ...f.attributes, [key]: value } }));
        if (errors[`attr_${key}` as any]) setErrors(e => ({ ...e, [`attr_${key}`]: undefined }));
    };

    const selectedCategory = categories.find(c => c.id === form.categoryId);
    const selectedSubcategory = form.subcategoryId ? selectedCategory?.subcategories?.find(s => s.id === form.subcategoryId) : null;
    
    // Defensive parsing for dynamicSchema
    let dynamicSchema: any[] = [];
    const rawSchema = selectedSubcategory?.attributes_schema || selectedCategory?.attributes_schema;
    if (rawSchema) {
        if (Array.isArray(rawSchema)) {
            dynamicSchema = rawSchema;
        } else if (typeof rawSchema === 'string') {
            try {
                const parsed = JSON.parse(rawSchema);
                dynamicSchema = Array.isArray(parsed) ? parsed : (parsed.fields || []);
            } catch (e) {
                console.error("Failed to parse dynamicSchema", e);
            }
        } else if (rawSchema.fields && Array.isArray(rawSchema.fields)) {
            dynamicSchema = rawSchema.fields;
        }
    }

    const filteredCategories = categorySearch.trim()
        ? categories.filter(c =>
            getField(c, 'name').toLowerCase().includes(categorySearch.toLowerCase()) ||
            c.subcategories?.some((s: any) => getField(s, 'name').toLowerCase().includes(categorySearch.toLowerCase()))
        )
        : categories;

    const handleImageUpload = async (files: FileList | null) => {
        if (!files) return;
        setUploading(true);
        for (const file of Array.from(files)) {
            try {
                const result = await listingService.uploadImage(file);
                setForm(f => ({ ...f, images: [...f.images, result.url] }));
            } catch {
                // silently skip failed uploads
            }
        }
        setUploading(false);
    };

    const removeImage = (idx: number) => {
        setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
    };

    const validateStep1 = () => {
        const e: Record<string, string> = {};
        
        // Validate required title based on availability
        if (form.lang_available === 'en' || form.lang_available === 'both') {
            if (!form.title_en || form.title_en.length < 5) e.title_en = 'English title is required (min 5 chars)';
        }
        if (form.lang_available === 'so' || form.lang_available === 'both') {
            if (!form.title_so || form.title_so.length < 5) e.title_so = 'Magaca Somali-ga waa lagama maarmaan (ugu yaraan 5 xaraf)';
        }

        if (!form.categoryId) e.categoryId = 'Please select a category';
        if (!form.location) e.location = 'Please select a location';
        if (form.images.length < 1) e.images = 'Please upload at least 1 photo';
        return e;
    };

    const handleNext = () => {
        const errs = validateStep1();
        if (Object.keys(errs).length) {
            setErrors(errs);
            // If error is in another tab, switch to it
            if (errs.title_en && formTab === 'so') setFormTab('en');
            else if (errs.title_so && formTab === 'en') setFormTab('so');
            return;
        }
        setErrors({});
        setStep(2);
        window.scrollTo(0, 0);
    };

    const validate = () => {
        const e: Record<string, string> = validateStep1();
        
        // Description validation
        if (form.lang_available === 'en' || form.lang_available === 'both') {
            if (!form.description_en || form.description_en.length < 10) e.description_en = 'English description is required (min 10 chars)';
        }
        if (form.lang_available === 'so' || form.lang_available === 'both') {
            if (!form.description_so || form.description_so.length < 10) e.description_so = 'Faahfaahinta Somali-ga waa lagama maarmaan';
        }

        if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Enter a valid price';
        
        // Validate dynamic fields
        dynamicSchema.forEach(field => {
            if (field.required && !form.attributes[field.name]) {
                e[`attr_${field.name}` as any] = `${field.label || field.name} is required`;
            }
        });
        
        return e;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) {
            setErrors(errs);
            
            // Auto-switch tab if error is in hidden tab
            if ((errs.title_en || errs.description_en) && formTab === 'so') setFormTab('en');
            else if ((errs.title_so || errs.description_so) && formTab === 'en') setFormTab('so');

            const firstErr = document.querySelector('[data-error="true"]');
            firstErr?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        setSubmitting(true);
        try {
            const result = await listingService.createListing({
                title_en: form.title_en,
                title_so: form.title_so,
                description_en: form.description_en,
                description_so: form.description_so,
                price: Number(form.price),
                currency: 'USD',
                location: form.location,
                category_id: form.categoryId!,
                subcategory_id: form.subcategoryId ?? undefined,
                subsubcategory_id: form.subsubcategoryId ?? undefined,
                images: form.images,
                condition: form.condition,
                attributes: form.attributes,
                lang_available: form.lang_available,
            });

            if (promoPlanId > 0 && result.id) {
                // Save the listing info and open Lipana modal for payment
                setCreatedListingId(result.id);
                setCreatedListingTitle(form.title_en || form.title_so);
                setSubmitting(false);
                setShowLipanaModal(true);
            } else {
                setSubmitted(true);
            }
        } catch (err: any) {
            setErrors({ title: err.response?.data?.detail || 'Failed to post ad' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleLipanaConfirm = async (phone: string): Promise<{ promoId?: number; error?: string }> => {
        if (!createdListingId || !promoPlanId) return { error: 'Missing listing or plan' };
        try {
            const result = await listingService.createPromotionOrder({
                listing_id: createdListingId,
                plan_id: promoPlanId,
                payment_phone: phone,
            });
            return { promoId: result.id };
        } catch (e: any) {
            return { error: e?.response?.data?.detail || 'Payment initiation failed. Please try again.' };
        }
    };

    const handleLipanaPollStatus = async (promoId: number) => {
        return listingService.checkPromotionStatus(promoId);
    };

    const handleLipanaClose = () => {
        setShowLipanaModal(false);
        setSubmitted(true);
    };

    const handleClear = () => {
        setForm({
            title_en: '',
            title_so: '',
            categoryId: null,
            subcategoryId: null,
            subsubcategoryId: null,
            location: '',
            images: [],
            youtubeLink: '',
            description_en: '',
            description_so: '',
            price: '',
            condition: 'Used',
            negotiable: 'not_sure',
            phone: user?.phone || '',
            name: user?.full_name || '',
            attributes: {},
            lang_available: (i18n.language as any) === 'so' ? 'so' : 'en',
        });
        setErrors({});
        setStep(1);
    };

    // ── Verification gate ──────────────────────────────────────────────────────
    if (!user?.is_verified) {
        const isPending = verificationStatus?.status === 'pending';
        return (
            <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 16px', textAlign: 'center' }}>
                <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: isPending ? '#f4fbff' : '#fffbeb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 24px',
                }}>
                    {isPending
                        ? <Clock size={36} color="var(--color-primary-500)" />
                        : <ShieldAlert size={36} color="#f59e0b" />
                    }
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
                    {isPending ? 'Verification Pending' : 'Verify Your Account First'}
                </h2>
                <p style={{ color: '#6b7280', marginBottom: 28, lineHeight: 1.6 }}>
                    {isPending
                        ? 'Your documents are under review (24-48 hours). You\'ll be able to post once approved.'
                        : 'To keep Suqafuran safe, all sellers must verify their identity before posting ads.'}
                </p>
                {!isPending && (
                    <Link to="/dashboard/verify" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'var(--color-primary-500)', color: '#fff', padding: '12px 28px',
                        borderRadius: 12, fontWeight: 600, textDecoration: 'none',
                    }}>
                        <Shield size={18} /> Verify My Account
                    </Link>
                )}
            </div>
        );
    }

    // ── Success state ──────────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 16px', textAlign: 'center' }}>
                <div style={{
                    width: 80, height: 80, borderRadius: '50%', background: '#f4fbff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 24px',
                }}>
                    <CheckCircle2 size={36} color="var(--color-primary-500)" />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Ad Posted Successfully!</h2>
                <p style={{ color: '#6b7280', marginBottom: 28, lineHeight: 1.6 }}>
                    Your ad is being reviewed by our team. It will be live shortly.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/my-ads" style={{
                        padding: '11px 24px', border: '1.5px solid #d1d5db', borderRadius: 10,
                        fontWeight: 600, color: '#374151', textDecoration: 'none',
                    }}>
                        View My Ads
                    </Link>
                    <button
                        onClick={() => { setSubmitted(false); handleClear(); }}
                        style={{
                            padding: '11px 24px', background: 'var(--color-primary-500)', color: '#fff',
                            border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        Post Another Ad
                    </button>
                </div>
            </div>
        );
    }

    // ── Category picker ────────────────────────────────────────────────────────
    if (showCategoryPicker) {
        return (
            <div style={{ maxWidth: 640, margin: '0 auto', paddingBottom: 40 }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 16px', background: '#fff',
                    borderBottom: '1px solid #e5e7eb', marginBottom: 0,
                }}>
                    <button
                        onClick={() => setShowCategoryPicker(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary-500)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                    >
                        <ChevronLeft size={18} /> Back
                    </button>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>Select Category</span>
                    <span style={{ width: 60 }} />
                </div>

                {/* Search */}
                <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
                    <input
                        autoFocus
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearch}
                        onChange={e => setCategorySearch(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db',
                            borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box',
                        }}
                    />
                </div>

                {/* List */}
                <div style={{ background: '#fff' }}>
                    {catsLoading ? (
                        <div style={{ padding: 40, textAlign: 'center' }}>
                            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary-500)' }} />
                        </div>
                    ) : filteredCategories.map(cat => {
                        const Icon = getCategoryIcon(cat.icon_name || cat.slug);
                        return (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setForm(f => ({ ...f, categoryId: cat.id, subcategoryId: null, subsubcategoryId: null, attributes: {} }));
                                    setErrors({});
                                    setShowCategoryPicker(false);
                                    setCategorySearch('');
                                }}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
                                    borderBottom: '1px solid #f3f4f6', textAlign: 'left',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10, background: '#f3f4f6',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                                    }}>
                                        {cat.image_url
                                            ? <img src={getImageUrl(cat.image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <Icon size={20} color="#6b7280" />
                                        }
                                    </div>
                                    <span style={{ fontSize: 15, fontWeight: 500, color: '#111827' }}>
                                        {getField(cat, 'name')}
                                    </span>
                                </div>
                                <ChevronRight size={18} color="#9ca3af" />
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ── Main form ──────────────────────────────────────────────────────────────
    const renderFloatingInput = (id: string, label: string, value: any, onChange: (v: string) => void, error?: string, opts?: { type?: string, maxLength?: number }) => (
        <div className="relative mb-4">
            <input 
                id={id}
                type={opts?.type || 'text'}
                value={value}
                onChange={e => onChange(e.target.value)}
                maxLength={opts?.maxLength}
                placeholder=" "
                className={`peer block w-full rounded-md border bg-transparent px-3 py-3 text-sm text-gray-900 focus:outline-none ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'}`}
            />
            <label htmlFor={id} className={`absolute left-2 top-0 -translate-y-1/2 bg-white px-1 text-[11px] transition-all pointer-events-none peer-placeholder-shown:top-[14px] peer-placeholder-shown:-translate-y-0 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[11px] ${error ? 'text-red-500 peer-focus:text-red-500' : 'text-gray-500 peer-focus:text-primary-500'}`}>
                {label}
            </label>
            {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
        </div>
    );

    const renderFloatingSelect = (id: string, label: string, value: any, onChange: (v: string) => void, options: {value: string, label: string}[], error?: string) => (
        <div className="relative mb-4">
            <select 
                id={id}
                value={value || ""}
                onChange={e => onChange(e.target.value)}
                required
                className={`peer block w-full rounded-md border bg-transparent px-3 py-3 text-sm focus:outline-none appearance-none ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'} ${!value ? 'text-transparent' : 'text-gray-900'}`}
            >
                <option value="" disabled hidden> </option>
                {options.map(opt => <option key={opt.value} value={opt.value} className="text-gray-900">{opt.label}</option>)}
            </select>
            <label htmlFor={id} className={`absolute left-2 top-0 -translate-y-1/2 bg-white px-1 text-[11px] transition-all pointer-events-none peer-valid:top-0 peer-valid:-translate-y-1/2 peer-valid:text-[11px] peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[11px] ${!value ? 'top-[14px] -translate-y-0 text-sm' : ''} ${error ? 'text-red-500 peer-focus:text-red-500' : 'text-gray-500 peer-focus:text-primary-500'}`}>
                {label}
            </label>
            <ChevronRight className="absolute right-3 top-[14px] h-4 w-4 text-gray-400 pointer-events-none" />
            {error && <p className="text-[11px] text-red-500 mt-1">This field is required.</p>}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f4f6f8] pb-12 pt-4 px-3 w-full">
            {/* Header Toolbar Card */}
            <div className="bg-white rounded-md shadow-sm p-4 mb-4 max-w-2xl mx-auto relative flex flex-col items-center border-b-[1.5px] border-gray-200/60">
                <div className="w-full flex items-center justify-between mb-2">
                    {step === 2 ? (
                        <button type="button" onClick={() => { setStep(1); window.scrollTo(0,0); }} className="text-primary-500 font-bold flex items-center text-[13px] gap-1 hover:bg-primary-50 px-2 py-1.5 rounded-md transition-colors">
                            <ChevronLeft size={16} /> Back
                        </button>
                    ) : (
                        <div className="w-16" />
                    )}
                    
                    <span className="font-bold text-gray-900 text-[16px]">Post ad</span>
                    
                    <button type="button" onClick={handleClear} className="text-[#FF3B30] font-bold text-[13px] hover:bg-red-50 px-2 py-1.5 rounded-md transition-colors tracking-wide">
                        Clear
                    </button>
                </div>

                {/* Step Indicators */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-all",
                            step === 1 ? "bg-white border-primary-500 text-primary-500 shadow-sm" : "bg-gray-100 border-gray-100 text-gray-400"
                        )}>1</div>
                        <span className={cn("text-[12px] font-bold transition-colors", step === 1 ? "text-gray-900" : "text-gray-400")}>Basic info</span>
                    </div>
                    <div className="w-8 h-[2px] bg-gray-100">
                        <div className={cn("h-full bg-primary-500 transition-all duration-500", step === 2 ? "w-full" : "w-0")} />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-all",
                            step === 2 ? "bg-white border-primary-500 text-primary-500 shadow-sm" : "bg-gray-100 border-gray-100 text-gray-400"
                        )}>2</div>
                        <span className={cn("text-[12px] font-bold transition-colors", step === 2 ? "text-gray-900" : "text-gray-400")}>Description & Price</span>
                    </div>
                </div>
            </div>

            <form onSubmit={step === 1 ? (e => e.preventDefault()) : handleSubmit} noValidate className="max-w-2xl mx-auto">
                
                {/* ── STEP 1: Basic Information ────────────────────────── */}
                <div style={{ display: step === 1 ? 'block' : 'none' }}>
                    <div className="bg-white rounded-md shadow-sm border-[1.5px] border-gray-200/60 p-5 mb-5">
                        
                        {/* Language Selection */}
                        <div className="mb-8">
                            <label className="block text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-3 pl-0.5">
                                Select Language for your ad
                            </label>
                            <div className="flex gap-2 p-1.5 bg-gray-50 rounded-xl border border-gray-100">
                                {(['en', 'so', 'both'] as const).map(lang => (
                                    <button
                                        key={lang}
                                        type="button"
                                        onClick={() => set('lang_available', lang)}
                                        className={cn(
                                            "flex-1 py-3 px-2 rounded-lg text-sm font-bold transition-all flex flex-col items-center gap-1",
                                            form.lang_available === lang 
                                                ? "bg-white text-primary-600 shadow-md ring-1 ring-black/5" 
                                                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
                                        )}
                                    >
                                        <span className="uppercase">{lang === 'both' ? 'Both' : lang}</span>
                                        <span className="text-[10px] font-medium opacity-60">
                                            {lang === 'en' ? 'English' : lang === 'so' ? 'Somali' : 'EN + SO'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Title Bilingual Tabs */}
                        <div className="mb-6">
                             <div className="flex items-center justify-between mb-2">
                                <label className="block text-[13px] font-bold text-gray-900 pl-0.5">Title*</label>
                                <div className="flex bg-gray-100 rounded-lg p-0.5">
                                    <button 
                                        type="button" 
                                        onClick={() => setFormTab('en')}
                                        className={cn(
                                            "px-3 py-1 text-[11px] font-bold rounded-md transition-all",
                                            formTab === 'en' ? "bg-white text-primary-600 shadow-sm" : "text-gray-400"
                                        )}
                                    >
                                        EN {errors.title_en && "●"}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setFormTab('so')}
                                        className={cn(
                                            "px-3 py-1 text-[11px] font-bold rounded-md transition-all",
                                            formTab === 'so' ? "bg-white text-primary-600 shadow-sm" : "text-gray-400"
                                        )}
                                    >
                                        SO {errors.title_so && "●"}
                                    </button>
                                </div>
                             </div>

                             {formTab === 'en' ? (
                                renderFloatingInput('title_en', 'English Title (Required if EN selected)', form.title_en, v => set('title_en', v), errors.title_en, { maxLength: TITLE_MAX })
                             ) : (
                                renderFloatingInput('title_so', 'Gali Magaca (Somali)', form.title_so, v => set('title_so', v), errors.title_so, { maxLength: TITLE_MAX })
                             )}
                        </div>

                        {/* Category Chooser */}
                        <div className="relative mb-4">
                            <button
                                type="button"
                                onClick={() => setShowCategoryPicker(true)}
                                className={`flex w-full items-center justify-between rounded-md border bg-transparent px-3 py-[13px] text-sm focus:outline-none appearance-none transition-colors ${errors.categoryId ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'}`}
                            >
                                <span className={selectedCategory ? 'text-gray-900 font-medium' : 'text-transparent'}>
                                    {selectedCategory ? getField(selectedCategory, 'name') : ' '}
                                </span>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            </button>
                            <label className={`absolute left-3 top-0 -translate-y-1/2 bg-white px-1 text-[11px] pointer-events-none transition-all ${!selectedCategory ? 'top-[22px] -translate-y-1/2 text-[14px]' : 'font-medium'} ${errors.categoryId ? 'text-red-500' : 'text-gray-500'}`}>
                                Category*
                            </label>
                            {errors.categoryId && <p className="text-[11px] text-red-500 mt-1 pl-1">{errors.categoryId}</p>}
                        </div>

                        {/* Location Chooser */}
                        <div className="relative mb-4">
                            <button
                                type="button"
                                onClick={() => setIsLocationOpen(true)}
                                className={`flex w-full items-center justify-between rounded-md border bg-transparent px-3 py-[13px] text-sm focus:outline-none appearance-none transition-colors ${errors.location ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'}`}
                            >
                                <span className={form.location ? 'text-gray-900 font-medium' : 'text-transparent'}>{form.location || ' '}</span>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            </button>
                            <label className={`absolute left-3 top-0 -translate-y-1/2 bg-white px-1 text-[11px] pointer-events-none transition-all ${!form.location ? 'top-[22px] -translate-y-1/2 text-[14px]' : 'font-medium'} ${errors.location ? 'text-red-500' : 'text-gray-500'}`}>
                                Select Location*
                            </label>
                            {errors.location && <p className="text-[11px] text-red-500 mt-1 pl-1">{errors.location}</p>}
                        </div>

                        {/* Photos section */}
                        <div className="mt-8 mb-6">
                            <h3 className="font-bold text-gray-900 text-[15px] mb-2">Add at least 2 photos</h3>
                            <p className="text-[13px] leading-snug mb-4 pl-0.5">
                                <span className="text-primary-500 font-bold">First picture is the title picture.</span> <span className="text-gray-500 font-medium">You can change the order of photos: just grab your photos and drag</span>
                            </p>
                            <div className="flex flex-wrap gap-2 mb-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-[72px] h-[72px] rounded-md bg-[#eef8ff] flex items-center justify-center cursor-pointer transition-colors hover:bg-primary-100 flex-shrink-0"
                                >
                                    {uploading ? <Loader2 className="w-6 h-6 text-primary-500 animate-spin" /> : <Plus strokeWidth={2.5} className="w-6 h-6 text-primary-500" />}
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={e => handleImageUpload(e.target.files)} />
                                
                                {form.images.map((url, i) => (
                                    <div key={i} className="relative w-[72px] h-[72px] flex-shrink-0">
                                        <img src={getImageUrl(url)} alt="" className="w-full h-full object-cover rounded-md border border-gray-200" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute -top-1.5 -right-1.5 bg-red-500 w-5 h-5 rounded-full flex items-center justify-center shadow-md pb-[1px]"
                                        >
                                            <X size={12} fill="white" color="white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <span className="text-[13px] text-gray-500 font-medium tracking-tight mt-1 inline-block pl-0.5">Supported formats are *.jpg and *.png</span>
                            {errors.images && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.images}</p>}
                        </div>

                        {/* YouTube */}
                        <div className="mb-8 relative">
                            <input
                                type="text"
                                value={form.youtubeLink}
                                onChange={e => set('youtubeLink', e.target.value)}
                                placeholder="Link to Youtube or Facebook video"
                                className="block w-full rounded-md border border-gray-300 bg-transparent px-4 py-[13px] text-[15px] font-medium text-gray-900 focus:outline-none focus:border-primary-500 placeholder:text-gray-500 placeholder:font-normal"
                            />
                        </div>

                        <button type="button" onClick={handleNext} className="mt-2 w-full bg-primary-500 hover:bg-primary-600 active:scale-[0.98] text-white font-bold text-[15px] py-3.5 rounded-md transition-all flex items-center justify-center shadow-sm">
                            Next
                        </button>
                    </div>
                </div>

                {/* ── STEP 2: Extended Details ──────────────────────────── */}
                <div style={{ display: step === 2 ? 'block' : 'none' }}>
                    
                    {/* CARD 1: Core Details */}
                    <div className="bg-white rounded-md shadow-sm border border-gray-200 p-5 mb-5">
                        {/* Subcategory */}
                        {selectedCategory?.subcategories && selectedCategory.subcategories.length > 0 && 
                            renderFloatingSelect('subcategory', 'Subcategory*', form.subcategoryId?.toString() || "", v => {
                                setForm(f => ({ ...f, subcategoryId: Number(v), subsubcategoryId: null, attributes: {} })); setErrors({});
                            }, selectedCategory.subcategories.map((s:any) => ({value: s.id.toString(), label: getField(s, 'name') as string})), errors.subcategoryId)
                        }

                        {/* Sub-subcategory */}
                        {selectedSubcategory?.subsubcategories && selectedSubcategory.subsubcategories.length > 0 && 
                            renderFloatingSelect('subsubcategory', 'Specific Type (Optional)', form.subsubcategoryId?.toString() || "", v => {
                                setForm(f => ({ ...f, subsubcategoryId: Number(v) })); setErrors({});
                            }, selectedSubcategory.subsubcategories.map((ss:any) => ({value: ss.id.toString(), label: getField(ss, 'name') as string})), undefined)
                        }

                        {/* Dynamic Schema Grid */}
                        {dynamicSchema.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                                {dynamicSchema.map(field => {
                                    const errKey = `attr_${field.name}` as any;
                                    if (field.name === 'condition') return null;
                                    if (field.type === 'select') {
                                        return renderFloatingSelect(field.name, `${field.label}${field.required ? '*' : ''}`, form.attributes[field.name], v => setAttribute(field.name, v), (field.options||[]).map((o:string)=>({value: o, label: o})), errors[errKey]);
                                    }
                                    return renderFloatingInput(field.name, `${field.label}${field.required ? '*' : ''}`, form.attributes[field.name] || '', v => setAttribute(field.name, v), errors[errKey], { type: field.type === 'number' ? 'number' : 'text' });
                                })}
                            </div>
                        )}

                        {/* Condition (Static Select Fallback) */}
                        {renderFloatingSelect('condition', 'Condition*', form.condition, v => set('condition', v), [
                            {value: 'New', label: 'New'}, {value: 'Used', label: 'Used'}, {value: 'Refurbished', label: 'Refurbished'}
                        ])}

                        {/* Description Textarea */}
                        <div className="relative mb-6 mt-4">
                             <div className="flex items-center justify-between mb-2">
                                <label className="block text-[13px] font-bold text-gray-900 pl-0.5">Description*</label>
                                <div className="flex bg-gray-100 rounded-lg p-0.5">
                                    <button 
                                        type="button" 
                                        onClick={() => setFormTab('en')}
                                        className={cn(
                                            "px-3 py-1 text-[11px] font-bold rounded-md transition-all",
                                            formTab === 'en' ? "bg-white text-primary-600 shadow-sm" : "text-gray-400"
                                        )}
                                    >
                                        EN {errors.description_en && "●"}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setFormTab('so')}
                                        className={cn(
                                            "px-3 py-1 text-[11px] font-bold rounded-md transition-all",
                                            formTab === 'so' ? "bg-white text-primary-600 shadow-sm" : "text-gray-400"
                                        )}
                                    >
                                        SO {errors.description_so && "●"}
                                    </button>
                                </div>
                             </div>

                            {formTab === 'en' ? (
                                <textarea 
                                    id="description_en"
                                    value={form.description_en}
                                    onChange={e => set('description_en', e.target.value)}
                                    maxLength={2000}
                                    rows={4}
                                    placeholder="Describe your item in English..."
                                    className={`peer block w-full rounded-md border bg-transparent px-3 py-3 text-sm text-gray-900 focus:outline-none resize-y ${errors.description_en ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'}`}
                                />
                            ) : (
                                <textarea 
                                    id="description_so"
                                    value={form.description_so}
                                    onChange={e => set('description_so', e.target.value)}
                                    maxLength={2000}
                                    rows={4}
                                    placeholder="Sharaxaad ka bixi alaabtaada (Somali)..."
                                    className={`peer block w-full rounded-md border bg-transparent px-3 py-3 text-sm text-gray-900 focus:outline-none resize-y ${errors.description_so ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'}`}
                                />
                            )}
                            <div className="flex justify-end mt-1">
                                <span className="text-[10px] text-gray-400">
                                    {formTab === 'en' ? form.description_en.length : form.description_so.length} / 2000
                                </span>
                            </div>
                            {errors.description_en && formTab === 'en' && <p className="text-[11px] text-red-500 -mt-1">{errors.description_en}</p>}
                            {errors.description_so && formTab === 'so' && <p className="text-[11px] text-red-500 -mt-1">{errors.description_so}</p>}
                        </div>

                        {/* Price Input */}
                        <div className="flex justify-center mb-4">
                            <div className="w-full sm:w-2/3">
                                <div className={`relative flex border rounded-md overflow-visible bg-white transition-colors outline-none focus-within:border-primary-500 ${errors.price ? 'border-red-500' : 'border-gray-300'}`}>
                                    <div className="absolute left-2 top-0 -translate-y-1/2 bg-white px-1 text-[11px] text-gray-500 font-medium pointer-events-none z-10 hidden sm:block">
                                        Price*
                                    </div>
                                    <span className="bg-gray-50 border-r border-gray-300 px-4 py-3 text-sm text-gray-700 font-bold whitespace-nowrap rounded-l-md">KSh</span>
                                    <input
                                        type="number"
                                        value={form.price}
                                        onChange={e => set('price', e.target.value)}
                                        placeholder="Price*"
                                        className="flex-1 w-full px-3 py-3 text-sm bg-transparent outline-none text-gray-900 font-medium peer sm:placeholder-transparent"
                                    />
                                </div>
                                {errors.price && <p className="text-[11px] text-red-500 mt-1 pl-1">{errors.price}</p>}
                            </div>
                        </div>

                        {/* Bulk Price */}
                        <div className="flex justify-center mb-6">
                            <div className="w-full sm:w-2/3">
                                {!showBulkPrice ? (
                                    <button type="button" onClick={() => setShowBulkPrice(true)} className="w-full border border-gray-200 rounded-md p-3 flex justify-between items-center bg-gray-50 opacity-60 hover:opacity-100 transition-opacity">
                                        <span className="text-sm text-gray-500 font-medium">Add bulk price</span>
                                        <ChevronRight size={16} className="text-gray-400" />
                                    </button>
                                ) : (
                                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 transition-all pb-0">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[14px] font-bold text-gray-900">Bulk Pricing</span>
                                            <button type="button" onClick={() => { setShowBulkPrice(false); setAttribute('bulk_quantity', undefined); setAttribute('bulk_price', undefined); }} className="text-gray-400 hover:text-red-500 transition-colors"><X size={18} /></button>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-4 mb-2">
                                            <div className="flex-1">
                                                {renderFloatingInput('bulk_quantity', 'Minimum Quantity', form.attributes.bulk_quantity || '', v => setAttribute('bulk_quantity', v), undefined, {type: 'number'})}
                                            </div>
                                            <div className="flex-1">
                                                <div className="relative mb-4 flex border rounded-md overflow-hidden bg-white focus-within:border-primary-500 border-gray-300">
                                                    <span className="bg-gray-50 border-r border-gray-300 px-3 py-3 text-sm text-gray-700 font-bold">KSh</span>
                                                    <input type="number" placeholder="Bulk Price" value={form.attributes.bulk_price || ''} onChange={e => setAttribute('bulk_price', e.target.value)} className="w-full px-3 py-3 text-sm bg-transparent outline-none text-gray-900" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Negotiable Options */}
                        <div className="mb-6 flex justify-center">
                            <div className="w-full sm:w-2/3">
                                <p className="text-[13px] font-bold text-gray-900 mb-2">Are you open to negotiation?</p>
                                <div className="flex gap-6">
                                    {(['yes', 'no', 'not_sure'] as const).map(val => (
                                        <label key={val} className="flex items-center gap-2 cursor-pointer text-sm text-gray-800">
                                            <input
                                                type="radio"
                                                name="negotiable"
                                                value={val}
                                                checked={form.negotiable === val}
                                                onChange={() => set('negotiable', val)}
                                                className="w-4 h-4 text-primary-500 focus:ring-primary-500 border-gray-300 accent-primary-500"
                                            />
                                            {val === 'yes' ? 'Yes' : val === 'no' ? 'No' : 'Not sure'}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Personal Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                            {renderFloatingInput('phone', 'Your phone number*', form.phone, v => set('phone', v), errors.phone, { type: 'tel' })}
                            {renderFloatingInput('name', 'Name*', form.name, v => set('name', v), errors.name)}
                        </div>

                    </div>


                    {/* CARD 3: Promote */}
                    <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6 mb-5 flex flex-col items-center">
                        <div className="w-full sm:w-4/5 flex flex-col">
                            <h3 className="font-bold text-[19px] mb-1 text-gray-900">Promote your ad</h3>
                            <p className="text-[13px] text-primary-500 mb-6 font-medium">Boost with M-Pesa (Lipana) — instant activation after payment</p>

                            {/* No promo option */}
                            <label className={`border border-gray-200 rounded-md p-4 mb-3 flex justify-between items-center cursor-pointer transition-colors ${promoPlanId === 0 ? 'bg-primary-50/40 border-primary-500 shadow-sm' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    <input type="radio" name="promo" checked={promoPlanId === 0} onChange={() => setPromoPlanId(0)} className="w-4 h-4 text-primary-500 focus:ring-primary-500 accent-primary-500" />
                                    <span className="font-bold text-[15px] text-gray-900">No promo</span>
                                </div>
                                <span className="text-gray-400 text-sm font-medium">free</span>
                            </label>

                            {/* Dynamic plans from API */}
                            {promotionPlans.map((plan: any) => (
                                <label
                                    key={plan.id}
                                    className={`border border-gray-200 rounded-md p-4 mb-3 flex justify-between items-center cursor-pointer transition-colors ${promoPlanId === plan.id ? 'bg-primary-50/40 border-primary-500 shadow-sm' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="promo"
                                            checked={promoPlanId === plan.id}
                                            onChange={() => setPromoPlanId(plan.id)}
                                            className="w-4 h-4 text-primary-500 focus:ring-primary-500 accent-primary-500"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Zap size={13} className="text-primary-500 fill-primary-500" />
                                                <span className="font-bold text-[15px] text-gray-900">{plan.name}</span>
                                            </div>
                                            <span className="bg-[#eef8ff] text-primary-500 px-3 py-0.5 rounded-full text-[11px] font-bold">{plan.duration_days} days</span>
                                        </div>
                                    </div>
                                    <span className="font-bold text-gray-900">KSh {Math.round(plan.price_usd * KES_RATE).toLocaleString()}</span>
                                </label>
                            ))}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-primary-500 hover:bg-primary-600 active:scale-[0.98] text-white font-bold text-[17px] py-3.5 rounded-md transition-all flex items-center justify-center gap-2 shadow-sm mt-3"
                            >
                                {submitting && <Loader2 size={20} className="animate-spin" />}
                                {promoPlanId > 0 ? 'Post & Boost with M-Pesa' : 'Post ad'}
                            </button>

                            <p className="text-[10px] text-gray-500 mt-5 leading-relaxed text-center px-4">
                                By clicking on Post Ad, you accept the <a href="#" className="text-primary-500 hover:underline">Terms of Use</a>, confirm that you will abide by the Safety Tips, and declare that this posting does not include any Prohibited Items.
                            </p>
                        </div>
                    </div>
                </div>
            </form>

            <LocationPickerModal
                isOpen={isLocationOpen}
                onClose={() => setIsLocationOpen(false)}
                onSelect={loc => { set('location', loc); setIsLocationOpen(false); }}
                title={t('listing.selectListingLocation')}
            />

            {/* Lipana M-Pesa Payment Modal (after ad created) */}
            <LipanaPaymentModal
                isOpen={showLipanaModal}
                onClose={handleLipanaClose}
                onConfirm={handleLipanaConfirm}
                onPollStatus={handleLipanaPollStatus}
                amount={promoPlanId > 0 ? Math.round((promotionPlans.find((p: any) => p.id === promoPlanId)?.price_usd || 0) * KES_RATE) : 0}
                planName={promotionPlans.find((p: any) => p.id === promoPlanId)?.name || ''}
                listingTitle={createdListingTitle}
            />
        </div>
    );
};

export { PostAdPage };
