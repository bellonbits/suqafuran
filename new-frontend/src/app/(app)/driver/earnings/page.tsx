'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import { driverAPI, DriverEarnings } from '@/services/driver';
import Link from 'next/link';

export default function EarningsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<DriverEarnings[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [thisWeekTotal, setThisWeekTotal] = useState(0);
  const [thisMonthTotal, setThisMonthTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/driver/login');
      return;
    }
    setToken(storedToken);
    loadEarnings(storedToken);
  }, [router]);

  const loadEarnings = async (token: string) => {
    try {
      setIsLoading(true);
      const data = await driverAPI.getEarnings(token, 100);
      setEarnings(data);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      let todaySum = 0,
        weekSum = 0,
        monthSum = 0;

      data.forEach((e) => {
        const date = new Date(e.created_at);
        const netAmount = e.net_amount || 0;

        if (date >= today) todaySum += netAmount;
        if (date >= weekStart) weekSum += netAmount;
        if (date >= monthStart) monthSum += netAmount;
      });

      setTodayTotal(todaySum);
      setThisWeekTotal(weekSum);
      setThisMonthTotal(monthSum);
    } catch (error) {
      console.error('Failed to load earnings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredEarnings = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return earnings.filter((e) => {
      const date = new Date(e.created_at);
      switch (filter) {
        case 'today':
          return date >= today;
        case 'week':
          return date >= weekStart;
        case 'month':
          return date >= monthStart;
        default:
          return true;
      }
    });
  };

  const filteredEarnings = getFilteredEarnings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 pb-20">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <DollarSign className="w-6 h-6 text-green-400" />
          <h1 className="text-2xl font-bold text-white">Earnings</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <SummaryCard label="Today" amount={todayTotal} icon={<Calendar className="w-5 h-5" />} />
          <SummaryCard label="This Week" amount={thisWeekTotal} icon={<TrendingUp className="w-5 h-5" />} />
          <SummaryCard label="This Month" amount={thisMonthTotal} icon={<DollarSign className="w-5 h-5" />} />
        </div>

        {/* Filter Tabs */}
        <div className="bg-slate-700 rounded-lg p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {(['today', 'week', 'month', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors capitalize ${
                  filter === f
                    ? 'bg-[#02CCFE] text-white'
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                {f === 'week' ? 'This Week' : f === 'month' ? 'This Month' : f === 'today' ? 'Today' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Earnings List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : filteredEarnings.length === 0 ? (
          <div className="bg-slate-700 rounded-lg p-12 text-center">
            <DollarSign className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No earnings for this period</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEarnings.map((earning) => (
              <div key={earning.id} className="bg-slate-700 rounded-lg p-4 flex items-center justify-between hover:bg-slate-600 transition-colors">
                <div>
                  <p className="text-white font-semibold">Order #{earning.order_id.slice(0, 8)}</p>
                  <p className="text-sm text-slate-400">{new Date(earning.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-green-400 font-bold text-lg">
                    <ArrowUpRight className="w-4 h-4" />
                    KES {earning.net_amount.toLocaleString()}
                  </div>
                  <p className="text-sm text-slate-400">
                    Gross: KES {earning.gross_amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <Link href="/driver" className="inline-block mt-8 text-[#6cd4ff] hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  amount,
  icon,
}: {
  label: string;
  amount: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-lg p-6 text-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-emerald-100">{label}</span>
        <div className="text-emerald-200">{icon}</div>
      </div>
      <h3 className="text-3xl font-bold">KES {amount.toLocaleString()}</h3>
    </div>
  );
}
