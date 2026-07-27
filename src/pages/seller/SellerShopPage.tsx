import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Store, Upload, Check, Loader2, MapPin, Share2, Globe } from 'lucide-react';
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

  const [form, setForm] = useState<Partial<SellerProfile>>({});

  useEffect(() => {
    if (profile) {
      setForm(profile);
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: sellerDashboardService.updateSellerSettings,
    onSuccess: () => {
      toast.success('Shop details saved!');
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
      toast.success('Image updated');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setLogoUploading(false);
      setBannerUploading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-500" /></div>;
  }

  const logoUrl = form.avatar_url ? getImageUrl(form.avatar_url) : null;
  const bannerUrl = form.shop_page_banner ? getImageUrl(form.shop_page_banner) : null;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1000px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Shop Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Customize your branding and operational settings</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Cover & Logo Section */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Store Branding</h3>

          {/* Banner */}
          <div className="relative h-40 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
            {bannerUrl ? (
              <img src={bannerUrl} alt="Store Banner" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-slate-400">No cover banner uploaded</span>
            )}
            <label className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-sm flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              {bannerUploading ? 'Uploading...' : 'Change Banner'}
              <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'shop_page_banner')} />
            </label>
          </div>

          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400 font-bold relative shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Store className="w-8 h-8 text-slate-300" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">Shop Logo</p>
              <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG or WebP, max 5MB</p>
              <label className="inline-flex items-center gap-1 px-3 py-1.5 mt-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer transition-colors">
                <Upload className="w-3 h-3" />
                {logoUploading ? 'Uploading...' : 'Upload Logo'}
                <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'avatar_url')} />
              </label>
            </div>
          </div>
        </div>

        {/* Shop Info */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shop Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Shop Name *</label>
              <input value={form.business_name || ''} onChange={e => setForm({ ...form, business_name: e.target.value })} className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Business Registration Number</label>
              <input value={form.business_registration_number || ''} onChange={e => setForm({ ...form, business_registration_number: e.target.value })} placeholder="e.g. CPR-12345" className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Shop Description</label>
              <textarea value={form.shop_description || ''} onChange={e => setForm({ ...form, shop_description: e.target.value })} rows={4} placeholder="Tell buyers about your shop..." className="w-full p-4 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 resize-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Contact Phone Number</label>
              <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">WhatsApp Number</label>
              <input value={form.whatsapp || ''} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="e.g. +254 700000000" className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
            </div>
          </div>
        </div>

        {/* Location Info */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-sky-500" /> Location Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">County</label>
              <input value={form.county || ''} onChange={e => setForm({ ...form, county: e.target.value })} placeholder="e.g. Nairobi" className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">City / Town</label>
              <input value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="e.g. Nairobi CBD" className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-sky-500" /> Social Links
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'website', label: 'Website Link', icon: Globe, placeholder: 'e.g. www.myshop.com' },
              { key: 'facebook', label: 'Facebook Username', icon: Share2, placeholder: 'e.g. myshop.fb' },
              { key: 'instagram', label: 'Instagram Handle', icon: Share2, placeholder: 'e.g. @myshop' },
              { key: 'tiktok', label: 'TikTok Link', icon: Share2, placeholder: 'e.g. @myshop.tiktok' },
            ].map(item => (
              <div key={item.key}>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">{item.label}</label>
                <div className="relative">
                  <item.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={(form[item.key as keyof typeof form] as string) || ''}
                    onChange={e => setForm({ ...form, [item.key]: e.target.value })}
                    placeholder={item.placeholder}
                    className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <button type="submit" disabled={updateMutation.isPending} className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5">
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};
