"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { riderService } from '@/services/riderService';
import '../common-pages.css';

export default function RiderWithdrawals() {
    const [showModal, setShowModal] = useState(false);
    const [withdrawalData, setWithdrawalData] = useState<{
        amount: number;
        method: 'mpesa' | 'bank';
    }>({
        amount: 500,
        method: 'mpesa'
    });

    const { data: historyData, isLoading: historyLoading, refetch } = useQuery({
        queryKey: ['withdrawalHistory'],
        queryFn: () => riderService.getWithdrawalHistory(1, 20)
    });

    const withdrawalMutation = useMutation({
        mutationFn: (data: typeof withdrawalData) =>
            riderService.requestWithdrawal(data.amount, data.method),
        onSuccess: () => {
            alert('Withdrawal request submitted successfully');
            setShowModal(false);
            setWithdrawalData({ amount: 500, method: 'mpesa' });
            refetch();
        },
        onError: (error: any) => {
            alert(`Error: ${error.response?.data?.detail || 'Failed to submit withdrawal'}`);
        }
    });

    const handleSubmitWithdrawal = (e: React.FormEvent) => {
        e.preventDefault();
        if (withdrawalData.amount < 500) {
            alert('Minimum withdrawal amount is KSh 500');
            return;
        }
        if (withdrawalData.amount > (historyData?.available_balance || 0)) {
            alert('Insufficient balance');
            return;
        }
        withdrawalMutation.mutate(withdrawalData);
    };

    return (
        <div className="common-page">
            <header className="page-header">
                <h1>Withdrawals</h1>
                <p>Manage your earnings withdrawals</p>
            </header>

            <div className="balance-section">
                <div className="balance-card main-balance">
                    <h3>Available Balance</h3>
                    <div className="balance-amount">
                        KSh {historyLoading ? '...' : historyData?.available_balance || 0}
                    </div>
                    <p className="balance-meta">Total Earned: KSh {historyData?.total_earned || 0}</p>
                </div>
                <button
                    className="withdraw-btn"
                    onClick={() => setShowModal(true)}
                    disabled={historyLoading || (historyData?.available_balance || 0) < 500}
                >
                    Request Withdrawal
                </button>
            </div>

            <div className="history-section">
                <h2>Withdrawal History</h2>
                <div className="withdrawal-list">
                    {historyLoading ? (
                        <div className="loading">Loading withdrawal history...</div>
                    ) : historyData?.withdrawals.length === 0 ? (
                        <div className="empty-state">No withdrawals yet</div>
                    ) : (
                        historyData?.withdrawals.map((withdrawal) => (
                            <div key={withdrawal.withdrawal_id} className="withdrawal-item">
                                <div className="withdrawal-info">
                                    <h4>
                                        <span className={`status-badge ${withdrawal.status}`}>
                                            {withdrawal.status}
                                        </span>
                                        {withdrawal.method.toUpperCase()}
                                    </h4>
                                    <p className="withdrawal-meta">
                                        Requested: {new Date(withdrawal.requested_date).toLocaleDateString()}
                                        {withdrawal.completed_date && (
                                            <> • Completed: {new Date(withdrawal.completed_date).toLocaleDateString()}</>
                                        )}
                                    </p>
                                    {withdrawal.transaction_id && (
                                        <p className="transaction-id">ID: {withdrawal.transaction_id}</p>
                                    )}
                                    {withdrawal.reason_rejected && (
                                        <p className="rejection-reason">Reason: {withdrawal.reason_rejected}</p>
                                    )}
                                </div>
                                <div className="withdrawal-amount">
                                    KSh {withdrawal.amount.toFixed(0)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Request Withdrawal</h2>

                        <form onSubmit={handleSubmitWithdrawal}>
                            <div className="form-group">
                                <label>Withdrawal Amount (KSh)</label>
                                <input
                                    type="number"
                                    min="500"
                                    max={historyData?.available_balance}
                                    value={withdrawalData.amount}
                                    onChange={(e) =>
                                        setWithdrawalData({
                                            ...withdrawalData,
                                            amount: parseInt(e.target.value) || 500
                                        })
                                    }
                                    placeholder="Enter amount"
                                />
                                <p className="input-hint">
                                    Minimum: KSh 500 • Available: KSh {historyData?.available_balance || 0}
                                </p>
                            </div>

                            <div className="form-group">
                                <label>Withdrawal Method</label>
                                <div className="method-options">
                                    <label className="method-option">
                                        <input
                                            type="radio"
                                            name="method"
                                            value="mpesa"
                                            checked={withdrawalData.method === 'mpesa'}
                                            onChange={(e) =>
                                                setWithdrawalData({
                                                    ...withdrawalData,
                                                    method: 'mpesa'
                                                })
                                            }
                                        />
                                        <span>M-Pesa</span>
                                    </label>
                                    <label className="method-option">
                                        <input
                                            type="radio"
                                            name="method"
                                            value="bank"
                                            checked={withdrawalData.method === 'bank'}
                                            onChange={(e) =>
                                                setWithdrawalData({
                                                    ...withdrawalData,
                                                    method: 'bank'
                                                })
                                            }
                                        />
                                        <span>Bank Transfer</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={withdrawalMutation.isPending}
                                >
                                    {withdrawalMutation.isPending ? 'Processing...' : 'Request Withdrawal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
