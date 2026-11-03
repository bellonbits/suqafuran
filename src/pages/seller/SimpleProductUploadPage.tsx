import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Camera, X, Check, ArrowLeft, ArrowRight,
  Sparkles, CheckCircle2, AlertCircle, Loader2, Tag,
  MapPin, Smartphone, Car, Laptop,
  Shirt, Home, Building2, Wrench
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { sellerDashboardService } from '../../services/sellerDashboardService';
import { useAuthStore } from '../../store/useAuthStore';
import { getImageUrl } from '../../utils/imageUtils';

const CITIES = [
  'Nairobi - CBD', 'Nairobi - Westlands', 'Nairobi - Eastleigh', 'Nairobi - Kilimani',
  'Nairobi - Kasarani', 'Nairobi - South B/C', 'Mombasa', 'Kisumu', 'Nakuru',
  'Eldoret', 'Thika', 'Mogadishu', 'Hargeisa', 'Garowe', 'Kampala', 'Dar es Salaam', 'Kigali'
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  phone: <Smartphone className="w-6 h-6" />,
  car: <Car className="w-6 h-6" />,
  vehicle: <Car className="w-6 h-6" />,
  laptop: <Laptop className="w-6 h-6" />,
  electronic: <Laptop className="w-6 h-6" />,
  fashion: <Shirt className="w-6 h-6" />,
  cloth: <Shirt className="w-6 h-6" />,
  home: <Home className="w-6 h-6" />,
  furniture: <Home className="w-6 h-6" />,
  property: <Building2 className="w-6 h-6" />,
  real: <Building2 className="w-6 h-6" />,
  service: <Wrench className="w-6 h-6" />,
};

const getCategoryIcon = (name: string) => {
  const lower = (name || '').toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return <Tag className="w-6 h-6" />;
};

export const SimpleProductUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Current Step: 1 to 7
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  // Form State
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [condition, setCondition] = useState('Used');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [location, setLocation] = useState((user as any)?.location || 'Nairobi - CBD');
  const [description, setDescription] = useState('');

  // Fetch categories
  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['categories-list'],
    queryFn: sellerDashboardService.getCategories,
    staleTime: 10 * 60_000,
  });

  // Default first category
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  // Handle Image Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const fileList = Array.from(files);
      const uploadedUrls: string[] = [];

      for (const file of fileList) {
        const url = await sellerDashboardService.uploadListingImage(file);
        if (url) uploadedUrls.push(url);
      }

      setImages(prev => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''} added!`);
    } catch (err) {
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const setAsCoverImage = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
    toast.success('Main cover photo updated');
  };

  // AI Description Assistant
  const handleGenerateAiDescription = async () => {
    if (!title.trim()) {
      toast.error('Please enter a product name first');
      return;
    }
    setGeneratingAi(true);
    try {
      const res = await api.post('/ai/listings/ai/suggest', {
        title: title.trim(),
        category_id: categoryId,
        prompt: `Condition: ${condition}. Location: ${location}.`
      });

      if (res.data?.description) {
        setDescription(res.data.description);
        toast.success('Description generated!');
      } else {
        setDescription(`${title.trim()} in ${condition.toLowerCase()} condition. Located in ${location}. Serious buyers only, contact me for quick pickup or delivery.`);
      }
    } catch {
      setDescription(`${title.trim()} in ${condition.toLowerCase()} condition. Available in ${location}. Great deal, contact for details.`);
      toast.success('Suggested description added!');
    } finally {
      setGeneratingAi(false);
    }
  };

  // Publish Listing
  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('Please enter a product name');
      setCurrentStep(2);
      return;
    }
    if (!price || isNaN(Number(price))) {
      toast.error('Please enter a valid price');
      setCurrentStep(3);
      return;
    }
    if (!categoryId) {
      toast.error('Please select a category');
      setCurrentStep(4);
      return;
    }

    setPublishing(true);
    try {
      const payload = {
        title_en: title.trim(),
        description_en: description.trim() || `${title.trim()} in ${condition.toLowerCase()} condition. Available in ${location}.`,
        price: Number(price),
        currency,
        category_id: categoryId,
        location,
        condition,
        images,
        is_negotiable: isNegotiable,
        status: 'pending',
      };

      await api.post('/listings/', payload);
      setPublishedSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to publish product. Please check required fields.';
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  };

  const selectedCategoryName = categories.find((c: any) => c.id === categoryId)?.name_en || 'Category';

  // Success Screen
  if (publishedSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-sky-50/50">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900">Your Product is Under Review!</h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              We are checking your listing to make sure it meets our safety guidelines.
              It will be live for buyers across East Africa shortly!
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left flex items-center gap-3">
            {images[0] ? (
              <img src={getImageUrl(images[0])} alt={title} className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                <Camera className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{title}</p>
              <p className="text-xs font-semibold text-sky-600 mt-0.5">
                {currency} {Number(price).toLocaleString()}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                Under review
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate('/seller-dashboard/products')}
              className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all text-sm"
            >
              View My Products
            </button>
            <button
              onClick={() => {
                setPublishedSuccess(false);
                setCurrentStep(1);
                setImages([]);
                setTitle('');
                setPrice('');
                setDescription('');
              }}
              className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
            >
              Add Another Product
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Simple Header & Step Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              if (currentStep > 1) setCurrentStep(currentStep - 1);
              else navigate('/seller-dashboard');
            }}
            className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">
              Step {currentStep} of 7
            </span>
            <p className="text-sm font-bold text-slate-900">
              {currentStep === 1 && 'Add Photos'}
              {currentStep === 2 && 'Product Name'}
              {currentStep === 3 && 'Price & Condition'}
              {currentStep === 4 && 'Category'}
              {currentStep === 5 && 'Location'}
              {currentStep === 6 && 'Description'}
              {currentStep === 7 && 'Review & Publish'}
            </p>
          </div>
          <button
            onClick={() => navigate('/seller-dashboard')}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600"
          >
            Cancel
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="bg-sky-500 h-1.5 transition-all duration-300 rounded-r-full"
            style={{ width: `${(currentStep / 7) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Container */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* ── STEP 1: ADD PHOTOS ────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Add Photos of Your Item</h2>
              <p className="text-sm text-slate-500">
                Clear photos help you sell faster! Buyers like seeing front, back, and any details.
              </p>
            </div>

            {/* Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />

            {/* Photos Grid & Upload Button */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 group bg-slate-100">
                  <img src={getImageUrl(img)} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-sky-500 text-white text-[10px] font-bold rounded-md shadow">
                      Main Cover
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {idx !== 0 && (
                      <button
                        onClick={() => setAsCoverImage(idx)}
                        className="p-1.5 bg-white text-slate-700 hover:bg-sky-50 rounded-lg text-[10px] font-bold shadow"
                        title="Set as cover"
                      >
                        Set Cover
                      </button>
                    )}
                    <button
                      onClick={() => removeImage(idx)}
                      className="p-1.5 bg-red-500 text-white hover:bg-red-600 rounded-lg shadow"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Big Tap Target */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImages}
                className="aspect-square rounded-2xl border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 transition-colors flex flex-col items-center justify-center p-4 text-center group cursor-pointer"
              >
                {uploadingImages ? (
                  <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-sky-500 mb-2 group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-sky-700">Add Photo</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Camera or Gallery</span>
                  </>
                )}
              </button>
            </div>

            {images.length === 0 && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/60 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Tip: Products with at least 2 photos receive up to 5x more buyer messages.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: PRODUCT NAME ──────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">What are you selling?</h2>
              <p className="text-sm text-slate-500">
                Write a short, clear name so buyers searching for it can find you immediately.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. iPhone 13 128GB Midnight Blue"
                className="w-full px-4 py-4 text-base sm:text-lg border-2 border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 rounded-2xl font-medium outline-none transition-all"
                autoFocus
              />

              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-semibold text-slate-400">Popular examples:</span>
                <div className="flex flex-wrap gap-2">
                  {['Toyota Vitz 2016 Automatic', 'Samsung Galaxy S22 Ultra 256GB', 'Modern 3-Seater Living Room Sofa', 'Brand New Men Leather Shoes'].map(ex => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setTitle(ex)}
                      className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 font-medium transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: PRICE & CONDITION ─────────────────────────────── */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">How much are you selling it for?</h2>
              <p className="text-sm text-slate-500">
                Set a fair price. You can choose whether buyers can negotiate with you.
              </p>
            </div>

            <div className="space-y-4">
              {/* Currency & Amount */}
              <div className="flex gap-3">
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-28 px-3 py-4 text-base font-bold bg-slate-100 border border-slate-200 rounded-2xl outline-none"
                >
                  <option value="KES">KES (KSh)</option>
                  <option value="USD">USD ($)</option>
                </select>

                <div className="relative flex-1">
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full px-4 py-4 text-lg font-bold border-2 border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 rounded-2xl outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* Negotiable Toggle */}
              <label className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl cursor-pointer border border-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={isNegotiable}
                  onChange={e => setIsNegotiable(e.target.checked)}
                  className="w-5 h-5 text-sky-500 rounded-lg focus:ring-sky-400 border-slate-300"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Price is Negotiable</p>
                  <p className="text-slate-500">Allow buyers to chat and make offers</p>
                </div>
              </label>

              {/* Item Condition */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Item Condition
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Used', 'Brand New', 'Refurbished'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCondition(c)}
                      className={`py-3 px-3 rounded-2xl text-xs font-bold border-2 transition-all ${
                        condition === c
                          ? 'border-sky-500 bg-sky-50 text-sky-700'
                          : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: CATEGORY ──────────────────────────────────────── */}
        {currentStep === 4 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Choose a Category</h2>
              <p className="text-sm text-slate-500">
                Where should buyers find your product?
              </p>
            </div>

            {catsLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat: any) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between min-h-[100px] ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/70 text-sky-700 shadow-sm'
                          : 'border-slate-100 bg-slate-50/70 hover:border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                        isSelected ? 'bg-sky-500 text-white' : 'bg-white text-slate-600 shadow-sm'
                      }`}>
                        {getCategoryIcon(cat.name_en)}
                      </div>
                      <span className="text-xs font-bold truncate w-full">{cat.name_en}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 5: LOCATION ──────────────────────────────────────── */}
        {currentStep === 5 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Where is your item located?</h2>
              <p className="text-sm text-slate-500">
                Buyers near you can visit to inspect, pay, or arrange quick delivery.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Town / Neighborhood
                </label>
                <select
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-4 py-4 text-sm font-semibold border-2 border-slate-200 focus:border-sky-500 rounded-2xl bg-white outline-none"
                >
                  {CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">
                  Or enter specific area / estate:
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Nairobi, Kilimani near Yaya Centre"
                  className="w-full px-4 py-3 text-sm border border-slate-200 focus:border-sky-500 rounded-2xl outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 6: DESCRIPTION ───────────────────────────────────── */}
        {currentStep === 6 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Tell buyers a little more</h2>
                <p className="text-sm text-slate-500">Optional, but helpful for serious buyers.</p>
              </div>
              <button
                type="button"
                onClick={handleGenerateAiDescription}
                disabled={generatingAi}
                className="px-3.5 py-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all"
              >
                {generatingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Help me write this</span>
              </button>
            </div>

            <div className="space-y-2">
              <textarea
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Mention how long you have used it, what accessories are included, and when you are free to meet."
                className="w-full p-4 text-sm border-2 border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 rounded-2xl outline-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* ── STEP 7: REVIEW & PUBLISH ──────────────────────────────── */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Review Your Listing</h2>
              <p className="text-sm text-slate-500">
                This is how buyers will see your product on Suqafuran.
              </p>

              {/* Preview Card */}
              <div className="border border-slate-200 rounded-3xl overflow-hidden bg-slate-50/50 shadow-sm">
                <div className="aspect-[4/3] bg-slate-200 relative">
                  {images[0] ? (
                    <img src={getImageUrl(images[0])} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <Camera className="w-10 h-10 mb-2" />
                      <span className="text-xs">No photo provided</span>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md text-slate-900 font-bold rounded-full text-xs shadow">
                    {condition}
                  </span>
                </div>

                <div className="p-5 space-y-3 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-black text-slate-900 leading-snug">{title || 'Untitled Product'}</h3>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-black text-sky-600">
                        {currency} {Number(price || 0).toLocaleString()}
                      </p>
                      {isNegotiable && (
                        <span className="text-[10px] font-semibold text-slate-500">Negotiable</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-sky-500" />
                      {selectedCategoryName}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      {location}
                    </span>
                  </div>

                  {description && (
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed pt-2">
                      {description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Big Publish Button */}
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="w-full py-4 px-6 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-extrabold rounded-2xl shadow-xl shadow-sky-500/25 transition-all text-base flex items-center justify-center gap-2"
            >
              {publishing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Publishing Product...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span>Publish Product</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Bottom Nav Controls */}
        {currentStep < 7 && (
          <div className="mt-6 flex items-center justify-between gap-4">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-2xl text-sm transition-colors"
              >
                Back
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={() => {
                if (currentStep === 2 && !title.trim()) {
                  toast.error('Please enter a product name');
                  return;
                }
                if (currentStep === 3 && (!price || isNaN(Number(price)))) {
                  toast.error('Please enter a valid price');
                  return;
                }
                setCurrentStep(currentStep + 1);
              }}
              className="px-8 py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/20 text-sm flex items-center gap-2 transition-all ml-auto"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleProductUploadPage;
