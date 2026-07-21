"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Loader, ArrowLeft, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/services/api';

const SupportManagementPage = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTickets();
  }, [filter]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/support/tickets`).catch(() => null);
      if (res?.data) {
        let data = Array.isArray(res.data) ? res.data : [];
        if (filter === 'open') data = data.filter((t: any) => t.status !== 'resolved' && t.status !== 'closed');
        if (filter === 'resolved') data = data.filter((t: any) => t.status === 'resolved' || t.status === 'closed');
        setTickets(data);
      }
    } catch (error) {
      console.error('Error loading support tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveTicket = async (ticketId: number) => {
    try {
      await api.patch(`/support/tickets/${ticketId}`, { status: 'resolved' }).catch(() => null);
      loadTickets();
    } catch (error) {
      console.error('Error resolving ticket:', error);
    }
  };

  const filteredTickets = tickets.filter((t) =>
    t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  const openCount = tickets.filter((t) => t.status !== 'resolved').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin-dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Support Tickets</h1>
            <p className="text-gray-500 mt-1">Manage customer support requests</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6cd4ff]"
          />
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <MessageSquare className="w-10 h-10 text-[#6cd4ff] mb-4" />
            <p className="text-3xl font-black text-gray-900">{tickets.length}</p>
            <p className="text-sm text-gray-500 mt-1">Total Tickets</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <AlertCircle className="w-10 h-10 text-yellow-500 mb-4" />
            <p className="text-3xl font-black text-gray-900">{openCount}</p>
            <p className="text-sm text-gray-500 mt-1">Open Tickets</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <CheckCircle className="w-10 h-10 text-green-500 mb-4" />
            <p className="text-3xl font-black text-gray-900">{resolvedCount}</p>
            <p className="text-sm text-gray-500 mt-1">Resolved</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'open', 'resolved'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === f
                  ? 'bg-[#5bc0e8] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Tickets Table */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Title</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">User</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Date</th>
                <th className="px-6 py-4 text-left font-bold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No tickets found
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900 font-medium">{ticket.title}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{ticket.user_email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        ticket.status === 'resolved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {ticket.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolveTicket(ticket.id)}
                          className="px-3 py-1 bg-[#02CCFE] hover:bg-[#02CCFE] text-white rounded-lg text-sm font-bold transition-colors"
                        >
                          Resolve
                        </button>
                      )}
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

export default SupportManagementPage;
