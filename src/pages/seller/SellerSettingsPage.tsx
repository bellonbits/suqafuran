import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Shield, Bell, FileText, Lock, Loader2 } from 'lucide-react';

import { toast } from 'react-hot-toast';
import { sellerDashboardService } from '../../services/sellerDashboardService';
import { cn } from '../../utils/cn';

export const SellerSettingsPage: React.FC = () => {
  const [settingsTab, setSettingsTab] = useState<'account' | 'notifications' | 'policies'>('account');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Policy Text Editors
  const [policies, setPolicies] = useState({
    return_policy: 'All product returns must be filed within 7 days of pickup or delivery. Goods must be unopened and in their original packaging.',
    refund_policy: 'Refunds are processed back to M-Pesa or source wallet within 48 hours once returned packages are checked and approved.',
    delivery_policy: 'Standard delivery takes 1-3 business days. Express delivery takes under 24 hours. Free delivery is applied based on active store value filters.',
  });

  // Notifications Toggles
  const [notifs, setNotifs] = useState({
    email_new_orders: true,
    email_messages: true,
    sms_new_orders: true,
    sms_payouts: true,
    push_new_orders: true,
  });

  const passwordMutation = useMutation({
    mutationFn: () => sellerDashboardService.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to change password');
    },
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('All fields required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    passwordMutation.mutate();
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Store policies updated successfully!');
  };

  const handleSaveNotifs = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Notification preferences updated!');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[900px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage credentials, notifications, and customer-facing policies</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-px">
        {[
          { key: 'account' as const, label: 'Account Security', icon: Shield },
          { key: 'notifications' as const, label: 'Notifications', icon: Bell },
          { key: 'policies' as const, label: 'Store Policies', icon: FileText },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setSettingsTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-3 text-xs font-bold transition-all relative border-b-2',
              settingsTab === t.key ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Account view */}
      {settingsTab === 'account' && (
        <form onSubmit={handlePasswordChange} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
            <Lock className="w-4 h-4 text-sky-500" /> Change Password
          </h2>
          <div className="space-y-3 max-w-sm">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>
          <button type="submit" disabled={passwordMutation.isPending} className="mt-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5">
            {passwordMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Password
          </button>
        </form>
      )}

      {/* Notifications view */}
      {settingsTab === 'notifications' && (
        <form onSubmit={handleSaveNotifs} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
            <Bell className="w-4 h-4 text-sky-500" /> Notifications Settings
          </h2>
          <div className="space-y-3">
            {[
              { key: 'email_new_orders' as const, label: 'Email for new orders', desc: 'Receive invoice details and notifications when products are purchased.' },
              { key: 'email_messages' as const, label: 'Email for chat questions', desc: 'Receive reminders for unread customer conversation messages.' },
              { key: 'sms_new_orders' as const, label: 'SMS order tracking alerts', desc: 'Standard carrier charges apply for direct phone text triggers.' },
              { key: 'sms_payouts' as const, label: 'SMS financial payouts', desc: 'Receive mobile money withdraw logs instantly on success.' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-800">{item.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifs({ ...notifs, [item.key]: !notifs[item.key] })}
                  className={cn('relative w-10 h-5.5 rounded-full transition-all', notifs[item.key] ? 'bg-sky-500' : 'bg-slate-200')}
                >
                  <span className={cn('absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full transition-all shadow-sm', notifs[item.key] ? 'translate-x-4.5' : '')} />
                </button>
              </div>
            ))}
          </div>
          <button type="submit" className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition-all">
            Save Notification Preferences
          </button>
        </form>
      )}

      {/* Policies view */}
      {settingsTab === 'policies' && (
        <form onSubmit={handleSavePolicies} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
            <FileText className="w-4 h-4 text-sky-500" /> Customer-Facing Policies
          </h2>
          <div className="space-y-4">
            {[
              { key: 'return_policy' as const, label: 'Return Policy', placeholder: 'Write return policy rules...' },
              { key: 'refund_policy' as const, label: 'Refund Policy', placeholder: 'Write refund conditions...' },
              { key: 'delivery_policy' as const, label: 'Delivery Policy', placeholder: 'Write delivery timelines...' },
            ].map(p => (
              <div key={p.key}>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">{p.label}</label>
                <textarea
                  value={policies[p.key]}
                  onChange={e => setPolicies({ ...policies, [p.key]: e.target.value })}
                  rows={3}
                  className="w-full p-4 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 resize-none"
                  placeholder={p.placeholder}
                />
              </div>
            ))}
          </div>
          <button type="submit" className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl transition-all">
            Update Policies
          </button>
        </form>
      )}
    </div>
  );
};
