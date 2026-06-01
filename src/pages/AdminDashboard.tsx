import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLanguageField } from '../hooks/useLanguageField';
import { toast } from 'react-hot-toast';
import api from '../services/api';

import { adminService, type AdminStats } from '../services/adminService';
import {
    Check, X, AlertOctagon, Users,
    BarChart3, ShieldCheck, Loader2, Banknote,
    UserCog, Plus, Trash2, Mail, Store, Globe,
    Search, ChevronLeft, ChevronRight, Phone, KeyRound,
    UserCheck, UserX, AlertTriangle
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from '../components/Button';
import { getImageUrl } from '../utils/imageUtils';

const AdminDashboard: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { getField } = useLanguageField();
    const [agentEmail, setAgentEmail] = useState('');
    const [agentError, setAgentError] = useState<string | null>(null);

    // Users management state
    const [userSearch, setUserSearch] = useState('');
    const [userSearchInput, setUserSearchInput] = useState('');
    const [userPage, setUserPage] = useState(0);
    const USER_PAGE_SIZE = 50;
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    // OTP Lookup state
    const [otpMode, setOtpMode] = useState<'phone' | 'email'>('phone');
    const [otpQuery, setOtpQuery] = useState('');
    const [otpResult, setOtpResult] = useState<{ found: boolean; code?: string; expires_in_seconds?: number; message: string } | null>(null);
    const [otpLoading, setOtpLoading] = useState(false);

    const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
        queryKey: ['admin-stats'],
        queryFn: adminService.getStats,
    });

    const { data: pendingAds, isLoading: adsLoading } = useQuery({
        queryKey: ['admin-queue'],
        queryFn: adminService.getModerationQueue,
    });

    const { data: verificationRequests, isLoading: verificationsLoading } = useQuery({
        queryKey: ['admin-verifications'],
        queryFn: adminService.getVerificationRequests,
    });

    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['admin-users', userSearch, userPage],
        queryFn: () => adminService.getUsers({ skip: userPage * USER_PAGE_SIZE, limit: USER_PAGE_SIZE, search: userSearch || undefined }),
        placeholderData: (prev) => prev,
    });

    const { data: userTotal = 0 } = useQuery({
        queryKey: ['admin-users-count', userSearch],
        queryFn: () => adminService.getUserCount(userSearch || undefined),
    });

    const verifyMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            adminService.moderateVerification(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        }
    });

    const moderateMutation = useMutation({
        mutationFn: ({ id, approve }: { id: number; approve: boolean }) =>
            adminService.moderateListing(id, approve),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-queue'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: (userId: number) => adminService.deleteUser(userId),
        onSuccess: (_) => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['admin-users-count'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            setConfirmDeleteId(null);
            toast.success('User permanently deleted');
        },
        onError: () => toast.error('Failed to delete user'),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) =>
            adminService.updateUserStatus(userId, isActive),
        onSuccess: (_, { isActive }) => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success(isActive ? 'User activated' : 'User deactivated');
        },
        onError: () => toast.error('Failed to update user status'),
    });

    const handleOtpLookup = useCallback(async () => {
        if (!otpQuery.trim()) return;
        setOtpLoading(true);
        setOtpResult(null);
        try {
            const params = otpMode === 'phone'
                ? { phone: otpQuery.trim() }
                : { email: otpQuery.trim() };
            const result = await adminService.getOtp(params);
            setOtpResult(result);
        } catch (err: any) {
            setOtpResult({ found: false, message: err?.response?.data?.detail || 'Lookup failed' });
        } finally {
            setOtpLoading(false);
        }
    }, [otpMode, otpQuery]);

    const { data: agents = [], isLoading: agentsLoading } = useQuery<any[]>({
        queryKey: ['admin-agents'],
        queryFn: () => api.get('/admin/agents').then(r => r.data),
    });

    const addAgentMutation = useMutation({
        mutationFn: (email: string) => api.post('/admin/agents/add', { email }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-agents'] });
            setAgentEmail('');
            setAgentError(null);
        },
        onError: (err: any) => {
            setAgentError(err.response?.data?.detail || 'Failed to add agent');
        },
    });

    const removeAgentMutation = useMutation({
        mutationFn: (email: string) => api.post('/admin/agents/remove', { email }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-agents'] }),
    });

    const { data: businessQueue, isLoading: businessQueueLoading } = useQuery({
        queryKey: ['admin-businesses-queue'],
        queryFn: adminService.getBusinessesQueue,
    });

    const moderateBusinessMutation = useMutation({
        mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
            approve 
                ? adminService.approveBusiness(id) 
                : adminService.disapproveBusiness(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-businesses-queue'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            toast.success('Business nearby status updated successfully!');
        },
        onError: () => {
            toast.error('Failed to update business nearby status');
        }
    });

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('admin.title')}</h1>
                    <p className="text-gray-500 mt-1 italic">{t('admin.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl border-2">{t('admin.exportData')}</Button>
                    <Button className="rounded-xl">{t('admin.systemSettings')}</Button>
                </div>
            </div>

            {/* Admin Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold">{statsLoading ? '...' : stats?.total_users}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{t('admin.totalUsers')}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-lg flex items-center justify-center">
                            <AlertOctagon className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-secondary-600">{statsLoading ? '...' : stats?.pending_listings}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{t('admin.pendingAds')}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-primary-500 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => window.location.href = '/admin/promotions'}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full uppercase">Action</span>
                    </div>
                    <p className="text-2xl font-bold text-primary-600">{statsLoading ? '...' : stats?.pending_promotions || 0}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{t('dashboard.promotions')}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-green-500 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => window.location.href = '/admin/vouchers'}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                            <Banknote className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase">Action</span>
                    </div>
                    <p className="text-xl font-bold text-green-600">{t('admin.vouchers')}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{t('admin.rechargeCodes')}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold">{statsLoading ? '...' : stats?.active_listings}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{t('admin.activeListings')}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold">{statsLoading ? '...' : stats?.total_listings}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{t('admin.totalListings')}</p>
                </div>
            </div>

            {/* Moderation Queue */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Check className="h-6 w-6 text-primary-600" />
                        {t('admin.moderationQueue')}
                    </h2>
                    <button className="text-sm font-bold text-primary-600 hover:underline">
                        {t('admin.viewAll')} ({pendingAds?.length || 0})
                    </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                    {adsLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                        </div>
                    ) : pendingAds?.length === 0 ? (
                        <div className="py-20 text-center">
                            <Check className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-20" />
                            <p className="text-gray-400 font-medium italic">{t('admin.queueClean')}</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.adDetail')}</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.seller')}</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.status')}</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">{t('admin.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pendingAds?.map((ad) => (
                                    <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                                    {ad.images?.[0] ? (
                                                        <img src={getImageUrl(ad.images[0])} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                                                            <BarChart3 className="h-4 w-4" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{getField(ad, 'title')}</p>
                                                    <p className="text-[10px] text-gray-500">$ {ad.price.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                            {ad.owner?.full_name || `ID: ${ad.owner_id}`}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 uppercase">
                                                {ad.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 w-8 p-0 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 border-red-100"
                                                    onClick={() => moderateMutation.mutate({ id: ad.id, approve: false })}
                                                    disabled={moderateMutation.isPending}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-8 w-8 p-0 rounded-lg"
                                                    onClick={() => moderateMutation.mutate({ id: ad.id, approve: true })}
                                                    disabled={moderateMutation.isPending}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>

            {/* Verification Requests */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-primary-600" />
                        {t('admin.verificationRequests')}
                    </h2>
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {verificationRequests?.filter((r: any) => r.status === 'pending').length || 0} {t('admin.pending')}
                    </span>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                    {verificationsLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                        </div>
                    ) : verificationRequests?.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 italic">
                            {t('admin.noVerifications')}
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.user')}</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.docType')}</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.status')}</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">{t('admin.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {verificationRequests?.map((req: any) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                            {req.user?.full_name || `ID: #${req.user_id}`}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 uppercase">{req.document_type}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                req.status === 'pending' ? "bg-yellow-100 text-yellow-700" :
                                                    req.status === 'approved' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                            )}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {req.status === 'pending' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 px-3 rounded-lg text-red-500 border-red-100 hover:bg-red-50"
                                                        onClick={() => verifyMutation.mutate({ id: req.id, status: 'rejected' })}
                                                        disabled={verifyMutation.isPending}
                                                    >
                                                        {t('admin.reject')}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="h-8 px-3 rounded-lg"
                                                        onClick={() => verifyMutation.mutate({ id: req.id, status: 'approved' })}
                                                        disabled={verifyMutation.isPending}
                                                    >
                                                        {t('admin.approve')}
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>

            {/* Business Nearby Approvals */}
            <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Store className="h-6 w-6 text-primary-600" />
                        Business Nearby Approvals
                    </h2>
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {businessQueue?.filter((b: any) => !b.is_approved).length || 0} Pending
                    </span>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                    {businessQueueLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                        </div>
                    ) : businessQueue?.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 italic">
                            No opt-in requests found.
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Business Name / Link</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Address</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Trust Score</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {businessQueue?.map((b: any) => (
                                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                            <div className="flex flex-col gap-0.5">
                                                <span>{b.name}</span>
                                                <a 
                                                    href={`/shop/${b.slug}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] text-primary-600 hover:underline flex items-center gap-0.5 font-semibold"
                                                >
                                                    <Globe className="h-3 w-3" /> /shop/{b.slug}
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 capitalize">{b.category}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{b.address || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-bold">{b.trust_score}/100</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={cn(
                                                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                b.is_approved 
                                                    ? "bg-green-100 text-green-700" 
                                                    : "bg-yellow-100 text-yellow-700"
                                            )}>
                                                {b.is_approved ? 'Approved' : 'Pending Approval'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {b.is_approved ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 px-3 rounded-lg text-red-500 border-red-100 hover:bg-red-50"
                                                        onClick={() => moderateBusinessMutation.mutate({ id: b.id, approve: false })}
                                                        disabled={moderateBusinessMutation.isPending}
                                                    >
                                                        Revoke
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 px-3 rounded-lg text-red-500 border-red-100 hover:bg-red-50"
                                                            onClick={() => moderateBusinessMutation.mutate({ id: b.id, approve: false })}
                                                            disabled={moderateBusinessMutation.isPending}
                                                        >
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="h-8 px-3 rounded-lg"
                                                            onClick={() => moderateBusinessMutation.mutate({ id: b.id, approve: true })}
                                                            disabled={moderateBusinessMutation.isPending}
                                                        >
                                                            Approve
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>

            {/* Agent Management */}
            <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-50 flex items-center gap-3">
                    <div className="p-2 bg-primary-50 rounded-xl">
                        <UserCog className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900">Agent Management</h3>
                        <p className="text-xs text-gray-400">Grant or revoke agent access by email</p>
                    </div>
                </div>

                <div className="p-8 grid md:grid-cols-2 gap-8">
                    {/* Add agent form */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Add Agent by Email</label>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 flex-1 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-primary-400 transition-colors">
                                <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <input
                                    type="email"
                                    value={agentEmail}
                                    onChange={e => { setAgentEmail(e.target.value); setAgentError(null); }}
                                    placeholder="user@example.com"
                                    className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400"
                                    onKeyDown={e => e.key === 'Enter' && agentEmail && addAgentMutation.mutate(agentEmail)}
                                />
                            </div>
                            <Button
                                className="rounded-xl px-4 gap-1.5 flex-shrink-0"
                                disabled={!agentEmail || addAgentMutation.isPending}
                                onClick={() => addAgentMutation.mutate(agentEmail)}
                            >
                                {addAgentMutation.isPending
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <Plus className="h-4 w-4" />
                                }
                                Add
                            </Button>
                        </div>
                        {agentError && (
                            <p className="text-xs text-red-500 font-medium mt-2">{agentError}</p>
                        )}
                        {addAgentMutation.isSuccess && (
                            <p className="text-xs text-green-600 font-medium mt-2">Agent added successfully.</p>
                        )}
                    </div>

                    {/* Current agents list */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                            Current Agents ({agents.length})
                        </label>
                        {agentsLoading ? (
                            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary-400" /></div>
                        ) : agents.length === 0 ? (
                            <p className="text-sm text-gray-400 italic py-3">No agents yet.</p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {agents.map((agent: any) => (
                                    <div key={agent.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                {(agent.full_name || 'A')[0].toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{agent.full_name || '—'}</p>
                                                <p className="text-xs text-gray-400 truncate">{agent.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { if (window.confirm(`Remove agent access for ${agent.email}?`)) removeAgentMutation.mutate(agent.email); }}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                            title="Remove agent"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Users Management + OTP Lookup */}
            <section className="space-y-6">

                {/* OTP Lookup Tool */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-200 shadow-sm p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-100 rounded-xl">
                                <KeyRound className="h-5 w-5 text-amber-700" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">OTP Lookup Tool</h3>
                                <p className="text-xs text-gray-500">Help customers who didn't receive their verification code</p>
                            </div>
                        </div>
                        <div className="flex bg-amber-100/60 p-0.5 rounded-xl border border-amber-200 self-start sm:self-center">
                            <button
                                type="button"
                                onClick={() => { setOtpMode('phone'); setOtpQuery(''); setOtpResult(null); }}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                                    otpMode === 'phone'
                                        ? "bg-white text-amber-800 shadow-sm"
                                        : "text-amber-700 hover:text-amber-900"
                                )}
                            >
                                <Phone className="h-3.5 w-3.5" />
                                Phone
                            </button>
                            <button
                                type="button"
                                onClick={() => { setOtpMode('email'); setOtpQuery(''); setOtpResult(null); }}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                                    otpMode === 'email'
                                        ? "bg-white text-amber-800 shadow-sm"
                                        : "text-amber-700 hover:text-amber-900"
                                )}
                            >
                                <Mail className="h-3.5 w-3.5" />
                                Email
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1 flex items-center gap-2 border border-amber-200 bg-white rounded-xl px-3 py-2.5 focus-within:border-amber-400 transition-colors">
                            {otpMode === 'phone' ? (
                                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                            ) : (
                                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                            )}
                            <input
                                type={otpMode === 'phone' ? "tel" : "email"}
                                value={otpQuery}
                                onChange={e => { setOtpQuery(e.target.value); setOtpResult(null); }}
                                onKeyDown={e => e.key === 'Enter' && handleOtpLookup()}
                                placeholder={otpMode === 'phone' ? "+254712345678 or 0712345678" : "customer@email.com"}
                                className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400"
                            />
                        </div>
                        <Button
                            className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5"
                            disabled={!otpQuery.trim() || otpLoading}
                            onClick={handleOtpLookup}
                        >
                            {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Look Up'}
                        </Button>
                    </div>

                    {otpResult && (
                        <div className={cn(
                            "mt-4 p-4 rounded-xl border text-sm",
                            otpResult.found
                                ? "bg-green-50 border-green-200 text-green-800"
                                : "bg-red-50 border-red-200 text-red-700"
                        )}>
                            {otpResult.found ? (
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-0.5">Active OTP Code</p>
                                        <p className="text-3xl font-black font-mono tracking-widest text-green-900">{otpResult.code}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-xs text-green-600">Expires in</p>
                                        <p className="text-lg font-bold text-green-800">{otpResult.expires_in_seconds}s</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    <p>{otpResult.message}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Full Users Table */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-primary-50 rounded-xl">
                                <Users className="h-4 w-4 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">All Accounts</h3>
                                <p className="text-xs text-gray-400">{userTotal.toLocaleString()} total users</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-primary-400 transition-colors bg-gray-50">
                                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                                <input
                                    type="text"
                                    value={userSearchInput}
                                    onChange={e => setUserSearchInput(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') { setUserSearch(userSearchInput); setUserPage(0); }
                                    }}
                                    placeholder="Search name, email, phone…"
                                    className="bg-transparent text-sm outline-none w-48 text-gray-700 placeholder-gray-400"
                                />
                            </div>
                            <Button
                                size="sm"
                                className="rounded-xl"
                                onClick={() => { setUserSearch(userSearchInput); setUserPage(0); }}
                            >
                                Search
                            </Button>
                            {userSearch && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl"
                                    onClick={() => { setUserSearch(''); setUserSearchInput(''); setUserPage(0); }}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Delete Confirmation Dialog */}
                    {confirmDeleteId !== null && (
                        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
                                <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mx-auto mb-4">
                                    <AlertTriangle className="w-7 h-7 text-red-600" />
                                </div>
                                <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Delete User?</h3>
                                <p className="text-sm text-center text-gray-500 mb-6">
                                    This will permanently delete the user and all their data (listings, messages, wallet, etc.). This action cannot be undone.
                                </p>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1 rounded-xl"
                                        onClick={() => setConfirmDeleteId(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1 rounded-xl bg-red-600 hover:bg-red-700"
                                        disabled={deleteUserMutation.isPending}
                                        onClick={() => deleteUserMutation.mutate(confirmDeleteId)}
                                    >
                                        {deleteUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        {usersLoading ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                            </div>
                        ) : users?.length === 0 ? (
                            <div className="py-16 text-center text-gray-400 italic">No users found.</div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {users?.map((user: any) => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                        {(user.full_name || user.email || 'U')[0].toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{user.full_name || '—'}</p>
                                                        <p className="text-[10px] text-gray-400">ID #{user.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs text-gray-700 truncate max-w-[160px]">{user.email}</p>
                                                <p className="text-[10px] text-gray-400">{user.phone || '—'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={cn(
                                                        "inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase w-fit",
                                                        user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                                                    )}>
                                                        {user.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                    {user.is_verified && (
                                                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 w-fit">
                                                            Verified
                                                        </span>
                                                    )}
                                                    {user.is_agent && (
                                                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-700 w-fit">
                                                            Agent
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => updateStatusMutation.mutate({ userId: user.id, isActive: !user.is_active })}
                                                        disabled={updateStatusMutation.isPending}
                                                        title={user.is_active ? 'Deactivate user' : 'Activate user'}
                                                        className={cn(
                                                            "p-1.5 rounded-lg transition-colors",
                                                            user.is_active
                                                                ? "text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                                                                : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                                                        )}
                                                    >
                                                        {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDeleteId(user.id)}
                                                        title="Permanently delete user"
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {userTotal > USER_PAGE_SIZE && (
                        <div className="px-8 py-4 border-t border-gray-50 flex items-center justify-between">
                            <p className="text-xs text-gray-400">
                                Showing {userPage * USER_PAGE_SIZE + 1}–{Math.min((userPage + 1) * USER_PAGE_SIZE, userTotal)} of {userTotal.toLocaleString()}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl h-8 w-8 p-0"
                                    disabled={userPage === 0}
                                    onClick={() => setUserPage(p => p - 1)}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl h-8 w-8 p-0"
                                    disabled={(userPage + 1) * USER_PAGE_SIZE >= userTotal}
                                    onClick={() => setUserPage(p => p + 1)}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export { AdminDashboard };
