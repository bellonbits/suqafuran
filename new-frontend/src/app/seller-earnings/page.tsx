"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Wallet, ArrowDown, Loader, ArrowLeft } from 'lucide-react';
import api from '@/services/api';

const SellerEarningsPage = () => {
  const [earnings, setEarnings] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      const earningsRes = await api.get('/sellers/me/earnings').catch(() => null);
      if (earningsRes?.data) setEarnings(earningsRes.data);

      const withdrawalsRes = await api.get('/sellers/me/withdrawals').catch(() => null);
      if (withdrawalsRes?.data) setWithdrawals(Array.isArray(withdrawalsRes.data) ? withdrawalsRes.data : []);
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestWithdrawal = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      alert('Please enter valid amount');
      return;
    }
    try {
      await api.post('/sellers/me/withdrawals', { amount: parseFloat(withdrawalAmount) }).catch(() => null);
      setWithdrawalAmount('');
      loadEarningsData();
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  const availableBalance = (earnings?.total_available || 0) - (earnings?.pending_withdrawal || 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <Link href="/seller-dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Earnings & Withdrawals</h1>
            <p className="text-gray-500 mt-1">Track your sales and request withdrawals</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div className="bg-white border border-gray-200 rounded-2xl p-6">
            <DollarSign className="w-10 h-10 text-green-500 mb-4" />
            <p className="text-3xl font-black text-gray-900">Ksh {Math.round(earnings?.total_revenue || 0).toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Total Revenue</p>
          </motion.div>

          <motion.div className="bg-white border border-gray-200 rounded-2xl p-6">
            <Wallet className="w-10 h-10 text-[#6cd4ff] mb-4" />
            <p className="text-3xl font-black text-gray-900">Ksh {Math.round(availableBalance).toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Available Balance</p>
          </motion.div>

          <motion.div className="bg-white border border-gray-200 rounded-2xl p-6">
            <ArrowDown className="w-10 h-10 text-orange-500 mb-4" />
            <p className="text-3xl font-black text-gray-900">Ksh {Math.round(earnings?.pending_withdrawal || 0).toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Pending Withdrawal</p>
          </motion.div>

          <motion.div className="bg-white border border-gray-200 rounded-2xl p-6">
            <TrendingUp className="w-10 h-10 text-purple-500 mb-4" />
            <p className="text-3xl font-black text-gray-900">{earnings?.total_sales || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Total Sales</p>
          </motion.div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-black text-gray-900 mb-4">Request Withdrawal</h2>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Amount (Ksh)"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg"
            />
            <button
              onClick={handleRequestWithdrawal}
              className="px-6 py-3 bg-[#5bc0e8] hover:bg-sky-700 text-white rounded-lg font-bold transition-colors"
            >
              Request
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-black text-gray-900">Withdrawal History</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Amount</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Date</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No withdrawals yet
                  </td>
                </tr>
              ) : (
                withdrawals.map((w, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-900">Ksh {w.amount?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        w.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {w.created_at ? new Date(w.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerEarningsPage;
