"use client";
import React, { useState, useEffect } from 'react';
import {
  Search, Loader, Eye, CheckCircle, X, UserCheck,
  LayoutDashboard, Users, ShoppingCart, DollarSign, Truck,
  Store, Grid3x3, Tag, Percent, MessageSquare, Shield,
  AlertTriangle, TrendingUp, FileText, AlertCircle, BarChart3,
  Zap, Package, Clock, XCircle, FileImage, Video, ExternalLink
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import api from '@/services/api';

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
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved': return 'badge badge-green';
    case 'pending':  return 'badge badge-yellow';
    case 'rejected': return 'badge badge-red';
    default:         return 'badge badge-gray';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'approved': return <CheckCircle className="w-3.5 h-3.5" />;
    case 'rejected': return <XCircle className="w-3.5 h-3.5" />;
    default:         return <Clock className="w-3.5 h-3.5" />;
  }
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600 font-bold';
  if (score >= 50) return 'text-amber-600 font-bold';
  return 'text-red-600 font-bold';
}

const VerificationsPage = () => {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState<any>(null);

  useEffect(() => { loadVerifications(); }, []);

  const loadVerifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/verifications/').catch(() => null);
      if (res?.data) setVerifications(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error loading verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.patch(`/verifications/${id}`, { status: 'approved' }).catch(() => null);
      loadVerifications();
    } catch {}
  };

  const handleReject = async (id: number) => {
    try {
      await api.patch(`/verifications/${id}`, { status: 'rejected' }).catch(() => null);
      loadVerifications();
    } catch {}
  };

  const filtered = verifications.filter(v => {
    const name = v.user?.full_name || v.full_name || v.user_name || '';
    const phone = v.user?.phone || v.phone || '';
    const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery);
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount  = verifications.filter(v => v.status === 'pending').length;
  const approvedCount = verifications.filter(v => v.status === 'approved').length;
  const rejectedCount = verifications.filter(v => v.status === 'rejected').length;

  return (
    <DashboardLayout title="Verifications" navItems={adminNavItems} userRole="admin">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Verification Requests</h2>
          <p className="text-sm text-gray-500 mt-0.5">Review and approve user identity verifications</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-7">
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">{verifications.length}</p>
            <p className="text-sm text-gray-500 mt-0.5">Total</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">{pendingCount}</p>
            <p className="text-sm text-gray-500 mt-0.5">Pending Review</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">{approvedCount}</p>
            <p className="text-sm text-gray-500 mt-0.5">Approved</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">{rejectedCount}</p>
            <p className="text-sm text-gray-500 mt-0.5">Rejected</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                statusFilter === s
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s} {s !== 'all' && <span className="ml-1 opacity-70 text-xs">({
                s === 'pending' ? pendingCount : s === 'approved' ? approvedCount : rejectedCount
              })</span>}
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
              <p className="text-gray-500 text-sm">Loading verifications…</p>
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
                  <th>Tier</th>
                  <th className="hidden md:table-cell">Document Type</th>
                  <th>Match Score</th>
                  <th className="hidden sm:table-cell">Submitted</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <UserCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400 font-medium">No verifications found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((v, idx) => {
                    const name = v.user?.full_name || v.full_name || v.user_name || 'Unknown';
                    const phone = v.user?.phone || v.phone || '';
                    const score = v.facial_match_score || v.match_score || v.admin_score || 0;

                    return (
                      <tr key={v.id}>
                        {/* User */}
                        <td>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 leading-tight">{name}</p>
                              {phone && <p className="text-xs text-gray-400 mt-0.5 font-mono">{phone}</p>}
                            </div>
                          </div>
                        </td>
                        {/* Tier */}
                        <td>
                          <span className="badge badge-blue">
                            {v.tier || v.user?.verified_level || v.verification_level || 'STANDARD'}
                          </span>
                        </td>
                        {/* Doc type */}
                        <td className="hidden md:table-cell">
                          <span className="text-gray-600 text-sm">{v.document_type || v.id_type || '—'}</span>
                        </td>
                        {/* Match score */}
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(score, 100)}%` }}
                              />
                            </div>
                            <span className={`text-sm ${scoreColor(score)}`}>{score}%</span>
                          </div>
                        </td>
                        {/* Submitted */}
                        <td className="hidden sm:table-cell">
                          <span className="text-gray-500 text-xs">
                            {v.created_at ? new Date(v.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </span>
                        </td>
                        {/* Status */}
                        <td>
                          <span className={getStatusBadge(v.status)}>
                            {getStatusIcon(v.status)}
                            {v.status === 'approved' ? 'Approved' : v.status === 'pending' ? 'Pending' : 'Rejected'}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedVerification(v)}
                              className="p-1.5 rounded-lg text-sky-500 hover:bg-sky-50 transition-colors"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {v.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(v.id)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(v.id)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {v.status === 'rejected' && (
                              <button
                                onClick={() => handleApprove(v.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-400">
            Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of{' '}
            <span className="font-semibold text-gray-600">{verifications.length}</span> verifications
          </div>
        </div>
      )}

      {/* ── Detail Modal ─────────────────────────────────── */}
      {selectedVerification && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setSelectedVerification(null); }}
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-lg font-black text-gray-900">Verification #{selectedVerification.id}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Identity verification request details</p>
              </div>
              <button
                onClick={() => setSelectedVerification(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* User info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">User Information</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name', val: selectedVerification.user?.full_name || selectedVerification.full_name || '—' },
                    { label: 'Phone', val: selectedVerification.user?.phone || selectedVerification.phone || '—' },
                    { label: 'Email', val: selectedVerification.user?.email || selectedVerification.email || '—' },
                    { label: 'Level', val: selectedVerification.tier || selectedVerification.user?.verified_level || 'STANDARD' },
                  ].map(f => (
                    <div key={f.label}>
                      <p className="text-xs text-gray-400 font-semibold mb-1">{f.label}</p>
                      <p className="text-sm text-gray-900 font-medium">{f.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Verification Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold mb-1">Document Type</p>
                    <p className="text-sm text-gray-900 font-medium">{selectedVerification.document_type || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold mb-1">Status</p>
                    <span className={getStatusBadge(selectedVerification.status)}>
                      {getStatusIcon(selectedVerification.status)}
                      {selectedVerification.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold mb-1">Match Score</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${(selectedVerification.facial_match_score || 0) >= 80 ? 'bg-emerald-500' : (selectedVerification.facial_match_score || 0) >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(selectedVerification.facial_match_score || 0, 100)}%` }}
                        />
                      </div>
                      <span className={`text-sm ${scoreColor(selectedVerification.facial_match_score || 0)}`}>
                        {selectedVerification.facial_match_score || 0}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold mb-1">Submitted</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {selectedVerification.created_at ? new Date(selectedVerification.created_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ID Number */}
              {selectedVerification.id_number && (
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-2">ID Number</p>
                  <p className="text-lg font-black text-sky-600 font-mono">{selectedVerification.id_number}</p>
                </div>
              )}

              {/* Documents */}
              {(() => {
                const docs: any[] = [];
                if (selectedVerification.selfie_url) docs.push({ url: selectedVerification.selfie_url, label: 'Selfie', type: 'image' });
                if (selectedVerification.proof_of_address_url) docs.push({ url: selectedVerification.proof_of_address_url, label: 'Proof of Address', type: 'image' });
                if (selectedVerification.video_selfie_url) docs.push({ url: selectedVerification.video_selfie_url, label: 'Video Selfie', type: 'video' });
                if (Array.isArray(selectedVerification.document_urls)) {
                  selectedVerification.document_urls.forEach((url: string, i: number) => {
                    if (url) docs.push({ url, label: `Document ${i + 1}`, type: url.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image' });
                  });
                }
                const unique = Array.from(new Map(docs.map(d => [d.url, d])).values());
                if (!unique.length) return null;
                return (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Documents & Images ({unique.length})
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      {unique.map((doc, i) => (
                        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
                            {doc.type === 'pdf' ? <FileImage className="w-4 h-4 text-red-500" /> :
                             doc.type === 'video' ? <Video className="w-4 h-4 text-sky-500" /> :
                             <FileImage className="w-4 h-4 text-gray-400" />}
                            <span className="text-xs font-semibold text-gray-600">{doc.label}</span>
                          </div>
                          {doc.type === 'pdf' ? (
                            <div className="p-6 flex flex-col items-center gap-3 bg-white">
                              <FileText className="w-12 h-12 text-red-500" />
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-semibold hover:bg-sky-600 transition-colors">
                                <ExternalLink className="w-4 h-4" /> View PDF
                              </a>
                            </div>
                          ) : doc.type === 'video' ? (
                            <div className="bg-black">
                              <video src={doc.url} controls className="w-full max-h-64" />
                            </div>
                          ) : (
                            <img src={doc.url} alt={doc.label} className="w-full max-h-80 object-contain bg-gray-50" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Admin Notes */}
              {selectedVerification.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Admin Notes</p>
                  <p className="text-sm text-amber-800">{selectedVerification.notes}</p>
                </div>
              )}

              {/* Modal actions */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                {selectedVerification.status === 'pending' && (
                  <>
                    <button
                      onClick={() => { handleApprove(selectedVerification.id); setSelectedVerification(null); }}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => { handleReject(selectedVerification.id); setSelectedVerification(null); }}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </>
                )}
                {selectedVerification.status === 'rejected' && (
                  <button
                    onClick={() => { handleApprove(selectedVerification.id); setSelectedVerification(null); }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Anyway
                  </button>
                )}
                {selectedVerification.status === 'approved' && (
                  <div className="flex-1 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl font-semibold text-center flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Already Approved
                  </div>
                )}
                <button
                  onClick={() => setSelectedVerification(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default VerificationsPage;
