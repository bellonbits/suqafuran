import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Search, Image, Paperclip, MessageCircle, User, Check, CheckCheck, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { sellerDashboardService } from '../../services/sellerDashboardService';
import type { Conversation, ChatMessage } from '../../services/sellerDashboardService';
import { cn } from '../../utils/cn';
import { getImageUrl } from '../../utils/imageUtils';

export const SellerMessagesPage: React.FC = () => {
  const qc = useQueryClient();
  const [activeUser, setActiveUser] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { data: conversations = [], isLoading: convsLoading } = useQuery({
    queryKey: ['seller-conversations'],
    queryFn: sellerDashboardService.getConversations,
    refetchInterval: 10_000,
  });

  const { data: messageThread = [], isLoading: threadLoading } = useQuery({
    queryKey: ['seller-thread', activeUser?.other_user_id],
    queryFn: () => activeUser ? sellerDashboardService.getMessages(activeUser.other_user_id) : Promise.resolve([]),
    enabled: !!activeUser,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: ({ receiverId, content }: { receiverId: number; content: string }) =>
      sellerDashboardService.sendMessage(receiverId, content),
    onSuccess: () => {
      setInputText('');
      qc.invalidateQueries({ queryKey: ['seller-thread', activeUser?.other_user_id] });
      qc.invalidateQueries({ queryKey: ['seller-conversations'] });
    },
    onError: () => toast.error('Failed to send message'),
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messageThread]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser || !inputText.trim()) return;
    sendMutation.mutate({ receiverId: activeUser.other_user_id, content: inputText.trim() });
  };

  const handleSelectConversation = (conv: Conversation) => {
    setActiveUser(conv);
    sellerDashboardService.markRead(conv.other_user_id).then(() => {
      qc.invalidateQueries({ queryKey: ['seller-conversations'] });
    });
  };

  const filteredConvs = conversations.filter(c =>
    !search || (c.other_user_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-white">
      {/* Sidebar - Conversations */}
      <div className="w-80 border-r border-slate-100 flex flex-col flex-shrink-0 bg-slate-50/50">
        <div className="p-4 border-b border-slate-100 bg-white">
          <h2 className="text-lg font-black text-slate-900 mb-3">Chats</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search chat history..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
          {convsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-sky-500" /></div>
          ) : filteredConvs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">No active chats</div>
          ) : (
            filteredConvs.map(c => {
              const active = activeUser?.other_user_id === c.other_user_id;
              const avatar = c.other_user_avatar ? getImageUrl(c.other_user_avatar) : null;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectConversation(c)}
                  className={cn(
                    'flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors',
                    active ? 'bg-sky-50/70 border-l-4 border-sky-500' : ''
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-slate-600">
                    {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="text-xs font-bold text-slate-800 truncate">{c.other_user_name || 'Customer'}</p>
                      {c.last_message_at && (
                        <span className="text-[10px] text-slate-400">{new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{c.last_message || '—'}</p>
                  </div>
                  {c.unread_count ? (
                    <span className="bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {c.unread_count}
                    </span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Message Chat Window */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {activeUser ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-slate-600">
                {activeUser.other_user_avatar ? (
                  <img src={getImageUrl(activeUser.other_user_avatar)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">{activeUser.other_user_name || 'Customer'}</h3>
                <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wide">Active Customer</p>
              </div>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {threadLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-sky-500" /></div>
              ) : (
                messageThread.map((msg: ChatMessage) => {
                  const self = msg.sender_id !== activeUser.other_user_id;
                  return (
                    <div key={msg.id} className={cn('flex', self ? 'justify-end' : 'justify-start')}>
                      <div className={cn('max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-sm border',
                        self ? 'bg-sky-500 text-white border-sky-400 rounded-tr-none' : 'bg-white text-slate-800 border-slate-100 rounded-tl-none'
                      )}>
                        <p>{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-75">
                          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {self && (
                            msg.is_read ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
              <button type="button" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
              <button type="button" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                <Image className="w-4 h-4" />
              </button>
              <input
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
              <button type="submit" disabled={!inputText.trim()} className="p-2.5 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-colors disabled:opacity-40 shadow-sm shadow-sky-500/20">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500 mb-4">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Your Conversations</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">Select a customer chat thread from the sidebar to view message history and send direct updates.</p>
          </div>
        )}
      </div>
    </div>
  );
};
