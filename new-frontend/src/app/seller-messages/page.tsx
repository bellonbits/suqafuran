"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Search, ArrowLeft, Clock, Loader } from 'lucide-react';
import api from '@/services/api';

export default function SellerMessagesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId: number) => {
    try {
      const res = await api.get(`/messages/${userId}`);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSelectChat = (userId: number) => {
    setSelectedChat(userId);
    loadMessages(userId);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return;

    try {
      await api.post(`/messages/${selectedChat}`, {
        content: messageText,
      });
      setMessageText('');
      loadMessages(selectedChat);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6cd4ff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <div className="w-96 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/seller-dashboard" className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <h1 className="text-2xl font-black text-white">Messages</h1>
            <span className="ml-auto px-2 py-1 bg-red-500 text-white rounded-full text-xs font-bold">
              {conversations.length}
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-[#6cd4ff]"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-slate-400">No conversations</div>
          ) : (
            conversations.map((conv) => (
              <motion.button
                key={conv.other_user.id}
                onClick={() => handleSelectChat(conv.other_user.id)}
                className={`w-full p-4 border-b border-slate-700 text-left transition-colors ${
                  selectedChat === conv.other_user.id ? 'bg-slate-700' : 'hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#5bc0e8] flex items-center justify-center text-white font-bold">
                    {conv.other_user.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white">{conv.other_user.full_name}</h3>
                    <p className="text-sm text-slate-400 truncate">{conv.last_message || '—'}</p>
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-900">
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-slate-700 bg-slate-800">
              <h2 className="text-xl font-black text-white">
                {conversations.find(c => c.other_user.id === selectedChat)?.other_user.full_name}
              </h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender_id !== selectedChat ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.sender_id !== selectedChat
                        ? 'bg-[#5bc0e8] text-white'
                        : 'bg-slate-700 text-slate-100'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <span className="text-xs opacity-75 mt-1 block">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-slate-700 bg-slate-800">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-[#6cd4ff]"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-[#5bc0e8] hover:bg-sky-700 text-white rounded-lg transition-colors"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p className="text-lg font-medium">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
