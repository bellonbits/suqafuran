import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { adminService } from '../services/adminService';
import {
    Check, X, AlertOctagon, Users,
    BarChart3, ShieldCheck, Loader2
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from '../components/Button';

const AdminDashboard: React.FC = () => {
    const queryClient = useQueryClient();

    const { data: stats, isLoading: statsLoading } = useQuery({
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
        queryKey: ['admin-users'],
        queryFn: adminService.getUsers,
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

    return (
        <DashboardLayout>
            <div className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
                        <p className="text-gray-500 mt-1 italic">Moderation and platform analytics.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="rounded-xl border-2">Export Data</Button>
                        <Button className="rounded-xl">System Settings</Button>
                    </div>
                </div>

                {/* Admin Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center">
                                <Users className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold">{statsLoading ? '...' : stats?.total_users}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Total Users</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-lg flex items-center justify-center">
                                <AlertOctagon className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-secondary-600">{statsLoading ? '...' : stats?.pending_listings}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Pending Ads</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold">{statsLoading ? '...' : stats?.active_listings}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Active Listings</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold">{statsLoading ? '...' : stats?.total_listings}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Total Listings</p>
                    </div>
                </div>

                {/* Moderation Queue */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Check className="h-6 w-6 text-primary-600" />
                            Moderation Queue
                        </h2>
                        <button className="text-sm font-bold text-primary-600 hover:underline">
                            View All ({pendingAds?.length || 0})
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
                                <p className="text-gray-400 font-medium italic">Queue is clean! No ads pending review.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ad Detail</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Seller</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pendingAds?.map((ad) => (
                                        <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                                        {ad.images?.[0] ? (
                                                            <img src={ad.images[0]} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                                                                <BarChart3 className="h-4 w-4" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{ad.title}</p>
                                                        <p className="text-[10px] text-gray-500">KES {ad.price.toLocaleString()}</p>
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
                            Verification Requests
                        </h2>
                        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {verificationRequests?.filter((r: any) => r.status === 'pending').length || 0} Pending
                        </span>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                        {verificationsLoading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                            </div>
                        ) : verificationRequests?.length === 0 ? (
                            <div className="py-12 text-center text-gray-400 italic">
                                No verification requests found.
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Doc Type</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
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
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="h-8 px-3 rounded-lg"
                                                            onClick={() => verifyMutation.mutate({ id: req.id, status: 'approved' })}
                                                            disabled={verifyMutation.isPending}
                                                        >
                                                            Approve
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

                {/* Active Support Tickets / Reports */}
                <section className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm opacity-60">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <AlertOctagon className="h-5 w-5 text-secondary-600" />
                            Recent Reports
                        </h3>
                        <div className="py-10 text-center text-gray-400 italic">
                            No active reports found. platform is safe!
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary-600" />
                            New User Signups
                        </h3>
                        <div className="space-y-4">
                            {usersLoading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                                </div>
                            ) : users?.length === 0 ? (
                                <div className="py-4 text-center text-gray-400 italic">No new signups.</div>
                            ) : (
                                users?.slice(0, 5).map(user => (
                                    <div key={user.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold border border-primary-100 text-xs">
                                                {user.full_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold truncate max-w-[120px]">{user.full_name}</p>
                                                <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{user.email}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold">Review</Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
};

export { AdminDashboard };
