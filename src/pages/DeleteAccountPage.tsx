import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PublicLayout } from '../layouts/PublicLayout';
import { Trash2, AlertTriangle, CheckCircle, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export const DeleteAccountPage: React.FC = () => {
    const { t } = useTranslation();
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
            setError(t('settings.deleteAccountError'));
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
                    {t('settings.deleteAccountTitle')}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 10, fontSize: 14, maxWidth: 520, margin: '10px auto 0' }}>
                    {t('settings.deleteAccountSubtitle')}
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
                            {t('settings.deleteAccountSuccess')}
                        </h3>
                        <p style={{ fontSize: 14, color: '#166534', margin: '0 0 20px', lineHeight: 1.6 }}>
                            {t('settings.deleteAccountSuccessDesc')}
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
                            {t('settings.deleteAccountGoHome')}
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
                        <LogIn size={40} color="var(--color-primary-500)" style={{ marginBottom: 16 }} />
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1d4ed8', margin: '0 0 8px' }}>
                            {t('settings.deleteAccountSignInRequired')}
                        </h3>
                        <p style={{ fontSize: 14, color: '#1e40af', margin: '0 0 20px', lineHeight: 1.6 }}>
                            {t('settings.deleteAccountSignInDesc')}
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                padding: '10px 24px',
                                background: 'var(--color-primary-500)',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: 14,
                                border: 'none',
                                borderRadius: 10,
                                cursor: 'pointer',
                            }}
                        >
                            {t('settings.deleteAccountSignIn')}
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
                                <strong style={{ fontSize: 15, color: '#9a3412' }}>{t('settings.deleteAccountWillDelete')}</strong>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {(['deleteAccountItem1', 'deleteAccountItem2', 'deleteAccountItem3', 'deleteAccountItem4', 'deleteAccountItem5'] as const).map((key) => (
                                    <li key={key} style={{ display: 'flex', gap: 8, fontSize: 14, color: '#7c2d12', lineHeight: 1.55 }}>
                                        <span style={{ color: '#ea580c', flexShrink: 0 }}>✕</span> {t(`settings.${key}`)}
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
                            <strong>{t('settings.deleteAccountRetention')}</strong>{' '}
                            {t('settings.deleteAccountRetentionDesc')}{' '}
                            <strong>{t('settings.deleteAccountRetentionDays')}</strong>{' '}
                            {t('settings.deleteAccountRetentionReason')}
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
                                    {t('settings.deleteAccountConfirmCheck')}{' '}
                                    <strong>{t('settings.deleteAccountConfirmBold')}</strong>
                                    {t('settings.deleteAccountConfirmEnd')}
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
                                {isDeleting ? t('settings.deleteAccountDeleting') : t('settings.deleteAccountConfirmBtn')}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </PublicLayout>
    );
};

export default DeleteAccountPage;
