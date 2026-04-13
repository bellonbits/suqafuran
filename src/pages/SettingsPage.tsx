import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import {
    User, Mail, Phone, Lock,
    Camera, Shield, Bell, CheckCircle,
    Loader2, XCircle, Edit3, Trash2
} from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { cn } from '../utils/cn';
import { getAvatarUrl } from '../utils/imageUtils';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Globe } from 'lucide-react';

const SettingsPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, setUser } = useAuthStore();
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        email_notifications: user?.email_notifications ?? true,
        sms_notifications: user?.sms_notifications ?? false,
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    React.useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                phone: user.phone || '',
                email_notifications: !!user.email_notifications,
                sms_notifications: !!user.sms_notifications,
            });
        }
    }, [user]);

    const updateMutation = useMutation({
        mutationFn: (data: any) => authService.updateUser(data),
        onSuccess: (updatedUser) => {
            setUser(updatedUser as any);
            setSuccess(true);
            setError(null);
            setTimeout(() => setSuccess(false), 3000);
        },
        onError: (err: any) => {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : Array.isArray(detail) ? detail[0]?.msg : 'Update failed');
        }
    });

    const handleToggleNotifications = (field: 'email_notifications' | 'sms_notifications') => {
        const newValue = !formData[field];
        setFormData({ ...formData, [field]: newValue });
        updateMutation.mutate({ [field]: newValue });
    };

    const avatarMutation = useMutation({
        mutationFn: (file: File) => authService.uploadAvatar(file),
        onSuccess: (updatedUser) => {
            setUser(updatedUser as any);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        },
    });

    const passwordMutation = useMutation({
        mutationFn: (data: any) => authService.changePassword(data),
        onSuccess: () => {
            setSuccess(true);
            setError(null);
            setIsPasswordModalOpen(false);
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            setTimeout(() => setSuccess(false), 3000);
        },
        onError: (err: any) => {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : Array.isArray(detail) ? detail[0]?.msg : 'Password change failed');
        }
    });

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) avatarMutation.mutate(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            setError(t('auth.passwordMismatch'));
            return;
        }
        passwordMutation.mutate({
            current_password: passwordData.current_password,
            new_password: passwordData.new_password,
        });
    };

    const initials = user?.full_name
        ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    return (
        <>
            {/* Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden mb-8 h-36 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400">
                <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/10 to-transparent" />
            </div>

            {/* Profile Card floating over banner */}
            <div className="relative -mt-20 mb-8 mx-2">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 flex flex-col sm:flex-row items-center sm:items-end gap-4">
                    {/* Avatar */}
                    <div className="relative -mt-16 sm:-mt-12 flex-shrink-0">
                        <div className="w-28 h-28 rounded-2xl ring-4 ring-white shadow-lg overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                            {user?.avatar_url ? (
                                <img
                                    src={getAvatarUrl(user.avatar_url) || ''}
                                    alt={user.full_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-white text-3xl font-bold">{initials}</span>
                            )}
                            {avatarMutation.isPending && (
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleAvatarClick}
                            className="absolute -bottom-2 -right-2 p-2 bg-primary-600 text-white rounded-xl shadow-lg hover:bg-primary-700 transition-all hover:scale-110"
                        >
                            <Camera className="h-3.5 w-3.5" />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>

                    {/* Name & meta */}
                    <div className="flex-1 text-center sm:text-left pb-1">
                        <h2 className="text-xl font-bold text-gray-900">{user?.full_name || t('settings.yourName')}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
                        <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                {t('settings.activeMember')}
                            </span>
                        </div>
                    </div>

                    {/* Edit hint */}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 pb-1">
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>{t('settings.editBelow')}</span>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: forms */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Success/Error banners */}
                    {success && (
                        <div className="flex items-center gap-2.5 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm font-semibold">
                            <CheckCircle className="h-5 w-5 flex-shrink-0" />
                            {t('settings.savedSuccess')}
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center gap-2.5 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-semibold">
                            <XCircle className="h-5 w-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Personal Info Form */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-5 border-b border-gray-50 flex items-center gap-3">
                            <div className="p-2 bg-primary-50 rounded-xl">
                                <User className="h-4 w-4 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">{t('settings.personalInfo')}</h3>
                                <p className="text-xs text-gray-400">{t('settings.personalInfoDesc')}</p>
                            </div>
                        </div>

                        <div className="p-8 space-y-5">
                            <div className="grid md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">{t('settings.fullName')}</label>
                                    <Input
                                        className="rounded-xl"
                                        icon={<User className="h-4 w-4" />}
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder={t('settings.yourFullName')}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">{t('settings.emailAddress')}</label>
                                    <Input
                                        className="rounded-xl bg-gray-50 text-gray-400"
                                        icon={<Mail className="h-4 w-4" />}
                                        value={formData.email}
                                        disabled
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">{t('settings.phoneNumber')}</label>
                                    <Input
                                        className="rounded-xl"
                                        icon={<Phone className="h-4 w-4" />}
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+254 700 000 000"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 bg-gray-50/70 flex items-center justify-end border-t border-gray-100">
                            <Button
                                type="submit"
                                className="rounded-xl px-8 gap-2"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                {t('settings.saveChanges')}
                            </Button>
                        </div>
                    </form>

                    {/* Security */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-5 border-b border-gray-50 flex items-center gap-3">
                            <div className="p-2 bg-red-50 rounded-xl">
                                <Lock className="h-4 w-4 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">{t('settings.security')}</h3>
                                <p className="text-xs text-gray-400">{t('settings.securityDesc')}</p>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                <div>
                                    <p className="font-bold text-sm text-gray-900">{t('settings.password')}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{t('settings.lastChanged')}</p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="rounded-xl text-sm font-semibold border-2"
                                    onClick={() => { setError(null); setIsPasswordModalOpen(true); }}
                                >
                                    {t('settings.changePassword')}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Delete Account */}
                    <div className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-5 border-b border-red-50 flex items-center gap-3">
                            <div className="p-2 bg-red-50 rounded-xl">
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">{t('settings.deleteAccountTitle')}</h3>
                                <p className="text-xs text-gray-400">{t('settings.deleteAccountSubtitle')}</p>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="flex items-center justify-between p-5 bg-red-50 rounded-2xl border border-red-100">
                                <div>
                                    <p className="font-bold text-sm text-red-800">{t('settings.deleteAccountDangerZone')}</p>
                                    <p className="text-xs text-red-500 mt-0.5">{t('settings.deleteAccountDangerDesc')}</p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="rounded-xl text-sm font-semibold border-2 border-red-300 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600"
                                    onClick={() => navigate('/delete-account')}
                                >
                                    {t('settings.deleteAccountBtn')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-6">
                    {/* Safety tip */}
                    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-7 text-white relative overflow-hidden shadow-lg shadow-primary-200">
                        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
                        <div className="absolute -top-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />
                        <Shield className="h-8 w-8 mb-4 text-primary-200" />
                        <h4 className="text-base font-bold mb-2">{t('settings.staySafe')}</h4>
                        <p className="text-primary-100 text-sm leading-relaxed">
                            {t('settings.staySafeDesc')}
                        </p>
                    </div>

                    {/* App Language */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-50 rounded-xl">
                                    <Globe className="h-4 w-4 text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">{t('settings.language', 'App Language')}</h3>
                                    <p className="text-xs text-gray-400">{t('settings.languageDesc', 'Choose your preferred language')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <LanguageSwitcher variant="list" />
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
                            <div className="p-2 bg-amber-50 rounded-xl">
                                <Bell className="h-4 w-4 text-amber-500" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">{t('settings.notificationsTitle')}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {[
                                { key: 'email_notifications' as const, label: t('settings.emailNotifications'), desc: t('settings.emailNotificationsDesc') },
                                { key: 'sms_notifications' as const, label: t('settings.smsAlerts'), desc: t('settings.smsAlertsDesc') },
                            ].map(({ key, label, desc }) => (
                                <div key={key} className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{label}</p>
                                        <p className="text-xs text-gray-400">{desc}</p>
                                    </div>
                                    <button
                                        onClick={() => handleToggleNotifications(key)}
                                        className={cn(
                                            "relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-300",
                                            formData[key] ? "bg-primary-600" : "bg-gray-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300",
                                            formData[key] ? "translate-x-5" : "translate-x-0"
                                        )} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 rounded-xl">
                                    <Lock className="h-4 w-4 text-red-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">{t('settings.changePasswordTitle')}</h3>
                            </div>
                            <button
                                onClick={() => { setIsPasswordModalOpen(false); setError(null); }}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>

                        {error && (
                            <div className="mx-6 mt-5 flex items-center gap-2 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                                <XCircle className="h-4 w-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                            {[
                                { label: t('settings.currentPassword'), key: 'current_password' as const },
                                { label: t('settings.newPassword'), key: 'new_password' as const },
                                { label: t('settings.confirmNewPassword'), key: 'confirm_password' as const },
                            ].map(({ label, key }) => (
                                <div key={key} className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">{label}</label>
                                    <Input
                                        type="password"
                                        className="rounded-xl"
                                        value={passwordData[key]}
                                        onChange={(e) => setPasswordData({ ...passwordData, [key]: e.target.value })}
                                        required
                                    />
                                </div>
                            ))}
                            <div className="pt-2 flex gap-3">
                                <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => { setIsPasswordModalOpen(false); setError(null); }}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" className="flex-1 rounded-xl" disabled={passwordMutation.isPending}>
                                    {passwordMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    {t('settings.update')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export { SettingsPage };
