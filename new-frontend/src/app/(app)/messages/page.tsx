"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Search, AlertCircle, ShoppingBag, ArrowLeft, MessageSquare } from 'lucide-react';
import api from '../../../services/api';
import { listingsService } from '../../../services/listings';
import type { ChatMessage, Listing } from '../../../types';

interface Conversation {
    other_user_id: number;
    other_user_name?: string;
    other_user_avatar?: string;
    last_message?: string;
    last_message_time?: string;
    unread_count?: number;
}

function MessagesPageContent() {
    const searchParams = useSearchParams();
    const targetUserId = searchParams.get('userId');
    const sharedProductId = searchParams.get('productId');

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [sharedProduct, setSharedProduct] = useState<Listing | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Load conversations from API
    useEffect(() => {
        const loadConversations = async () => {
            try {
                setIsLoading(true);
                const response = await api.get('/messages/conversations');
                setConversations(response.data || []);
            } catch (error) {
                console.error('Failed to load conversations:', error);
                setConversations([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadConversations();
    }, []);

    // Load shared product if present in parameters
    useEffect(() => {
        if (sharedProductId) {
            listingsService.getListing(sharedProductId)
                .then(setSharedProduct)
                .catch(err => console.error('Failed to load shared product details', err));
        }
    }, [sharedProductId]);

    // Handle initial target user from query params
    useEffect(() => {
        if (targetUserId) {
            setSelectedUserId(Number(targetUserId));
        } else if (conversations.length > 0 && !selectedUserId && typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
            setSelectedUserId(conversations[0].other_user_id);
        }
    }, [targetUserId, conversations, selectedUserId]);

    // Load messages when selected user changes
    useEffect(() => {
        if (!selectedUserId) return;

        const loadMessages = async () => {
            try {
                setIsLoading(true);
                const response = await api.get(`/messages/${selectedUserId}`);
                setMessages(response.data || []);
            } catch (error) {
                console.error('Failed to load messages:', error);
                setMessages([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadMessages();
    }, [selectedUserId]);

    // Filter conversations by search query
    const filteredConversations = conversations.filter(conv =>
        (conv.other_user_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !selectedUserId) return;

        const text = inputText.trim();
        setInputText('');

        try {
            setIsSending(true);
            await api.post('/messages/', {
                receiver_id: selectedUserId,
                content: text
            });

            // Reload messages after sending
            const response = await api.get(`/messages/${selectedUserId}`);
            setMessages(response.data || []);
        } catch (error) {
            console.error('Failed to send message:', error);
            inputText !== '' && setInputText(text);
        } finally {
            setIsSending(false);
        }
    };

    const selectedConversation = conversations.find(c => c.other_user_id === selectedUserId);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 h-[calc(100vh-8rem)]">
            <div className="h-full rounded-[32px] overflow-hidden bg-white border border-gray-100 shadow-2xl dark:bg-slate-900 dark:border-slate-800 flex">

                {/* Conversations Left Panel */}
                <aside className={`${selectedUserId ? 'hidden md:flex' : 'flex'} w-full md:w-80 shrink-0 border-r border-gray-100 dark:border-slate-800 flex-col h-full bg-slate-50/50 dark:bg-slate-950/20`}>
                    <div className="p-4 space-y-3">
                        <h2 className="text-base font-black text-gray-900 dark:text-slate-100">Messages</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-2xl border border-gray-200 bg-white px-9 py-2 text-xs font-semibold outline-none focus:border-[#00a082] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
                            Loading conversations...
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-center p-4">
                            <div className="space-y-2">
                                <MessageSquare className="h-8 w-8 text-gray-300 dark:text-slate-700 mx-auto" />
                                <p className="text-xs text-gray-400 dark:text-slate-500">No conversations yet</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/50">
                            {filteredConversations.map((conv) => (
                                <button
                                    key={conv.other_user_id}
                                    onClick={() => setSelectedUserId(conv.other_user_id)}
                                    className={`w-full p-4 flex gap-3 text-left transition-all ${selectedUserId === conv.other_user_id ? 'bg-white dark:bg-slate-900' : 'hover:bg-white/50 dark:hover:bg-slate-900/50'}`}
                                >
                                    <img
                                        src={conv.other_user_avatar || 'https://via.placeholder.com/44'}
                                        alt={conv.other_user_name}
                                        className="h-11 w-11 rounded-2xl object-cover shrink-0"
                                    />
                                    <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                                        <div className="flex justify-between items-start gap-2 min-w-0">
                                            <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">
                                                {conv.other_user_name || `User ${conv.other_user_id}`}
                                            </h4>
                                            {conv.last_message_time && (
                                                <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold shrink-0 whitespace-nowrap">
                                                    {new Date(conv.last_message_time).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center gap-2 min-w-0">
                                            <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate font-semibold">
                                                {conv.last_message || 'No messages yet'}
                                            </p>
                                            {(conv.unread_count ?? 0) > 0 && (
                                                <span className="h-4 min-w-4 px-1 rounded-full bg-[#00a082] text-white text-[9px] font-black flex items-center justify-center shrink-0">
                                                    {conv.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </aside>

                {/* Conversation Right Panel */}
                <div className={`${selectedUserId ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-full bg-white dark:bg-slate-900`}>
                    {selectedUserId && selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setSelectedUserId(null)} className="md:hidden -ml-1 mr-1 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200">
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>
                                    <img
                                        src={selectedConversation.other_user_avatar || 'https://via.placeholder.com/40'}
                                        alt={selectedConversation.other_user_name}
                                        className="h-10 w-10 rounded-2xl object-cover"
                                    />
                                    <div>
                                        <h3 className="text-xs font-black text-gray-900 dark:text-slate-100">
                                            {selectedConversation.other_user_name || `User ${selectedConversation.other_user_id}`}
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            {/* Chat History View */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40 dark:bg-slate-950/10">
                                {isLoading ? (
                                    <div className="text-center py-8 text-xs text-gray-400">Loading messages...</div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center py-8 text-xs text-gray-400">No messages yet. Start the conversation!</div>
                                ) : (
                                    messages.map((msg) => {
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.sender_id === selectedUserId ? 'justify-start' : 'justify-end'}`}
                                            >
                                                <div className={`max-w-[70%] rounded-2xl p-4 space-y-2 shadow-sm ${msg.sender_id === selectedUserId ? 'bg-white border border-gray-100 text-gray-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-bl-none' : 'bg-[#00a082] text-white rounded-br-none'}`}>
                                                    <p className="text-xs font-semibold leading-relaxed break-words">{msg.content}</p>
                                                    <div className="flex items-center justify-end gap-1.5 pt-0.5">
                                                        <span className="text-[8px] opacity-75 font-semibold">
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Chat Input form */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 dark:border-slate-800 flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    disabled={isSending}
                                    className="w-full rounded-2xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#00a082] focus:bg-white dark:text-slate-100 disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={isSending || !inputText.trim()}
                                    className="p-2.5 bg-[#00a082] text-white rounded-2xl shadow hover:bg-[#008f73] cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="h-4.5 w-4.5" />
                                </button>
                            </form>
                        </>
                    ) : (
                        /* Empty state */
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 bg-slate-50/20">
                            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 dark:bg-slate-950 dark:text-slate-700">
                                <MessageSquare className="h-8 w-8" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-black text-gray-900 dark:text-slate-100">No Conversation Selected</h3>
                                <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold max-w-xs leading-relaxed">
                                    Select a conversation from the sidebar or start a new message.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Messages...</div>}>
            <MessagesPageContent />
        </Suspense>
    );
}
