import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../components/Button';
import { AuthInput } from '../components/AuthInput';
import { AuthLayout } from '../components/AuthLayout';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';

const EmailVerificationPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';
    const login = useAuthStore((state) => state.login);

    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resent, setResent] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const isVerifying = useRef(false);

    useEffect(() => {
        if (!email) navigate('/signup');
    }, [email, navigate]);

    // Tick down resend cooldown every second
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const id = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(id);
    }, [resendCooldown]);

    const doVerify = useCallback(async (code: string) => {
        if (isVerifying.current) return;
        isVerifying.current = true;
        setError(null);
        setIsLoading(true);
        try {
            const response = await authService.verifyOTP(email, code);
            useAuthStore.setState({ token: response.access_token });
            const user = await authService.getMe();
            login(user, response.access_token);
            navigate('/dashboard');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : t('auth.otp') + ' invalid');
            isVerifying.current = false;
        } finally {
            setIsLoading(false);
        }
    }, [email, login, navigate, t]);

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        doVerify(otp);
    };

    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
        setOtp(val);
        if (val.length === 6) doVerify(val);
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || resendLoading) return;
        setResendLoading(true);
        setError(null);
        setResent(false);
        try {
            await authService.requestOTP(email);
            setResent(true);
            setResendCooldown(30);
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : t('common.error'));
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <AuthLayout
            title={t('auth.checkYourInbox')}
            subtitle={t('auth.codeSentTo', { email })}
            imageCaption={t('auth.secureAccount')}
        >
            <form className="space-y-6" onSubmit={handleVerify}>
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 font-medium">
                        {error}
                    </div>
                )}
                {resent && (
                    <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm border border-green-100 font-medium">
                        {t('auth.newCodeSent', { email })}
                    </div>
                )}

                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
                        <Mail className="w-8 h-8 text-primary-600" />
                    </div>
                </div>

                <AuthInput
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    label={t('auth.verificationCode')}
                    placeholder={t('auth.enter6DigitCode')}
                    icon={<CheckCircle className="w-5 h-5" />}
                    value={otp}
                    onChange={handleOtpChange}
                    required
                />

                <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold"
                    disabled={isLoading || otp.length !== 6}
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            <span>{t('auth.verifyAndContinue')}</span>
                        </div>
                    )}
                </Button>

                <div className="text-center space-y-2">
                    <p className="text-sm text-gray-500">{t('auth.didntReceiveCode')}</p>
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendLoading || resendCooldown > 0}
                        className="flex items-center gap-1 mx-auto text-sm font-bold text-primary-600 hover:text-primary-700 hover:underline disabled:opacity-50"
                    >
                        {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {resendCooldown > 0 ? `${t('auth.resendCode')} (${resendCooldown}s)` : t('auth.resendCode')}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/signup')}
                        className="block mx-auto text-sm text-gray-400 hover:text-gray-600 mt-2"
                    >
                        {t('auth.useDifferentEmail')}
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
};

export { EmailVerificationPage };
