"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader, ArrowLeft, Gift } from 'lucide-react';
import api from '@/services/api';

const VouchersPage = () => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      const res = await api.get('/admin/vouchers?limit=50').catch(() => null);
      if (res?.data) setVouchers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error loading vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <Link href="/admin-dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Vouchers</h1>
            <p className="text-gray-500 mt-1">Manage discount vouchers</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
          <Gift className="w-10 h-10 text-purple-500 mb-4" />
          <p className="text-3xl font-black text-gray-900">{vouchers.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total Vouchers</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Code</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Discount</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Uses</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No vouchers found</td></tr>
                  ) : (
                    vouchers.map((v) => (
                      <tr key={v.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{v.code}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{v.discount}%</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{v.used_count || 0}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            v.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {v.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VouchersPage;
