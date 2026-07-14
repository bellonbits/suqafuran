'use client';

import { useState, useEffect, useRef } from 'react';
import './delivery-messaging.css';

interface Message {
  id: string;
  sender_type: 'rider' | 'customer';
  sender_name: string;
  message: string;
  timestamp: string;
}

interface DeliveryMessagingProps {
  orderId: string;
  customerName: string;
  onClose?: () => void;
}

export default function DeliveryMessaging({
  orderId,
  customerName,
  onClose,
}: DeliveryMessagingProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender_type: 'customer',
      sender_name: customerName,
      message: 'Hi, are you on your way?',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    },
  ]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    // Add message optimistically
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      sender_type: 'rider',
      sender_name: 'You',
      message: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
    setMessageText('');
    setIsLoading(true);

    try {
      // TODO: Send message to backend WebSocket
      // await messagingService.sendMessage(orderId, messageText);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(messages.filter(m => m.id !== newMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="delivery-messaging-container">
      <div className="messaging-header">
        <div className="customer-info">
          <div className="avatar">{customerName.charAt(0)}</div>
          <div className="info">
            <h3>{customerName}</h3>
            <p className="delivery-id">Order: {orderId}</p>
          </div>
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <div className="messages-list">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.sender_type === 'rider' ? 'outgoing' : 'incoming'}`}
          >
            <div className="message-content">
              <p className="message-text">{msg.message}</p>
              <span className="message-time">{formatTime(msg.timestamp)}</span>
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
          placeholder="Type your message..."
          className="message-input"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="send-btn"
          disabled={!messageText.trim() || isLoading}
        >
          {isLoading ? '...' : '➤'}
        </button>
      </form>
    </div>
  );
}
