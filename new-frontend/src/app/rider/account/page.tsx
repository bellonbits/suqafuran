"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { riderService } from '@/services/riderService';
import '../common-pages.css';

export default function RiderAccount() {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({});

    const { data: profile, isLoading, refetch } = useQuery({
        queryKey: ['riderProfile'],
        queryFn: riderService.getProfile
    });

    const { data: documentsData } = useQuery({
        queryKey: ['documentsExpiry'],
        queryFn: riderService.getDocumentsExpiry
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => riderService.updateProfile(data),
        onSuccess: () => {
            alert('Profile updated successfully');
            setIsEditing(false);
            refetch();
        },
        onError: (error: any) => {
            alert(`Error: ${error.response?.data?.detail || 'Failed to update profile'}`);
        }
    });

    useEffect(() => {
        if (profile) {
            setFormData(profile);
        }
    }, [profile]);

    const handleSaveProfile = () => {
        updateMutation.mutate({
            bank_account: formData.bank_account,
            bank_name: formData.bank_name,
            mpesa_number: formData.mpesa_number
        });
    };

    const maskAccount = (account: string) => {
        if (!account) return '';
        return account.substring(0, 2) + '*'.repeat(account.length - 4) + account.substring(account.length - 2);
    };

    if (isLoading) {
        return <div className="loading" style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;
    }

    return (
        <div className="common-page">
            <header className="page-header">
                <h1>Account Settings</h1>
                <p>Manage your profile and preferences</p>
            </header>

            <div className="profile-section">
                <div className="section-header">
                    <h2>Personal Information</h2>
                    {!isEditing && (
                        <button className="edit-btn" onClick={() => setIsEditing(true)}>
                            Edit
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <form className="profile-form">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={formData.phone || ''}
                                disabled
                                placeholder="Name"
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                value={formData.phone || ''}
                                disabled
                                placeholder="Phone"
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="submit-btn"
                                onClick={handleSaveProfile}
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="profile-info">
                        <div className="info-row">
                            <label>Phone Number</label>
                            <p>{profile?.phone}</p>
                        </div>
                        <div className="info-row">
                            <label>Is Verified</label>
                            <p>{profile?.is_verified ? '✓ Yes' : '✗ No'}</p>
                        </div>
                        <div className="info-row">
                            <label>Joined</label>
                            <p>{new Date(profile?.created_at || '').toLocaleDateString()}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="vehicle-section">
                <h2>Vehicle Information</h2>
                <div className="profile-info">
                    <div className="info-row">
                        <label>Vehicle Type</label>
                        <p>{profile?.vehicle_type || 'Not specified'}</p>
                    </div>
                    <div className="info-row">
                        <label>Vehicle Plate</label>
                        <p>{profile?.vehicle_plate || 'Not specified'}</p>
                    </div>
                </div>
            </div>

            <div className="banking-section">
                <div className="section-header">
                    <h2>Banking Information</h2>
                    {!isEditing && (
                        <button className="edit-btn" onClick={() => setIsEditing(true)}>
                            Edit
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <form className="profile-form">
                        <div className="form-group">
                            <label>M-Pesa Number</label>
                            <input
                                type="tel"
                                value={formData.mpesa_number || ''}
                                onChange={(e) =>
                                    setFormData({ ...formData, mpesa_number: e.target.value })
                                }
                                placeholder="0712345678"
                            />
                        </div>

                        <div className="form-group">
                            <label>Bank Account (Masked)</label>
                            <input
                                type="text"
                                value={maskAccount(formData.bank_account || '')}
                                disabled
                                placeholder="Account will be masked"
                            />
                        </div>

                        <div className="form-group">
                            <label>Bank Name</label>
                            <input
                                type="text"
                                value={formData.bank_name || ''}
                                onChange={(e) =>
                                    setFormData({ ...formData, bank_name: e.target.value })
                                }
                                placeholder="Your bank name"
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="submit-btn"
                                onClick={handleSaveProfile}
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="profile-info">
                        <div className="info-row">
                            <label>M-Pesa Number</label>
                            <p>{profile?.mpesa_number || 'Not set'}</p>
                        </div>
                        <div className="info-row">
                            <label>M-Pesa Verified</label>
                            <p>{profile?.mpesa_verified ? '✓ Yes' : '✗ No'}</p>
                        </div>
                        <div className="info-row">
                            <label>Bank Account</label>
                            <p>{maskAccount(profile?.bank_account || '') || 'Not set'}</p>
                        </div>
                        <div className="info-row">
                            <label>Bank Name</label>
                            <p>{profile?.bank_name || 'Not set'}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="documents-section">
                <h2>Document Status</h2>
                {documentsData && documentsData.documents.map((doc: any, idx: number) => (
                    <div key={idx} className={`document-item ${doc.status}`}>
                        <div className="doc-info">
                            <div className="doc-header">
                                <h4>{doc.name}</h4>
                                <span className={`status-badge ${doc.status}`}>
                                    {doc.status === 'valid' ? '✓ Valid' : doc.status === 'expired' ? '✗ Expired' : doc.status === 'expiring_soon' ? '⚠️ Expiring Soon' : '⚪ Not Uploaded'}
                                </span>
                            </div>
                            {doc.alert && (
                                <p className="doc-alert">{doc.alert}</p>
                            )}
                        </div>
                        {doc.expiry_date && (
                            <div className="doc-expiry">
                                Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                ))}
                {documentsData?.has_alerts && (
                    <div className="alert-banner">
                        ⚠️ Some documents need attention. Please update them to continue delivering.
                    </div>
                )}
            </div>

            <div className="preferences-section">
                <h2>Notification Preferences</h2>
                <div className="preference-group">
                    <label className="preference-item">
                        <input type="checkbox" defaultChecked />
                        <span>Delivery notifications</span>
                    </label>
                    <label className="preference-item">
                        <input type="checkbox" defaultChecked />
                        <span>Earnings notifications</span>
                    </label>
                    <label className="preference-item">
                        <input type="checkbox" defaultChecked />
                        <span>Withdrawal updates</span>
                    </label>
                    <label className="preference-item">
                        <input type="checkbox" defaultChecked />
                        <span>Promotional messages</span>
                    </label>
                </div>
            </div>

            <div className="support-section">
                <h2>Help & Support</h2>
                <div className="support-links">
                    <a href="/help" className="support-link">
                        Help Center
                    </a>
                    <a href="/contact" className="support-link">
                        Contact Support
                    </a>
                    <a href="/terms" className="support-link">
                        Terms of Service
                    </a>
                </div>
            </div>
        </div>
    );
}
