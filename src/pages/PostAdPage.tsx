import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Plus, X, Shield, ShieldAlert, Clock, CheckCircle2, Loader2 } from 'lucide-react';

import { listingService } from '../services/listingService';
import { getImageUrl } from '../utils/imageUtils';
import { getCategoryIcon } from '../utils/categoryIcons';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { useAuthStore } from '../store/useAuthStore';


const TITLE_MAX = 70;

type Negotiable = 'yes' | 'no' | 'not_sure';

interface FormValues {
    title: string;
    categoryId: number | null;
    subcategoryId: number | null;
    location: string;
    images: string[];
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
        description: '',
        price: '',
        condition: 'Used',
        negotiable: 'not_sure',
        phone: user?.phone || '',
        name: user?.full_name || '',
        attributes: {},
    });

    const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
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

    const validate = () => {
        const e: Partial<Record<keyof FormValues, string>> = {};
        if (!form.title || form.title.length < 10) e.title = 'Length should be greater than 10';
        if (!form.categoryId) e.categoryId = 'Please select a category';
        if (!form.location) e.location = 'Please select a location';
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
            await listingService.createListing({
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
            description: '',
            price: '',
            condition: 'Used',
            negotiable: 'not_sure',
            phone: user?.phone || '',
            name: user?.full_name || '',
            attributes: {},
        });
        setErrors({});
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
    return (
        <div style={{ maxWidth: 640, margin: '0 auto', paddingBottom: 60 }}>
            {/* Page header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px', background: '#fff',
                borderBottom: '1px solid #e5e7eb', marginBottom: 12,
            }}>
                <span style={{ fontWeight: 700, fontSize: 17, color: '#111827' }}>Post ad</span>
                <button
                    type="button"
                    onClick={handleClear}
                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 15 }}
                >
                    Clear
                </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <div style={{ background: '#fff', borderRadius: 12, margin: '0 0 12px', padding: '20px 16px' }}>

                    {/* Title */}
                    <div style={{ marginBottom: 14, position: 'relative' }} data-error={!!errors.title || undefined}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: '#9ca3af' }}>{form.title.length} / {TITLE_MAX}</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Title*"
                            maxLength={TITLE_MAX}
                            value={form.title}
                            onChange={e => set('title', e.target.value)}
                            style={{
                                width: '100%', padding: '12px 14px',
                                border: `1.5px solid ${errors.title ? '#ef4444' : '#d1d5db'}`,
                                borderRadius: 10, fontSize: 16, outline: 'none', boxSizing: 'border-box',
                                transition: 'border-color 0.15s',
                            }}
                            onFocus={e => { e.currentTarget.style.borderColor = errors.title ? '#ef4444' : '#90D5FF'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = errors.title ? '#ef4444' : '#d1d5db'; }}
                        />
                        {errors.title && (
                            <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.title}</p>
                        )}
                    </div>

                    {/* Category */}
                    <div style={{ marginBottom: 14 }} data-error={!!errors.categoryId || undefined}>
                        <button
                            type="button"
                            onClick={() => setShowCategoryPicker(true)}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '13px 14px',
                                border: `1.5px solid ${errors.categoryId ? '#ef4444' : '#d1d5db'}`,
                                borderRadius: 10, background: '#fff', cursor: 'pointer',
                                fontSize: 16, color: selectedCategory ? '#111827' : '#9ca3af',
                                boxSizing: 'border-box',
                            }}
                        >
                            <span>{selectedCategory ? t(`categories.${selectedCategory.name}`, selectedCategory.name) : 'Category*'}</span>
                            <ChevronRight size={18} color="#9ca3af" />
                        </button>
                        {errors.categoryId && (
                            <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.categoryId as string}</p>
                        )}
                    </div>

                    {/* Subcategory (if available) */}
                    {selectedCategory?.subcategories && selectedCategory.subcategories.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                            <select
                                value={form.subcategoryId ?? ''}
                                onChange={e => {
                                    setForm(f => ({ ...f, subcategoryId: e.target.value ? Number(e.target.value) : null, attributes: {} }));
                                    setErrors({});
                                }}
                                style={{
                                    width: '100%', padding: '13px 14px',
                                    border: '1.5px solid #d1d5db', borderRadius: 10,
                                    fontSize: 16, background: '#fff', color: form.subcategoryId ? '#111827' : '#9ca3af',
                                    appearance: 'none', outline: 'none', boxSizing: 'border-box',
                                }}
                            >
                                <option value="">Subcategory (optional)</option>
                                {selectedCategory.subcategories.map((sub: any) => (
                                    <option key={sub.id} value={sub.id}>
                                        {String(t(`categories.${sub.name}`, sub.name))}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Dynamic Fields */}
                    {dynamicSchema.length > 0 && (
                        <div style={{ marginTop: 4, marginBottom: 14 }}>
                            {dynamicSchema.filter(f => f.name !== 'condition').map(field => {
                                const errKey = `attr_${field.name}` as any;
                                const fieldError = errors[errKey];
                                return (
                                    <div key={field.name} style={{ marginBottom: 14 }} data-error={!!fieldError || undefined}>
                                        {field.type === 'select' ? (
                                            <select
                                                value={form.attributes[field.name] || ''}
                                                onChange={e => setAttribute(field.name, e.target.value)}
                                                style={{
                                                    width: '100%', padding: '13px 14px',
                                                    border: `1.5px solid ${fieldError ? '#ef4444' : '#d1d5db'}`, borderRadius: 10,
                                                    fontSize: 16, background: '#fff', color: form.attributes[field.name] ? '#111827' : '#9ca3af',
                                                    appearance: 'none', outline: 'none', boxSizing: 'border-box',
                                                }}
                                            >
                                                <option value="">{field.label}{field.required ? '*' : ' (optional)'}</option>
                                                {(field.options || []).map((opt: string) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type={field.type === 'number' ? 'number' : 'text'}
                                                placeholder={`${field.label}${field.required ? '*' : ' (optional)'}`}
                                                value={form.attributes[field.name] || ''}
                                                onChange={e => setAttribute(field.name, e.target.value)}
                                                style={{
                                                    width: '100%', padding: '13px 14px',
                                                    border: `1.5px solid ${fieldError ? '#ef4444' : '#d1d5db'}`, borderRadius: 10,
                                                    fontSize: 16, outline: 'none', boxSizing: 'border-box', background: '#fff'
                                                }}
                                                onFocus={e => { e.currentTarget.style.borderColor = fieldError ? '#ef4444' : '#90D5FF'; }}
                                                onBlur={e => { e.currentTarget.style.borderColor = fieldError ? '#ef4444' : '#d1d5db'; }}
                                            />
                                        )}
                                        {fieldError && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{fieldError}</p>}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Location */}
                    <div style={{ marginBottom: 14 }} data-error={!!errors.location || undefined}>
                        <button
                            type="button"
                            onClick={() => setIsLocationOpen(true)}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '13px 14px',
                                border: `1.5px solid ${errors.location ? '#ef4444' : '#d1d5db'}`,
                                borderRadius: 10, background: '#fff', cursor: 'pointer',
                                fontSize: 16, color: form.location ? '#111827' : '#9ca3af',
                                boxSizing: 'border-box',
                            }}
                        >
                            <span>{form.location || 'Select Location*'}</span>
                            <ChevronRight size={18} color="#9ca3af" />
                        </button>
                        {errors.location && (
                            <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.location}</p>
                        )}
                    </div>

                    {/* Add photo */}
                    <div style={{ marginBottom: 8 }}>
                        <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, color: '#111827' }}>Add photo</p>
                        <p style={{ fontSize: 13, color: '#90D5FF', marginBottom: 10 }}>
                            First picture is the title picture. You can change the order by drag &amp; drop.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                            {/* Upload button */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                style={{
                                    width: 72, height: 72, border: '2px dashed #90D5FF', borderRadius: 10,
                                    background: '#f4fbff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: uploading ? 'not-allowed' : 'pointer', flexShrink: 0,
                                }}
                            >
                                {uploading
                                    ? <Loader2 size={22} color="#90D5FF" style={{ animation: 'spin 1s linear infinite' }} />
                                    : <Plus size={26} color="#90D5FF" />
                                }
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png"
                                multiple
                                style={{ display: 'none' }}
                                onChange={e => handleImageUpload(e.target.files)}
                            />

                            {/* Uploaded images */}
                            {form.images.map((url, i) => (
                                <div key={i} style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                                    <img
                                        src={getImageUrl(url)}
                                        alt={`Photo ${i + 1}`}
                                        style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, border: '1px solid #e5e7eb' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(i)}
                                        style={{
                                            position: 'absolute', top: -6, right: -6,
                                            background: '#ef4444', border: 'none', borderRadius: '50%', width: 20, height: 20,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
                                        }}
                                    >
                                        <X size={12} color="#fff" />
                                    </button>
                                    {i === 0 && (
                                        <span style={{
                                            position: 'absolute', bottom: 0, left: 0, right: 0,
                                            background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 9, fontWeight: 600,
                                            textAlign: 'center', padding: '2px 0', borderRadius: '0 0 10px 10px',
                                        }}>TITLE</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p style={{ fontSize: 12, color: '#9ca3af' }}>Supported formats are * .jpg and * .png</p>
                    </div>
                </div>

                {/* Details section */}
                <div style={{ background: '#fff', borderRadius: 12, margin: '0 0 12px', padding: '20px 16px' }}>

                    {/* Description */}
                    <div style={{ marginBottom: 14 }} data-error={!!errors.description || undefined}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: '#9ca3af' }}>{form.description.length} / 850</span>
                        </div>
                        <textarea
                            placeholder="Description*"
                            maxLength={850}
                            rows={5}
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            style={{
                                width: '100%', padding: '12px 14px', resize: 'vertical',
                                border: `1.5px solid ${errors.description ? '#ef4444' : '#d1d5db'}`,
                                borderRadius: 10, fontSize: 16, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                            }}
                            onFocus={e => { e.currentTarget.style.borderColor = errors.description ? '#ef4444' : '#90D5FF'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = errors.description ? '#ef4444' : '#d1d5db'; }}
                        />
                        {errors.description && (
                            <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.description}</p>
                        )}
                    </div>

                    {/* Condition */}
                    <div style={{ marginBottom: 14 }}>
                        <select
                            value={form.condition}
                            onChange={e => set('condition', e.target.value)}
                            style={{
                                width: '100%', padding: '13px 14px',
                                border: '1.5px solid #d1d5db', borderRadius: 10,
                                fontSize: 16, background: '#fff', color: '#111827',
                                appearance: 'none', outline: 'none', boxSizing: 'border-box',
                            }}
                        >
                            <option value="New">New</option>
                            <option value="Used">Used</option>
                            <option value="Refurbished">Refurbished</option>
                        </select>
                    </div>

                    {/* Price */}
                    <div style={{ marginBottom: 14 }} data-error={!!errors.price || undefined}>
                        <div style={{
                            display: 'flex', alignItems: 'center',
                            border: `1.5px solid ${errors.price ? '#ef4444' : '#d1d5db'}`,
                            borderRadius: 10, overflow: 'hidden',
                        }}>
                            <span style={{
                                padding: '13px 14px', background: '#f9fafb',
                                borderRight: '1px solid #e5e7eb', color: '#374151', fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap',
                            }}>USD</span>
                            <input
                                type="number"
                                placeholder="Price*"
                                value={form.price}
                                onChange={e => set('price', e.target.value)}
                                min="0"
                                style={{
                                    flex: 1, padding: '13px 14px', border: 'none', fontSize: 16,
                                    outline: 'none', background: '#fff', boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        {errors.price && (
                            <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.price}</p>
                        )}
                    </div>

                    {/* Negotiable */}
                    <div style={{ marginBottom: 4 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: '#374151' }}>
                            Are you open to negotiation?
                        </p>
                        <div style={{ display: 'flex', gap: 20 }}>
                            {(['yes', 'no', 'not_sure'] as Negotiable[]).map(val => (
                                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, color: '#374151' }}>
                                    <input
                                        type="radio"
                                        name="negotiable"
                                        value={val}
                                        checked={form.negotiable === val}
                                        onChange={() => set('negotiable', val)}
                                        style={{ accentColor: '#90D5FF', width: 16, height: 16 }}
                                    />
                                    {val === 'yes' ? 'Yes' : val === 'no' ? 'No' : 'Not sure'}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Contact section */}
                <div style={{ background: '#fff', borderRadius: 12, margin: '0 0 12px', padding: '20px 16px' }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 140 }}>
                            <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>Your phone number</label>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={e => set('phone', e.target.value)}
                                placeholder="Phone number"
                                style={{
                                    width: '100%', padding: '12px 14px', border: '1.5px solid #d1d5db',
                                    borderRadius: 10, fontSize: 16, outline: 'none', boxSizing: 'border-box',
                                }}
                                onFocus={e => { e.currentTarget.style.borderColor = '#90D5FF'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = '#d1d5db'; }}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: 140 }}>
                            <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                                placeholder="Your name"
                                style={{
                                    width: '100%', padding: '12px 14px', border: '1.5px solid #d1d5db',
                                    borderRadius: 10, fontSize: 16, outline: 'none', boxSizing: 'border-box',
                                }}
                                onFocus={e => { e.currentTarget.style.borderColor = '#90D5FF'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = '#d1d5db'; }}
                            />
                        </div>
                    </div>
                </div>

                {/* Submit button */}
                <div style={{ padding: '0 0 8px' }}>
                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            width: '100%', padding: '15px', background: submitting ? '#c1ebff' : '#90D5FF',
                            color: '#fff', border: 'none', borderRadius: 10,
                            fontSize: 16, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                    >
                        {submitting && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />}
                        {submitting ? 'Posting...' : 'Post ad'}
                    </button>
                    <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 10, lineHeight: 1.5 }}>
                        By clicking on Post Ad, you accept the Terms of Use, confirm that you will abide by the Safety Tips, and declare that this posting does not include any Prohibited Items.
                    </p>
                </div>
            </form>

            {/* CSS for spinner */}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            {/* Location modal */}
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
