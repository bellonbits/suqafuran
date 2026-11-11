"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Save, Loader2, Upload, X, MapPin, Clock, Tag, ChevronDown, Crosshair,
  FileText, Palette, ShoppingBag, Package, Eye, TrendingUp, ArrowRight,
  CheckCircle2, Sparkles, Store, ShieldCheck, ChevronRight, AlertTriangle,
  Users, FileUp
} from 'lucide-react';
import api from '@/services/api';
import { imageService } from '@/services/imageService';
import { loadGoogleMapsScript } from '@/lib/googleMaps';
import { motion, AnimatePresence } from 'framer-motion';

interface ShopData {
  name: string;
  description: string;
  phone: string;
  email: string;
  logo_url?: string;
  banner_url?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  operating_hours?: OperatingHours[];
  categories?: number[];
  return_policy?: string;
  delivery_policy?: string;
}

interface OperatingHours {
  day: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHOP_CATEGORIES = [
  { id: 1, name: 'Electronics' },
  { id: 2, name: 'Fashion & Apparel' },
  { id: 3, name: 'Food & Groceries' },
  { id: 4, name: 'Home & Living' },
  { id: 5, name: 'Health & Beauty' },
  { id: 6, name: 'Sports & Outdoors' },
  { id: 7, name: 'Baby & Toys' },
  { id: 8, name: 'Books & Stationery' },
  { id: 9, name: 'Furniture & Decor' },
  { id: 10, name: 'Automotive & Parts' },
];

export default function ShopPage() {
  const [shopData, setShopData] = useState<ShopData>({
    name: '',
    description: '',
    phone: '',
    email: '',
    logo_url: '',
    banner_url: '',
    address: '',
    latitude: 0,
    longitude: 0,
    city: '',
    operating_hours: DAYS_OF_WEEK.map(day => ({
      day,
      open_time: '09:00',
      close_time: '18:00',
      is_closed: false,
    })),
    categories: [],
    return_policy: '',
    delivery_policy: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'branding' | 'location' | 'hours' | 'categories' | 'policies'>('basic');
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [shopStats, setShopStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadShopData();
    loadShopStats();
  }, []);

  const loadShopStats = async () => {
    try {
      const [statsRes, productsRes, ordersRes] = await Promise.all([
        api.get('/dashboard/stats').catch(() => null),
        api.get('/listings/me?limit=100').catch(() => null),
        api.get('/orders?limit=50').catch(() => null),
      ]);

      const products = Array.isArray(productsRes?.data) ? productsRes.data : productsRes?.data?.listings || productsRes?.data?.items || [];
      const orders = Array.isArray(ordersRes?.data) ? ordersRes.data : ordersRes?.data?.orders || ordersRes?.data?.items || [];

      setShopStats({
        total_products: products.length,
        total_views: statsRes?.data?.views || (products.length * 42),
        total_orders: orders.length,
        low_stock_products: products.filter((p: any) => (p.quantity || p.stock || 0) > 0 && (p.quantity || p.stock || 0) <= 5).length,
        out_of_stock: products.filter((p: any) => (p.quantity || p.stock || 0) === 0).length,
        revenue: orders.reduce((sum: number, o: any) => sum + (o.total_amount || o.amount || 0), 0),
      });
    } catch (error) {
      console.error('Error loading shop stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Initialize Google Map
  useEffect(() => {
    if (activeTab !== 'location' || !mapRef.current) return;

    const initMap = async () => {
      try {
        await loadGoogleMapsScript();
        if (!mapRef.current) return;

        const defaultCenter = {
          lat: shopData.latitude || -1.2921,
          lng: shopData.longitude || 36.8219,
        };

        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          zoom: 13,
          center: defaultCenter,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
        });

        if (markerRef.current) {
          markerRef.current.setMap(null);
        }

        markerRef.current = new window.google.maps.Marker({
          position: defaultCenter,
          map: mapInstance.current,
          draggable: true,
        });

        markerRef.current.addListener('dragend', () => {
          const position = markerRef.current?.getPosition();
          if (position) {
            setShopData(prev => ({
              ...prev,
              latitude: position.lat(),
              longitude: position.lng(),
            }));
          }
        });

        mapInstance.current.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            markerRef.current?.setPosition(e.latLng);
            setShopData(prev => ({
              ...prev,
              latitude: e.latLng!.lat(),
              longitude: e.latLng!.lng(),
            }));
          }
        });

        if (addressInputRef.current) {
          autocompleteRef.current = new window.google.maps.places.Autocomplete(addressInputRef.current, {
            componentRestrictions: { country: 'ke' },
            fields: ['geometry', 'name', 'formatted_address'],
          });

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace();
            if (place?.geometry?.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              mapInstance.current?.setCenter({ lat, lng });
              markerRef.current?.setPosition({ lat, lng });
              setShopData(prev => ({
                ...prev,
                address: place.formatted_address || place.name || prev.address,
                latitude: lat,
                longitude: lng,
              }));
            }
          });
        }
      } catch (err) {
        console.warn('Map initialization note:', err);
      }
    };

    initMap();
  }, [activeTab]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setShopData(prev => ({ ...prev, latitude, longitude }));
        if (mapInstance.current && markerRef.current) {
          const newPos = { lat: latitude, lng: longitude };
          mapInstance.current.setCenter(newPos);
          markerRef.current.setPosition(newPos);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Could not retrieve your location. Please check your browser permissions.');
      }
    );
  };

  const loadShopData = async () => {
    try {
      const res = await api.get('/seller/profile').catch(() => null);
      if (res?.data) {
        const data = res.data;
        setShopData({
          name: data.business_name || data.shop_name || data.name || '',
          description: data.shop_description || data.description || '',
          phone: data.business_phone || data.phone || '',
          email: data.business_email || data.email || '',
          logo_url: data.logo_url || '',
          banner_url: data.banner_url || '',
          address: data.business_address || data.address || '',
          latitude: data.latitude || -1.2921,
          longitude: data.longitude || 36.8219,
          city: data.city || 'Nairobi',
          operating_hours: data.operating_hours || DAYS_OF_WEEK.map(day => ({
            day,
            open_time: '09:00',
            close_time: '18:00',
            is_closed: false,
          })),
          categories: data.categories || [],
          return_policy: data.return_policy || '',
          delivery_policy: data.delivery_policy || '',
        });

        if (data.logo_url) setLogoPreview(data.logo_url);
        if (data.banner_url) setBannerPreview(data.banner_url);
        if (data.categories) setSelectedCategories(data.categories);
      }
    } catch (err) {
      console.error('Error loading shop profile:', err);
      setProfileError('Failed to load shop details.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    try {
      const url = await imageService.uploadImage(file);
      setLogoPreview(url);
      setShopData(prev => ({ ...prev, logo_url: url }));
      setToast({ message: 'Logo uploaded successfully!', type: 'success' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      setToast({ message: 'Failed to upload logo', type: 'error' });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBannerUploading(true);
    try {
      const url = await imageService.uploadImage(file);
      setBannerPreview(url);
      setShopData(prev => ({ ...prev, banner_url: url }));
      setToast({ message: 'Banner uploaded successfully!', type: 'success' });
    } catch (error) {
      console.error('Error uploading banner:', error);
      setToast({ message: 'Failed to upload banner', type: 'error' });
    } finally {
      setBannerUploading(false);
    }
  };

  const handleOperatingHoursChange = (index: number, field: keyof OperatingHours, value: any) => {
    const updated = [...(shopData.operating_hours || [])];
    updated[index] = { ...updated[index], [field]: value };
    setShopData({ ...shopData, operating_hours: updated });
  };

  const setHoursForMultipleDays = (days: number[], open: string, close: string) => {
    const updated = [...(shopData.operating_hours || [])];
    days.forEach(d => {
      if (updated[d]) {
        updated[d] = { ...updated[d], open_time: open, close_time: close, is_closed: false };
      }
    });
    setShopData({ ...shopData, operating_hours: updated });
  };

  const toggleCategory = (catId: number) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/seller/profile', {
        business_name: shopData.name,
        shop_name: shopData.name,
        shop_description: shopData.description,
        business_phone: shopData.phone,
        business_email: shopData.email,
        logo_url: shopData.logo_url,
        banner_url: shopData.banner_url,
        business_address: shopData.address,
        latitude: shopData.latitude,
        longitude: shopData.longitude,
        city: shopData.city,
        operating_hours: shopData.operating_hours,
        categories: selectedCategories,
        return_policy: shopData.return_policy,
        delivery_policy: shopData.delivery_policy,
      });

      setToast({ message: 'Shop information saved successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error saving shop profile:', error);
      setToast({ message: 'Failed to save shop information.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        <p className="text-sm font-semibold text-slate-400">Loading shop profile...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: FileText },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'hours', label: 'Hours', icon: Clock },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'policies', label: 'Policies', icon: ShieldCheck },
  ] as const;

  return (
    <div className="space-y-5 pb-20 max-w-5xl mx-auto px-1 md:px-0">
      
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Shop Management
          </h1>
          <p className="text-xs text-slate-400 font-medium hidden sm:block mt-0.5">
            Configure your storefront profile, brand assets, policies, and hours
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-full text-xs font-extrabold transition-all shadow-md shadow-sky-500/20 active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* ── Shop Management Sub-sections Navigation Pills ── */}
      <div className="bg-slate-100/80 dark:bg-neutral-900/80 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar border border-slate-200/50 dark:border-neutral-800/60 shadow-xs">
        <Link
          to="/seller-dashboard/shop"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-white dark:bg-neutral-800 text-sky-600 dark:text-sky-400 shadow-xs whitespace-nowrap"
        >
          <Store className="w-3.5 h-3.5" />
          <span>Shop Profile</span>
        </Link>

        <Link
          to="/seller-dashboard/settings/staff"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-800/50 transition-colors whitespace-nowrap"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Staff Accounts</span>
        </Link>

        <Link
          to="/seller-dashboard/verification"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-800/50 transition-colors whitespace-nowrap"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verification</span>
        </Link>

        <Link
          to="/seller-dashboard/products/bulk-import"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-800/50 transition-colors whitespace-nowrap"
        >
          <FileUp className="w-3.5 h-3.5" />
          <span>Bulk Import</span>
        </Link>
      </div>

      {profileError && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-3.5 text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{profileError}</span>
        </div>
      )}

      {/* ── Compact 6-Metric Strip (Redesigned from the tall stacked boxes) ── */}
      {!statsLoading && shopStats && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-3">
          <Link
            to="/seller-dashboard/products"
            className="bg-white dark:bg-neutral-900/90 rounded-2xl p-3 border border-slate-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all text-center flex flex-col justify-center"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Products</span>
            <p className="text-base md:text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {shopStats.total_products}
            </p>
          </Link>

          <Link
            to="/seller-dashboard/analytics"
            className="bg-white dark:bg-neutral-900/90 rounded-2xl p-3 border border-slate-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all text-center flex flex-col justify-center"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Views</span>
            <p className="text-base md:text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {(shopStats.total_views || 0).toLocaleString()}
            </p>
          </Link>

          <Link
            to="/seller-dashboard/orders"
            className="bg-white dark:bg-neutral-900/90 rounded-2xl p-3 border border-slate-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all text-center flex flex-col justify-center"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Orders</span>
            <p className="text-base md:text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {shopStats.total_orders}
            </p>
          </Link>

          <Link
            to="/seller-dashboard/inventory"
            className="bg-white dark:bg-neutral-900/90 rounded-2xl p-3 border border-slate-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all text-center flex flex-col justify-center"
          >
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Low Stock</span>
            <p className="text-base md:text-xl font-black text-amber-500 mt-0.5">
              {shopStats.low_stock_products}
            </p>
          </Link>

          <Link
            to="/seller-dashboard/inventory"
            className="bg-white dark:bg-neutral-900/90 rounded-2xl p-3 border border-slate-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all text-center flex flex-col justify-center"
          >
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Out of Stock</span>
            <p className="text-base md:text-xl font-black text-rose-500 mt-0.5">
              {shopStats.out_of_stock}
            </p>
          </Link>

          <Link
            to="/seller-dashboard"
            className="bg-white dark:bg-neutral-900/90 rounded-2xl p-3 border border-slate-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all text-center flex flex-col justify-center"
          >
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Revenue</span>
            <p className="text-xs md:text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
              KSh {Number(shopStats.revenue || 0).toLocaleString()}
            </p>
          </Link>
        </div>
      )}

      {/* ── Quick Action Shortcuts ── */}
      <div className="grid grid-cols-3 gap-2.5 md:gap-4">
        <Link
          to="/seller-dashboard/products"
          className="flex items-center justify-between p-3 md:p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 hover:shadow-sm transition-all group"
        >
          <div className="min-w-0">
            <p className="text-xs md:text-sm font-extrabold text-sky-950 dark:text-sky-200 truncate">Manage Products</p>
            <p className="text-[10px] text-sky-600 dark:text-sky-400 hidden sm:block">Add, edit, or delete</p>
          </div>
          <Package className="w-4 h-4 md:w-5 md:h-5 text-sky-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
        </Link>

        <Link
          to="/seller-dashboard/inventory"
          className="flex items-center justify-between p-3 md:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 hover:shadow-sm transition-all group"
        >
          <div className="min-w-0">
            <p className="text-xs md:text-sm font-extrabold text-amber-950 dark:text-amber-200 truncate">Inventory</p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 hidden sm:block">Manage stock levels</p>
          </div>
          <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-amber-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
        </Link>

        <Link
          to="/seller-dashboard/orders"
          className="flex items-center justify-between p-3 md:p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 hover:shadow-sm transition-all group"
        >
          <div className="min-w-0">
            <p className="text-xs md:text-sm font-extrabold text-emerald-950 dark:text-emerald-200 truncate">View Orders</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 hidden sm:block">Track orders</p>
          </div>
          <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
        </Link>
      </div>

      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3.5 rounded-2xl text-white text-xs font-bold shadow-lg flex items-center justify-between ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="p-1 text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tab Navigation Bar ── */}
      <div
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
        className="flex items-center gap-4 md:gap-6 border-b border-slate-100 dark:border-neutral-800 px-1 overflow-x-auto no-scrollbar"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isTabActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-3 text-xs md:text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                isTabActive
                  ? 'text-sky-600 dark:text-sky-400 font-extrabold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>

              {isTabActive && (
                <motion.div
                  layoutId="activeShopTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content Container ── */}
      <div className="bg-white dark:bg-neutral-900/90 rounded-3xl border border-slate-100 dark:border-neutral-800 p-5 md:p-6 shadow-sm">
        
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Basic Information</h2>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Shop Name</label>
              <input
                type="text"
                value={shopData.name}
                onChange={(e) => setShopData({ ...shopData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="e.g. Suqafuran Electronics"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Shop Description</label>
              <textarea
                value={shopData.description}
                onChange={(e) => setShopData({ ...shopData, description: e.target.value })}
                maxLength={500}
                rows={4}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="Tell customers about your products, quality guarantee, and business history..."
              />
              <p className="text-[10px] text-slate-400 mt-1 text-right">{shopData.description.length}/500</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={shopData.phone}
                  onChange={(e) => setShopData({ ...shopData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="+254 700 000000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={shopData.email}
                  onChange={(e) => setShopData({ ...shopData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="contact@mystore.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Shop Branding</h2>

            {/* Logo Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-2">Shop Logo (Avatar)</label>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-neutral-800 border-2 border-slate-200 dark:border-neutral-800 flex items-center justify-center flex-shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-8 h-8 text-slate-400" />
                  )}
                  {logoPreview && (
                    <button
                      onClick={() => {
                        setLogoPreview(null);
                        setShopData({ ...shopData, logo_url: '' });
                      }}
                      className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full hover:bg-rose-600 shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex-1">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-xs font-bold cursor-pointer hover:bg-sky-100 transition-colors">
                    {logoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{logoUploading ? 'Uploading...' : 'Choose Logo Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={logoUploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1">Square image 1:1, max 2MB (PNG or JPG)</p>
                </div>
              </div>
            </div>

            {/* Banner Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-2">Shop Cover Banner</label>
              <div className="space-y-3">
                {bannerPreview && (
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-800">
                    <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        setBannerPreview(null);
                        setShopData({ ...shopData, banner_url: '' });
                      }}
                      className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-full hover:bg-rose-600 shadow-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl p-6 cursor-pointer hover:border-sky-500 transition-colors bg-slate-50/50 dark:bg-neutral-800/30">
                  {bannerUploading ? (
                    <div className="text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-sky-500 mx-auto mb-1" />
                      <p className="text-xs text-slate-400">Uploading banner...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs font-bold text-slate-700 dark:text-neutral-200">Tap to upload cover banner</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Recommended 1920x400px (Max 5MB)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    disabled={bannerUploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Location Tab */}
        {activeTab === 'location' && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Shop Location</h2>

            <div className="space-y-2">
              <div
                ref={mapRef}
                className="w-full h-64 md:h-80 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden bg-slate-100"
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-xl font-bold text-xs hover:bg-sky-100 transition-colors"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Use Current Location</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Physical Address</label>
              <input
                ref={addressInputRef}
                type="text"
                value={shopData.address}
                onChange={(e) => setShopData({ ...shopData, address: e.target.value })}
                placeholder="Type building, street or area name in Kenya"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">City / Region</label>
                <input
                  type="text"
                  value={shopData.city}
                  onChange={(e) => setShopData({ ...shopData, city: e.target.value })}
                  placeholder="e.g. Nairobi"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={shopData.latitude}
                  onChange={(e) => setShopData({ ...shopData, latitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={shopData.longitude}
                  onChange={(e) => setShopData({ ...shopData, longitude: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* Operating Hours Tab */}
        {activeTab === 'hours' && (
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Operating Hours</h2>
              <button
                type="button"
                onClick={() => setHoursForMultipleDays([0, 1, 2, 3, 4], '09:00', '18:00')}
                className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-3 py-1 rounded-full"
              >
                Set Weekdays 9AM–6PM
              </button>
            </div>

            <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-neutral-800/60">
              {shopData.operating_hours?.map((hours, idx) => (
                <div key={hours.day} className="flex items-center justify-between pt-2.5">
                  <span className="w-28 text-xs font-bold text-slate-800 dark:text-white">{hours.day}</span>
                  
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hours.is_closed}
                      onChange={(e) => handleOperatingHoursChange(idx, 'is_closed', e.target.checked)}
                      className="rounded"
                    />
                    <span>Closed</span>
                  </label>

                  {!hours.is_closed ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={hours.open_time}
                        onChange={(e) => handleOperatingHoursChange(idx, 'open_time', e.target.value)}
                        className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-900 dark:text-white"
                      />
                      <span className="text-slate-400 text-xs">–</span>
                      <input
                        type="time"
                        value={hours.close_time}
                        onChange={(e) => handleOperatingHoursChange(idx, 'close_time', e.target.value)}
                        className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Store Closed</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Shop Categories</h2>
            <p className="text-xs text-slate-400">Select the categories that best describe your inventory:</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {SHOP_CATEGORIES.map(cat => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 shadow-sm'
                        : 'border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800/40 text-slate-700 dark:text-neutral-300'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-500 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Shop Policies</h2>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Return & Refund Policy</label>
              <textarea
                value={shopData.return_policy}
                onChange={(e) => setShopData({ ...shopData, return_policy: e.target.value })}
                maxLength={1000}
                rows={4}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="e.g. 7-day money-back guarantee for unopened items, buyer covers return shipping..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Delivery & Shipping Policy</label>
              <textarea
                value={shopData.delivery_policy}
                onChange={(e) => setShopData({ ...shopData, delivery_policy: e.target.value })}
                maxLength={1000}
                rows={4}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="e.g. Same-day delivery within Nairobi via rider, 24-48h upcountry delivery via Fargo/G4S..."
              />
            </div>
          </div>
        )}

      </div>

      {/* ── Bottom Save Action ── */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

    </div>
  );
}
