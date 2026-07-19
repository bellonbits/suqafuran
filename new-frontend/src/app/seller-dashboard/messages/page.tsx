"use client";

import React from 'react';
import { Send } from 'lucide-react';

export default function MessagesPage() {
  const conversations = [
    { id: 1, customer: 'Ahmed Mohamed', lastMessage: 'Is this item still available?', time: '2 hours ago', unread: 2 },
    { id: 2, customer: 'Zainab Ali', lastMessage: 'Thank you for the quick delivery!', time: '4 hours ago', unread: 0 },
    { id: 3, customer: 'Fatima Hassan', lastMessage: 'Do you have this in blue?', time: '1 day ago', unread: 1 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Messages</h1>
        <p className="text-gray-600 dark:text-slate-400">Chat with your customers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-slate-800 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Conversations</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-slate-800">
            {conversations.map((conv) => (
              <div key={conv.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{conv.customer}</p>
                  {conv.unread > 0 && <span className="bg-orange-600 text-white text-xs rounded-full px-2 py-1">{conv.unread}</span>}
                </div>
                <p className="text-xs text-gray-600 dark:text-slate-400 truncate">{conv.lastMessage}</p>
                <p className="text-xs text-gray-500 mt-1">{conv.time}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col">
          <div className="border-b border-gray-200 dark:border-slate-800 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Ahmed Mohamed</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex justify-end">
              <div className="bg-orange-600 text-white rounded-lg px-4 py-2 max-w-xs">
                <p className="text-sm">Hi, do you have this item?</p>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg px-4 py-2 max-w-xs">
                <p className="text-sm">Yes, we have 5 units in stock</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-slate-800 p-4">
            <div className="flex gap-2">
              <input type="text" placeholder="Type a message..." className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white" />
              <button className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
