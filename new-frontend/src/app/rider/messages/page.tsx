"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { riderService } from '@/services/riderService';
import '../common-pages.css';
import './messages.css';

interface Conversation {
    id: string;
    customer_id: string;
    customer_name: string;
    customer_avatar?: string;
    last_message: string;
    last_message_time: string;
    unread_count: number;
    status: 'active' | 'completed' | 'archived';
}

interface Message {
    id: string;
    sender_id: string;
    sender_type: 'rider' | 'customer';
    message: string;
    sent_at: string;
    read: boolean;
}

export default function MessagesPage() {
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');
    const [conversations, setConversations] = useState<Conversation[]>([
        {
            id: '1',
            customer_id: 'cust1',
            customer_name: 'John Doe',
            last_message: 'Thank you for the quick delivery!',
            last_message_time: new Date(Date.now() - 5 * 60000).toISOString(),
            unread_count: 0,
            status: 'completed'
        },
        {
            id: '2',
            customer_id: 'cust2',
            customer_name: 'Jane Smith',
            last_message: 'Can you hurry up a bit? I need it urgently',
            last_message_time: new Date(Date.now() - 2 * 60000).toISOString(),
            unread_count: 1,
            status: 'active'
        }
    ]);
    const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { data: messagesData, isLoading } = useQuery({
        queryKey: ['riderMessages'],
        queryFn: () => riderService.getMessages ? riderService.getMessages(1, 50) : Promise.resolve(null)
    });

    const sendMutation = useMutation({
        mutationFn: (message: string) => {
            if (!selectedConversationId) throw new Error('No conversation selected');
            return riderService.sendMessage({
                recipient_id: selectedConversationId,
                message
            });
        },
        onSuccess: (data) => {
            setCurrentMessages([
                ...currentMessages,
                {
                    id: data.message_id,
                    sender_id: data.sender_id,
                    sender_type: 'rider',
                    message: data.message,
                    sent_at: data.sent_at,
                    read: true
                }
            ]);
            setMessageText('');
        },
        onError: (error: any) => {
            alert(`Error sending message: ${error.message}`);
        }
    });

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentMessages]);

    const handleSelectConversation = (conversationId: string) => {
        setSelectedConversationId(conversationId);
        // In a real app, this would fetch messages for the conversation
        setCurrentMessages([
            {
                id: '1',
                sender_id: 'cust2',
                sender_type: 'customer',
                message: 'Hi, can you arrive faster?',
                sent_at: new Date(Date.now() - 10 * 60000).toISOString(),
                read: true
            },
            {
                id: '2',
                sender_id: 'rider1',
                sender_type: 'rider',
                message: 'I am 5 minutes away, almost there!',
                sent_at: new Date(Date.now() - 8 * 60000).toISOString(),
                read: true
            }
        ]);
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim()) return;
        sendMutation.mutate(messageText);
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    const selectedConversation = conversations.find(c => c.id === selectedConversationId);

    return (
        <div className="messages-page">
            <div className="messages-container">
                {/* Conversations List */}
                <div className="conversations-list">
                    <div className="list-header">
                        <h2>Messages</h2>
                        <span className="conversation-count">{conversations.length}</span>
                    </div>

                    <div className="conversations">
                        {conversations.length === 0 ? (
                            <div className="empty-state">
                                <p>📭</p>
                                <p>No conversations yet</p>
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    className={`conversation-item ${selectedConversationId === conv.id ? 'selected' : ''}`}
                                    onClick={() => handleSelectConversation(conv.id)}
                                >
                                    <div className="conversation-avatar">
                                        {conv.customer_avatar ? (
                                            <img src={conv.customer_avatar} alt="" />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {conv.customer_name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="conversation-info">
                                        <div className="info-header">
                                            <h3>{conv.customer_name}</h3>
                                            <span className="time">{formatTime(conv.last_message_time)}</span>
                                        </div>
                                        <p className={`last-message ${conv.unread_count > 0 ? 'unread' : ''}`}>
                                            {conv.last_message}
                                        </p>
                                    </div>
                                    {conv.unread_count > 0 && (
                                        <div className="unread-badge">{conv.unread_count}</div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Messages Chat */}
                {selectedConversation ? (
                    <div className="chat-section">
                        <div className="chat-header">
                            <h2>{selectedConversation.customer_name}</h2>
                            <div className="header-meta">
                                <span className={`status-badge ${selectedConversation.status}`}>
                                    {selectedConversation.status === 'active' ? '🟢 Active Delivery' : '✓ Completed'}
                                </span>
                            </div>
                        </div>

                        <div className="messages-list">
                            {currentMessages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`message ${msg.sender_type === 'rider' ? 'outgoing' : 'incoming'}`}
                                >
                                    <div className="message-content">
                                        <p className="message-text">{msg.message}</p>
                                        <span className="message-time">{formatTime(msg.sent_at)}</span>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="message-input-form" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                placeholder="Type a message..."
                                className="message-input"
                            />
                            <button
                                type="submit"
                                className="send-btn"
                                disabled={!messageText.trim() || sendMutation.isPending}
                            >
                                {sendMutation.isPending ? '...' : '➤'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="chat-empty">
                        <p>💬</p>
                        <p>Select a conversation to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
}
