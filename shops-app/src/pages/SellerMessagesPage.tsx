"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send, Loader, Search, Clock, ArrowLeft, MessageSquare, Image as ImageIcon,
  CheckCheck, User, ChevronDown, X, Maximize2
} from 'lucide-react';
import api from '@/services/api';

interface Conversation {
  other_user_id: number;
  other_user_name?: string;
  other_user_avatar?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id?: number;
  content: string;
  created_at?: string;
  timestamp?: string;
}

function parseMessageContent(raw: string): { imageUrl?: string; cleanText: string } {
  if (!raw) return { cleanText: '' };

  let imageUrl: string | undefined;

  // 1. Match [PRODUCT_IMAGE]: or [IMAGE]: with optional newlines, then URL
  const tagMatch = raw.match(/\[(?:PRODUCT_IMAGE|IMAGE)\]:?\s*(https?:\/\/[^\s"'<>]+)/i);
  if (tagMatch) {
    imageUrl = tagMatch[1].trim();
  } else {
    // 2. Match standalone Cloudinary or image URL
    const urlMatch = raw.match(/(https?:\/\/[^\s"'<>]*(?:cloudinary\.com[^\s"'<>]*|\.(?:png|jpe?g|webp|gif)(?:\?[^\s"'<>]*)?))/i);
    if (urlMatch) {
      imageUrl = urlMatch[1].trim();
    }
  }

  // 3. Remove [PRODUCT_IMAGE] tags and the image URL from visible text
  let cleanText = raw
    .replace(/\[(?:PRODUCT_IMAGE|IMAGE)\]:?\s*https?:\/\/[^\s"'<>]+/gi, '')
    .replace(/\[(?:PRODUCT_IMAGE|IMAGE)\]:?/gi, '');

  if (imageUrl) {
    cleanText = cleanText.replace(imageUrl, '');
  }

  // Remove multiple blank lines leftover
  cleanText = cleanText.replace(/\n{3,}/g, '\n\n').trim();

  return { imageUrl, cleanText };
}

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const targetUserIdParam = searchParams.get('userId') || searchParams.get('user');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [activeImageLightbox, setActiveImageLightbox] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Persistent reference to current selected conversation to avoid stale closures in polling
  const selectedConversationRef = useRef<Conversation | null>(null);
  selectedConversationRef.current = selectedConversation;

  // Track if initial selection happened so polling doesn't overwrite user selection
  const initialSelectDoneRef = useRef(false);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const filtered = conversations.filter((conv) => {
      const name = (conv.other_user_name || 'Customer').toLowerCase();
      const message = (conv.last_message || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      return name.includes(query) || message.includes(query);
    });
    setFilteredConversations(filtered);
  }, [searchQuery, conversations]);

  const loadConversations = async () => {
    try {
      const res = await api.get('/messages/conversations').catch((err) => {
        console.error('Error loading conversations:', err);
        if (err.response?.status === 500) {
          setError('Messaging service is temporarily unavailable. Please try again later.');
        }
        return null;
      });

      if (res?.data) {
        const convsList: Conversation[] = Array.isArray(res.data) ? res.data : [];
        setConversations(convsList);
        setError(null);

        // If a conversation is already selected, silently poll messages for it
        if (selectedConversationRef.current) {
          loadMessages(selectedConversationRef.current.other_user_id, true);
          return;
        }

        // On first initial load ONLY: select from query param or default on desktop
        if (!initialSelectDoneRef.current && convsList.length > 0) {
          initialSelectDoneRef.current = true;

          let toSelect: Conversation | undefined;
          if (targetUserIdParam) {
            const targetId = parseInt(targetUserIdParam, 10);
            toSelect = convsList.find((c) => c.other_user_id === targetId);
          }

          // Auto select on desktop if wide screen and not mobile
          if (!toSelect && window.innerWidth >= 768) {
            toSelect = convsList[0];
          }

          if (toSelect) {
            selectedConversationRef.current = toSelect;
            setSelectedConversation(toSelect);
            loadMessages(toSelect.other_user_id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherUserId: number, isSilentPoll = false) => {
    try {
      const res = await api.get(`/messages/${otherUserId}`).catch(() => null);

      if (res?.data) {
        const newMsgs = Array.isArray(res.data) ? res.data : [];
        setMessages(newMsgs);
        if (!isSilentPoll) {
          setTimeout(() => scrollToBottom(), 100);
        }
      }

      setConversations((prev) => prev.map((c) =>
        c.other_user_id === otherUserId ? { ...c, unread_count: 0 } : c
      ));
      api.post(`/messages/${otherUserId}/read`).catch(() => {});
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleMessagesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  };

  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    initialSelectDoneRef.current = true;
    selectedConversationRef.current = conversation;
    setSelectedConversation(conversation);
    loadMessages(conversation.other_user_id);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    setSending(true);
    try {
      await api.post('/messages/', {
        receiver_id: selectedConversation.other_user_id,
        content: messageInput,
      });

      setMessageInput('');
      loadMessages(selectedConversation.other_user_id);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const cleanSnippet = (text?: string) => {
    if (!text) return 'No messages yet';
    if (text.includes('[PRODUCT_IMAGE]:')) {
      return '🛍️ New product inquiry';
    }
    return text;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader className="w-8 h-8 animate-spin text-sky-500" />
        <p className="text-sm font-semibold text-slate-400">Loading your inbox...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16 max-w-5xl mx-auto px-1 md:px-0">
      
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Inbox Messages
          </h1>
          <p className="text-xs text-slate-400 font-medium hidden sm:block mt-0.5">
            Chat in real-time with your store customers
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-3.5 text-xs text-rose-700 dark:text-rose-400 font-medium">
          {error}
        </div>
      )}

      {/* ── Main Chat Interface ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-100 dark:border-neutral-800 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[calc(100dvh-175px)] md:h-[calc(100vh-210px)] md:min-h-[580px] max-h-[850px] min-h-0">
        
        {/* Left: Conversation List (hidden on mobile if conversation selected) */}
        <div className={`md:col-span-5 border-r border-slate-100 dark:border-neutral-800 flex flex-col min-h-0 h-full ${
          selectedConversation ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Search Bar */}
          <div className="p-3.5 border-b border-slate-100 dark:border-neutral-800 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-800 border-none rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          {/* List items */}
          <div
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-slate-50 dark:divide-neutral-800/60 pb-20 md:pb-4"
          >
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-2">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-neutral-700" />
                <p className="text-xs">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConversation?.other_user_id === conv.other_user_id;
                const name = conv.other_user_name || `Customer #${conv.other_user_id}`;
                const unread = conv.unread_count || 0;

                return (
                  <button
                    key={conv.other_user_id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full flex items-center gap-3 p-3.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-l-4 border-sky-500'
                        : 'hover:bg-slate-50/80 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-bold text-xs md:text-sm text-slate-900 dark:text-white truncate">
                          {name}
                        </p>
                        {conv.last_message_time && (
                          <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">
                            {new Date(conv.last_message_time).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                        {cleanSnippet(conv.last_message)}
                      </p>
                    </div>

                    {unread > 0 && (
                      <span className="bg-sky-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Thread */}
        <div className={`md:col-span-7 flex flex-col min-h-0 h-full bg-slate-50/40 dark:bg-neutral-950/40 relative ${
          selectedConversation ? 'flex' : 'hidden md:flex'
        }`}>
          {selectedConversation ? (
            <>
              {/* Thread Header */}
              <div className="p-3.5 bg-white dark:bg-neutral-900 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      selectedConversationRef.current = null;
                      setSelectedConversation(null);
                    }}
                    className="md:hidden p-1.5 rounded-xl text-slate-600 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-9 h-9 rounded-2xl bg-sky-500 text-white font-bold flex items-center justify-center text-xs">
                    {(selectedConversation.other_user_name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs md:text-sm text-slate-900 dark:text-white leading-tight">
                      {selectedConversation.other_user_name || `Customer #${selectedConversation.other_user_id}`}
                    </h3>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Active buyer
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages Body */}
              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3"
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 gap-2">
                    <MessageSquare className="w-8 h-8 text-slate-300 dark:text-neutral-700" />
                    <p className="text-xs">No messages yet. Send a greeting to start chatting!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isFromCustomer = msg.sender_id === selectedConversation.other_user_id;
                    const { imageUrl, cleanText } = parseMessageContent(msg.content);

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isFromCustomer ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                            isFromCustomer
                              ? 'bg-white dark:bg-neutral-900 text-slate-800 dark:text-white rounded-tl-sm border border-slate-100 dark:border-neutral-800'
                              : 'bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-tr-sm'
                          }`}
                        >
                          {/* Rich Product / Attached Image Preview */}
                          {imageUrl && (
                            <div
                              onClick={() => setActiveImageLightbox(imageUrl)}
                              className="mb-2.5 overflow-hidden rounded-xl border border-white/20 dark:border-neutral-700/60 bg-black/10 cursor-pointer group relative"
                            >
                              <img
                                src={imageUrl}
                                alt="Product Attachment"
                                className="w-full max-h-64 sm:max-h-72 object-cover rounded-xl group-hover:scale-102 transition-transform duration-200"
                                loading="lazy"
                              />
                              <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <Maximize2 className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          )}

                          {cleanText && (
                            <p className="leading-relaxed whitespace-pre-wrap break-words">{cleanText}</p>
                          )}

                          <div className={`flex items-center gap-1 text-[9px] mt-1.5 ${
                            isFromCustomer ? 'text-slate-400' : 'text-sky-100 justify-end'
                          }`}>
                            <span>
                              {new Date(msg.created_at || msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!isFromCustomer && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Floating Scroll to Latest Button */}
              {showScrollBottom && (
                <button
                  type="button"
                  onClick={() => scrollToBottom(true)}
                  className="absolute bottom-16 right-4 z-10 px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-bold shadow-lg shadow-sky-500/30 flex items-center gap-1.5 transition-all animate-bounce"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Latest</span>
                </button>
              )}

              {/* Message Input Footer */}
              <div className="p-3 bg-white dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Type a message to customer..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    disabled={sending}
                    className="flex-1 bg-slate-50 dark:bg-neutral-800 border-none rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                  <button
                    type="submit"
                    disabled={sending || !messageInput.trim()}
                    className="p-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-2xl transition-all shadow-md shadow-sky-500/20 flex-shrink-0 active:scale-95"
                  >
                    {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 gap-3 p-8">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-neutral-800 text-slate-400 flex items-center justify-center">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-700 dark:text-white">Select a conversation</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Pick a customer from the left list to view their questions and negotiate deals.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
