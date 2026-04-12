import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Plus, X, Shield, ShieldAlert, Clock, CheckCircle2, Loader2, Truck } from 'lucide-react';

import { listingService } from '../services/listingService';
import { getImageUrl } from '../utils/imageUtils';
import { getCategoryIcon } from '../utils/categoryIcons';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../utils/cn';
import api from '../services/api';


const TITLE_MAX = 70;

type Negotiable = 'yes' | 'no' | 'not_sure';

interface FormValues {
    title: string;
    categoryId: number | null;
    subcategoryId: number | null;
    location: string;
    images: string[];
    youtubeLink: string;
    description: string;
    price: string;
    condition: string;
    negotiable: Negotiable;
    phone: string;
    name: string;
    attributes: Record<string, any>;
}

const PostAdPage: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<FormValues>({
        title: '',
        categoryId: null,
        subcategoryId: null,
        location: '',
        images: [],
        youtubeLink: '',
        description: '',
        price: '',
        condition: 'Used',
        negotiable: 'not_sure',
        phone: user?.phone || '',
        name: user?.full_name || '',
        attributes: {},
    });

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

    const { data: verificationStatus } = useQuery({
        queryKey: ['verification-status'],
        queryFn: () => import('../services/api').then(m => m.default.get('/verifications/me').then(r => r.data)),
        enabled: !!user && !user.is_verified,
    });

    const { data: categories = [], isLoading: catsLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: listingService.getCategories,
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
    const dynamicSchema: any[] = selectedSubcategory?.attributes_schema || selectedCategory?.attributes_schema || [];

    const filteredCategories = categorySearch.trim()
        ? categories.filter(c =>
            c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
            c.subcategories?.some((s: any) => s.name.toLowerCase().includes(categorySearch.toLowerCase()))
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
        if (!form.title || form.title.length < 10) e.title = 'Length should be greater than 10';
        if (!form.categoryId) e.categoryId = 'Please select a category';
        if (!form.location) e.location = 'Please select a location';
        if (form.images.length < 2) e.images = 'Please upload at least 2 photos';
        return e;
    };

    const handleNext = () => {
        const errs = validateStep1();
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }
        setErrors({});
        setStep(2);
        window.scrollTo(0, 0);
    };

    const validate = () => {
        const e: Record<string, string> = validateStep1();
        if (!form.description || form.description.length < 20) e.description = 'Provide at least 20 characters';
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
            // scroll to first error
            const firstErr = document.querySelector('[data-error="true"]');
            firstErr?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        setSubmitting(true);
        try {
            const result = await listingService.createListing({
                title: form.title,
                description: form.description,
                price: Number(form.price),
                currency: 'USD',
                location: form.location,
                category_id: form.categoryId!,
                subcategory_id: form.subcategoryId ?? undefined,
                images: form.images,
                condition: form.condition,
                attributes: form.attributes,
            });
            
            if (promoPlanId > 0 && result.id) {
                try {
                    await api.post('/promotions/', {
                        listing_id: result.id,
                        plan_id: promoPlanId,
                        payment_phone: form.phone
                    });
                    setSubmitting(false);
                    alert("M-Pesa payment prompt sent! Please check your phone (" + form.phone + ") to complete the transaction.");
                } catch (e: any) {
                    console.error(e);
                    alert("Ad posted, but failed to trigger M-Pesa prompt. " + (e.response?.data?.detail || ''));
                }
            }

            setSubmitted(true);
        } catch (err: any) {
            setErrors({ title: err.response?.data?.detail || 'Failed to post ad' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleClear = () => {
        setForm({
            title: '',
            categoryId: null,
            subcategoryId: null,
            location: '',
            images: [],
            youtubeLink: '',
            description: '',
            price: '',
            condition: 'Used',
            negotiable: 'not_sure',
            phone: user?.phone || '',
            name: user?.full_name || '',
            attributes: {},
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
                        ? <Clock size={36} color="#90D5FF" />
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
                        background: '#90D5FF', color: '#fff', padding: '12px 28px',
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
                    <CheckCircle2 size={36} color="#90D5FF" />
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
                            padding: '11px 24px', background: '#90D5FF', color: '#fff',
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
                        style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#90D5FF', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
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
                            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#90D5FF' }} />
                        </div>
                    ) : filteredCategories.map(cat => {
                        const Icon = getCategoryIcon(cat.icon_name || cat.slug);
                        return (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setForm(f => ({ ...f, categoryId: cat.id, subcategoryId: null, attributes: {} }));
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
                                        {t(`categories.${cat.name}`, cat.name)}
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
                className={`peer block w-full rounded-md border bg-transparent px-3 py-3 text-sm text-gray-900 focus:outline-none ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#90D5FF]'}`}
            />
            <label htmlFor={id} className={`absolute left-2 top-0 -translate-y-1/2 bg-white px-1 text-[11px] transition-all pointer-events-none peer-placeholder-shown:top-[14px] peer-placeholder-shown:-translate-y-0 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[11px] ${error ? 'text-red-500 peer-focus:text-red-500' : 'text-gray-500 peer-focus:text-[#90D5FF]'}`}>
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
                className={`peer block w-full rounded-md border bg-transparent px-3 py-3 text-sm focus:outline-none appearance-none ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#90D5FF]'} ${!value ? 'text-transparent' : 'text-gray-900'}`}
            >
                <option value="" disabled hidden> </option>
                {options.map(opt => <option key={opt.value} value={opt.value} className="text-gray-900">{opt.label}</option>)}
            </select>
            <label htmlFor={id} className={`absolute left-2 top-0 -translate-y-1/2 bg-white px-1 text-[11px] transition-all pointer-events-none peer-valid:top-0 peer-valid:-translate-y-1/2 peer-valid:text-[11px] peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[11px] ${!value ? 'top-[14px] -translate-y-0 text-sm' : ''} ${error ? 'text-red-500 peer-focus:text-red-500' : 'text-gray-500 peer-focus:text-[#90D5FF]'}`}>
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
                        <button type="button" onClick={() => { setStep(1); window.scrollTo(0,0); }} className="text-[#90D5FF] font-bold flex items-center text-[13px] gap-1 hover:bg-sky-50 px-2 py-1.5 rounded-md transition-colors">
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
                            step === 1 ? "bg-white border-[#90D5FF] text-[#90D5FF] shadow-sm" : "bg-gray-100 border-gray-100 text-gray-400"
                        )}>1</div>
                        <span className={cn("text-[12px] font-bold transition-colors", step === 1 ? "text-gray-900" : "text-gray-400")}>Basic info</span>
                    </div>
                    <div className="w-8 h-[2px] bg-gray-100">
                        <div className={cn("h-full bg-[#90D5FF] transition-all duration-500", step === 2 ? "w-full" : "w-0")} />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-all",
                            step === 2 ? "bg-white border-[#90D5FF] text-[#90D5FF] shadow-sm" : "bg-gray-100 border-gray-100 text-gray-400"
                        )}>2</div>
                        <span className={cn("text-[12px] font-bold transition-colors", step === 2 ? "text-gray-900" : "text-gray-400")}>Description & Price</span>
                    </div>
                </div>
            </div>

            <form onSubmit={step === 1 ? (e => e.preventDefault()) : handleSubmit} noValidate className="max-w-2xl mx-auto">
                
                {/* ── STEP 1: Basic Information ────────────────────────── */}
                <div style={{ display: step === 1 ? 'block' : 'none' }}>
                    <div className="bg-white rounded-md shadow-sm border-[1.5px] border-gray-200/60 p-5 mb-5">
                        
                        {renderFloatingInput('title', 'Title*', form.title, v => set('title', v), errors.title, { maxLength: TITLE_MAX })}

                        {/* Category Chooser */}
                        <div className="relative mb-4">
                            <button
                                type="button"
                                onClick={() => setShowCategoryPicker(true)}
                                className={`flex w-full items-center justify-between rounded-md border bg-transparent px-3 py-[13px] text-sm focus:outline-none appearance-none transition-colors ${errors.categoryId ? 'border-red-500' : 'border-gray-300 hover:border-gray-400'}`}
                            >
                                <span className={selectedCategory ? 'text-gray-900 font-medium' : 'text-transparent'}>{selectedCategory ? t(`categories.${selectedCategory.name}`, selectedCategory.name) : ' '}</span>
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
                                <span className="text-[#90D5FF] font-bold">First picture is the title picture.</span> <span className="text-gray-500 font-medium">You can change the order of photos: just grab your photos and drag</span>
                            </p>
                            <div className="flex flex-wrap gap-2 mb-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-[72px] h-[72px] rounded-md bg-[#eef8ff] flex items-center justify-center cursor-pointer transition-colors hover:bg-sky-100 flex-shrink-0"
                                >
                                    {uploading ? <Loader2 className="w-6 h-6 text-[#90D5FF] animate-spin" /> : <Plus strokeWidth={2.5} className="w-6 h-6 text-[#90D5FF]" />}
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
                                className="block w-full rounded-md border border-gray-300 bg-transparent px-4 py-[13px] text-[15px] font-medium text-gray-900 focus:outline-none focus:border-[#90D5FF] placeholder:text-gray-500 placeholder:font-normal"
                            />
                        </div>

                        <button type="button" onClick={handleNext} className="mt-2 w-full bg-[#90D5FF] hover:bg-sky-600 active:scale-[0.98] text-white font-bold text-[15px] py-3.5 rounded-md transition-all flex items-center justify-center shadow-sm">
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
                            renderFloatingSelect('subcategory', 'Subcategory', form.subcategoryId?.toString() || "", v => {
                                setForm(f => ({ ...f, subcategoryId: Number(v), attributes: {} })); setErrors({});
                            }, selectedCategory.subcategories.map((s:any) => ({value: s.id.toString(), label: t(`categories.${s.name}`, s.name)})), undefined)
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
                            <textarea 
                                id="description"
                                value={form.description}
                                onChange={e => set('description', e.target.value)}
                                maxLength={850}
                                rows={4}
                                placeholder=" "
                                className={`peer block w-full rounded-md border bg-transparent px-3 py-3 text-sm text-gray-900 focus:outline-none resize-y ${errors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#90D5FF]'}`}
                            />
                            <label htmlFor="description" className={`absolute left-2 top-0 -translate-y-1/2 bg-white px-1 text-[11px] transition-all pointer-events-none peer-placeholder-shown:top-[14px] peer-placeholder-shown:-translate-y-0 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[11px] font-medium ${errors.description ? 'text-red-500 peer-focus:text-red-500' : 'text-gray-500 peer-focus:text-[#90D5FF]'}`}>
                                Description*
                            </label>
                            <div className="flex justify-end mt-1">
                                <span className="text-[10px] text-gray-400">{form.description.length} / 850</span>
                            </div>
                            {errors.description && <p className="text-[11px] text-red-500 -mt-3">{errors.description}</p>}
                        </div>

                        {/* Price Input */}
                        <div className="flex justify-center mb-4">
                            <div className="w-full sm:w-2/3">
                                <div className={`relative flex border rounded-md overflow-visible bg-white transition-colors outline-none focus-within:border-[#90D5FF] ${errors.price ? 'border-red-500' : 'border-gray-300'}`}>
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
                                                <div className="relative mb-4 flex border rounded-md overflow-hidden bg-white focus-within:border-[#90D5FF] border-gray-300">
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
                                                className="w-4 h-4 text-[#90D5FF] focus:ring-[#90D5FF] border-gray-300 accent-[#90D5FF]"
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

                    {/* CARD 2: Delivery placeholder */}
                    <div className="bg-white rounded-md shadow-sm border border-gray-200 p-5 mb-5 flex flex-col items-center">
                        <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2 text-gray-900 w-full sm:w-2/3 px-1">
                            <Truck size={18} className="text-gray-800" /> Delivery
                        </h3>
                        <div className="w-full sm:w-2/3 border border-gray-300 rounded-md p-3 text-sm text-[#90D5FF] flex justify-between items-center cursor-pointer hover:bg-sky-50 transition-colors">
                            <span className="font-medium">Add delivery options</span>
                            <ChevronRight size={18} className="text-gray-400" />
                        </div>
                    </div>

                    {/* CARD 3: Promote */}
                    <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6 mb-5 flex flex-col items-center">
                        <div className="w-full sm:w-4/5 flex flex-col">
                            <h3 className="font-bold text-[19px] mb-1 text-gray-900">Promote your ad</h3>
                            <p className="text-[13px] text-[#90D5FF] mb-6 font-medium">Choose a promotion type for your ad to post it</p>

                            <label className={`border border-gray-200 rounded-md p-4 mb-4 flex justify-between items-center cursor-pointer transition-colors ${promoPlanId === 0 ? 'bg-sky-50/40 border-[#90D5FF] shadow-sm' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    <input type="radio" name="promo" checked={promoPlanId === 0} onChange={() => setPromoPlanId(0)} className="w-4 h-4 text-[#90D5FF] focus:ring-[#90D5FF] accent-[#90D5FF]" />
                                    <span className="font-bold text-[15px] text-gray-900">No promo</span>
                                </div>
                                <span className="text-gray-400 text-sm font-medium">free</span>
                            </label>

                            <label className={`border border-gray-200 rounded-md p-4 mb-4 flex justify-between items-center cursor-pointer transition-colors ${promoPlanId === 1 ? 'bg-sky-50/40 border-[#90D5FF] shadow-sm' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    <input type="radio" name="promo" checked={promoPlanId === 1} onChange={() => setPromoPlanId(1)} className="w-4 h-4 text-[#90D5FF] focus:ring-[#90D5FF] accent-[#90D5FF]" />
                                    <div>
                                        <span className="font-bold text-[15px] block mb-2 text-gray-900">TOP promo</span>
                                        <div className="flex gap-2">
                                            <span className="bg-[#eef8ff] text-[#90D5FF] px-3 py-1 rounded-full text-[11px] font-bold">7 days</span>
                                            <span className="bg-white border border-sky-300 text-[#90D5FF] px-3 py-1 rounded-full text-[11px] font-bold shadow-sm">30 days</span>
                                        </div>
                                    </div>
                                </div>
                                <span className="font-bold text-gray-900">KSh 455</span>
                            </label>

                            <label className={`border border-gray-200 rounded-md p-4 mb-6 flex justify-between items-center cursor-pointer transition-colors ${promoPlanId === 2 ? 'bg-sky-50/40 border-[#90D5FF] shadow-sm' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    <input type="radio" name="promo" checked={promoPlanId === 2} onChange={() => setPromoPlanId(2)} className="w-4 h-4 text-[#90D5FF] focus:ring-[#90D5FF] accent-[#90D5FF]" />
                                    <div>
                                        <span className="font-bold text-[15px] block mb-2 text-gray-900">Boost Premium promo</span>
                                        <span className="bg-[#eef8ff] text-[#90D5FF] px-3 py-1 rounded-full text-[11px] font-bold">1 month</span>
                                    </div>
                                </div>
                                <span className="font-bold text-gray-900">KSh 2,449</span>
                            </label>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-[#90D5FF] hover:bg-sky-600 active:scale-[0.98] text-white font-bold text-[17px] py-3.5 rounded-md transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                {submitting && <Loader2 size={20} className="animate-spin" />}
                                Post ad
                            </button>
                            
                            <p className="text-[10px] text-gray-500 mt-5 leading-relaxed text-center px-4">
                                By clicking on Post Ad, you accept the <a href="#" className="text-[#90D5FF] hover:underline">Terms of Use</a>, confirm that you will abide by the Safety Tips, and declare that this posting does not include any Prohibited Items.
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
        </div>
    );
};

export { PostAdPage };
