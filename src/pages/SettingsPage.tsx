import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import {
    User, Mail, Phone, Lock,
    Camera, Shield, Bell, CheckCircle,
    Loader2, XCircle
} from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { cn } from '../utils/cn';

const SettingsPage: React.FC = () => {
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

    // Update formData when user state changes (e.g. after initial load)
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

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            avatarMutation.mutate(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            alert("New passwords do not match");
            return;
        }
        passwordMutation.mutate({
            current_password: passwordData.current_password,
            new_password: passwordData.new_password,
        });
    };

    const getAvatarUrl = (url?: string | null) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        return `http://localhost:8888${cleanUrl}`;
    };

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your profile, security and preferences.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Profile Section */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex items-center gap-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
                                    {user?.avatar_url ? (
                                        <img
                                            src={getAvatarUrl(user.avatar_url) || ''}
                                            alt={user.full_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="h-10 w-10 text-primary-600" />
                                    )}
                                    {avatarMutation.isPending && (
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAvatarClick}
                                    className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all"
                                >
                                    <Camera className="h-4 w-4" />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{user?.full_name}</h3>
                                <p className="text-sm text-gray-500">Personal Account</p>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                                    <Input
                                        className="rounded-xl"
                                        icon={<User className="h-4 w-4" />}
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                                    <Input
                                        className="rounded-xl bg-gray-50"
                                        icon={<Mail className="h-4 w-4" />}
                                        value={formData.email}
                                        disabled
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                                    <Input
                                        className="rounded-xl"
                                        icon={<Phone className="h-4 w-4" />}
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {success && (
                                    <div className="flex items-center gap-1.5 text-green-600 font-bold text-sm animate-bounce">
                                        <CheckCircle className="h-4 w-4" />
                                        <span>Changes saved!</span>
                                    </div>
                                )}
                            </div>
                            <Button
                                type="submit"
                                className="rounded-xl px-10 gap-2 shadow-lg hover:shadow-primary-200"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                Update Profile
                            </Button>
                        </div>
                    </form>

                    {/* Password Section */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Lock className="h-5 w-5 text-gray-400" />
                            <h3 className="text-lg font-bold text-gray-900">Security</h3>
                        </div>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl">
                            <div className="space-y-1">
                                <p className="font-bold text-sm text-gray-900">Password</p>
                                <p className="text-xs text-gray-500">Change your account password to keep it secure.</p>
                            </div>
                            <Button
                                variant="outline"
                                className="rounded-xl font-bold border-2"
                                onClick={() => setIsPasswordModalOpen(true)}
                            >
                                Change Password
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6 text-primary-900">
                    <div className="bg-primary-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                        <Shield className="h-24 w-24 absolute -bottom-4 -right-4 opacity-10" />
                        <h4 className="text-xl font-bold mb-2">Safety Tip</h4>
                        <p className="text-primary-100 text-sm leading-relaxed mb-6">Never share your login credentials or OTP with anyone. Suqafuran will never ask for your password via phone or email.</p>
                        <Button variant="secondary" className="w-full rounded-xl font-bold">Security Checklist</Button>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <Bell className="h-5 w-5 text-gray-400" />
                            <h3 className="text-lg font-bold text-gray-900">Preferences</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                                <button
                                    onClick={() => handleToggleNotifications('email_notifications')}
                                    className={cn(
                                        "w-10 h-5 rounded-full flex items-center px-1 transition-colors duration-200",
                                        formData.email_notifications ? "bg-primary-600" : "bg-gray-300"
                                    )}
                                >
                                    <div className={cn(
                                        "w-3 h-3 bg-white rounded-full transition-transform duration-200",
                                        formData.email_notifications ? "translate-x-5" : "translate-x-0"
                                    )}></div>
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">SMS Alerts</span>
                                <button
                                    onClick={() => handleToggleNotifications('sms_notifications')}
                                    className={cn(
                                        "w-10 h-5 rounded-full flex items-center px-1 transition-colors duration-200",
                                        formData.sms_notifications ? "bg-primary-600" : "bg-gray-300"
                                    )}
                                >
                                    <div className={cn(
                                        "w-3 h-3 bg-white rounded-full transition-transform duration-200",
                                        formData.sms_notifications ? "translate-x-5" : "translate-x-0"
                                    )}></div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Change Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
                            <button onClick={() => { setIsPasswordModalOpen(false); setError(null); }} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        {error && (
                            <div className="p-4 mx-6 mt-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Current Password</label>
                                <Input
                                    type="password"
                                    className="rounded-xl"
                                    value={passwordData.current_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">New Password</label>
                                <Input
                                    type="password"
                                    className="rounded-xl"
                                    value={passwordData.new_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Confirm New Password</label>
                                <Input
                                    type="password"
                                    className="rounded-xl"
                                    value={passwordData.confirm_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsPasswordModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1 rounded-xl shadow-lg" disabled={passwordMutation.isPending}>
                                    {passwordMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    Update Password
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export { SettingsPage };
