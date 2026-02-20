import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { notificationService } from '../services/notificationService';
import type { Notification } from '../services/notificationService';
import {
    Bell, MessageCircle,
    CheckCircle, Info, Loader2, Clock
} from 'lucide-react';
import { Button } from '../components/Button';
import { cn } from '../utils/cn';
import { formatDistanceToNow } from 'date-fns';

const NotificationsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { data: notifications, isLoading } = useQuery<Notification[]>({
        queryKey: ['notifications'],
        queryFn: notificationService.getMyNotifications,
    });

    const readMutation = useMutation({
        mutationFn: (id: number) => notificationService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'message': return <MessageCircle className="h-5 w-5 text-blue-500" />;
            case 'ad_approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'price_drop': return <TrendingDown className="h-5 w-5 text-orange-500" />;
            default: return <Info className="h-5 w-5 text-primary-500" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-sm text-gray-500 mt-1">Stay updated with your account activity.</p>
                </div>
                <Button variant="ghost" size="sm" className="text-primary-600 font-bold hover:bg-primary-50 rounded-xl">
                    Mark all as read
                </Button>
            </div>

            <div className="space-y-3 min-h-[400px]">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                    </div>
                ) : notifications?.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Bell className="h-10 w-10 text-gray-200" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h3>
                        <p className="text-gray-500 max-w-xs mx-auto text-sm">No new notifications at the moment. We'll let you know when something important happens.</p>
                    </div>
                ) : (
                    notifications?.map((notif) => (
                        <div
                            key={notif.id}
                            onClick={() => !notif.is_read && readMutation.mutate(notif.id)}
                            className={cn(
                                "p-5 rounded-2xl border transition-all cursor-pointer flex gap-4",
                                notif.is_read
                                    ? "bg-white border-gray-50 opacity-75"
                                    : "bg-white border-primary-100 shadow-sm ring-1 ring-primary-50"
                            )}
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                                notif.is_read ? "bg-gray-50" : "bg-primary-50"
                            )}>
                                {getIcon(notif.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={cn(
                                        "font-bold text-sm",
                                        notif.is_read ? "text-gray-600" : "text-gray-900"
                                    )}>
                                        {notif.type === 'message' ? 'New Message' :
                                            notif.type === 'ad_approved' ? 'Ad Approved' : 'Update'}
                                    </h3>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2">
                                    {notif.data?.message || 'You have a new update regarding your account activity.'}
                                </p>
                            </div>

                            {!notif.is_read && (
                                <div className="w-2 h-2 bg-blue-300 rounded-full mt-2 shrink-0"></div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// Helper for price drop icon since TrendingDown wasn't imported
const TrendingDown = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
);

export { NotificationsPage };
