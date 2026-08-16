"use client";

import React, { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Search, AlertCircle, ShoppingBag, ArrowLeft, MessageSquare, Loader } from 'lucide-react';
import api from '@/services/api';
import { listingsService } from '@/services/listings';
import { useChat } from '@/hooks/useChat';
import { useAuthStore } from '@/store/useAuth';
import type { ChatMessage, Listing } from '@/types';

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
    const [isUserTyping, setIsUserTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // The real auth token -- this used to read localStorage.getItem('access_token'),
    // a key nothing in the app ever writes to, so the socket never connected.
    const token = useAuthStore((s) => s.token) || '';

    // Initialize WebSocket connection
    const { isConnected, sendMessage: wssSendMessage, setTyping, onMessage, subscribeToUser, userStatus } = useChat(token);
    const isOtherUserOnline = userStatus?.id === selectedUserId && !!userStatus?.is_online;
    const isOtherUserTyping = userStatus?.id === selectedUserId && !!userStatus?.is_typing;

    // Load conversations from API
    useEffect(() => {
        let isFirstLoad = true;

        const loadConversations = async () => {
            try {
                // Only show the loading state for the very first fetch -- the
                // 30s background refresh below re-fetches silently so the list
                // doesn't visibly flash/reset while someone's reading it.
                if (isFirstLoad) setIsLoading(true);
                const response = await api.get('/messages/conversations');
                setConversations(response.data || []);
            } catch (error) {
                console.error('Failed to load conversations:', error);
                if (isFirstLoad) setConversations([]);
            } finally {
                if (isFirstLoad) {
                    setIsLoading(false);
                    isFirstLoad = false;
                }
            }
        };

        loadConversations();
        // Refresh conversations every 30 seconds
        const interval = setInterval(loadConversations, 30000);
        return () => clearInterval(interval);
    }, []);

    // Load shared product if present in parameters
    useEffect(() => {
        if (sharedProductId) {
            listingsService.getListing(sharedProductId)
                .then(setSharedProduct)
                .catch(err => console.error('Failed to load shared product details', err));
        }
    }, [sharedProductId]);

    // Handle initial target user from query params. Deliberately depends
    // only on targetUserId, not on `conversations` -- the mark-as-read
    // update and the 30s poll both give `conversations` a new array
    // reference on every cycle, and including it here used to re-run this
    // effect on every such refresh.
    useEffect(() => {
        if (!targetUserId) return;
        const targetIdNum = Number(targetUserId);
        setSelectedUserId(targetIdNum);

        // Always create/fetch stub for target user, even if conversations is empty
        if (!conversations.some(c => c.other_user_id === targetIdNum)) {
            api.get(`/sellers/${targetIdNum}`)
                .then(res => {
                    const seller = res.data;
                    const stubConv: Conversation = {
                        other_user_id: targetIdNum,
                        other_user_name: seller.business_name || seller.full_name || `Seller #${targetIdNum}`,
                        other_user_avatar: seller.avatar_url,
                        last_message: 'Start a new conversation...',
                        last_message_time: new Date().toISOString(),
                        unread_count: 0
                    };
                    setConversations(prev => [stubConv, ...prev]);
                })
                .catch(() => {
                    // Fallback: create stub with just user ID
                    const stubConv: Conversation = {
                        other_user_id: targetIdNum,
                        other_user_name: `User #${targetIdNum}`,
                        last_message: 'Start a new conversation...',
                        last_message_time: new Date().toISOString(),
                        unread_count: 0
                    };
                    setConversations(prev => [stubConv, ...prev]);
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetUserId]);

    // Default to the first conversation on desktop when nothing is selected
    // yet. Guarded on selectedUserId being null so this never fires again
    // once the user has picked a conversation -- without that guard, any
    // later `conversations` refresh (30s poll, mark-as-read update) would
    // re-run this and snap the selection straight back to the first
    // conversation, making clicking any other conversation appear to do
    // nothing.
    useEffect(() => {
        if (targetUserId || selectedUserId !== null || conversations.length === 0) return;
        if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
            setSelectedUserId(conversations[0].other_user_id);
        }
    }, [targetUserId, selectedUserId, conversations]);

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

        // Opening a conversation reads it -- clear the unread badge right
        // away instead of waiting on the next 30s conversations poll, and
        // tell the backend so it stays cleared on refresh/other devices.
        setConversations((prev) => prev.map((c) =>
            c.other_user_id === selectedUserId ? { ...c, unread_count: 0 } : c
        ));
        api.post(`/messages/${selectedUserId}/read`).catch((error) => {
            console.error('Failed to mark conversation as read:', error);
        });
    }, [selectedUserId]);

    // Join the per-conversation channel so the server's broadcasts (new
    // messages, typing, presence) actually reach this connection -- without
    // this, subscribing never happens and nothing arrives in real time
    // regardless of how the message handler below is wired.
    useEffect(() => {
        if (selectedUserId && isConnected) {
            subscribeToUser(selectedUserId);
        }
    }, [selectedUserId, isConnected, subscribeToUser]);

    // Handle incoming real-time messages. Re-registered whenever
    // selectedUserId changes so the closure always compares against the
    // conversation that's actually open right now.
    useEffect(() => {
        onMessage((message) => {
            if (selectedUserId && (message.sender_id === selectedUserId || message.receiver_id === selectedUserId)) {
                setMessages((prev) => [...prev, message]);
            }
            setConversations((prev) => prev.map((c) =>
                c.other_user_id === message.sender_id
                    ? { ...c, last_message: message.content, last_message_time: message.timestamp || new Date().toISOString() }
                    : c
            ));
        });
    }, [selectedUserId, onMessage]);

    // Handle typing indicator
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputText(value);

        if (!selectedUserId || !isConnected) return;

        // Send typing indicator
        if (value.trim() && !isUserTyping) {
            setIsUserTyping(true);
            setTyping(selectedUserId, true);
        }

        // Reset typing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Send stop typing after 1 second of inactivity
        if (value.trim()) {
            typingTimeoutRef.current = setTimeout(() => {
                setIsUserTyping(false);
                setTyping(selectedUserId, false);
            }, 1000);
        }
    };

    // Filter conversations by search query
    const filteredConversations = conversations.filter(conv =>
        (conv.other_user_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !selectedUserId) return;

        const text = inputText.trim();
        setInputText('');
        setIsUserTyping(false);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        try {
            setIsSending(true);

            // Send via HTTP first (to save to DB)
            const sendResponse = await api.post('/messages/', {
                receiver_id: selectedUserId,
                content: text
            });

            // Then broadcast via WebSocket for instant delivery
            if (isConnected) {
                wssSendMessage(text, selectedUserId);
            }

            // Reload messages after sending
            const response = await api.get(`/messages/${selectedUserId}`);
            setMessages(response.data || []);

            // Notify typing stopped
            if (isConnected) {
                setTyping(selectedUserId, false);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setInputText(text);
            alert('Failed to send message: ' + (error as any)?.message || 'Unknown error');
        } finally {
            setIsSending(false);
        }
    };

    const selectedConversation = conversations.find(c => c.other_user_id === selectedUserId);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 h-[calc(100vh-8rem)]">
            <div className="h-full rounded-[32px] overflow-hidden bg-white border border-gray-100 shadow-2xl dark:bg-neutral-950 dark:border-neutral-800 flex">

                {/* Conversations Left Panel */}
                <aside className={`${selectedUserId ? 'hidden md:flex' : 'flex'} w-full md:w-80 shrink-0 border-r border-gray-100 dark:border-neutral-800 flex-col h-full bg-slate-50/50 dark:bg-black/20`}>
                    <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-black text-gray-900 dark:text-neutral-50">Messages</h2>
                            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} title={isConnected ? 'Connected' : 'Disconnected'} />
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-2xl border border-gray-200 bg-white px-9 py-2 text-xs font-semibold outline-none focus:border-[#00a082] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
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
                                <MessageSquare className="h-8 w-8 text-gray-300 dark:text-neutral-200 mx-auto" />
                                <p className="text-xs text-gray-400 dark:text-neutral-400">No conversations yet</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-neutral-800/50">
                            {filteredConversations.map((conv) => (
                                <button
                                    key={conv.other_user_id}
                                    onClick={() => setSelectedUserId(conv.other_user_id)}
                                    className={`w-full p-4 flex gap-3 text-left transition-all ${selectedUserId === conv.other_user_id ? 'bg-white dark:bg-neutral-950' : 'hover:bg-white/50 dark:hover:bg-neutral-950/50'}`}
                                >
                                    {conv.other_user_avatar ? (
                                        <img
                                            src={conv.other_user_avatar}
                                            alt={conv.other_user_name}
                                            className="h-11 w-11 rounded-2xl object-cover shrink-0"
                                        />
                                    ) : (
                                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shrink-0 text-white font-black text-sm">
                                            {(conv.other_user_name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                                        <div className="flex justify-between items-start gap-2 min-w-0">
                                            <h4 className="text-xs font-black text-gray-900 dark:text-neutral-50 truncate">
                                                {conv.other_user_name || `User ${conv.other_user_id}`}
                                            </h4>
                                            {conv.last_message_time && (
                                                <span className="text-[9px] text-gray-400 dark:text-neutral-400 font-bold shrink-0 whitespace-nowrap">
                                                    {new Date(conv.last_message_time).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center gap-2 min-w-0">
                                            <p className="text-[11px] text-gray-400 dark:text-neutral-400 truncate font-semibold">
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
                <div className={`${selectedUserId ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-full bg-white dark:bg-neutral-950`}>
                    {selectedUserId && selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setSelectedUserId(null)} className="md:hidden -ml-1 mr-1 text-gray-400 hover:text-gray-700 dark:hover:text-neutral-100">
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>
                                    {selectedConversation.other_user_avatar ? (
                                        <img
                                            src={selectedConversation.other_user_avatar}
                                            alt={selectedConversation.other_user_name}
                                            className="h-10 w-10 rounded-2xl object-cover"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-xs">
                                            {(selectedConversation.other_user_name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-xs font-black text-gray-900 dark:text-neutral-50">
                                            {selectedConversation.other_user_name || `User ${selectedConversation.other_user_id}`}
                                        </h3>
                                        <p className="text-[10px] text-gray-500 dark:text-neutral-300">
                                            {isOtherUserTyping ? (
                                                <span className="flex items-center gap-1">
                                                    <span>typing</span>
                                                    <Loader className="h-3 w-3 animate-spin" />
                                                </span>
                                            ) : (
                                                <span>{isOtherUserOnline ? '🟢 Online' : '⚪ Offline'}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Chat History View */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40 dark:bg-black/10">
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
                                                <div className={`max-w-[70%] rounded-2xl p-4 space-y-2 shadow-sm ${msg.sender_id === selectedUserId ? 'bg-white border border-gray-100 text-gray-800 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-50 rounded-bl-none' : 'bg-[#00a082] text-white rounded-br-none'}`}>
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
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 dark:border-neutral-800 flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={inputText}
                                    onChange={handleInputChange}
                                    disabled={isSending}
                                    className="w-full rounded-2xl border border-gray-200 dark:border-neutral-800 bg-slate-50 dark:bg-black px-4 py-2.5 text-xs font-semibold outline-none focus:border-[#00a082] focus:bg-white dark:text-neutral-50 disabled:opacity-50"
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
                            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-gray-300 dark:bg-black dark:text-neutral-200">
                                <MessageSquare className="h-8 w-8" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-black text-gray-900 dark:text-neutral-50">No Conversation Selected</h3>
                                <p className="text-xs text-gray-400 dark:text-neutral-400 font-semibold max-w-xs leading-relaxed">
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
