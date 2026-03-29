import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, CheckCircle, ArrowRight, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';
import { Button } from '../components/Button';
import { AuthInput } from '../components/AuthInput';
import { AuthLayout } from '../components/AuthLayout';
import { authService } from '../services/authService';

const ResetPasswordPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const emailFromUrl = searchParams.get('email') || '';

    const [email, setEmail] = useState(emailFromUrl);
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError(t('auth.passwordMismatch'));
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await authService.resetPassword({ email, code, new_password: password });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2500);
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string'
                ? detail
                : Array.isArray(detail)
                    ? detail[0]?.msg || t('common.error')
                    : t('common.error');
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.passwordResetSuccess')}</h2>
                    <p className="text-gray-600">{t('auth.passwordResetSuccessDesc')}</p>
                </div>
            </div>
        );
    }

    return (
        <AuthLayout
            title={t('auth.resetPasswordTitle')}
            subtitle={t('auth.resetPasswordSubtitle')}
            imageCaption={t('auth.forgotPasswordCaption')}
        >
            <form className="space-y-4" onSubmit={handleReset}>
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 font-medium">
                        {error}
                    </div>
                )}

                <div className="flex justify-center mb-2">
                    <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center">
                        <ShieldCheck className="w-7 h-7 text-primary-600" />
                    </div>
                </div>

                <AuthInput
                    label={t('auth.emailAddress')}
                    id="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <AuthInput
                    label={t('auth.resetCode')}
                    id="code"
                    type="text"
                    required
                    placeholder="123456"
                    icon={<KeyRound className="h-4 w-4" />}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />

                <AuthInput
                    label={t('auth.newPassword')}
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    icon={<Lock className="h-4 w-4" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <AuthInput
                    label={t('auth.confirmNewPassword')}
                    id="confirmPassword"
                    type="password"
                    required
                    placeholder="••••••••"
                    icon={<Lock className="h-4 w-4" />}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-blue-300 hover:bg-blue-400 text-white font-bold shadow-lg shadow-blue-300/30 mt-2"
                    isLoading={loading}
                >
                    <div className="flex items-center justify-center gap-2">
                        <span>{t('auth.resetPasswordBtn')}</span>
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </Button>

                <div className="text-center">
                    <Link
                        to="/login"
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        {t('auth.rememberPassword')}
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
};

export { ResetPasswordPage };
