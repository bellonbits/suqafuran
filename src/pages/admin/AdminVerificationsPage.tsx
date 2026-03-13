import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Eye, Loader2, Shield, User, FileText, X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { getImageUrl } from '../../utils/imageUtils';
import { cn } from '../../utils/cn';

const STATUS_COLORS: Record<string, string> = {
    pending:  'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
};

interface VerificationRequest {
    id: number;
    user_id: number;
    document_type: string;
    status: 'pending' | 'approved' | 'rejected';
    notes?: string;
    document_urls: string[];
    selfie_url?: string;
    created_at: string;
    user?: { full_name: string; phone: string; email?: string };
}

const AdminVerificationsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [preview, setPreview] = useState<VerificationRequest | null>(null);

    const { data: requests = [], isLoading } = useQuery<VerificationRequest[]>({
        queryKey: ['admin-verifications'],
        queryFn: adminService.getVerificationRequests,
    });

    const moderateMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            adminService.moderateVerification(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
            setPreview(null);
        },
    });

    const filtered = requests.filter(r => filter === 'all' || r.status === filter);

    const counts = {
        all: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Verifications</h1>
                    <p className="text-sm text-gray-500 mt-1">Review and approve seller verification requests</p>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-bold text-amber-700">{counts.pending} pending</span>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 border-b border-gray-100">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={cn(
                            "px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px",
                            filter === tab
                                ? "border-primary-600 text-primary-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        )}
                    >
                        {tab} <span className="ml-1 text-xs text-gray-400">({counts[tab]})</span>
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No {filter === 'all' ? '' : filter} requests</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3 text-left">User</th>
                                <th className="px-6 py-3 text-left">Document Type</th>
                                <th className="px-6 py-3 text-left">Submitted</th>
                                <th className="px-6 py-3 text-left">Status</th>
                                <th className="px-6 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((req) => (
                                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                                                <User className="w-4 h-4 text-primary-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{req.user?.full_name || `User #${req.user_id}`}</p>
                                                <p className="text-xs text-gray-400">{req.user?.phone || req.user?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 capitalize text-gray-600">{req.document_type}</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn("px-2 py-1 rounded-full text-xs font-semibold capitalize", STATUS_COLORS[req.status])}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setPreview(req)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                title="View documents"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {req.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => moderateMutation.mutate({ id: req.id, status: 'approved' })}
                                                        disabled={moderateMutation.isPending}
                                                        className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => moderateMutation.mutate({ id: req.id, status: 'rejected' })}
                                                        disabled={moderateMutation.isPending}
                                                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Document Preview Modal */}
            {preview && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h3 className="font-bold text-gray-900">Verification Request #{preview.id}</h3>
                                <p className="text-sm text-gray-500">{preview.user?.full_name || `User #${preview.user_id}`}</p>
                            </div>
                            <button onClick={() => setPreview(null)} className="p-2 rounded-lg hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {preview.selfie_url && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Selfie</p>
                                    <img src={getImageUrl(preview.selfie_url)} alt="Selfie" className="w-40 h-40 object-cover rounded-xl border border-gray-100" />
                                </div>
                            )}
                            {preview.document_urls?.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <FileText className="w-3 h-3" /> Documents
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {preview.document_urls.map((url, i) => (
                                            <a key={i} href={getImageUrl(url)} target="_blank" rel="noreferrer">
                                                <img src={getImageUrl(url)} alt={`Doc ${i + 1}`} className="w-full rounded-xl border border-gray-100 hover:opacity-90 transition-opacity" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {preview.status === 'pending' && (
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => moderateMutation.mutate({ id: preview.id, status: 'approved' })}
                                        disabled={moderateMutation.isPending}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors"
                                    >
                                        {moderateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => moderateMutation.mutate({ id: preview.id, status: 'rejected' })}
                                        disabled={moderateMutation.isPending}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
                                    >
                                        {moderateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminVerificationsPage;
