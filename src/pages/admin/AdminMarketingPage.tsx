import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketingService, CreateCodePayload } from '../../services/marketingService';
import { Plus, Copy, ToggleLeft, ToggleRight, TrendingUp, Users, Megaphone, Check, X, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const AdminMarketingPage: React.FC = () => {
    const qc = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [form, setForm] = useState<CreateCodePayload>({
        code: '',
        description: '',
        created_by: '',
        max_uses: null,
        expires_at: null,
    });

    const { data: codes = [], isLoading } = useQuery({
        queryKey: ['marketing-codes'],
        queryFn: marketingService.listCodes,
    });

    const createMutation = useMutation({
        mutationFn: marketingService.createCode,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['marketing-codes'] });
            setShowCreate(false);
            setForm({ code: '', description: '', created_by: '', max_uses: null, expires_at: null });
        },
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
            marketingService.toggleCode(id, is_active),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing-codes'] }),
    });

    const copyToClipboard = (code: string) => {
        const url = `${window.location.origin}/signup?promo=${code}`;
        navigator.clipboard.writeText(url);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const totalSignups = codes.reduce((s, c) => s + c.uses_count, 0);
    const totalAds = codes.reduce((s, c) => s + c.ads_posted_count, 0);
    const avgConversion = codes.length
        ? Math.round((codes.reduce((s, c) => s + c.conversion_rate, 0) / codes.length) * 100)
        : 0;

    return (
        <div className="max-w-5xl mx-auto p-4 pb-16">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-primary-500" />
                        Marketing Codes
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Track signups and ad conversions per campaign</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow"
                >
                    <Plus className="h-4 w-4" />
                    New Code
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                    { label: 'Total Signups', value: totalSignups, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Ads Posted', value: totalAds, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Avg Conversion', value: `${avgConversion}%`, icon: Megaphone, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', bg)}>
                            <Icon className={cn('h-4 w-4', color)} />
                        </div>
                        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* Create form */}
            {showCreate && (
                <div className="bg-white border border-primary-100 rounded-2xl p-5 mb-6 shadow-sm animate-in slide-in-from-top-2 duration-200">
                    <h3 className="font-bold text-gray-900 mb-4">Create New Marketing Code</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                                Code* <span className="text-gray-400 normal-case font-normal">(auto-uppercased)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. NAIROBI25, TIKTOK_JUN"
                                value={form.code}
                                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500 font-mono font-bold tracking-widest"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Created By</label>
                            <input
                                type="text"
                                placeholder="Team member name"
                                value={form.created_by || ''}
                                onChange={e => setForm(f => ({ ...f, created_by: e.target.value }))}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Description</label>
                            <input
                                type="text"
                                placeholder="e.g. TikTok campaign June 2025 — East Africa"
                                value={form.description || ''}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                                Max Uses <span className="text-gray-400 normal-case font-normal">(blank = unlimited)</span>
                            </label>
                            <input
                                type="number"
                                placeholder="e.g. 500"
                                value={form.max_uses ?? ''}
                                onChange={e => setForm(f => ({ ...f, max_uses: e.target.value ? Number(e.target.value) : null }))}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                                Expires At <span className="text-gray-400 normal-case font-normal">(optional)</span>
                            </label>
                            <input
                                type="date"
                                value={form.expires_at?.split('T')[0] || ''}
                                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value ? `${e.target.value}T23:59:59` : null }))}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-500"
                            />
                        </div>
                    </div>
                    {createMutation.error && (
                        <p className="text-xs text-red-500 mb-3 font-medium">
                            {(createMutation.error as any)?.response?.data?.detail || 'Failed to create code'}
                        </p>
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={() => createMutation.mutate(form)}
                            disabled={!form.code || createMutation.isPending}
                            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-60"
                        >
                            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Create
                        </button>
                        <button
                            onClick={() => setShowCreate(false)}
                            className="flex items-center gap-2 border border-gray-200 text-gray-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-all"
                        >
                            <X className="h-4 w-4" />
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Codes table */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-primary-400" />
                    </div>
                ) : codes.length === 0 ? (
                    <div className="text-center py-16">
                        <Megaphone className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium text-sm">No marketing codes yet.</p>
                        <p className="text-gray-400 text-xs mt-1">Create your first code to start tracking campaigns.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Code</th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Description</th>
                                <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Signups</th>
                                <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Ads</th>
                                <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Conv.</th>
                                <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                                <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {codes.map(code => (
                                <tr key={code.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-extrabold text-gray-900 tracking-widest text-[13px]">{code.code}</span>
                                            {code.is_expired && (
                                                <span className="text-[9px] font-bold bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full uppercase">Expired</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{code.created_by || '—'}</p>
                                    </td>
                                    <td className="px-4 py-3.5 hidden sm:table-cell">
                                        <p className="text-xs text-gray-600 max-w-[200px] truncate">{code.description || '—'}</p>
                                        {code.max_uses != null && (
                                            <p className="text-[10px] text-gray-400 mt-0.5">{code.uses_count}/{code.max_uses} uses</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span className="font-bold text-gray-900">{code.uses_count}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span className="font-bold text-green-600">{code.ads_posted_count}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <span className={cn(
                                            'text-xs font-bold px-2 py-0.5 rounded-full',
                                            code.conversion_rate >= 0.5 ? 'bg-green-100 text-green-700' :
                                            code.conversion_rate >= 0.2 ? 'bg-amber-100 text-amber-700' :
                                            'bg-gray-100 text-gray-500'
                                        )}>
                                            {Math.round(code.conversion_rate * 100)}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <button
                                            onClick={() => toggleMutation.mutate({ id: code.id, is_active: !code.is_active })}
                                            disabled={toggleMutation.isPending}
                                            className="transition-colors"
                                            title={code.is_active ? 'Deactivate' : 'Activate'}
                                        >
                                            {code.is_active
                                                ? <ToggleRight className="h-5 w-5 text-green-500" />
                                                : <ToggleLeft className="h-5 w-5 text-gray-300" />
                                            }
                                        </button>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <button
                                            onClick={() => copyToClipboard(code.code)}
                                            className="flex items-center gap-1.5 mx-auto text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                            title="Copy signup link"
                                        >
                                            {copiedCode === code.code
                                                ? <><Check className="h-3 w-3" /> Copied</>
                                                : <><Copy className="h-3 w-3" /> Link</>
                                            }
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
                The "Link" button copies a ready-to-share signup URL with the promo code pre-filled.
            </p>
        </div>
    );
};

export default AdminMarketingPage;
