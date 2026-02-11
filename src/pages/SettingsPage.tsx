import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import {
    User, Mail, Phone, Lock,
    Camera, Shield, Bell, CheckCircle,
    Loader2
} from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

const SettingsPage: React.FC = () => {
    const { user, setUser } = useAuthStore();
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => authService.updateUser(data),
        onSuccess: (updatedUser) => {
            setUser(updatedUser as any); // Cast to any or the correct interface
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(formData);
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
                                <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center border-4 border-white shadow-md">
                                    <User className="h-10 w-10 text-primary-600" />
                                </div>
                                <button type="button" className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                                    <Camera className="h-4 w-4" />
                                </button>
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
                                    <div className="relative">
                                        <Input
                                            className="pl-10 rounded-xl"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        />
                                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                                    <div className="relative">
                                        <Input
                                            className="pl-10 rounded-xl bg-gray-50"
                                            value={formData.email}
                                            disabled
                                        />
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                                    <div className="relative">
                                        <Input
                                            className="pl-10 rounded-xl"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    </div>
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
                            <Button variant="outline" className="rounded-xl font-bold border-2">Change Password</Button>
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
                                <div className="w-10 h-5 bg-primary-600 rounded-full flex items-center px-1">
                                    <div className="w-3 h-3 bg-white rounded-full ml-auto"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between opacity-50">
                                <span className="text-sm font-medium text-gray-700">SMS Alerts</span>
                                <div className="w-10 h-5 bg-gray-300 rounded-full flex items-center px-1">
                                    <div className="w-3 h-3 bg-white rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export { SettingsPage };
