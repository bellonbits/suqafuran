import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/Button';
import { AuthInput } from '../components/AuthInput';
import { AuthLayout } from '../components/AuthLayout';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const [showPassword, setShowPassword] = React.useState(false);

    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
        },
        validationSchema: Yup.object({
            email: Yup.string().email('Invalid email address').required('Required'),
            password: Yup.string().min(6, 'Must be at least 6 characters').required('Required'),
        }),
        onSubmit: async (values, { setFieldError, setSubmitting }) => {
            try {
                const response = await authService.login({
                    email: values.email,
                    password: values.password
                });

                useAuthStore.setState({ token: response.access_token });
                const user = await authService.getMe();
                login(user, response.access_token);
                navigate('/');
            } catch (err: any) {
                const message = err.response?.data?.detail || 'Login failed';
                setFieldError('email', message);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    const handleSocialLogin = (provider: string) => {
        window.location.href = `${API_BASE_URL}/auth/login/${provider}`;
    };

    return (
        <AuthLayout
            title="Log in to account"
            subtitle={
                <>
                    New to Suqafuran?{' '}
                    <Link to="/signup" className="text-primary-400 hover:text-primary-300 transition-colors underline underline-offset-4">
                        Create an account
                    </Link>
                </>
            }
            imageCaption="Your Gateway to Africa's Marketplace."
        >
            <form className="space-y-5" onSubmit={formik.handleSubmit}>
                <div className="space-y-4">
                    <AuthInput
                        label="Email Address"
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        icon={<Mail className="h-4 w-4" />}
                        {...formik.getFieldProps('email')}
                        error={formik.touched.email ? formik.errors.email : undefined}
                    />
                    <div className="relative">
                        <AuthInput
                            label="Password"
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            icon={<Lock className="h-4 w-4" />}
                            {...formik.getFieldProps('password')}
                            error={formik.touched.password ? formik.errors.password : undefined}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 bottom-3 text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 bg-[#252131] text-primary-600 focus:ring-primary-500 border-white/5 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400 select-none">
                            Keep me logged in
                        </label>
                    </div>

                    <div className="text-sm">
                        <Link to="/forgot-password" self-className="font-medium text-gray-400 hover:text-primary-400 transition-colors">
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 text-sm font-semibold rounded-xl bg-primary-600 hover:bg-primary-500 border-none shadow-lg shadow-primary-500/20"
                    isLoading={formik.isSubmitting}
                >
                    Log in
                </Button>

                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                        <span className="px-3 bg-[#13111a] text-gray-500">Or register with</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Button
                        variant="outline"
                        className="w-full rounded-xl gap-2 h-12 bg-transparent border-white/5 hover:bg-white/5 text-gray-300 font-semibold"
                        onClick={() => handleSocialLogin('google')}
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                        Google
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full rounded-xl gap-2 h-12 bg-transparent border-white/5 hover:bg-white/5 text-gray-300 font-semibold"
                        onClick={() => handleSocialLogin('github')}
                    >
                        <img src="https://cdn-icons-png.flaticon.com/512/0/747.png" alt="Apple" className="w-5 h-5 brightness-200" />
                        Apple
                    </Button>
                </div>
            </form>
        </AuthLayout>
    );
};

export { LoginPage };
