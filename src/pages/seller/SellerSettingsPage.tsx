import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  User, ShieldCheck, Globe, Lock, LogOut,
  CheckCircle, AlertCircle, Loader2, Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { sellerDashboardService } from '../../services/sellerDashboardService';
import { useAuthStore } from '../../store/useAuthStore';

export const SellerSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();

  // Profile Form
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Language & Alerts
  const [language, setLanguage] = useState('en');
  const [alerts, setAlerts] = useState({
    sms: true,
    whatsapp: true,
    email: true,
  });

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await sellerDashboardService.updateUserMe({
        full_name: fullName.trim(),
        phone: phone.trim(),
      });
      updateUser({ full_name: fullName.trim(), phone: phone.trim() });
      toast.success('Profile details saved!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    passwordMutation.mutate();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const isPhoneVerified = !!(user?.phone && user.phone.length >= 8);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">My Account</h1>
        <p className="text-sm text-slate-500">
          Manage your personal details, phone verification, and preferences.
        </p>
      </div>

      {/* ── Section 1: Personal Profile ────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
            <p className="text-xs text-slate-500">Your contact info for account login and notifications</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-slate-200 focus:border-sky-500 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 text-sm border border-slate-200 bg-slate-50 text-slate-500 rounded-xl cursor-not-allowed outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Phone Number</label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+254 700 000000"
                className="flex-1 px-4 py-3 text-sm border border-slate-200 focus:border-sky-500 rounded-xl outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-500/20 transition-all flex items-center gap-2"
          >
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Save Profile</span>
          </button>
        </form>
      </div>

      {/* ── Section 2: Phone Verification Status ────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
              isPhoneVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Phone Verification</h2>
              <p className="text-xs text-slate-500">Verified sellers get trusted badges and post instantly</p>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
            isPhoneVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {isPhoneVerified ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Verified Seller</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Unverified</span>
              </>
            )}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {isPhoneVerified
            ? `Your account is verified with ${phone || user?.phone}. You have full permission to post unlimited listings on Suqafuran.`
            : 'Please add and verify your active mobile phone number so buyers can contact you.'}
        </p>
      </div>

      {/* ── Section 3: Language & Notifications ─────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Language & Notifications</h2>
            <p className="text-xs text-slate-500">Choose your preferred language and how we alert you</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Display Language</label>
            <select
              value={language}
              onChange={e => {
                setLanguage(e.target.value);
                toast.success('Language updated');
              }}
              className="w-full sm:w-64 px-4 py-3 text-sm font-semibold border border-slate-200 focus:border-sky-500 rounded-xl bg-white outline-none"
            >
              <option value="en">English</option>
              <option value="sw">Kiswahili</option>
              <option value="so">Af-Soomaali</option>
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Buyer Message Alerts
            </label>

            {[
              { key: 'sms', label: 'SMS text notifications for new buyer inquiries' },
              { key: 'whatsapp', label: 'WhatsApp instant alerts when buyers message you' },
              { key: 'email', label: 'Daily email summary of views and leads' },
            ].map(item => (
              <label key={item.key} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={(alerts as any)[item.key]}
                  onChange={e => setAlerts(a => ({ ...a, [item.key]: e.target.checked }))}
                  className="w-4 h-4 text-sky-500 rounded focus:ring-sky-400 border-slate-300"
                />
                <span className="text-xs text-slate-700 font-medium">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 4: Security / Password Change ───────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
            <p className="text-xs text-slate-500">Keep your account safe with a strong password</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-slate-200 focus:border-sky-500 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-slate-200 focus:border-sky-500 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Confirm New</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-slate-200 focus:border-sky-500 rounded-xl outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordMutation.isPending}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2"
          >
            {passwordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>Update Password</span>
          </button>
        </form>
      </div>

      {/* ── Section 5: Log Out ──────────────────────────────────────── */}
      <div className="bg-red-50/50 rounded-3xl p-6 border border-red-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-red-950">Log Out of Your Account</h3>
          <p className="text-xs text-red-700 mt-0.5">You will need to sign in again to manage your products</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default SellerSettingsPage;
