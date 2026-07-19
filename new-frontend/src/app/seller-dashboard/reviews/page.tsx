"use client";

import React from 'react';
import { Star } from 'lucide-react';

export default function ReviewsPage() {
  const reviews = [
    { id: 1, customer: 'Ahmed Mohamed', rating: 5, comment: 'Excellent product and fast delivery!', date: '2 days ago' },
    { id: 2, customer: 'Zainab Ali', rating: 4, comment: 'Good quality but took longer than expected', date: '4 days ago' },
    { id: 3, customer: 'Fatima Hassan', rating: 5, comment: 'Perfect! Exactly as described', date: '1 week ago' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reviews</h1>
        <p className="text-gray-600 dark:text-slate-400">Manage customer reviews and ratings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Average Rating</p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">4.8</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Reviews</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">342</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">5 Star Reviews</p>
          <p className="text-2xl font-bold text-green-600">280</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Response Rate</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">95%</p>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{review.customer}</p>
                <div className="flex gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-orange-500 fill-orange-500' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500">{review.date}</p>
            </div>
            <p className="text-gray-700 dark:text-slate-300 text-sm">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
