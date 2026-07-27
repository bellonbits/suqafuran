import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, MessageSquare, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { sellerDashboardService } from '../../services/sellerDashboardService';
import { cn } from '../../utils/cn';


export const SellerReviewsPage: React.FC = () => {
  const qc = useQueryClient();
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [replyingId, setReplyingId] = useState<number | null>(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['seller-reviews'],
    queryFn: sellerDashboardService.getAllMyReviews,
    staleTime: 60_000,
  });

  const replyMutation = useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: number; reply: string }) =>
      api.post(`/feedback/feedback/${reviewId}/reply`, { reply }),
    onSuccess: () => {
      toast.success('Reply submitted');
      qc.invalidateQueries({ queryKey: ['seller-reviews'] });
      setReplyingId(null);
    },
    onError: () => toast.error('Failed to submit reply'),
  });

  const reportMutation = useMutation({
    mutationFn: (reviewId: number) =>
      api.post(`/feedback/feedback/${reviewId}/report`, { reason: 'fake_review' }),
    onSuccess: () => {
      toast.success('Review reported for moderation');
    },
    onError: () => toast.error('Failed to report review'),
  });

  const handleReplySubmit = (reviewId: number) => {
    const text = replyText[reviewId]?.trim();
    if (!text) return;
    replyMutation.mutate({ reviewId, reply: text });
  };

  const ratingsCount = reviews.reduce((acc, r) => {
    acc[r.rating] = (acc[r.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const totalReviews = reviews.length;
  const averageRating = totalReviews ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Reviews & Ratings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage and reply to customer product feedback</p>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-5xl font-black text-slate-900 leading-none">{averageRating.toFixed(1)}</p>
          <div className="flex gap-0.5 my-2">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={cn('w-5 h-5', s <= Math.round(averageRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200')} />
            ))}
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Average Rating</p>
          <p className="text-xs text-slate-400 mt-1">From {totalReviews} reviews</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm md:col-span-2 space-y-2.5">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">Rating Distribution</h3>
          {[5, 4, 3, 2, 1].map(stars => {
            const count = ratingsCount[stars] || 0;
            const pct = totalReviews ? (count / totalReviews) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-bold text-slate-600">{stars} Star</span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right font-semibold text-slate-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Feedback Feed</h3>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-sky-500" /></div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
            <Star className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-sm text-slate-500 font-bold">No feedback reviews yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={cn('w-3.5 h-3.5', s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-100 fill-slate-100')} />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(r.created_at).toLocaleDateString('en-KE')}</span>
                    </div>
                    {r.product_name && (
                      <p className="text-xs text-sky-600 font-bold mt-1.5">{r.product_name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => reportMutation.mutate(r.id)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-500 font-bold transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" /> Report Fake
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">{r.comment || 'No written comment'}</p>

                {/* Seller Reply */}
                {r.seller_reply ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-600">
                    <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-sky-500" /> Your Response:
                    </p>
                    <p>{r.seller_reply}</p>
                  </div>
                ) : (
                  <div>
                    {replyingId === r.id ? (
                      <div className="space-y-2 mt-3">
                        <textarea
                          value={replyText[r.id] || ''}
                          onChange={e => setReplyText({ ...replyText, [r.id]: e.target.value })}
                          placeholder="Write public response..."
                          className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => setReplyingId(null)} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>
                          <button onClick={() => handleReplySubmit(r.id)} className="px-3 py-1.5 text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-lg">Submit Reply</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingId(r.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-lg transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Reply to Review
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import api from '../../services/api';
