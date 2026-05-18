import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Phone, User, Loader2, Minimize2, Maximize2, Heart, PlusCircle, Compass, Instagram, Twitter, ShoppingBag } from 'lucide-react';
import { aiService } from '../services/aiService';
import { supportService } from '../services/supportService';
import { cn } from '../utils/cn';
import { useParams, Link, useNavigate } from 'react-router-dom';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    recommendations?: any[];
}

export const AISupportChat: React.FC = () => {
    const { id: listingId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [messages, setMessages] = useState<Message[]>([
        { 
            role: 'assistant', 
            content: "Halo! I'm your Suqafuran support agent. How can I help you today? I can assist you with posting ads, boosting, or any questions about our marketplace.",
            timestamp: new Date() 
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [activeTicketId, setActiveTicketId] = useState<number | null>(() => {
        const stored = localStorage.getItem('suqafuran_guest_ticket_id');
        return stored ? parseInt(stored) : null;
    });

    const isAuthenticated = !!localStorage.getItem('suqafuran-token');

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
                }));
                setMessages(mappedMessages);
                
                if (!isAuthenticated && ticket.id !== activeTicketId) {
                    setActiveTicketId(ticket.id);
                    localStorage.setItem('suqafuran_guest_ticket_id', ticket.id.toString());
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
    }, [isOpen, isAuthenticated]);

    useEffect(() => {
        if (!isOpen || isMinimized) return;
        
        const interval = setInterval(() => {
            syncTicketHistory();
        }, 5000);
        
        return () => clearInterval(interval);
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
            const history = updatedMessages.map(m => ({
                role: m.role,
                content: m.content
            }));
            
            const response = await aiService.getSupportChat(history, listingId ? parseInt(listingId) : undefined);
            
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.answer,
                timestamp: new Date(),
                recommendations: response.recommendations
            }]);

            if (response.ticket_id && !isAuthenticated) {
                setActiveTicketId(response.ticket_id);
                localStorage.setItem('suqafuran_guest_ticket_id', response.ticket_id.toString());
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having a bit of trouble right now. Please reach out to our team on WhatsApp for immediate help.",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessageContent = (content: string) => {
        const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = [];
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
                        className="text-primary-600 hover:text-primary-700 font-bold underline transition-colors"
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
                        className="text-primary-600 hover:text-primary-700 font-bold underline transition-colors inline-flex items-center gap-0.5"
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
                    className="absolute -top-1 -right-1 z-10 w-5 h-5 bg-white border border-gray-200 shadow-md rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                    aria-label="Remove support chat"
                >
                    <X className="h-3 w-3 stroke-[3]" />
                </button>
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 rounded-full bg-primary-500 text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
                    aria-label="Open Support Chat"
                >
                    <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
                </button>
            </div>
        );
    }

    return (
        <div className={cn(
            "fixed right-4 md:right-6 z-50 bg-white shadow-2xl rounded-2xl flex flex-col transition-all duration-300 border border-gray-100 overflow-hidden",
            isMinimized ? "bottom-20 md:bottom-6 h-14 w-64" : "bottom-20 md:bottom-6 h-[500px] w-[350px] max-w-[calc(100vw-32px)]"
        )}>
            {/* Header */}
            <div className="bg-primary-500 p-4 flex items-center justify-between text-white shrink-0">
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
                    <button 
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                        {messages.map((msg, i) => (
                            <div key={i} className={cn(
                                "flex flex-col max-w-[85%]",
                                msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                            )}>
                                <div className={cn(
                                    "px-3.5 py-2.5 rounded-2xl text-sm shadow-sm",
                                    msg.role === 'user' 
                                        ? "bg-primary-500 text-white rounded-tr-none" 
                                        : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                                )}>
                                    <div className="whitespace-pre-line leading-relaxed">
                                        {renderMessageContent(msg.content)}
                                    </div>
                                    
                                    {msg.recommendations && msg.recommendations.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 w-full min-w-[200px]">
                                            <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-2">Matches Found</p>
                                            <div className="grid gap-2">
                                                {msg.recommendations.map((item: any) => (
                                                    <Link 
                                                        key={item.id} 
                                                        to={`/listing/${item.id}`}
                                                        className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                                                    >
                                                        <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden shrink-0">
                                                            {item.image ? (
                                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                    <ShoppingBag size={14} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[11px] font-medium text-gray-900 truncate group-hover:text-primary-600">{item.title}</p>
                                                            <p className="text-[10px] text-primary-600 font-bold">{item.price} {item.currency}</p>
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
                    <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-gray-50 bg-white shrink-0 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {[
                            { icon: PlusCircle, text: 'Post Ad', action: () => navigate('/post-ad') },
                            { icon: Heart, text: 'Watchlist', action: () => navigate('/favorites') },
                            { icon: Compass, text: 'Discovery', action: () => navigate('/discovery') },
                            { icon: Phone, text: 'WhatsApp', action: () => window.open('https://wa.me/252612958679', '_blank') },
                            { icon: Instagram, text: 'Instagram', action: () => window.open('https://www.instagram.com/suqafuran/', '_blank') },
                            { icon: Twitter, text: 'Twitter/X', action: () => window.open('https://x.com/suqafuran', '_blank') },
                        ].map((btn, i) => (
                            <button
                                key={i}
                                onClick={btn.action}
                                className="flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-[11px] font-semibold transition-colors shrink-0"
                            >
                                <btn.icon size={12} />
                                {btn.text}
                            </button>
                        ))}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about Suqafuran or search items..."
                            className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 transition-all"
                        />
                        <button 
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all shrink-0"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </>
            )}
        </div>
    );
};
