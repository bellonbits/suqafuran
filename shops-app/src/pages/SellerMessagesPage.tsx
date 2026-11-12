"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send, Loader, Search, Clock, ArrowLeft, MessageSquare, Image as ImageIcon,
  CheckCheck, User, ChevronDown, X, Maximize2, Smile
} from 'lucide-react';
import api from '@/services/api';
import { useAuthStore } from '@/store/useAuth';
import { formatMessageDate, formatMessageTime } from '@/utils/date';

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

  const { user: currentUser } = useAuthStore();
  const [reactionsMap, setReactionsMap] = useState<Record<number, { summary: Record<string, number>; userReactions: Record<string, string> }>>({});
  const [activeReactionPickerMessageId, setActiveReactionPickerMessageId] = useState<number | null>(null);

  const handleToggleReaction = async (messageId: number, emoji: string) => {
    setActiveReactionPickerMessageId(null);
    const uidStr = String(currentUser?.id || 'seller');

    setReactionsMap((prev) => {
      const current = prev[messageId] || { summary: {}, userReactions: {} };
      const prevEmoji = current.userReactions[uidStr];
      const nextSummary = { ...current.summary };
      const nextUserReactions = { ...current.userReactions };

      if (prevEmoji === emoji) {
        delete nextUserReactions[uidStr];
        nextSummary[emoji] = Math.max(0, (nextSummary[emoji] || 1) - 1);
        if (nextSummary[emoji] === 0) delete nextSummary[emoji];
      } else {
        if (prevEmoji) {
          nextSummary[prevEmoji] = Math.max(0, (nextSummary[prevEmoji] || 1) - 1);
          if (nextSummary[prevEmoji] === 0) delete nextSummary[prevEmoji];
        }
        nextUserReactions[uidStr] = emoji;
        nextSummary[emoji] = (nextSummary[emoji] || 0) + 1;
      }

      return {
        ...prev,
        [messageId]: {
          summary: nextSummary,
          userReactions: nextUserReactions,
        },
      };
    });

    try {
      await api.post(`/messages/${messageId}/reactions`, { emoji });
    } catch (err) {
      console.warn('Failed to persist reaction:', err);
    }
  };

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
                            {formatMessageDate(conv.last_message_time)}
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
                    const msgReactions = reactionsMap[msg.id];
                    const reactionSummary = msgReactions?.summary || {};
                    const userReacts = msgReactions?.userReactions || {};
                    const reactionKeys = Object.keys(reactionSummary);

                    return (
                      <div
                        key={msg.id}
                        className={`group/msg relative flex items-end gap-1.5 ${isFromCustomer ? 'justify-start' : 'justify-end'}`}
                      >
                        {/* Quick Reaction Button (Shows on hover/focus) */}
                        <div className={`opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center self-center shrink-0 ${!isFromCustomer ? 'order-first' : 'order-last'}`}>
                          <button
                            type="button"
                            onClick={() => setActiveReactionPickerMessageId(activeReactionPickerMessageId === msg.id ? null : msg.id)}
                            className="w-7 h-7 rounded-full bg-white/90 dark:bg-neutral-850/90 hover:bg-slate-100 dark:hover:bg-neutral-700 shadow-sm border border-slate-200/80 dark:border-neutral-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 transition-all active:scale-90"
                            title="Add reaction"
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Floating Quick Reaction Emoji Bar */}
                        {activeReactionPickerMessageId === msg.id && (
                          <div
                            className={`absolute bottom-full mb-1.5 z-40 flex items-center gap-1 px-2 py-1 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl rounded-full border border-slate-200/90 dark:border-neutral-700 shadow-[0_12px_30px_rgba(0,0,0,0.18)] animate-in zoom-in-95 duration-150 ${!isFromCustomer ? 'right-2' : 'left-2'}`}
                          >
                            {['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥'].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:scale-130 active:scale-95 transition-transform hover:bg-slate-100 dark:hover:bg-neutral-800"
                              >
                                {emoji}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setActiveReactionPickerMessageId(null)}
                              className="w-5 h-5 ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div className="max-w-[85%] sm:max-w-[78%] space-y-1">
                          <div
                            className={`inline-block min-w-[76px] rounded-2xl px-3.5 py-2.5 text-xs select-text backdrop-blur-xl transition-all relative ${
                              isFromCustomer
                                ? 'bg-white/90 dark:bg-neutral-900/80 text-slate-800 dark:text-neutral-100 rounded-bl-xs border border-slate-200/80 dark:border-neutral-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]'
                                : 'bg-white/95 dark:bg-neutral-900/90 text-slate-900 dark:text-neutral-100 rounded-br-xs border border-white/80 dark:border-white/10 ring-1 ring-sky-500/25 dark:ring-sky-400/20 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]'
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

                            <div className="relative">
                              {cleanText && (
                                <span className="leading-relaxed whitespace-pre-wrap break-words">{cleanText}</span>
                              )}
                              <span className="float-right ml-2.5 mt-1 select-none inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-neutral-400 font-medium leading-none">
                                <span>{formatMessageTime(msg.created_at || msg.timestamp)}</span>
                                {!isFromCustomer && <CheckCheck className="w-3.5 h-3.5 text-sky-500 shrink-0 inline-block" />}
                              </span>
                            </div>
                          </div>

                          {/* Reaction Badges Cluster */}
                          {reactionKeys.length > 0 && (
                            <div className={`flex flex-wrap items-center gap-1 mt-1 ${!isFromCustomer ? 'justify-end' : 'justify-start'}`}>
                              {reactionKeys.map((emoji) => {
                                const count = reactionSummary[emoji];
                                const hasMyReaction = userReacts[String(currentUser?.id || 'seller')] === emoji;
                                return (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => handleToggleReaction(msg.id, emoji)}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                                      hasMyReaction
                                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 text-sky-700 dark:text-sky-300 ring-1 ring-sky-400/40 shadow-xs'
                                        : 'bg-white/90 dark:bg-neutral-900/90 border-slate-200/80 dark:border-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span>{emoji}</span>
                                    {count > 1 && <span className="text-[10px] font-bold">{count}</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
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
