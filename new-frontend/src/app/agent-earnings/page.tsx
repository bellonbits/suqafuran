"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DollarSign, ArrowLeft, Wallet, Loader } from 'lucide-react';
import api from '@/services/api';

export default function AgentEarningsPage() {
  const [earnings, setEarnings] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const [earningsRes, txRes] = await Promise.all([
        api.get('/promotions/agent/history'),
        api.get('/wallet/transactions'),
      ]);
      setEarnings(earningsRes.data);
      setTransactions(Array.isArray(txRes.data) ? txRes.data.slice(0, 10) : []);
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-slate-800 border-b border-slate-700 p-6">
        <div className="flex items-center gap-4">
          <Link href="/agent-dashboard" className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <h1 className="text-3xl font-black text-white">Earnings</h1>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-medium">This Month</p>
                <h3 className="text-3xl font-black text-white mt-2">Ksh {Math.round((earnings?.this_month || 0) / 1000)}k</h3>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-medium">Total Earned</p>
                <h3 className="text-3xl font-black text-white mt-2">Ksh {Math.round((earnings?.total_earned || 0) / 1000)}k</h3>
              </div>
              <Wallet className="w-8 h-8 text-[#6cd4ff]" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-medium">Available Balance</p>
                <h3 className="text-3xl font-black text-white mt-2">Ksh {Math.round((earnings?.available_balance || 0) / 1000)}k</h3>
              </div>
              <DollarSign className="w-8 h-8 text-purple-400" />
            </div>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-black text-white mb-6">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-300">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-300">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-300">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-3 text-center text-slate-400">No transactions</td></tr>
                ) : (
                  transactions.map((tx) => (
                    <motion.tr key={tx.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-white font-medium">{tx.description || 'Transaction'}</td>
                      <td className="px-4 py-3 text-sm font-bold text-green-400">Ksh {tx.amount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex w-fit ${
                          tx.status === 'completed' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'
                        }`}>
                          {tx.status || 'Pending'}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
