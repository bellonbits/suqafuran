import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Mail, Lock, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Button } from '../components/Button';
import { AuthInput } from '../components/AuthInput';
import { AuthLayout } from '../components/AuthLayout';
import { authService } from '../services/authService';

const SignupPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const signupSchema = z.object({
        full_name: z.string().min(2, t('auth.nameTooShort')).max(100).regex(/^[a-zA-Z\s'-]+$/, t('auth.nameInvalid')),
        email: z.string().email(t('auth.invalidEmail')).max(254),
        phone: z.string().regex(/^\+?[0-9\s\-()]{7,20}$/, t('auth.phoneInvalid')).optional().or(z.literal('')),
        password: z.string().min(8, t('auth.passwordTooShort')).max(128)
            .regex(/[A-Z]/, t('auth.passwordUppercase'))
            .regex(/[0-9]/, t('auth.passwordNumber')),
        confirm_password: z.string(),
    }).refine(d => d.password === d.confirm_password, { message: t('auth.passwordsMismatch'), path: ['confirm_password'] });
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const result = signupSchema.safeParse(formData);
        if (!result.success) {
            setError(result.error.issues[0].message);
            return;
        }

        setIsLoading(true);

        try {
            await authService.signup({
                full_name: formData.full_name,
                email: formData.email,
                phone: formData.phone || undefined,
                password: formData.password
            });
            navigate(`/email-verification?email=${encodeURIComponent(formData.email)}`);
        } catch (err: any) {
            console.error('Signup Error Debug:', JSON.stringify({
                message: err.message,
                config_url: err.config?.url,
                config_baseURL: err.config?.baseURL,
                code: err.code,
                status: err.response?.status,
                data: err.response?.data,
            }));
            let message = t('auth.signupFailed');
            
            if (err.response) {
                const detail = err.response.data?.detail;
                message = typeof detail === 'string'
                    ? detail
                    : Array.isArray(detail)
                        ? detail[0]?.msg || 'Signup failed'
                        : `Server error (${err.response.status})`;
            } else if (err.request) {
                message = t('auth.networkError');
            } else {
                message = err.message || message;
            }
            
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title={t('auth.signupTitle')}
            subtitle={t('auth.signupSubtitle')}
            imageCaption={t('auth.imageCaption')}
        >
            <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 font-medium animate-in fade-in slide-in-from-top-1">
                        {error}
                    </div>
                )}

                <AuthInput
                    id="fullName"
                    type="text"
                    label={t('auth.fullName')}
                    placeholder={t('auth.fullNamePlaceholder')}
                    icon={<User className="w-5 h-5" />}
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                />

                <AuthInput
                    id="email"
                    type="email"
                    label={t('auth.emailAddress')}
                    placeholder="you@example.com"
                    icon={<Mail className="w-5 h-5" />}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                />

                <AuthInput
                    id="phone"
                    type="tel"
                    label={t('auth.phoneOptional')}
                    placeholder="+254712345678"
                    icon={<Phone className="w-5 h-5" />}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AuthInput
                        id="password"
                        type="password"
                        label={t('auth.password')}
                        placeholder="••••••••"
                        icon={<Lock className="w-5 h-5" />}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />

                    <AuthInput
                        id="confirmPassword"
                        type="password"
                        label={t('auth.confirmPassword')}
                        placeholder="••••••••"
                        icon={<Lock className="w-5 h-5" />}
                        value={formData.confirm_password}
                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                        required
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-primary-300 hover:bg-primary-400 text-white font-bold transition-all shadow-lg shadow-primary-300/30 mt-6"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            <span>{t('auth.continue')}</span>
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    )}
                </Button>

                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                        {t('auth.haveAccount')}{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="font-bold text-primary-400 hover:text-primary-500 hover:underline"
                        >
                            {t('auth.logIn')}
                        </button>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
};

export { SignupPage };
