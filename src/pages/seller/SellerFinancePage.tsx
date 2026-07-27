import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Download, ArrowUpRight, ArrowDownRight, CreditCard, Loader2 } from 'lucide-react';
import { sellerDashboardService, fmtKSh, exportToCSV, exportToPDF } from '../../services/sellerDashboardService';
import { cn } from '../../utils/cn';

export const SellerFinancePage: React.FC = () => {
  const { data: wallet } = useQuery({

    queryKey: ['seller-wallet-balance'],
    queryFn: sellerDashboardService.getWalletBalance,
    staleTime: 60_000,
  });

  const { data: txs = [], isLoading: txsLoading } = useQuery({
    queryKey: ['seller-wallet-txs'],
    queryFn: () => sellerDashboardService.getWalletTransactions(),
    staleTime: 60_000,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['seller-orders-finance'],
    queryFn: () => sellerDashboardService.getSellerOrders({ limit: 100 }),
    staleTime: 60_000,
  });

  // Calculate fields matching spec example:
  // Product Revenue: KSh 120,000 | Delivery Revenue: KSh 15,000 | Marketplace Fees: KSh 8,000 | Refunds: KSh 2,000 | Net Earnings: KSh 125,000
  const productRevenue = orders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
    .reduce((sum, o) => sum + ((o.total_amount || 0) - (o.delivery_fee || 0)), 0);

  const deliveryRevenue = orders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
    .reduce((sum, o) => sum + (o.delivery_fee || 0), 0);

  const refunds = orders.filter(o => o.status === 'refunded')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const marketplaceFees = Math.round((productRevenue + deliveryRevenue) * 0.08); // Mock commission at 8%
  const netEarnings = productRevenue + deliveryRevenue - marketplaceFees - refunds;

  const handleExportCSV = () => {
    const data = txs.map(t => ({
      ID: t.id,
      Type: t.type.toUpperCase(),
      Amount: t.amount,
      Description: t.description || '',
      Reference: t.reference || '',
      Date: new Date(t.created_at).toLocaleDateString('en-KE'),
    }));
    exportToCSV(data, 'transaction_history');
  };

  const handleExportPDF = () => {
    exportToPDF('Financial Report');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Finance Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track payouts, wallet transactions, and earnings</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-6 text-white shadow-md flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <CreditCard className="w-32 h-32" />
        </div>
        <div>
          <p className="text-xs font-bold text-sky-100 uppercase tracking-widest mb-1.5">Wallet Balance</p>
          <p className="text-3xl font-black">{fmtKSh(wallet?.balance ?? 0)}</p>
          <p className="text-[10px] text-sky-100/70 mt-1">Available for direct M-Pesa withdrawal</p>
        </div>
        <button className="bg-white hover:bg-sky-50 text-sky-600 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow shadow-sky-600/10">
          Request Withdrawal
        </button>
      </div>

      {/* Financial Summary */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4" id="printable-section">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Financial Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Product Revenue', val: productRevenue, color: 'text-slate-800' },
            { label: 'Delivery Revenue', val: deliveryRevenue, color: 'text-slate-800' },
            { label: 'Marketplace Fees', val: marketplaceFees, color: 'text-red-500' },
            { label: 'Refunds', val: refunds, color: 'text-red-500' },
            { label: 'Net Earnings', val: netEarnings, color: 'text-sky-600' },
          ].map(item => (
            <div key={item.label} className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">{item.label}</span>
              <span className={cn('text-sm font-black', item.color)}>{fmtKSh(item.val)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Transaction History</h3>
        {txsLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-sky-500" /></div>
        ) : txs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
            <DollarSign className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-sm text-slate-500 font-bold">No transactions found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">ID / Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wide">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {txs.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-800">#{t.id}</span>
                        {t.reference && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{t.reference}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md uppercase border',
                          t.type === 'credit' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                        )}>
                          {t.type === 'credit' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {t.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600 max-w-[200px] truncate">{t.description || '—'}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(t.created_at).toLocaleDateString('en-KE')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn('text-sm font-black', t.type === 'credit' ? 'text-emerald-600' : 'text-red-500')}>
                          {t.type === 'credit' ? '+' : '-'}{fmtKSh(t.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
