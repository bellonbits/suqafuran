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
import { Send, ArrowLeft, Loader2, User, Search, MessageSquare } from 'lucide-react';

/* ── helpers ── */
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

const Avatar: React.FC<{ name: string; avatarUrl?: string | null; size?: 'sm' | 'md' }> = ({ name, avatarUrl, size = 'md' }) => (
    <div className={cn(
        'rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold overflow-hidden shrink-0',
        size === 'sm' ? 'w-9 h-9 text-sm' : 'w-11 h-11 text-base'
    )}>
        {avatarUrl
            ? <img src={getImageUrl(avatarUrl)} alt={name} className="w-full h-full object-cover" />
            : <span>{name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}</span>}
    </div>
);

/* ── SVG illustration (speech bubbles) ── */
const EmptyIllustration = () => (
    <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="80" cy="125" rx="60" ry="12" fill="#e2eaf0" />
        <rect x="18" y="30" width="88" height="62" rx="14" fill="#c8dde8" />
        <rect x="22" y="34" width="80" height="54" rx="11" fill="#ddeaf3" />
        <rect x="30" y="48" width="48" height="7" rx="3.5" fill="#a8c4d8" />
        <rect x="30" y="62" width="36" height="7" rx="3.5" fill="#a8c4d8" />
        <polygon points="30,92 44,92 38,104" fill="#ddeaf3" />
        <rect x="52" y="50" width="74" height="56" rx="14" fill="#b0cfe0" />
        <rect x="56" y="54" width="66" height="48" rx="11" fill="#cce0ee" />
        <circle cx="76" cy="78" r="5" fill="#8ab4c8" />
        <circle cx="89" cy="78" r="5" fill="#8ab4c8" />
        <circle cx="102" cy="78" r="5" fill="#8ab4c8" />
        <polygon points="108,106 122,106 116,118" fill="#cce0ee" />
    </svg>
);

/* ── Conversation sidebar ── */
type TabFilter = 'all' | 'unread' | 'spam';

const ConversationList: React.FC<{
    conversations: Conversation[];
    activeId: number | null;
    onSelect: (c: Conversation) => void;
    search: string;
    onSearch: (v: string) => void;
    tab: TabFilter;
    onTab: (t: TabFilter) => void;
}> = ({ conversations, activeId, onSelect, search, onSearch, tab, onTab }) => {
    const { t } = useTranslation();

    const filtered = conversations.filter(c => {
        const matchesSearch = c.other_user_name?.toLowerCase().includes(search.toLowerCase()) ||
            c.last_message?.toLowerCase().includes(search.toLowerCase());
        if (tab === 'unread') return matchesSearch && c.unread_count > 0;
        return matchesSearch;
    });

    const tabs: { key: TabFilter; label: string }[] = [
        { key: 'all', label: t('messages.tabAll') },
        { key: 'unread', label: t('messages.tabUnread') },
        { key: 'spam', label: t('messages.tabSpam') },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 shrink-0">
                <h1 className="text-[17px] font-bold text-gray-900 mb-3">{t('messages.myMessages')}</h1>
                {/* Search */}
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 h-9 bg-white">
                    <Search className="h-4 w-4 text-gray-400 shrink-0" />
                    <input
                        value={search}
                        onChange={e => onSearch(e.target.value)}
                        placeholder={t('messages.search')}
                        className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 shrink-0 px-4">
                {tabs.map(tb => (
                    <button
                        key={tb.key}
                        onClick={() => onTab(tb.key)}
                        className={cn(
                            'text-sm font-medium pb-2 mr-5 border-b-2 -mb-px transition-colors',
                            tab === tb.key
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                        )}
                    >
                        {tb.label}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 pt-10 pb-6 px-4">
                        <EmptyIllustration />
                        <p className="text-sm text-gray-400 text-center">{t('messages.noConversations')}</p>
                    </div>
                ) : (
                    filtered.map(conv => (
                        <button
                            key={conv.other_user_id}
                            onClick={() => onSelect(conv)}
                            className={cn(
                                'w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-100',
                                activeId === conv.other_user_id && 'bg-primary-50 border-l-[3px] border-l-primary-500'
                            )}
                        >
                            <div className="relative">
                                <Avatar name={conv.other_user_name} avatarUrl={conv.other_user_avatar} />
                                {conv.unread_count > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
                                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <p className={cn('text-sm truncate', conv.unread_count > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700')}>
                                        {conv.other_user_name || t('messages.unknownUser')}
                                    </p>
                                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">{formatTime(conv.last_message_at)}</span>
                                </div>
                                <p className={cn('text-xs truncate', conv.unread_count > 0 ? 'text-gray-600 font-medium' : 'text-gray-400')}>
                                    {conv.last_message || '…'}
                                </p>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

/* ── Chat panel ── */
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
        onSuccess: (newMsg) => {
            // Immediately append to cache so UI is instant
            qc.setQueryData<Message[]>(
                ['messages', conversation.other_user_id],
                (old = []) => [...old, newMsg]
            );
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

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
                <button onClick={onBack} className="lg:hidden p-1 -ml-1 text-gray-500">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <Link to={`/seller/${conversation.other_user_id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar name={conversation.other_user_name} avatarUrl={conversation.other_user_avatar} size="sm" />
                    <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{conversation.other_user_name}</p>
                        <p className="text-[10px] text-primary-500">{t('messages.active')}</p>
                    </div>
                </Link>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-gray-50">
                {isLoading && (
                    <div className="flex justify-center pt-10">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
                    </div>
                )}
                {!isLoading && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 pt-10">
                        <MessageSquare className="w-12 h-12 text-gray-200" />
                        <p className="text-sm text-gray-400">{t('messages.startConversation')}</p>
                    </div>
                )}
                {messages.map((msg, idx) => {
                    const isMine = msg.sender_id === currentUserId;
                    const showDate = idx === 0 ||
                        new Date(msg.created_at).toDateString() !== new Date(messages[idx - 1].created_at).toDateString();
                    return (
                        <React.Fragment key={msg.id}>
                            {showDate && (
                                <div className="flex items-center gap-2 py-2">
                                    <div className="flex-1 h-px bg-gray-200" />
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                        {new Date(msg.created_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                    <div className="flex-1 h-px bg-gray-200" />
                                </div>
                            )}
                            <div className={cn('flex items-end gap-2', isMine ? 'justify-end' : 'justify-start')}>
                                {!isMine && (
                                    <Avatar name={conversation.other_user_name} avatarUrl={conversation.other_user_avatar} size="sm" />
                                )}
                                <div className={cn(
                                    'max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm',
                                    isMine
                                        ? 'bg-primary-500 text-white rounded-br-sm'
                                        : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                                )}>
                                    <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
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
            <div
                className="shrink-0 bg-white border-t border-gray-200 px-4 py-3 flex items-end gap-3"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
            >
                <textarea
                    ref={inputRef}
                    rows={1}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={t('messages.typeMessage')}
                    className="flex-1 resize-none border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-800 outline-none placeholder-gray-400 max-h-32 overflow-y-auto focus:border-primary-400 transition-colors"
                    style={{ lineHeight: '1.4' }}
                />
                <button
                    onClick={handleSend}
                    disabled={!text.trim() || sendMutation.isPending}
                    className="w-10 h-10 rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center text-white disabled:opacity-40 active:scale-95 transition-all shrink-0"
                >
                    {sendMutation.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Send className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};

/* ── Empty right panel ── */
const EmptyChat: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 bg-gray-50 px-8 text-center">
            <MessageSquare className="w-16 h-16 text-gray-200" />
            <div>
                <p className="text-gray-500 text-sm mb-1">
                    {t('messages.noMessagesYet')}
                </p>
                <p className="text-sm text-gray-400">
                    <Link to="/search" className="text-primary-500 font-medium hover:underline">{t('messages.findThings')}</Link>
                    {' '}{t('messages.toDiscuss')}
                </p>
            </div>
            <Link
                to="/post-ad"
                className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-colors"
            >
                {t('listing.postAd')}
            </Link>
        </div>
    );
};

/* ── Main page ── */
const MessagesPage: React.FC = () => {
    const { t } = useTranslation();
    const { isAuthenticated, user } = useAuthStore();
    const [searchParams] = useSearchParams();
    const [activeConv, setActiveConv] = useState<Conversation | null>(null);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState<TabFilter>('all');
    const qc = useQueryClient();

    const targetUserId = searchParams.get('user') ? Number(searchParams.get('user')) : null;
    const targetListingId = searchParams.get('listing') ? Number(searchParams.get('listing')) : null;

    const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
        queryKey: ['conversations'],
        queryFn: messageService.getConversations,
        enabled: isAuthenticated,
        refetchInterval: 8_000,
    });

    // Fetch seller info if navigating directly to a new conversation
    const { data: targetUser } = useQuery({
        queryKey: ['public-user', targetUserId],
        queryFn: () => messageService.getPublicUser(targetUserId!),
        enabled: !!targetUserId && isAuthenticated,
        staleTime: 60_000,
    });

    // Open conversation: prefer existing, fall back to stub from URL params
    useEffect(() => {
        if (!targetUserId || !isAuthenticated) return;
        const existing = conversations.find(c => c.other_user_id === targetUserId);
        if (existing) {
            setActiveConv(existing);
        } else if (targetUser) {
            // Create a stub so the user can start the first message
            setActiveConv({
                other_user_id: targetUser.id,
                other_user_name: targetUser.full_name,
                other_user_avatar: targetUser.avatar_url,
                last_message: '',
                last_message_at: null,
                unread_count: 0,
                listing_id: targetListingId,
            });
        }
    }, [targetUserId, targetUser, conversations, isAuthenticated, targetListingId]);

    if (!isAuthenticated) {
        return (
            <PublicLayout>
                <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5 text-center px-4">
                    <EmptyIllustration />
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1">{t('messages.loginRequired')}</h2>
                        <p className="text-gray-400 text-sm">{t('messages.loginToView')}</p>
                    </div>
                    <Link to="/login" className="px-8 py-3 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-colors">
                        {t('auth.signIn')}
                    </Link>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <div className="md:container md:mx-auto md:px-4 md:py-6 md:max-w-5xl h-full">
                <div
                    className="bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-200 overflow-hidden flex"
                    style={{ height: 'calc(100vh - 130px)' }}
                >
                    {/* ── Sidebar ── */}
                    <div className={cn(
                        'flex flex-col border-r border-gray-200 bg-white',
                        'w-full md:w-[360px] shrink-0',
                        activeConv ? 'hidden md:flex' : 'flex'
                    )}>
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
                                    messageService.markAsRead(conv.other_user_id).catch(() => {});
                                    qc.invalidateQueries({ queryKey: ['messages', conv.other_user_id] });
                                    qc.invalidateQueries({ queryKey: ['conversations'] });
                                }}
                                search={search}
                                onSearch={setSearch}
                                tab={tab}
                                onTab={setTab}
                            />
                        )}
                    </div>

                    {/* ── Chat / Empty ── */}
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
                            <EmptyChat />
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export { MessagesPage };
