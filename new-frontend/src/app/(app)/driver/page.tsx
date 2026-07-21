'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation, MapPin, Clock, DollarSign, MessageSquare, LogOut, Menu, X } from 'lucide-react';
import { useDriverStore } from '@/stores/driverStore';
import { driverAPI } from '@/services/driver';
import Link from 'next/link';

export default function DriverDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);

  const {
    profile,
    setProfile,
    activeDeliveries,
    offers,
    wallet,
    setWallet,
    setIsLoading,
  } = useDriverStore();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/driver/login');
      return;
    }
    setToken(storedToken);

    // Load driver profile
    loadProfile(storedToken);
    loadWallet(storedToken);
    loadTodayEarnings(storedToken);
  }, [router]);

  const loadProfile = async (token: string) => {
    try {
      setIsLoading(true);
      const data = await driverAPI.getProfile(token);
      setProfile(data);
      setIsOnline(data.status === 'online');
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWallet = async (token: string) => {
    try {
      if (!profile) return;
      const data = await driverAPI.getWallet(token, profile.id);
      setWallet(data);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    }
  };

  const loadTodayEarnings = async (token: string) => {
    try {
      const data = await driverAPI.getTodayEarnings(token);
      setTodayEarnings(data.total || 0);
    } catch (error) {
      console.error('Failed to load earnings:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!token) return;
    try {
      const newStatus = isOnline ? 'offline' : 'online';
      await driverAPI.updateStatus(token, newStatus as 'online' | 'offline');
      setIsOnline(!isOnline);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/driver/login');
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{profile.user_id.slice(0, 8)}</h1>
              <p className="text-sm text-slate-400">{profile.vehicle_type}</p>
            </div>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white lg:hidden"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Status Toggle */}
      <div className="bg-slate-700 border-b border-slate-600">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={toggleOnlineStatus}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                isOnline
                  ? 'bg-[#02CCFE] text-white hover:bg-[#02CCFE]'
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              {isOnline ? '🟢 Online' : '⚫ Offline'}
            </button>
            <div className="text-sm text-slate-300">
              Rating: <span className="font-bold text-yellow-400">{profile.rating.toFixed(1)}</span>
              {' '} | {' '}
              Acceptance: <span className="font-bold text-[#6cd4ff]">{profile.acceptance_rate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats & Navigation */}
        <div className="lg:col-span-1 space-y-4">
          {/* Today's Earnings */}
          <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-100">Today's Earnings</span>
              <DollarSign className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-bold">KES {todayEarnings.toLocaleString()}</h2>
            <p className="text-sm text-emerald-100 mt-2">
              Available: KES {wallet?.available_balance.toLocaleString() || 0}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-700 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Active Deliveries</span>
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                {activeDeliveries.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Pending Offers</span>
              <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                {offers.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Lifetime Earnings</span>
              <span className="text-green-400 font-bold">KES {wallet?.lifetime_earnings.toLocaleString() || 0}</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="bg-slate-700 rounded-lg p-4 space-y-2">
            <Link
              href="/driver/active"
              className="block px-4 py-3 rounded-lg text-white hover:bg-slate-600 transition-colors flex items-center gap-3"
            >
              <MapPin className="w-5 h-5 text-green-400" />
              <span>Active Delivery</span>
            </Link>
            <Link
              href="/driver/earnings"
              className="block px-4 py-3 rounded-lg text-white hover:bg-slate-600 transition-colors flex items-center gap-3"
            >
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>Earnings</span>
            </Link>
            <Link
              href="/driver/chat"
              className="block px-4 py-3 rounded-lg text-white hover:bg-slate-600 transition-colors flex items-center gap-3"
            >
              <MessageSquare className="w-5 h-5 text-[#6cd4ff]" />
              <span>Messages</span>
            </Link>
            <Link
              href="/driver/profile"
              className="block px-4 py-3 rounded-lg text-white hover:bg-slate-600 transition-colors flex items-center gap-3"
            >
              <Navigation className="w-5 h-5 text-purple-400" />
              <span>Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 rounded-lg text-white hover:bg-red-600/20 transition-colors flex items-center gap-3 text-red-400"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>

        {/* Right Column - Job Offers */}
        <div className="lg:col-span-2">
          <div className="bg-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">
              {offers.length === 0 ? 'No Offers Right Now' : `New {offers.length} New Offers`}
            </h2>

            {offers.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">
                  {isOnline
                    ? 'Waiting for job offers... Keep your app open to receive notifications.'
                    : 'Go online to receive job offers'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {offers.map((offer) => (
                  <JobOfferCard key={offer.id} offer={offer} token={token} onAccept={loadProfile} />
                ))}
              </div>
            )}
          </div>

          {/* Active Deliveries Summary */}
          {activeDeliveries.length > 0 && (
            <div className="bg-slate-700 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-bold text-white mb-4">Active Deliveries</h3>
              <div className="space-y-3">
                {activeDeliveries.map((delivery) => (
                  <Link
                    key={delivery.id}
                    href={`/driver/active/${delivery.id}`}
                    className="flex items-center justify-between p-4 bg-slate-600 rounded-lg hover:bg-slate-500 transition-colors"
                  >
                    <div>
                      <p className="text-white font-semibold">{delivery.customer_name}</p>
                      <p className="text-sm text-slate-400">{delivery.pickup_address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">KES {delivery.delivery_fee}</p>
                      <p className="text-sm text-slate-400">{delivery.eta_minutes} min</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
}

function JobOfferCard({
  offer,
  token,
  onAccept,
}: {
  offer: any;
  token: string | null;
  onAccept: (token: string) => void;
}) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleAccept = async () => {
    if (!token) return;
    try {
      setIsAccepting(true);
      await driverAPI.acceptOffer(token, offer.id);
      onAccept(token);
    } catch (error) {
      console.error('Failed to accept offer:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!token) return;
    try {
      setIsRejecting(true);
      await driverAPI.rejectOffer(token, offer.id);
      onAccept(token);
    } catch (error) {
      console.error('Failed to reject offer:', error);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="bg-slate-600 rounded-lg p-4 border-l-4 border-orange-500">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-bold">{offer.order_type}</h3>
          <p className="text-sm text-slate-300">{offer.estimated_distance} km</p>
        </div>
        <div className="text-right">
          <p className="text-green-400 font-bold text-lg">KES {offer.delivery_fee}</p>
          <p className="text-sm text-slate-400">{offer.estimated_duration} min</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-[#6cd4ff] mt-1" />
          <div>
            <p className="text-sm text-slate-300">{offer.pickup_address}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Navigation className="w-4 h-4 text-green-400 mt-1" />
          <div>
            <p className="text-sm text-slate-300">{offer.dropoff_address}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAccept}
          disabled={isAccepting}
          className="flex-1 bg-[#02CCFE] text-white py-2 rounded-lg font-semibold hover:bg-[#02CCFE] transition-colors disabled:opacity-50"
        >
          {isAccepting ? '...' : '✓ Accept'}
        </button>
        <button
          onClick={handleReject}
          disabled={isRejecting}
          className="flex-1 bg-red-500/20 text-red-400 py-2 rounded-lg font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50"
        >
          {isRejecting ? '...' : '✕ Reject'}
        </button>
      </div>

      <p className="text-xs text-slate-500 mt-3">
        Expires in {new Date(offer.expires_at).getMinutes()} minutes
      </p>
    </div>
  );
}
