import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { AuthInput } from '../components/AuthInput';
import { AuthLayout } from '../components/AuthLayout';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await authService.login({
                email: phone, // We map phone to email/username field in service
                password: password
            });

            useAuthStore.setState({ token: response.access_token });
            const user = await authService.getMe();
            login(user, response.access_token);
            navigate('/');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string'
                ? detail
                : 'Invalid phone number or password';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    const handleSocialLogin = (provider: string) => {
        window.location.href = `${API_BASE_URL}/auth/login/${provider}`;
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to your Suqafuran account to continue."
            imageCaption="Your Gateway to Africa's Marketplace."
        >
            <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 font-medium">
                        {error}
                    </div>
                )}

                <AuthInput
                    label="Phone Number"
                    id="phone"
                    type="tel"
                    placeholder="+252 61 XXX XXXX"
                    icon={<Phone className="h-4 w-4" />}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                />

                <div className="space-y-1">
                    <AuthInput
                        label="Password"
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        icon={<Lock className="h-4 w-4" />}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <div className="flex justify-end">
                        <Link
                            to="/forgot-password"
                            className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 text-sm font-semibold rounded-xl bg-primary-600 hover:bg-primary-500 border-none shadow-lg shadow-primary-500/20 text-white"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            <span>Sign In</span>
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    )}
                </Button>

                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/signup')}
                            className="font-bold text-primary-600 hover:text-primary-700 hover:underline"
                        >
                            Create Account
                        </button>
                    </p>
                </div>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                        <span className="px-3 bg-white text-gray-400">Or continue with</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-xl gap-2 h-12 bg-white border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold"
                        onClick={() => handleSocialLogin('google')}
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                        Google
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-xl gap-2 h-12 bg-white border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold"
                        onClick={() => handleSocialLogin('github')}
                    >
                        <img src="https://cdn-icons-png.flaticon.com/512/0/747.png" alt="Github" className="w-5 h-5" />
                        Github
                    </Button>
                </div>
            </form>
        </AuthLayout>
    );
};

export { LoginPage };
