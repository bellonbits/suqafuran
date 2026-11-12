"use client";

import React, { useEffect, useState, Suspense, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useNavigate } from 'react-router-dom';
import { 
  Send, Search, AlertCircle, ShoppingBag, ArrowLeft, MessageSquare, Loader, 
  CheckCircle2, HelpCircle, Smile, Paperclip, MoreVertical, SlidersHorizontal, 
  CheckCheck, Users, Headphones, Store, Mic, MicOff, Image as ImageIcon, 
  ShieldAlert, AlertTriangle, Trash2, X, Maximize2, ShieldCheck, ChevronRight,
  ChevronDown
} from 'lucide-react';
import api, { optimizeCloudinaryUrl } from '@/services/api';
import { listingsService } from '@/services/listings';
import { dealsService, type Deal } from '@/services/deals';
import { imageService } from '@/services/imageService';
import { useChat } from '@/hooks/useChat';
import { useAuthStore } from '@/store/useAuth';
import { useCurrencyStore } from '@/store/useCurrency';
import { formatConvertedPrice } from '@/lib/currency';
import { useLocalizedField } from '@/lib/i18n';
import { trackEvent, trackCharge } from '@/lib/analytics';
import { detectFraudRisk } from '@/components/chat/ChatFraudGuard';
import { OrderReceiptBubble } from '@/components/chat/OrderReceiptBubble';
import { VoiceNotePlayer } from '@/components/chat/VoiceNotePlayer';
import { EmojiPickerPopover } from '@/components/chat/EmojiPickerPopover';
import { ReportFraudModal } from '@/components/chat/ReportFraudModal';
import { formatMessageDate, formatMessageTime, parseServerDate } from '@/utils/date';
import type { ChatMessage, Listing } from '@/types';

// A plain "hello" opener gets ignored; naming the actual product and asking
// something concrete (availability) is what actually earns a reply -- this
// is the one thing every "contact seller" tap has in common, so it's the
// one line worth writing well instead of leaving to a generic placeholder.
function buildOpeningMessage(productTitle: string): string {
    return `Hi! \u{1F44B} I just came across your listing for "${productTitle}" -- is it still available?`;
}


interface Conversation {
    other_user_id: number;
    other_user_name?: string;
    other_user_avatar?: string;
    last_message?: string;
    last_message_time?: string;
    last_message_at?: string;
    unread_count?: number;
    is_online?: boolean;
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

function MessagesPageContent() {
    const navigate = useNavigate();
    const searchParams = useSearchParams();
    const targetUserId = searchParams.get('userId') || searchParams.get('user');
    const sharedProductId = searchParams.get('productId') || searchParams.get('listing_id');
    const field = useLocalizedField();
    const currency = useCurrencyStore((s) => s.currency);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [hasLoadedMessages, setHasLoadedMessages] = useState(false);
    const [inputText, setInputText] = useState('');

    // Feature States: Emojis, Reporting, Media, Voice
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

    // Image Upload states
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Voice Recording states
    const [isRecordingVoice, setIsRecordingVoice] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isCancelledVoiceRef = useRef<boolean>(false);

    // The listing this thread is about -- seeded from ?productId= when
    // arriving via a "Contact Seller" tap, or recovered from the loaded
    // thread's own messages when reopening a conversation later, so the
    // product card and listing_id tagging persist across the whole chat,
    // not just the first visit.
    const [activeListingId, setActiveListingId] = useState<string | null>(null);
    const [sharedProduct, setSharedProduct] = useState<Listing | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
    const [isUserTyping, setIsUserTyping] = useState(false);
    const [showFraudShield, setShowFraudShield] = useState(true);
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

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
        }
    };

    // The real auth token -- this used to read localStorage.getItem('access_token'),
    // a key nothing in the app ever writes to, so the socket never connected.
    const token = useAuthStore((s) => s.token) || '';
    const currentUser = useAuthStore((s) => s.user);
    const [deal, setDeal] = useState<Deal | null>(null);
    const [dealActionLoading, setDealActionLoading] = useState(false);

    // Initialize WebSocket connection and presence tracking
    const { isConnected, sendMessage: wssSendMessage, setTyping, onMessage, subscribeToUser, userStatus } = useChat(token);
    const activeConv = conversations.find((c) => c.other_user_id === selectedUserId);
    const isOtherUserOnline = (userStatus?.id === selectedUserId && userStatus?.is_online) || (activeConv?.is_online ?? false);
    const isOtherUserTyping = userStatus?.id === selectedUserId && !!userStatus?.is_typing;

    // Sync presence updates into conversation list
    useEffect(() => {
        if (userStatus && userStatus.id) {
            setConversations((prev) =>
                prev.map((c) =>
                    c.other_user_id === userStatus.id
                        ? { ...c, is_online: userStatus.is_online }
                        : c
                )
            );
        }
    }, [userStatus]);

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

    // A fresh "Contact Seller" tap carries the listing in the URL, scoped
    // to the specific conversation it was meant for -- switching to a
    // different conversation shouldn't keep tagging it onto that one too.
    useEffect(() => {
        if (sharedProductId && selectedUserId === Number(targetUserId)) {
            setActiveListingId(sharedProductId);
        }
    }, [sharedProductId, targetUserId, selectedUserId]);

    // Load and pin the product card for whichever listing this thread is
    // currently about, however that got set (URL param, or recovered from
    // the loaded thread below).
    useEffect(() => {
        if (!activeListingId) {
            setSharedProduct(null);
            return;
        }
        listingsService.getListing(activeListingId)
            .then(setSharedProduct)
            .catch(err => console.error('Failed to load shared product details', err));
    }, [activeListingId]);

    // Whichever side of this listing's conversation the viewer is on --
    // this same page is used by both buyers (via "Contact Seller") and
    // sellers (via "Open Full Messages" from their dashboard), so the
    // purchase-confirmation controls below need to know which role to show.
    const isViewerSeller = !!(currentUser && sharedProduct && currentUser.id === sharedProduct.owner_id);
    const buyerIdForDeal = isViewerSeller ? selectedUserId : currentUser?.id;

    useEffect(() => {
        if (!activeListingId || !buyerIdForDeal) {
            setDeal(null);
            return;
        }
        dealsService.getDeal(Number(activeListingId), buyerIdForDeal)
            .then(setDeal)
            .catch(() => setDeal(null));
    }, [activeListingId, buyerIdForDeal]);

    const handleMarkPurchased = async () => {
        if (!activeListingId) return;
        setDealActionLoading(true);
        try {
            const updated = await dealsService.markPurchased(Number(activeListingId));
            setDeal(updated);
        } catch (err) {
            console.error('Failed to mark as purchased', err);
        } finally {
            setDealActionLoading(false);
        }
    };

    const handleSellerConfirm = async () => {
        if (!deal) return;
        setDealActionLoading(true);
        try {
            const updated = await dealsService.sellerConfirm(deal.id);
            setDeal(updated);
            // Only the two-sided confirmation counts as a sale. `revenue`
            // is the listing's price at confirmation time -- Suqafuran
            // doesn't process payment, so there's no verified transaction
            // amount anywhere to pull instead; this is a best-effort
            // estimate, not a payment-gateway-confirmed total.
            if (updated.outcome === 'bought' && sharedProduct) {
                const revenue = sharedProduct.price ?? 0;
                trackEvent('Purchase', {
                    revenue,
                    listing_id: sharedProduct.id,
                    category_id: sharedProduct.category_id,
                    seller_id: updated.seller_id,
                });
                trackCharge(revenue, { listing_id: sharedProduct.id });
            }
        } catch (err) {
            console.error('Failed to confirm deal', err);
        } finally {
            setDealActionLoading(false);
        }
    };

    const handleSellerDeny = async () => {
        if (!deal) return;
        setDealActionLoading(true);
        try {
            const updated = await dealsService.sellerDeny(deal.id);
            setDeal(updated);
        } catch (err) {
            console.error('Failed to deny deal', err);
        } finally {
            setDealActionLoading(false);
        }
    };

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
        if (!selectedUserId) {
            setHasLoadedMessages(false);
            return;
        }

        const loadMessages = async () => {
            try {
                setIsLoading(true);
                setHasLoadedMessages(false);
                const response = await api.get(`/messages/${selectedUserId}`);
                const loaded: ChatMessage[] = response.data || [];
                setMessages(loaded);

                // Recover which listing this thread is about from its own
                // history, unless the URL already pins one for this exact
                // conversation (a fresh arrival from "Contact Seller").
                if (!(sharedProductId && selectedUserId === Number(targetUserId))) {
                    const withListing = [...loaded].reverse().find((m) => m.listing_id);
                    setActiveListingId(withListing ? String(withListing.listing_id) : null);
                }
            } catch (error) {
                console.error('Failed to load messages:', error);
                setMessages([]);
            } finally {
                setIsLoading(false);
                setHasLoadedMessages(true);
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

    // Pre-fill a real opening line ONLY for a brand-new, product-initiated
    // conversation -- once messages have actually loaded (so this never
    // fires while a conversation with history is still loading or has existing messages).
    useEffect(() => {
        if (!hasLoadedMessages || isLoading) return;

        // If there are ALREADY messages in this conversation, never leave or prefill an auto inquiry:
        if (messages.length > 0) {
            if (inputText.startsWith('Hi! \u{1F44B} I just came across') || inputText.includes('[PRODUCT_IMAGE]')) {
                setInputText('');
            }
            return;
        }

        // Only pre-fill when genuinely 0 messages exist in this thread and user has not typed anything
        if (messages.length === 0 && sharedProduct && !inputText.trim()) {
            const productTitle = field(sharedProduct.title_en, sharedProduct.title_so) || sharedProduct.title_en || 'this item';
            setInputText(buildOpeningMessage(productTitle));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasLoadedMessages, isLoading, messages.length, sharedProduct]);

    // Safety guard: ensure internal tags like [PRODUCT_IMAGE] are never shown in the human chat text input
    useEffect(() => {
        if (inputText.includes('[PRODUCT_IMAGE]')) {
            setInputText((prev) => prev.replace(/\[PRODUCT_IMAGE\]:\s*[^\n\r]+/gi, '').trim());
        }
    }, [inputText]);

    // Subscribe to presence and updates for the active conversation partner
    useEffect(() => {
        if (selectedUserId) {
            subscribeToUser(selectedUserId);
        }
    }, [selectedUserId, subscribeToUser]);

    // Handle incoming real-time messages. Re-registered whenever
    // selectedUserId changes so the closure always compares against the
    // conversation that's actually open right now.
    useEffect(() => {
        onMessage((message) => {
            if (selectedUserId && (message.sender_id === selectedUserId || message.receiver_id === selectedUserId)) {
                setMessages((prev) => {
                    const exists = prev.some((m) =>
                        (m.id && message.id && m.id === message.id) ||
                        (m.sender_id === message.sender_id &&
                         m.content === message.content &&
                         Math.abs(parseServerDate(m.timestamp || m.created_at).getTime() - parseServerDate(message.timestamp || message.created_at).getTime()) < 3000)
                    );
                    return exists ? prev : [...prev, message];
                });
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

    // Filter conversations by search query and active tab
    const filteredConversations = conversations.filter(conv => {
        const matchesSearch = (conv.other_user_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' || ((conv.unread_count ?? 0) > 0);
        return matchesSearch && matchesTab;
    });

    // Core message sender (supports text, [IMAGE]:..., [VOICE|...]:...)
    const sendChatMessage = async (contentToSend: string) => {
        if (!contentToSend.trim() || !selectedUserId) return;

        try {
            setIsSending(true);
            const isNewConversation = messages.length === 0;

            const sendResponse = await api.post('/messages/', {
                receiver_id: selectedUserId,
                content: contentToSend,
                ...(activeListingId ? { listing_id: Number(activeListingId) } : {}),
            });

            const newMsg: ChatMessage = sendResponse?.data || {
                id: Date.now(),
                sender_id: currentUser?.id || 0,
                receiver_id: selectedUserId,
                content: contentToSend,
                listing_id: activeListingId ? Number(activeListingId) : undefined,
                timestamp: new Date().toISOString(),
                created_at: new Date().toISOString(),
            };

            setMessages((prev) => {
                const exists = prev.some((m) => m.id === newMsg.id);
                return exists ? prev : [...prev, newMsg];
            });

            const previewText = contentToSend.includes('[PRODUCT_IMAGE]') || contentToSend.includes('🛍️')
                ? '🛍️ Product Inquiry'
                : contentToSend.startsWith('[IMAGE]')
                ? '📷 Photo'
                : contentToSend.startsWith('[VOICE')
                ? '🎤 Voice message'
                : contentToSend;

            setConversations((prev) =>
                prev.map((c) =>
                    c.other_user_id === selectedUserId
                        ? { ...c, last_message: previewText, last_message_time: new Date().toISOString() }
                        : c
                )
            );

            trackEvent('Message Sent', { receiver_id: selectedUserId });
            if (isNewConversation) {
                trackEvent('Conversation Started', { receiver_id: selectedUserId });
            }

            if (isConnected) {
                setTyping(selectedUserId, false);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            const detailMsg = (error as any)?.response?.data?.detail || (error as any)?.message || 'Failed to send message';
            alert(detailMsg);
        } finally {
            setIsSending(false);
        }
    };

    // Pre-send fraud risk detection as user types
    const currentInputFraudAlert = useMemo(() => {
        return detectFraudRisk(inputText);
    }, [inputText]);

    // Handle form submit (text and/or pending image)
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSending || !selectedUserId) return;

        // 1. If an image is selected, upload and send it
        if (selectedImageFile) {
            try {
                setIsUploadingImage(true);
                const uploadRes = await imageService.uploadImage(selectedImageFile);
                const caption = inputText.trim();
                const imageMessage = `[IMAGE]:${uploadRes.url}${caption ? `\n${caption}` : ''}`;
                cancelImagePreview();
                setInputText('');
                await sendChatMessage(imageMessage);
            } catch (err: any) {
                console.error('Image upload failed:', err);
                alert(err?.response?.data?.detail || 'Failed to upload image. Please try again.');
            } finally {
                setIsUploadingImage(false);
            }
            return;
        }

        // 2. Normal text message
        const text = inputText.trim();
        if (!text) return;
        setInputText('');
        setIsUserTyping(false);
        setShowEmojiPicker(false);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // If this is the very first message initiated about a specific product,
        // format it with 🛍️ INQUIRY: tag so it renders as the structured inquiry card
        const isFirstProductInquiry = messages.length === 0 && Boolean(activeListingId && sharedProduct);
        const productTitle = sharedProduct ? (field(sharedProduct.title_en, sharedProduct.title_so) || sharedProduct.title_en) : '';
        const finalContent = isFirstProductInquiry && !text.includes('INQUIRY:')
            ? `🛍️ INQUIRY: ${productTitle}\n\n${text}`
            : text;

        await sendChatMessage(finalContent);
    };

    // Image attachment handlers
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (PNG, JPG, WEBP).');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('Image must be under 10MB.');
            return;
        }
        setSelectedImageFile(file);
        setSelectedImagePreview(URL.createObjectURL(file));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const cancelImagePreview = () => {
        if (selectedImagePreview) {
            URL.revokeObjectURL(selectedImagePreview);
        }
        setSelectedImageFile(null);
        setSelectedImagePreview(null);
    };

    // Voice recording handlers
    const startVoiceRecording = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('Audio recording is not supported on this device/browser.');
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
                ? 'audio/webm' 
                : MediaRecorder.isTypeSupported('audio/mp4') 
                ? 'audio/mp4' 
                : '';
            const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];
            isCancelledVoiceRef.current = false;

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            recorder.onstop = async () => {
                if (mediaStreamRef.current) {
                    mediaStreamRef.current.getTracks().forEach((track) => track.stop());
                }
                if (recordingTimerRef.current) {
                    clearInterval(recordingTimerRef.current);
                }

                if (isCancelledVoiceRef.current || audioChunksRef.current.length === 0) {
                    setIsRecordingVoice(false);
                    setRecordingDuration(0);
                    return;
                }

                const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = reader.result as string;
                    const sec = recordingDuration || 1;
                    const m = Math.floor(sec / 60);
                    const s = Math.floor(sec % 60);
                    const timeLabel = `${m}:${s < 10 ? '0' : ''}${s}`;
                    await sendChatMessage(`[VOICE|${timeLabel}]:${base64Audio}`);
                    setIsRecordingVoice(false);
                    setRecordingDuration(0);
                };
            };

            recorder.start(100);
            setIsRecordingVoice(true);
            setRecordingDuration(0);
            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration((prev) => prev + 1);
            }, 1000);
        } catch (err: any) {
            console.error('Failed to start audio recording:', err);
            alert('Microphone permission denied or unavailable. Please enable microphone permissions in your browser settings.');
        }
    };

    const stopAndSendVoiceRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            isCancelledVoiceRef.current = false;
            mediaRecorderRef.current.stop();
        }
    };

    const cancelVoiceRecording = () => {
        isCancelledVoiceRef.current = true;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecordingVoice(false);
        setRecordingDuration(0);
    };

    const selectedConversation = conversations.find(c => c.other_user_id === selectedUserId);

    const handleOpenSellerShop = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const shopTarget = sharedProduct?.shop_id || sharedProduct?.owner_id || selectedConversation?.other_user_id;
        if (shopTarget) {
            navigate(`/shop/${shopTarget}`);
        }
    };

    return (
        <div className="w-full h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px)-4.5rem)] md:h-[calc(100vh-8rem)] md:max-w-7xl md:mx-auto md:px-6 md:py-6 p-0">
            <div className="h-full rounded-none md:rounded-[32px] overflow-hidden bg-white border-0 md:border md:border-gray-100 md:shadow-2xl dark:bg-neutral-950 dark:border-neutral-800 flex">

                {/* Conversations Left Panel */}
                <aside className={`${selectedUserId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-[360px] shrink-0 border-r border-gray-100 dark:border-neutral-800 flex-col h-full min-h-0 bg-slate-50/40 dark:bg-black/20 overflow-hidden`}>
                    {/* Panel Header */}
                    <div className="p-4 space-y-3.5 border-b border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.history.back()}
                                    className="p-1.5 -ml-1 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
                                    aria-label="Back"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <h2 className="text-lg font-black text-gray-900 dark:text-neutral-50 tracking-tight">
                                    Messages
                                </h2>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800">
                                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <span className="text-[10px] font-bold text-gray-600 dark:text-neutral-300">
                                    {isConnected ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>

                        {/* Segmented Filter Tabs */}
                        <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-neutral-900 border border-slate-200/70 dark:border-neutral-800">
                            <button
                                type="button"
                                onClick={() => setActiveTab('all')}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    activeTab === 'all'
                                        ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800'
                                }`}
                            >
                                <Users className="w-3.5 h-3.5" />
                                <span>All Chats</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('unread')}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    activeTab === 'unread'
                                        ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 dark:text-neutral-400 hover:text-gray-800'
                                }`}
                            >
                                <span>Unread</span>
                                {conversations.some((c) => (c.unread_count ?? 0) > 0) && (
                                    <span className="w-2 h-2 rounded-full bg-orange-600" />
                                )}
                            </button>
                        </div>

                        {/* Search Input Bar */}
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-900/80 pl-10 pr-9 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-neutral-950 text-gray-900 dark:text-white transition-all placeholder:text-gray-400"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
                            Loading conversations...
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-center p-6">
                            <div className="space-y-2">
                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-neutral-900 flex items-center justify-center mx-auto text-gray-400">
                                    <MessageSquare className="h-6 w-6" />
                                </div>
                                <p className="text-xs font-bold text-gray-800 dark:text-neutral-200">No conversations found</p>
                                <p className="text-[11px] text-gray-400 dark:text-neutral-400">Reach out to a seller to start chatting.</p>
                            </div>
                        </div>
                    ) : (
                        <div
                            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
                            className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-gray-100 dark:divide-neutral-800/50 pb-20 md:pb-4"
                        >
                            {filteredConversations.map((conv) => (
                                <button
                                    key={conv.other_user_id}
                                    onClick={() => setSelectedUserId(conv.other_user_id)}
                                    className={`w-full p-3.5 flex gap-3 text-left transition-all ${
                                        selectedUserId === conv.other_user_id
                                            ? 'bg-sky-50/60 dark:bg-sky-950/20'
                                            : 'hover:bg-white/80 dark:hover:bg-neutral-900/50'
                                    }`}
                                >
                                    <div className="relative shrink-0">
                                        {conv.other_user_avatar ? (
                                            <img
                                                src={conv.other_user_avatar}
                                                alt={conv.other_user_name}
                                                className="h-12 w-12 rounded-2xl object-cover border border-slate-200 dark:border-neutral-800 shadow-sm"
                                            />
                                        ) : (
                                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
                                                {(conv.other_user_name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span
                                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-950 ${conv.is_online ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-neutral-600'}`}
                                            title={conv.is_online ? 'Online' : 'Offline'}
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                                        <div className="flex justify-between items-start gap-2 min-w-0">
                                            <h4 className="text-xs font-black text-gray-900 dark:text-neutral-50 truncate">
                                                {conv.other_user_name || `User ${conv.other_user_id}`}
                                            </h4>
                                            {(conv.last_message_time || conv.last_message_at) && (
                                                <span className="text-[10px] text-gray-400 dark:text-neutral-400 font-bold shrink-0 whitespace-nowrap">
                                                    {formatMessageDate(conv.last_message_time || conv.last_message_at)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center gap-2 min-w-0 mt-1">
                                            <p className="text-[11px] text-gray-500 dark:text-neutral-400 truncate font-medium">
                                                {conv.last_message?.includes('[PRODUCT_IMAGE]') || conv.last_message?.includes('🛍️')
                                                    ? '🛍️ Product Inquiry'
                                                    : conv.last_message?.startsWith('[IMAGE]')
                                                    ? '📷 Photo'
                                                    : conv.last_message?.startsWith('[VOICE')
                                                    ? '🎤 Voice message'
                                                    : conv.last_message || 'Start the conversation'}
                                            </p>
                                            {(conv.unread_count ?? 0) > 0 ? (
                                                <span className="h-4 min-w-4 px-1.5 rounded-full bg-sky-500 text-white text-[9px] font-black flex items-center justify-center shrink-0">
                                                    {conv.unread_count}
                                                </span>
                                            ) : (
                                                <CheckCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </aside>

                {/* Conversation Right Panel */}
                <div className={`${selectedUserId ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-h-0 h-full min-w-0 bg-white dark:bg-neutral-950 overflow-hidden relative`}>
                    {selectedUserId && selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-3 sm:p-3.5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-950 shrink-0">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedUserId(null)}
                                        className="md:hidden -ml-1 p-1 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
                                        aria-label="Back to conversations"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>
                                    {/* Clickable seller avatar and shop profile header */}
                                    <button
                                        type="button"
                                        onClick={handleOpenSellerShop}
                                        className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
                                        title="View Seller Shop Profile"
                                    >
                                        <div className="relative shrink-0">
                                            {selectedConversation.other_user_avatar ? (
                                                <img
                                                    src={selectedConversation.other_user_avatar}
                                                    alt={selectedConversation.other_user_name}
                                                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl object-cover border border-slate-200 dark:border-neutral-800 shadow-sm group-hover:scale-105 group-hover:ring-2 group-hover:ring-orange-500/40 transition-all"
                                                />
                                            ) : (
                                                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-xs shadow-sm group-hover:scale-105 group-hover:ring-2 group-hover:ring-orange-500/40 transition-all">
                                                    {(selectedConversation.other_user_name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span
                                                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-neutral-950 ${isOtherUserOnline ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-neutral-600'}`}
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-xs sm:text-sm font-black text-gray-900 dark:text-neutral-50 truncate flex items-center gap-1.5 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                                <span>{selectedConversation.other_user_name || `User ${selectedConversation.other_user_id}`}</span>
                                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded-md">
                                                    <Store className="w-2.5 h-2.5" />
                                                    Shop
                                                </span>
                                            </h3>
                                            <p className="text-[10px] text-gray-500 dark:text-neutral-300">
                                                {isOtherUserTyping ? (
                                                    <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold">
                                                        <span>typing</span>
                                                        <Loader className="h-3 w-3 animate-spin" />
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 font-semibold">
                                                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${isOtherUserOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                                        <span className={isOtherUserOnline ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-400 dark:text-neutral-500'}>
                                                            {isOtherUserOnline ? 'Online' : 'Offline'}
                                                        </span>
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </button>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setShowReportModal(true)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-xs font-bold"
                                        title="Report fraud or suspicious activity"
                                    >
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Report</span>
                                    </button>
                                    <button
                                        onClick={handleOpenSellerShop}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors text-xs font-bold shadow-xs active:scale-95"
                                        title="Visit Seller Shop"
                                    >
                                        <Store className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Visit Shop</span>
                                    </button>
                                </div>
                            </div>

                            {/* Dismissible Fraud Shield Advisory Bar */}
                            {showFraudShield && (
                                <div className="px-3.5 py-1.5 bg-amber-50/80 dark:bg-amber-950/30 border-b border-amber-200/50 dark:border-amber-900/30 flex items-center justify-between text-[11px] text-amber-900 dark:text-amber-200 shrink-0">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        <span className="font-medium truncate text-[10px] sm:text-[11px]">
                                            <strong>Fraud Shield:</strong> Inspect items before paying. Never send deposits.
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setShowFraudShield(false)}
                                        className="p-1 text-amber-700/70 hover:text-amber-900 shrink-0 ml-1 rounded-md"
                                        title="Dismiss advisory"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}

                            {/* Compact Pinned Product Bar */}
                            {sharedProduct && (
                                <div className="border-b border-gray-100 dark:border-neutral-800 bg-amber-50/40 dark:bg-amber-500/5 shrink-0 transition-all">
                                    <div className="flex items-center justify-between px-3.5 py-1.5 sm:py-2 gap-2">
                                        <a
                                            href={`/listing/${sharedProduct.id}`}
                                            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90"
                                        >
                                            <img
                                                src={optimizeCloudinaryUrl(sharedProduct.images?.[0], { width: 80 }) || sharedProduct.images?.[0]}
                                                alt={field(sharedProduct.title_en, sharedProduct.title_so) || sharedProduct.title_en}
                                                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl object-cover shrink-0 bg-gray-100 dark:bg-neutral-800 border border-slate-200/50"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[9px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                                    <ShoppingBag className="h-2.5 w-2.5" /> Chatting about
                                                </p>
                                                <p className="text-xs font-black text-gray-900 dark:text-neutral-50 truncate">
                                                    {field(sharedProduct.title_en, sharedProduct.title_so) || sharedProduct.title_en}
                                                </p>
                                            </div>
                                        </a>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <p className="text-xs font-black text-[#00a082]">
                                                {formatConvertedPrice(sharedProduct.price, sharedProduct.currency, currency)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Purchase confirmation -- Suqafuran doesn't process payment,
                                so this is the only signal the platform has that a sale
                                actually happened, distinct from just "expressed interest". */}
                            {sharedProduct && !isViewerSeller && !deal && (
                                <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-neutral-800 bg-slate-50 dark:bg-black/20">
                                    <p className="text-xs font-semibold text-gray-600 dark:text-neutral-300 flex items-center gap-1.5">
                                        <HelpCircle className="h-3.5 w-3.5" /> Did you purchase this?
                                    </p>
                                    <button
                                        onClick={handleMarkPurchased}
                                        disabled={dealActionLoading}
                                        className="text-[11px] font-black text-white bg-[#00a082] hover:bg-[#008f73] disabled:opacity-50 rounded-full px-3 py-1.5 transition-colors"
                                    >
                                        Yes, I purchased it
                                    </button>
                                </div>
                            )}

                            {sharedProduct && !isViewerSeller && deal?.outcome === 'pending' && (
                                <div className="px-4 py-2 border-b border-gray-100 dark:border-neutral-800 bg-amber-50/60 dark:bg-amber-500/5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                    Waiting for the seller to confirm your purchase...
                                </div>
                            )}

                            {sharedProduct && isViewerSeller && deal?.outcome === 'pending' && (
                                <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-neutral-800 bg-slate-50 dark:bg-black/20">
                                    <p className="text-xs font-semibold text-gray-600 dark:text-neutral-300">
                                        Buyer indicated they purchased this. Confirm the sale?
                                    </p>
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={handleSellerDeny}
                                            disabled={dealActionLoading}
                                            className="text-[11px] font-bold text-gray-600 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 hover:bg-gray-50 disabled:opacity-50 rounded-full px-3 py-1.5 transition-colors"
                                        >
                                            I didn't sell this
                                        </button>
                                        <button
                                            onClick={handleSellerConfirm}
                                            disabled={dealActionLoading}
                                            className="text-[11px] font-black text-white bg-[#00a082] hover:bg-[#008f73] disabled:opacity-50 rounded-full px-3 py-1.5 transition-colors"
                                        >
                                            Confirm Purchase
                                        </button>
                                    </div>
                                </div>
                            )}

                            {sharedProduct && deal?.outcome === 'bought' && (
                                <div className="px-4 py-2 border-b border-gray-100 dark:border-neutral-800 bg-emerald-50 dark:bg-emerald-500/10 text-[11px] font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Purchase confirmed
                                </div>
                            )}

                            {sharedProduct && deal?.outcome === 'not_bought' && (
                                <div className="px-4 py-2 border-b border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 text-[11px] font-semibold text-gray-500 dark:text-neutral-400">
                                    Marked as not purchased
                                </div>
                            )}

                            {/* Chat History View */}
                            <div
                                ref={messagesContainerRef}
                                onScroll={handleMessagesScroll}
                                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
                                className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-6 space-y-3 bg-slate-50/40 dark:bg-black/10"
                            >
                                {/* Date Divider */}
                                <div className="flex justify-center py-1">
                                    <span className="px-3 py-1 rounded-full bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800 text-[10px] font-bold text-gray-400 shadow-sm">
                                        Today
                                    </span>
                                </div>

                                {isLoading ? (
                                    <div className="text-center py-8 text-xs text-gray-400">Loading messages...</div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center py-8 text-xs text-gray-400 font-medium">No messages yet. Say hello to start the chat!</div>
                                ) : (
                                    messages.map((msg) => {
                                        const isMe = msg.sender_id !== selectedUserId;
                                        const isOrderInquiry = 
                                            msg.content.includes('[PRODUCT_IMAGE]:') ||
                                            msg.content.toLowerCase().includes('order inquiry') || 
                                            msg.content.toLowerCase().includes('inquiry:') || 
                                            msg.content.includes("I'd like to buy:") || 
                                            msg.content.includes('#ORD-') || 
                                            msg.content.includes('🛍️') ||
                                            msg.content.startsWith('📦');
                                        const isImage = !isOrderInquiry && (msg.content.startsWith('[IMAGE]:') || msg.content.includes('[IMAGE]:'));
                                        const isVoice = msg.content.startsWith('[VOICE');
                                        const fraudAlert = !isMe ? detectFraudRisk(msg.content) : { isSuspicious: false };

                                        let imageUrl = '';
                                        let imageCaption = '';
                                        if (isImage) {
                                            const parts = msg.content.replace(/^\[IMAGE\]:\s*/, '').split('\n');
                                            imageUrl = parts[0]?.trim() || '';
                                            imageCaption = parts.slice(1).join('\n').trim();
                                        }

                                        let voiceUrl = '';
                                        let voiceDuration = '0:05';
                                        if (isVoice) {
                                            const match = msg.content.match(/^\[VOICE(?:\|([^\]]+))?\]:(.*)$/s);
                                            if (match) {
                                                voiceDuration = match[1] || '0:05';
                                                voiceUrl = match[2]?.trim() || '';
                                            }
                                        }

                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                {!isMe && (
                                                    <button
                                                        type="button"
                                                        onClick={handleOpenSellerShop}
                                                        className="shrink-0 mb-1 hover:scale-110 active:scale-95 transition-transform"
                                                        title="View Seller Shop"
                                                    >
                                                        {selectedConversation.other_user_avatar ? (
                                                            <img
                                                                src={selectedConversation.other_user_avatar}
                                                                alt=""
                                                                className="w-7 h-7 rounded-xl object-cover border border-slate-200 dark:border-neutral-800 shadow-xs"
                                                            />
                                                        ) : (
                                                            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-[10px] shadow-xs">
                                                                {(selectedConversation.other_user_name || 'U').charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </button>
                                                )}
                                                <div className={`max-w-[88%] sm:max-w-[70%] space-y-1`}>
                                                    {isOrderInquiry ? (
                                                        <OrderReceiptBubble content={msg.content} isMe={isMe} listingId={msg.listing_id} />
                                                    ) : isImage && imageUrl ? (
                                                        <div className={`rounded-2xl p-2 shadow-sm border overflow-hidden ${
                                                            isMe 
                                                                ? 'bg-[#0284c7] border-sky-600 rounded-br-sm text-white' 
                                                                : 'bg-white dark:bg-neutral-900 border-slate-200/80 dark:border-neutral-800 text-gray-800 dark:text-neutral-100 rounded-bl-sm'
                                                        }`}>
                                                            <div 
                                                                onClick={() => setLightboxImageUrl(imageUrl)}
                                                                className="relative group cursor-pointer overflow-hidden rounded-xl max-w-xs"
                                                            >
                                                                <img 
                                                                    src={imageUrl} 
                                                                    alt="Shared photo" 
                                                                    className="w-full max-h-64 object-cover rounded-xl transition-transform duration-200 hover:scale-102" 
                                                                />
                                                                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Maximize2 className="w-3.5 h-3.5" />
                                                                </div>
                                                            </div>
                                                            {imageCaption && (
                                                                <p className="p-1.5 text-xs font-semibold leading-relaxed whitespace-pre-wrap break-words">
                                                                    {imageCaption}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : isVoice && voiceUrl ? (
                                                        <div className={`rounded-2xl shadow-sm border overflow-hidden ${
                                                            isMe 
                                                                ? 'bg-[#0284c7] border-sky-600 rounded-br-sm' 
                                                                : 'bg-white dark:bg-neutral-900 border-slate-200/80 dark:border-neutral-800 rounded-bl-sm'
                                                        }`}>
                                                            <VoiceNotePlayer src={voiceUrl} durationLabel={voiceDuration} isMe={isMe} />
                                                        </div>
                                                    ) : (() => {
                                                        const { imageUrl: fallbackImg, cleanText } = parseMessageContent(msg.content);
                                                        return (
                                                            <div className={`rounded-2xl p-3 sm:p-3.5 text-xs sm:text-sm font-semibold leading-relaxed whitespace-pre-wrap break-words shadow-sm select-text ${
                                                                isMe
                                                                    ? 'bg-[#0284c7] text-white rounded-br-sm'
                                                                    : 'bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 text-gray-800 dark:text-neutral-100 rounded-bl-sm'
                                                            }`}>
                                                                {fallbackImg && (
                                                                    <div 
                                                                        onClick={() => setLightboxImageUrl(fallbackImg)}
                                                                        className="mb-2.5 overflow-hidden rounded-xl border border-white/20 dark:border-neutral-700/60 bg-black/10 cursor-pointer group relative max-w-xs"
                                                                    >
                                                                        <img 
                                                                            src={fallbackImg} 
                                                                            alt="Attached image" 
                                                                            className="w-full max-h-64 object-cover rounded-xl transition-transform duration-200 group-hover:scale-102"
                                                                            loading="lazy" 
                                                                        />
                                                                        <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <Maximize2 className="w-3.5 h-3.5" />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {cleanText || (fallbackImg ? '' : msg.content)}
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* Fraud Risk Alert Pill if scam patterns detected */}
                                                    {fraudAlert.isSuspicious && (
                                                        <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2 shadow-xs">
                                                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                                            <div>
                                                                <strong className="font-bold block text-amber-900 dark:text-amber-200">{fraudAlert.title}</strong>
                                                                <span className="leading-tight">{fraudAlert.warning}</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className={`flex items-center gap-1 px-1 text-[9px] text-gray-400 font-semibold ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                        <span>
                                                            {formatMessageTime(msg.created_at || msg.timestamp)}
                                                        </span>
                                                        {isMe && <CheckCheck className="w-3 h-3 text-sky-500" />}
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
                                    className="absolute bottom-20 right-4 z-20 px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-bold shadow-lg shadow-sky-500/30 flex items-center gap-1.5 transition-all animate-bounce"
                                    aria-label="Scroll to latest messages"
                                >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                    <span>Latest</span>
                                </button>
                            )}

                            {/* Chat Input form area */}
                            <div className="relative p-3 sm:p-4 border-t border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-950">
                                {/* Emoji Picker Popover */}
                                {showEmojiPicker && (
                                    <EmojiPickerPopover 
                                        onSelect={(emoji) => setInputText((prev) => prev + emoji)}
                                        onClose={() => setShowEmojiPicker(false)}
                                    />
                                )}

                                {/* Real-time Pre-send Fraud Alert Pill */}
                                {currentInputFraudAlert.isSuspicious && (
                                    <div className="mb-2 p-2 px-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-1">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                        <span className="truncate">
                                            <strong>{currentInputFraudAlert.title}:</strong> {currentInputFraudAlert.warning}
                                        </span>
                                    </div>
                                )}

                                {/* Image preview before sending */}
                                {selectedImagePreview && (
                                    <div className="mb-2 p-2 rounded-2xl bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3 max-w-sm">
                                        <div className="flex items-center gap-2.5 truncate">
                                            <img src={selectedImagePreview} alt="Preview" className="w-10 h-10 rounded-xl object-cover border" />
                                            <span className="text-xs font-semibold text-gray-700 dark:text-neutral-300 truncate">
                                                {selectedImageFile?.name || 'Photo selected'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={cancelImagePreview}
                                            className="p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200"
                                            aria-label="Remove image"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* Voice Recording Active Bar */}
                                {isRecordingVoice ? (
                                    <div className="flex items-center justify-between gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-full px-4 py-2 animate-in fade-in">
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                                            <span className="text-xs font-bold text-red-600 dark:text-red-400">
                                                Recording voice note... {Math.floor(recordingDuration / 60)}:{recordingDuration % 60 < 10 ? '0' : ''}{recordingDuration % 60}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={cancelVoiceRecording}
                                                className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
                                                title="Cancel recording"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={stopAndSendVoiceRecording}
                                                className="px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow flex items-center gap-1.5 active:scale-95 transition-transform"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                                Send Voice
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Normal Chat Input Form */
                                    <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 rounded-full px-3 py-1.5 focus-within:ring-2 focus-within:ring-sky-500 transition-all">
                                        {/* Hidden File Input for images */}
                                        <input 
                                            ref={fileInputRef} 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={handleImageSelect} 
                                        />

                                        {/* Emoji Button */}
                                        <button
                                            type="button"
                                            onClick={() => setShowEmojiPicker((prev) => !prev)}
                                            className={`p-1.5 transition-colors rounded-full ${
                                                showEmojiPicker 
                                                    ? 'text-orange-500 bg-orange-50 dark:bg-orange-950/30' 
                                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200'
                                            }`}
                                            aria-label="Add emoji"
                                        >
                                            <Smile className="w-4 h-4" />
                                        </button>

                                        {/* Attach Image Button */}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploadingImage}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200 transition-colors"
                                            aria-label="Attach photo"
                                            title="Attach photo"
                                        >
                                            <ImageIcon className="w-4 h-4" />
                                        </button>

                                        {/* Text Input */}
                                        <input
                                            type="text"
                                            placeholder={selectedImagePreview ? "Add a caption (optional)..." : "Type message..."}
                                            value={inputText}
                                            onChange={handleInputChange}
                                            disabled={isSending || isUploadingImage}
                                            className="flex-1 bg-transparent px-2 py-1 text-xs sm:text-sm font-semibold outline-none text-gray-900 dark:text-neutral-50 placeholder:text-gray-400 disabled:opacity-50"
                                        />

                                        {/* Voice Record Button (when input is empty and no image selected) */}
                                        {!inputText.trim() && !selectedImageFile ? (
                                            <button
                                                type="button"
                                                onClick={startVoiceRecording}
                                                className="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-neutral-800 hover:bg-[#0284c7] hover:text-white text-gray-600 dark:text-neutral-300 flex items-center justify-center shrink-0 transition-all active:scale-95 shadow-xs"
                                                aria-label="Record voice message"
                                                title="Record voice message"
                                            >
                                                <Mic className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            /* Send Button */
                                            <button
                                                type="submit"
                                                disabled={isSending || isUploadingImage}
                                                className="w-8 h-8 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow transition-transform active:scale-95"
                                                aria-label="Send message"
                                            >
                                                {isUploadingImage || isSending ? (
                                                    <Loader className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Send className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        )}
                                    </form>
                                )}
                            </div>
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

            {/* Image Full-screen Lightbox */}
            {lightboxImageUrl && (
                <div 
                    onClick={() => setLightboxImageUrl(null)}
                    className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
                >
                    <div className="relative max-w-3xl max-h-[90vh]">
                        <button
                            type="button"
                            onClick={() => setLightboxImageUrl(null)}
                            className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300"
                            aria-label="Close image preview"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <img 
                            src={lightboxImageUrl} 
                            alt="Full-size preview" 
                            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" 
                        />
                    </div>
                </div>
            )}

            {/* Report Fraud Modal */}
            {showReportModal && selectedUserId && (
                <ReportFraudModal
                    reportedUserId={selectedUserId}
                    reportedUserName={selectedConversation?.other_user_name}
                    listingId={sharedProduct?.id || (activeListingId ? Number(activeListingId) : undefined)}
                    onClose={() => setShowReportModal(false)}
                />
            )}
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
