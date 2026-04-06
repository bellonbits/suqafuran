import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { Trash2, AlertTriangle, CheckCircle, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export const DeleteAccountPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, logout } = useAuthStore();
    const [confirmed, setConfirmed] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleted, setDeleted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirmed) return;
        setIsDeleting(true);
        setError(null);
        try {
            await api.delete('/users/me');
            logout();
            setDeleted(true);
        } catch {
            setError('Failed to delete account. Please try again or contact support@suqafuran.com.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <PublicLayout>
            {/* Hero */}
            <div style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                padding: '56px 24px 48px',
                textAlign: 'center',
            }}>
                <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                }}>
                    <Trash2 size={32} color="white" />
                </div>
                <h1 style={{ color: 'white', fontSize: 26, fontWeight: 800, margin: 0 }}>
                    Delete Account
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 10, fontSize: 14, maxWidth: 520, margin: '10px auto 0' }}>
                    Permanently delete your Suqafuran account and all associated data.
                </p>
            </div>

            <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px' }}>

                {deleted ? (
                    <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: 16,
                        padding: '32px 24px',
                        textAlign: 'center',
                    }}>
                        <CheckCircle size={48} color="#16a34a" style={{ marginBottom: 16 }} />
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#15803d', margin: '0 0 8px' }}>
                            Account Deleted
                        </h3>
                        <p style={{ fontSize: 14, color: '#166534', margin: '0 0 20px', lineHeight: 1.6 }}>
                            Your account and all associated data have been permanently deleted.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                padding: '10px 24px',
                                background: '#16a34a',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: 14,
                                border: 'none',
                                borderRadius: 10,
                                cursor: 'pointer',
                            }}
                        >
                            Go to Home
                        </button>
                    </div>
                ) : !isAuthenticated ? (
                    <div style={{
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: 16,
                        padding: '32px 24px',
                        textAlign: 'center',
                    }}>
                        <LogIn size={40} color="#2563eb" style={{ marginBottom: 16 }} />
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1d4ed8', margin: '0 0 8px' }}>
                            Sign in to delete your account
                        </h3>
                        <p style={{ fontSize: 14, color: '#1e40af', margin: '0 0 20px', lineHeight: 1.6 }}>
                            You must be signed in to permanently delete your account.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                padding: '10px 24px',
                                background: '#2563eb',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: 14,
                                border: 'none',
                                borderRadius: 10,
                                cursor: 'pointer',
                            }}
                        >
                            Sign In
                        </button>
                    </div>
                ) : (
                    <>
                        {/* What gets deleted */}
                        <div style={{
                            background: '#fff7ed',
                            border: '1px solid #fed7aa',
                            borderRadius: 12,
                            padding: '18px 20px',
                            marginBottom: 28,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <AlertTriangle size={18} color="#ea580c" />
                                <strong style={{ fontSize: 15, color: '#9a3412' }}>What will be permanently deleted</strong>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                    'Your account profile (name, email, phone number, profile photo)',
                                    'All listings and uploaded product images',
                                    'Your messages and chat history',
                                    'Saved ads and preferences',
                                    'Notification history',
                                ].map((item, i) => (
                                    <li key={i} style={{ display: 'flex', gap: 8, fontSize: 14, color: '#7c2d12', lineHeight: 1.55 }}>
                                        <span style={{ color: '#ea580c', flexShrink: 0 }}>✕</span> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Retention note */}
                        <div style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: 12,
                            padding: '16px 20px',
                            marginBottom: 32,
                            fontSize: 13,
                            color: '#166534',
                            lineHeight: 1.6,
                        }}>
                            <strong>Data retention:</strong> Your account will be permanently deleted immediately.
                            Some anonymised transaction logs may be retained for up to <strong>90 days</strong> for
                            legal and fraud-prevention purposes.
                        </div>

                        {error && (
                            <div style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: 10,
                                padding: '12px 16px',
                                marginBottom: 20,
                                fontSize: 14,
                                color: '#dc2626',
                            }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleDelete}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 28, cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={confirmed}
                                    onChange={e => setConfirmed(e.target.checked)}
                                    style={{ marginTop: 2, width: 16, height: 16, cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                                    I understand this action is <strong>permanent and cannot be undone</strong>. All my data will be deleted immediately.
                                </span>
                            </label>

                            <button
                                type="submit"
                                disabled={!confirmed || isDeleting}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: confirmed ? '#dc2626' : '#9ca3af',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: 15,
                                    border: 'none',
                                    borderRadius: 12,
                                    cursor: confirmed && !isDeleting ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    transition: 'background 0.2s',
                                }}
                            >
                                <Trash2 size={18} />
                                {isDeleting ? 'Deleting account...' : 'Permanently Delete My Account'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </PublicLayout>
    );
};

export default DeleteAccountPage;
