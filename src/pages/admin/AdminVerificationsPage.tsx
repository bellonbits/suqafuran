import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Eye, Loader2, Shield, User, FileText, X, ZoomIn } from 'lucide-react';
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
    id_number?: string;
    status: 'pending' | 'approved' | 'rejected';
    notes?: string;
    document_urls: string[];
    selfie_url?: string;
    facial_match_score?: number;
    created_at: string;
    tier?: string;
    proof_of_address_url?: string;
    video_selfie_url?: string;
    user?: { full_name: string; phone: string; email?: string };
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&q=60';

const AdminVerificationsPage: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
    const [preview, setPreview] = useState<VerificationRequest | null>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

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

    const TAB_LABELS: Record<string, string> = {
        all: t('admin.all'),
        pending: t('admin.pending'),
        approved: t('admin.approved'),
        rejected: t('admin.rejected'),
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('admin.verifications')}</h1>
                    <p className="text-sm text-gray-500 mt-1">{t('admin.verificationsSubtitle')}</p>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-bold text-amber-700">{t('admin.pendingCount', { count: counts.pending })}</span>
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
                        {TAB_LABELS[tab]} <span className="ml-1 text-xs text-gray-400">({counts[tab]})</span>
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
                    <p>{t('admin.noRequests', { filter: filter === 'all' ? '' : TAB_LABELS[filter] })}</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3 text-left">{t('admin.user')}</th>
                                <th className="px-6 py-3 text-left">Tier</th>
                                <th className="px-6 py-3 text-left">{t('admin.documentType')}</th>
                                <th className="px-6 py-3 text-left">{t('admin.matchScore')}</th>
                                <th className="px-6 py-3 text-left">{t('admin.submitted')}</th>
                                <th className="px-6 py-3 text-left">{t('admin.status')}</th>
                                <th className="px-6 py-3 text-left">{t('admin.actions')}</th>
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
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                                            req.tier === 'premium' ? "bg-secondary-500 text-white" : "bg-gray-100 text-gray-500"
                                        )}>
                                            {req.tier === 'premium' ? 'Premium' : 'Standard'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 capitalize text-gray-600">{req.document_type}</td>
                                    <td className="px-6 py-4">
                                        {req.facial_match_score !== undefined ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-12 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                    <div 
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-1000",
                                                            req.facial_match_score >= 80 ? "bg-green-500" :
                                                            req.facial_match_score >= 50 ? "bg-yellow-500" : "bg-red-500"
                                                        )}
                                                        style={{ width: `${req.facial_match_score}%` }}
                                                    />
                                                </div>
                                                <span className={cn(
                                                    "text-xs font-bold",
                                                    req.facial_match_score >= 80 ? "text-green-600" :
                                                    req.facial_match_score >= 50 ? "text-yellow-600" : "text-red-600"
                                                )}>
                                                    {Math.round(req.facial_match_score)}%
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-300 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn("px-2 py-1 rounded-full text-xs font-semibold capitalize", STATUS_COLORS[req.status])}>
                                            {TAB_LABELS[req.status] || req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setPreview(req)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                title={t('admin.viewDocuments')}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {req.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => moderateMutation.mutate({ id: req.id, status: 'approved' })}
                                                        disabled={moderateMutation.isPending}
                                                        className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"
                                                        title={t('admin.approve')}
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => moderateMutation.mutate({ id: req.id, status: 'rejected' })}
                                                        disabled={moderateMutation.isPending}
                                                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                                                        title={t('admin.reject')}
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

            {/* Lightbox */}
            {lightboxUrl && (
                <div
                    className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setLightboxUrl(null)}
                >
                    <button
                        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                        onClick={() => setLightboxUrl(null)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <img
                        src={lightboxUrl}
                        alt="Document preview"
                        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}

            {/* Document Preview Modal */}
            {preview && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h3 className="font-bold text-gray-900">{t('admin.verificationRequest', { id: preview.id })}</h3>
                                <p className="text-sm text-gray-500">{preview.user?.full_name || `User #${preview.user_id}`}</p>
                            </div>
                            <button onClick={() => setPreview(null)} className="p-2 rounded-lg hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {preview.selfie_url && (
                                <div className="flex gap-6">
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('admin.selfie')}</p>
                                        <div className="relative group cursor-zoom-in" onClick={() => setLightboxUrl(getImageUrl(preview.selfie_url))}>
                                            <img
                                                src={getImageUrl(preview.selfie_url)}
                                                alt={t('admin.selfie')}
                                                className="w-full h-48 object-cover rounded-xl border border-gray-100 shadow-sm group-hover:brightness-90 transition-all"
                                                onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="bg-black/50 rounded-full p-2">
                                                    <ZoomIn className="w-5 h-5 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-48 bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('admin.aiMatchScore')}</p>
                                        <div className="relative w-24 h-24 flex items-center justify-center">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle
                                                    cx="48" cy="48" r="40"
                                                    stroke="currentColor" strokeWidth="8" fill="transparent"
                                                    className="text-gray-200"
                                                />
                                                <circle
                                                    cx="48" cy="48" r="40"
                                                    stroke="currentColor" strokeWidth="8" fill="transparent"
                                                    strokeDasharray={251.2}
                                                    strokeDashoffset={251.2 * (1 - (preview.facial_match_score || 0) / 100)}
                                                    className={cn(
                                                        "transition-all duration-1000",
                                                        (preview.facial_match_score || 0) >= 80 ? "text-green-500" :
                                                        (preview.facial_match_score || 0) >= 50 ? "text-yellow-500" : "text-red-500"
                                                    )}
                                                />
                                            </svg>
                                            <span className="absolute text-xl font-black text-gray-900">
                                                {Math.round(preview.facial_match_score || 0)}%
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-500 mt-2 text-center leading-tight">
                                            {(preview.facial_match_score || 0) >= 80 ? t('admin.highConfidence') :
                                             (preview.facial_match_score || 0) >= 50 ? t('admin.mediumConfidence') : t('admin.lowConfidence')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {preview.id_number && (
                                <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-1">{t('admin.idNumber')}</p>
                                        <p className="font-mono text-lg font-bold text-primary-900">{preview.id_number}</p>
                                    </div>
                                    <Shield className="w-8 h-8 text-primary-200" />
                                </div>
                            )}

                            {preview.document_urls?.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                                        <FileText className="w-3 h-3" /> {t('admin.documents')}
                                        <span className="ml-1 bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full">
                                            {preview.document_urls.length}
                                        </span>
                                    </p>
                                    <div className={cn(
                                        "grid gap-3",
                                        preview.document_urls.length === 1 ? "grid-cols-1" :
                                        preview.document_urls.length === 2 ? "grid-cols-2" :
                                        "grid-cols-3"
                                    )}>
                                        {preview.document_urls.map((url, i) => (
                                            <div
                                                key={i}
                                                className="relative group cursor-zoom-in"
                                                onClick={() => setLightboxUrl(getImageUrl(url))}
                                            >
                                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                                    Doc {i + 1}
                                                </div>
                                                <img
                                                    src={getImageUrl(url)}
                                                    alt={`Doc ${i + 1}`}
                                                    className="w-full rounded-xl border border-gray-100 shadow-sm object-cover aspect-[4/3] group-hover:brightness-90 transition-all"
                                                    onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity mt-4">
                                                    <div className="bg-black/50 rounded-full p-2">
                                                        <ZoomIn className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {preview.proof_of_address_url && (
                                <div>
                                    <p className="text-xs font-bold text-secondary-600 uppercase tracking-wider mb-2">Proof of Address</p>
                                    {/\.(jpg|jpeg|png|webp|gif)$/i.test(preview.proof_of_address_url) || preview.proof_of_address_url.includes('cloudinary') ? (
                                        <div
                                            className="relative group cursor-zoom-in"
                                            onClick={() => setLightboxUrl(getImageUrl(preview.proof_of_address_url))}
                                        >
                                            <img
                                                src={getImageUrl(preview.proof_of_address_url)}
                                                alt="Proof of Address"
                                                className="w-full rounded-xl border border-secondary-100 shadow-sm group-hover:brightness-90 transition-all"
                                                onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="bg-black/50 rounded-full p-2">
                                                    <ZoomIn className="w-5 h-5 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <a href={getImageUrl(preview.proof_of_address_url)} target="_blank" rel="noreferrer" className="block p-4 bg-secondary-50 border border-secondary-100 rounded-xl hover:bg-secondary-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <FileText className="text-secondary-600" />
                                                <span className="text-sm font-bold text-secondary-900">View Address Document</span>
                                            </div>
                                        </a>
                                    )}
                                </div>
                            )}

                            {preview.video_selfie_url && (
                                <div>
                                    <p className="text-xs font-bold text-secondary-600 uppercase tracking-wider mb-2">Video Selfie</p>
                                    <video controls className="w-full rounded-xl border-2 border-secondary-100">
                                        <source src={getImageUrl(preview.video_selfie_url)} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
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
                                        {t('admin.approve')}
                                    </button>
                                    <button
                                        onClick={() => moderateMutation.mutate({ id: preview.id, status: 'rejected' })}
                                        disabled={moderateMutation.isPending}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors"
                                    >
                                        {moderateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                        {t('admin.reject')}
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
