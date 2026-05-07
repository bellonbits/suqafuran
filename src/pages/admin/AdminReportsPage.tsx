import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Flag, AlertTriangle, Ban, Trash2, CheckCircle, Clock, ChevronDown, ChevronUp, Loader2, ShieldAlert } from 'lucide-react';
import { cn } from '../../utils/cn';

type ReportStatus = 'pending' | 'warned' | 'suspended' | 'removed' | 'dismissed';

interface ReportItem {
    id: number;
    reason: string;
    description: string | null;
    status: ReportStatus;
    admin_note: string | null;
    admin_action: string | null;
    created_at: string;
    resolved_at: string | null;
    reporter: { id: number; name: string; email: string } | null;
    reported_user: { id: number; name: string; email: string; is_active: boolean } | null;
    listing: { id: number; title: string; is_active: boolean } | null;
}

const STATUS_STYLES: Record<ReportStatus, string> = {
    pending: 'bg-amber-100 text-amber-700',
    warned: 'bg-orange-100 text-orange-700',
    suspended: 'bg-red-100 text-red-700',
    removed: 'bg-red-100 text-red-700',
    dismissed: 'bg-gray-100 text-gray-500',
};

const ACTIONS = [
    { key: 'warn', label: 'Warn User', icon: AlertTriangle, color: 'text-orange-600 border-orange-200 hover:bg-orange-50' },
    { key: 'suspend', label: 'Suspend Account', icon: Ban, color: 'text-red-600 border-red-200 hover:bg-red-50' },
    { key: 'remove_listing', label: 'Remove Listing', icon: Trash2, color: 'text-red-600 border-red-200 hover:bg-red-50' },
    { key: 'dismiss', label: 'Dismiss', icon: CheckCircle, color: 'text-gray-600 border-gray-200 hover:bg-gray-50' },
];

const AdminReportsPage: React.FC = () => {
    const qc = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [notes, setNotes] = useState<Record<number, string>>({});

    const { data: reports = [], isLoading } = useQuery<ReportItem[]>({
        queryKey: ['admin-reports', statusFilter],
        queryFn: () => api.get(`/trust_ops/admin/reports${statusFilter ? `?status=${statusFilter}` : ''}`).then(r => r.data),
    });

    const actionMutation = useMutation({
        mutationFn: ({ id, action, note }: { id: number; action: string; note: string }) =>
            api.post(`/trust_ops/admin/reports/${id}/action`, { action, admin_note: note }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-reports'] });
            setExpandedId(null);
        },
    });

    const pending = reports.filter(r => r.status === 'pending').length;

    return (
        <div className="max-w-4xl mx-auto p-4 pb-16">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-red-500" />
                        Abuse Reports
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Review and action user-submitted reports</p>
                </div>
                {pending > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        {pending} pending
                    </span>
                )}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {[
                    { key: 'pending', label: 'Pending' },
                    { key: 'warned', label: 'Warned' },
                    { key: 'suspended', label: 'Suspended' },
                    { key: 'removed', label: 'Removed' },
                    { key: 'dismissed', label: 'Dismissed' },
                    { key: '', label: 'All' },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setStatusFilter(f.key)}
                        className={cn(
                            'px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all',
                            statusFilter === f.key
                                ? 'bg-primary-500 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        )}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Report list */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-6 w-6 animate-spin text-primary-400" />
                    </div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                        <Flag className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">No reports in this category</p>
                    </div>
                ) : reports.map(report => (
                    <div key={report.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                        {/* Summary row */}
                        <button
                            className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50/50 transition-colors"
                            onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                        >
                            <div className="mt-0.5 flex-shrink-0">
                                <Flag className="h-4 w-4 text-red-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-gray-900 text-sm">{report.reason}</span>
                                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase', STATUS_STYLES[report.status])}>
                                        {report.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                                    <span>Reporter: <span className="font-medium text-gray-600">{report.reporter?.name || '—'}</span></span>
                                    {report.listing && (
                                        <span>Listing: <span className="font-medium text-gray-600">{report.listing.title}</span></span>
                                    )}
                                    {report.reported_user && (
                                        <span>User: <span className="font-medium text-gray-600">{report.reported_user.name}</span></span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(report.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                {report.description && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{report.description}</p>
                                )}
                            </div>
                            <div className="flex-shrink-0 text-gray-400 mt-1">
                                {expandedId === report.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                        </button>

                        {/* Expanded detail */}
                        {expandedId === report.id && (
                            <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                                {/* Details grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                    {report.reporter && (
                                        <div className="bg-white rounded-xl p-3 border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Reporter</p>
                                            <p className="text-sm font-bold text-gray-900">{report.reporter.name}</p>
                                            <p className="text-xs text-gray-500">{report.reporter.email}</p>
                                        </div>
                                    )}
                                    {report.reported_user && (
                                        <div className="bg-white rounded-xl p-3 border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Reported Account</p>
                                            <p className="text-sm font-bold text-gray-900">{report.reported_user.name}</p>
                                            <p className="text-xs text-gray-500">{report.reported_user.email}</p>
                                            <p className={cn('text-[10px] font-bold mt-1', report.reported_user.is_active ? 'text-green-600' : 'text-red-500')}>
                                                {report.reported_user.is_active ? 'Active' : 'Suspended'}
                                            </p>
                                        </div>
                                    )}
                                    {report.listing && (
                                        <div className="bg-white rounded-xl p-3 border border-gray-100 sm:col-span-2">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Reported Listing</p>
                                            <p className="text-sm font-bold text-gray-900">{report.listing.title}</p>
                                            <p className={cn('text-[10px] font-bold mt-1', report.listing.is_active ? 'text-green-600' : 'text-red-500')}>
                                                {report.listing.is_active ? 'Active' : 'Removed'}
                                            </p>
                                        </div>
                                    )}
                                    {report.description && (
                                        <div className="bg-white rounded-xl p-3 border border-gray-100 sm:col-span-2">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Report Details</p>
                                            <p className="text-sm text-gray-700">{report.description}</p>
                                        </div>
                                    )}
                                    {report.admin_note && (
                                        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 sm:col-span-2">
                                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">Admin Note</p>
                                            <p className="text-sm text-gray-700">{report.admin_note}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Action panel — only show for unresolved */}
                                {report.status === 'pending' && (
                                    <>
                                        <div className="mb-3">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                                                Admin Note (optional)
                                            </label>
                                            <textarea
                                                rows={2}
                                                placeholder="Internal note about this action..."
                                                value={notes[report.id] || ''}
                                                onChange={e => setNotes(n => ({ ...n, [report.id]: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400 resize-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {ACTIONS.map(({ key, label, icon: Icon, color }) => (
                                                <button
                                                    key={key}
                                                    disabled={actionMutation.isPending}
                                                    onClick={() => actionMutation.mutate({
                                                        id: report.id,
                                                        action: key,
                                                        note: notes[report.id] || '',
                                                    })}
                                                    className={cn(
                                                        'flex flex-col items-center gap-1.5 border rounded-xl py-3 px-2 text-xs font-bold transition-all disabled:opacity-60',
                                                        color
                                                    )}
                                                >
                                                    {actionMutation.isPending
                                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                                        : <Icon className="h-4 w-4" />
                                                    }
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {report.status !== 'pending' && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-white rounded-xl px-4 py-3 border border-gray-100">
                                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        Action taken: <span className="font-bold text-gray-900 capitalize">{report.admin_action || report.status}</span>
                                        {report.resolved_at && (
                                            <span className="ml-auto text-xs text-gray-400">
                                                {new Date(report.resolved_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminReportsPage;
