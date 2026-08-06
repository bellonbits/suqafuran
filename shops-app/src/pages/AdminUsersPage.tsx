"use client";

import React, { useState, useEffect } from 'react';
import {
  Search, Loader, Users, Lock, Unlock, Trash2, Eye,
  ChevronLeft, ChevronRight, ToggleLeft, ToggleRight
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ADMIN_NAV_ITEMS } from '@/admin-dashboard/navigation';
import api from '@/services/api';

interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

const adminNavItems = ADMIN_NAV_ITEMS.map(({ icon: Icon, ...item }) => ({
  ...item,
  icon: <Icon className="w-5 h-5" />
}));

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
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">All Users</h2>
          <p className="text-sm text-slate-400 mt-0.5">Manage user accounts and permissions</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-7">
        <div className="stat-card flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalUsers}</p>
            <p className="text-xs text-slate-400 mt-0.5">Total Users</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
            <Unlock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{activeCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">Active</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-rose-500 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{inactiveCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">Inactive</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center flex-shrink-0">
            <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{activeRate}%</p>
            <p className="text-xs text-slate-400 mt-0.5">Active Rate</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name, email or phone…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 bg-white dark:bg-[#151D2A] shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold capitalize transition-all ${
                filterStatus === s
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#151D2A] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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
              <Loader className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-slate-400 text-sm font-medium">Loading users…</p>
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
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Showing <span className="font-extrabold text-slate-600 dark:text-slate-200">{filteredUsers.length}</span> of{' '}
              <span className="font-extrabold text-slate-600 dark:text-slate-200">{totalUsers}</span> users
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 px-2">Page {page + 1}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={filteredUsers.length < 50}
                className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
