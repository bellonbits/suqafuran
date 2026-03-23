import React, { useState } from 'react';
import { PublicLayout } from '../layouts/PublicLayout';
import { Trash2, AlertTriangle, CheckCircle, Mail } from 'lucide-react';

export const DeleteAccountPage: React.FC = () => {
    const [submitted, setSubmitted] = useState(false);
    const [email, setEmail] = useState('');
    const [reason, setReason] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Opens a mailto with prefilled subject/body
        const subject = encodeURIComponent('Account Deletion Request — Suqafuran');
        const body = encodeURIComponent(
            `Hello Suqafuran Support,\n\nI would like to request the deletion of my account.\n\nEmail address: ${email}\nReason: ${reason || 'Not specified'}\n\nPlease delete my account and all associated data including:\n- Profile information\n- Listings and photos\n- Messages\n- Transaction history\n\nThank you.`
        );
        window.location.href = `mailto:support@suqafuran.com?subject=${subject}&body=${body}`;
        setSubmitted(true);
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
                    Request Account Deletion
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 10, fontSize: 14, maxWidth: 520, margin: '10px auto 0' }}>
                    You can request deletion of your Suqafuran account and all associated personal data at any time.
                </p>
            </div>

            <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px' }}>

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
                        <strong style={{ fontSize: 15, color: '#9a3412' }}>What will be deleted</strong>
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
                    <strong>Data retention:</strong> After we receive your request, your account will be deactivated immediately
                    and permanently deleted within <strong>30 days</strong>. Some anonymised transaction logs may be retained
                    for up to <strong>90 days</strong> for legal and fraud-prevention purposes, after which they are also purged.
                </div>

                {submitted ? (
                    <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: 16,
                        padding: '32px 24px',
                        textAlign: 'center',
                    }}>
                        <CheckCircle size={48} color="#16a34a" style={{ marginBottom: 16 }} />
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#15803d', margin: '0 0 8px' }}>
                            Request Submitted
                        </h3>
                        <p style={{ fontSize: 14, color: '#166534', margin: 0, lineHeight: 1.6 }}>
                            Your deletion request email has been prepared. Please send it from your registered email address.
                            We will process your request within <strong>7 business days</strong> and send a confirmation.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                                Your registered email address *
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                style={{
                                    width: '100%',
                                    padding: '11px 14px',
                                    borderRadius: 10,
                                    border: '1.5px solid #d1d5db',
                                    fontSize: 14,
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 28 }}>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                                Reason for deletion (optional)
                            </label>
                            <textarea
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="Tell us why you're leaving (optional)..."
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '11px 14px',
                                    borderRadius: 10,
                                    border: '1.5px solid #d1d5db',
                                    fontSize: 14,
                                    outline: 'none',
                                    resize: 'vertical',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: '#dc2626',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: 15,
                                border: 'none',
                                borderRadius: 12,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                            }}
                        >
                            <Trash2 size={18} />
                            Submit Deletion Request
                        </button>
                    </form>
                )}

                {/* Alternative method */}
                <div style={{
                    marginTop: 32,
                    padding: '18px 20px',
                    background: '#f8fafc',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    textAlign: 'center',
                }}>
                    <Mail size={20} color="#64748b" style={{ marginBottom: 8 }} />
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                        You can also email us directly at{' '}
                        <a href="mailto:support@suqafuran.com" style={{ color: '#0ea5e9', fontWeight: 600 }}>
                            support@suqafuran.com
                        </a>{' '}
                        with the subject <em>"Account Deletion Request"</em>.
                    </p>
                </div>
            </div>
        </PublicLayout>
    );
};

export default DeleteAccountPage;
