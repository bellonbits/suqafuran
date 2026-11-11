"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Lock, Bell, Zap, CreditCard, HelpCircle, LogOut,
  ChevronRight, Check, ShieldCheck, Mail, Smartphone,
  Loader2, Sparkles, Store
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/services/api';
import { useAuthStore } from '@/store/useAuth';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    orderAlerts: true,
    lowStockAlerts: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get('/seller/settings').catch(() => null);
      if (res?.data) {
        setSettings({
          notifications: res.data.push_notifications ?? true,
          emailNotifications: res.data.email_notifications ?? true,
          orderAlerts: res.data.order_alerts ?? true,
          lowStockAlerts: res.data.low_stock_alerts ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof typeof settings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    setSaving(true);
    try {
      await api.put('/seller/settings', {
        push_notifications: updated.notifications,
        email_notifications: updated.emailNotifications,
        order_alerts: updated.orderAlerts,
        low_stock_alerts: updated.lowStockAlerts,
      }).catch(() => null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        <p className="text-sm font-semibold text-slate-400">Loading settings...</p>
      </div>
    );
  }

  const storeName = user?.business_name || user?.full_name || 'My Store';
  const storeEmail = user?.email || 'seller@suqafuran.com';

  return (
    <div className="space-y-5 pb-20 max-w-xl mx-auto px-1 md:px-0">
      
      {/* ── Screen 3 Top Profile Header Banner ── */}
      <div
        onClick={() => navigate('/seller-dashboard/shop')}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 p-6 text-white shadow-lg shadow-sky-500/20 cursor-pointer group"
      >
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full ring-4 ring-white/30 overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-black shadow-inner flex-shrink-0">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={storeName} className="w-full h-full object-cover" />
              ) : (
                <span>{storeName.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg md:text-xl font-black text-white truncate">{storeName}</h2>
                <ShieldCheck className="w-4 h-4 text-sky-200 flex-shrink-0" />
              </div>
              <p className="text-xs text-sky-100 truncate mt-0.5">{storeEmail}</p>
              <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Verified Seller</span>
              </div>
            </div>
          </div>

          <ChevronRight className="w-6 h-6 text-white/70 group-hover:translate-x-1 transition-transform flex-shrink-0" />
        </div>
      </div>

      {/* ── Section 1: Store & Account Information (Screen 3 Menu List) ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-100 dark:border-neutral-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-neutral-800">
        <button
          onClick={() => navigate('/seller-dashboard/shop')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-white">Account Information</p>
              <p className="text-[10px] text-slate-400">Shop profile, address, and contact</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-white">Change Password</p>
              <p className="text-[10px] text-slate-400">Security and authentication</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={() => navigate('/seller-dashboard/subscription')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-white">Subscription Plan</p>
              <p className="text-[10px] text-slate-400">Billing and tier limits</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              Premium
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>

      {/* ── Section 2: Notification Preferences (Interactive Toggles) ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-100 dark:border-neutral-800 shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-extrabold text-xs md:text-sm text-slate-900 dark:text-white">Notifications</h3>
          </div>
          {saveSuccess && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>

        <div className="space-y-3.5">
          {[
            { key: 'notifications', title: 'Push Notifications', desc: 'Instant alerts on mobile device', icon: Smartphone },
            { key: 'emailNotifications', title: 'Email Notifications', desc: 'Weekly summary & system notices', icon: Mail },
            { key: 'orderAlerts', title: 'Order Alerts', desc: 'Real-time alert when customer orders', icon: Bell },
            { key: 'lowStockAlerts', title: 'Low Stock Alerts', desc: 'Notify when products run low', icon: Zap },
          ].map((item) => {
            const isChecked = settings[item.key as keyof typeof settings];
            const Icon = item.icon;

            return (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-neutral-800 text-slate-400 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">{item.title}</p>
                    <p className="text-[10px] text-slate-400">{item.desc}</p>
                  </div>
                </div>

                {/* iOS-style toggle switch */}
                <button
                  type="button"
                  onClick={() => handleToggle(item.key as keyof typeof settings)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                    isChecked ? 'bg-sky-500' : 'bg-slate-200 dark:bg-neutral-800'
                  }`}
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`w-4 h-4 rounded-full bg-white shadow-md transform ${
                      isChecked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 3: Help & Log Out ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-100 dark:border-neutral-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-neutral-800">
        <button
          onClick={() => navigate('/seller-dashboard/reports')}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-white">Help & Support</p>
              <p className="text-[10px] text-slate-400">Seller guide, FAQs, and support ticket</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-4 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs md:text-sm font-bold text-rose-600">Log Out</p>
              <p className="text-[10px] text-rose-400">Sign out of your store account</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* ── Password Change Modal ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-sm p-6 space-y-4 border border-slate-100 dark:border-neutral-800 shadow-2xl">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Change Password</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            {passwordError && (
              <p className="text-[11px] text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl">
                {passwordError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!passwordForm.current || !passwordForm.new) {
                    setPasswordError('Please fill in all fields');
                    return;
                  }
                  try {
                    await api.post('/auth/change-password', {
                      current_password: passwordForm.current,
                      new_password: passwordForm.new,
                    });
                    alert('Password updated successfully');
                    setShowPasswordModal(false);
                  } catch (e: any) {
                    setPasswordError(e?.response?.data?.detail || 'Failed to update password');
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 text-white shadow-md shadow-sky-500/20"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
