import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { authService } from '../services/authService';

const VerifyEmailPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await authService.verifyEmail(email, code);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        setError(null);
        try {
            await authService.resendVerification(email);
            // Small feedback for resend
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Verified!</h2>
                    <p className="text-gray-600 mb-8">Your account has been successfully verified. Redirecting you to login...</p>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-600 animate-progress"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <div className="max-w-md w-full space-y-8 bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6">
                        <Mail className="w-8 h-8 text-primary-600" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Verify Email
                    </h2>
                    <p className="mt-4 text-gray-600">
                        We've sent a 6-digit verification code to <br />
                        <span className="font-semibold text-gray-900">{email}</span>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleVerify}>
                    <Input
                        label="Verification Code"
                        id="code"
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        error={error || undefined}
                        className="text-center text-2xl tracking-[1em] font-bold"
                    />

                    <Button
                        type="submit"
                        className="w-full h-12 text-lg rounded-xl"
                        isLoading={loading}
                    >
                        Verify Account
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={resending}
                            className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center justify-center mx-auto"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${resending ? 'animate-spin' : ''}`} />
                            {resending ? 'Resending...' : "Didn't receive code? Resend"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export { VerifyEmailPage };
