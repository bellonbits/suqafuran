import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';
import { Loader2 } from 'lucide-react';

const SocialAuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const login = useAuthStore((state) => state.login);

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token');
            if (token) {
                try {
                    // Store token temporarily to fetch user info
                    useAuthStore.setState({ token });

                    const user = await authService.getMe();
                    login(user, token);

                    navigate('/dashboard');
                } catch (error) {
                    console.error('Social auth failed:', error);
                    navigate('/login?error=social_auth_failed');
                }
            } else {
                navigate('/login');
            }
        };

        handleCallback();
    }, [searchParams, login, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Authenticating...</h2>
                <p className="text-gray-500 mt-2">Please wait while we complete your sign in.</p>
            </div>
        </div>
    );
};

export { SocialAuthCallback };
