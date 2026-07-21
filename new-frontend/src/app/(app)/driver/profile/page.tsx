'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, DollarSign, Wallet, ArrowUp, Settings } from 'lucide-react';
import { useDriverStore } from '@/stores/driverStore';
import { driverAPI } from '@/services/driver';
import Link from 'next/link';

export default function DriverProfilePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState<'mpesa' | 'evc' | 'zaad' | 'sahal'>('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { profile, setProfile, wallet, setWallet } = useDriverStore();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/driver/login');
      return;
    }
    setToken(storedToken);

    if (profile) {
      loadWallet(storedToken);
    }
  }, [router, profile]);

  const loadWallet = async (token: string) => {
    try {
      if (!profile) return;
      const data = await driverAPI.getWallet(token, profile.id);
      setWallet(data);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    }
  };

  const handleRequestWithdrawal = async () => {
    if (!token || !profile || !withdrawalAmount || !phoneNumber) {
      alert('Please fill all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const amount = parseFloat(withdrawalAmount);

      if (amount > (wallet?.available_balance || 0)) {
        alert('Insufficient balance');
        return;
      }

      if (amount < 100) {
        alert('Minimum withdrawal is KES 100');
        return;
      }

      await driverAPI.requestWithdrawal(token, amount, withdrawalMethod, phoneNumber);

      alert('Withdrawal request submitted successfully!');
      setWithdrawalAmount('');
      setPhoneNumber('');
      setShowWithdrawal(false);

      // Reload wallet
      loadWallet(token);
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert('Failed to process withdrawal');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 pb-20">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <User className="w-6 h-6 text-[#6cd4ff]" />
          <h1 className="text-2xl font-bold text-white">Profile</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-8 mb-6 border border-slate-600">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{profile.user_id}</h2>
                <p className="text-slate-400">{profile.vehicle_type}</p>
                <p className="text-sm text-slate-500">{profile.vehicle_model} • {profile.vehicle_color}</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-[#6cd4ff] hover:text-blue-300 transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-600 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Rating</p>
              <p className="text-2xl font-bold text-yellow-400">{profile.rating.toFixed(1)}</p>
            </div>
            <div className="bg-slate-600 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Acceptance Rate</p>
              <p className="text-2xl font-bold text-[#6cd4ff]">{profile.acceptance_rate.toFixed(1)}%</p>
            </div>
            <div className="bg-slate-600 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Status</p>
              <p
                className={`text-lg font-bold capitalize ${
                  profile.status === 'online' ? 'text-green-400' : 'text-slate-400'
                }`}
              >
                {profile.status}
              </p>
            </div>
            <div className="bg-slate-600 rounded-lg p-4">
              <p className="text-slate-400 text-sm">License Plate</p>
              <p className="text-lg font-bold text-white">{profile.license_plate}</p>
            </div>
          </div>
        </div>

        {/* Wallet Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Available Balance */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-100">Available Balance</span>
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="text-4xl font-bold">KES {wallet?.available_balance.toLocaleString() || 0}</h3>
            <p className="text-sm text-green-100 mt-2">Ready to withdraw</p>
          </div>

          {/* Pending Balance */}
          <div className="bg-gradient-to-br from-orange-600 to-amber-700 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-orange-100">Pending Balance</span>
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-4xl font-bold">KES {wallet?.pending_balance.toLocaleString() || 0}</h3>
            <p className="text-sm text-orange-100 mt-2">In active deliveries</p>
          </div>

          {/* Lifetime Earnings */}
          <div className="bg-gradient-to-br from-blue-600 to-cyan-700 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100">Lifetime Earnings</span>
              <ArrowUp className="w-5 h-5" />
            </div>
            <h3 className="text-4xl font-bold">KES {wallet?.lifetime_earnings.toLocaleString() || 0}</h3>
            <p className="text-sm text-blue-100 mt-2">Total earned</p>
          </div>
        </div>

        {/* Withdrawal Section */}
        <div className="bg-slate-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Withdrawals</h2>
            <button
              onClick={() => setShowWithdrawal(!showWithdrawal)}
              className="bg-[#02CCFE] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#02CCFE] transition-colors"
            >
              + Request Withdrawal
            </button>
          </div>

          {showWithdrawal && (
            <div className="bg-slate-600 rounded-lg p-6 mb-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Amount (KES)</label>
                <input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="e.g., 5000"
                  className="w-full bg-slate-500 text-white px-4 py-2 rounded-lg placeholder-slate-400 focus:outline-none"
                  min="100"
                  max={wallet?.available_balance || 0}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Min: 100 KES | Available: KES {wallet?.available_balance.toLocaleString() || 0}
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Method</label>
                <select
                  value={withdrawalMethod}
                  onChange={(e) => setWithdrawalMethod(e.target.value as any)}
                  className="w-full bg-slate-500 text-white px-4 py-2 rounded-lg focus:outline-none"
                >
                  <option value="mpesa">M-Pesa (Kenya)</option>
                  <option value="evc">EVC Plus (Somalia)</option>
                  <option value="zaad">Zaad (Somalia)</option>
                  <option value="sahal">Sahal (Somalia)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g., 254701234567"
                  className="w-full bg-slate-500 text-white px-4 py-2 rounded-lg placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleRequestWithdrawal}
                  disabled={isSubmitting}
                  className="bg-[#02CCFE] text-white py-2 rounded-lg font-semibold hover:bg-[#02CCFE] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Request'}
                </button>
                <button
                  onClick={() => {
                    setShowWithdrawal(false);
                    setWithdrawalAmount('');
                    setPhoneNumber('');
                  }}
                  className="bg-slate-500 text-white py-2 rounded-lg font-semibold hover:bg-slate-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Driver Info */}
        <div className="bg-slate-700 rounded-lg p-6 space-y-4">
          <h3 className="font-bold text-white text-lg">Driver Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-600 rounded-lg p-4">
              <p className="text-sm text-slate-400">License Plate</p>
              <p className="text-white font-bold text-lg">{profile.license_plate}</p>
            </div>
            <div className="bg-slate-600 rounded-lg p-4">
              <p className="text-sm text-slate-400">Vehicle Color</p>
              <p className="text-white font-bold text-lg">{profile.vehicle_color}</p>
            </div>
            <div className="bg-slate-600 rounded-lg p-4">
              <p className="text-sm text-slate-400">Verification Status</p>
              <p className={`font-bold text-lg ${profile.is_verified ? 'text-green-400' : 'text-yellow-400'}`}>
                {profile.is_verified ? '✓ Verified' : 'Pending'}
              </p>
            </div>
            <div className="bg-slate-600 rounded-lg p-4">
              <p className="text-sm text-slate-400">Last Seen</p>
              <p className="text-white font-bold text-lg">{new Date(profile.last_seen).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <Link href="/driver" className="inline-block mt-8 text-[#6cd4ff] hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
