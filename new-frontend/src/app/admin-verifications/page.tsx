"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Loader, ArrowLeft, Eye, CheckCircle, X } from 'lucide-react';
import api from '@/services/api';

const VerificationsPage = () => {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVerification, setSelectedVerification] = useState<any>(null);

  useEffect(() => {
    loadVerifications();
  }, [searchQuery]);

  const loadVerifications = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/verifications/`).catch(() => null);
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
    } catch (error) {
      console.error('Error approving verification:', error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.patch(`/verifications/${id}`, { status: 'rejected' }).catch(() => null);
      loadVerifications();
    } catch (error) {
      console.error('Error rejecting verification:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin-dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Verifications</h1>
            <p className="text-gray-500 mt-1">Review and approve user verifications</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search verifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6cd4ff]"
          />
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-3xl font-black text-gray-900">{verifications.length}</p>
            <p className="text-sm text-gray-500 mt-2">Total Requests</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-3xl font-black text-green-600">{verifications.filter(v => v.status === 'approved').length}</p>
            <p className="text-sm text-gray-500 mt-2">Approved</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-3xl font-black text-yellow-600">{verifications.filter(v => v.status === 'pending').length}</p>
            <p className="text-sm text-gray-500 mt-2">Pending</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">USER</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">TIER</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">DOCUMENT TYPE</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">ADMIN.MATCHSCORE</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">SUBMITTED</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">STATUS</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No verifications found</td></tr>
                  ) : (
                    verifications.map((v) => (
                      <tr key={v.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#e0f7ff] flex items-center justify-center text-xs text-[#5bc0e8] font-bold">
                              {(v.user?.full_name || v.full_name || v.user_name || '?')?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{v.user?.full_name || v.full_name || v.user_name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{v.user?.phone || v.phone || v.user_phone || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                            {v.tier || v.user?.verified_level || v.verified_level || v.verification_level || 'STANDARD'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{v.document_type || v.id_type || '-'}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-red-600">{v.facial_match_score || v.match_score || v.admin_score ? `${v.facial_match_score || v.match_score || v.admin_score}%` : '0%'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{v.created_at ? new Date(v.created_at).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            v.status === 'approved' ? 'bg-green-100 text-green-700' :
                            v.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {v.status === 'approved' ? 'Approved' : v.status === 'pending' ? 'Pending' : 'Rejected'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setSelectedVerification(v)} className="p-1.5 hover:bg-blue-50 rounded transition-colors" title="View">
                              <Eye className="w-4 h-4 text-[#5bc0e8]" />
                            </button>
                            {(v.status === 'pending' || v.status === 'rejected') && (
                              <>
                                {v.status === 'pending' && <button onClick={() => handleApprove(v.id)} className="px-3 py-1 rounded text-xs font-bold bg-green-100 text-green-700 hover:bg-green-200">Approve</button>}
                                <button onClick={() => handleReject(v.id)} className="px-3 py-1 rounded text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200">{v.status === 'rejected' ? 'Already Rejected' : 'Reject'}</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Verification Request #{selectedVerification.id}</h2>
              <button onClick={() => setSelectedVerification(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-4">USER INFORMATION</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Full Name</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedVerification.user?.full_name || selectedVerification.full_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Phone</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedVerification.user?.phone || selectedVerification.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Email</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedVerification.user?.email || selectedVerification.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Verification Level</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedVerification.tier || selectedVerification.user?.verified_level || 'STANDARD'}</p>
                  </div>
                </div>
              </div>

              {/* Verification Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-4">VERIFICATION INFORMATION</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Document Type</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedVerification.document_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Status</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block mt-1 ${
                      selectedVerification.status === 'approved' ? 'bg-green-100 text-green-700' :
                      selectedVerification.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {selectedVerification.status === 'approved' ? 'Approved' : selectedVerification.status === 'pending' ? 'Pending' : 'Rejected'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Match Score</p>
                    <p className="text-sm text-red-600 font-bold mt-1">{selectedVerification.facial_match_score || selectedVerification.match_score || 0}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Submitted Date</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedVerification.created_at ? new Date(selectedVerification.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Documents and Images */}
              {(() => {
                const allDocs: any[] = [];

                // Correct field names from VerificationRequest interface
                if (selectedVerification.selfie_url) allDocs.push({ url: selectedVerification.selfie_url, label: 'Selfie', type: 'image' });
                if (selectedVerification.proof_of_address_url) allDocs.push({ url: selectedVerification.proof_of_address_url, label: 'Proof of Address', type: 'image' });
                if (selectedVerification.video_selfie_url) allDocs.push({ url: selectedVerification.video_selfie_url, label: 'Video Selfie', type: 'video' });

                // Document URLs array (main field)
                if (selectedVerification.document_urls && Array.isArray(selectedVerification.document_urls)) {
                  selectedVerification.document_urls.forEach((url: string, idx: number) => {
                    if (url) {
                      const isPdf = url.toLowerCase().endsWith('.pdf');
                      allDocs.push({ url, label: `Document ${idx + 1}`, type: isPdf ? 'pdf' : 'image' });
                    }
                  });
                }

                // Remove duplicates
                const uniqueDocs = Array.from(new Map(allDocs.map(d => [d.url, d])).values());

                return uniqueDocs.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-4">DOCUMENTS & IMAGES ({uniqueDocs.length})</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {uniqueDocs.map((doc, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                          <p className="text-xs text-gray-600 font-semibold px-4 py-2 bg-gray-50 border-b">{doc.label}</p>
                          {doc.type === 'pdf' ? (
                            <div className="bg-white p-6 flex flex-col items-center justify-center gap-4">
                              <div className="text-4xl text-red-600">📄</div>
                              <p className="text-sm text-gray-600">PDF Document</p>
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[#5bc0e8] text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
                                View PDF
                              </a>
                            </div>
                          ) : doc.type === 'video' ? (
                            <div className="bg-white p-6">
                              <video src={doc.url} controls className="w-full rounded-lg max-h-96" />
                            </div>
                          ) : (
                            <img src={doc.url} alt={doc.label} className="w-full rounded-none border-0 max-h-96 object-contain bg-gray-50" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">No documents or images uploaded</p>
                  </div>
                );
              })()}

              {/* ID Number */}
              {selectedVerification.id_number && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-blue-900 mb-2">ID NUMBER</h3>
                  <p className="text-lg font-bold text-[#5bc0e8]">{selectedVerification.id_number}</p>
                </div>
              )}

              {/* Admin Notes */}
              {selectedVerification.notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-blue-900 mb-2">ADMIN NOTES</h3>
                  <p className="text-sm text-blue-800">{selectedVerification.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {selectedVerification.status === 'pending' && (
                  <>
                    <button onClick={() => { handleApprove(selectedVerification.id); setSelectedVerification(null); }} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
                      Approve
                    </button>
                    <button onClick={() => { handleReject(selectedVerification.id); setSelectedVerification(null); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">
                      Reject
                    </button>
                  </>
                )}
                {selectedVerification.status === 'rejected' && (
                  <button onClick={() => { handleApprove(selectedVerification.id); setSelectedVerification(null); }} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
                    Approve Anyway
                  </button>
                )}
                {selectedVerification.status === 'approved' && (
                  <div className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-center">
                    ✓ Already Approved
                  </div>
                )}
                <button onClick={() => setSelectedVerification(null)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationsPage;
