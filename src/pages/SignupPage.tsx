import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/Button';
import { AuthInput } from '../components/AuthInput';
import { AuthLayout } from '../components/AuthLayout';
import { authService } from '../services/authService';

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = React.useState(false);

    const formik = useFormik({
        initialValues: {
            name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
        },
        validationSchema: Yup.object({
            name: Yup.string().required('Full name is required'),
            email: Yup.string().email('Invalid email address').required('Required'),
            phone: Yup.string().required('Required'),
            password: Yup.string().min(6, 'Must be at least 6 characters').required('Required'),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('password')], 'Passwords must match')
                .required('Required'),
        }),
        onSubmit: async (values, { setFieldError, setSubmitting }) => {
            try {
                await authService.signup({
                    full_name: values.name,
                    email: values.email,
                    password: values.password,
                    phone: values.phone
                });
                navigate('/verify-email', { state: { email: values.email } });
            } catch (err: any) {
                const message = err.response?.data?.detail || 'Signup failed';
                if (message.includes('email')) {
                    setFieldError('email', message);
                } else {
                    alert(message);
                }
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
            title="Create an account"
            subtitle={
                <>
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary-400 hover:text-primary-300 transition-colors underline underline-offset-4">
                        Log in
                    </Link>
                </>
            }
            imageCaption="Join the Future of African Trade."
        >
            <form className="space-y-5" onSubmit={formik.handleSubmit}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <AuthInput
                            label="First name"
                            id="name"
                            type="text"
                            placeholder="John"
                            icon={<User className="h-4 w-4" />}
                            {...formik.getFieldProps('name')}
                            error={formik.touched.name ? formik.errors.name : undefined}
                        />
                        <AuthInput
                            label="Last name"
                            id="lastName"
                            type="text"
                            placeholder="Doe"
                            icon={<User className="h-4 w-4" />}
                        />
                    </div>

                    <AuthInput
                        label="Email Address"
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        icon={<Mail className="h-4 w-4" />}
                        {...formik.getFieldProps('email')}
                        error={formik.touched.email ? formik.errors.email : undefined}
                    />

                    <AuthInput
                        label="Phone Number"
                        id="phone"
                        type="tel"
                        placeholder="0712345678"
                        icon={<Phone className="h-4 w-4" />}
                        {...formik.getFieldProps('phone')}
                        error={formik.touched.phone ? formik.errors.phone : undefined}
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

                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input
                            id="terms"
                            name="terms"
                            type="checkbox"
                            required
                            className="h-4 w-4 bg-[#252131] text-primary-600 focus:ring-primary-500 border-white/5 rounded mt-1"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="terms" className="text-gray-400">
                            I agree to the <Link to="/terms" className="text-primary-400 hover:underline transition-colors">Terms & Conditions</Link>
                        </label>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 text-sm font-semibold rounded-xl bg-primary-600 hover:bg-primary-500 border-none shadow-lg shadow-primary-500/20"
                    isLoading={formik.isSubmitting}
                >
                    Create account
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

export { SignupPage };
