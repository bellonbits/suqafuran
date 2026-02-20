import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { AuthInput } from '../components/AuthInput';
import { AuthLayout } from '../components/AuthLayout';
import { authService } from '../services/authService';

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        password: '',
        confirm_password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkPasswordStrength = (password: string) => {
        if (password.length < 8) return "Password must be at least 8 characters";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic Validation
        if (formData.password !== formData.confirm_password) {
            setError("Passwords do not match");
            return;
        }

        const strengthError = checkPasswordStrength(formData.password);
        if (strengthError) {
            setError(strengthError);
            return;
        }

        setIsLoading(true);

        try {
            await authService.signup({
                full_name: formData.full_name,
                phone: formData.phone,
                password: formData.password
            });
            // On success, navigate to verification page
            navigate(`/phone-verification?phone=${encodeURIComponent(formData.phone)}`);
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            const message = typeof detail === 'string'
                ? detail
                : Array.isArray(detail)
                    ? detail[0]?.msg || 'Signup failed'
                    : 'Failed to create account. Please try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Join Suqafuran to start buying and selling"
            imageCaption="Your Gateway to Africa's Marketplace."
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
                    label="Full Name"
                    placeholder="Enter your full name"
                    icon={<User className="w-5 h-5" />}
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                />

                <AuthInput
                    id="phone"
                    type="tel"
                    label="Phone Number"
                    placeholder="+254 7..."
                    icon={<Phone className="w-5 h-5" />}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AuthInput
                        id="password"
                        type="password"
                        label="Password"
                        placeholder="••••••••"
                        icon={<Lock className="w-5 h-5" />}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />

                    <AuthInput
                        id="confirmPassword"
                        type="password"
                        label="Confirm Password"
                        placeholder="••••••••"
                        icon={<Lock className="w-5 h-5" />}
                        value={formData.confirm_password}
                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                        required
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-blue-300 hover:bg-blue-400 text-white font-bold transition-all shadow-lg shadow-blue-300/30 mt-6"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            <span>Continue</span>
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    )}
                </Button>

                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="font-bold text-blue-400 hover:text-blue-500 hover:underline"
                        >
                            Log in
                        </button>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
};

export { SignupPage };
