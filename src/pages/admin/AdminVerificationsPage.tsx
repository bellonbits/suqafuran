import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck, CheckCircle, XCircle, Eye,
  FileText, X, User, Shield, Camera, ZoomIn
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/dashboard/PageHeader';
import { BoardTable, type Column } from '../../components/dashboard/BoardTable';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { ConfirmDialog } from '../../components/dashboard/ConfirmDialog';
import { getImageUrl } from '../../utils/imageUtils';

export const AdminVerificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('pending');
  const [previewRequest, setPreviewRequest] = useState<any | null>(null);
  const [actionTarget, setActionTarget] = useState<{ id: number; action: 'approve' | 'reject'; name: string } | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-verifications-full'],
    queryFn: adminService.getVerificationRequests,
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminService.moderateVerification(id, status),
    onSuccess: (_, variables) => {
      toast.success(`Verification ${variables.status === 'approved' ? 'approved' : 'rejected'}`);
      queryClient.invalidateQueries({ queryKey: ['admin-verifications-full'] });
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setActionTarget(null);
      if (previewRequest?.id === variables.id) setPreviewRequest(null);
    },
    onError: () => toast.error('Failed to update verification status'),
  });

  const columns: Column<any>[] = [
    {
      key: 'user',
      header: 'Seller',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 font-bold flex items-center justify-center text-xs shrink-0">
            {item.user?.full_name?.[0] || 'U'}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 truncate">{item.user?.full_name || `User #${item.user_id}`}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{item.user?.phone || 'No phone'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'document_type',
      header: 'Document Type',
      render: (item) => (
        <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
          {item.document_type || item.verification_type || 'National ID'}
        </span>
      ),
    },
    {
      key: 'tier',
      header: 'Level',
      render: (item) => (
        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
          {item.tier || 'Tier 2'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status || 'pending'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setPreviewRequest(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
            title="Inspect document & selfie"
          >
            <Eye className="w-4 h-4" />
          </button>

          {item.status === 'pending' && (
            <>
              <button
                onClick={() => setActionTarget({ id: item.id, action: 'approve', name: item.user?.full_name || 'Seller' })}
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                title="Approve"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActionTarget({ id: item.id, action: 'reject', name: item.user?.full_name || 'Seller' })}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const filteredRequests = requests.filter((r: any) => {
    if (!filter) return true;
    return r.status === filter;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seller Verification Queue"
        subtitle="Review government IDs, proof of address, and selfies to grant verified seller status."
        breadcrumbs={[
          { label: 'Admin Console', path: '/admin-dashboard' },
          { label: 'Verifications' },
        ]}
      />

      <BoardTable
        columns={columns}
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        searchable={true}
        searchPlaceholder="Search by name, phone, or ID number..."
        searchFilter={(item, query) => {
          const name = (item.user?.full_name || '').toLowerCase();
          const phone = (item.user?.phone || '').toLowerCase();
          const idNum = (item.id_number || '').toLowerCase();
          return name.includes(query) || phone.includes(query) || idNum.includes(query);
        }}
        filterTabs={[
          { id: '', label: 'All', count: requests.length },
          { id: 'pending', label: 'Pending', count: requests.filter((r: any) => r.status === 'pending').length },
          { id: 'approved', label: 'Approved', count: requests.filter((r: any) => r.status === 'approved').length },
          { id: 'rejected', label: 'Rejected', count: requests.filter((r: any) => r.status === 'rejected').length },
        ]}
        activeFilter={filter}
        onFilterChange={setFilter}
        pageSize={12}
        emptyTitle="No verification requests in this tab"
        emptySubtitle="New seller identity submissions will appear here automatically."
      />

      {/* ── Document Preview Modal ──────────────────────────────────── */}
      {previewRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Verification Dossier: {previewRequest.user?.full_name || `User #${previewRequest.user_id}`}
                </h3>
                <p className="text-xs text-slate-500">
                  Document: {previewRequest.document_type || 'National ID'} · Number: {previewRequest.id_number || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setPreviewRequest(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Images: Document & Selfie */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Identity Document
                </span>
                <div className="aspect-[4/3] rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                  {previewRequest.document_urls && previewRequest.document_urls[0] ? (
                    <img
                      src={getImageUrl(previewRequest.document_urls[0])}
                      alt="ID Document"
                      className="w-full h-full object-contain cursor-zoom-in"
                      onClick={() => window.open(getImageUrl(previewRequest.document_urls[0]), '_blank')}
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-1" />
                      <span className="text-xs">No document attached</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Verification Selfie
                </span>
                <div className="aspect-[4/3] rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                  {previewRequest.selfie_url ? (
                    <img
                      src={getImageUrl(previewRequest.selfie_url)}
                      alt="Selfie"
                      className="w-full h-full object-contain cursor-zoom-in"
                      onClick={() => window.open(getImageUrl(previewRequest.selfie_url), '_blank')}
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <Camera className="w-8 h-8 mx-auto mb-1" />
                      <span className="text-xs">No selfie attached</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setPreviewRequest(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => moderateMutation.mutate({ id: previewRequest.id, status: 'rejected' })}
                disabled={moderateMutation.isPending}
                className="px-4 py-2 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl"
              >
                Reject Application
              </button>
              <button
                onClick={() => moderateMutation.mutate({ id: previewRequest.id, status: 'approved' })}
                disabled={moderateMutation.isPending}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
              >
                Approve Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal ─────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!actionTarget}
        onClose={() => setActionTarget(null)}
        onConfirm={() => {
          if (!actionTarget) return;
          moderateMutation.mutate({
            id: actionTarget.id,
            status: actionTarget.action === 'approve' ? 'approved' : 'rejected',
          });
        }}
        title={actionTarget?.action === 'approve' ? 'Approve Seller Verification?' : 'Reject Verification?'}
        description={
          actionTarget?.action === 'approve'
            ? `Grant verified seller badge to ${actionTarget?.name}. They will be marked as a trusted merchant on Suqafuran.`
            : `Reject document verification for ${actionTarget?.name}. They can submit updated documents again.`
        }
        confirmLabel={actionTarget?.action === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
        tone={actionTarget?.action === 'approve' ? 'success' : 'danger'}
        isLoading={moderateMutation.isPending}
      />
    </div>
  );
};

export default AdminVerificationsPage;
