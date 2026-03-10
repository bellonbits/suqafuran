import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PublicLayout } from '../layouts/PublicLayout';
import { messageService } from '../services/messageService';
import type { Conversation, Message } from '../services/messageService';
import { useAuthStore } from '../store/useAuthStore';
import { getImageUrl } from '../utils/imageUtils';
import { cn } from '../utils/cn';
import {
    Send, ArrowLeft, MessageSquare, Loader2, User, Search,
} from 'lucide-react';

const formatTime = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return 'now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
    if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const Avatar: React.FC<{ name: string; avatarUrl?: string | null; size?: 'sm' | 'md' | 'lg' }> = ({
    name, avatarUrl, size = 'md',
}) => {
    const sizeClass = size === 'sm' ? 'w-9 h-9 text-sm' : size === 'lg' ? 'w-14 h-14 text-xl' : 'w-11 h-11 text-base';
    return (
        <div className={cn('rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold overflow-hidden shrink-0', sizeClass)}>
            {avatarUrl
                ? <img src={getImageUrl(avatarUrl)} alt={name} className="w-full h-full object-cover" />
                : <span>{name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}</span>}
        </div>
    );
};

const ConversationList: React.FC<{
    conversations: Conversation[];
    activeId: number | null;
    onSelect: (c: Conversation) => void;
    search: string;
    onSearch: (v: string) => void;
}> = ({ conversations, activeId, onSelect, search, onSearch }) => {
    const { t } = useTranslation();
    const filtered = conversations.filter(c =>
        c.other_user_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.last_message?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full">
            {/* Search */}
            <div className="px-3 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 h-9">
                    <Search className="h-4 w-4 text-gray-400 shrink-0" />
                    <input
                        value={search}
                        onChange={e => onSearch(e.target.value)}
                        placeholder={t('nav.search')}
                        className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                        <MessageSquare className="w-10 h-10 opacity-30" />
                        <p className="text-sm">{t('messages.noConversations')}</p>
                    </div>
                )}
                {filtered.map(conv => (
                    <button
                        key={conv.other_user_id}
                        onClick={() => onSelect(conv)}
                        className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50',
                            activeId === conv.other_user_id && 'bg-primary-50 border-l-4 border-l-primary-500'
                        )}
                    >
                        <div className="relative">
                            <Avatar name={conv.other_user_name} avatarUrl={conv.other_user_avatar} />
                            {conv.unread_count > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-secondary-500 text-white text-[10px] font-bold flex items-center justify-center">
                                    {conv.unread_count > 9 ? '9+' : conv.unread_count}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <p className={cn('text-sm truncate', conv.unread_count > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-800')}>
                                    {conv.other_user_name || t('messages.unknownUser')}
                                </p>
                                <span className="text-[10px] text-gray-400 shrink-0 ml-2">{formatTime(conv.last_message_at)}</span>
                            </div>
                            <p className={cn('text-xs truncate', conv.unread_count > 0 ? 'text-gray-700 font-medium' : 'text-gray-400')}>
                                {conv.last_message || '…'}
                            </p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

const ChatView: React.FC<{
    conversation: Conversation;
    currentUserId: number;
    onBack: () => void;
}> = ({ conversation, currentUserId, onBack }) => {
    const { t } = useTranslation();
    const qc = useQueryClient();
    const [text, setText] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const { data: messages = [], isLoading } = useQuery<Message[]>({
        queryKey: ['messages', conversation.other_user_id],
        queryFn: () => messageService.getMessages(conversation.other_user_id, conversation.listing_id ?? undefined),
        refetchInterval: 4000,
    });

    const sendMutation = useMutation({
        mutationFn: (content: string) =>
            messageService.sendMessage(conversation.other_user_id, content, conversation.listing_id ?? undefined),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['messages', conversation.other_user_id] });
            qc.invalidateQueries({ queryKey: ['conversations'] });
            setText('');
            inputRef.current?.focus();
        },
    });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed || sendMutation.isPending) return;
        sendMutation.mutate(trimmed);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm shrink-0">
                <button onClick={onBack} className="lg:hidden p-1 -ml-1 text-gray-500">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <Link to={`/seller/${conversation.other_user_id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar name={conversation.other_user_name} avatarUrl={conversation.other_user_avatar} size="sm" />
                    <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{conversation.other_user_name}</p>
                        <p className="text-[10px] text-primary-500 font-medium">{t('messages.active')}</p>
                    </div>
                </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
                {isLoading && (
                    <div className="flex justify-center pt-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
                    </div>
                )}
                {!isLoading && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 pt-8">
                        <MessageSquare className="w-10 h-10 opacity-30" />
                        <p className="text-sm">{t('messages.startConversation')}</p>
                    </div>
                )}
                {messages.map((msg, idx) => {
                    const isMine = msg.sender_id === currentUserId;
                    const showDate = idx === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[idx - 1].created_at).toDateString();
                    return (
                        <React.Fragment key={msg.id}>
                            {showDate && (
                                <div className="text-center">
                                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {new Date(msg.created_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            )}
                            <div className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                                <div className={cn(
                                    'max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm',
                                    isMine
                                        ? 'bg-primary-500 text-white rounded-br-sm'
                                        : 'bg-white text-gray-800 rounded-bl-sm'
                                )}>
                                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                    <p className={cn('text-[10px] mt-1 text-right', isMine ? 'text-primary-100' : 'text-gray-400')}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 bg-white border-t border-gray-100 px-3 py-2 flex items-end gap-2"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}>
                <textarea
                    ref={inputRef}
                    rows={1}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('messages.typeMessage')}
                    className="flex-1 resize-none bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-800 outline-none placeholder-gray-400 max-h-32 overflow-y-auto"
                    style={{ lineHeight: '1.4' }}
                />
                <button
                    onClick={handleSend}
                    disabled={!text.trim() || sendMutation.isPending}
                    className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white disabled:opacity-40 active:scale-95 transition-all shrink-0"
                >
                    {sendMutation.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Send className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};

const MessagesPage: React.FC = () => {
    const { t } = useTranslation();
    const { isAuthenticated, user } = useAuthStore();
    const [searchParams] = useSearchParams();
    const [activeConv, setActiveConv] = useState<Conversation | null>(null);
    const [search, setSearch] = useState('');
    const qc = useQueryClient();

    const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
        queryKey: ['conversations'],
        queryFn: messageService.getConversations,
        enabled: isAuthenticated,
        refetchInterval: 10_000,
    });

    // Auto-open conversation if ?user= param provided
    useEffect(() => {
        const userId = searchParams.get('user');
        if (userId && conversations.length > 0) {
            const found = conversations.find(c => c.other_user_id === Number(userId));
            if (found) setActiveConv(found);
        }
    }, [searchParams, conversations]);

    if (!isAuthenticated) {
        return (
            <PublicLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
                    <MessageSquare className="w-14 h-14 text-primary-300" />
                    <h2 className="text-xl font-bold text-gray-900">{t('messages.loginRequired')}</h2>
                    <p className="text-gray-500 text-sm">{t('messages.loginToView')}</p>
                    <Link to="/login" className="mt-2 px-6 py-3 bg-primary-500 text-white font-bold rounded-xl">
                        {t('auth.signIn')}
                    </Link>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <div className="container mx-auto px-0 md:px-4 py-0 md:py-6 max-w-5xl">
                <div
                    className="bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100 overflow-hidden flex"
                    style={{ height: 'calc(100vh - 120px)' }}
                >
                    {/* Sidebar — always visible on desktop, hidden on mobile when chat open */}
                    <div className={cn(
                        'flex flex-col border-r border-gray-100',
                        'w-full md:w-80 lg:w-96 shrink-0',
                        activeConv ? 'hidden md:flex' : 'flex'
                    )}>
                        {/* Sidebar header */}
                        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
                            <h1 className="text-lg font-bold text-gray-900">{t('nav.messages')}</h1>
                        </div>

                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
                            </div>
                        ) : (
                            <ConversationList
                                conversations={conversations}
                                activeId={activeConv?.other_user_id ?? null}
                                onSelect={conv => {
                                    setActiveConv(conv);
                                    qc.invalidateQueries({ queryKey: ['messages', conv.other_user_id] });
                                    messageService.markAsRead(conv.other_user_id).catch(() => {});
                                    qc.invalidateQueries({ queryKey: ['conversations'] });
                                }}
                                search={search}
                                onSearch={setSearch}
                            />
                        )}
                    </div>

                    {/* Chat panel */}
                    <div className={cn(
                        'flex-1 flex flex-col',
                        !activeConv ? 'hidden md:flex' : 'flex'
                    )}>
                        {activeConv && user ? (
                            <ChatView
                                conversation={activeConv}
                                currentUserId={user.id}
                                onBack={() => setActiveConv(null)}
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                                <MessageSquare className="w-14 h-14 opacity-20" />
                                <p className="text-sm">{t('messages.selectConversation')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export { MessagesPage };
