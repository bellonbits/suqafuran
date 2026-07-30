"use client";

import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useRealtimeStore } from '../../store/useRealtime';

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const { events } = useRealtimeStore();
    const unreadCount = events.length;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                title="Notifications"
            >
                <Bell className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {Math.min(unreadCount, 9)}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-800 z-50 max-h-96 overflow-y-auto">
                        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {events.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-8 h-8 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 dark:text-slate-400">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-slate-800">
                                {events.slice(0, 10).map((event, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                    >
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white capitalize">
                                            {event.type.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 line-clamp-2">
                                            {(event.payload as Record<string, unknown>).message || 'New notification'}
                                        </p>
                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-2">
                                            {new Date(event.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
