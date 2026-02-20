import React from 'react';
import { Link } from 'react-router-dom';
import { Search, PlusCircle, Heart, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { getAvatarUrl } from '../utils/imageUtils';

import { useAuthStore } from '../store/useAuthStore';
import { CurrencySwitcher } from '../components/CurrencySwitcher';

interface LayoutProps {
    children: React.ReactNode;
}

const PublicLayout: React.FC<LayoutProps> = ({ children }) => {
    const { isAuthenticated, user } = useAuthStore();

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Navbar */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    <Link to="/" className="shrink-0 flex items-center">
                        <Logo size="md" />
                    </Link>

                    <div className="hidden md:flex flex-1 max-w-2xl relative">
                        <input
                            type="text"
                            placeholder="Search for anything..."
                            className="w-full h-10 pl-10 pr-4 rounded-full border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-sans"
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>

                    <nav className="flex items-center gap-2 md:gap-4 shrink-0">
                        <div className="hidden lg:block mr-2">
                            <CurrencySwitcher />
                        </div>
                        <Button variant="ghost" size="icon" className="md:hidden text-gray-600">
                            <Search className="h-5 w-5" />
                        </Button>

                        {!isAuthenticated ? (
                            <Link to="/login" className="hidden sm:block">
                                <Button variant="ghost" size="sm" className="text-gray-700 hover:bg-gray-50 font-semibold">Sign In</Button>
                            </Link>
                        ) : (
                            <Link to="/dashboard" className="hidden sm:flex items-center gap-2 group">
                                <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold border border-primary-100 group-hover:bg-primary-100 transition-colors overflow-hidden">
                                    {getAvatarUrl(user?.avatar_url) ? (
                                        <img
                                            src={getAvatarUrl(user?.avatar_url)!}
                                            alt={user?.full_name || 'User'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        user?.full_name?.[0] || 'U'
                                    )}
                                </div>
                                <span className="text-sm font-semibold text-gray-700 group-hover:text-primary-600 transition-colors">My Account</span>
                            </Link>
                        )}

                        <Link to="/favorites" className="text-gray-600 hover:text-primary-600 transition-colors p-2">
                            <Heart className="h-6 w-6" />
                        </Link>
                        <Link to="/post-ad">
                            <Button variant="secondary" className="hidden sm:flex gap-2 rounded-full shadow-md">
                                <PlusCircle className="h-5 w-5" />
                                <span>Sell Now</span>
                            </Button>
                            <Button variant="secondary" size="icon" className="sm:hidden rounded-full font-bold text-lg shadow-md">
                                +
                            </Button>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-white font-bold mb-4">About Suqafuran</h3>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                                <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
                                <li><Link to="/terms" className="hover:text-white">Terms & Conditions</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-4">Support</h3>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
                                <li><Link to="/safety" className="hover:text-white">Safety Tips</Link></li>
                                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-4">Our Apps</h3>
                            <div className="space-y-3">
                                <div className="h-10 w-32 bg-gray-800 rounded border border-gray-700 flex items-center justify-center text-xs cursor-pointer hover:bg-gray-700">App Store</div>
                                <div className="h-10 w-32 bg-gray-800 rounded border border-gray-700 flex items-center justify-center text-xs cursor-pointer hover:bg-gray-700">Play Store</div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-4">Connect</h3>
                            <div className="flex gap-4">
                                <div className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer group">
                                    <Facebook className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                                </div>
                                <div className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer group">
                                    <Twitter className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                                </div>
                                <div className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer group">
                                    <Instagram className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                                </div>
                                <div className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer group">
                                    <Youtube className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                            <p className="mt-6 text-xs text-gray-500 italic">© 2026 Suqafuran. Buy. Sell. Connect.</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export { PublicLayout };
