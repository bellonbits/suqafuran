import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Truck, MapPin, Package, Scale, DollarSign, Plus, X,
  Edit2, Trash2, Check, Zap, Navigation
} from 'lucide-react';

import {
  getLocalDeliveryZones, saveLocalDeliveryZones,
  getLocalDeliverySettings, saveLocalDeliverySettings,
  fmtKSh
} from '../../services/sellerDashboardService';
import type { DeliveryZone } from '../../services/sellerDashboardService';
import { cn } from '../../utils/cn';

type PricingModel = 'fixed' | 'distance' | 'weight' | 'order_value';

interface PriceRange { from: number; to: number | null; fee: number; label?: string }

const DEFAULT_ZONES: DeliveryZone[] = [
  { id: '1', name: 'Eastleigh', fee: 200, is_active: true },
  { id: '2', name: 'Nairobi CBD', fee: 250, is_active: true },
  { id: '3', name: 'South C', fee: 300, is_active: true },
  { id: '4', name: 'Westlands', fee: 350, is_active: true },
  { id: '5', name: 'Kasarani', fee: 300, is_active: true },
  { id: '6', name: 'Mombasa', fee: 700, is_active: false },
];

const DEFAULT_DISTANCE_RANGES: PriceRange[] = [
  { from: 0, to: 5, fee: 200, label: '0–5 KM' },
  { from: 5, to: 10, fee: 350, label: '5–10 KM' },
  { from: 10, to: 20, fee: 500, label: '10–20 KM' },
];

const DEFAULT_WEIGHT_RANGES: PriceRange[] = [
  { from: 0, to: 2, fee: 200, label: '0–2 KG' },
  { from: 2, to: 5, fee: 400, label: '2–5 KG' },
  { from: 5, to: 10, fee: 700, label: '5–10 KG' },
];

const DEFAULT_VALUE_RANGES: PriceRange[] = [
  { from: 0, to: 5000, fee: 300, label: 'Below KSh 5,000' },
  { from: 5000, to: null, fee: 0, label: 'KSh 5,000 and above (Free)' },
];

const TRACKING_STATUSES = [
  { label: 'Pickup Requested', color: 'bg-slate-200', active: true },
  { label: 'Rider Assigned', color: 'bg-sky-200', active: false },
  { label: 'Rider En Route', color: 'bg-blue-400', active: false },
  { label: 'Package Collected', color: 'bg-indigo-400', active: false },
  { label: 'Out for Delivery', color: 'bg-purple-400', active: false },
  { label: 'Delivered', color: 'bg-emerald-400', active: false },
];

export const SellerDeliveryPage: React.FC = () => {
  const [activePricingTab, setActivePricingTab] = useState<PricingModel>('fixed');
  const [zones, setZones] = useState<DeliveryZone[]>(() => {
    const saved = getLocalDeliveryZones();
    return saved.length > 0 ? saved : DEFAULT_ZONES;
  });
  const [settings, setSettings] = useState(() => ({
    standard_fee: 300,
    express_fee: 600,
    free_delivery: false,
    min_order_free_delivery: 5000,
    pickup_available: true,
    same_day_delivery: false,
    fixed_fee: 300,
    ...getLocalDeliverySettings(),
  }));
  const [distanceRanges, setDistanceRanges] = useState<PriceRange[]>(DEFAULT_DISTANCE_RANGES);
  const [weightRanges, setWeightRanges] = useState<PriceRange[]>(DEFAULT_WEIGHT_RANGES);
  const [valueRanges, setValueRanges] = useState<PriceRange[]>(DEFAULT_VALUE_RANGES);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [zoneForm, setZoneForm] = useState({ name: '', fee: '', description: '' });

  const saveSetting = (key: string, val: any) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    saveLocalDeliverySettings(updated);
  };

  const saveZones = (newZones: DeliveryZone[]) => {
    setZones(newZones);
    saveLocalDeliveryZones(newZones);
  };

  const openAddZone = () => {
    setEditingZone(null);
    setZoneForm({ name: '', fee: '', description: '' });
    setIsZoneModalOpen(true);
  };

  const openEditZone = (z: DeliveryZone) => {
    setEditingZone(z);
    setZoneForm({ name: z.name, fee: String(z.fee), description: z.description || '' });
    setIsZoneModalOpen(true);
  };

  const handleSaveZone = () => {
    if (!zoneForm.name.trim() || !zoneForm.fee) { toast.error('Zone name and fee required'); return; }
    const fee = parseFloat(zoneForm.fee);
    if (editingZone) {
      const updated = zones.map(z => z.id === editingZone.id ? { ...z, ...zoneForm, fee } : z);
      saveZones(updated);
      toast.success('Zone updated');
    } else {
      const newZone: DeliveryZone = { id: Date.now().toString(), name: zoneForm.name.trim(), fee, is_active: true, description: zoneForm.description };
      saveZones([...zones, newZone]);
      toast.success('Zone added');
    }
    setIsZoneModalOpen(false);
  };

  const deleteZone = (id: string) => {
    saveZones(zones.filter(z => z.id !== id));
    toast.success('Zone deleted');
  };

  const toggleZone = (id: string) => {
    saveZones(zones.map(z => z.id === id ? { ...z, is_active: !z.is_active } : z));
  };

  const handleSaveSettings = () => {
    saveLocalDeliverySettings(settings);
    toast.success('Delivery settings saved!');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Delivery Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure how you deliver to customers</p>
      </div>

      {/* Delivery Settings */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
          <Truck className="w-5 h-5 text-sky-500" /> Delivery Settings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Standard Delivery Fee (KSh)</label>
            <input type="number" value={settings.standard_fee} onChange={e => saveSetting('standard_fee', +e.target.value)} className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Express Delivery Fee (KSh)</label>
            <input type="number" value={settings.express_fee} onChange={e => saveSetting('express_fee', +e.target.value)} className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Min. Order for Free Delivery (KSh)</label>
            <input type="number" value={settings.min_order_free_delivery} onChange={e => saveSetting('min_order_free_delivery', +e.target.value)} className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400" />
          </div>
          {/* Toggles */}
          {[
            { key: 'free_delivery', label: 'Free Delivery', desc: 'Offer free delivery on all orders' },
            { key: 'pickup_available', label: 'Pickup Available', desc: 'Allow customers to pick up orders' },
            { key: 'same_day_delivery', label: 'Same-Day Delivery', desc: 'Offer same-day delivery service' },
          ].map(({ key, label, desc }) => (
            <div key={key} className={cn('flex items-center justify-between p-4 rounded-xl border transition-colors', settings[key as keyof typeof settings] ? 'bg-sky-50 border-sky-200' : 'bg-slate-50 border-slate-100')}>
              <div>
                <p className="text-sm font-bold text-slate-800">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => saveSetting(key, !settings[key as keyof typeof settings])}
                className={cn('relative w-12 h-6 rounded-full transition-all duration-200', settings[key as keyof typeof settings] ? 'bg-sky-500' : 'bg-slate-300')}
              >
                <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200', settings[key as keyof typeof settings] ? 'translate-x-6' : '')} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={handleSaveSettings} className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
          <Check className="w-4 h-4" /> Save Settings
        </button>
      </div>

      {/* Delivery Zones */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-500" /> Delivery Zones
          </h2>
          <button onClick={openAddZone} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Add Zone
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Zone</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Delivery Fee</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {zones.map(zone => (
                <tr key={zone.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800">{zone.name}</p>
                    {zone.description && <p className="text-xs text-slate-400">{zone.description}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-900">{fmtKSh(zone.fee)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleZone(zone.id)} className={cn('text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors', zone.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200')}>
                      {zone.is_active ? '● Active' : '○ Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEditZone(zone)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteZone(zone.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing Models */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-sky-500" /> Pricing Models
        </h2>
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {([
            { key: 'fixed' as PricingModel, label: 'Fixed Fee', icon: DollarSign },
            { key: 'distance' as PricingModel, label: 'Distance-Based', icon: Navigation },
            { key: 'weight' as PricingModel, label: 'Weight-Based', icon: Scale },
            { key: 'order_value' as PricingModel, label: 'Order Value', icon: Package },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setActivePricingTab(tab.key)}
              className={cn('flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all',
                activePricingTab === tab.key ? 'bg-sky-500 text-white shadow-sm' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-sky-300'
              )}>
              <tab.icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          ))}
        </div>

        {/* Fixed */}
        {activePricingTab === 'fixed' && (
          <div className="max-w-sm">
            <p className="text-sm text-slate-500 mb-3">All orders are charged the same flat delivery fee regardless of location or weight.</p>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Fixed Delivery Fee (KSh)</label>
            <input type="number" value={settings.fixed_fee} onChange={e => saveSetting('fixed_fee', +e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400" />
            <div className="mt-3 p-3 bg-sky-50 border border-sky-100 rounded-xl">
              <p className="text-xs font-bold text-sky-700">Example: All Nairobi Orders = {fmtKSh(settings.fixed_fee)}</p>
            </div>
          </div>
        )}

        {/* Distance */}
        {activePricingTab === 'distance' && (
          <div>
            <p className="text-sm text-slate-500 mb-3">Delivery fee varies based on distance from your location to the customer.</p>
            <div className="space-y-2">
              {distanceRanges.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <input value={r.label || ''} onChange={e => setDistanceRanges(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                      className="text-sm font-semibold text-slate-700 bg-transparent border-none outline-none w-full" placeholder="Range label" />
                  </div>
                  <input type="number" value={r.fee} onChange={e => setDistanceRanges(prev => prev.map((x, j) => j === i ? { ...x, fee: +e.target.value } : x))}
                    className="w-28 px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
                  <span className="text-xs text-slate-400 w-8">KSh</span>
                  <button onClick={() => setDistanceRanges(prev => prev.filter((_, j) => j !== i))} className="p-1 text-red-400 hover:text-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={() => setDistanceRanges(prev => [...prev, { from: 0, to: null, fee: 0, label: 'New range' }])}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Range
              </button>
            </div>
          </div>
        )}

        {/* Weight */}
        {activePricingTab === 'weight' && (
          <div>
            <p className="text-sm text-slate-500 mb-3">Delivery fee varies based on the total weight of the order.</p>
            <div className="space-y-2">
              {weightRanges.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <input value={r.label || ''} onChange={e => setWeightRanges(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                      className="text-sm font-semibold text-slate-700 bg-transparent border-none outline-none w-full" placeholder="Weight range" />
                  </div>
                  <input type="number" value={r.fee} onChange={e => setWeightRanges(prev => prev.map((x, j) => j === i ? { ...x, fee: +e.target.value } : x))}
                    className="w-28 px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
                  <span className="text-xs text-slate-400 w-8">KSh</span>
                  <button onClick={() => setWeightRanges(prev => prev.filter((_, j) => j !== i))} className="p-1 text-red-400 hover:text-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={() => setWeightRanges(prev => [...prev, { from: 0, to: null, fee: 0, label: 'New range' }])}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Range
              </button>
            </div>
          </div>
        )}

        {/* Order Value */}
        {activePricingTab === 'order_value' && (
          <div>
            <p className="text-sm text-slate-500 mb-3">Delivery fee varies based on the total order value.</p>
            <div className="space-y-2">
              {valueRanges.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <input value={r.label || ''} onChange={e => setValueRanges(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                      className="text-sm font-semibold text-slate-700 bg-transparent border-none outline-none w-full" placeholder="Value range" />
                  </div>
                  <input type="number" value={r.fee} onChange={e => setValueRanges(prev => prev.map((x, j) => j === i ? { ...x, fee: +e.target.value } : x))}
                    className="w-28 px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
                  <span className="text-xs text-slate-400 w-8">{r.fee === 0 ? 'FREE' : 'KSh'}</span>
                  <button onClick={() => setValueRanges(prev => prev.filter((_, j) => j !== i))} className="p-1 text-red-400 hover:text-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button onClick={() => setValueRanges(prev => [...prev, { from: 0, to: null, fee: 300, label: 'New range' }])}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Range
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Suqafuran Express */}
      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e3a5f] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
            <Zap className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Suqafuran Express</h2>
            <p className="text-xs text-sky-400">Integrated Logistics — Coming Soon</p>
          </div>
          <span className="ml-auto px-3 py-1.5 text-xs font-black bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full">Beta</span>
        </div>
        <p className="text-sm text-white/70 mb-5">Request our dedicated riders to handle your deliveries end-to-end. Real-time tracking, proof of delivery, and customer notifications built in.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          {['Request Pickup', 'Schedule Time', 'Assign Rider', 'Track Rider', 'Delivery History', 'Rate Service'].map(f => (
            <div key={f} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
              <Check className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-white/80">{f}</span>
            </div>
          ))}
        </div>

        {/* Tracking timeline preview */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Delivery Tracking Status</p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {TRACKING_STATUSES.map((s, i) => (
              <React.Fragment key={s.label}>
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', i === 0 ? 'bg-sky-500' : 'bg-white/10')}>
                    {i === 0 ? <Check className="w-3.5 h-3.5 text-white" /> : <span className="w-2 h-2 rounded-full bg-white/30" />}
                  </div>
                  <span className="text-[9px] text-white/50 mt-1.5 text-center w-16">{s.label}</span>
                </div>
                {i < TRACKING_STATUSES.length - 1 && (
                  <div className={cn('h-0.5 flex-1 min-w-[20px] rounded-full', i === 0 ? 'bg-sky-500/40' : 'bg-white/10')} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <button className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold rounded-xl transition-colors">
          <Zap className="w-4 h-4" /> Join Waitlist
        </button>
      </div>

      {/* Zone Modal */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-slate-900">{editingZone ? 'Edit Zone' : 'Add Delivery Zone'}</h3>
              <button onClick={() => setIsZoneModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Zone Name *</label>
                <input value={zoneForm.name} onChange={e => setZoneForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Westlands, Mombasa CBD" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Delivery Fee (KSh) *</label>
                <input type="number" value={zoneForm.fee} onChange={e => setZoneForm(f => ({ ...f, fee: e.target.value }))} placeholder="e.g. 300" min="0" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Description (optional)</label>
                <input value={zoneForm.description} onChange={e => setZoneForm(f => ({ ...f, description: e.target.value }))} placeholder="Additional notes about this zone" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setIsZoneModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSaveZone} className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors shadow-sm">{editingZone ? 'Save Changes' : 'Add Zone'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
