"use client";

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuth';
import { authService } from '@/services/authService';
import { Mail, Phone, MapPin, Shield, Calendar, LogOut, Loader2, AlertCircle, Copy, Check, Camera } from 'lucide-react';
import api, { resolveMediaUrl } from '@/services/api';
import { VerificationSection } from '@/components/features/VerificationSection';

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'verification'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await authService.getCurrentUser();
        setProfile(profileData);
      } catch (err: any) {
        setError('Failed to load profile. Please try again.');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    // Check if verification tab should be active from URL params
    const tab = searchParams.get('tab');
    if (tab === 'verification') {
      setActiveTab('verification');
    }
  }, [isAuthenticated, router, searchParams]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setUploading(true);
      const res = await authService.uploadAvatar(file);

      if (res && res.avatar_url) {
        setProfile((prev: any) => ({ ...prev, avatar_url: res.avatar_url }));
        if (user) {
          useAuthStore.getState().setUser({ ...user, avatar_url: res.avatar_url });
        }
        setAvatarPreview(null);
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert('Failed to upload image');
      setAvatarPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#6cd4ff]" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 p-4">
        <div className="max-w-md w-full p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
          <div className="flex gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-900 dark:text-red-200">Error</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error || 'Failed to load profile'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const resolvedAvatar = avatarPreview || resolveMediaUrl(profile.avatar_url);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Account Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your profile and verification</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-sky-500 text-gray-900 dark:text-white'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'verification'
                ? 'border-sky-500 text-gray-900 dark:text-white'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            Verification
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
        <div className="mb-8">
          <div className="relative w-fit">
            {resolvedAvatar ? (
              <img
                src={resolvedAvatar}
                alt={profile.full_name}
                className="w-24 h-24 rounded-2xl object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="avatar-fallback w-24 h-24 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-black text-3xl"
              style={{ display: resolvedAvatar ? 'none' : 'flex' }}
            >
              {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            <button
              onClick={handleAvatarClick}
              disabled={uploading}
              className="absolute bottom-0 right-0 p-2 bg-[#5bc0e8] hover:bg-sky-700 disabled:bg-slate-400 text-white rounded-full shadow-lg transition-colors"
              title="Change profile picture"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </div>

          {avatarPreview && (
            <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              <p>Preview: {uploading ? 'Uploading...' : 'Image ready to upload'}</p>
            </div>
          )}
        </div>
        )}

        {activeTab === 'profile' && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
            <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Full Name</h3>
            <p className="text-lg font-bold text-gray-900 dark:text-white mb-3">{profile.full_name}</p>
            <button
              onClick={() => handleCopy(profile.full_name, 'fullname')}
              className="flex items-center gap-2 text-xs font-semibold text-[#6cd4ff] dark:text-sky-400 hover:text-sky-700"
            >
              {copiedField === 'fullname' ? (<><Check className="w-3.5 h-3.5" /> Copied</>) : (<><Copy className="w-3.5 h-3.5" /> Copy</>)}
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Email</h3>
              {profile.email_verified && (
                <span className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                  <Shield className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white break-all mb-3">{profile.email}</p>
            <button
              onClick={() => handleCopy(profile.email, 'email')}
              className="flex items-center gap-2 text-xs font-semibold text-[#6cd4ff] dark:text-sky-400 hover:text-sky-700"
            >
              {copiedField === 'email' ? (<><Check className="w-3.5 h-3.5" /> Copied</>) : (<><Copy className="w-3.5 h-3.5" /> Copy</>)}
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> Phone
              </h3>
              {profile.phone_verified && (
                <span className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                  <Shield className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white mb-3">{profile.phone || 'Not provided'}</p>
            {profile.phone && (
              <button
                onClick={() => handleCopy(profile.phone, 'phone')}
                className="flex items-center gap-2 text-xs font-semibold text-[#6cd4ff] dark:text-sky-400 hover:text-sky-700"
              >
                {copiedField === 'phone' ? (<><Check className="w-3.5 h-3.5" /> Copied</>) : (<><Copy className="w-3.5 h-3.5" /> Copy</>)}
              </button>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
            <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
              <MapPin className="w-3.5 h-3.5" /> Location
            </h3>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{profile.location || 'Not specified'}</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
            <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Shield className="w-3.5 h-3.5" /> Trust Level
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900 dark:text-white">{profile.trust_level || 'NEW'}</span>
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">(Score: {profile.trust_score || 0})</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
            <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Calendar className="w-3.5 h-3.5" /> Member Since
            </h3>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {new Date(profile.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-4">Account Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${profile.is_active ? 'bg-[#02CCFE]' : 'bg-red-500'}`}></div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{profile.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${profile.is_verified ? 'bg-[#02CCFE]' : 'bg-yellow-500'}`}></div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{profile.is_verified ? 'Verified' : 'Not Verified'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${!profile.is_suspended ? 'bg-[#02CCFE]' : 'bg-red-500'}`}></div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{!profile.is_suspended ? 'Good' : 'Suspended'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${!profile.is_flagged ? 'bg-[#02CCFE]' : 'bg-orange-500'}`}></div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{!profile.is_flagged ? 'Clean' : 'Flagged'}</span>
            </div>
          </div>
        </div>
        </>
        )}

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <VerificationSection />
        )}
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#6cd4ff]" />
          <p className="text-gray-600 dark:text-gray-400">Loading account...</p>
        </div>
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  );
}
