import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { notificationService } from '../services/notificationService';
import type { Notification } from '../services/notificationService';
import {
    Bell, MessageCircle, CheckCircle, Info, Loader2, Clock, TrendingDown, Trash2
} from 'lucide-react';
import { Button } from '../components/Button';
import { cn } from '../utils/cn';
import { formatDistanceToNow } from 'date-fns';

const NotificationsPage: React.FC = () => {
    const { t } = useTranslation();
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

    const markAllReadMutation = useMutation({
        mutationFn: notificationService.markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => notificationService.deleteNotification(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'message': return <MessageCircle className="h-5 w-5 text-primary-500" />;
            case 'ad_approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'ad_posted': return <CheckCircle className="h-5 w-5 text-secondary-500" />;
            case 'price_drop': return <TrendingDown className="h-5 w-5 text-orange-500" />;
            default: return <Info className="h-5 w-5 text-primary-500" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('notifications.title')}</h1>
                    <p className="text-sm text-gray-500 mt-1">{t('notifications.subtitle')}</p>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary-600 font-bold hover:bg-primary-50 rounded-xl"
                    onClick={() => markAllReadMutation.mutate()}
                    isLoading={markAllReadMutation.isPending}
                    disabled={!notifications || notifications.every(n => n.is_read)}
                >
                    {t('notifications.markAllRead', 'Mark all as read')}
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
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('notifications.allCaughtUp')}</h3>
                        <p className="text-gray-500 max-w-xs mx-auto text-sm">{t('notifications.noNotifications')}</p>
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
                                        {notif.type === 'message' ? t('notifications.newMessage') :
                                            notif.type === 'ad_approved' ? t('notifications.adApproved') : 
                                            notif.type === 'ad_posted' ? t('notifications.adPosted', 'Ad Published') : t('notifications.update')}
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
                                <div className="w-2 h-2 bg-primary-300 rounded-full mt-2 shrink-0"></div>
                            )}

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteMutation.mutate(notif.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export { NotificationsPage };
