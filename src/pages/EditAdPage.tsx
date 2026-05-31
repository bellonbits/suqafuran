import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Plus, X, CheckCircle2, Loader2, Pencil } from 'lucide-react';

import { listingService } from '../services/listingService';
import imageCompression from 'browser-image-compression';
import { getImageUrl } from '../utils/imageUtils';
import { getCategoryIcon } from '../utils/categoryIcons';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { useLanguageField } from '../hooks/useLanguageField';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../utils/cn';
import { ImageCropperModal } from '../components/ImageCropperModal';

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
    currency: 'USD' | 'KES' | 'SOS';
}

const EditAdPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { i18n } = useTranslation();
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
        currency: 'USD',
    });

    const [formTab, setFormTab] = useState<'en' | 'so'>((i18n.language as any) === 'so' ? 'so' : 'en');
    const [step, setStep] = useState<1 | 2>(1);
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const [isLocationOpen, setIsLocationOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const { getField } = useLanguageField();

    // Image Cropper State
    const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
    const [currentCropFile, setCurrentCropFile] = useState<File | null>(null);
    const [currentCropUrl, setCurrentCropUrl] = useState<string | null>(null);
    const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);


    // Fetch existing listing
    const { data: listing, isLoading: loadingListing } = useQuery({
        queryKey: ['listing', id],
        queryFn: () => listingService.getListing(Number(id)),
        enabled: !!id
    });

    const { data: categories = [], isLoading: catsLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: listingService.getCategories,
    });

    // Sync listing to form
    useEffect(() => {
        if (listing) {
            setForm({
                title_en: listing.title_en || '',
                title_so: listing.title_so || '',
                categoryId: listing.category_id,
                subcategoryId: listing.subcategory_id || null,
                subsubcategoryId: listing.subsubcategory_id || null,
                location: listing.location,
                images: listing.images || [],
                youtubeLink: '', // Not in DB yet
                description_en: listing.description_en || '',
                description_so: listing.description_so || '',
                price: listing.price.toString(),
                condition: listing.condition,
                negotiable: (listing as any).negotiable || 'not_sure',
                phone: user?.phone || listing.owner?.phone || '',
                name: user?.full_name || listing.owner?.full_name || '',
                attributes: listing.attributes || {},
                lang_available: (listing.lang_available as any) || 'en',
                currency: (listing.currency as any) || 'USD',
            });
            if (listing.lang_available === 'so') setFormTab('so');
        }
    }, [listing, user]);

    const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
        setForm(f => ({ ...f, [key]: value }));
        if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
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

    const handleImageUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        
        const fileArray = Array.from(files);
        setQueuedFiles(fileArray.slice(1));
        setCurrentCropFile(fileArray[0]);
        setCurrentCropUrl(URL.createObjectURL(fileArray[0]));
    };

    const processUpload = async (file: File) => {
        try {
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };
            const compressedBlob = await imageCompression(file, options);
            const compressedFile = new File([compressedBlob], file.name, { type: compressedBlob.type || file.type });
            const result = await listingService.uploadImage(compressedFile);
            setForm(f => ({ ...f, images: [...f.images, result.url] }));
        } catch { 
            /* skip */ 
        } finally {
            processNextInQueue();
        }
    };

    const processNextInQueue = () => {
        if (currentCropUrl) URL.revokeObjectURL(currentCropUrl);
        if (queuedFiles.length > 0) {
            const nextFile = queuedFiles[0];
            setQueuedFiles(prev => prev.slice(1));
            setCurrentCropFile(nextFile);
            setCurrentCropUrl(URL.createObjectURL(nextFile));
        } else {
            setCurrentCropFile(null);
            setCurrentCropUrl(null);
        }
    };

    const handleCropComplete = (croppedFile: File) => {
        if (editingImageIndex !== null) {
            processReplaceUpload(croppedFile, editingImageIndex);
        } else {
            processUpload(croppedFile);
        }
    };

    const processReplaceUpload = async (file: File, index: number) => {
        try {
            const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
            const compressedBlob = await imageCompression(file, options);
            const compressedFile = new File([compressedBlob], file.name, { type: compressedBlob.type || file.type });
            const result = await listingService.uploadImage(compressedFile);
            setForm(f => {
                const newImages = [...f.images];
                newImages[index] = result.url;
                return { ...f, images: newImages };
            });
        } catch {
            /* skip */
        } finally {
            setEditingImageIndex(null);
            if (currentCropUrl && !currentCropUrl.startsWith('http')) URL.revokeObjectURL(currentCropUrl);
            setCurrentCropFile(null);
            setCurrentCropUrl(null);
        }
    };

    const editImage = (idx: number, url: string) => {
        setEditingImageIndex(idx);
        setCurrentCropUrl(url);
        setCurrentCropFile(null);
    };

    const handleCropSkip = () => {
        if (editingImageIndex !== null) {
            setEditingImageIndex(null);
            if (currentCropUrl && !currentCropUrl.startsWith('http')) URL.revokeObjectURL(currentCropUrl);
            setCurrentCropFile(null);
            setCurrentCropUrl(null);
        } else if (currentCropFile) {
            processUpload(currentCropFile);
        } else {
            processNextInQueue();
        }
    };

    const removeImage = (idx: number) => {
        setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
    };

    const validateStep1 = () => {
        const e: Record<string, string> = {};
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
        if (form.lang_available === 'en' || form.lang_available === 'both') {
            if (!form.description_en || form.description_en.length < 10) e.description_en = 'English description is required (min 10 chars)';
        }
        if (form.lang_available === 'so' || form.lang_available === 'both') {
            if (!form.description_so || form.description_so.length < 10) e.description_so = 'Faahfaahinta Somali-ga waa lagama maarmaan';
        }
        if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Enter a valid price';
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
            if ((errs.title_en || errs.description_en) && formTab === 'so') setFormTab('en');
            else if ((errs.title_so || errs.description_so) && formTab === 'en') setFormTab('so');
            return;
        }
        setSubmitting(true);
        try {
            await listingService.updateListing(Number(id), {
                title_en: form.title_en,
                title_so: form.title_so,
                description_en: form.description_en,
                description_so: form.description_so,
                price: Number(form.price),
                currency: form.currency,
                location: form.location,
                category_id: form.categoryId!,
                subcategory_id: form.subcategoryId ?? undefined,
                subsubcategory_id: form.subsubcategoryId ?? undefined,
                images: form.images,
                condition: form.condition,
                attributes: form.attributes,
                lang_available: form.lang_available,
            });
            setSubmitted(true);
        } catch (err: any) {
            setErrors({ title: err.response?.data?.detail || 'Failed to update ad' });
        } finally {
            setSubmitting(false);
        }
    };

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

    const filteredCategories = categorySearch.trim()
        ? categories.filter(c =>
            getField(c, 'name').toLowerCase().includes(categorySearch.toLowerCase()) ||
            c.subcategories?.some((s: any) => getField(s, 'name').toLowerCase().includes(categorySearch.toLowerCase()))
        )
        : categories;

    if (loadingListing || catsLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-primary-500" size={40} /></div>;
    }

    if (!listing) return <div className="p-20 text-center">Ad not found</div>;

    if (submitted) {
        return (
            <div className="max-w-md mx-auto py-20 text-center">
                <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={36} className="text-primary-500" />
                </div>
                <h2 className="text-2xl font-bold mb-3">Changes Saved!</h2>
                <p className="text-gray-500 mb-8">Your ad has been updated successfully.</p>
                <div className="flex gap-4 justify-center">
                    <Link to="/my-ads" className="px-6 py-3 border border-gray-300 rounded-xl font-bold text-gray-700">My Ads</Link>
                    <Link to="/" className="px-6 py-3 bg-primary-500 text-white rounded-xl font-bold">Go Home</Link>
                </div>
            </div>
        );
    }

    if (showCategoryPicker) {
        return (
            <div className="max-w-2xl mx-auto pb-40">
                <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
                    <button onClick={() => setShowCategoryPicker(false)} className="flex items-center gap-1 font-bold text-primary-500"><ChevronLeft size={18} /> Back</button>
                    <span className="font-bold">Select Category</span>
                    <div className="w-10" />
                </div>
                <div className="p-4 bg-white border-b border-gray-200">
                    <input autoFocus placeholder="Search..." value={categorySearch} onChange={e => setCategorySearch(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none" />
                </div>
                <div className="bg-white">
                    {filteredCategories.map(cat => {
                        const Icon = getCategoryIcon(cat.icon_name || cat.slug);
                        return (
                            <button key={cat.id} onClick={() => { setForm(f => ({ ...f, categoryId: cat.id, subcategoryId: null, subsubcategoryId: null, attributes: {} })); setShowCategoryPicker(false); }} className="w-full flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                        {cat.image_url ? <img src={getImageUrl(cat.image_url)} alt="" className="w-full h-full object-cover" /> : <Icon size={20} className="text-gray-400" />}
                                    </div>
                                    <span className="font-medium">{getField(cat, 'name')}</span>
                                </div>
                                <ChevronRight size={18} className="text-gray-300" />
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f4f6f8] pb-12 pt-4 px-3 w-full">
            <div className="bg-white rounded-md shadow-sm p-4 mb-4 max-w-2xl mx-auto flex flex-col items-center border-b border-gray-200">
                <div className="w-full flex items-center justify-between mb-2">
                    {step === 2 ? <button onClick={() => setStep(1)} className="text-primary-500 font-bold flex items-center text-[13px]"><ChevronLeft size={16} /> Back</button> : <div className="w-16" />}
                    <span className="font-bold text-gray-900">Edit ad</span>
                    <button onClick={() => navigate('/my-ads')} className="text-gray-400 font-bold text-[13px]">Cancel</button>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-all", step === 1 ? "border-primary-500 text-primary-500" : "bg-gray-100 border-gray-100 text-gray-400")}>1</div>
                        <span className={cn("text-[12px] font-bold", step === 1 ? "text-gray-900" : "text-gray-400")}>Basic info</span>
                    </div>
                    <div className="w-8 h-[2px] bg-gray-100" />
                    <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold border-2 transition-all", step === 2 ? "border-primary-500 text-primary-500" : "bg-gray-100 border-gray-100 text-gray-400")}>2</div>
                        <span className={cn("text-[12px] font-bold", step === 2 ? "text-gray-900" : "text-gray-400")}>Description & Price</span>
                    </div>
                </div>
            </div>

            <form onSubmit={step === 1 ? e => e.preventDefault() : handleSubmit} className="max-w-2xl mx-auto">
                {step === 1 && (
                    <div className="bg-white rounded-md shadow-sm border border-gray-200 p-5 mb-5 space-y-6">
                        <div>
                            <label className="block text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-3">Language</label>
                            <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
                                {(['en', 'so', 'both'] as const).map(lang => (
                                    <button key={lang} type="button" onClick={() => set('lang_available', lang)} className={cn("flex-1 py-2 px-1 rounded-lg text-sm font-bold transition-all", form.lang_available === lang ? "bg-white text-primary-600 shadow-sm" : "text-gray-400")}>{lang === 'both' ? 'Both' : lang.toUpperCase()}</button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                             <div className="flex items-center justify-between mb-2">
                                <label className="block text-[13px] font-bold text-gray-900">Title*</label>
                                <div className="flex bg-gray-100 rounded-lg p-0.5">
                                    <button type="button" onClick={() => setFormTab('en')} className={cn("px-3 py-1 text-[11px] font-bold rounded-md transition-all", formTab === 'en' ? "bg-white text-primary-600 shadow-sm" : "text-gray-400")}>EN</button>
                                    <button type="button" onClick={() => setFormTab('so')} className={cn("px-3 py-1 text-[11px] font-bold rounded-md transition-all", formTab === 'so' ? "bg-white text-primary-600 shadow-sm" : "text-gray-400")}>SO</button>
                                </div>
                             </div>
                             {formTab === 'en' ? (
                                <div className="space-y-2">
                                    {renderFloatingInput('title_en', 'English Title*', form.title_en, v => set('title_en', v), errors.title_en, { maxLength: TITLE_MAX })}
                                </div>
                             ) : (
                                <div className="space-y-2">
                                    {renderFloatingInput('title_so', 'Gali Magaca (Somali)*', form.title_so, v => set('title_so', v), errors.title_so, { maxLength: TITLE_MAX })}
                                </div>
                             )}

                        </div>

                        <div className="relative mb-4">
                            <button type="button" onClick={() => setShowCategoryPicker(true)} className="flex w-full items-center justify-between rounded-md border border-gray-300 px-3 py-3 text-sm">{selectedCategory ? getField(selectedCategory, 'name') : 'Select Category'}<ChevronRight size={16} /></button>
                            {errors.categoryId && <p className="text-[11px] text-red-500 mt-1">{errors.categoryId}</p>}
                        </div>

                        <div className="relative mb-4">
                            <button type="button" onClick={() => setIsLocationOpen(true)} className="flex w-full items-center justify-between rounded-md border border-gray-300 px-3 py-3 text-sm">{form.location || 'Select Location'}<ChevronRight size={16} /></button>
                            {errors.location && <p className="text-[11px] text-red-500 mt-1">{errors.location}</p>}
                        </div>

                        <div>
                            <p className="text-[13px] font-bold text-gray-900 mb-2">Photos*</p>
                            <div className="grid grid-cols-4 gap-2">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center hover:bg-primary-50 hover:border-primary-300 transition-all">
                                    <Plus className="text-gray-400" />
                                    <span className="text-[10px] text-gray-400">Add Photo</span>
                                </button>
                                {form.images.map((img, i) => (
                                    <div key={i} className="aspect-square rounded-lg bg-gray-50 relative group/img overflow-hidden">
                                        <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                                        {/* Edit overlay on hover/tap */}
                                        <button
                                            type="button"
                                            onClick={() => editImage(i, getImageUrl(img))}
                                            className="absolute inset-0 bg-black/40 rounded-lg hidden sm:flex flex-col items-center justify-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity"
                                        >
                                            <Pencil size={18} color="white" />
                                            <span className="text-white text-[10px] font-bold">Edit</span>
                                        </button>
                                        <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity z-10"><X size={12} /></button>
                                    </div>
                                ))}
                            </div>
                            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => handleImageUpload(e.target.files)} />
                        </div>

                        <button type="button" onClick={handleNext} className="w-full bg-primary-500 text-white py-4 rounded-md font-bold text-sm mt-8">Next: Details & Price</button>
                    </div>
                )}

                {step === 2 && (
                    <div className="bg-white rounded-md shadow-sm border border-gray-200 p-5 mb-5 space-y-6">
                        <div>
                             <div className="flex items-center justify-between mb-2">
                                <label className="block text-[13px] font-bold text-gray-900">Description*</label>
                                <div className="flex bg-gray-100 rounded-lg p-0.5">
                                    <button type="button" onClick={() => setFormTab('en')} className={cn("px-3 py-1 text-[11px] font-bold rounded-md transition-all", formTab === 'en' ? "bg-white text-primary-600 shadow-sm" : "text-gray-400")}>EN</button>
                                    <button type="button" onClick={() => setFormTab('so')} className={cn("px-3 py-1 text-[11px] font-bold rounded-md transition-all", formTab === 'so' ? "bg-white text-primary-600 shadow-sm" : "text-gray-400")}>SO</button>
                                </div>
                             </div>
                             {formTab === 'en' ? (
                                <textarea value={form.description_en} onChange={e => set('description_en', e.target.value)} rows={5} placeholder="English description..." className="w-full p-3 border border-gray-300 rounded-md outline-none focus:border-primary-500 text-sm" />
                             ) : (
                                <textarea value={form.description_so} onChange={e => set('description_so', e.target.value)} rows={5} placeholder="Faahfaahinta Somali..." className="w-full p-3 border border-gray-300 rounded-md outline-none focus:border-primary-500 text-sm" />
                             )}
                        </div>

                        <div className="flex gap-2">
                            <div className="w-24 shrink-0 relative">
                                <select value={form.currency} onChange={e => set('currency', e.target.value as any)} className="w-full border border-gray-300 rounded-md p-3 text-sm appearance-none outline-none focus:border-primary-500">
                                    <option value="USD">USD ($)</option>
                                    <option value="KES">KES (KSh)</option>
                                    <option value="SOS">SOS (Sh)</option>
                                </select>
                                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90" />
                            </div>
                            <div className="flex-1">
                                {renderFloatingInput('price', `Price (${form.currency})*`, form.price, v => set('price', v), errors.price, { type: 'number' })}
                            </div>
                        </div>

                        <div>
                            <p className="text-[13px] font-bold text-gray-900 mb-2">Condition*</p>
                            <div className="flex gap-3">
                                {(['New', 'Used', 'Refurbished'] as const).map(c => (
                                    <button key={c} type="button" onClick={() => set('condition', c)} className={cn("flex-1 py-3 border rounded-md text-sm font-bold transition-all", form.condition === c ? "border-primary-500 text-primary-600 bg-primary-50" : "border-gray-100 text-gray-400 hover:border-gray-200")}>{c}</button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" disabled={submitting} className="w-full bg-primary-500 text-white py-4 rounded-md font-bold text-sm mt-8 shadow-lg shadow-primary-100 flex items-center justify-center gap-2">
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
                        </button>
                    </div>
                )}
            </form>

            <LocationPickerModal isOpen={isLocationOpen} onClose={() => setIsLocationOpen(false)} onSelect={loc => set('location', loc)} />

            {/* Image Cropper Modal */}
            <ImageCropperModal
                isOpen={!!(currentCropFile || currentCropUrl)}
                onClose={() => {
                    if (editingImageIndex !== null) {
                        setEditingImageIndex(null);
                    } else {
                        setQueuedFiles([]);
                    }
                    if (currentCropUrl && !currentCropUrl.startsWith('http')) URL.revokeObjectURL(currentCropUrl);
                    setCurrentCropFile(null);
                    setCurrentCropUrl(null);
                }}
                imageSrc={currentCropUrl}
                onCropComplete={handleCropComplete}
                onSkip={handleCropSkip}
                fileName={currentCropFile?.name || 'cropped.jpg'}
            />
        </div>
    );
};

export { EditAdPage };
