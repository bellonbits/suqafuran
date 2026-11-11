"use client";

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus, Trash2, Shield, Package, MessageSquare,
  ShoppingBag, Crown, Users, Loader2, Mail, X, AlertCircle, CheckCircle2,
  Check, User, Store, ShieldCheck, FileUp
} from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/useAuth';

type StaffRole = 'manager' | 'sales' | 'inventory';

interface StaffMember {
  id: number;
  email: string;
  name: string;
  role: StaffRole;
  last_active?: string;
  invited_at: string;
  status: 'active' | 'pending';
}

const ROLE_CONFIG: Record<StaffRole, { label: string; icon: any; color: string; perms: string[] }> = {
  manager: {
    label: 'Manager',
    icon: Shield,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    perms: ['Manage products & orders', 'Reply to messages', 'Update stock'],
  },
  sales: {
    label: 'Salesperson',
    icon: MessageSquare,
    color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    perms: ['Reply to messages', 'View orders', 'View products'],
  },
  inventory: {
    label: 'Inventory',
    icon: Package,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    perms: ['Update stock only', 'View products'],
  },
};

const PERMISSION_MATRIX = [
  { action: 'Manage products', manager: true, sales: false, inventory: false },
  { action: 'Manage orders', manager: true, sales: false, inventory: false },
  { action: 'Reply to messages', manager: true, sales: true, inventory: false },
  { action: 'Update stock', manager: true, sales: false, inventory: true },
  { action: 'View analytics', manager: true, sales: false, inventory: false },
  { action: 'View products', manager: true, sales: true, inventory: true },
];

function InviteModal({
  onClose, onInvited, currentCount, maxStaff,
}: {
  onClose: () => void;
  onInvited: () => void;
  currentCount: number;
  maxStaff: number;
}) {
  const [form, setForm] = useState({ email: '', role: 'sales' as StaffRole });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canInvite = currentCount < maxStaff;

  const handleInvite = async () => {
    if (!form.email.trim()) { setError('Please enter an email address.'); return; }
    if (!canInvite) { setError(`You've reached the staff limit (${maxStaff}) for your plan.`); return; }
    setSaving(true);
    setError('');
    try {
      await api.post('/sellers/me/staff', { email: form.email.trim(), role: form.role });
      onInvited();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to invite staff member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6 space-y-4 border border-slate-100 dark:border-neutral-800 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Invite Team Member</h2>
            <p className="text-xs text-slate-400 mt-0.5">{currentCount} of {maxStaff} staff slots used</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {!canInvite && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>You have reached your staff limit. Upgrade plan to add more.</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1.5">
              Staff Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="colleague@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/40 text-sky-800 dark:text-sky-300 text-[11px] leading-relaxed">
            <Mail className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
            <span>An official invitation email will be sent to their address with a link to accept and join your shop team.</span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Role &amp; Access</label>
            <div className="space-y-2">
              {(Object.keys(ROLE_CONFIG) as StaffRole[]).map((role) => {
                const config = ROLE_CONFIG[role];
                const Icon = config.icon;
                const isSelected = form.role === role;

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm({ ...form, role })}
                    className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 shadow-sm'
                        : 'border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="font-extrabold text-xs text-slate-800 dark:text-white">{config.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{config.perms.join(' · ')}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInvite}
              disabled={saving || !canInvite}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>Send Invite</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const { user } = useAuthStore();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [maxStaff, setMaxStaff] = useState(3);
  const [planName, setPlanName] = useState('Starter');
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const [staffRes, planRes] = await Promise.all([
        api.get('/sellers/me/staff').catch(() => null),
        api.get('/subscriptions/sellers/me/features').catch(() => null),
      ]);

      if (staffRes?.data) {
        setStaff(Array.isArray(staffRes.data) ? staffRes.data : staffRes.data.staff || []);
      }
      if (planRes?.data) {
        setMaxStaff(planRes.data.max_staff || 3);
        setPlanName(planRes.data.plan_name || 'Starter');
      }
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (id: number, email: string) => {
    setResendingId(id);
    try {
      await api.post(`/sellers/me/staff/${id}/resend`);
      alert(`Invitation email resent successfully to ${email}`);
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to resend invitation email.');
    } finally {
      setResendingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/sellers/me/staff/${id}`);
      setStaff((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete staff:', err);
      alert('Failed to remove staff member.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        <p className="text-sm font-semibold text-slate-400">Loading staff accounts...</p>
      </div>
    );
  }

  const currentCount = staff.length + 1; // +1 for Owner

  return (
    <div className="space-y-5 pb-20 max-w-5xl mx-auto px-1 md:px-0">
      
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Staff Accounts
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Invite team members and assign role-based permissions
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-full text-xs font-extrabold shadow-md shadow-sky-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Staff</span>
        </button>
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
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-white dark:bg-neutral-800 text-sky-600 dark:text-sky-400 shadow-xs whitespace-nowrap"
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

      {/* ── Staff Slots Progress Card (Redesigned) ── */}
      <div className="bg-white dark:bg-neutral-900/90 rounded-3xl p-4 md:p-5 border border-slate-100 dark:border-neutral-800 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-800 dark:text-white">
            Staff Slots Used
          </span>
          <span className="font-mono font-black text-xs text-sky-600 dark:text-sky-400">
            {currentCount} / {maxStaff === 999 ? 'Unlimited' : maxStaff}
          </span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-sky-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (currentCount / (maxStaff === 999 ? 10 : maxStaff)) * 100)}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-400">
          {maxStaff === 999 ? 'Unlimited team members on your plan' : `${Math.max(0, maxStaff - currentCount)} slots remaining`}
        </p>
      </div>

      {/* ── Team Members List ── */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white px-1">
          Team Members
        </h2>

        <div className="space-y-2.5">
          {/* Store Owner */}
          <div className="bg-white dark:bg-neutral-900/90 rounded-2xl p-3.5 md:p-4 border border-slate-100 dark:border-neutral-800 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-xs md:text-sm text-slate-900 dark:text-white truncate">
                  {user?.full_name || 'Store Owner'} <span className="text-[10px] text-slate-400 font-normal">(You)</span>
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.email || 'Owner Account'}</p>
              </div>
            </div>

            <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full">
              Owner
            </span>
          </div>

          {/* Invited Staff Members */}
          {staff.map((member) => {
            const config = ROLE_CONFIG[member.role] || ROLE_CONFIG.sales;
            const Icon = config.icon;
            const isPending = member.status === 'pending';

            return (
              <div
                key={member.id}
                className="bg-white dark:bg-neutral-900/90 rounded-2xl p-3.5 md:p-4 border border-slate-100 dark:border-neutral-800 shadow-sm flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-extrabold text-xs md:text-sm text-slate-900 dark:text-white truncate">
                        {member.name || member.email.split('@')[0]}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                        !isPending
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/50'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/50'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${!isPending ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                        {!isPending ? 'Active' : 'Pending Acceptance'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {member.email} · <span className="font-semibold">{config.label}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => handleResend(member.id, member.email)}
                      disabled={resendingId === member.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-sky-200 dark:border-sky-800 transition-colors disabled:opacity-50"
                      title="Resend invitation email"
                    >
                      {resendingId === member.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">Resend Invite</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(member.id)}
                    disabled={deletingId === member.id}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Remove Staff"
                  >
                    {deletingId === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Role Permissions Matrix (Redesigned) ── */}
      <div className="bg-white dark:bg-neutral-900/90 rounded-3xl border border-slate-100 dark:border-neutral-800 p-5 md:p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
          Role Permissions Matrix
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-neutral-800 text-[11px] font-extrabold text-slate-400 uppercase">
                <th className="py-2.5 text-left">Action</th>
                <th className="py-2.5 text-center text-purple-600 dark:text-purple-400">Manager</th>
                <th className="py-2.5 text-center text-sky-600 dark:text-sky-400">Sales</th>
                <th className="py-2.5 text-center text-emerald-600 dark:text-emerald-400">Inventory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/60 font-medium">
              {PERMISSION_MATRIX.map((perm, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30">
                  <td className="py-3 text-slate-700 dark:text-neutral-200">{perm.action}</td>
                  <td className="py-3 text-center">
                    {perm.manager ? <Check className="w-4 h-4 text-purple-500 mx-auto" /> : <span className="text-slate-300 dark:text-neutral-700">—</span>}
                  </td>
                  <td className="py-3 text-center">
                    {perm.sales ? <Check className="w-4 h-4 text-sky-500 mx-auto" /> : <span className="text-slate-300 dark:text-neutral-700">—</span>}
                  </td>
                  <td className="py-3 text-center">
                    {perm.inventory ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-slate-300 dark:text-neutral-700">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvited={loadStaff}
          currentCount={currentCount}
          maxStaff={maxStaff}
        />
      )}

    </div>
  );
}
