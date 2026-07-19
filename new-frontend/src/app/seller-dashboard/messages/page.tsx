"use client";

import React, { useState, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';
import api from '@/services/api';

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await api.get('/conversations?limit=50').catch(() => null);

      if (res?.data) {
        const convsList = Array.isArray(res.data) ? res.data : [];
        setConversations(convsList);

        if (convsList.length > 0) {
          setSelectedConversation(convsList[0]);
          loadMessages(convsList[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const res = await api.get(`/conversations/${conversationId}/messages?limit=50`).catch(() => null);

      if (res?.data) {
        setMessages(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSelectConversation = (conversation: any) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      await api.post(`/conversations/${selectedConversation.id}/messages`, {
        message: messageInput,
      });

      setMessageInput('');
      loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-orange-600" />
          <p className="text-gray-500 text-sm">Loading messages...</p>
        </div>
      </div>
    );
  }

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
            {conversations.length === 0 ? (
              <div className="p-4 text-gray-500 text-sm">No conversations yet</div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer ${
                    selectedConversation?.id === conv.id ? 'bg-gray-50 dark:bg-slate-800' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{conv.customer_name || 'Unknown'}</p>
                    {conv.unread_count > 0 && (
                      <span className="bg-orange-600 text-white text-xs rounded-full px-2 py-1">{conv.unread_count}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-slate-400 truncate">{conv.last_message || 'No messages'}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(conv.updated_at).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col">
          <div className="border-b border-gray-200 dark:border-slate-800 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {selectedConversation?.customer_name || 'Select a conversation'}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No messages yet
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender_type === 'seller' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`rounded-lg px-4 py-2 max-w-xs ${
                      msg.sender_type === 'seller'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-gray-200 dark:border-slate-800 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
              />
              <button
                onClick={handleSendMessage}
                className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
