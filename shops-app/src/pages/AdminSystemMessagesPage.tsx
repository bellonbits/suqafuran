'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ADMIN_NAV_ITEMS } from '@/navigation';
import { useAuthStore } from '@/store/useAuth';
import {
  Send, Users, AlertCircle, CheckCircle2, MessageCircle, Bell,
  Radio, Smartphone, Sparkles, ExternalLink, ShieldCheck, Flame
} from 'lucide-react';

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

  // Single & Bulk state
  const [messageType, setMessageType] = useState('general');
  const [singleUserId, setSingleUserId] = useState('');
  const [userIds, setUserIds] = useState('');
  const [directMessage, setDirectMessage] = useState('');
  const [dryRun, setDryRun] = useState(false);

  const [sending, setSending] = useState(false);

  const navItems = ADMIN_NAV_ITEMS.map(({ icon: Icon, ...item }) => ({
    ...item,
    icon: <Icon className="w-5 h-5" />
  }));

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

    if (!singleUserId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a user ID',
        variant: 'destructive'
      });
      return;
    }

    if (!directMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Message cannot be empty',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    try {
      await api.post('/admin/system-messages/send', {
        recipient_user_id: parseInt(singleUserId),
        message: directMessage,
        message_type: messageType
      });

      toast({
        title: 'Success',
        description: `Message and notification sent to user #${singleUserId}`,
      });

      setSingleUserId('');
      setDirectMessage('');
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendBulk = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userIds.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter user IDs (comma-separated)',
        variant: 'destructive'
      });
      return;
    }

    if (!directMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Message cannot be empty',
        variant: 'destructive'
      });
      return;
    }

    const ids = userIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (ids.length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter valid numeric user IDs',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    try {
      const response = await api.post('/admin/system-messages/send-bulk', {
        recipient_user_ids: ids,
        message: directMessage,
        message_type: messageType,
        dry_run: dryRun
      });

      toast({
        title: 'Success',
        description: `${response.data.success} message${response.data.success !== 1 ? 's' : ''} sent${dryRun ? ' (dry run)' : ''}`,
      });

      if (!dryRun) {
        setUserIds('');
        setDirectMessage('');
      }
    } catch (error: any) {
      console.error('Failed to send bulk messages:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to send messages',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout title="Push & Messages" navItems={navItems} userRole="admin">
      <div className="container mx-auto py-8 px-4 max-w-5xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">Push Notifications & Broadcast</h1>
            </div>
            <p className="text-slate-500 dark:text-neutral-400">
              Broadcast push notifications directly to everyone with the Android and iOS apps, or send targeted system messages.
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-neutral-900 rounded-2xl max-w-fit">
          <button
            onClick={() => setMode('broadcast')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              mode === 'broadcast'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Broadcast to All App Users</span>
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
            <span>Single User</span>
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
            <span>User ID List</span>
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
                      placeholder="e.g. Flash Sale Today! 🛍️ Up to 50% Off"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      maxLength={100}
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>Catchy, short headline for lockscreen banner</span>
                      <span>{broadcastTitle.length}/100</span>
                    </div>
                  </div>

                  {/* Body Message */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Notification Message Body *
                    </label>
                    <textarea
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="e.g. Discover exclusive deals from verified shops in Nairobi with fast doorstep delivery. Tap to view items."
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      maxLength={500}
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>Primary message previewed on device notifications</span>
                      <span>{broadcastMessage.length}/500</span>
                    </div>
                  </div>

                  {/* Action Link / Deep link */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Deep Link / Tap Destination (Optional)
                    </label>
                    <input
                      type="text"
                      value={broadcastActionUrl}
                      onChange={(e) => setBroadcastActionUrl(e.target.value)}
                      placeholder="e.g. /shops, /deals, or /listing/123"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Where the app opens when the user taps this notification (defaults to home).
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={sending || !broadcastTitle.trim() || !broadcastMessage.trim()}
                    className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm tracking-wide uppercase"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Broadcasting Push...' : 'Send Push Notification Now'}
                  </button>
                </form>
              </Card>

              {/* Delivery Stats Card */}
              {lastBroadcastResult && (
                <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Push Broadcast Dispatched</h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Targeted {lastBroadcastResult.users_targeted ?? 0} user accounts ({lastBroadcastResult.tokens_dispatched ?? 0} device tokens). Successfully reached {lastBroadcastResult.delivered ?? 0} devices.
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

        {/* ── SINGLE USER MODE ── */}
        {mode === 'single' && (
          <Card className="p-8 max-w-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-neutral-800 rounded-3xl">
            <form onSubmit={handleSendSingle} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Recipient User ID *</label>
                <input
                  type="number"
                  value={singleUserId}
                  onChange={(e) => setSingleUserId(e.target.value)}
                  placeholder="e.g. 142"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Message *</label>
                <textarea
                  value={directMessage}
                  onChange={(e) => setDirectMessage(e.target.value)}
                  placeholder="Type official system message and push notification text..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-sky-500 text-white font-bold py-3.5 px-6 rounded-2xl hover:bg-sky-600 transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send Message & Push'}
              </button>
            </form>
          </Card>
        )}

        {/* ── BULK LIST MODE ── */}
        {mode === 'bulk' && (
          <Card className="p-8 max-w-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-neutral-800 rounded-3xl">
            <form onSubmit={handleSendBulk} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">User IDs (Comma-separated) *</label>
                <textarea
                  value={userIds}
                  onChange={(e) => setUserIds(e.target.value)}
                  placeholder="12, 45, 88, 102"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Message *</label>
                <textarea
                  value={directMessage}
                  onChange={(e) => setDirectMessage(e.target.value)}
                  placeholder="Type message text..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl text-sm"
                  required
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600">
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
                disabled={sending}
                className="w-full bg-sky-500 text-white font-bold py-3.5 px-6 rounded-2xl hover:bg-sky-600 transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send Bulk Notification'}
              </button>
            </form>
          </Card>
        )}

      </div>
    </DashboardLayout>
  );
}
