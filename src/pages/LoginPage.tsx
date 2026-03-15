import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, ShieldAlert } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required').max(128),
});
import { Button } from '../components/Button';
import { AuthInput } from '../components/AuthInput';
import { AuthLayout } from '../components/AuthLayout';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 5 * 60; // 5 minutes
const STORAGE_KEY = 'login_lockout';

function getLockout(): { attempts: number; lockedUntil: number } {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
        return { attempts: 0, lockedUntil: 0 };
    }
}

function saveLockout(data: { attempts: number; lockedUntil: number }) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const { lockedUntil } = getLockout();
        const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
        if (remaining > 0) startCountdown(remaining);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const startCountdown = (seconds: number) => {
        setCountdown(seconds);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    saveLockout({ attempts: 0, lockedUntil: 0 });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const lockout = getLockout();
        if (lockout.lockedUntil > Date.now()) return;

        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
            setError(result.error.issues[0].message);
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.login({ email, password });
            saveLockout({ attempts: 0, lockedUntil: 0 });
            useAuthStore.setState({ token: response.access_token });
            const user = await authService.getMe();
            login(user, response.access_token);
            navigate('/');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string'
                ? detail
                : 'Invalid email or password';

            const lockout = getLockout();
            const newAttempts = (lockout.attempts || 0) + 1;

            if (newAttempts >= MAX_ATTEMPTS) {
                const lockedUntil = Date.now() + LOCKOUT_SECONDS * 1000;
                saveLockout({ attempts: newAttempts, lockedUntil });
                startCountdown(LOCKOUT_SECONDS);
                setError(`Too many failed attempts. Try again in ${formatTime(LOCKOUT_SECONDS)}.`);
            } else {
                saveLockout({ attempts: newAttempts, lockedUntil: 0 });
                const remaining = MAX_ATTEMPTS - newAttempts;
                setError(`${message}. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const isLocked = countdown > 0;

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
                {isLocked ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-red-700">Account temporarily locked</p>
                            <p className="text-sm text-red-600 mt-0.5">
                                Too many failed attempts. Try again in{' '}
                                <span className="font-mono font-bold">{formatTime(countdown)}</span>
                            </p>
                        </div>
                    </div>
                ) : error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 font-medium">
                        {error}
                    </div>
                )}

                <AuthInput
                    label="Email Address"
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    icon={<Mail className="h-4 w-4" />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLocked}
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
                        disabled={isLocked}
                    />
                    <div className="flex justify-end">
                        <Link
                            to="/forgot-password"
                            className="text-sm font-medium text-blue-400 hover:text-blue-500 hover:underline"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 text-sm font-semibold rounded-xl bg-blue-300 hover:bg-blue-400 border-none shadow-lg shadow-blue-300/30 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || isLocked}
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : isLocked ? (
                        <span>Locked — {formatTime(countdown)}</span>
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
                            className="font-bold text-blue-400 hover:text-blue-500 hover:underline"
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
