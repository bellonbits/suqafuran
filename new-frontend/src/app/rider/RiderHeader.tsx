"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, DollarSign, TrendingUp, MessageSquare, Wallet, User } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

export default function RiderHeader() {
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);

    const navItems = [
        { href: '/rider', label: 'Dashboard', icon: Home },
        { href: '/rider/earnings', label: 'Earnings', icon: DollarSign },
        { href: '/rider/performance', label: 'Performance', icon: TrendingUp },
        { href: '/rider/messages', label: 'Messages', icon: MessageSquare },
        { href: '/rider/withdrawals', label: 'Withdrawals', icon: Wallet },
        { href: '/rider/account', label: 'Account', icon: User },
    ];

    return (
        <header className="rider-header">
            <div className="header-container">
                <div className="header-left">
                    <Link href="/rider" className="logo">
                        Suqafuran Rider
                    </Link>
                </div>

                <nav className="header-nav">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="header-right">
                    <span className="user-name">{user?.full_name || 'Rider'}</span>
                </div>
            </div>

            <style jsx>{`
                .rider-header {
                    background: white;
                    border-bottom: 1px solid #e5e7eb;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                }

                .header-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 1rem 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 2rem;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                }

                .logo {
                    font-size: 1.25rem;
                    font-weight: 900;
                    text-decoration: none;
                    color: #111827;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .header-nav {
                    display: flex;
                    gap: 0.5rem;
                    flex: 1;
                    justify-content: center;
                }

                .nav-link {
                    padding: 0.5rem 1rem;
                    text-decoration: none;
                    color: #6b7280;
                    font-weight: 500;
                    border-radius: 6px;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .nav-link:hover {
                    color: #111827;
                    background: #f3f4f6;
                }

                .nav-link.active {
                    color: #3b82f6;
                    background: #eff6ff;
                    font-weight: 600;
                }

                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .user-name {
                    font-weight: 600;
                    color: #111827;
                }

                @media (max-width: 768px) {
                    .header-container {
                        flex-wrap: wrap;
                        gap: 1rem;
                        padding: 1rem;
                    }

                    .header-nav {
                        width: 100%;
                        justify-content: flex-start;
                        gap: 0.25rem;
                        overflow-x: auto;
                    }

                    .nav-link {
                        padding: 0.5rem 0.75rem;
                        font-size: 0.875rem;
                    }

                    .logo {
                        font-size: 1rem;
                    }

                    .user-name {
                        display: none;
                    }
                }
            `}</style>
        </header>
    );
}
