import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Plus, X, Shield, ShieldAlert, Clock, CheckCircle2, Loader2, Zap, Sparkles } from 'lucide-react';

import { listingService } from '../services/listingService';
import { getImageUrl } from '../utils/imageUtils';
import { getCategoryIcon } from '../utils/categoryIcons';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { useLanguageField } from '../hooks/useLanguageField';
import { LipanaPaymentModal } from '../components/LipanaPaymentModal';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../utils/cn';
import { aiService } from '../services/aiService';
import { promotionService } from '../services/promotionService';

const KES_RATE = 130; // 1 USD = 130 KES


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
    image_hashes: string[];
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
    const { user, updateUser } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { id } = useParams();
    const isEditMode = !!id;

    const [form, setForm] = useState<FormValues>({
        title_en: '',
        title_so: '',
        categoryId: null,
        subcategoryId: null,
        subsubcategoryId: null,
        location: '',
        images: [],
        image_hashes: [],
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
    const [currency, setCurrency] = useState<'USD' | 'KES'>('USD');
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
    const [aiLoading, setAiLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);


    const { data: verificationStatus } = useQuery({
        queryKey: ['verification-status'],
        queryFn: () => import('../services/api').then(m => m.default.get('/verifications/me').then(r => r.data)),
        enabled: !!user && !user.is_verified,
        // Poll every 30s while pending so the gate lifts automatically when admin approves
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            return status === 'pending' ? 30_000 : false;
        },
    });

    // When the backend marks the verification approved, sync the auth store immediately
    // so the user can post without needing to log out and back in
    useEffect(() => {
        if (verificationStatus?.status === 'approved' && user && !user.is_verified) {
            updateUser({ is_verified: true });
        }
    }, [verificationStatus?.status]);

    const [ownerId, setOwnerId] = useState<number | null>(null);


    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const oid = params.get('owner_id');
        if (oid && user?.is_admin) {
            setOwnerId(Number(oid));
        }
    }, [user]);

    useEffect(() => {
        if (isEditMode && id) {
            listingService.getListing(Number(id))
                .then(listing => {
                    setForm({
                        title_en: listing.title_en || '',
                        title_so: listing.title_so || '',
                        categoryId: listing.category_id || null,
                        subcategoryId: listing.subcategory_id || null,
                        subsubcategoryId: listing.subsubcategory_id || null,
                        location: listing.location || '',
                        images: listing.images || [],
                        image_hashes: listing.image_hashes || [],
                        youtubeLink: listing.youtube_link || '',
                        description_en: listing.description_en || '',
                        description_so: listing.description_so || '',
                        price: listing.price ? String(listing.price) : '',
                        condition: listing.condition || 'Used',
                        negotiable: listing.is_negotiable ? 'yes' : 'no',
                        phone: user?.phone || '',
                        name: user?.full_name || '',
                        attributes: listing.attributes || {},
                        lang_available: (listing.title_en && listing.title_so) ? 'both' : (listing.title_so ? 'so' : 'en'),
                    });
                })
                .catch(e => console.error("Failed to load listing for editing", e));
        }
    }, [id, isEditMode, user]);

    const { data: categories = [], isLoading: catsLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: listingService.getCategories,
    });

    const { data: promotionPlans = [] } = useQuery({

        queryKey: ['promotionPlans'],
        queryFn: promotionService.getPlans,
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

    const [imageWarning, setImageWarning] = useState<string | null>(null);

    const checkImageQuality = (file: File): Promise<string | null> =>
        new Promise(resolve => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                if (file.size < 50_000) return resolve(`"${file.name}" is very small — may appear blurry.`);
                if (img.width < 300 || img.height < 300) return resolve(`"${file.name}" is low resolution (${img.width}×${img.height}px). Use a clearer photo.`);
                resolve(null);
            };
            img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
            img.src = url;
        });

    const handleImageUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        setImageWarning(null);

        const warnings: string[] = [];
        for (const file of Array.from(files)) {
            const w = await checkImageQuality(file);
            if (w) warnings.push(w);
        }
        if (warnings.length) setImageWarning(warnings.join(' '));

        for (const file of Array.from(files)) {
            try {
                const result = await listingService.uploadImage(file);
                setForm(f => ({ 
                    ...f, 
                    images: [...f.images, result.url],
                    image_hashes: [...f.image_hashes, result.phash || '']
                }));
            } catch {
                // silently skip failed uploads
            }
        }
        setUploading(false);
    };

    const removeImage = (idx: number) => {
        setForm(f => ({ 
            ...f, 
            images: f.images.filter((_, i) => i !== idx),
            image_hashes: f.image_hashes.filter((_, i) => i !== idx)
        }));
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

    const doCreateListing = async () => {
        setSubmitting(true);
        try {
            const payload = {
                title_en: form.title_en,
                title_so: form.title_so,
                description_en: form.description_en,
                description_so: form.description_so,
                price: Number(form.price),
                currency: currency,
                category_id: form.categoryId!,
                subcategory_id: form.subcategoryId ?? undefined,
                subsubcategory_id: form.subsubcategoryId ?? undefined,
                location: form.location,
                images: form.images,
                youtube_link: form.youtubeLink,
                condition: form.condition,
                is_negotiable: form.negotiable === 'yes',
                attributes: {
                    ...form.attributes,
                    negotiable: form.negotiable,
                },
                lang_available: form.lang_available,
                image_hashes: form.image_hashes,
            };
            let result;
            if (isEditMode && id) {
                result = await listingService.updateListing(Number(id), payload);
                setCreatedListingId(result.id);
                setCreatedListingTitle(result.title_en || result.title_so || '');
                setSubmitted(true);
            } else {
                result = await listingService.createListing(payload, ownerId || undefined);
                setCreatedListingId(result.id);
                setCreatedListingTitle(result.title_en || result.title_so || '');
                setSubmitted(true);
            }
            if (promoPlanId > 0 && result.id) {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) {
            setErrors(errs);
            if ((errs.title_en || errs.description_en) && formTab === 'so') setFormTab('en');
            else if ((errs.title_so || errs.description_so) && formTab === 'en') setFormTab('so');
            const firstErr = document.querySelector('[data-error="true"]');
            firstErr?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        await doCreateListing();
    };


    const handleLipanaConfirm = async (phone: string): Promise<{ promoId?: number; error?: string }> => {
        if (!createdListingId || !promoPlanId) return { error: 'Missing listing or plan' };
        try {
            const result = await promotionService.createPromotion(
                createdListingId,
                promoPlanId,
                phone
            );
            return { promoId: result.id };
        } catch (e: any) {
            return { error: e?.response?.data?.detail || 'Payment initiation failed. Please try again.' };
        }
    };

    const handleLipanaPollStatus = async (promoId: number) => {
        return promotionService.checkPayment(promoId);
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
            image_hashes: [],
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
        const isVerified = user?.is_verified;
        return (
            <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 16px', textAlign: 'center' }}>
                <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: isVerified ? '#f0fdf4' : '#f4fbff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 24px',
                }}>
                    <CheckCircle2 size={36} color={isVerified ? '#16a34a' : 'var(--color-primary-500)'} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
                    {isVerified ? '🎉 Your Ad is Now Live!' : 'Ad Posted Successfully!'}
                </h2>
                <p style={{ color: '#6b7280', marginBottom: 8, lineHeight: 1.6 }}>
                    {isVerified
                        ? 'Your listing is published and visible to buyers right now.'
                        : 'Your ad is being reviewed by our team. It will be live shortly.'
                    }
                </p>
                {isVerified && (
                    <p style={{ color: '#16a34a', fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
                        ✓ Verified seller — instant publishing enabled
                    </p>
                )}
                {!isVerified && (
                    <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 24 }}>
                        Get verified to have your future ads go live instantly.
                    </p>
                )}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {isVerified && createdListingId && (
                        <Link to={`/listing/${createdListingId}`} style={{
                            padding: '11px 24px', background: '#16a34a', color: '#fff',
                            borderRadius: 10, fontWeight: 600, textDecoration: 'none',
                        }}>
                            View Live Ad
                        </Link>
                    )}
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

                {/* Impersonation Banner */}
                {ownerId && (
                    <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-xl mb-3 text-amber-700 text-xs font-bold">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <span>Impersonation Active: Posting on behalf of User #{ownerId}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setOwnerId(null)}
                            className="text-amber-800 hover:underline"
                        >
                            Cancel
                        </button>
                    </div>
                )}

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
                    {/* 10-Second Listing: AI Quick Post */}
                    <div className="bg-gradient-to-br from-[#00BFFF]/10 to-white rounded-2xl shadow-sm border-[1.5px] border-[#00BFFF]/30 p-6 mb-6 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Sparkles size={120} className="text-primary-500 fill-primary-500" />
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="h-5 w-5 text-primary-500 fill-primary-500" />
                            <h3 className="text-[16px] font-extrabold text-gray-900 tracking-tight">10-Second Listing</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4 font-medium">Type a simple sentence like <span className="text-gray-900 font-bold">"iPhone 11 25k Nairobi"</span> and let AI fill the rest.</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                placeholder="What are you selling? (e.g. iPhone 11 25k Nairobi)"
                                className="w-full sm:flex-1 rounded-xl border border-primary-200 bg-white p-3.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder-gray-400 font-medium"
                                id="ai-quick-post"
                                disabled={aiLoading}
                            />
                            <button
                                type="button"
                                disabled={aiLoading}
                                onClick={async () => {
                                    const text = (document.getElementById('ai-quick-post') as HTMLInputElement)?.value;
                                    if (!text) return;
                                    setAiLoading(true);
                                    try {
                                        const res = await aiService.parseListing(text);
                                        if (res.title_en) set('title_en', res.title_en);
                                        if (res.title_so) set('title_so', res.title_so);
                                        if (res.description_en) set('description_en', res.description_en);
                                        if (res.description_so) set('description_so', res.description_so);
                                        if (res.price) set('price', String(res.price));
                                        if (res.category_id) set('categoryId', res.category_id);
                                        if (res.condition) set('condition', res.condition);
                                        if (res.is_negotiable !== undefined) set('negotiable', res.is_negotiable ? 'yes' : 'no');
                                        set('lang_available', 'both');
                                        (document.getElementById('ai-quick-post') as HTMLInputElement).value = '';
                                    } catch (e: any) {
                                        console.error("AI Parsing Error:", e?.response?.data || e.message || e);
                                        alert("AI processing failed. Please ensure the backend server is running and updated.");
                                    } finally {
                                        setAiLoading(false);
                                    }
                                }}
                                className="w-full sm:w-auto bg-primary-500 text-white px-5 py-3.5 rounded-xl text-sm font-extrabold shadow-md hover:bg-primary-600 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-70"
                            >
                                {aiLoading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Thinking...
                                    </>
                                ) : (
                                    <>
                                        <Zap size={16} className="fill-white" />
                                        ✨ Auto-fill
                                    </>
                                )}
                            </button>
                        </div>

                    </div>


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

                        {/* Photos section — drag & drop */}
                        <div className="mt-8 mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-gray-900 text-[15px]">Add photos</h3>
                                <span className="text-[11px] text-gray-400 font-medium">{form.images.length}/10 photos</span>
                            </div>
                            <p className="text-[12px] text-gray-500 mb-3 pl-0.5">
                                <span className="text-primary-500 font-bold">First photo is the cover.</span> Min 1 required.
                            </p>

                            {/* Drag-drop zone */}
                            <div
                                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={e => { e.preventDefault(); setIsDragOver(false); handleImageUpload(e.dataTransfer.files); }}
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all mb-3 select-none",
                                    isDragOver ? "border-primary-500 bg-primary-50 scale-[1.01]" : "border-gray-200 hover:border-primary-300 hover:bg-gray-50",
                                    uploading && "opacity-60 pointer-events-none"
                                )}
                            >
                                {uploading ? (
                                    <Loader2 className="w-7 h-7 text-primary-500 animate-spin mb-2" />
                                ) : (
                                    <Plus strokeWidth={2} className="w-7 h-7 text-primary-400 mb-2" />
                                )}
                                <p className="text-sm font-bold text-gray-600">
                                    {isDragOver ? "Drop images here" : "Drag & drop or tap to upload"}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG — up to 10 photos</p>
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={e => handleImageUpload(e.target.files)} />

                            {/* Image grid preview */}
                            {form.images.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mt-2">
                                    {form.images.map((url, i) => (
                                        <div key={i} className="relative aspect-square">
                                            <img src={getImageUrl(url)} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                                            {i === 0 && (
                                                <span className="absolute bottom-1 left-1 bg-primary-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">Cover</span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                className="absolute -top-1.5 -right-1.5 bg-red-500 w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                                            >
                                                <X size={10} color="white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {imageWarning && (
                                <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                                    <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-amber-700 font-medium">{imageWarning}</p>
                                </div>
                            )}
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
                                <div className="relative">
                                    <textarea 
                                        id="description_en"
                                        value={form.description_en}
                                        onChange={e => set('description_en', e.target.value)}
                                        maxLength={2000}
                                        rows={4}
                                        placeholder="Describe your item in English..."
                                        className={`peer block w-full rounded-md border bg-transparent px-3 py-3 text-sm text-gray-900 focus:outline-none resize-y ${errors.description_en ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'}`}
                                    />
                                </div>
                            ) : (
                                <div className="relative">
                                    <textarea 
                                        id="description_so"
                                        value={form.description_so}
                                        onChange={e => set('description_so', e.target.value)}
                                        maxLength={2000}
                                        rows={4}
                                        placeholder="Sharaxaad ka bixi alaabtaada (Somali)..."
                                        className={`peer block w-full rounded-md border bg-transparent px-3 py-3 text-sm text-gray-900 focus:outline-none resize-y ${errors.description_so ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'}`}
                                    />
                                </div>

                            )}
                            <div className="flex justify-end mt-1">
                                <span className="text-[10px] text-gray-400">
                                    {formTab === 'en' ? form.description_en.length : form.description_so.length} / 2000
                                </span>
                            </div>
                            {errors.description_en && formTab === 'en' && <p className="text-[11px] text-red-500 -mt-1">{errors.description_en}</p>}
                            {errors.description_so && formTab === 'so' && <p className="text-[11px] text-red-500 -mt-1">{errors.description_so}</p>}
                        </div>

                        {/* Price Input with Currency Toggle */}
                        <div className="flex justify-center mb-4">
                            <div className="w-full sm:w-2/3">
                                <div className={`relative flex border rounded-md overflow-visible bg-white transition-colors outline-none focus-within:border-primary-500 ${errors.price ? 'border-red-500' : 'border-gray-300'}`}>
                                    <div className="absolute left-2 top-0 -translate-y-1/2 bg-white px-1 text-[11px] text-gray-500 font-medium pointer-events-none z-10 hidden sm:block">
                                        Price*
                                    </div>
                                    {/* Currency Toggle */}
                                    <div className="flex border-r border-gray-200 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (currency === 'KES') {
                                                    // Convert KES → USD
                                                    const usd = form.price ? Math.round((Number(form.price) / KES_RATE) * 100) / 100 : '';
                                                    set('price', String(usd));
                                                    setCurrency('USD');
                                                } else {
                                                    // Convert USD → KES
                                                    const kes = form.price ? Math.round(Number(form.price) * KES_RATE) : '';
                                                    set('price', String(kes));
                                                    setCurrency('KES');
                                                }
                                            }}
                                            className="flex items-center gap-1 px-3 py-3 bg-gray-50 hover:bg-gray-100 transition-colors rounded-l-md"
                                            title="Switch currency"
                                        >
                                            <span className="text-sm font-bold text-gray-700">
                                                {currency === 'USD' ? '$ USD' : 'KSh'}
                                            </span>
                                            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                                            </svg>
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        value={form.price}
                                        onChange={e => set('price', e.target.value)}
                                        placeholder={currency === 'USD' ? '0.00' : '0'}
                                        className="flex-1 w-full px-3 py-3 text-sm bg-transparent outline-none text-gray-900 font-medium"
                                        min="0"
                                        step={currency === 'USD' ? '0.01' : '1'}
                                    />
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1.5 pl-1">
                                    {currency === 'USD'
                                        ? form.price ? `≈ KSh ${Math.round(Number(form.price) * KES_RATE).toLocaleString()}` : 'Tap currency label to switch to KSh'
                                        : form.price ? `≈ $${(Number(form.price) / KES_RATE).toFixed(2)} USD` : 'Tap currency label to switch to USD'
                                    }
                                </p>
                                {errors.price && <p className="text-[11px] text-red-500 mt-1 pl-1">{errors.price}</p>}
                            </div>
                        </div>


                        {/* Bulk Price */}
                        <div className="flex justify-center mb-6">
                            <div className="w-full sm:w-2/3">
                                {!showBulkPrice ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkPrice(true)}
                                        className="w-full border border-dashed border-gray-300 rounded-md p-3 flex justify-between items-center hover:border-primary-400 hover:bg-primary-50 transition-all group"
                                    >
                                        <span className="text-sm text-gray-500 font-medium group-hover:text-primary-600">+ Add bulk / wholesale price</span>
                                        <ChevronRight size={16} className="text-gray-400 group-hover:text-primary-500" />
                                    </button>
                                ) : (
                                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <span className="text-[14px] font-bold text-gray-900">Bulk Pricing</span>
                                                <p className="text-[11px] text-gray-400 mt-0.5">Set a discounted price for large orders</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => { setShowBulkPrice(false); setAttribute('bulk_quantity', undefined); setAttribute('bulk_price', undefined); }}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            {/* Min Quantity */}
                                            <div className="flex-1">
                                                <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Min. Quantity</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    placeholder="e.g. 10"
                                                    value={form.attributes.bulk_quantity || ''}
                                                    onChange={e => setAttribute('bulk_quantity', e.target.value)}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm outline-none focus:border-primary-500 bg-white text-gray-900"
                                                />
                                            </div>
                                            {/* Bulk Price with currency */}
                                            <div className="flex-1">
                                                <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Price per unit</label>
                                                <div className="flex border border-gray-300 rounded-md overflow-hidden focus-within:border-primary-500 bg-white">
                                                    <span className="bg-gray-50 border-r border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700 whitespace-nowrap">
                                                        {currency === 'USD' ? '$ USD' : 'KSh'}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step={currency === 'USD' ? '0.01' : '1'}
                                                        placeholder={currency === 'USD' ? '0.00' : '0'}
                                                        value={form.attributes.bulk_price || ''}
                                                        onChange={e => setAttribute('bulk_price', e.target.value)}
                                                        className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none text-gray-900"
                                                    />
                                                </div>
                                                {form.attributes.bulk_price && (
                                                    <p className="text-[11px] text-gray-400 mt-1">
                                                        {currency === 'USD'
                                                            ? `≈ KSh ${Math.round(Number(form.attributes.bulk_price) * KES_RATE).toLocaleString()}`
                                                            : `≈ $${(Number(form.attributes.bulk_price) / KES_RATE).toFixed(2)} USD`
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {form.attributes.bulk_quantity && form.attributes.bulk_price && (
                                            <div className="mt-3 p-2.5 bg-primary-50 rounded-md border border-primary-100">
                                                <p className="text-[12px] text-primary-700 font-semibold">
                                                    ✓ Buy {form.attributes.bulk_quantity}+ units at {currency === 'USD' ? `$${form.attributes.bulk_price}` : `KSh ${Number(form.attributes.bulk_price).toLocaleString()}`} each
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Negotiation Options */}
                        <div className="mb-6 flex justify-center">
                            <div className="w-full sm:w-2/3">
                                <p className="text-[13px] font-bold text-gray-900 mb-3">Are you open to negotiation?</p>
                                <div className="flex gap-2">
                                    {(['yes', 'no', 'not_sure'] as const).map(val => {
                                        const label = val === 'yes' ? 'Yes' : val === 'no' ? 'No' : 'Not sure';
                                        const isSelected = form.negotiable === val;
                                        return (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => set('negotiable', val)}
                                                className={cn(
                                                    'flex-1 py-2.5 px-3 rounded-lg border-2 text-[13px] font-semibold transition-all active:scale-95',
                                                    isSelected
                                                        ? val === 'yes'
                                                            ? 'border-green-500 bg-green-50 text-green-700'
                                                            : val === 'no'
                                                            ? 'border-red-400 bg-red-50 text-red-700'
                                                            : 'border-primary-400 bg-primary-50 text-primary-700'
                                                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                                                )}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2">
                                    {form.negotiable === 'yes' && '✓ Buyers can send you offers'}
                                    {form.negotiable === 'no' && 'Price is fixed — no offers accepted'}
                                    {form.negotiable === 'not_sure' && "You'll decide when contacted"}
                                </p>
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
                planName={promoPlanId > 0 ? getField(promotionPlans.find((p: any) => p.id === promoPlanId) || {}, 'name') : ''}
                listingTitle={createdListingTitle}
            />
        </div>
    );
};

export { PostAdPage };
