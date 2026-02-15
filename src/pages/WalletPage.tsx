import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Plus,
    Clock,
    CheckCircle2,
    XCircle,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { walletService } from '../services/walletService';
import { Button } from '../components/Button';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import type { Transaction, WalletBalance } from '../services/walletService';

export const WalletPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');

    const { data: balance, isLoading: balanceLoading } = useQuery<WalletBalance>({
        queryKey: ['wallet-balance'],
        queryFn: () => walletService.getBalance()
    });

    const { data: transactions, isLoading: txLoading } = useQuery<Transaction[]>({
        queryKey: ['wallet-transactions'],
        queryFn: () => walletService.getTransactions()
    });

    const depositMutation = useMutation({
        mutationFn: (amount: number) => walletService.deposit(amount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
            queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
            setIsDepositModalOpen(false);
            setDepositAmount('');
        }
    });

    const handleDeposit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(depositAmount);
        if (!isNaN(amount) && amount > 0) {
            depositMutation.mutate(amount);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-primary-100 text-sm font-medium mb-1">Available Balance</p>
                            <h3 className="text-4xl font-bold mb-6">
                                {balanceLoading ? '...' : `${balance?.currency} ${balance?.balance?.toLocaleString()}`}
                            </h3>
                            <Button
                                onClick={() => setIsDepositModalOpen(true)}
                                className="bg-white text-primary-600 hover:bg-primary-50 rounded-xl gap-2 font-bold"
                            >
                                <Plus className="h-5 w-5" />
                                Add Funds
                            </Button>
                        </div>
                        <Wallet className="absolute -right-4 -bottom-4 h-32 w-32 text-white/10 rotate-12" />
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Total Spent</p>
                            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">KSh 12,450</h3>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full w-fit text-xs font-bold">
                            <TrendingUp className="h-4 w-4" />
                            <span>15% this month</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Active Boosts</p>
                            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">3 Listings</h3>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-primary-600 bg-primary-50 px-3 py-1 rounded-full w-fit text-xs font-bold">
                            <ShieldCheck className="h-4 w-4" />
                            <span>Premium Seller</span>
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs">View All</Button>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {txLoading ? (
                            <div className="p-12 text-center text-gray-400">Loading transactions...</div>
                        ) : transactions?.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">No transactions yet</div>
                        ) : (
                            transactions?.map((tx: any) => (
                                <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                                            tx.type === 'deposit' ? "bg-green-50 text-green-600" : "bg-primary-50 text-primary-600"
                                        )}>
                                            {tx.type === 'deposit' ? (
                                                <ArrowDownLeft className="h-6 w-6" />
                                            ) : (
                                                <ArrowUpRight className="h-6 w-6" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{tx.description}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(tx.created_at), 'MMM dd, yyyy • HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn(
                                            "text-lg font-bold tracking-tight",
                                            tx.type === 'deposit' ? "text-green-600" : "text-gray-900"
                                        )}>
                                            {tx.type === 'deposit' ? '+' : ''}{tx.amount.toLocaleString()}
                                        </p>
                                        <div className="flex items-center gap-1 justify-end mt-0.5">
                                            {tx.status === 'completed' ? (
                                                <span className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Success
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1">
                                                    <XCircle className="h-3 w-3" />
                                                    Failed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Deposit Modal (Mock) */}
            {isDepositModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
                        <h3 className="text-xl font-bold mb-2">Add Funds</h3>
                        <p className="text-gray-500 text-sm mb-6">Enter the amount you'd like to deposit into your Suqafuran wallet (Simulated).</p>

                        <form onSubmit={handleDeposit}>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Amount (KSh)</label>
                                <input
                                    type="number"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all outline-none"
                                    placeholder="e.g. 5000"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 rounded-xl"
                                    onClick={() => setIsDepositModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 rounded-xl"
                                    isLoading={depositMutation.isPending}
                                >
                                    Deposit
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};
