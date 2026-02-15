import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Key, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { AuthInput } from '../components/AuthInput';
import { AuthLayout } from '../components/AuthLayout';
import { authService } from '../services/authService';

const PhoneVerificationPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const phone = searchParams.get('phone') || '';

    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!phone) {
            navigate('/signup');
        }
    }, [phone, navigate]);

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await authService.verifyOTP(phone, otp);
            // After verification, we could auto-login or redirect to login.
            // User requested: "then login using their verified mobile and password"
            // So we redirect to Login page.
            navigate('/login');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string'
                ? detail
                : Array.isArray(detail)
                    ? detail[0]?.msg || 'Validation error'
                    : 'Invalid code. Please try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await authService.requestOTP(phone);
            alert('Code sent!');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Failed to send OTP.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AuthLayout
            title="Verify your phone"
            subtitle={`We've sent a 6-digit verification code to ${phone}`}
            imageCaption="Secure your marketplace account."
        >
            <form className="space-y-6" onSubmit={handleVerifyOTP}>
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 font-medium">
                        {error}
                    </div>
                )}

                <AuthInput
                    id="otp"
                    type="text"
                    label="Verification Code"
                    placeholder="Enter 6-digit code"
                    icon={<Key className="w-5 h-5" />}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                />

                <div className="space-y-3">
                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all shadow-lg shadow-primary-500/20"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                <span>Verify Account</span>
                            </div>
                        )}
                    </Button>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Didn't receive code?{' '}
                            <button
                                type="button"
                                onClick={handleResendOTP}
                                className="font-bold text-primary-600 hover:text-primary-700 hover:underline"
                                disabled={isLoading}
                            >
                                Resend
                            </button>
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate('/signup')}
                        className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors mt-4"
                    >
                        Change phone number
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
};

export { PhoneVerificationPage };
