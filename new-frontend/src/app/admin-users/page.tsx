"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Loader, ArrowLeft, Users, Lock, Unlock, Trash2, Eye } from 'lucide-react';
import api from '@/services/api';

interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

const UsersManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    loadUsers();
  }, [page, searchQuery]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?limit=50&skip=${page * 50}${searchQuery ? `&search=${searchQuery}` : ''}`).catch(() => null);
      if (res?.data) {
        setUsers(Array.isArray(res.data) ? res.data : []);
        setTotalUsers(res.data?.length || 0);
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin-dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Users Management</h1>
            <p className="text-gray-500 mt-1">Manage user accounts and permissions</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6cd4ff]"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <Users className="w-10 h-10 text-[#6cd4ff] mb-4" />
            <p className="text-3xl font-black text-gray-900">{totalUsers}</p>
            <p className="text-sm text-gray-500 mt-1">Total Users</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <Lock className="w-10 h-10 text-red-500 mb-4" />
            <p className="text-3xl font-black text-gray-900">{users.filter(u => !u.is_active).length}</p>
            <p className="text-sm text-gray-500 mt-1">Inactive</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <Unlock className="w-10 h-10 text-green-500 mb-4" />
            <p className="text-3xl font-black text-gray-900">{users.filter(u => u.is_active).length}</p>
            <p className="text-sm text-gray-500 mt-1">Active</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <Eye className="w-10 h-10 text-purple-500 mb-4" />
            <p className="text-3xl font-black text-gray-900">{Math.round(users.filter(u => u.is_active).length / Math.max(totalUsers, 1) * 100)}%</p>
            <p className="text-sm text-gray-500 mt-1">Active Rate</p>
          </div>
        </div>

        {/* Table */}
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
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Joined</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{user.full_name || user.email?.split('@')[0] || 'Unknown'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.email || 'Unknown'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.phone || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          <button
                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                              user.is_active
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-3 py-1 rounded text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalUsers > 0 && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-bold hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManagementPage;
