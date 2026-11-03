import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, Check, Loader2, MapPin, Camera,
  ShieldCheck, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { sellerDashboardService } from '../../services/sellerDashboardService';
import type { SellerProfile } from '../../services/sellerDashboardService';
import { getImageUrl } from '../../utils/imageUtils';

export const SellerShopPage: React.FC = () => {
  const qc = useQueryClient();
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['seller-profile-edit'],
    queryFn: sellerDashboardService.getSellerProfile,
    staleTime: 5 * 60_000,
  });

  const [form, setForm] = useState<Partial<SellerProfile>>({
    business_name: '',
    shop_description: '',
    phone: '',
    whatsapp: '',
    location: '',
    business_category: '',
    avatar_url: '',
    shop_page_banner: '',
  });

  useEffect(() => {
    if (profile) {
      setForm(profile);
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: sellerDashboardService.updateSellerSettings,
    onSuccess: () => {
      toast.success('Shop details saved successfully!');
      qc.invalidateQueries({ queryKey: ['seller-profile-edit'] });
    },
    onError: () => toast.error('Failed to update shop details'),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar_url' | 'shop_page_banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (field === 'avatar_url') setLogoUploading(true);
    else setBannerUploading(true);

    try {
      const url = await sellerDashboardService.uploadAvatar(file);
      setForm(f => ({ ...f, [field]: url }));
      toast.success(field === 'avatar_url' ? 'Logo updated' : 'Cover photo updated');
    } catch {
      toast.error('Image upload failed. Please try again.');
    } finally {
      setLogoUploading(false);
      setBannerUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  const logoUrl = form.avatar_url ? getImageUrl(form.avatar_url) : null;
  const bannerUrl = form.shop_page_banner ? getImageUrl(form.shop_page_banner) : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* ── Optional Shop Notice Banner ────────────────────────────── */}
      <div className="p-4 sm:p-5 bg-sky-50 rounded-3xl border border-sky-100 flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-sky-950">Setting up a shop is optional</p>
          <p className="text-xs text-sky-800 leading-relaxed">
            If you are an individual seller selling a few items, you do not need a shop. But if you have a business, shop name, or brand, customizing your storefront helps buyers trust you and browse all your products in one place!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Form: Shop Information (2 Cols) ────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Your Shop Profile</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Keep your details updated so buyers can reach you easily.
              </p>
            </div>

            {/* Media Uploads: Cover Banner & Logo */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Shop Photos
              </label>

              {/* Cover Banner */}
              <div className="relative aspect-[3/1] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 group">
                {bannerUrl ? (
                  <img src={bannerUrl} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-xs">Add Cover Banner</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-xs font-bold gap-2">
                  <Upload className="w-4 h-4" />
                  <span>{bannerUploading ? 'Uploading...' : 'Change Cover Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleImageUpload(e, 'shop_page_banner')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Logo / Profile Picture */}
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-md flex-shrink-0 group">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xl">
                      {form.business_name?.[0] || 'S'}
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                    {logoUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageUpload(e, 'avatar_url')}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Shop Logo or Photo</p>
                  <p className="text-[11px] text-slate-500">Square photo looks best. JPG or PNG.</p>
                </div>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Shop / Business Name
                </label>
                <input
                  type="text"
                  value={form.business_name || ''}
                  onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
                  placeholder="e.g. Al-Baraka Electronics"
                  className="w-full px-4 py-3 text-sm border border-slate-200 focus:border-sky-500 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Business Description
                </label>
                <textarea
                  rows={3}
                  value={form.shop_description || ''}
                  onChange={e => setForm(f => ({ ...f, shop_description: e.target.value }))}
                  placeholder="Tell buyers what you sell, your experience, and warranty/guarantee policies."
                  className="w-full p-4 text-sm border border-slate-200 focus:border-sky-500 rounded-xl outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Phone Number (Calls)
                  </label>
                  <input
                    type="tel"
                    value={form.phone || ''}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="e.g. +254 712 345678"
                    className="w-full px-4 py-3 text-sm border border-slate-200 focus:border-sky-500 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={form.whatsapp || ''}
                    onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                    placeholder="e.g. +254 712 345678"
                    className="w-full px-4 py-3 text-sm border border-slate-200 focus:border-sky-500 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Location / City
                  </label>
                  <input
                    type="text"
                    value={form.location || ''}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Nairobi, Eastleigh 1st Ave"
                    className="w-full px-4 py-3 text-sm border border-slate-200 focus:border-sky-500 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Business Category
                  </label>
                  <input
                    type="text"
                    value={form.business_category || ''}
                    onChange={e => setForm(f => ({ ...f, business_category: e.target.value }))}
                    placeholder="e.g. Electronics & Smartphones"
                    className="w-full px-4 py-3 text-sm border border-slate-200 focus:border-sky-500 rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/20 text-sm transition-all flex items-center justify-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Shop Details</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Preview Card: How Buyers See Your Shop (1 Col) ──────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Buyer Preview
            </span>
            <span className="text-[11px] text-sky-600 font-semibold">Live Preview</span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden sticky top-20">
            {/* Cover banner preview */}
            <div className="h-28 bg-gradient-to-r from-sky-400 to-cyan-500 relative">
              {bannerUrl && <img src={bannerUrl} alt="Cover" className="w-full h-full object-cover" />}
            </div>

            {/* Content preview */}
            <div className="p-5 pt-0 relative space-y-4">
              <div className="-mt-10 flex items-end justify-between">
                <div className="w-18 h-18 rounded-2xl bg-white p-1 shadow-md">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-black text-xl">
                      {form.business_name?.[0] || 'S'}
                    </div>
                  )}
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Seller</span>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  {form.business_name || 'Your Shop Name'}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{form.location || 'Your Town'}</span>
                </p>
              </div>

              {form.shop_description && (
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {form.shop_description}
                </p>
              )}

              <div className="pt-2 flex gap-2">
                <div className="flex-1 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold text-center">
                  Call Seller
                </div>
                <div className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold text-center">
                  WhatsApp
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerShopPage;
