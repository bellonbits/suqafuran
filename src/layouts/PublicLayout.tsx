import React from 'react';
import { Link } from 'react-router-dom';
import { Search, PlusCircle, Heart, Facebook, Twitter, Instagram, Youtube, User, ChevronDown, Home, MessageSquare } from 'lucide-react';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { getAvatarUrl } from '../utils/imageUtils';
import { cn } from '../utils/cn';

import { useAuthStore } from '../store/useAuthStore';
import { CurrencySwitcher } from '../components/CurrencySwitcher';

interface LayoutProps {
    children: React.ReactNode;
}

const PublicLayout: React.FC<LayoutProps> = ({ children }) => {
    const { isAuthenticated, user } = useAuthStore();
    const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({});

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

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
                            <>
                                <Link to="/login" className="hidden sm:block">
                                    <Button variant="ghost" size="sm" className="text-gray-700 hover:bg-gray-50 font-semibold">Sign In</Button>
                                </Link>
                                <Link to="/login" className="sm:hidden text-gray-600 hover:text-primary-600 transition-colors p-2">
                                    <User className="h-6 w-6" />
                                </Link>
                            </>
                        ) : (
                            <>
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
                                <Link to="/dashboard" className="sm:hidden flex items-center p-2">
                                    <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold border border-primary-100 overflow-hidden">
                                        {getAvatarUrl(user?.avatar_url) ? (
                                            <img
                                                src={getAvatarUrl(user?.avatar_url)!}
                                                alt={user?.full_name || 'User'}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-[10px]">{user?.full_name?.[0] || 'U'}</span>
                                        )}
                                    </div>
                                </Link>
                            </>
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
            <main className="flex-1 pb-16 md:pb-0">
                {children}
            </main>

            {/* Mobile Bottom Tabs */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-16 flex items-center justify-around z-50">
                <Link to="/" className="flex flex-col items-center justify-center gap-1 group">
                    <Home className="h-6 w-6 text-primary-500 group-hover:text-primary-600 transition-colors" />
                    <span className="text-[10px] font-bold text-primary-500">Home</span>
                </Link>
                <Link to="/favorites" className="flex flex-col items-center justify-center gap-1 group">
                    <Heart className="h-6 w-6 text-gray-400 group-hover:text-primary-600 transition-colors" />
                    <span className="text-[10px] font-medium text-gray-500">Saved</span>
                </Link>
                <Link to="/post-ad" className="flex flex-col items-center justify-center -mt-4 bg-white p-2 rounded-full shadow-lg border border-gray-50">
                    <div className="bg-primary-500 rounded-full p-3 text-white">
                        <PlusCircle className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 mt-1">Sell</span>
                </Link>
                <Link to="/messages" className="flex flex-col items-center justify-center gap-1 group">
                    <MessageSquare className="h-6 w-6 text-gray-400 group-hover:text-primary-600 transition-colors" />
                    <span className="text-[10px] font-medium text-gray-500">Messages</span>
                </Link>
                <Link to="/dashboard" className="flex flex-col items-center justify-center gap-1 group">
                    <User className="h-6 w-6 text-gray-400 group-hover:text-primary-600 transition-colors" />
                    <span className="text-[10px] font-medium text-gray-500">Profile</span>
                </Link>
            </div>

            {/* Footer */}
            <footer className="bg-primary-500 text-black py-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-black/5"></div>
                <div className="container mx-auto px-4">
                    {/* Jiji Style App Banner Top */}
                    <div className="md:hidden relative flex items-center justify-center py-6 mb-4 -mx-4 px-4 bg-primary-500 border-b border-black/5 min-h-[72px]">
                        <div className="absolute left-4">
                            <Logo size="sm" />
                        </div>

                        <div className="bg-black text-white px-3 py-1.5 rounded-lg flex items-center gap-2 scale-90 active:scale-95 transition-transform cursor-pointer">
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-31.4-93.7-56.5-93.7-101.9zm-46.7-194c25.2-31.2 20.5-63.7 18.7-74.7-22.7 1.2-50.7 15.5-66.7 34.5-16 19.3-29 42.1-25.5 74.7 26.6 2 50.8-16 73.5-34.5z" /></svg>
                            <div className="flex flex-col leading-none">
                                <span className="text-[8px] uppercase font-medium">Download on the</span>
                                <span className="text-sm font-bold">App Store</span>
                            </div>
                        </div>

                        <button onClick={() => toggleSection('footer')} className="absolute right-4 p-2 active:bg-black/5 rounded-full transition-colors">
                            <ChevronDown className={cn("h-6 w-6 transition-transform", openSections['footer'] ? "rotate-180" : "")} />
                        </button>
                    </div>

                    <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-8", openSections['footer'] ? "block" : "hidden md:grid")}>
                        {/* About Section */}
                        <div className="border-b border-black/5 md:border-none pb-4 md:pb-0">
                            <button
                                onClick={() => toggleSection('about')}
                                className="w-full flex items-center justify-between md:cursor-default"
                                disabled={window.innerWidth >= 768}
                            >
                                <h3 className="text-black font-extrabold mb-0 md:mb-4 uppercase tracking-wider text-sm">About Suqafuran</h3>
                                <ChevronDown className={cn("h-5 w-5 md:hidden transition-transform", openSections['about'] ? "rotate-180" : "")} />
                            </button>
                            <div className={cn("mt-4 md:mt-0 space-y-2 text-sm md:block", openSections['about'] ? "block" : "hidden")}>
                                <ul className="space-y-2">
                                    <li><Link to="/about" className="hover:opacity-70 transition-opacity">About Us</Link></li>
                                    <li><Link to="/contact" className="hover:opacity-70 transition-opacity">Contact Us</Link></li>
                                    <li><Link to="/terms" className="hover:opacity-70 transition-opacity">Terms & Conditions</Link></li>
                                </ul>
                            </div>
                        </div>

                        {/* Support Section */}
                        <div className="border-b border-black/5 md:border-none pb-4 md:pb-0">
                            <button
                                onClick={() => toggleSection('support')}
                                className="w-full flex items-center justify-between md:cursor-default"
                                disabled={window.innerWidth >= 768}
                            >
                                <h3 className="text-black font-extrabold mb-0 md:mb-4 uppercase tracking-wider text-sm">Support</h3>
                                <ChevronDown className={cn("h-5 w-5 md:hidden transition-transform", openSections['support'] ? "rotate-180" : "")} />
                            </button>
                            <div className={cn("mt-4 md:mt-0 space-y-2 text-sm md:block", openSections['support'] ? "block" : "hidden")}>
                                <ul className="space-y-2">
                                    <li><Link to="/help" className="hover:opacity-70 transition-opacity">Help Center</Link></li>
                                    <li><Link to="/safety" className="hover:opacity-70 transition-opacity">Safety Tips</Link></li>
                                    <li><Link to="/privacy" className="hover:opacity-70 transition-opacity">Privacy Policy</Link></li>
                                </ul>
                            </div>
                        </div>

                        {/* Apps Section */}
                        <div className="border-b border-black/5 md:border-none pb-4 md:pb-0">
                            <button
                                onClick={() => toggleSection('apps')}
                                className="w-full flex items-center justify-between md:cursor-default"
                                disabled={window.innerWidth >= 768}
                            >
                                <h3 className="text-black font-extrabold mb-0 md:mb-4 uppercase tracking-wider text-sm">Our Apps</h3>
                                <ChevronDown className={cn("h-5 w-5 md:hidden transition-transform", openSections['apps'] ? "rotate-180" : "")} />
                            </button>
                            <div className={cn("mt-4 md:mt-0 space-y-3 md:block", openSections['apps'] ? "block" : "hidden")}>
                                {/* App Store Button */}
                                <div className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-3 w-44 hover:bg-black/90 transition-colors cursor-pointer group shadow-lg">
                                    <svg className="w-6 h-6 fill-current shrink-0" viewBox="0 0 384 512"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-31.4-93.7-56.5-93.7-101.9zm-46.7-194c25.2-31.2 20.5-63.7 18.7-74.7-22.7 1.2-50.7 15.5-66.7 34.5-16 19.3-29 42.1-25.5 74.7 26.6 2 50.8-16 73.5-34.5z" /></svg>
                                    <div className="flex flex-col leading-none">
                                        <span className="text-[9px] uppercase font-medium text-gray-400">Download on the</span>
                                        <span className="text-base font-bold">App Store</span>
                                    </div>
                                </div>
                                {/* Google Play Button */}
                                <div className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-3 w-44 hover:bg-black/90 transition-colors cursor-pointer group shadow-lg">
                                    <svg className="w-6 h-6 shrink-0" viewBox="0 0 512 512">
                                        <path fill="#4db6ac" d="M10.057 5.127a5.12 5.12 0 00-1.12.339L242.457 256 8.937 506.534a5.2 5.2 0 001.12.339c1.928.32 4.073-.105 6.09-1.29l322.28-188.7L11.537 1.25c-2.017-1.185-4.162-1.61-6.091-1.29zM258.127 256L33.727 480.4l304.643 178.2c6.12 3.58 12.83 5.4 19.54 5.4 6.71 0 13.42-1.82 19.54-5.4l50.28-29.42L258.127 256zM258.127 256L427.73 371.78l50.28-29.42c12.24-7.16 19.54-20.24 19.54-34.36s-7.3-27.2-19.54-34.36L258.127 256zM258.127 256L478.01 127.64l-50.28-29.42c-12.24-7.16-19.54-20.24-19.54-34.36s-7.3-27.2-19.54-34.36L258.127 256z" />
                                        <path fill="#fdd835" d="M10.057 5.127L258.127 256l169.603-115.78-50.28-29.42-322.28-188.7z" />
                                        <path fill="#e53935" d="M10.057 506.873L258.127 256l169.603 115.78-50.28 29.42-322.28 188.7z" />
                                        <path fill="#3f51b5" d="M10.057 5.127C8.129 4.807 5.984 5.232 3.967 6.417L258.127 256 10.057 5.127z" />
                                    </svg>
                                    <div className="flex flex-col leading-none">
                                        <span className="text-[9px] uppercase font-medium text-gray-400">Get it On</span>
                                        <span className="text-base font-bold">Google Play</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Connect Section */}
                        <div>
                            <h3 className="text-black font-extrabold mb-4 uppercase tracking-wider text-sm hidden md:block">Connect</h3>
                            <div className="flex gap-4 mb-6 md:mb-0">
                                <div className="h-10 w-10 bg-black/10 rounded-full flex items-center justify-center hover:bg-black/20 transition-colors cursor-pointer group">
                                    <Facebook className="h-5 w-5 text-black transition-colors" />
                                </div>
                                <div className="h-10 w-10 bg-black/10 rounded-full flex items-center justify-center hover:bg-black/20 transition-colors cursor-pointer group">
                                    <Twitter className="h-5 w-5 text-black transition-colors" />
                                </div>
                                <div className="h-10 w-10 bg-black/10 rounded-full flex items-center justify-center hover:bg-black/20 transition-colors cursor-pointer group">
                                    <Instagram className="h-5 w-5 text-black transition-colors" />
                                </div>
                                <div className="h-10 w-10 bg-black/10 rounded-full flex items-center justify-center hover:bg-black/20 transition-colors cursor-pointer group">
                                    <Youtube className="h-5 w-5 text-black transition-colors" />
                                </div>
                            </div>
                            <p className="mt-6 text-xs text-black/60 italic font-medium">© 2026 Suqafuran. Buy. Sell. Connect.</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export { PublicLayout };
