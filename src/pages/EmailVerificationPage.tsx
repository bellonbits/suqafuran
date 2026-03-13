import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../components/Button';
import { AuthInput } from '../components/AuthInput';
import { AuthLayout } from '../components/AuthLayout';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';

const EmailVerificationPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';
    const login = useAuthStore((state) => state.login);

    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resent, setResent] = useState(false);

    useEffect(() => {
        if (!email) navigate('/signup');
    }, [email, navigate]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const response = await authService.verifyOTP(email, otp);
            useAuthStore.setState({ token: response.access_token });
            const user = await authService.getMe();
            login(user, response.access_token);
            navigate('/dashboard');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Invalid code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        setError(null);
        setResent(false);
        try {
            await authService.requestOTP(email);
            setResent(true);
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Failed to resend. Try again.');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Check your inbox"
            subtitle={`We've sent a 6-digit code to ${email}`}
            imageCaption="Secure your marketplace account."
        >
            <form className="space-y-6" onSubmit={handleVerify}>
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 font-medium">
                        {error}
                    </div>
                )}
                {resent && (
                    <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm border border-green-100 font-medium">
                        A new code has been sent to {email}
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
                    label="Verification Code"
                    placeholder="Enter 6-digit code"
                    icon={<CheckCircle className="w-5 h-5" />}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
                            <span>Verify & Continue</span>
                        </div>
                    )}
                </Button>

                <div className="text-center space-y-2">
                    <p className="text-sm text-gray-500">Didn't receive the code?</p>
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendLoading}
                        className="flex items-center gap-1 mx-auto text-sm font-bold text-primary-600 hover:text-primary-700 hover:underline disabled:opacity-50"
                    >
                        {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Resend code
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/signup')}
                        className="block mx-auto text-sm text-gray-400 hover:text-gray-600 mt-2"
                    >
                        Use a different email
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
};

export { EmailVerificationPage };
