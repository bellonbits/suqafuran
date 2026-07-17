"use client";

import React, { useState, useEffect } from 'react';
import {
  Search, Loader, Users, Lock, Unlock, Trash2, Eye,
  LayoutDashboard, UserCheck, ShoppingCart, DollarSign, Truck,
  Store, Grid3x3, Tag, Percent, MessageSquare, Shield,
  AlertTriangle, TrendingUp, FileText, AlertCircle, BarChart3,
  Zap, Package, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import api from '@/services/api';

interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

const adminNavItems = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, href: '/admin-dashboard' },
  { label: 'Agent Dashboard', icon: <TrendingUp className="w-5 h-5" />, href: '/agent-dashboard' },
  { label: 'Users', icon: <Users className="w-5 h-5" />, href: '/admin-users' },
  { label: 'Shops', icon: <Store className="w-5 h-5" />, href: '/admin-shops' },
  { label: 'Listings', icon: <Grid3x3 className="w-5 h-5" />, href: '/admin-listings' },
  { label: 'Verifications', icon: <UserCheck className="w-5 h-5" />, href: '/admin-verifications' },
  { label: 'Orders', icon: <ShoppingCart className="w-5 h-5" />, href: '/admin-orders' },
  { label: 'Transactions', icon: <DollarSign className="w-5 h-5" />, href: '/admin-transactions' },
  { label: 'Deliveries', icon: <Truck className="w-5 h-5" />, href: '/admin-deliveries' },
  { label: 'Sellers', icon: <Package className="w-5 h-5" />, href: '/admin-sellers' },
  { label: 'Categories', icon: <Zap className="w-5 h-5" />, href: '/admin-categories' },
  { label: 'Vouchers', icon: <Tag className="w-5 h-5" />, href: '/admin-vouchers' },
  { label: 'Promotions', icon: <Percent className="w-5 h-5" />, href: '/admin-promotions' },
  { label: 'Support', icon: <MessageSquare className="w-5 h-5" />, href: '/admin-support' },
  { label: 'Fraud', icon: <Shield className="w-5 h-5" />, href: '/admin-fraud' },
  { label: 'Unusual Accounts', icon: <AlertTriangle className="w-5 h-5" />, href: '/admin-unusual-accounts' },
  { label: 'Marketing', icon: <TrendingUp className="w-5 h-5" />, href: '/admin-marketing' },
  { label: 'Reports', icon: <FileText className="w-5 h-5" />, href: '/admin-reports' },
  { label: 'Disputes', icon: <AlertCircle className="w-5 h-5" />, href: '/admin-disputes' },
  { label: 'Analytics', icon: <BarChart3 className="w-5 h-5" />, href: '/admin-analytics' },
];

const AVATAR_COLORS = [
  'from-sky-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-purple-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-red-500',
  'from-indigo-400 to-violet-500',
];

function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

const UsersManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => { loadUsers(); }, [page, searchQuery]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/admin/users?limit=50&skip=${page * 50}${searchQuery ? `&search=${searchQuery}` : ''}`
      ).catch(() => null);
      if (res?.data) {
        const data = Array.isArray(res.data) ? res.data : [];
        setUsers(data);
        setTotalUsers(data.length);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: number, isActive: boolean) => {
    try {
      await api.post(`/admin/users/${userId}/status`, { is_active: !isActive }).catch(() => null);
      loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`).catch(() => null);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const filteredUsers = users.filter(u => {
    if (filterStatus === 'active') return u.is_active;
    if (filterStatus === 'inactive') return !u.is_active;
    return true;
  });

  const activeCount = users.filter(u => u.is_active).length;
  const inactiveCount = users.filter(u => !u.is_active).length;
  const activeRate = users.length > 0 ? Math.round((activeCount / users.length) * 100) : 0;

  return (
    <DashboardLayout title="Users Management" navItems={adminNavItems} userRole="admin">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">All Users</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage user accounts and permissions</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-7">
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">{totalUsers}</p>
            <p className="text-sm text-gray-500 mt-0.5">Total Users</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Unlock className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">{activeCount}</p>
            <p className="text-sm text-gray-500 mt-0.5">Active</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <Lock className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">{inactiveCount}</p>
            <p className="text-sm text-gray-500 mt-0.5">Inactive</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Eye className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">{activeRate}%</p>
            <p className="text-sm text-gray-500 mt-0.5">Active Rate</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email or phone…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                filterStatus === s
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="data-table-wrapper">
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader className="w-8 h-8 animate-spin text-sky-500" />
              <p className="text-gray-500 text-sm">Loading users…</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th className="hidden md:table-cell">Email</th>
                  <th className="hidden lg:table-cell">Phone</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400 font-medium">No users found</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColor(user.id)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                            {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 leading-tight">
                              {user.full_name || user.email?.split('@')[0] || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 md:hidden">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="text-gray-600 text-sm">{user.email || '—'}</span>
                      </td>
                      <td className="hidden lg:table-cell">
                        <span className="text-gray-600 text-sm font-mono">{user.phone || '—'}</span>
                      </td>
                      <td>
                        <span className={`badge ${user.is_active ? 'badge-green' : 'badge-red'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="text-gray-500 text-xs">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.is_active
                                ? 'text-red-400 hover:bg-red-50 hover:text-red-600'
                                : 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            {user.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            title="Delete user"
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Showing <span className="font-semibold text-gray-600">{filteredUsers.length}</span> of{' '}
              <span className="font-semibold text-gray-600">{totalUsers}</span> users
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-gray-600 px-2">Page {page + 1}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={filteredUsers.length < 50}
                className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default UsersManagementPage;
