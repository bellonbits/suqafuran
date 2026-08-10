import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MessageCircle, X, Send, Phone, User, Loader2, Minimize2, Maximize2, Heart, Store, ShoppingBag } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { supportService } from '@/services/supportService';
import { useAuthStore } from '@/store/useAuth';
import { cn } from '@/lib/utils';

const SUPPORT_PHONE = '+254720073322';
const SUPPORT_WHATSAPP_URL = 'https://wa.me/254720073322';
const SUPPORT_CALL_URL = 'tel:+254720073322';
const GUEST_TICKET_STORAGE_KEY = 'suqafuran_guest_ticket_id';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    recommendations?: any[];
}

export const AISupportChat: React.FC = () => {
    const { id: listingId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Halo! I'm your Suqafuran support agent. How can I help you today? I can assist with posting ads, orders, or any questions about the marketplace.",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [activeTicketId, setActiveTicketId] = useState<number | null>(() => {
        const stored = localStorage.getItem(GUEST_TICKET_STORAGE_KEY);
        return stored ? parseInt(stored) : null;
    });

    const syncTicketHistory = async () => {
        try {
            let ticket: any = null;
            if (isAuthenticated) {
                ticket = await supportService.getMyActiveTicket();
            } else if (activeTicketId) {
                ticket = await supportService.getTicketById(activeTicketId);
            }

            if (ticket && ticket.chat_history && ticket.chat_history.length > 0) {
                const mappedMessages: Message[] = ticket.chat_history.map((m: any) => ({
                    role: m.role,
                    content: m.content,
                    timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
                    recommendations: m.recommendations || []
                }));
                setMessages(mappedMessages);

                if (!isAuthenticated && ticket.id !== activeTicketId) {
                    setActiveTicketId(ticket.id);
                    localStorage.setItem(GUEST_TICKET_STORAGE_KEY, ticket.id.toString());
                }
            }
        } catch (error) {
            console.error('Failed to sync support ticket history', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            syncTicketHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, isAuthenticated]);

    useEffect(() => {
        if (!isOpen || isMinimized) return;
        const interval = setInterval(() => {
            syncTicketHistory();
        }, 5000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, isMinimized, isAuthenticated, activeTicketId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            const history = updatedMessages.map((m) => ({ role: m.role, content: m.content }));

            const response = await aiService.getSupportChat(
                history,
                listingId ? parseInt(listingId) : undefined,
                activeTicketId || undefined
            );

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: response.answer,
                    timestamp: new Date(),
                    recommendations: response.recommendations
                }
            ]);

            if (response.ticket_id && !isAuthenticated) {
                setActiveTicketId(response.ticket_id);
                localStorage.setItem(GUEST_TICKET_STORAGE_KEY, response.ticket_id.toString());
            }
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: `I'm having a bit of trouble right now. Please reach out to our team by call or WhatsApp at ${SUPPORT_PHONE} for immediate help.`,
                    timestamp: new Date()
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessageContent = (content: string) => {
        const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;

        while ((match = mdLinkRegex.exec(content)) !== null) {
            const index = match.index;
            if (index > lastIndex) {
                parts.push(content.substring(lastIndex, index));
            }

            const text = match[1];
            const url = match[2];

            if (url.startsWith('/')) {
                parts.push(
                    <Link
                        key={index}
                        to={url}
                        className="text-orange-600 hover:text-orange-700 font-bold underline transition-colors"
                    >
                        {text}
                    </Link>
                );
            } else {
                parts.push(
                    <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 font-bold underline transition-colors inline-flex items-center gap-0.5"
                    >
                        {text}
                    </a>
                );
            }

            lastIndex = mdLinkRegex.lastIndex;
        }

        if (lastIndex < content.length) {
            parts.push(content.substring(lastIndex));
        }

        return parts.length > 0 ? parts : content;
    };

    if (!isVisible) return null;

    if (!isOpen) {
        return (
            <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50">
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute -top-1 -right-1 z-10 w-5 h-5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-md rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                    aria-label="Remove support chat"
                >
                    <X className="h-3 w-3 stroke-[3]" />
                </button>
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 rounded-full bg-orange-500 text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
                    aria-label="Open Support Chat"
                >
                    <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
                </button>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'fixed right-4 md:right-6 z-50 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl flex flex-col transition-all duration-300 border border-gray-100 dark:border-slate-800 overflow-hidden',
                isMinimized ? 'bottom-20 md:bottom-6 h-14 w-64' : 'bottom-20 md:bottom-6 h-[500px] w-[350px] max-w-[calc(100vw-32px)]'
            )}
        >
            {/* Header */}
            <div className="bg-orange-500 p-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                        <User size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold leading-tight">Suqafuran Agent</h3>
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-[10px] opacity-80">Online & ready</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-slate-950/50">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={cn('flex flex-col max-w-[85%]', msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start')}
                            >
                                <div
                                    className={cn(
                                        'px-3.5 py-2.5 rounded-2xl text-sm shadow-sm',
                                        msg.role === 'user'
                                            ? 'bg-orange-500 text-white rounded-tr-none'
                                            : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 border border-gray-100 dark:border-slate-700 rounded-tl-none'
                                    )}
                                >
                                    <div className="whitespace-pre-line leading-relaxed">{renderMessageContent(msg.content)}</div>

                                    {msg.recommendations && msg.recommendations.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 space-y-2 w-full min-w-[200px]">
                                            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-2">Matches Found</p>
                                            <div className="grid gap-2">
                                                {msg.recommendations.map((item: any) => (
                                                    <Link
                                                        key={item.id}
                                                        to={`/listing/${item.id}`}
                                                        className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group"
                                                    >
                                                        <div className="w-10 h-10 rounded bg-gray-200 dark:bg-slate-700 overflow-hidden shrink-0">
                                                            {item.image ? (
                                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                    <ShoppingBag size={14} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[11px] font-medium text-gray-900 dark:text-slate-100 truncate group-hover:text-orange-600">
                                                                {item.title}
                                                            </p>
                                                            <p className="text-[10px] text-orange-600 font-bold">
                                                                {item.price} {item.currency}
                                                            </p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 px-1">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-center gap-2 text-gray-400 text-xs italic ml-1">
                                <Loader2 size={12} className="animate-spin" />
                                Agent is typing...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions */}
                    <div
                        className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-gray-50 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 scrollbar-none"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {[
                            { icon: Heart, text: 'Favorites', action: () => navigate('/favorites') },
                            { icon: Store, text: 'Shops', action: () => navigate('/shops') },
                            { icon: Phone, text: 'Call', action: () => window.open(SUPPORT_CALL_URL, '_self') },
                            { icon: MessageCircle, text: 'WhatsApp', action: () => window.open(SUPPORT_WHATSAPP_URL, '_blank') },
                        ].map((btn, i) => (
                            <button
                                key={i}
                                onClick={btn.action}
                                className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-full text-[11px] font-semibold transition-colors shrink-0"
                            >
                                <btn.icon size={12} />
                                {btn.text}
                            </button>
                        ))}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2 shrink-0">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about Suqafuran or search items..."
                            className="flex-1 bg-gray-50 dark:bg-slate-800 dark:text-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shrink-0"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </>
            )}
        </div>
    );
};
