import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { feedbackService } from '../services/feedbackService';
import { useAuthStore } from '../store/useAuthStore';
import { Star, MessageSquare, ThumbsUp, User } from 'lucide-react';
import { cn } from '../utils/cn';
import { useTranslation } from 'react-i18next';

export const FeedbackPage: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    
    const { data: feedback, isLoading } = useQuery({
        queryKey: ['my-feedback', user?.id],
        queryFn: () => user ? feedbackService.getUserFeedback(user.id) : Promise.resolve([]),
        enabled: !!user
    });

    const averageRating = feedback?.length 
        ? (feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length).toFixed(1)
        : '0.0';

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('feedback.title', 'Your Feedback')}</h1>
                    <p className="text-gray-500 mt-1">{t('feedback.subtitle', 'See what buyers and sellers are saying about you.')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">{t('feedback.averageRating', 'Average Rating')}</p>
                    <div className="flex items-center justify-center gap-1 mb-2">
                        <span className="text-5xl font-black text-gray-900">{averageRating}</span>
                        <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                    </div>
                    <p className="text-xs text-gray-500">{t('feedback.basedOn', 'Based on {{count}} reviews', { count: feedback?.length || 0 })}</p>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center md:col-span-2 flex items-center justify-around">
                    <div className="space-y-1">
                        <ThumbsUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">100%</p>
                        <p className="text-xs text-gray-400 uppercase">{t('feedback.positive', 'Positive')}</p>
                    </div>
                    <div className="space-y-1">
                        <MessageSquare className="h-8 w-8 text-primary-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{feedback?.length || 0}</p>
                        <p className="text-xs text-gray-400 uppercase">{t('feedback.comments', 'Comments')}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                    <h3 className="font-bold text-gray-900">{t('feedback.recentReviews', 'Recent Reviews')}</h3>
                </div>

                <div className="divide-y divide-gray-50">
                    {isLoading ? (
                        <div className="p-20 text-center text-gray-400">{t('feedback.loading', 'Loading reviews...')}</div>
                    ) : !feedback || feedback.length === 0 ? (
                        <div className="p-20 text-center">
                            <MessageSquare className="h-16 w-16 text-gray-100 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">{t('feedback.noReviewsTitle', 'No reviews yet')}</h3>
                            <p className="text-gray-500 mt-2 max-w-xs mx-auto">{t('feedback.noReviewsDesc', 'Complete transactions to build your reputation on Suqafuran.')}</p>
                        </div>
                    ) : (
                        feedback.map((f) => (
                            <div key={f.id} className="p-6 flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-gray-900">{t('feedback.anonymous', 'Anonymous User')}</p>
                                        <div className="flex items-center gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={cn("h-3 w-3", i < f.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-200")} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">{f.comment}</p>
                                    <p className="text-[10px] text-gray-400 pt-2">{new Date(f.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
