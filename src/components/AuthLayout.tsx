import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Tag, Search, ListFilter } from 'lucide-react';
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
        <div className="fixed inset-0 w-full h-full flex bg-gray-50 text-gray-900 overflow-hidden">
            {/* Left Side - Image/Visuals (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative p-4">
                <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-blue-300">
                    {/* Background Pattern with Icons */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="grid grid-cols-6 gap-8 p-8 transform -rotate-12 scale-110">
                            {[...Array(24)].map((_, i) => (
                                <div key={i} className="flex justify-center items-center">
                                    {i % 4 === 0 && <MapPin className="w-12 h-12 text-white" />}
                                    {i % 4 === 1 && <Tag className="w-12 h-12 text-white" />}
                                    {i % 4 === 2 && <Search className="w-12 h-12 text-white" />}
                                    {i % 4 === 3 && <ListFilter className="w-12 h-12 text-white" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Brand Content */}
                    <div className="absolute inset-0 p-12 flex flex-col justify-between pointer-events-none">
                        <div className="flex items-center justify-between pointer-events-auto">
                            <Logo size="lg" className="brightness-0 invert" />
                            <Link
                                to="/"
                                className="flex items-center text-sm font-medium text-white hover:text-white/80 transition-colors bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20"
                            >
                                Back to website <ArrowLeft className="ml-2 w-4 h-4 rotate-180" />
                            </Link>
                        </div>

                        <div className="max-w-md relative z-10">
                            <h2 className="text-4xl font-bold text-white tracking-tight leading-tight drop-shadow-sm">
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

            <div className="flex-1 flex flex-col justify-center items-center px-6 lg:px-20 py-6 relative overflow-y-auto bg-white">
                <div className="w-full max-w-[440px] space-y-6 pb-6">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-6 flex justify-center">
                        <Logo size="md" />
                    </div>
                    <div className="space-y-3 text-center lg:text-left">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            {title}
                        </h1>
                        <div className="text-gray-500 font-medium">
                            {subtitle}
                        </div>
                    </div>

                    <div className="mt-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export { AuthLayout };
