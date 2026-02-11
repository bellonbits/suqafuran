import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { authService } from '../services/authService';

const ForgotPasswordPage: React.FC = () => {
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
            setError(err.response?.data?.detail || 'Failed to send reset link');
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                    <p className="text-gray-600 mb-8">
                        If an account exists for {email}, we've sent instructions to reset your password.
                    </p>
                    <Link to="/login">
                        <Button variant="outline" className="w-full rounded-xl">
                            Back to Login
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <div className="max-w-md w-full space-y-8 bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Forgot Password?
                    </h2>
                    <p className="mt-4 text-gray-600">
                        Enter your email and we'll send you a code to reset your password.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <Input
                        label="Email Address"
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
                        className="w-full h-12 text-lg rounded-xl"
                        isLoading={loading}
                    >
                        <Send className="mr-2 w-5 h-5" />
                        Send Reset Code
                    </Button>

                    <Link
                        to="/login"
                        className="flex items-center justify-center text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Back to login
                    </Link>
                </form>
            </div>
        </div>
    );
};

export { ForgotPasswordPage };
