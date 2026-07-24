"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Tag, TrendingDown, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface NotificationPreferences {
    email_messages: boolean;
    email_offers: boolean;
    email_price_drops: boolean;
    email_search_matches: boolean;
    email_order_updates: boolean;
    email_listings: boolean;
}

export default function NotificationSettingsPage() {
    const [prefs, setPrefs] = useState<NotificationPreferences>({
        email_messages: true,
        email_offers: true,
        email_price_drops: true,
        email_search_matches: true,
        email_order_updates: true,
        email_listings: true,
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [allEnabled, setAllEnabled] = useState(true);

    // Load preferences
    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const response = await fetch('/api/v1/notification-preferences/');
            const data = await response.json();
            setPrefs(data);
            const allOn = Object.values(data).every(v => v === true);
            setAllEnabled(allOn);
        } catch (error) {
            console.error('Failed to load preferences:', error);
        }
    };

    const handleToggle = async (key: keyof NotificationPreferences) => {
        const updated = { ...prefs, [key]: !prefs[key] };
        setPrefs(updated);
        await savePreferences(updated);
    };

    const savePreferences = async (updated: NotificationPreferences) => {
        setLoading(true);
        try {
            const response = await fetch('/api/v1/notification-preferences/', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
            });

            if (response.ok) {
                const allOn = Object.values(updated).every(v => v === true);
                setAllEnabled(allOn);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (error) {
            console.error('Failed to update preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnableAll = async () => {
        const enabled: NotificationPreferences = {
            email_messages: true,
            email_offers: true,
            email_price_drops: true,
            email_search_matches: true,
            email_order_updates: true,
            email_listings: true,
        };
        setPrefs(enabled);
        await fetch('/api/v1/notification-preferences/enable-all', { method: 'POST' });
        setAllEnabled(true);
    };

    const handleDisableAll = async () => {
        const disabled: NotificationPreferences = {
            email_messages: false,
            email_offers: false,
            email_price_drops: false,
            email_search_matches: false,
            email_order_updates: false,
            email_listings: false,
        };
        setPrefs(disabled);
        await fetch('/api/v1/notification-preferences/disable-all', { method: 'POST' });
        setAllEnabled(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
                <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Bell className="h-8 w-8 text-primary dark:text-sky-400" />
                        <h1 className="text-3xl font-black text-gray-900 dark:text-slate-100">Notification Settings</h1>
                    </div>
                    <p className="text-gray-600 dark:text-slate-400">Choose which marketplace events you want to receive via email</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Success Message */}
                {success && (
                    <div className="mb-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-green-800 dark:text-green-300">Settings saved successfully</span>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="mb-8 flex gap-3">
                    <button
                        onClick={handleEnableAll}
                        disabled={allEnabled || loading}
                        className="flex-1 py-2 px-4 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Enable All
                    </button>
                    <button
                        onClick={handleDisableAll}
                        disabled={!allEnabled || loading}
                        className="flex-1 py-2 px-4 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Disable All
                    </button>
                </div>

                {/* Notification Preferences Grid */}
                <div className="space-y-4">
                    {/* Messages */}
                    <NotificationToggle
                        icon={MessageSquare}
                        title="New Messages"
                        description="Get notified when someone messages you"
                        enabled={prefs.email_messages}
                        onChange={() => handleToggle('email_messages')}
                        loading={loading}
                    />

                    {/* Offers */}
                    <NotificationToggle
                        icon={ShoppingCart}
                        title="New Offers"
                        description="Receive notifications when buyers make offers on your listings"
                        enabled={prefs.email_offers}
                        onChange={() => handleToggle('email_offers')}
                        loading={loading}
                    />

                    {/* Price Drops */}
                    <NotificationToggle
                        icon={TrendingDown}
                        title="Price Drop Alerts"
                        description="Get alerted when items you're watching have price reductions"
                        enabled={prefs.email_price_drops}
                        onChange={() => handleToggle('email_price_drops')}
                        loading={loading}
                    />

                    {/* Search Matches */}
                    <NotificationToggle
                        icon={Mail}
                        title="Saved Search Alerts"
                        description="Receive updates when new listings match your saved searches"
                        enabled={prefs.email_search_matches}
                        onChange={() => handleToggle('email_search_matches')}
                        loading={loading}
                    />

                    {/* Order Updates */}
                    <NotificationToggle
                        icon={Tag}
                        title="Order Status Updates"
                        description="Track your orders with status change notifications"
                        enabled={prefs.email_order_updates}
                        onChange={() => handleToggle('email_order_updates')}
                        loading={loading}
                    />

                    {/* New Listings */}
                    <NotificationToggle
                        icon={Bell}
                        title="New Listings in Favorites"
                        description="Get notified about new items in your favorite categories"
                        enabled={prefs.email_listings}
                        onChange={() => handleToggle('email_listings')}
                        loading={loading}
                    />
                </div>

                {/* Info Box */}
                <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-xl">
                    <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">About Email Notifications</h3>
                            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                                You control which notifications you receive. All emails are sent to your registered email address.
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                Pro tip: You can always manage your saved searches and price watches from the listings page to control what notifications you receive.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="mt-8 flex justify-center">
                    <Link href="/settings" className="text-sm font-bold text-primary dark:text-sky-400 hover:underline">
                        ← Back to Settings
                    </Link>
                </div>
            </div>
        </div>
    );
}

interface NotificationToggleProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    enabled: boolean;
    onChange: () => void;
    loading: boolean;
}

function NotificationToggle({
    icon: Icon,
    title,
    description,
    enabled,
    onChange,
    loading,
}: NotificationToggleProps) {
    return (
        <div
            className={`p-4 rounded-xl border-2 transition-all ${
                enabled
                    ? 'border-primary dark:border-sky-400 bg-primary/5 dark:bg-sky-400/5'
                    : 'border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950'
            }`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <Icon className={`h-6 w-6 ${enabled ? 'text-primary dark:text-sky-400' : 'text-gray-400 dark:text-slate-600'}`} />
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-slate-100">{title}</h3>
                        <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">{description}</p>
                    </div>
                </div>
                <button
                    onClick={onChange}
                    disabled={loading}
                    className={`ml-4 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                        enabled
                            ? 'bg-primary text-white hover:bg-primary-dark'
                            : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {enabled ? 'On' : 'Off'}
                </button>
            </div>
        </div>
    );
}
