'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, ShoppingCart, TrendingUp, Star, MapPin, Clock } from 'lucide-react';
import { merchantAPI, OrderInbox, MerchantAnalytics } from '@/services/merchant';
import Link from 'next/link';

export default function MerchantDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');
  const [orders, setOrders] = useState<OrderInbox[]>([]);
  const [analytics, setAnalytics] = useState<MerchantAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'accepted' | 'preparing' | 'ready'>('pending');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/merchant/login');
      return;
    }
    setToken(storedToken);
    loadData(storedToken);
  }, [router, selectedStatus]);

  const loadData = async (token: string) => {
    try {
      setIsLoading(true);
      const [profile, ordersData, analyticsData] = await Promise.all([
        merchantAPI.getProfile(token),
        merchantAPI.getOrders(token, selectedStatus === 'all' ? undefined : selectedStatus),
        merchantAPI.getAnalytics(token, 'today'),
      ]);
      setStoreName(profile.store_name);
      setOrders(ordersData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!token) return;
    try {
      await merchantAPI.acceptOrder(token, orderId);
      loadData(token);
    } catch (error) {
      console.error('Failed to accept order:', error);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!token) return;
    try {
      await merchantAPI.rejectOrder(token, orderId);
      loadData(token);
    } catch (error) {
      console.error('Failed to reject order:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 pb-20">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{storeName || 'Merchant Dashboard'}</h1>
              <p className="text-xs text-slate-400">Order Management</p>
            </div>
          </div>
          <Link href="/merchant/settings" className="text-[#6cd4ff] hover:text-blue-300">
            Settings
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <AnalyticsCard
              label="Orders Today"
              value={analytics.orders_today}
              icon={<ShoppingCart className="w-5 h-5" />}
              color="bg-blue"
            />
            <AnalyticsCard
              label="Completed"
              value={analytics.completed_orders}
              icon={<Clock className="w-5 h-5" />}
              color="bg-green"
            />
            <AnalyticsCard
              label="Revenue Today"
              value={`KES ${analytics.total_revenue.toLocaleString()}`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="bg-emerald"
            />
            <AnalyticsCard
              label="Rating"
              value={analytics.average_rating.toFixed(1)}
              icon={<Star className="w-5 h-5" />}
              color="bg-yellow"
            />
          </div>
        )}

        {/* Orders Section */}
        <div className="bg-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Order Inbox</h2>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'pending', 'accepted', 'preparing', 'ready'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors capitalize ${
                    selectedStatus === status
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No orders in this category</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAccept={() => handleAcceptOrder(order.id)}
                  onReject={() => handleRejectOrder(order.id)}
                  token={token}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
          <Link
            href="/merchant/deliveries"
            className="bg-slate-700 p-4 rounded-lg hover:bg-slate-600 transition-colors text-center"
          >
            <MapPin className="w-6 h-6 text-[#6cd4ff] mx-auto mb-2" />
            <p className="text-white font-semibold">Deliveries</p>
            <p className="text-xs text-slate-400">Track orders</p>
          </Link>
          <Link
            href="/merchant/analytics"
            className="bg-slate-700 p-4 rounded-lg hover:bg-slate-600 transition-colors text-center"
          >
            <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-white font-semibold">Analytics</p>
            <p className="text-xs text-slate-400">View performance</p>
          </Link>
          <Link
            href="/merchant/settings"
            className="bg-slate-700 p-4 rounded-lg hover:bg-slate-600 transition-colors text-center"
          >
            <Store className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-white font-semibold">Settings</p>
            <p className="text-xs text-slate-400">Manage store</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function AnalyticsCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const gradients: { [key: string]: string } = {
    'bg-blue': 'from-blue-600 to-blue-700',
    'bg-green': 'from-green-600 to-emerald-700',
    'bg-emerald': 'from-emerald-600 to-green-700',
    'bg-yellow': 'from-yellow-500 to-amber-600',
  };

  return (
    <div className={`bg-gradient-to-br ${gradients[color]} rounded-lg p-6 text-white`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-opacity-75 text-sm">{label}</span>
        <div className="text-opacity-75">{icon}</div>
      </div>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  );
}

function OrderCard({
  order,
  onAccept,
  onReject,
  token,
}: {
  order: OrderInbox;
  onAccept: () => void;
  onReject: () => void;
  token: string | null;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await onAccept();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-slate-600 rounded-lg p-4 border-l-4 border-blue-500">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-bold">{order.customer_name}</h3>
          <p className="text-sm text-slate-300">Order #{order.id.slice(0, 8)}</p>
        </div>
        <div className="text-right">
          <p className="text-green-400 font-bold">KES {order.total_amount.toLocaleString()}</p>
          <p className={`text-xs font-semibold capitalize ${
            order.status === 'pending' ? 'text-yellow-400' : 'text-[#6cd4ff]'
          }`}>
            {order.status}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="text-sm text-slate-300">
          <p className="font-semibold mb-1">Items:</p>
          {order.items.slice(0, 2).map((item, i) => (
            <p key={i} className="text-xs">
              • {item.product_name} x{item.quantity}
            </p>
          ))}
          {order.items.length > 2 && <p className="text-xs">+ {order.items.length - 2} more</p>}
        </div>
      </div>

      {order.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="flex-1 bg-[#02CCFE] text-white py-2 rounded-lg font-semibold hover:bg-[#02CCFE] transition-colors disabled:opacity-50 text-sm"
          >
            ✓ Accept
          </button>
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="flex-1 bg-red-500/20 text-red-400 py-2 rounded-lg font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-50 text-sm"
          >
            ✕ Reject
          </button>
        </div>
      )}

      {order.status === 'accepted' && (
        <Link
          href={`/merchant/order/${order.id}`}
          className="block w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-[#5bc0e8] transition-colors text-center text-sm"
        >
          View Details
        </Link>
      )}
    </div>
  );
}
