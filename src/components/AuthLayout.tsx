import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from './Logo';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: React.ReactNode;
    imageCaption?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
    children,
    title,
    subtitle,
    imageCaption = "Connecting Africa, One Listing at a Time."
}) => {
    return (
        <div className="fixed inset-0 w-full h-full flex bg-[#13111a] text-gray-200 overflow-hidden">
            {/* Left Side - Image/Visuals (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative p-8">
                <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/5">
                    <img
                        src="/hero3.jpg"
                        alt="Auth Background"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1625]/80 via-transparent to-[#1a1625]/20" />

                    {/* Brand Content */}
                    <div className="absolute inset-0 p-12 flex flex-col justify-between pointer-events-none">
                        <div className="flex items-center justify-between pointer-events-auto">
                            <Logo size="lg" className="brightness-200 grayscale contrast-200" />
                            <Link
                                to="/"
                                className="flex items-center text-sm font-medium text-white/80 hover:text-white transition-colors bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
                            >
                                Back to website <ArrowLeft className="ml-2 w-4 h-4 rotate-180" />
                            </Link>
                        </div>

                        <div className="max-w-md">
                            <h2 className="text-4xl font-bold text-white tracking-tight leading-tight">
                                {imageCaption}
                            </h2>
                            <div className="mt-6 flex gap-2">
                                <div className="w-8 h-1 bg-white/40 rounded-full" />
                                <div className="w-8 h-1 bg-white/40 rounded-full" />
                                <div className="w-12 h-1 bg-white rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form Container */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 lg:px-20 py-12 relative overflow-y-auto">
                {/* Mobile Logo */}
                <div className="lg:hidden absolute top-8 left-8">
                    <Logo size="md" />
                </div>

                <div className="w-full max-w-[440px] space-y-8">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight text-white">
                            {title}
                        </h1>
                        <p className="text-gray-400 font-medium">
                            {subtitle}
                        </p>
                    </div>

                    <div className="mt-8">
                        {children}
                    </div>
                </div>
            </div>

            {/* Decorative Orbs */}
            <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-[10%] -left-[5%] w-[40%] h-[40%] bg-secondary-600/5 rounded-full blur-[120px] pointer-events-none" />
        </div>
    );
};

export { AuthLayout };
