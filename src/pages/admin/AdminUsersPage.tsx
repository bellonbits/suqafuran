import React, { useState, useEffect } from 'react';
import { 
    Users, Search, Filter,
    Trash2, Power, PowerOff, ExternalLink, 
    CheckCircle2, Ban, Send, Globe, Eye,
    Mail, Phone, Calendar, ShieldCheck,
    Loader2, Info
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface User {
    id: number;
    email: string;
    full_name: string;
    phone_number: string;
    is_active: boolean;
    is_admin: boolean;
    created_at: string;
    verification_level?: number;
    verification_status?: string;
}

export const AdminUsersPage: React.FC = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        admins: 0
    });

    // CRM States
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [sending, setSending] = useState(false);

    // Broadcast Form State
    const [broadcastForm, setBroadcastForm] = useState({
        subject: '🎉 Exclusive Update for {{name}}!',
        title: 'New Features & Deals Listed Near You!',
        subtitle: 'Unlocking more value on Suqafuran, the premier Somali marketplace.',
        content_html: `<p>Hello {{name}},</p>\n<p>We are excited to share some premium updates with you! Check out the newest verified listings, apartments, services, and high-performance items in your neighborhood.</p>\n<p>As a valued Suqafuran member, you get priority alerts when prices drop on watchlisted items!</p>`,
        action_text: 'Explore New Listings',
        action_url: 'https://suqafuran.com/somali/listings',
        campaign_id: 'broadcast_crm_v1'
    });

    // Manual Form State
    const [manualEmailType, setManualEmailType] = useState<'custom' | 'welcome' | 'scam_warning' | 'seller_tips' | 'suspicious'>('custom');
    const [manualForm, setManualForm] = useState({
        subject: 'Important notification from Suqafuran Support',
        title: 'Account Verification & Security Update',
        subtitle: 'Official communication regarding your listing catalog',
        content_html: `<p>Dear member,</p>\n<p>This is a direct follow-up from our moderation and trust team. Please ensure your contact credentials and listings strictly comply with our community standard guidelines.</p>`,
        action_text: 'View My Dashboard',
        action_url: 'https://suqafuran.com/dashboard',
        campaign_id: 'manual_support_direct'
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getUsers();
            setUsers(data as any as User[]);
            
            // Calculate stats
            const s = {
                total: data.length,
                active: data.filter((u: any) => u.is_active).length,
                inactive: data.filter((u: any) => !u.is_active).length,
                admins: data.filter((u: any) => u.is_admin).length
            };
            setStats(s);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this account?`)) return;

        try {
            await adminService.updateUserStatus(userId, !currentStatus);
            toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
            loadUsers();
        } catch (error) {
            toast.error('Failed to update user status');
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm('CRITICAL ACTION: Are you sure you want to PERMANENTLY DELETE this account? This cannot be undone and all user data will be lost.')) return;

        try {
            await adminService.deleteUser(userId);
            toast.success('User deleted permanently');
            loadUsers();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const handleImpersonate = (userId: number) => {
        navigate(`/post-ad?owner_id=${userId}`);
    };

    const handleOpenManualModal = (user: User) => {
        setSelectedUser(user);
        setShowManualModal(true);
        setManualEmailType('custom');
    };

    // Preset selection logic
    const handlePresetChange = (type: typeof manualEmailType) => {
        setManualEmailType(type);
        if (type === 'welcome') {
            setManualForm({
                subject: 'Welcome to Suqafuran, the AI-Powered African Marketplace!',
                title: 'Welcome to Suqafuran, {{name}}! 👋',
                subtitle: 'Find awesome deals, list items in 10 seconds, and connect securely.',
                content_html: `<p>Dear {{name}},</p>\n<p>Thank you for choosing Suqafuran! We are thrilled to welcome you to our modern marketplace community.</p>\n<p>To help you get started immediately, here is what you can do:</p>\n<ul>\n  <li><strong>Post an ad:</strong> Showcase your products or services to thousands of local buyers.</li>\n  <li><strong>Verify your profile:</strong> Unlock trust badge credentials to double your sales.</li>\n  <li><strong>Explore categories:</strong> Discover premium deals near you.</li>\n</ul>`,
                action_text: 'Complete My Profile Now',
                action_url: 'https://suqafuran.com/somali/verification',
                campaign_id: 'manual_preset_welcome'
            });
        } else if (type === 'scam_warning') {
            setManualForm({
                subject: '⚠️ Crucial Security Notice: Safe Buying & Selling Practices',
                title: 'Marketplace Trust & Safety Alert',
                subtitle: 'Protecting your identity and payments on Suqafuran',
                content_html: `<p>Hello {{name}},</p>\n<p>At Suqafuran, security is our absolute highest priority. We want to share three critical rules to keep your transactions 100% safe:</p>\n<ol>\n  <li><strong>Meet in public:</strong> Always complete exchanges in well-lit, public spaces (e.g., shopping malls or public stations).</li>\n  <li><strong>Inspect before paying:</strong> Never send payments upfront. Thoroughly verify listing details and item conditions.</li>\n  <li><strong>Use official M-Pesa channels:</strong> Avoid unrecognized payment routing procedures.</li>\n</ol>`,
                action_text: 'Read Safety Guidelines',
                action_url: 'https://suqafuran.com/somali/safety',
                campaign_id: 'manual_preset_scam_warning'
            });
        } else if (type === 'seller_tips') {
            setManualForm({
                subject: '📈 Double Your Sales: Best Practices for Premium Listings',
                title: 'High-Performance Listing Insights 🚀',
                subtitle: 'How to attract active local buyers and drive conversions',
                content_html: `<p>Hi {{name}},</p>\n<p>Want to turn your products into instant profit? Our top-performing sellers use these simple, effective secrets:</p>\n<ul>\n  <li><strong>High-quality photos:</strong> Bright, clear, multi-angle real shots boost clicks by up to 80%.</li>\n  <li><strong>Detailed descriptions:</strong> Write detailed condition, size, and category specifications.</li>\n  <li><strong>Instant chat response:</strong> Replying under 10 minutes increases buyer trust and conversion speed.</li>\n</ul>`,
                action_text: 'Optimize My Active Ads',
                action_url: 'https://suqafuran.com/somali/dashboard',
                campaign_id: 'manual_preset_seller_tips'
            });
        } else if (type === 'suspicious') {
            setManualForm({
                subject: '⚠️ Alert: Suspicious Account Login Detected',
                title: 'Suspicious Security Warning Alert',
                subtitle: 'Verify unrecognized login session credentials immediately',
                content_html: `<p>Hello {{name}},</p>\n<p>Our automated integrity moderation rules recently flagged a suspicious login attempt matching your email profile.</p>\n<p>If this was not you, please immediately change your password and refresh your active credential logs to secure your storefront.</p>`,
                action_text: 'Secure My Password Now',
                action_url: 'https://suqafuran.com/somali/verification',
                campaign_id: 'manual_preset_susp_warning'
            });
        } else {
            setManualForm({
                subject: 'Direct follow-up from Suqafuran Support',
                title: 'Account Verification & Security Update',
                subtitle: 'Official communication regarding your listing catalog',
                content_html: `<p>Dear member,</p>\n<p>This is a direct follow-up from our moderation and trust team. Please ensure your contact credentials and listings strictly comply with our community standard guidelines.</p>`,
                action_text: 'View My Dashboard',
                action_url: 'https://suqafuran.com/dashboard',
                campaign_id: 'manual_support_direct'
            });
        }
    };

    const handleSendBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm('CRITICAL CAMPAIGN BROADCAST: Are you sure you want to send this broadcast email to ALL active marketplace customers at once?')) return;

        try {
            setSending(true);
            const res = await adminService.sendBroadcastEmail(broadcastForm);
            toast.success(res.message || 'Broadcast campaign successfully queued!');
            setShowBroadcastModal(false);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to dispatch broadcast campaign');
        } finally {
            setSending(false);
        }
    };

    const handleSendManual = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        try {
            setSending(true);
            // Replace client-side {{name}} mock placeholder for quick preview, backend does this,
            // but we send the raw template string payload.
            const res = await adminService.sendManualEmail({
                email: selectedUser.email,
                ...manualForm
            });
            toast.success(res.message || `Manual email successfully sent to ${selectedUser.email}`);
            setShowManualModal(false);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to send manual email');
        } finally {
            setSending(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = 
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.phone_number?.includes(searchQuery);
        
        const matchesStatus = 
            filterStatus === 'all' || 
            (filterStatus === 'active' && user.is_active) ||
            (filterStatus === 'inactive' && !user.is_active);

        return matchesSearch && matchesStatus;
    });

    // Helper to render HTML live preview inside a responsive iframe or container
    const renderPreviewHtml = (title: string, subtitle: string, body: string, actionText?: string, actionUrl?: string) => {
        const name = selectedUser?.full_name || 'Customer';
        const email = selectedUser?.email || 'customer@example.com';
        const phone = selectedUser?.phone_number || 'None';
        const location = 'N/A';
        const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        const applyReplacements = (text: string) => {
            return text
                .replace(/\{\{name\}\}/g, name)
                .replace(/\{\{email\}\}/g, email)
                .replace(/\{\{phone\}\}/g, phone)
                .replace(/\{\{location\}\}/g, location)
                .replace(/\{\{date\}\}/g, date);
        };

        const formattedTitle = applyReplacements(title);
        const formattedSubtitle = applyReplacements(subtitle);
        const formattedBody = applyReplacements(body);
        const formattedActionText = actionText ? applyReplacements(actionText) : '';
        const formattedActionUrl = actionUrl ? applyReplacements(actionUrl) : '';

        return `
            <html>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
                <style>
                    body {
                        font-family: 'Outfit', sans-serif;
                        background: #f8fafc;
                        padding: 16px;
                        margin: 0;
                    }
                    .email-card {
                        background: rgba(255, 255, 255, 0.85);
                        backdrop-filter: blur(16px);
                        border: 1px solid rgba(226, 232, 240, 0.8);
                        border-radius: 20px;
                        max-width: 500px;
                        margin: 0 auto;
                        padding: 28px;
                        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
                    }
                    .brand-logo {
                        height: 48px;
                        margin: 0 auto 16px;
                        display: block;
                    }
                    .header-title {
                        font-size: 22px;
                        font-weight: 800;
                        color: #0f172a;
                        text-align: center;
                        margin-top: 0;
                    }
                    .header-sub {
                        font-size: 13px;
                        color: #64748b;
                        text-align: center;
                        margin-top: 6px;
                        margin-bottom: 24px;
                        font-weight: 500;
                    }
                    .body-content {
                        font-size: 14px;
                        color: #475569;
                        line-height: 1.6;
                    }
                    .cta-btn {
                        display: block;
                        text-align: center;
                        background: #ea580c;
                        color: white;
                        text-decoration: none;
                        padding: 12px 24px;
                        border-radius: 12px;
                        font-weight: 800;
                        font-size: 13px;
                        margin: 24px auto 0;
                        width: fit-content;
                        box-shadow: 0 4px 12px rgba(234, 88, 12, 0.2);
                    }
                    .footer {
                        text-align: center;
                        font-size: 11px;
                        color: #94a3b8;
                        margin-top: 32px;
                        border-top: 1px solid #f1f5f9;
                        padding-top: 16px;
                    }
                </style>
            </head>
            <body>
                <div class="email-card">
                    <img src="/icon1.png" alt="Suqafuran" class="brand-logo" />
                    <h1 class="header-title">${formattedTitle}</h1>
                    <div class="header-sub">${formattedSubtitle}</div>
                    <div class="body-content">${formattedBody}</div>
                    ${formattedActionText && formattedActionUrl ? `<a href="${formattedActionUrl}" class="cta-btn">${formattedActionText}</a>` : ''}
                    <div class="footer">
                        Sent securely from Suqafuran Inc. Nairobi, Kenya. <br>
                        © ${new Date().getFullYear()} Suqafuran Marketplace. All rights reserved.
                    </div>
                </div>
            </body>
            </html>
        `;
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header with Broadcast Action Trigger */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="text-primary-500" />
                        CRM & User Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Moderate customer accounts, send targeted campaign triggers, and launch mass communications.</p>
                </div>
                
                {/* Broadcast Campaign CRM Trigger */}
                <button
                    onClick={() => setShowBroadcastModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-primary-500/10 hover:shadow-lg transition-all"
                >
                    <Globe size={18} />
                    Broadcast to All Customers
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Customers', value: stats.total, icon: Users, color: 'blue' },
                    { label: 'Active Profiles', value: stats.active, icon: CheckCircle2, color: 'green' },
                    { label: 'Inactive Profiles', value: stats.inactive, icon: Ban, color: 'amber' },
                    { label: 'Administrative Admins', value: stats.admins, icon: ShieldCheck, color: 'primary' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                            <div className={`p-2 rounded-xl bg-${stat.color}-50 text-${stat.color}-500`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input 
                        type="text"
                        placeholder="Search customers by name, email, or phone..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="text-gray-400 h-4 w-4" />
                    <select 
                        className="bg-gray-50 border-none rounded-xl text-sm px-4 py-2 focus:ring-2 focus:ring-primary-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active Profiles Only</option>
                        <option value="inactive">Inactive Profiles Only</option>
                    </select>
                </div>
            </div>

            {/* Users & CRM Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold">Customer Details</th>
                                <th className="px-6 py-4 font-bold">Account Integrity</th>
                                <th className="px-6 py-4 font-bold">Permissions</th>
                                <th className="px-6 py-4 font-bold">Registered Date</th>
                                <th className="px-6 py-4 font-bold text-right">CRM & Manual Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8">
                                            <div className="h-4 bg-gray-100 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No active customer records matching search parameters.
                                    </td>
                                </tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">
                                                {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{user.full_name || 'Anonymous Profile'}</p>
                                                <div className="flex flex-col gap-0.5 mt-0.5">
                                                    <span className="text-xs text-gray-500 flex items-center gap-1"><Mail size={12} /> {user.email}</span>
                                                    {user.phone_number && <span className="text-xs text-gray-400 flex items-center gap-1"><Phone size={12} /> {user.phone_number}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                            user.is_active 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {user.is_active ? <CheckCircle2 size={10} /> : <Ban size={10} />}
                                            {user.is_active ? 'Active' : 'Deactivated'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-fit ${user.is_admin ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {user.is_admin ? 'ADMINISTRATOR' : 'CUSTOMER PROFILE'}
                                            </span>
                                            {user.verification_level && (
                                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                    Level {user.verification_level} Verified
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Send Manual Tracked Email Action */}
                                            <button
                                                onClick={() => handleOpenManualModal(user)}
                                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                                title="Trigger Manual Targeted Email"
                                            >
                                                <Send size={18} />
                                            </button>
                                            
                                            <button 
                                                onClick={() => handleToggleStatus(user.id, user.is_active)}
                                                className={`p-2 rounded-lg transition-colors ${user.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`}
                                                title={user.is_active ? 'Suspend Credentials' : 'Activate Credentials'}
                                            >
                                                {user.is_active ? <PowerOff size={18} /> : <Power size={18} />}
                                            </button>
                                            <button 
                                                onClick={() => handleImpersonate(user.id)}
                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Ad Impersonation Tool"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Permanently Expunge Account"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Broadcast All CRM Modal */}
            {showBroadcastModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row h-[90vh] md:h-[80vh] max-h-[850px]">
                        
                        {/* Edit Panel */}
                        <form onSubmit={handleSendBroadcast} className="w-full md:w-1/2 p-6 overflow-y-auto space-y-4 border-r border-gray-100 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
                                        <Globe size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-gray-900 text-lg">Broadcast CRM Message</h3>
                                        <p className="text-gray-500 text-xs mt-0.5">Launches targeted campaign emails to all active customer profiles at once.</p>
                                    </div>
                                </div>

                                <div className="p-3 bg-amber-50 text-amber-800 rounded-2xl flex gap-2 text-xs mb-4">
                                    <Info className="shrink-0 text-amber-600" size={16} />
                                    <span>
                                        <strong>Placeholder Guide:</strong> Use <code>{"{{name}}"}</code> inside subjects, titles, or body contents to dynamically personalise each client's inbox!
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Outbound Email Subject</label>
                                        <input
                                            type="text"
                                            required
                                            value={broadcastForm.subject}
                                            onChange={e => setBroadcastForm({ ...broadcastForm, subject: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 font-medium"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Header Title Banner</label>
                                            <input
                                                type="text"
                                                required
                                                value={broadcastForm.title}
                                                onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                                                className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Header Subtitle</label>
                                            <input
                                                type="text"
                                                value={broadcastForm.subtitle}
                                                onChange={e => setBroadcastForm({ ...broadcastForm, subtitle: e.target.value })}
                                                className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">HTML Message Body</label>
                                        <textarea
                                            required
                                            rows={6}
                                            value={broadcastForm.content_html}
                                            onChange={e => setBroadcastForm({ ...broadcastForm, content_html: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 font-mono"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">CTA Button Text (Optional)</label>
                                            <input
                                                type="text"
                                                value={broadcastForm.action_text}
                                                onChange={e => setBroadcastForm({ ...broadcastForm, action_text: e.target.value })}
                                                placeholder="e.g. Visit Storefront"
                                                className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">CTA Action URL (Optional)</label>
                                            <input
                                                type="url"
                                                value={broadcastForm.action_url}
                                                onChange={e => setBroadcastForm({ ...broadcastForm, action_url: e.target.value })}
                                                placeholder="e.g. https://..."
                                                className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Campaign Identifier Log ID</label>
                                        <input
                                            type="text"
                                            required
                                            value={broadcastForm.campaign_id}
                                            onChange={e => setBroadcastForm({ ...broadcastForm, campaign_id: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-primary-500 font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-50">
                                <button
                                    type="button"
                                    onClick={() => setShowBroadcastModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-sm transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-primary-500/10 transition-all flex items-center justify-center gap-1.5"
                                >
                                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    Launch CRM Broadcast
                                </button>
                            </div>
                        </form>

                        {/* Preview Panel */}
                        <div className="hidden md:flex md:w-1/2 bg-gray-50 p-6 flex-col">
                            <div className="flex items-center gap-2 mb-4 border-b border-gray-200/50 pb-2">
                                <Eye size={16} className="text-gray-400" />
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Interactive Outbound Visual Preview</span>
                            </div>
                            <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                                <div className="px-4 py-2 bg-gray-100/50 border-b border-gray-200 text-[11px] font-bold text-gray-500 flex items-center justify-between">
                                    <span>Subject: {broadcastForm.subject}</span>
                                    <span className="text-primary-500">Live Render</span>
                                </div>
                                <iframe
                                    title="HTML Campaign Render"
                                    className="w-full flex-1 border-none"
                                    srcDoc={renderPreviewHtml(
                                        broadcastForm.title,
                                        broadcastForm.subtitle,
                                        broadcastForm.content_html,
                                        broadcastForm.action_text,
                                        broadcastForm.action_url
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Send Individual Manual Modal */}
            {showManualModal && selectedUser && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row h-[90vh] md:h-[80vh] max-h-[850px]">
                        
                        {/* Edit Panel */}
                        <form onSubmit={handleSendManual} className="w-full md:w-1/2 p-6 overflow-y-auto space-y-4 border-r border-gray-100 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
                                        <Send size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-gray-900 text-lg">Send Targeted Manual Email</h3>
                                        <p className="text-gray-500 text-xs mt-0.5">Send a tracked support or onboarding prompt to <strong>{selectedUser.full_name || selectedUser.email}</strong>.</p>
                                    </div>
                                </div>

                                {/* Preset Selector */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Select Trigger Campaign Template</label>
                                    <select
                                        className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 font-bold text-gray-700"
                                        value={manualEmailType}
                                        onChange={e => handlePresetChange(e.target.value as any)}
                                    >
                                        <option value="custom">Custom Markdown/HTML support message</option>
                                        <option value="welcome">Welcome activation onboarding template</option>
                                        <option value="scam_warning">Marketplace safety & scam prevention warning</option>
                                        <option value="seller_tips">Double sales premium listing tips</option>
                                        <option value="suspicious">Suspicious device account lock protection</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Email Subject Header</label>
                                        <input
                                            type="text"
                                            required
                                            value={manualForm.subject}
                                            onChange={e => setManualForm({ ...manualForm, subject: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 font-medium"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Visual Banner Title</label>
                                            <input
                                                type="text"
                                                required
                                                value={manualForm.title}
                                                onChange={e => setManualForm({ ...manualForm, title: e.target.value })}
                                                className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Visual Banner Subtitle</label>
                                            <input
                                                type="text"
                                                value={manualForm.subtitle}
                                                onChange={e => setManualForm({ ...manualForm, subtitle: e.target.value })}
                                                className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Email HTML / Text Body Content</label>
                                        <textarea
                                            required
                                            rows={6}
                                            value={manualForm.content_html}
                                            onChange={e => setManualForm({ ...manualForm, content_html: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 font-mono"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">CTA Action Label (Optional)</label>
                                            <input
                                                type="text"
                                                value={manualForm.action_text}
                                                onChange={e => setManualForm({ ...manualForm, action_text: e.target.value })}
                                                className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">CTA Link Destination (Optional)</label>
                                            <input
                                                type="url"
                                                value={manualForm.action_url}
                                                onChange={e => setManualForm({ ...manualForm, action_url: e.target.value })}
                                                className="w-full p-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-50">
                                <button
                                    type="button"
                                    onClick={() => setShowManualModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-sm transition-all"
                                >
                                    Dismiss Form
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-primary-500/10 transition-all flex items-center justify-center gap-1.5"
                                >
                                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    Trigger Dispatch
                                </button>
                            </div>
                        </form>

                        {/* Preview Panel */}
                        <div className="hidden md:flex md:w-1/2 bg-gray-50 p-6 flex-col">
                            <div className="flex items-center gap-2 mb-4 border-b border-gray-200/50 pb-2">
                                <Eye size={16} className="text-gray-400" />
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Outbound Tracked Visual Previewer</span>
                            </div>
                            <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                                <div className="px-4 py-2 bg-gray-100/50 border-b border-gray-200 text-[11px] font-bold text-gray-500 flex items-center justify-between">
                                    <span>To: {selectedUser.email}</span>
                                    <span className="text-primary-500">HTML Client Preview</span>
                                </div>
                                <iframe
                                    title="HTML Template Render"
                                    className="w-full flex-1 border-none"
                                    srcDoc={renderPreviewHtml(
                                        manualForm.title,
                                        manualForm.subtitle,
                                        manualForm.content_html,
                                        manualForm.action_text,
                                        manualForm.action_url
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;
