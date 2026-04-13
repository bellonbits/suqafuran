import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { AuthInput } from '../components/AuthInput';
import { AuthLayout } from '../components/AuthLayout';
import { authService } from '../services/authService';

const ForgotPasswordPage: React.FC = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await authService.forgotPassword(email);
            setSuccess(true);
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.checkYourEmail')}</h2>
                    <p className="text-gray-600 mb-8">
                        {t('auth.checkEmailDesc', { email })}
                    </p>
                    <Link to="/login">
                        <Button variant="outline" className="w-full rounded-xl">
                            {t('auth.backToLogin')}
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <AuthLayout
            title={t('auth.forgotPassword')}
            subtitle={t('auth.forgotPasswordSubtitle')}
            imageCaption={t('auth.forgotPasswordCaption')}
        >
            <form className="space-y-6" onSubmit={handleSubmit}>
                <AuthInput
                    label={t('auth.emailAddress')}
                    id="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    icon={<Mail className="h-4 w-4" />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={error || undefined}
                />

                <Button
                    type="submit"
                    className="w-full h-12 text-lg rounded-xl font-semibold bg-primary-300 hover:bg-primary-400 text-white shadow-lg shadow-primary-300/30"
                    isLoading={loading}
                >
                    <Send className="mr-2 w-5 h-5" />
                    {t('auth.sendResetCode')}
                </Button>

                <div className="text-center">
                    <Link
                        to="/login"
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        {t('auth.backToLogin')}
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
};

export { ForgotPasswordPage };
