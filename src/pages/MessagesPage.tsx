import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { messageService } from '../services/messageService';
import type { Message } from '../services/messageService';
import {
    MessageCircle, Send, Search,
    User, MoreVertical, Loader2, ArrowLeft,
    ShieldCheck
} from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { cn } from '../utils/cn';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';
import { format } from 'date-fns';

const MessagesPage: React.FC = () => {
    const { user: currentUser } = useAuthStore();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const queryUser = searchParams.get('user');
    const queryListing = searchParams.get('listing');

    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [newMessage, setNewMessage] = useState('');

    const { data: conversations, isLoading: loadingConfs } = useQuery({
        queryKey: ['conversations'],
        queryFn: messageService.getConversations,
    });

    // Resolve query user info if starting a new chat
    const { data: resolvedUser } = useQuery({
        queryKey: ['public-user', queryUser],
        queryFn: () => authService.getUserPublicInfo(Number(queryUser)),
        enabled: !!queryUser && !conversations?.find((c: any) => c.other_user_id === Number(queryUser)),
    });

    useEffect(() => {
        if (queryUser && conversations) {
            const existing = conversations.find((c: any) => c.other_user_id === Number(queryUser));
            if (existing) {
                setSelectedChat(existing);
            } else if (resolvedUser) {
                // Temporary chat state for brand new interaction
                setSelectedChat({
                    other_user_id: resolvedUser.id,
                    other_user_name: resolvedUser.full_name,
                    is_verified: resolvedUser.is_verified,
                    listing_id: queryListing ? Number(queryListing) : null,
                    is_new: true
                });
            }
        }
    }, [queryUser, conversations, resolvedUser, queryListing]);

    const { data: messages, isLoading: loadingMsgs } = useQuery({
        queryKey: ['messages', selectedChat?.other_user_id],
        queryFn: () => messageService.getConversation(selectedChat?.other_user_id),
        enabled: !!selectedChat?.other_user_id,
    });

    const sendMutation = useMutation({
        mutationFn: (data: any) => messageService.sendMessage(data),
        onSuccess: () => {
            setNewMessage('');
            if (selectedChat?.other_user_id) {
                queryClient.invalidateQueries({ queryKey: ['messages', selectedChat.other_user_id] });
            }
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
    });

    const handleSend = () => {
        if (!newMessage.trim() || !selectedChat?.other_user_id) return;
        sendMutation.mutate({
            receiver_id: selectedChat.other_user_id,
            content: newMessage,
            listing_id: selectedChat.listing_id
        });
    };

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-12rem)] bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex">
                {/* Sidebar */}
                <div className={cn(
                    "w-full md:w-80 border-r border-gray-100 flex flex-col shrink-0 transition-all",
                    selectedChat ? "hidden md:flex" : "flex"
                )}>
                    <div className="p-4 border-b border-gray-50">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
                        <div className="relative">
                            <Input
                                placeholder="Search conversations..."
                                className="rounded-xl pl-10"
                            />
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loadingConfs ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-600" /></div>
                        ) : conversations?.length === 0 ? (
                            <div className="p-8 text-center">
                                <MessageCircle className="h-12 w-12 text-gray-100 mx-auto mb-4" />
                                <p className="text-sm text-gray-400">No conversations yet.</p>
                            </div>
                        ) : (
                            conversations?.map((conv: any) => (
                                <div
                                    key={conv.other_user_id}
                                    onClick={() => setSelectedChat(conv)}
                                    className={cn(
                                        "p-4 flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4",
                                        selectedChat?.other_user_id === conv.other_user_id
                                            ? "bg-primary-50/30 border-primary-500"
                                            : "border-transparent"
                                    )}
                                >
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                                        <User className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-1 min-w-0">
                                                <h4 className="font-bold text-sm text-gray-900 truncate">{conv.other_user_name || 'User'}</h4>
                                                {conv.is_verified && <ShieldCheck className="h-3 w-3 text-primary-600 shrink-0" />}
                                            </div>
                                            <span className="text-[10px] text-gray-400 uppercase font-bold">14:20</span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{conv.last_message}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={cn(
                    "flex-1 flex flex-col bg-gray-50/30",
                    !selectedChat ? "hidden md:flex" : "flex"
                )}>
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedChat(null)}
                                        className="md:hidden p-2 -ml-2 hover:bg-gray-50 rounded-full"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>
                                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center border border-primary-100">
                                        <User className="h-5 w-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1">
                                            <h4 className="font-bold text-sm text-gray-900">{selectedChat.other_user_name || 'User'}</h4>
                                            {selectedChat.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-primary-600 shrink-0" />}
                                        </div>
                                        <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</span>
                                    </div>
                                </div>
                                <button className="p-2 hover:bg-gray-50 rounded-full text-gray-400 transition-colors">
                                    <MoreVertical className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
                                {loadingMsgs ? (
                                    <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-primary-600" /></div>
                                ) : (
                                    messages?.map((msg: Message) => (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "max-w-[80%] p-4 rounded-2xl text-sm shadow-sm",
                                                msg.sender_id === currentUser?.id
                                                    ? "bg-primary-600 text-white self-end rounded-br-none"
                                                    : "bg-white text-gray-900 self-start rounded-bl-none border border-gray-100"
                                            )}
                                        >
                                            <p className="leading-relaxed">{msg.content}</p>
                                            <p className={cn(
                                                "text-[9px] mt-2 font-medium opacity-70",
                                                msg.sender_id === currentUser?.id ? "text-right" : "text-left"
                                            )}>
                                                {format(new Date(msg.created_at), 'HH:mm')}
                                            </p>
                                        </div>
                                    ))
                                )}
                                {sendMutation.isPending && (
                                    <div className="bg-primary-600/50 text-white self-end p-4 rounded-2xl rounded-br-none text-sm animate-pulse">
                                        Sending...
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-gray-100">
                                <div className="flex gap-2">
                                    <Input
                                        className="rounded-2xl flex-1 bg-gray-50 border-transparent focus:bg-white"
                                        placeholder="Type your message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    />
                                    <Button
                                        className="rounded-2xl w-12 h-12 p-0 flex items-center justify-center shadow-lg transform active:scale-95 transition-all"
                                        onClick={handleSend}
                                        disabled={!newMessage.trim() || sendMutation.isPending}
                                    >
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mb-6">
                                <MessageCircle className="h-12 w-12 text-primary-200" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Select a Conversation</h3>
                            <p className="text-gray-400 max-w-sm">Choose a chat from the left or contact a seller directly from an ad page.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export { MessagesPage };
