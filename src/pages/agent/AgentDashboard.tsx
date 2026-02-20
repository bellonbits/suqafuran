import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionService } from '../../services/promotionService';
import { auditService } from '../../services/auditService';
import type { AuditLogEntry } from '../../services/auditService';
import { Button } from '../../components/Button';
import {
    CreditCard,
    CheckCircle,
    Clock,
    ArrowRight,
    Check,
    X,
    Search,
    RefreshCw,
    Shield,
    Activity,
    User,
    ShoppingBag,
    Wallet,
    Zap,
    AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';

// Map action types to icons and colors
const ACTION_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    USER_SIGNUP: { icon: User, color: 'text-green-400', bg: 'bg-green-500/10', label: 'New Signup' },
    USER_LOGIN: { icon: User, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Login' },
    CREATE_LISTING: { icon: ShoppingBag, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'New Ad' },
    MATCH_PAYMENT: { icon: CreditCard, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Payment Matched' },
    ACTIVATE_PROMOTION: { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Promo Activated' },
    REJECT_TRANSACTION: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'TX Rejected' },
    WALLET_DEPOSIT: { icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Deposit' },
    VOUCHER_REDEEMED: { icon: CheckCircle, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Voucher Used' },
};

const AgentDashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'queue' | 'orders' | 'history'>('queue');
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

    const { data: queue, isLoading: queueLoading, refetch: refetchQueue } = useQuery({
        queryKey: ['payment-queue'],
        queryFn: promotionService.getPaymentQueue,
        enabled: activeTab === 'queue',
        refetchInterval: 15000, // Auto-refresh every 15s
    });

    const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
        queryKey: ['pending-orders'],
        queryFn: promotionService.getPendingOrders,
        enabled: activeTab === 'orders' || activeTab === 'queue',
    });

    const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
        queryKey: ['agent-history'],
        queryFn: promotionService.getAgentHistory,
        enabled: activeTab === 'history',
    });

    // Live system audit log feed
    const { data: auditLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
        queryKey: ['audit-logs'],
        queryFn: () => auditService.getLogs({ limit: 20 }),
        refetchInterval: 10000, // Refresh every 10s for live feel
    });

    const matchMutation = useMutation({
        mutationFn: (data: { orderId: number, txId: number }) =>
            promotionService.matchPayment(data.orderId, data.txId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-queue'] });
            queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
            queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
            setSelectedOrder(null);
            setActiveTab('orders');
        }
    });

    const activateMutation = useMutation({
        mutationFn: (orderId: number) => promotionService.agentActivate(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
            queryClient.invalidateQueries({ queryKey: ['agent-history'] });
            queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
            setActiveTab('history');
        }
    });

    const rejectMutation = useMutation({
        mutationFn: (txId: number) => promotionService.rejectTransaction(txId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-queue'] });
            queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
        }
    });

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <Shield className="text-primary-600" />
                        Agent Command Center
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Real-time payment verification & system activity tracking.</p>
                </div>
                {/* Live indicator */}
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-2xl">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Live Monitoring</span>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 overflow-x-auto mb-8 w-fit">
                {[
                    { id: 'queue', label: 'Payment Queue', icon: CreditCard, count: queue?.length },
                    { id: 'orders', label: 'Pending Orders', icon: Clock, count: orders?.filter((o: any) => o.status === 'pending').length },
                    { id: 'history', label: 'History', icon: CheckCircle },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-white text-primary-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                        {tab.count != null && tab.count > 0 && (
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-600'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Main List */}
                <div className="lg:col-span-2 space-y-4">
                    {activeTab === 'queue' ? (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">Incoming Payments</h3>
                                <button onClick={() => refetchQueue()} className="text-primary-600 hover:rotate-180 transition-all duration-500">
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {queueLoading ? (
                                    <div className="p-20 text-center"><Clock className="animate-spin mx-auto text-gray-300" /></div>
                                ) : queue?.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-200">
                                            <CreditCard size={30} />
                                        </div>
                                        <p className="text-sm font-black text-gray-300 uppercase tracking-widest">No unmatched payments</p>
                                    </div>
                                ) : (
                                    queue?.map((tx: any) => (
                                        <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                                                    <CreditCard size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">${tx.amount}</div>
                                                    <div className="text-xs text-gray-500">{tx.phone} • {format(new Date(tx.timestamp), 'HH:mm')}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="h-9 px-4 rounded-lg text-[10px] font-bold border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                                                    onClick={() => {
                                                        if (window.confirm('Reject this transaction?')) {
                                                            rejectMutation.mutate(tx.id);
                                                        }
                                                    }}
                                                    isLoading={rejectMutation.isPending && rejectMutation.variables === tx.id}
                                                >
                                                    <X size={14} className="mr-1" />
                                                    Reject
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    className="h-9 px-4 rounded-lg text-[10px] font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                                                    onClick={() => setSelectedOrder({ txId: tx.id, amount: tx.amount, phone: tx.phone })}
                                                >
                                                    Match
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'orders' ? (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">Verification Queue</h3>
                                <button onClick={() => refetchOrders()} className="text-primary-600 hover:rotate-180 transition-all duration-500">
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {ordersLoading ? (
                                    <div className="p-20 text-center"><Clock className="animate-spin mx-auto text-gray-300" /></div>
                                ) : orders?.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-200">
                                            <Clock size={30} />
                                        </div>
                                        <p className="text-sm font-black text-gray-300 uppercase tracking-widest">No pending orders</p>
                                    </div>
                                ) : (
                                    orders?.map((order: any) => (
                                        <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${order.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                                                    {order.status === 'pending' ? <CheckCircle size={20} /> : <Clock size={20} />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{order.listing_title}</div>
                                                    <div className="text-xs text-gray-500">{order.plan_name} • ${order.amount} • {order.payment_phone}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {order.status === 'pending' ? (
                                                    <Button
                                                        className="h-9 px-4 rounded-lg text-xs font-bold bg-green-600 shadow-md shadow-green-200 text-white"
                                                        onClick={() => activateMutation.mutate(order.id)}
                                                        isLoading={activateMutation.isPending && activateMutation.variables === order.id}
                                                    >
                                                        <Zap size={14} className="mr-1" />
                                                        Activate Now
                                                    </Button>
                                                ) : (
                                                    <div className="px-3 py-1 bg-gray-100 text-gray-400 text-[10px] font-bold rounded-full uppercase tracking-widest">
                                                        Waiting...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">Activation History</h3>
                                <button onClick={() => refetchHistory()} className="text-primary-600 hover:rotate-180 transition-all duration-500">
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {historyLoading ? (
                                    <div className="p-20 text-center"><Clock className="animate-spin mx-auto text-gray-300" /></div>
                                ) : !history || history.length === 0 ? (
                                    <div className="p-20 text-center text-gray-400">No history found</div>
                                ) : (
                                    history.map((item: any) => (
                                        <div key={item.id} className="p-4 flex items-center justify-between opacity-80 group hover:opacity-100 transition-opacity">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                                    <Check size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{item.listing_title}</div>
                                                    <div className="text-xs text-gray-500">{item.plan_name} • ${item.amount}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase">{format(new Date(item.updated_at), 'MMM d, HH:mm')}</div>
                                                <div className="text-[10px] text-primary-600 font-bold">{item.promotion_code}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side: Match Panel + Live Activity Feed */}
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        {selectedOrder ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="bg-primary-600 rounded-3xl p-6 text-white shadow-xl shadow-primary-200"
                            >
                                <h3 className="font-bold mb-4 flex items-center gap-2 text-sm">
                                    <CreditCard size={18} />
                                    Match Payment
                                </h3>
                                <div className="space-y-4 mb-6">
                                    <div className="bg-blue-300/30 p-4 rounded-2xl border border-blue-300/30">
                                        <div className="text-[10px] uppercase font-bold opacity-60 mb-1">Incoming Payment</div>
                                        <div className="text-xl font-black">${selectedOrder.amount}</div>
                                        <div className="text-xs opacity-80">{selectedOrder.phone}</div>
                                    </div>
                                    <ArrowRight className="mx-auto opacity-40" />
                                    <div>
                                        <label className="text-[10px] uppercase font-bold opacity-60 mb-2 block">Link to Pending Order</label>
                                        <select
                                            className="w-full bg-primary-700 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-white/20 outline-none text-white py-3 appearance-none px-4"
                                            onChange={(e) => setSelectedOrder({ ...selectedOrder, targetId: Number(e.target.value) })}
                                        >
                                            <option value="">Select an order...</option>
                                            {orders?.filter((o: any) => o.status === 'waiting_for_payment' || o.status === 'pending').map((o: any) => (
                                                <option key={o.id} value={o.id} className="bg-white text-gray-900">
                                                    {o.listing_title} (${o.amount}) - {o.payment_phone}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1 bg-white text-primary-600 font-bold h-11 rounded-xl shadow-lg shadow-black/10"
                                        disabled={!selectedOrder.targetId || matchMutation.isPending}
                                        onClick={() => matchMutation.mutate({ orderId: selectedOrder.targetId, txId: selectedOrder.txId })}
                                        isLoading={matchMutation.isPending}
                                    >
                                        Confirm Match
                                    </Button>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="w-11 h-11 rounded-xl bg-blue-300/30 flex items-center justify-center hover:bg-blue-300/50 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                    <Search size={32} />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-2 text-sm">Select an action</h4>
                                <p className="text-[10px] text-gray-400 leading-relaxed px-4">
                                    Select a payment from the queue to match it with a user's promotion order.
                                </p>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* LIVE SYSTEM ACTIVITY FEED */}
                    <div className="bg-gray-900 rounded-3xl p-6 text-white overflow-hidden relative">
                        <Shield className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32" />
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <Activity size={14} className="text-green-400 animate-pulse" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-300">Live System Activity</h4>
                            </div>
                            <button
                                onClick={() => refetchLogs()}
                                className="text-gray-500 hover:text-white transition-colors hover:rotate-180 duration-500"
                            >
                                <RefreshCw size={14} />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
                            {logsLoading ? (
                                <div className="text-center py-8 text-gray-600 text-xs">Loading activity...</div>
                            ) : !auditLogs || auditLogs.length === 0 ? (
                                <div className="flex gap-3">
                                    <div className="w-1 bg-primary-500 rounded-full shrink-0" />
                                    <div>
                                        <div className="text-[10px] text-gray-400 font-bold mb-1">SYSTEM STATUS</div>
                                        <p className="text-xs text-gray-300">Listening for incoming events...</p>
                                    </div>
                                </div>
                            ) : (
                                auditLogs.map((log: AuditLogEntry) => {
                                    const meta = ACTION_META[log.action] || { icon: Activity, color: 'text-gray-400', bg: 'bg-gray-500/10', label: log.action };
                                    const Icon = meta.icon;
                                    return (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-start gap-3"
                                        >
                                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${meta.bg}`}>
                                                <Icon size={12} className={meta.color} />
                                            </div>
                                            <div className="min-w-0">
                                                <div className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${meta.color}`}>
                                                    {meta.label}
                                                    {log.user_name && (
                                                        <span className="text-gray-500 ml-1 font-bold normal-case tracking-normal">
                                                            · {log.user_name}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">{log.details}</p>
                                                <div className="text-[9px] text-gray-600 mt-0.5">
                                                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AgentDashboard;
