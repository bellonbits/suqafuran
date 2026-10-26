import { useEffect, useRef, useState, useCallback } from 'react';
import type { ChatMessage } from '@/types';
import { API_BASE_URL } from '@/services/api';

export type { ChatMessage };

interface ChatUser {
  id: number;
  name: string;
  avatar?: string;
  is_online: boolean;
  is_typing: boolean;
}

interface UseChatReturn {
  isConnected: boolean;
  userStatus: ChatUser | null;
  sendMessage: (content: string, receiverId: number, listingId?: number) => void;
  setTyping: (receiverId: number, isTyping: boolean) => void;
  subscribeToUser: (userId: number) => void;
  onMessage: (callback: (message: ChatMessage) => void) => void;
}

export function useChat(token: string): UseChatReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userStatus, setUserStatus] = useState<ChatUser | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageCallbackRef = useRef<((message: ChatMessage) => void) | null>(null);
  const presencePollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subscribedUserIdRef = useRef<number | null>(null);

  const getWsUrl = useCallback(() => {
    const wsBase = API_BASE_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
    return `${wsBase}/ws/chat?token=${encodeURIComponent(token)}`;
  }, [token]);

  // Connect to WebSocket
  useEffect(() => {
    if (!token) return;

    const wsUrl = getWsUrl();

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.event_type === 'new_message') {
            const message: ChatMessage = {
              id: Math.random(),
              sender_id: data.sender_id,
              receiver_id: data.receiver_id,
              content: data.content,
              listing_id: data.listing_id,
              timestamp: data.timestamp,
              created_at: data.timestamp,
            };
            if (messageCallbackRef.current) {
              messageCallbackRef.current(message);
            }
          } else if (data.event_type === 'user_typing') {
            setUserStatus(prev => ({
              ...prev,
              id: data.user_id,
              is_typing: true,
            } as ChatUser));

            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              setUserStatus(prev => ({
                ...prev,
                id: data.user_id,
                is_typing: false,
              } as ChatUser));
            }, 2000);
          } else if (data.event_type === 'user_stopped_typing') {
            setUserStatus(prev => ({
              ...prev,
              id: data.user_id,
              is_typing: false,
            } as ChatUser));
          } else if (data.event_type === 'presence') {
            setUserStatus(prev => ({
              ...prev,
              id: data.user_id,
              is_online: data.status === 'online',
            } as ChatUser));
          }
        } catch {
          // Ignore invalid frames
        }
      };

      wsRef.current.onerror = () => {
        setIsConnected(false);
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
      };

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        if (presencePollTimerRef.current) {
          clearInterval(presencePollTimerRef.current);
          presencePollTimerRef.current = null;
        }
      };
    } catch {
      setIsConnected(false);
    }
  }, [token, getWsUrl]);

  const checkPresence = useCallback(async (userId: number) => {
    if (!token || !userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/messages/users/${userId}/presence`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUserStatus(prev => ({
          id: userId,
          name: prev?.id === userId ? prev.name : '',
          avatar: prev?.id === userId ? prev.avatar : undefined,
          is_online: Boolean(data.is_online),
          is_typing: prev?.id === userId ? prev.is_typing : false,
        }));
      }
    } catch {
      // Ignore network errors
    }
  }, [token]);

  const sendMessage = useCallback(
    async (content: string, receiverId: number, listingId?: number) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            event_type: 'message',
            other_user_id: receiverId,
            content,
            listing_id: listingId,
          })
        );
        return;
      }

      // HTTP fallback when WebSocket is unavailable or blocked
      try {
        await fetch(`${API_BASE_URL}/messages/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            receiver_id: receiverId,
            content,
            listing_id: listingId,
          }),
        });
      } catch (err) {
        console.error('[Chat] Failed to send message:', err);
      }
    },
    [token]
  );

  const setTyping = useCallback((receiverId: number, isTyping: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        event_type: isTyping ? 'typing' : 'stop_typing',
        other_user_id: receiverId,
      })
    );
  }, []);

  const subscribeToUser = useCallback((userId: number) => {
    subscribedUserIdRef.current = userId;

    // 1. Immediate presence check via HTTP
    checkPresence(userId);

    // 2. Poll presence every 10 seconds to keep online status accurate
    if (presencePollTimerRef.current) {
      clearInterval(presencePollTimerRef.current);
    }
    presencePollTimerRef.current = setInterval(() => {
      if (subscribedUserIdRef.current === userId) {
        checkPresence(userId);
      }
    }, 10000);

    // 3. If WebSocket is connected, also send subscribe frame
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event_type: 'subscribe',
          other_user_id: userId,
        })
      );
    }
  }, [checkPresence]);

  const onMessage = useCallback((callback: (message: ChatMessage) => void) => {
    messageCallbackRef.current = callback;
  }, []);

  return {
    isConnected,
    userStatus,
    sendMessage,
    setTyping,
    subscribeToUser,
    onMessage,
  };
}
