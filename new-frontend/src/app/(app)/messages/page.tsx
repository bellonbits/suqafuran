"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, CheckCheck, Phone, Video, Search, MessageSquare, AlertCircle, ShoppingBag, ArrowLeft } from 'lucide-react';
import { businessService } from '../../../services/business';
import { listingsService } from '../../../services/listings';
import type { ChatMessage, Listing } from '../../../types';

interface Contact {
    id: number;
    name: string;
    avatar: string;
    lastMessage: string;
    time: string;
    unreadCount: number;
    isOnline: boolean;
}

function MessagesPageContent() {
    const searchParams = useSearchParams();
    const targetUserId = searchParams.get('userId');
    const sharedProductId = searchParams.get('productId');

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [sharedProduct, setSharedProduct] = useState<Listing | null>(null);
    const [isLoadingChats, setIsLoadingChats] = useState(false);

    // Initial mock contacts matching WhatsApp structure
    useEffect(() => {
        setContacts([
            {
                id: 105,
                name: 'Ahmed Liban (Sneaker Store)',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
                lastMessage: 'Sure, we can arrange delivery to Mogadishu tomorrow morning.',
                time: '10:42 AM',
                unreadCount: 1,
                isOnline: true
            },
            {
                id: 106,
                name: 'Halima Express Store',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
                lastMessage: 'Your order is being prepared. ETA 20 mins!',
                time: 'Yesterday',
                unreadCount: 0,
                isOnline: false
            },
            {
                id: 107,
                name: 'Garaad Tech',
                avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200&auto=format&fit=crop',
                lastMessage: 'Is the price negotiable for the laptop charger?',
                time: '2 days ago',
                unreadCount: 0,
                isOnline: false
            }
        ]);
    }, []);

    // Load shared product if present in parameters
    useEffect(() => {
        if (sharedProductId) {
            listingsService.getListing(sharedProductId)
                .then(setSharedProduct)
                .catch(err => console.error('Failed to load shared product details', err));
        }
    }, [sharedProductId]);

    // Handle initial target contact from query params
    useEffect(() => {
        if (targetUserId && contacts.length > 0) {
            const contact = contacts.find(c => c.id === Number(targetUserId));
            if (contact) {
                setSelectedContact(contact);
            } else {
                // If contact is not in list, add it
                const newContact: Contact = {
                    id: Number(targetUserId),
                    name: 'Ahmed Liban',
                    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
                    lastMessage: 'Starting connection...',
                    time: 'Now',
                    unreadCount: 0,
                    isOnline: true
                };
                setContacts(prev => [newContact, ...prev]);
                setSelectedContact(newContact);
            }
        } else if (contacts.length > 0 && !selectedContact && typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
            // Only auto-open the first conversation on desktop's two-pane layout —
            // on mobile this would skip the list view entirely on first load.
            setSelectedContact(contacts[0]);
        }
    }, [targetUserId, contacts]);

    // Load messages when contact changes
    useEffect(() => {
        if (!selectedContact) return;

        setIsLoadingChats(true);
        // Replicate fetching messages
        businessService.getCustomerChatHistory('mock-business-id', selectedContact.id)
            .then(data => {
                setMessages(data);
            })
            .catch(() => {
                // Seed mock chat list if endpoint error (common when no active auth)
                const mockMessages: ChatMessage[] = [
                    {
                        id: 1,
                        sender_id: selectedContact.id,
                        content: `Hello! Welcome to ${selectedContact.name}. How can we assist you today?`,
                        is_read: true,
                        created_at: new Date(Date.now() - 3600000).toISOString()
                    },
                    {
                        id: 2,
                        sender_id: 999, // current user
                        content: 'Hi! I am interested in your listing.',
                        is_read: true,
                        created_at: new Date(Date.now() - 1800000).toISOString()
                    }
                ];

                // Append shared product if present
                if (sharedProduct && selectedContact.id === 105) {
                    mockMessages.push({
                        id: 3,
                        sender_id: 999,
                        content: 'Sharing listing details:',
                        is_read: true,
                        created_at: new Date().toISOString(),
                        product_shared: sharedProduct
                    });
                }

                setMessages(mockMessages);
            })
            .finally(() => {
                setIsLoadingChats(false);
            });
    }, [selectedContact, sharedProduct]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !selectedContact) return;

        const text = inputText.trim();
        setInputText('');

        const newMsg: ChatMessage = {
            id: Date.now(),
            sender_id: 999,
            content: text,
            is_read: false,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, newMsg]);

        try {
            await businessService.sendCustomerChatMessage('mock-business-id', selectedContact.id, text);
        } catch (err) {
            console.error('Send message simulation complete', err);
        }
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 h-[calc(100vh-8rem)]">
            <div className="h-full rounded-[32px] overflow-hidden bg-white border border-gray-100 shadow-2xl dark:bg-slate-900 dark:border-slate-800 flex">
                
                {/* Conversations Left Panel */}
                <aside className={`${selectedContact ? 'hidden md:flex' : 'flex'} w-full md:w-80 shrink-0 border-r border-gray-100 dark:border-slate-800 flex-col h-full bg-slate-50/50 dark:bg-slate-950/20`}>
                    <div className="p-4 space-y-3">
                        <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Chats</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Search conversations..."
                                className="w-full rounded-2xl border border-gray-200 bg-white px-9 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/50">
                        {contacts.map((contact) => (
                            <button
                                key={contact.id}
                                onClick={() => setSelectedContact(contact)}
                                className={`w-full p-4 flex gap-3 text-left transition-all ${selectedContact?.id === contact.id ? 'bg-white dark:bg-slate-900' : 'hover:bg-white/50 dark:hover:bg-slate-900/50'}`}
                            >
                                <div className="relative shrink-0">
                                    <img src={contact.avatar} alt={contact.name} className="h-11 w-11 rounded-2xl object-cover" />
                                    {contact.isOnline && (
                                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-accent border-2 border-white dark:border-slate-900" />
                                    )}
                                </div>
                                <div className="overflow-hidden flex-1 flex flex-col justify-between py-0.5">
                                    <div className="flex justify-between items-baseline gap-2">
                                        <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">{contact.name}</h4>
                                        <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold shrink-0">{contact.time}</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-2">
                                        <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate font-semibold">{contact.lastMessage}</p>
                                        {contact.unreadCount > 0 && (
                                            <span className="h-4 min-w-4 px-1 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center shrink-0">
                                                {contact.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Conversation Right Panel */}
                <div className={`${selectedContact ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-full bg-white dark:bg-slate-900`}>
                    {selectedContact ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setSelectedContact(null)} className="md:hidden -ml-1 mr-1 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200">
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>
                                    <img src={selectedContact.avatar} alt={selectedContact.name} className="h-10 w-10 rounded-2xl object-cover" />
                                    <div>
                                        <h3 className="text-xs font-black text-gray-900 dark:text-slate-100">{selectedContact.name}</h3>
                                        <span className="text-[9px] font-bold text-accent">
                                            {selectedContact.isOnline ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-gray-400">
                                    <button className="hover:text-primary"><Phone className="h-4.5 w-4.5" /></button>
                                    <button className="hover:text-primary"><Video className="h-4.5 w-4.5" /></button>
                                </div>
                            </div>

                            {/* Chat History View */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40 dark:bg-slate-950/10">
                                {isLoadingChats ? (
                                    <div className="text-center py-8 text-xs text-gray-400">Loading conversation history...</div>
                                ) : (
                                    messages.map((msg) => {
                                        const isCurrentUser = msg.sender_id === 999;
                                        return (
                                            <div 
                                                key={msg.id}
                                                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[70%] rounded-2xl p-4 space-y-2 shadow-sm ${isCurrentUser ? 'bg-primary text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-bl-none'}`}>
                                                    <p className="text-xs font-semibold leading-relaxed break-words">{msg.content}</p>

                                                    {/* Shared Product Preview Attachment Card */}
                                                    {msg.product_shared && (
                                                        <div className="mt-2 p-2 bg-white/10 dark:bg-slate-950/40 border border-white/15 rounded-xl flex gap-2">
                                                            <img 
                                                                src={msg.product_shared.images?.[0]} 
                                                                alt="" 
                                                                className="h-12 w-12 rounded-lg object-cover shrink-0" 
                                                            />
                                                            <div className="overflow-hidden flex flex-col justify-between py-0.5">
                                                                <span className="text-[10px] font-black truncate block">{msg.product_shared.title_en}</span>
                                                                <span className="text-[11px] font-bold text-accent dark:text-sky-400">
                                                                    {msg.product_shared.currency} {msg.product_shared.price}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-end gap-1.5 pt-0.5">
                                                        <span className="text-[8px] opacity-75 font-semibold">
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {isCurrentUser && (
                                                            <CheckCheck className="h-3 w-3 opacity-90" />
                                                        )}
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
                                    className="w-full rounded-2xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary focus:bg-white dark:text-slate-100"
                                />
                                <button
                                    type="submit"
                                    className="btn-premium p-2.5 bg-primary text-white rounded-2xl shadow hover:bg-primary-dark cursor-pointer shrink-0"
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
                                <h3 className="text-sm font-black text-gray-900 dark:text-slate-100 font-poppins">No Chat Selected</h3>
                                <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold max-w-xs leading-relaxed">
                                    Choose a conversation from the sidebar or click "Chat Seller" from a listing details page to start.
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
