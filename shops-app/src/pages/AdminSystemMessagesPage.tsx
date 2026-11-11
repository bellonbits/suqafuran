'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ADMIN_NAV_ITEMS } from '@/navigation';
import { useAuthStore } from '@/store/useAuth';
import {
  Send, Users, AlertCircle, CheckCircle2, MessageCircle, Bell,
  Radio, Smartphone, Sparkles, ExternalLink, ShieldCheck, Flame,
  Search, UserCheck, X, Loader2, User as UserIcon
} from 'lucide-react';

interface FoundUser {
  id: number;
  name: string;
  full_name?: string;
  business_name?: string;
  email?: string;
  phone?: string;
  role: 'Seller' | 'Buyer';
  avatar?: string;
}

export default function SystemMessagesPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [mode, setMode] = useState<'broadcast' | 'single' | 'bulk'>('broadcast');

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastAudience, setBroadcastAudience] = useState<'all' | 'sellers' | 'buyers'>('all');
  const [broadcastActionUrl, setBroadcastActionUrl] = useState('');
  const [broadcastImageUrl, setBroadcastImageUrl] = useState('');
  const [lastBroadcastResult, setLastBroadcastResult] = useState<any>(null);

  // Single User by Name state
  const [singleSearchQuery, setSingleSearchQuery] = useState('');
  const [singleSearchResults, setSingleSearchResults] = useState<FoundUser[]>([]);
  const [isSearchingSingle, setIsSearchingSingle] = useState(false);
  const [selectedSingleUser, setSelectedSingleUser] = useState<FoundUser | null>(null);

  // Multiple Users by Name state
  const [bulkSearchQuery, setBulkSearchQuery] = useState('');
  const [bulkSearchResults, setBulkSearchResults] = useState<FoundUser[]>([]);
  const [isSearchingBulk, setIsSearchingBulk] = useState(false);
  const [selectedBulkUsers, setSelectedBulkUsers] = useState<FoundUser[]>([]);

  // Shared Direct Message state
  const [messageType, setMessageType] = useState('general');
  const [directMessage, setDirectMessage] = useState('');
  const [dryRun, setDryRun] = useState(false);
  const [sending, setSending] = useState(false);

  const navItems = ADMIN_NAV_ITEMS.map(({ icon: Icon, ...item }) => ({
    ...item,
    icon: <Icon className="w-5 h-5" />
  }));

  // Debounced search for Single User mode
  useEffect(() => {
    if (!singleSearchQuery.trim() || selectedSingleUser) {
      setSingleSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingSingle(true);
      try {
        const res = await api.get('/admin/system-messages/search-users', {
          params: { query: singleSearchQuery.trim(), limit: 10 }
        });
        setSingleSearchResults(res.data || []);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setIsSearchingSingle(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [singleSearchQuery, selectedSingleUser]);

  // Debounced search for Bulk Users mode
  useEffect(() => {
    if (!bulkSearchQuery.trim()) {
      setBulkSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingBulk(true);
      try {
        const res = await api.get('/admin/system-messages/search-users', {
          params: { query: bulkSearchQuery.trim(), limit: 10 }
        });
        // Filter out already selected users
        const alreadySelected = new Set(selectedBulkUsers.map(u => u.id));
        setBulkSearchResults((res.data || []).filter((u: FoundUser) => !alreadySelected.has(u.id)));
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setIsSearchingBulk(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [bulkSearchQuery, selectedBulkUsers]);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!broadcastTitle.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a notification title.',
        variant: 'destructive'
      });
      return;
    }

    if (!broadcastMessage.trim()) {
      toast({
        title: 'Message required',
        description: 'Please enter notification body text.',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    setLastBroadcastResult(null);

    try {
      const res = await api.post('/admin/system-messages/broadcast', {
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        audience: broadcastAudience,
        action_url: broadcastActionUrl.trim() || undefined,
        image_url: broadcastImageUrl.trim() || undefined,
      });

      const details = res.data?.details || {};
      setLastBroadcastResult(details);

      toast({
        title: 'Push Notification Broadcasted! 🚀',
        description: `Delivered to all available app devices (${details.delivered ?? 0} dispatched).`,
      });

      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastActionUrl('');
      setBroadcastImageUrl('');
    } catch (error: any) {
      console.error('Failed to broadcast push notification:', error);
      toast({
        title: 'Broadcast Failed',
        description: error.response?.data?.detail || 'Failed to dispatch broadcast notification.',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendSingle = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSingleUser && !singleSearchQuery.trim()) {
      toast({
        title: 'Recipient required',
        description: 'Please search and select a user by their name.',
        variant: 'destructive'
      });
      return;
    }

    if (!directMessage.trim()) {
      toast({
        title: 'Message required',
        description: 'Message cannot be empty.',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    try {
      const payload: any = {
        message: directMessage.trim(),
        message_type: messageType
      };

      if (selectedSingleUser) {
        payload.recipient_user_id = selectedSingleUser.id;
        payload.recipient_name = selectedSingleUser.name;
      } else {
        payload.recipient = singleSearchQuery.trim();
      }

      const res = await api.post('/admin/system-messages/send', payload);
      const recipientName = res.data?.recipient_name || selectedSingleUser?.name || 'User';

      toast({
        title: 'Message Delivered! ✉️',
        description: `Successfully sent message & push notification to ${recipientName}.`,
      });

      setSelectedSingleUser(null);
      setSingleSearchQuery('');
      setDirectMessage('');
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Delivery Failed',
        description: error.response?.data?.detail || 'Failed to send message to user.',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendBulk = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedBulkUsers.length === 0) {
      toast({
        title: 'No Recipients Selected',
        description: 'Please search and add at least one user by name.',
        variant: 'destructive'
      });
      return;
    }

    if (!directMessage.trim()) {
      toast({
        title: 'Message required',
        description: 'Message cannot be empty.',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    try {
      const res = await api.post('/admin/system-messages/send-bulk', {
        recipient_user_ids: selectedBulkUsers.map(u => u.id),
        message: directMessage.trim(),
        message_type: messageType,
        dry_run: dryRun
      });

      if (dryRun) {
        toast({
          title: 'Dry Run Complete',
          description: `Validated ${res.data.success} user(s). No notifications were dispatched.`,
        });
      } else {
        toast({
          title: 'Bulk Messages Sent! 🚀',
          description: `Dispatched to ${res.data.success} user(s) successfully.`,
        });
        setSelectedBulkUsers([]);
        setBulkSearchQuery('');
        setDirectMessage('');
      }
    } catch (error: any) {
      console.error('Failed to send bulk messages:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to send bulk messages',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleAddBulkUser = (u: FoundUser) => {
    if (!selectedBulkUsers.some(item => item.id === u.id)) {
      setSelectedBulkUsers(prev => [...prev, u]);
    }
    setBulkSearchQuery('');
    setBulkSearchResults([]);
  };

  const handleRemoveBulkUser = (id: number) => {
    setSelectedBulkUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <DashboardLayout
      navItems={navItems}
      title="Push Notifications & Messages"
      badge="Admin Center"
    >
      <div className="space-y-8 max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Push & System Messaging Center
                </h1>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Compose broadcast notifications to all app users, or search users by name to message directly.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Push Gateway Active
            </span>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-neutral-900 w-fit">
          <button
            onClick={() => setMode('broadcast')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              mode === 'broadcast'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Broadcast (Everyone)</span>
            <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-white/20">Live</span>
          </button>
          
          <button
            onClick={() => setMode('single')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              mode === 'single'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Single User (By Name)</span>
          </button>

          <button
            onClick={() => setMode('bulk')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              mode === 'bulk'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Multiple Users (By Name)</span>
          </button>
        </div>

        {/* ── BROADCAST MODE ── */}
        {mode === 'broadcast' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Form */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="p-6 md:p-8 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-neutral-800 rounded-3xl shadow-sm">
                <form onSubmit={handleSendBroadcast} className="space-y-6">
                  
                  {/* Audience Selector */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Target App Audience
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'all', label: 'Everyone with App', desc: 'All registered devices' },
                        { id: 'sellers', label: 'Sellers Only', desc: 'Verified shop owners' },
                        { id: 'buyers', label: 'Buyers Only', desc: 'Platform consumers' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setBroadcastAudience(item.id as any)}
                          className={`p-3 rounded-2xl text-left border text-xs font-semibold transition-all ${
                            broadcastAudience === item.id
                              ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 font-bold'
                              : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300 text-slate-600 dark:text-neutral-300'
                          }`}
                        >
                          <div className="font-bold">{item.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Notification Title *
                    </label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g. Flash Sale Alert! 50% Off Top Deals Today"
                      maxLength={100}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-sky-500 outline-none transition"
                      required
                    />
                    <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                      <span>Keep titles punchy (under 50 chars recommended)</span>
                      <span>{broadcastTitle.length}/100</span>
                    </div>
                  </div>

                  {/* Message Body */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Message Content *
                    </label>
                    <textarea
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Type the message body that will appear on user lock screens..."
                      rows={4}
                      maxLength={500}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl text-sm focus:ring-2 focus:ring-sky-500 outline-none transition leading-relaxed"
                      required
                    />
                    <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                      <span>Will deliver as native push banner + in-app notification</span>
                      <span>{broadcastMessage.length}/500</span>
                    </div>
                  </div>

                  {/* Action Link / Deep Link */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Action Deep Link (Optional)
                    </label>
                    <input
                      type="text"
                      value={broadcastActionUrl}
                      onChange={(e) => setBroadcastActionUrl(e.target.value)}
                      placeholder="e.g. /shops, /deals, or /listing/42"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl text-sm focus:ring-2 focus:ring-sky-500 outline-none transition"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      When the user taps the push notification on their phone, the app automatically navigates to this view.
                    </p>
                  </div>

                  {/* Banner Image URL */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Banner Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={broadcastImageUrl}
                      onChange={(e) => setBroadcastImageUrl(e.target.value)}
                      placeholder="https://.../promotional-banner.jpg"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl text-sm focus:ring-2 focus:ring-sky-500 outline-none transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 text-sm tracking-wide uppercase active:scale-[0.99]"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Broadcasting to All Devices...' : 'Broadcast Push Notification Now'}
                  </button>
                </form>
              </Card>

              {/* Delivery Stats Card if available */}
              {lastBroadcastResult && (
                <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-sm text-emerald-700 dark:text-emerald-300">
                      Broadcast Dispatched Successfully!
                    </div>
                    <p>
                      Delivered to <strong>{lastBroadcastResult.delivered ?? 0}</strong> app devices.
                      Logged in in-app notification center for <strong>{lastBroadcastResult.in_app_created ?? 0}</strong> users.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Live Device Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <Smartphone className="w-4 h-4 text-sky-500" />
                <span>Live Phone Preview</span>
              </div>

              {/* Realistic Phone Card Preview */}
              <div className="p-6 rounded-[2.5rem] bg-slate-900 text-white border-4 border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-6" />

                <div className="space-y-4">
                  <div className="text-center">
                    <span className="text-3xl font-light font-mono">12:45</span>
                    <p className="text-[11px] text-slate-400">Wednesday, November 11</p>
                  </div>

                  {/* Lock Screen Notification Bubble */}
                  <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-lg space-y-2 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="App" className="w-4 h-4 rounded-md object-contain" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">Suqafuran</span>
                      </div>
                      <span className="text-[10px] text-slate-400">now</span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">
                        {broadcastTitle || 'Notification Title Preview'}
                      </h4>
                      <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
                        {broadcastMessage || 'This is how your push notification will appear on user lock screens and status bars across mobile devices.'}
                      </p>
                    </div>

                    <div className="pt-1 flex items-center justify-between border-t border-white/5 text-[9px] text-slate-400">
                      <span>Target: {broadcastAudience.toUpperCase()}</span>
                      <span className="text-sky-400">Tap to open</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center text-[10px] text-slate-500">
                  Native Android & iOS Push Notification
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SINGLE USER BY NAME MODE ── */}
        {mode === 'single' && (
          <Card className="p-8 max-w-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-neutral-800 rounded-3xl shadow-sm">
            <form onSubmit={handleSendSingle} className="space-y-6">
              
              {/* User Search by Name */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Recipient User (Search by Name) *
                </label>

                {selectedSingleUser ? (
                  <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sky-500 text-white font-black flex items-center justify-center text-sm shadow-sm">
                        {selectedSingleUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {selectedSingleUser.name}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            selectedSingleUser.role === 'Seller'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300'
                          }`}>
                            {selectedSingleUser.role}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                          {selectedSingleUser.email || selectedSingleUser.phone || `User #${selectedSingleUser.id}`}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSingleUser(null);
                        setSingleSearchQuery('');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800 text-xs font-bold text-slate-600 dark:text-neutral-300 transition"
                    >
                      Change User
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative flex items-center">
                      <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                      <input
                        type="text"
                        value={singleSearchQuery}
                        onChange={(e) => setSingleSearchQuery(e.target.value)}
                        placeholder="Search by user name, shop name, phone or email..."
                        className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl text-sm focus:ring-2 focus:ring-sky-500 outline-none transition"
                        autoFocus
                      />
                      {isSearchingSingle && (
                        <Loader2 className="w-4 h-4 text-sky-500 animate-spin absolute right-4" />
                      )}
                    </div>

                    {/* Autocomplete Dropdown */}
                    {singleSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xl z-20 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-neutral-800">
                        {singleSearchResults.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedSingleUser(u);
                              setSingleSearchResults([]);
                              setSingleSearchQuery('');
                            }}
                            className="w-full p-3 text-left hover:bg-sky-50/60 dark:hover:bg-sky-950/30 flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 font-bold flex items-center justify-center text-xs">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  {u.name}
                                  {u.business_name && (
                                    <span className="text-[10px] text-slate-400">({u.business_name})</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                                  {u.email || u.phone}
                                </div>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === 'Seller'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}>
                              {u.role}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Message Type */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['general', 'promotional', 'announcement', 'support'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMessageType(t)}
                      className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition ${
                        messageType === t
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-600'
                          : 'border-slate-200 dark:border-neutral-800 text-slate-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Message Content *
                </label>
                <textarea
                  value={directMessage}
                  onChange={(e) => setDirectMessage(e.target.value)}
                  placeholder="Type official system message and push notification text..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl text-sm focus:ring-2 focus:ring-sky-500 outline-none transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={sending || (!selectedSingleUser && !singleSearchQuery.trim())}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : `Send to ${selectedSingleUser?.name || 'Selected User'}`}
              </button>
            </form>
          </Card>
        )}

        {/* ── MULTIPLE USERS BY NAME MODE ── */}
        {mode === 'bulk' && (
          <Card className="p-8 max-w-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-neutral-800 rounded-3xl shadow-sm">
            <form onSubmit={handleSendBulk} className="space-y-6">
              
              {/* User Search & Chips */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Recipients (Search & Add by Name) *
                </label>

                {/* Selected Users Chips */}
                {selectedBulkUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-3 bg-slate-50 dark:bg-neutral-900/60 rounded-2xl border border-slate-200 dark:border-neutral-800">
                    {selectedBulkUsers.map((u) => (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 shadow-xs"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-sky-500" />
                        <span>{u.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBulkUser(u.id)}
                          className="hover:text-red-500 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <span className="text-xs text-slate-400 self-center ml-2">
                      ({selectedBulkUsers.length} selected)
                    </span>
                  </div>
                )}

                {/* Search Input */}
                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                    <input
                      type="text"
                      value={bulkSearchQuery}
                      onChange={(e) => setBulkSearchQuery(e.target.value)}
                      placeholder="Type a name to search and click to add..."
                      className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl text-sm focus:ring-2 focus:ring-sky-500 outline-none transition"
                    />
                    {isSearchingBulk && (
                      <Loader2 className="w-4 h-4 text-sky-500 animate-spin absolute right-4" />
                    )}
                  </div>

                  {/* Autocomplete Dropdown */}
                  {bulkSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xl z-20 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-neutral-800">
                      {bulkSearchResults.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleAddBulkUser(u)}
                          className="w-full p-3 text-left hover:bg-sky-50/60 dark:hover:bg-sky-950/30 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 font-bold flex items-center justify-center text-xs">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {u.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                                {u.email || u.phone}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-sky-500 hover:underline">
                            + Add
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Message Content *
                </label>
                <textarea
                  value={directMessage}
                  onChange={(e) => setDirectMessage(e.target.value)}
                  placeholder="Type message text..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl text-sm focus:ring-2 focus:ring-sky-500 outline-none transition"
                  required
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-300">
                <input
                  type="checkbox"
                  id="dry"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="dry">Dry run (validate recipients without sending)</label>
              </div>

              <button
                type="submit"
                disabled={sending || selectedBulkUsers.length === 0}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : `Send Notification to ${selectedBulkUsers.length} User(s)`}
              </button>
            </form>
          </Card>
        )}

      </div>
    </DashboardLayout>
  );
}
