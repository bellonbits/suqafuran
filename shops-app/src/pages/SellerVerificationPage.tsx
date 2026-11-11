"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, ShieldAlert, Shield, Clock, CheckCircle2,
  Upload, X, AlertCircle, ChevronRight, Loader2, BadgeCheck, Star, TrendingUp, Sparkles, FileText,
  Store, Users, FileUp
} from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/useAuth';

type VerificationStatus = 'not_started' | 'pending' | 'approved' | 'rejected';

interface VerificationData {
  status: VerificationStatus;
  submitted_at?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  phone_verified: boolean;
  email_verified: boolean;
}

interface Requirement {
  key: string;
  label: string;
  description: string;
  required: boolean;
  completed: boolean;
}

export default function VerificationPage() {
  const { user } = useAuthStore();
  const [verification, setVerification] = useState<VerificationData>({
    status: 'not_started',
    phone_verified: false,
    email_verified: false,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadVerification();
  }, []);

  const loadVerification = async () => {
    try {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // First, try to auto-verify
      const autoVerifyRes = await api.post(
        `/subscriptions/sellers/${user.id}/verification/auto-verify`
      ).catch(() => null);

      if (autoVerifyRes?.data?.auto_verified) {
        setVerification({
          status: 'approved',
          phone_verified: true,
          email_verified: true,
        });
        setSuccess('Auto-verified as existing shop owner! Your store badge is active.');
        setLoading(false);
        return;
      }

      // Fetch regular verification status
      const statusRes = await api.get(
        `/subscriptions/sellers/${user.id}/verification/status`
      ).catch(() => null);

      if (statusRes?.data) {
        setVerification({
          status: statusRes.data.status as VerificationStatus,
          phone_verified: statusRes.data.phone_verified,
          email_verified: statusRes.data.email_verified,
        });
      } else {
        const profileRes = await api.get('/sellers/me').catch(() => null);
        if (profileRes?.data) {
          setVerification((prev) => ({
            ...prev,
            phone_verified: !!profileRes.data.phone,
            email_verified: !!profileRes.data.email,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load verification status:', err);
    } finally {
      setLoading(false);
    }
  };

  const requirements: Requirement[] = [
    {
      key: 'national_id',
      label: 'National ID or Passport',
      description: 'Clear photo or scan of your government-issued ID',
      required: true,
      completed: files.length > 0 || verification.status === 'approved' || verification.status === 'pending',
    },
    {
      key: 'phone',
      label: 'Phone Verification',
      description: 'Registered Kenyan phone number confirmed via SMS',
      required: true,
      completed: verification.phone_verified,
    },
    {
      key: 'email',
      label: 'Email Verification',
      description: 'Account email confirmed and active',
      required: true,
      completed: verification.email_verified,
    },
    {
      key: 'business_reg',
      label: 'Business Registration (optional)',
      description: 'Certificate of incorporation or business permit for official shop status',
      required: false,
      completed: false,
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError('Please upload at least your National ID or Passport.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('documents', f));
      await api.post('/sellers/me/verification-documents', formData);
      setVerification((prev) => ({ ...prev, status: 'pending' }));
      setFiles([]);
      setSuccess("Documents submitted successfully! Our team will review them within 1–2 business days.");
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit documents. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const benefits = [
    { icon: TrendingUp, label: 'Higher search ranking', desc: 'Verified shops appear at the top of marketplace search results' },
    { icon: Star, label: 'Increased buyer trust', desc: 'Buyers strongly prefer verified sellers — seeing up to 30% more deal inquiries' },
    { icon: BadgeCheck, label: 'Official verified badge', desc: 'The ✓ Verified badge appears on your profile and all product cards' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        <p className="text-sm font-semibold text-slate-400">Loading verification status...</p>
      </div>
    );
  }

  const isApproved = verification.status === 'approved';
  const isPending = verification.status === 'pending';
  const isRejected = verification.status === 'rejected';

  return (
    <div className="space-y-5 pb-20 max-w-5xl mx-auto px-1 md:px-0">
      
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Shop Verification
          </h1>
          <p className="text-xs text-slate-400 font-medium hidden sm:block mt-0.5">
            Get the <span className="font-bold text-emerald-600 dark:text-emerald-400">✓ Verified Shop</span> badge and boost buyer trust
          </p>
        </div>
      </div>

      {/* ── Shop Management Sub-sections Navigation Pills ── */}
      <div className="bg-slate-100/80 dark:bg-neutral-900/80 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar border border-slate-200/50 dark:border-neutral-800/60 shadow-xs">
        <Link
          to="/seller-dashboard/shop"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-800/50 transition-colors whitespace-nowrap"
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
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-white dark:bg-neutral-800 text-sky-600 dark:text-sky-400 shadow-xs whitespace-nowrap"
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

      {/* ── Status Banner (Modernized) ── */}
      {isApproved && (
        <div className="flex items-start gap-3.5 p-4 md:p-5 rounded-3xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-900/40 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm md:text-base text-emerald-900 dark:text-emerald-200">
                Verified Merchant Shop
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300/80 mt-1 leading-relaxed">
              Your store is fully verified! The official <span className="font-bold">✓ Verified Shop</span> badge is now active across your listings and storefront.
            </p>
          </div>
        </div>
      )}

      {isPending && (
        <div className="flex items-start gap-3.5 p-4 md:p-5 rounded-3xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/40 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm md:text-base text-sky-900 dark:text-sky-200">
              Documents Under Review
            </h3>
            <p className="text-xs text-sky-700 dark:text-sky-300/80 mt-1 leading-relaxed">
              Your credentials are being reviewed by our moderation team. Verification typically completes within 1–2 business days.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="flex items-start gap-3.5 p-4 md:p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm md:text-base text-rose-900 dark:text-rose-200">
              Verification Needs Resubmission
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300/80 mt-1 leading-relaxed">
              {verification.rejection_reason || 'Please re-upload a clearer image of your National ID or government passport.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Left Column: Requirements */}
        <div className="bg-white dark:bg-neutral-900/90 rounded-3xl border border-slate-100 dark:border-neutral-800 p-5 md:p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            Verification Steps
          </h2>

          <div className="space-y-3.5">
            {requirements.map((req) => (
              <div
                key={req.key}
                className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/70 dark:bg-neutral-800/40 border border-slate-100 dark:border-neutral-800/60"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  req.completed
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-200 dark:bg-neutral-700 text-slate-400'
                }`}>
                  {req.completed ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-neutral-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-white truncate">
                      {req.label}
                    </p>
                    {!req.required && (
                      <span className="text-[10px] text-slate-400 font-medium">(optional)</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    {req.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Upload input for new submissions */}
          {!isApproved && (
            <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300">
                Upload Identification Document
              </label>

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl p-5 cursor-pointer hover:border-sky-500 transition-colors bg-slate-50/50 dark:bg-neutral-800/30">
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <p className="text-xs font-bold text-slate-700 dark:text-neutral-200">Choose ID or Passport photo</p>
                <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, or PDF up to 5MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                />
              </label>

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-neutral-800 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-sky-500 flex-shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-white truncate">{file.name}</span>
                      </div>
                      <button onClick={() => removeFile(idx)} className="p-1 text-slate-400 hover:text-rose-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>Submit for Review</span>
                  </button>
                </div>
              )}

              {error && (
                <p className="text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Badge Preview & Benefits */}
        <div className="space-y-4">
          
          {/* Badge Preview Card */}
          <div className="bg-gradient-to-br from-sky-50/70 via-blue-50/50 to-indigo-50/40 dark:from-neutral-900 dark:to-neutral-900 rounded-3xl p-6 border border-sky-100 dark:border-neutral-800 text-center shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-600 dark:text-sky-400 block mb-3">
              Badge Preview
            </span>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-emerald-300 dark:border-emerald-700/60 rounded-full shadow-md shadow-emerald-500/10 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-xs md:text-sm font-black text-slate-900 dark:text-white">Verified Shop</span>
            </div>

            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-xs mx-auto mt-2">
              Displayed prominently on your shop profile, product cards, and search results
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="bg-white dark:bg-neutral-900/90 rounded-3xl border border-slate-100 dark:border-neutral-800 p-5 md:p-6 shadow-sm space-y-3.5">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Verification Perks
            </h3>

            <div className="space-y-3">
              {benefits.map((b, idx) => {
                const Icon = b.icon;
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-xs md:text-sm text-slate-800 dark:text-white">
                        {b.label}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {b.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
