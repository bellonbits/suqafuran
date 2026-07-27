import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Loader2 } from 'lucide-react';
import { sellerDashboardService, fmtKSh, exportToCSV, exportToPDF } from '../../services/sellerDashboardService';


type ReportType = 'sales' | 'orders' | 'delivery' | 'inventory' | 'customer';

export const SellerReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['seller-orders-reports'],
    queryFn: () => sellerDashboardService.getSellerOrders({ limit: 500 }),
    staleTime: 60_000,
  });

  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ['seller-listings-reports'],
    queryFn: () => sellerDashboardService.getMyListings({ limit: 500 }),
    staleTime: 60_000,
  });

  const dateFilteredOrders = orders.filter((o: any) => {
    if (!o.created_at) return false;
    const date = o.created_at.split('T')[0];
    return date >= startDate && date <= endDate;
  });

  const handleExportCSV = () => {
    let exportData: any[] = [];
    if (reportType === 'sales') {
      exportData = dateFilteredOrders.map(o => ({
        'Order #': o.order_number || o.id,
        Date: new Date(o.created_at).toLocaleDateString('en-KE'),
        Customer: o.buyer_name || 'N/A',
        Items: (o.items || []).length,
        'Delivery Fee': o.delivery_fee || 0,
        Total: o.total_amount,
        Status: o.status,
      }));
    } else if (reportType === 'inventory') {
      exportData = listings.map(l => ({
        ID: l.id,
        Title: l.title_en || 'N/A',
        SKU: l.sku || '',
        Price: l.price,
        Stock: l.stock_quantity ?? l.stock_level ?? 0,
        Views: l.views ?? 0,
        Status: l.status || (l.is_active ? 'Active' : 'Inactive'),
      }));
    } else {
      // Fallback
      exportData = dateFilteredOrders;
    }
    exportToCSV(exportData, `${reportType}_report`);
  };

  const handleExportPDF = () => {
    exportToPDF(`${reportType.toUpperCase()} Report (${startDate} to ${endDate})`);
  };

  const loading = ordersLoading || listingsLoading;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Generate, view, and export operational summaries</p>
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

      {/* Select Report and Date pickers */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-600 mb-1.5 block">Select Report Type</label>
          <select
            value={reportType}
            onChange={e => setReportType(e.target.value as ReportType)}
            className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl bg-white"
          >
            <option value="sales">Sales Report</option>
            <option value="orders">Orders Report</option>
            <option value="delivery">Delivery Report</option>
            <option value="inventory">Inventory Report</option>
            <option value="customer">Customer Report</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 mb-1.5 block">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl bg-white"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 mb-1.5 block">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl bg-white"
          />
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4" id="printable-section">
        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 capitalize">{reportType} Report</h3>
            <p className="text-xs text-slate-400 mt-0.5">Showing records from {startDate} to {endDate}</p>
          </div>
          <FileText className="w-5 h-5 text-slate-300" />
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-sky-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            {reportType === 'sales' && (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-bold text-slate-400 border-b border-slate-50 pb-2">
                    <th className="pb-2">Order</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-600">
                  {dateFilteredOrders.map(o => (
                    <tr key={o.id} className="py-2.5">
                      <td className="py-2.5 font-bold text-slate-800">#{o.order_number || o.id}</td>
                      <td className="py-2.5">{new Date(o.created_at).toLocaleDateString('en-KE')}</td>
                      <td className="py-2.5">{o.buyer_name || 'Anonymous'}</td>
                      <td className="py-2.5 capitalize">{o.status}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">{fmtKSh(o.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'inventory' && (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-bold text-slate-400 border-b border-slate-50 pb-2">
                    <th className="pb-2">Product</th>
                    <th className="pb-2">SKU</th>
                    <th className="pb-2">Price</th>
                    <th className="pb-2">Stock Level</th>
                    <th className="pb-2 text-right">Views</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-600">
                  {listings.map(l => (
                    <tr key={l.id} className="py-2.5">
                      <td className="py-2.5 font-bold text-slate-800">{l.title_en || 'Product'}</td>
                      <td className="py-2.5"><code>{l.sku || '—'}</code></td>
                      <td className="py-2.5">{fmtKSh(l.price)}</td>
                      <td className="py-2.5">{l.stock_quantity ?? l.stock_level ?? 0} units</td>
                      <td className="py-2.5 text-right">{l.views || 0} views</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* General fallback if tables are empty */}
            {((reportType === 'sales' && dateFilteredOrders.length === 0) || (reportType === 'inventory' && listings.length === 0)) && (
              <p className="text-center text-xs text-slate-400 py-10">No report records found matching filter criteria</p>
            )}

            {['orders', 'delivery', 'customer'].includes(reportType) && (
              <p className="text-center text-xs text-slate-400 py-10">Report preview generation under development. Click CSV to export raw records.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
