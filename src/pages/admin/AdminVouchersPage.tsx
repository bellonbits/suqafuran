import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService } from '../../services/walletService';
import type { Voucher } from '../../services/walletService';
import { Button } from '../../components/Button';
import { Check, X, Copy, Clock, Plus, ArrowLeft, Banknote, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';
import { format } from 'date-fns';

const AdminVouchersPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState('');
    const [customCode, setCustomCode] = useState('');
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const { data: vouchers, isLoading } = useQuery<Voucher[]>({
        queryKey: ['admin-vouchers'],
        queryFn: () => walletService.getVouchers(),
    });

    const createVoucherMutation = useMutation({
        mutationFn: ({ amount, code }: { amount: number, code: string }) =>
            walletService.createVoucher(amount, code),
        onSuccess: (data) => {
            setStatusMessage({ type: 'success', text: `Voucher ${data.code} created successfully!` });
            setAmount('');
            setCustomCode('');
            queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] });
        },
        onError: (err: any) => {
            setStatusMessage({ type: 'error', text: err.response?.data?.detail || "Failed to create voucher." });
        }
    });

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        const voucherAmount = parseFloat(amount);
        if (!voucherAmount || voucherAmount <= 0) {
            setStatusMessage({ type: 'error', text: "Please enter a valid amount." });
            return;
        }

        // Auto-generate code if not provided: VOUCHER-{RANDOM 6 CHARS}
        const codeToUse = customCode.trim() || `VOUCHER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        createVoucherMutation.mutate({
            amount: voucherAmount,
            code: codeToUse
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setStatusMessage({ type: 'success', text: "Code copied to clipboard!" });
        // Clear success message after 2 seconds
        setTimeout(() => setStatusMessage(null), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div
                    onClick={() => navigate('/admin')}
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 font-bold mb-6 transition-colors group cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Dashboard
                </div>

                <div className="flex flex-col md:flex-row gap-6 mb-8">
                    {/* Create Voucher Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl shadow-primary-900/5 border border-gray-100 md:w-1/3 h-fit sticky top-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                                <Plus className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Generate</h1>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">New Voucher</p>
                            </div>
                        </div>

                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Amount (Tokens)</label>
                                <div className="relative">
                                    <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="e.g. 1000"
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none font-bold text-lg"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Custom Code (Optional)</label>
                                <input
                                    type="text"
                                    value={customCode}
                                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                                    placeholder="Auto-generated if empty"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none font-mono text-center tracking-widest"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl"
                                isLoading={createVoucherMutation.isPending}
                            >
                                <Check className="w-5 h-5 mr-2" />
                                Create Voucher
                            </Button>
                        </form>
                    </div>

                    {/* Vouchers List */}
                    <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Voucher History</h2>
                                <p className="text-gray-500 text-sm">Manage existing recharge codes</p>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] })}
                                className="text-gray-400 hover:text-green-600"
                            >
                                <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
                            </Button>
                        </div>

                        {statusMessage && (
                            <div className={cn(
                                "mx-6 mt-6 p-4 rounded-xl text-sm font-medium border flex items-center justify-between animate-in fade-in slide-in-from-top-2",
                                statusMessage.type === 'success' ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
                            )}>
                                <span className="flex items-center gap-2">
                                    {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                    {statusMessage.text}
                                </span>
                                <button onClick={() => setStatusMessage(null)}><X className="w-4 h-4 opacity-50" /></button>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Code</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Created</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                                                Loading vouchers...
                                            </td>
                                        </tr>
                                    ) : vouchers?.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                                                No vouchers created yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        vouchers?.map((voucher) => (
                                            <tr key={voucher.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-mono font-bold text-gray-700 tracking-wider bg-gray-100 px-2 py-1 rounded">
                                                        {voucher.code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-gray-900">{voucher.amount.toLocaleString()} Tokens</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {voucher.is_redeemed ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 uppercase tracking-wide">
                                                            <Check className="w-3 h-3" />
                                                            Redeemed
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-600 uppercase tracking-wide">
                                                            <Clock className="w-3 h-3" />
                                                            Unused
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {format(new Date(voucher.created_at), 'MMM dd, yyyy')}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        disabled={voucher.is_redeemed}
                                                        onClick={() => copyToClipboard(voucher.code)}
                                                        className={cn(
                                                            "hover:bg-gray-100 text-gray-500",
                                                            voucher.is_redeemed && "opacity-20 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminVouchersPage;
