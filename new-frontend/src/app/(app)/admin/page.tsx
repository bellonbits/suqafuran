"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard, ClipboardList, Users, Store, ShieldCheck, CheckCircle2, XCircle,
    Search, Trash2, UserX, UserCheck, Loader2, Inbox, Plus, Globe, Wallet as WalletIcon,
    ShieldAlert, Flag, UserSearch, Megaphone, TrendingUp, Smartphone, History as HistoryIcon,
    ListChecks, PauseCircle, PlayCircle, Save, Sparkles, Ban, Tags, BadgePercent, ScrollText, ChevronDown, ChevronRight,
    Mail, KeyRound, Radar, Send, ImagePlus,
} from 'lucide-react';
import { useAuthStore } from '../../../store/useAuth';
import { useAuthModal } from '../../../store/useAuthModal';
import { adminService, type AdminStats, type AgentSummary } from '../../../services/admin';
import { listingsService } from '../../../services/listings';
import type {
    Listing, User, Business, SiteContent, FraudEvent, Report, UserRiskProfile,
    Voucher, MobileTransaction, PromotionRead, AgentSignup, AgentListingRow, AgentConversions,
    Category, SubCategory, MarketingCode, AuditLogEntry,
    OtpLookupResult, OtpLogEntry, VerificationAttemptsResult, EmailAnalytics,
} from '../../../types';

type Tab = 'overview' | 'listings' | 'businesses' | 'users' | 'agents' | 'trust' | 'promotions' | 'marketing' | 'wallet' | 'content' | 'categories' | 'codes' | 'audit' | 'crm' | 'otp';
type TabColor = 'amber' | 'blue' | 'red' | 'green' | 'slate';

export default function AdminPanel() {
    const router = useRouter();
    const { user, isAuthenticated, isHydrated } = useAuthStore();
    const openAuthModal = useAuthModal((s) => s.open);
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const hasAccess = !!user && user.is_admin;

    const [stats, setStats] = useState<AdminStats | null>(null);
    const [queue, setQueue] = useState<Listing[]>([]);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [userTotal, setUserTotal] = useState(0);
    const [userSearch, setUserSearch] = useState('');
    const [agents, setAgents] = useState<AgentSummary[]>([]);
    const [newAgentEmail, setNewAgentEmail] = useState('');

    // Site content
    const [content, setContent] = useState<SiteContent[]>([]);

    // Wallet
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [voucherCode, setVoucherCode] = useState('');
    const [voucherAmount, setVoucherAmount] = useState('');

    // Trust & safety
    const [trustSubTab, setTrustSubTab] = useState<'fraud' | 'reports' | 'risk'>('fraud');
    const [fraudEvents, setFraudEvents] = useState<FraudEvent[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [reportStatus, setReportStatus] = useState('pending');
    const [reportNotes, setReportNotes] = useState<Record<number, string>>({});
    const [riskUserId, setRiskUserId] = useState('');
    const [riskProfile, setRiskProfile] = useState<UserRiskProfile | null>(null);
    const [riskLoading, setRiskLoading] = useState(false);

    // Promotions
    const [pendingPromotions, setPendingPromotions] = useState<PromotionRead[]>([]);
    const [promotionPlans, setPromotionPlans] = useState<{ id: number; name_en: string; price_usd: number; duration_days: number }[]>([]);
    const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
    const [directPromoteForm, setDirectPromoteForm] = useState({ listing_id: '', plan_id: '', payment_phone: '' });
    const [codeAmount, setCodeAmount] = useState('');
    const [generatedCode, setGeneratedCode] = useState<{ code: string; amount: number } | null>(null);

    // Marketing / agent portal
    const [marketingSubTab, setMarketingSubTab] = useState<'queue' | 'orders' | 'history' | 'signups' | 'listings'>('queue');
    const [conversions, setConversions] = useState<AgentConversions | null>(null);
    const [paymentQueue, setPaymentQueue] = useState<MobileTransaction[]>([]);
    const [matchPromoIds, setMatchPromoIds] = useState<Record<number, string>>({});
    const [pendingOrders, setPendingOrders] = useState<PromotionRead[]>([]);
    const [agentHistory, setAgentHistory] = useState<PromotionRead[]>([]);
    const [signups, setSignups] = useState<AgentSignup[]>([]);
    const [signupSearch, setSignupSearch] = useState('');
    const [agentListings, setAgentListings] = useState<AgentListingRow[]>([]);
    const [listingSearch, setListingSearch] = useState('');
    const [listingStatusFilter, setListingStatusFilter] = useState('');

    // Categories / taxonomy
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategory, setNewCategory] = useState({ name_en: '', name_so: '', slug: '', icon_name: '', image_url: '' });
    const [newSubcategory, setNewSubcategory] = useState({ name_en: '', name_so: '', slug: '', category_id: '', image_url: '' });
    const [newSubsubcategory, setNewSubsubcategory] = useState({ name_en: '', name_so: '', slug: '', subcategory_id: '', image_url: '' });
    const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});

    // Marketing codes
    const [marketingCodes, setMarketingCodes] = useState<MarketingCode[]>([]);
    const [newMarketingCode, setNewMarketingCode] = useState({ code: '', description: '', max_uses: '', expires_at: '' });

    // Audit log
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [auditAction, setAuditAction] = useState('');
    const [auditResourceType, setAuditResourceType] = useState('');

    // CRM & email
    const [crmSubTab, setCrmSubTab] = useState<'analytics' | 'send' | 'broadcast'>('analytics');
    const [emailAnalytics, setEmailAnalytics] = useState<EmailAnalytics | null>(null);
    const [manualEmailForm, setManualEmailForm] = useState({ email: '', subject: '', title: '', subtitle: '', content_html: '', action_text: '', action_url: '' });
    const [broadcastForm, setBroadcastForm] = useState({ subject: '', title: '', subtitle: '', content_html: '', action_text: '', action_url: '' });
    const [emailResultMessage, setEmailResultMessage] = useState('');

    // OTP & verification tools
    const [otpSubTab, setOtpSubTab] = useState<'lookup' | 'logs' | 'verification'>('lookup');
    const [otpLookupInput, setOtpLookupInput] = useState({ channel: 'email' as 'email' | 'phone', value: '' });
    const [otpLookupResult, setOtpLookupResult] = useState<OtpLookupResult | null>(null);
    const [otpLogs, setOtpLogs] = useState<OtpLogEntry[]>([]);
    const [otpLogFilter, setOtpLogFilter] = useState({ identifier: '', event_type: '', channel: '' });
    const [verificationIdentifier, setVerificationIdentifier] = useState('');
    const [verificationResult, setVerificationResult] = useState<VerificationAttemptsResult | null>(null);

    const [loading, setLoading] = useState(true);
    const [actingId, setActingId] = useState<string | number | null>(null);
    const [agentError, setAgentError] = useState('');

    useEffect(() => {
        if (!isHydrated) return;
        if (!isAuthenticated) { openAuthModal('signin'); router.replace('/'); return; }
        if (!hasAccess) router.replace('/');
    }, [isHydrated, isAuthenticated, hasAccess, router]);

    useEffect(() => {
        if (!isHydrated || !isAuthenticated || !hasAccess) return;
        loadForTab(activeTab);
    }, [isHydrated, isAuthenticated, hasAccess, activeTab]);

    useEffect(() => {
        if (!isHydrated || !isAuthenticated || !hasAccess || activeTab !== 'trust') return;
        loadTrustSubTab(trustSubTab);
    }, [isHydrated, isAuthenticated, hasAccess, activeTab, trustSubTab, reportStatus]);

    useEffect(() => {
        if (!isHydrated || !isAuthenticated || !hasAccess || activeTab !== 'marketing') return;
        loadMarketingSubTab(marketingSubTab);
    }, [isHydrated, isAuthenticated, hasAccess, activeTab, marketingSubTab]);

    useEffect(() => {
        if (!isHydrated || !isAuthenticated || !hasAccess || activeTab !== 'otp' || otpSubTab !== 'logs') return;
        adminService.getOtpLogs({ limit: 100 }).then(res => setOtpLogs(res.results)).catch(err => console.error('Failed to load OTP logs', err));
    }, [isHydrated, isAuthenticated, hasAccess, activeTab, otpSubTab]);

    async function loadForTab(tab: Tab) {
        setLoading(true);
        try {
            if (tab === 'overview') setStats(await adminService.getStats());
            if (tab === 'listings') setQueue(await adminService.getModerationQueue({ limit: 100 }));
            if (tab === 'businesses') setBusinesses(await adminService.getBusinessQueue({ limit: 100 }));
            if (tab === 'users') {
                const [list, total] = await Promise.all([
                    adminService.listUsers({ limit: 50 }),
                    adminService.countUsers(),
                ]);
                setUsers(list);
                setUserTotal(total);
            }
            if (tab === 'agents') setAgents(await adminService.listAgents());
            if (tab === 'content') setContent(await adminService.getAllContent());
            if (tab === 'wallet') setVouchers(await adminService.getVouchers());
            if (tab === 'promotions') {
                const [pending, plans] = await Promise.all([
                    adminService.getPendingPromotions(),
                    adminService.getPromotionPlans(),
                ]);
                setPendingPromotions(pending);
                setPromotionPlans(plans);
            }
            if (tab === 'trust') await loadTrustSubTab(trustSubTab);
            if (tab === 'marketing') await loadMarketingSubTab(marketingSubTab);
            if (tab === 'categories') setCategories(await listingsService.getCategories());
            if (tab === 'codes') setMarketingCodes(await adminService.getMarketingCodes());
            if (tab === 'audit') setAuditLogs(await adminService.getAuditLogs({ limit: 100 }));
            if (tab === 'crm' && !emailAnalytics) setEmailAnalytics(await adminService.getEmailAnalytics());
            if (tab === 'otp' && otpSubTab === 'logs') setOtpLogs((await adminService.getOtpLogs({ limit: 100 })).results);
        } catch (err) {
            console.error(`Failed to load admin ${tab} data`, err);
        } finally {
            setLoading(false);
        }
    }

    async function loadTrustSubTab(sub: typeof trustSubTab) {
        try {
            if (sub === 'fraud') setFraudEvents(await adminService.getFraudEvents({ limit: 100 }));
            if (sub === 'reports') setReports(await adminService.getReports(reportStatus));
        } catch (err) {
            console.error('Failed to load trust data', err);
        }
    }

    async function loadMarketingSubTab(sub: typeof marketingSubTab) {
        try {
            if (!conversions) setConversions(await adminService.getAgentConversions());
            if (sub === 'queue') setPaymentQueue(await adminService.getPaymentQueue());
            if (sub === 'orders') setPendingOrders(await adminService.getPendingOrders());
            if (sub === 'history') setAgentHistory(await adminService.getAgentHistory(50));
            if (sub === 'signups') setSignups(await adminService.getAgentSignups({ limit: 50, search: signupSearch || undefined }));
            if (sub === 'listings') setAgentListings(await adminService.getAgentAllListings({ limit: 100, search: listingSearch || undefined, status_filter: listingStatusFilter || undefined }));
        } catch (err) {
            console.error('Failed to load marketing data', err);
        }
    }

    const handleUserSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const [list, total] = await Promise.all([
                adminService.listUsers({ limit: 50, search: userSearch || undefined }),
                adminService.countUsers(userSearch || undefined),
            ]);
            setUsers(list);
            setUserTotal(total);
        } catch (err) {
            console.error('User search failed', err);
        } finally {
            setLoading(false);
        }
    };

    const handleModerateListing = async (id: number, approve: boolean) => {
        setActingId(id);
        try {
            await adminService.moderateListing(id, approve);
            setQueue(prev => prev.filter(l => l.id !== id));
        } catch (err) {
            console.error('Failed to moderate listing', err);
        } finally {
            setActingId(null);
        }
    };

    const handleBusinessDecision = async (id: string, approve: boolean) => {
        setActingId(id);
        try {
            if (approve) await adminService.approveBusiness(id);
            else await adminService.disapproveBusiness(id);
            setBusinesses(prev => prev.filter(b => b.id !== id));
        } catch (err) {
            console.error('Failed to update business approval', err);
        } finally {
            setActingId(null);
        }
    };

    const handleToggleUserActive = async (u: User) => {
        setActingId(u.id);
        try {
            const updated = await adminService.updateUserStatus(u.id, !u.is_active);
            setUsers(prev => prev.map(x => x.id === u.id ? updated : x));
        } catch (err) {
            console.error('Failed to update user status', err);
        } finally {
            setActingId(null);
        }
    };

    const handleDeleteUser = async (u: User) => {
        if (!window.confirm(`Permanently delete ${u.full_name}'s account? This cannot be undone.`)) return;
        setActingId(u.id);
        try {
            await adminService.deleteUser(u.id);
            setUsers(prev => prev.filter(x => x.id !== u.id));
            setUserTotal(prev => prev - 1);
        } catch (err) {
            console.error('Failed to delete user', err);
        } finally {
            setActingId(null);
        }
    };

    const handleAddAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAgentEmail.trim()) return;
        setAgentError('');
        setActingId('add-agent');
        try {
            await adminService.addAgent(newAgentEmail.trim());
            setNewAgentEmail('');
            setAgents(await adminService.listAgents());
        } catch (err: any) {
            setAgentError(err?.response?.data?.detail || 'Failed to add agent');
        } finally {
            setActingId(null);
        }
    };

    const handleRemoveAgent = async (email: string) => {
        setActingId(email);
        try {
            await adminService.removeAgent(email);
            setAgents(prev => prev.filter(a => a.email !== email));
        } catch (err) {
            console.error('Failed to remove agent', err);
        } finally {
            setActingId(null);
        }
    };

    const handleSaveContent = async (key: string, value_en: string, value_so: string) => {
        setActingId(key);
        try {
            const updated = await adminService.updateContent(key, { value_en, value_so: value_so || undefined });
            setContent(prev => prev.map(c => c.key === key ? updated : c));
        } catch (err) {
            console.error('Failed to update content', err);
        } finally {
            setActingId(null);
        }
    };

    const handleCreateVoucher = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!voucherCode.trim() || !voucherAmount) return;
        setActingId('create-voucher');
        try {
            const created = await adminService.createVoucher(voucherCode.trim().toUpperCase(), parseFloat(voucherAmount));
            setVouchers(prev => [created, ...prev]);
            setVoucherCode('');
            setVoucherAmount('');
        } catch (err) {
            console.error('Failed to create voucher', err);
        } finally {
            setActingId(null);
        }
    };

    const handleModerateReport = async (reportId: number, action: 'dismiss' | 'warn' | 'ban' | 'remove_listing') => {
        setActingId(reportId);
        try {
            await adminService.moderateReport(reportId, action, reportNotes[reportId] || '');
            setReports(prev => prev.filter(r => r.id !== reportId));
        } catch (err) {
            console.error('Failed to moderate report', err);
        } finally {
            setActingId(null);
        }
    };

    const handleLoadRiskProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = parseInt(riskUserId, 10);
        if (!id) return;
        setRiskLoading(true);
        setRiskProfile(null);
        try {
            setRiskProfile(await adminService.getUserRiskProfile(id));
        } catch (err) {
            console.error('Failed to load risk profile', err);
        } finally {
            setRiskLoading(false);
        }
    };

    const handleApprovePromotion = async (promo: PromotionRead) => {
        setActingId(promo.id);
        try {
            await adminService.approvePromotion(promo.id, promo.plan_id);
            setPendingPromotions(prev => prev.filter(p => p.id !== promo.id));
        } catch (err) {
            console.error('Failed to approve promotion', err);
        } finally {
            setActingId(null);
        }
    };

    const handleRejectPromotion = async (promoId: number) => {
        setActingId(promoId);
        try {
            await adminService.rejectPromotion(promoId, rejectReasons[promoId] || 'Rejected by admin');
            setPendingPromotions(prev => prev.filter(p => p.id !== promoId));
        } catch (err) {
            console.error('Failed to reject promotion', err);
        } finally {
            setActingId(null);
        }
    };

    const handleDirectPromote = async (e: React.FormEvent) => {
        e.preventDefault();
        const { listing_id, plan_id, payment_phone } = directPromoteForm;
        if (!listing_id || !plan_id || !payment_phone) return;
        setActingId('direct-promote');
        try {
            await adminService.directPromote(parseInt(listing_id, 10), parseInt(plan_id, 10), payment_phone);
            setDirectPromoteForm({ listing_id: '', plan_id: '', payment_phone: '' });
            setPendingPromotions(await adminService.getPendingPromotions());
        } catch (err) {
            console.error('Failed to direct-promote listing', err);
        } finally {
            setActingId(null);
        }
    };

    const handleGenerateCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setActingId('generate-code');
        try {
            const result = await adminService.generatePromoCode(codeAmount ? parseFloat(codeAmount) : 0);
            setGeneratedCode(result);
            setCodeAmount('');
        } catch (err) {
            console.error('Failed to generate code', err);
        } finally {
            setActingId(null);
        }
    };

    const handleRejectTransaction = async (txId: number) => {
        setActingId(txId);
        try {
            await adminService.rejectTransaction(txId);
            setPaymentQueue(prev => prev.filter(t => t.id !== txId));
        } catch (err) {
            console.error('Failed to reject transaction', err);
        } finally {
            setActingId(null);
        }
    };

    const handleMatchPayment = async (txId: number) => {
        const promoId = parseInt(matchPromoIds[txId] || '', 10);
        if (!promoId) return;
        setActingId(txId);
        try {
            await adminService.matchPayment(promoId, txId);
            setPaymentQueue(prev => prev.filter(t => t.id !== txId));
        } catch (err) {
            console.error('Failed to match payment', err);
        } finally {
            setActingId(null);
        }
    };

    const handleActivatePromotion = async (promoId: number) => {
        setActingId(promoId);
        try {
            await adminService.activatePromotion(promoId);
            setPendingOrders(prev => prev.filter(p => p.id !== promoId));
        } catch (err) {
            console.error('Failed to activate promotion', err);
        } finally {
            setActingId(null);
        }
    };

    const handleListingAction = async (id: number, action: 'end' | 'reactivate' | 'approve' | 'reject') => {
        setActingId(id);
        try {
            if (action === 'end') await adminService.endListing(id);
            if (action === 'reactivate') await adminService.reactivateListing(id);
            if (action === 'approve') await adminService.approveListingAgent(id);
            if (action === 'reject') await adminService.rejectListingAgent(id);
            setAgentListings(await adminService.getAgentAllListings({ limit: 100, search: listingSearch || undefined, status_filter: listingStatusFilter || undefined }));
        } catch (err) {
            console.error('Failed to update listing', err);
        } finally {
            setActingId(null);
        }
    };

    const refreshCategories = async () => setCategories(await listingsService.getCategories());

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name_en, slug, icon_name } = newCategory;
        if (!name_en || !slug || !icon_name) return;
        setActingId('create-category');
        try {
            await adminService.createCategory({ name_en, name_so: newCategory.name_so || undefined, slug, icon_name, image_url: newCategory.image_url || undefined });
            setNewCategory({ name_en: '', name_so: '', slug: '', icon_name: '', image_url: '' });
            await refreshCategories();
        } catch (err) {
            console.error('Failed to create category', err);
        } finally {
            setActingId(null);
        }
    };

    const handleUpdateCategory = async (id: number, payload: Partial<{ name_en: string; name_so: string; slug: string; icon_name: string; image_url: string }>) => {
        setActingId(`category-${id}`);
        try {
            await adminService.updateCategory(id, payload);
            await refreshCategories();
        } catch (err) {
            console.error('Failed to update category', err);
        } finally {
            setActingId(null);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!window.confirm('Delete this category and all its subcategories?')) return;
        setActingId(`category-${id}`);
        try {
            await adminService.deleteCategory(id);
            await refreshCategories();
        } catch (err) {
            console.error('Failed to delete category', err);
        } finally {
            setActingId(null);
        }
    };

    const handleCreateSubcategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name_en, slug, category_id } = newSubcategory;
        if (!name_en || !slug || !category_id) return;
        setActingId('create-subcategory');
        try {
            await adminService.createSubcategory({ name_en, name_so: newSubcategory.name_so || undefined, slug, category_id: parseInt(category_id, 10), image_url: newSubcategory.image_url || undefined });
            setNewSubcategory({ name_en: '', name_so: '', slug: '', category_id: '', image_url: '' });
            await refreshCategories();
        } catch (err) {
            console.error('Failed to create subcategory', err);
        } finally {
            setActingId(null);
        }
    };

    const handleUpdateSubcategory = async (id: number, payload: Partial<{ name_en: string; name_so: string; slug: string; image_url: string }>) => {
        setActingId(`subcategory-${id}`);
        try {
            await adminService.updateSubcategory(id, payload);
            await refreshCategories();
        } catch (err) {
            console.error('Failed to update subcategory', err);
        } finally {
            setActingId(null);
        }
    };

    const handleDeleteSubcategory = async (id: number) => {
        if (!window.confirm('Delete this subcategory and all its subsubcategories?')) return;
        setActingId(`subcategory-${id}`);
        try {
            await adminService.deleteSubcategory(id);
            await refreshCategories();
        } catch (err) {
            console.error('Failed to delete subcategory', err);
        } finally {
            setActingId(null);
        }
    };

    const handleCreateSubsubcategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name_en, slug, subcategory_id } = newSubsubcategory;
        if (!name_en || !slug || !subcategory_id) return;
        setActingId('create-subsubcategory');
        try {
            await adminService.createSubsubcategory({ name_en, name_so: newSubsubcategory.name_so || undefined, slug, subcategory_id: parseInt(subcategory_id, 10), image_url: newSubsubcategory.image_url || undefined });
            setNewSubsubcategory({ name_en: '', name_so: '', slug: '', subcategory_id: '', image_url: '' });
            await refreshCategories();
        } catch (err) {
            console.error('Failed to create subsubcategory', err);
        } finally {
            setActingId(null);
        }
    };

    const handleDeleteSubsubcategory = async (id: number) => {
        if (!window.confirm('Delete this subsubcategory?')) return;
        setActingId(`subsubcategory-${id}`);
        try {
            await adminService.deleteSubsubcategory(id);
            await refreshCategories();
        } catch (err) {
            console.error('Failed to delete subsubcategory', err);
        } finally {
            setActingId(null);
        }
    };

    const handleCreateMarketingCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMarketingCode.code.trim() || !newMarketingCode.description.trim()) return;
        setActingId('create-marketing-code');
        try {
            const created = await adminService.createMarketingCode({
                code: newMarketingCode.code.trim().toUpperCase(),
                description: newMarketingCode.description.trim(),
                created_by: user?.full_name,
                max_uses: newMarketingCode.max_uses ? parseInt(newMarketingCode.max_uses, 10) : undefined,
                expires_at: newMarketingCode.expires_at || undefined,
            });
            setMarketingCodes(prev => [created, ...prev]);
            setNewMarketingCode({ code: '', description: '', max_uses: '', expires_at: '' });
        } catch (err) {
            console.error('Failed to create marketing code', err);
        } finally {
            setActingId(null);
        }
    };

    const handleToggleMarketingCode = async (mc: MarketingCode) => {
        setActingId(mc.id);
        try {
            const updated = await adminService.updateMarketingCode(mc.id, { is_active: !mc.is_active });
            setMarketingCodes(prev => prev.map(c => c.id === mc.id ? updated : c));
        } catch (err) {
            console.error('Failed to update marketing code', err);
        } finally {
            setActingId(null);
        }
    };

    const handleDeactivateMarketingCode = async (id: number) => {
        setActingId(id);
        try {
            await adminService.deactivateMarketingCode(id);
            setMarketingCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: false } : c));
        } catch (err) {
            console.error('Failed to deactivate marketing code', err);
        } finally {
            setActingId(null);
        }
    };

    const handleApplyAuditFilter = async () => {
        setLoading(true);
        try {
            setAuditLogs(await adminService.getAuditLogs({ limit: 100, action: auditAction || undefined, resource_type: auditResourceType || undefined }));
        } catch (err) {
            console.error('Failed to filter audit logs', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLookupOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpLookupInput.value.trim()) return;
        setActingId('lookup-otp');
        setOtpLookupResult(null);
        try {
            const params = otpLookupInput.channel === 'email' ? { email: otpLookupInput.value.trim() } : { phone: otpLookupInput.value.trim() };
            setOtpLookupResult(await adminService.lookupOtp(params));
        } catch (err) {
            console.error('Failed to lookup OTP', err);
        } finally {
            setActingId(null);
        }
    };

    const handleFilterOtpLogs = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await adminService.getOtpLogs({
                limit: 100,
                identifier: otpLogFilter.identifier || undefined,
                event_type: otpLogFilter.event_type || undefined,
                channel: otpLogFilter.channel || undefined,
            });
            setOtpLogs(res.results);
        } catch (err) {
            console.error('Failed to filter OTP logs', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLookupVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verificationIdentifier.trim()) return;
        setActingId('lookup-verification');
        setVerificationResult(null);
        try {
            setVerificationResult(await adminService.getVerificationAttempts(verificationIdentifier.trim()));
        } catch (err) {
            console.error('Failed to lookup verification attempts', err);
        } finally {
            setActingId(null);
        }
    };

    const handleSendManualEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        const { email, subject, title, content_html } = manualEmailForm;
        if (!email || !subject || !title || !content_html) return;
        setActingId('send-manual-email');
        setEmailResultMessage('');
        try {
            const res = await adminService.sendManualEmail({
                email, subject, title, content_html,
                subtitle: manualEmailForm.subtitle || undefined,
                action_text: manualEmailForm.action_text || undefined,
                action_url: manualEmailForm.action_url || undefined,
            });
            setEmailResultMessage(res.message);
            setManualEmailForm({ email: '', subject: '', title: '', subtitle: '', content_html: '', action_text: '', action_url: '' });
        } catch (err) {
            console.error('Failed to send manual email', err);
        } finally {
            setActingId(null);
        }
    };

    const handleSendBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        const { subject, title, content_html } = broadcastForm;
        if (!subject || !title || !content_html) return;
        if (!window.confirm('Send this email to ALL active users? This cannot be undone.')) return;
        setActingId('send-broadcast');
        setEmailResultMessage('');
        try {
            const res = await adminService.sendBroadcastEmail({
                subject, title, content_html,
                subtitle: broadcastForm.subtitle || undefined,
                action_text: broadcastForm.action_text || undefined,
                action_url: broadcastForm.action_url || undefined,
            });
            setEmailResultMessage(res.message);
            setBroadcastForm({ subject: '', title: '', subtitle: '', content_html: '', action_text: '', action_url: '' });
        } catch (err) {
            console.error('Failed to send broadcast email', err);
        } finally {
            setActingId(null);
        }
    };

    if (!isHydrated || !isAuthenticated || !hasAccess) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center text-sm font-semibold text-gray-400">
                Checking access...
            </div>
        );
    }

    const tabs: { id: Tab; name: string; icon: React.ElementType; color: TabColor }[] = [
        { id: 'overview', name: 'Overview', icon: LayoutDashboard, color: 'slate' },
        { id: 'listings', name: `Listing Queue${queue.length ? ` (${queue.length})` : ''}`, icon: ClipboardList, color: 'blue' },
        { id: 'businesses', name: `Business Queue${businesses.length ? ` (${businesses.length})` : ''}`, icon: Store, color: 'blue' },
        { id: 'users', name: 'User Management', icon: Users, color: 'amber' },
        { id: 'agents', name: 'Agents', icon: ShieldCheck, color: 'amber' },
        { id: 'crm', name: 'CRM & Email', icon: Mail, color: 'red' },
        { id: 'trust', name: 'Abuse Reports', icon: ShieldAlert, color: 'red' },
        { id: 'promotions', name: `Promotions${pendingPromotions.length ? ` (${pendingPromotions.length})` : ''}`, icon: Megaphone, color: 'blue' },
        { id: 'marketing', name: 'Marketing Portal', icon: TrendingUp, color: 'blue' },
        { id: 'wallet', name: 'Wallet & Vouchers', icon: WalletIcon, color: 'green' },
        { id: 'categories', name: 'Categories', icon: Tags, color: 'amber' },
        { id: 'codes', name: 'Marketing Codes', icon: BadgePercent, color: 'blue' },
        { id: 'otp', name: 'OTP Lookup', icon: KeyRound, color: 'amber' },
        { id: 'content', name: 'Site Content', icon: Globe, color: 'slate' },
        { id: 'audit', name: 'Audit Log', icon: ScrollText, color: 'slate' },
    ];

    const tabColorClasses: Record<TabColor, { text: string; bgActive: string }> = {
        amber: { text: 'text-amber-600 dark:text-amber-400', bgActive: 'bg-amber-50 dark:bg-amber-950/30' },
        blue: { text: 'text-blue-600 dark:text-blue-400', bgActive: 'bg-blue-50 dark:bg-blue-950/30' },
        red: { text: 'text-red-500 dark:text-red-400', bgActive: 'bg-red-50 dark:bg-red-950/30' },
        green: { text: 'text-emerald-600 dark:text-emerald-400', bgActive: 'bg-emerald-50 dark:bg-emerald-950/30' },
        slate: { text: 'text-slate-600 dark:text-slate-300', bgActive: 'bg-slate-100 dark:bg-slate-800' },
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-60 shrink-0 space-y-1.5">
                    <div className="p-4 bg-slate-900 text-white rounded-3xl mb-4 dark:bg-slate-800 border-b-[3px] border-amber-500">
                        <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Admin Control Panel</span>
                        <h2 className="text-sm font-black font-poppins mt-0.5 truncate">{user?.full_name}</h2>
                    </div>

                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isCurrent = activeTab === tab.id;
                        const colors = tabColorClasses[tab.color];
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${colors.text} ${isCurrent ? `${colors.bgActive} shadow-sm` : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span className="truncate">{tab.name}</span>
                            </button>
                        );
                    })}
                </aside>

                <div className="flex-1 space-y-8 min-w-0">
                    {loading ? (
                        <div className="py-20 text-center text-sm font-semibold text-gray-400">
                            <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                            Loading...
                        </div>
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <div className="space-y-6 animate-fade-in-up">
                                    <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Platform Overview</h2>
                                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                                        <StatCard label="Total Users" value={stats?.total_users ?? 0} color="blue" />
                                        <StatCard label="Total Listings" value={stats?.total_listings ?? 0} color="blue" />
                                        <StatCard label="Active Listings" value={stats?.active_listings ?? 0} color="green" />
                                        <StatCard label="Pending Listings" value={stats?.pending_listings ?? 0} color="amber" />
                                        <StatCard label="Pending Promotions" value={stats?.pending_promotions ?? 0} color="amber" />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'listings' && (
                                <div className="space-y-4 animate-scale-in">
                                    <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Listing Moderation Queue</h2>
                                    {queue.length === 0 ? (
                                        <EmptyState icon={Inbox} text="No listings awaiting review" />
                                    ) : (
                                        <div className="space-y-4">
                                            {queue.map(listing => (
                                                <div key={listing.id} className="p-5 bg-white border border-gray-100 rounded-3xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex flex-col md:flex-row gap-4">
                                                    {listing.images?.[0] ? (
                                                        <img src={listing.images[0]} alt="" className="h-20 w-20 rounded-2xl object-cover shrink-0" />
                                                    ) : (
                                                        <div className="h-20 w-20 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0" />
                                                    )}
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">{listing.title_en}</h4>
                                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">
                                                            {listing.currency} {listing.price} · {listing.location} · by {listing.owner?.full_name || `User #${listing.owner_id}`}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <button
                                                            disabled={actingId === listing.id}
                                                            onClick={() => handleModerateListing(listing.id, true)}
                                                            className="btn-premium bg-accent text-white px-3 py-2 text-[10px] hover:bg-green-600 disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                                                        </button>
                                                        <button
                                                            disabled={actingId === listing.id}
                                                            onClick={() => handleModerateListing(listing.id, false)}
                                                            className="btn-premium bg-slate-100 border border-gray-200 text-gray-700 px-3 py-2 text-[10px] hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 disabled:opacity-50"
                                                        >
                                                            <XCircle className="h-3.5 w-3.5" /> Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'businesses' && (
                                <div className="space-y-4 animate-scale-in">
                                    <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Business Approval Queue</h2>
                                    {businesses.length === 0 ? (
                                        <EmptyState icon={Store} text="No businesses awaiting review" />
                                    ) : (
                                        <div className="space-y-4">
                                            {businesses.map(biz => (
                                                <div key={biz.id} className="p-5 bg-white border border-gray-100 rounded-3xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                    <div className="space-y-1 min-w-0">
                                                        <h4 className="text-xs font-black text-gray-900 dark:text-slate-100">{biz.name}</h4>
                                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold capitalize">
                                                            {biz.category} {biz.address ? `· ${biz.address}` : ''} {biz.is_approved ? '· already approved' : ''}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <button
                                                            disabled={actingId === biz.id}
                                                            onClick={() => handleBusinessDecision(biz.id, true)}
                                                            className="btn-premium bg-accent text-white px-3 py-2 text-[10px] hover:bg-green-600 disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                                                        </button>
                                                        <button
                                                            disabled={actingId === biz.id}
                                                            onClick={() => handleBusinessDecision(biz.id, false)}
                                                            className="btn-premium bg-slate-100 border border-gray-200 text-gray-700 px-3 py-2 text-[10px] hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 disabled:opacity-50"
                                                        >
                                                            <XCircle className="h-3.5 w-3.5" /> Disapprove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'users' && (
                                <div className="space-y-4 animate-scale-in">
                                    <div className="flex items-center justify-between gap-3">
                                        <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Users ({userTotal})</h2>
                                        <form onSubmit={handleUserSearch} className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                                placeholder="Search name, email, phone..."
                                                className="rounded-full border border-gray-200 bg-white pl-9 pr-4 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 w-56"
                                            />
                                        </form>
                                    </div>

                                    {users.length === 0 ? (
                                        <EmptyState icon={Users} text="No users found" />
                                    ) : (
                                        <div className="space-y-2">
                                            {users.map(u => (
                                                <div key={u.id} className="p-4 bg-white border border-gray-100 rounded-2xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs uppercase shrink-0">
                                                            {u.full_name?.charAt(0) || '?'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">{u.full_name}</h4>
                                                                {u.is_verified && <ShieldCheck className="h-3 w-3 text-accent shrink-0" />}
                                                                {u.is_admin && <span className="text-[8px] font-black uppercase bg-slate-900 text-white dark:bg-slate-700 px-1.5 py-0.5 rounded-full shrink-0">Admin</span>}
                                                                {u.is_agent && <span className="text-[8px] font-black uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded-full shrink-0">Agent</span>}
                                                                {!u.is_active && <span className="text-[8px] font-black uppercase bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full shrink-0">Suspended</span>}
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold truncate">{u.email} {u.phone ? `· ${u.phone}` : ''}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <button
                                                            onClick={() => { setRiskUserId(String(u.id)); setActiveTab('trust'); setTrustSubTab('risk'); }}
                                                            title="View risk profile"
                                                            className="p-2 rounded-full bg-slate-100 text-gray-600 hover:bg-primary/10 hover:text-primary dark:bg-slate-800 dark:text-slate-300"
                                                        >
                                                            <UserSearch className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            disabled={actingId === u.id}
                                                            onClick={() => handleToggleUserActive(u)}
                                                            title={u.is_active ? 'Suspend account' : 'Reactivate account'}
                                                            className="p-2 rounded-full bg-slate-100 text-gray-600 hover:bg-amber-50 hover:text-amber-600 dark:bg-slate-800 dark:text-slate-300 disabled:opacity-50"
                                                        >
                                                            {u.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                                                        </button>
                                                        <button
                                                            disabled={actingId === u.id}
                                                            onClick={() => handleDeleteUser(u)}
                                                            title="Delete account"
                                                            className="p-2 rounded-full bg-slate-100 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-300 disabled:opacity-50"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'agents' && (
                                <div className="space-y-4 animate-scale-in">
                                    <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Verification &amp; Support Agents</h2>

                                    <form onSubmit={handleAddAgent} className="p-5 rounded-3xl bg-slate-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-end">
                                        {agentError && <p className="text-xs font-bold text-red-500 w-full">{agentError}</p>}
                                        <div className="space-y-1.5 flex-1 w-full">
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Grant agent access by email</label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="user@example.com"
                                                value={newAgentEmail}
                                                onChange={(e) => setNewAgentEmail(e.target.value)}
                                                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                            />
                                        </div>
                                        <button type="submit" disabled={actingId === 'add-agent'} className="btn-premium bg-primary text-white px-5 py-3 text-xs w-full md:w-auto shrink-0 shadow-md shadow-primary/20 hover:bg-primary-dark disabled:opacity-50">
                                            {actingId === 'add-agent' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                            <span>Add Agent</span>
                                        </button>
                                    </form>

                                    {agents.length === 0 ? (
                                        <EmptyState icon={ShieldCheck} text="No agents yet" />
                                    ) : (
                                        <div className="space-y-2">
                                            {agents.map(a => (
                                                <div key={a.id} className="p-4 bg-white border border-gray-100 rounded-2xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">{a.full_name}</h4>
                                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold truncate">{a.email} {a.phone ? `· ${a.phone}` : ''}</p>
                                                    </div>
                                                    <button
                                                        disabled={actingId === a.email}
                                                        onClick={() => handleRemoveAgent(a.email)}
                                                        className="btn-premium bg-slate-100 border border-gray-200 text-gray-700 px-3 py-2 text-[10px] hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 disabled:opacity-50 shrink-0"
                                                    >
                                                        Revoke Access
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'trust' && (
                                <div className="space-y-5 animate-scale-in">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Trust &amp; Safety</h2>
                                        <SubTabs
                                            value={trustSubTab}
                                            onChange={(v) => setTrustSubTab(v as typeof trustSubTab)}
                                            options={[
                                                { id: 'fraud', name: 'Fraud Events', icon: ShieldAlert },
                                                { id: 'reports', name: 'Reports', icon: Flag },
                                                { id: 'risk', name: 'User Risk Lookup', icon: UserSearch },
                                            ]}
                                        />
                                    </div>

                                    {trustSubTab === 'fraud' && (
                                        fraudEvents.length === 0 ? (
                                            <EmptyState icon={ShieldAlert} text="No fraud events recorded" />
                                        ) : (
                                            <div className="space-y-2">
                                                {fraudEvents.map(ev => (
                                                    <div key={ev.id} className="p-4 bg-white border border-gray-100 rounded-2xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between gap-4">
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-xs font-black text-gray-900 dark:text-slate-100">{ev.rule_name}</h4>
                                                                <span className="text-[8px] font-black uppercase bg-slate-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded-full">{ev.target_type} #{ev.target_id}</span>
                                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${ev.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}>{ev.status}</span>
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold mt-0.5">
                                                                Risk score {ev.risk_score} · confidence {Math.round(ev.confidence * 100)}% · {new Date(ev.created_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    )}

                                    {trustSubTab === 'reports' && (
                                        <div className="space-y-4">
                                            <div className="flex gap-2">
                                                {['pending', 'warned', 'suspended', 'removed', 'dismissed'].map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => setReportStatus(s)}
                                                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide capitalize cursor-pointer ${reportStatus === s ? 'bg-primary text-white' : 'bg-slate-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>

                                            {reports.length === 0 ? (
                                                <EmptyState icon={Flag} text={`No ${reportStatus} reports`} />
                                            ) : (
                                                <div className="space-y-3">
                                                    {reports.map(r => (
                                                        <div key={r.id} className="p-5 bg-white border border-gray-100 rounded-3xl card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-3">
                                                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                                                <div>
                                                                    <h4 className="text-xs font-black text-gray-900 dark:text-slate-100">{r.reason}</h4>
                                                                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold mt-0.5">
                                                                        Reporter #{r.reporter_id} {r.reported_user_id ? `· reported user #${r.reported_user_id}` : ''} {r.listing_id ? `· listing #${r.listing_id}` : ''} · risk {r.risk_score}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => { setRiskUserId(String(r.reported_user_id || r.reporter_id)); setTrustSubTab('risk'); }}
                                                                    className="text-[10px] font-black text-primary hover:underline shrink-0"
                                                                >
                                                                    View risk profile
                                                                </button>
                                                            </div>
                                                            {r.description && <p className="text-[11px] text-gray-600 dark:text-slate-300">{r.description}</p>}
                                                            <input
                                                                type="text"
                                                                placeholder="Moderation note (optional)"
                                                                value={reportNotes[r.id] || ''}
                                                                onChange={(e) => setReportNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
                                                                className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                                            />
                                                            <div className="flex gap-2 flex-wrap">
                                                                <button disabled={actingId === r.id} onClick={() => handleModerateReport(r.id, 'dismiss')} className="btn-premium bg-slate-100 text-gray-700 px-3 py-2 text-[10px] dark:bg-slate-800 dark:text-slate-200 disabled:opacity-50">Dismiss</button>
                                                                <button disabled={actingId === r.id} onClick={() => handleModerateReport(r.id, 'warn')} className="btn-premium bg-amber-50 text-amber-600 px-3 py-2 text-[10px] hover:bg-amber-100 disabled:opacity-50">Warn user</button>
                                                                <button disabled={actingId === r.id} onClick={() => handleModerateReport(r.id, 'remove_listing')} className="btn-premium bg-slate-100 text-gray-700 px-3 py-2 text-[10px] hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-50">Remove listing</button>
                                                                <button disabled={actingId === r.id} onClick={() => handleModerateReport(r.id, 'ban')} className="btn-premium bg-red-500 text-white px-3 py-2 text-[10px] hover:bg-red-600 disabled:opacity-50"><Ban className="h-3.5 w-3.5" /> Suspend user</button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {trustSubTab === 'risk' && (
                                        <div className="space-y-4">
                                            <form onSubmit={handleLoadRiskProfile} className="flex gap-3 items-end flex-wrap">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">User ID</label>
                                                    <input
                                                        type="number"
                                                        required
                                                        value={riskUserId}
                                                        onChange={(e) => setRiskUserId(e.target.value)}
                                                        className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 w-40"
                                                    />
                                                </div>
                                                <button type="submit" disabled={riskLoading} className="btn-premium bg-primary text-white px-5 py-3 text-xs shadow-md shadow-primary/20 hover:bg-primary-dark disabled:opacity-50">
                                                    {riskLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserSearch className="h-4 w-4" />}
                                                    <span>Lookup</span>
                                                </button>
                                            </form>

                                            {riskProfile && (
                                                <div className="space-y-4 animate-fade-in-up">
                                                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                                                        <StatCard label="Trust Score" value={riskProfile.user_trust_score} color={riskProfile.is_flagged ? 'amber' : 'green'} />
                                                        <div className="p-5 rounded-3xl bg-white border border-gray-100 card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-2">
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Trust Level</span>
                                                            <h3 className="text-xl font-black text-gray-900 dark:text-slate-100 capitalize">{riskProfile.trust_level}</h3>
                                                            {riskProfile.is_flagged && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full inline-block bg-red-50 text-red-500">Flagged</span>}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 mb-2">Linked Devices ({riskProfile.devices.length})</h4>
                                                        {riskProfile.devices.length === 0 ? <p className="text-[11px] text-gray-400">None</p> : (
                                                            <div className="space-y-1.5">
                                                                {riskProfile.devices.map(d => (
                                                                    <div key={d.id} className="p-3 bg-white border border-gray-100 rounded-xl dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold">
                                                                        <span className="truncate text-gray-700 dark:text-slate-300">{d.fingerprint_hash}</span>
                                                                        {d.is_banned && <span className="text-[8px] font-black uppercase bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full shrink-0">Banned</span>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 mb-2">Linked Users ({riskProfile.linked_users.length})</h4>
                                                        {riskProfile.linked_users.length === 0 ? <p className="text-[11px] text-gray-400">None — no shared devices</p> : (
                                                            <div className="space-y-1.5">
                                                                {riskProfile.linked_users.map(u => (
                                                                    <div key={u.id} className="p-3 bg-white border border-gray-100 rounded-xl dark:bg-slate-900 dark:border-slate-800 text-[11px] font-semibold text-gray-700 dark:text-slate-300">
                                                                        {u.full_name} · {u.email}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 mb-2">Risk Score History ({riskProfile.risk_history.length})</h4>
                                                        {riskProfile.risk_history.length === 0 ? <p className="text-[11px] text-gray-400">No changes recorded</p> : (
                                                            <div className="space-y-1.5">
                                                                {riskProfile.risk_history.map(h => (
                                                                    <div key={h.id} className="p-3 bg-white border border-gray-100 rounded-xl dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-gray-700 dark:text-slate-300">
                                                                        <span>{h.previous_score} → {h.new_score} ({h.reason})</span>
                                                                        <span className="text-gray-400 text-[10px]">{new Date(h.created_at).toLocaleDateString()}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'promotions' && (
                                <div className="space-y-6 animate-scale-in">
                                    <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Promotions</h2>

                                    <div>
                                        <h3 className="text-xs font-black text-gray-900 dark:text-slate-100 mb-3">Pending Approval</h3>
                                        {pendingPromotions.length === 0 ? (
                                            <EmptyState icon={Megaphone} text="No promotions awaiting approval" />
                                        ) : (
                                            <div className="space-y-3">
                                                {pendingPromotions.map(p => (
                                                    <div key={p.id} className="p-5 bg-white border border-gray-100 rounded-3xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                        <div className="min-w-0 space-y-1">
                                                            <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">{p.listing_title_en || `Listing #${p.listing_id}`}</h4>
                                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">
                                                                Plan: {p.plan_name_en || `#${p.plan_id}`} · ${p.amount} · {p.payment_phone || 'no phone'} · status {p.status}
                                                            </p>
                                                            <input
                                                                type="text"
                                                                placeholder="Rejection reason (if rejecting)"
                                                                value={rejectReasons[p.id] || ''}
                                                                onChange={(e) => setRejectReasons(prev => ({ ...prev, [p.id]: e.target.value }))}
                                                                className="w-full max-w-xs rounded-xl border border-gray-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                                            />
                                                        </div>
                                                        <div className="flex gap-2 shrink-0">
                                                            <button disabled={actingId === p.id} onClick={() => handleApprovePromotion(p)} className="btn-premium bg-accent text-white px-3 py-2 text-[10px] hover:bg-green-600 disabled:opacity-50">
                                                                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                                                            </button>
                                                            <button disabled={actingId === p.id} onClick={() => handleRejectPromotion(p.id)} className="btn-premium bg-slate-100 border border-gray-200 text-gray-700 px-3 py-2 text-[10px] hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 disabled:opacity-50">
                                                                <XCircle className="h-3.5 w-3.5" /> Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                        <form onSubmit={handleDirectPromote} className="p-5 rounded-3xl bg-slate-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 space-y-3">
                                            <h3 className="text-xs font-black text-gray-900 dark:text-slate-100 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" /> Direct Promote (bypass payment)</h3>
                                            <input type="number" required placeholder="Listing ID" value={directPromoteForm.listing_id} onChange={(e) => setDirectPromoteForm(f => ({ ...f, listing_id: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <select required value={directPromoteForm.plan_id} onChange={(e) => setDirectPromoteForm(f => ({ ...f, plan_id: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                                                <option value="">Select plan...</option>
                                                {promotionPlans.map(pl => <option key={pl.id} value={pl.id}>{pl.name_en} — ${pl.price_usd} / {pl.duration_days}d</option>)}
                                            </select>
                                            <input type="text" required placeholder="Payment phone" value={directPromoteForm.payment_phone} onChange={(e) => setDirectPromoteForm(f => ({ ...f, payment_phone: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <button type="submit" disabled={actingId === 'direct-promote'} className="btn-premium bg-primary text-white px-4 py-2.5 text-xs w-full shadow-md shadow-primary/20 hover:bg-primary-dark disabled:opacity-50">
                                                {actingId === 'direct-promote' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                                <span>Promote Now</span>
                                            </button>
                                        </form>

                                        <form onSubmit={handleGenerateCode} className="p-5 rounded-3xl bg-slate-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 space-y-3">
                                            <h3 className="text-xs font-black text-gray-900 dark:text-slate-100">Generate Promo Code</h3>
                                            <input type="number" step="0.01" placeholder="Voucher amount (optional)" value={codeAmount} onChange={(e) => setCodeAmount(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <button type="submit" disabled={actingId === 'generate-code'} className="btn-premium bg-primary text-white px-4 py-2.5 text-xs w-full shadow-md shadow-primary/20 hover:bg-primary-dark disabled:opacity-50">
                                                {actingId === 'generate-code' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                                <span>Generate</span>
                                            </button>
                                            {generatedCode && (
                                                <div className="p-3 rounded-xl bg-accent/10 text-accent text-xs font-black text-center">
                                                    {generatedCode.code} {generatedCode.amount ? `· $${generatedCode.amount}` : ''}
                                                </div>
                                            )}
                                        </form>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'marketing' && (
                                <div className="space-y-5 animate-scale-in">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Marketing Portal</h2>
                                        <SubTabs
                                            value={marketingSubTab}
                                            onChange={(v) => setMarketingSubTab(v as typeof marketingSubTab)}
                                            options={[
                                                { id: 'queue', name: 'Payment Queue', icon: Smartphone },
                                                { id: 'orders', name: 'Pending Orders', icon: ListChecks },
                                                { id: 'history', name: 'History', icon: HistoryIcon },
                                                { id: 'signups', name: 'Signups', icon: Users },
                                                { id: 'listings', name: 'All Listings', icon: ClipboardList },
                                            ]}
                                        />
                                    </div>

                                    {conversions && (
                                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                                            <StatCard label="Conversion Rate" value={Math.round(conversions.conversion_rate)} color="blue" suffix="%" />
                                            <StatCard label="Signups (7d)" value={conversions.signups_week} color="green" />
                                            <StatCard label="Ads Posted (7d)" value={conversions.ads_week} color="green" />
                                            <StatCard label="Active Listings" value={conversions.active_listings} color="amber" />
                                        </div>
                                    )}

                                    {marketingSubTab === 'queue' && (
                                        paymentQueue.length === 0 ? (
                                            <EmptyState icon={Smartphone} text="No unmatched mobile money transactions" />
                                        ) : (
                                            <div className="space-y-2">
                                                {paymentQueue.map(tx => (
                                                    <div key={tx.id} className="p-4 bg-white border border-gray-100 rounded-2xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <h4 className="text-xs font-black text-gray-900 dark:text-slate-100">{tx.phone} · {tx.currency} {tx.amount}</h4>
                                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">Ref {tx.reference} · {new Date(tx.timestamp).toLocaleString()}</p>
                                                        </div>
                                                        <div className="flex gap-2 items-center shrink-0">
                                                            <input
                                                                type="number"
                                                                placeholder="Promo ID"
                                                                value={matchPromoIds[tx.id] || ''}
                                                                onChange={(e) => setMatchPromoIds(prev => ({ ...prev, [tx.id]: e.target.value }))}
                                                                className="w-24 rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                                            />
                                                            <button disabled={actingId === tx.id} onClick={() => handleMatchPayment(tx.id)} className="btn-premium bg-accent text-white px-3 py-2 text-[10px] hover:bg-green-600 disabled:opacity-50">Match</button>
                                                            <button disabled={actingId === tx.id} onClick={() => handleRejectTransaction(tx.id)} className="btn-premium bg-slate-100 text-gray-700 px-3 py-2 text-[10px] hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-50">Reject</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    )}

                                    {marketingSubTab === 'orders' && (
                                        pendingOrders.length === 0 ? (
                                            <EmptyState icon={ListChecks} text="No promotions pending payment/match" />
                                        ) : (
                                            <div className="space-y-2">
                                                {pendingOrders.map(p => (
                                                    <div key={p.id} className="p-4 bg-white border border-gray-100 rounded-2xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">{p.listing_title_en || `Listing #${p.listing_id}`}</h4>
                                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">{p.plan_name_en} · ${p.amount} · {p.status}</p>
                                                        </div>
                                                        <button disabled={actingId === p.id} onClick={() => handleActivatePromotion(p.id)} className="btn-premium bg-accent text-white px-3 py-2 text-[10px] hover:bg-green-600 disabled:opacity-50 shrink-0">Activate</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    )}

                                    {marketingSubTab === 'history' && (
                                        agentHistory.length === 0 ? (
                                            <EmptyState icon={HistoryIcon} text="No activated promotions yet" />
                                        ) : (
                                            <div className="space-y-2">
                                                {agentHistory.map(p => (
                                                    <div key={p.id} className="p-4 bg-white border border-gray-100 rounded-2xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">{p.listing_title_en || `Listing #${p.listing_id}`}</h4>
                                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">{p.promotion_code} · ${p.amount} · {new Date(p.updated_at).toLocaleString()}</p>
                                                        </div>
                                                        <span className="text-[8px] font-black uppercase bg-accent/10 text-accent px-1.5 py-0.5 rounded-full shrink-0">{p.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    )}

                                    {marketingSubTab === 'signups' && (
                                        <div className="space-y-3">
                                            <form onSubmit={(e) => { e.preventDefault(); loadMarketingSubTab('signups'); }} className="relative max-w-xs">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                                <input type="text" value={signupSearch} onChange={(e) => setSignupSearch(e.target.value)} placeholder="Search signups..." className="w-full rounded-full border border-gray-200 bg-white pl-9 pr-4 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            </form>
                                            {signups.length === 0 ? <EmptyState icon={Users} text="No signups found" /> : (
                                                <div className="space-y-2">
                                                    {signups.map(s => (
                                                        <div key={s.id} className="p-4 bg-white border border-gray-100 rounded-2xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">{s.full_name}</h4>
                                                                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold truncate">{s.email} {s.phone ? `· ${s.phone}` : ''} · joined {new Date(s.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 ${s.has_posted ? 'bg-accent/10 text-accent' : 'bg-slate-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}>{s.ad_count} ads</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {marketingSubTab === 'listings' && (
                                        <div className="space-y-3">
                                            <div className="flex gap-2 flex-wrap items-center">
                                                <form onSubmit={(e) => { e.preventDefault(); loadMarketingSubTab('listings'); }} className="relative max-w-xs flex-1">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                                    <input type="text" value={listingSearch} onChange={(e) => setListingSearch(e.target.value)} placeholder="Search listings..." className="w-full rounded-full border border-gray-200 bg-white pl-9 pr-4 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                                </form>
                                                <select value={listingStatusFilter} onChange={(e) => { setListingStatusFilter(e.target.value); }} onBlur={() => loadMarketingSubTab('listings')} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                                                    <option value="">All statuses</option>
                                                    <option value="active">Active</option>
                                                    <option value="pending">Pending</option>
                                                    <option value="closed">Closed</option>
                                                    <option value="rejected">Rejected</option>
                                                </select>
                                                <button onClick={() => loadMarketingSubTab('listings')} className="btn-premium bg-slate-100 text-gray-700 px-3 py-2 text-[10px] dark:bg-slate-800 dark:text-slate-200">Apply</button>
                                            </div>

                                            {agentListings.length === 0 ? <EmptyState icon={ClipboardList} text="No listings found" /> : (
                                                <div className="space-y-2">
                                                    {agentListings.map(l => (
                                                        <div key={l.id} className="p-4 bg-white border border-gray-100 rounded-2xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">{l.title}</h4>
                                                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 ${l.status === 'active' ? 'bg-accent/10 text-accent' : 'bg-slate-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'}`}>{l.status}</span>
                                                                </div>
                                                                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold truncate">
                                                                    {l.price} · {l.location} · {l.owner_name || `User #${l.owner_id}`} · views {l.views ?? 0}
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-1.5 shrink-0">
                                                                {l.status !== 'active' && <button disabled={actingId === l.id} onClick={() => handleListingAction(l.id, 'approve')} title="Approve" className="p-2 rounded-full bg-slate-100 text-gray-600 hover:bg-accent/10 hover:text-accent dark:bg-slate-800 dark:text-slate-300 disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" /></button>}
                                                                {l.status === 'active' && <button disabled={actingId === l.id} onClick={() => handleListingAction(l.id, 'end')} title="End listing" className="p-2 rounded-full bg-slate-100 text-gray-600 hover:bg-amber-50 hover:text-amber-600 dark:bg-slate-800 dark:text-slate-300 disabled:opacity-50"><PauseCircle className="h-3.5 w-3.5" /></button>}
                                                                {l.status !== 'active' && <button disabled={actingId === l.id} onClick={() => handleListingAction(l.id, 'reactivate')} title="Reactivate" className="p-2 rounded-full bg-slate-100 text-gray-600 hover:bg-accent/10 hover:text-accent dark:bg-slate-800 dark:text-slate-300 disabled:opacity-50"><PlayCircle className="h-3.5 w-3.5" /></button>}
                                                                <button disabled={actingId === l.id} onClick={() => handleListingAction(l.id, 'reject')} title="Reject" className="p-2 rounded-full bg-slate-100 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-300 disabled:opacity-50"><XCircle className="h-3.5 w-3.5" /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'wallet' && (
                                <div className="space-y-6 animate-scale-in">
                                    <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Wallet &amp; Vouchers</h2>

                                    <form onSubmit={handleCreateVoucher} className="p-5 rounded-3xl bg-slate-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-end">
                                        <div className="space-y-1.5 flex-1 w-full">
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Voucher code</label>
                                            <input type="text" required value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} placeholder="SUQA50" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                        </div>
                                        <div className="space-y-1.5 w-full md:w-40">
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Amount</label>
                                            <input type="number" step="0.01" required value={voucherAmount} onChange={(e) => setVoucherAmount(e.target.value)} placeholder="10.00" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                        </div>
                                        <button type="submit" disabled={actingId === 'create-voucher'} className="btn-premium bg-primary text-white px-5 py-3 text-xs w-full md:w-auto shrink-0 shadow-md shadow-primary/20 hover:bg-primary-dark disabled:opacity-50">
                                            {actingId === 'create-voucher' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                            <span>Create Voucher</span>
                                        </button>
                                    </form>

                                    {vouchers.length === 0 ? (
                                        <EmptyState icon={WalletIcon} text="No vouchers generated yet" />
                                    ) : (
                                        <div className="space-y-2">
                                            {vouchers.map(v => (
                                                <div key={v.id} className="p-4 bg-white border border-gray-100 rounded-2xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <h4 className="text-xs font-black text-gray-900 dark:text-slate-100">{v.code}</h4>
                                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">${v.amount} · created {new Date(v.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 ${v.is_redeemed ? 'bg-slate-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400' : 'bg-accent/10 text-accent'}`}>
                                                        {v.is_redeemed ? `redeemed by #${v.redeemed_by_id}` : 'available'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'content' && (
                                <div className="space-y-4 animate-scale-in">
                                    <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Site Content</h2>
                                    {content.length === 0 ? (
                                        <EmptyState icon={Globe} text="No content entries found" />
                                    ) : (
                                        <div className="space-y-3">
                                            {content.map(c => (
                                                <ContentRow key={c.key} item={c} saving={actingId === c.key} onSave={handleSaveContent} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'categories' && (
                                <div className="space-y-6 animate-scale-in">
                                    <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Category Management</h2>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                        <form onSubmit={handleCreateCategory} className="p-4 rounded-3xl bg-slate-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 space-y-2">
                                            <h3 className="text-xs font-black text-gray-900 dark:text-slate-100">New Category</h3>
                                            <input required placeholder="Name (EN)" value={newCategory.name_en} onChange={(e) => setNewCategory(f => ({ ...f, name_en: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <input placeholder="Name (SO)" value={newCategory.name_so} onChange={(e) => setNewCategory(f => ({ ...f, name_so: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <input required placeholder="Slug" value={newCategory.slug} onChange={(e) => setNewCategory(f => ({ ...f, slug: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <input required placeholder="Icon name (lucide)" value={newCategory.icon_name} onChange={(e) => setNewCategory(f => ({ ...f, icon_name: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <input placeholder="Image URL" value={newCategory.image_url} onChange={(e) => setNewCategory(f => ({ ...f, image_url: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <button type="submit" disabled={actingId === 'create-category'} className="btn-premium bg-primary text-white px-4 py-2 text-xs w-full disabled:opacity-50">
                                                {actingId === 'create-category' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Category
                                            </button>
                                        </form>

                                        <form onSubmit={handleCreateSubcategory} className="p-4 rounded-3xl bg-slate-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 space-y-2">
                                            <h3 className="text-xs font-black text-gray-900 dark:text-slate-100">New Subcategory</h3>
                                            <select required value={newSubcategory.category_id} onChange={(e) => setNewSubcategory(f => ({ ...f, category_id: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                                                <option value="">Parent category...</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                                            </select>
                                            <input required placeholder="Name (EN)" value={newSubcategory.name_en} onChange={(e) => setNewSubcategory(f => ({ ...f, name_en: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <input placeholder="Name (SO)" value={newSubcategory.name_so} onChange={(e) => setNewSubcategory(f => ({ ...f, name_so: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <input required placeholder="Slug" value={newSubcategory.slug} onChange={(e) => setNewSubcategory(f => ({ ...f, slug: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <button type="submit" disabled={actingId === 'create-subcategory'} className="btn-premium bg-primary text-white px-4 py-2 text-xs w-full disabled:opacity-50">
                                                {actingId === 'create-subcategory' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Subcategory
                                            </button>
                                        </form>

                                        <form onSubmit={handleCreateSubsubcategory} className="p-4 rounded-3xl bg-slate-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 space-y-2">
                                            <h3 className="text-xs font-black text-gray-900 dark:text-slate-100">New Sub-subcategory</h3>
                                            <select required value={newSubsubcategory.subcategory_id} onChange={(e) => setNewSubsubcategory(f => ({ ...f, subcategory_id: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                                                <option value="">Parent subcategory...</option>
                                                {categories.flatMap(c => c.subcategories || []).map(s => <option key={s.id} value={s.id}>{s.name_en}</option>)}
                                            </select>
                                            <input required placeholder="Name (EN)" value={newSubsubcategory.name_en} onChange={(e) => setNewSubsubcategory(f => ({ ...f, name_en: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <input placeholder="Name (SO)" value={newSubsubcategory.name_so} onChange={(e) => setNewSubsubcategory(f => ({ ...f, name_so: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <input required placeholder="Slug" value={newSubsubcategory.slug} onChange={(e) => setNewSubsubcategory(f => ({ ...f, slug: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <button type="submit" disabled={actingId === 'create-subsubcategory'} className="btn-premium bg-primary text-white px-4 py-2 text-xs w-full disabled:opacity-50">
                                                {actingId === 'create-subsubcategory' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Sub-subcategory
                                            </button>
                                        </form>
                                    </div>

                                    {categories.length === 0 ? (
                                        <EmptyState icon={Tags} text="No categories found" />
                                    ) : (
                                        <div className="space-y-2">
                                            {categories.map(cat => (
                                                <CategoryNode
                                                    key={cat.id}
                                                    category={cat}
                                                    expanded={!!expandedCategories[cat.id]}
                                                    onToggle={() => setExpandedCategories(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                                                    actingId={actingId}
                                                    onUpdate={handleUpdateCategory}
                                                    onDelete={handleDeleteCategory}
                                                    onUpdateSub={handleUpdateSubcategory}
                                                    onDeleteSub={handleDeleteSubcategory}
                                                    onDeleteSubsub={handleDeleteSubsubcategory}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'codes' && (
                                <div className="space-y-6 animate-scale-in">
                                    <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Marketing Codes</h2>

                                    <form onSubmit={handleCreateMarketingCode} className="p-5 rounded-3xl bg-slate-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-end flex-wrap">
                                        <div className="space-y-1.5 flex-1 w-full md:w-auto">
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Code</label>
                                            <input required value={newMarketingCode.code} onChange={(e) => setNewMarketingCode(f => ({ ...f, code: e.target.value }))} placeholder="LAUNCH50" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                        </div>
                                        <div className="space-y-1.5 flex-1 w-full md:w-auto">
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Description</label>
                                            <input required value={newMarketingCode.description} onChange={(e) => setNewMarketingCode(f => ({ ...f, description: e.target.value }))} placeholder="Launch promo for new sellers" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                        </div>
                                        <div className="space-y-1.5 w-full md:w-32">
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Max uses</label>
                                            <input type="number" value={newMarketingCode.max_uses} onChange={(e) => setNewMarketingCode(f => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                        </div>
                                        <div className="space-y-1.5 w-full md:w-44">
                                            <label className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Expires</label>
                                            <input type="date" value={newMarketingCode.expires_at} onChange={(e) => setNewMarketingCode(f => ({ ...f, expires_at: e.target.value }))} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                        </div>
                                        <button type="submit" disabled={actingId === 'create-marketing-code'} className="btn-premium bg-primary text-white px-5 py-3 text-xs w-full md:w-auto shrink-0 shadow-md shadow-primary/20 hover:bg-primary-dark disabled:opacity-50">
                                            {actingId === 'create-marketing-code' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                            <span>Create</span>
                                        </button>
                                    </form>

                                    {marketingCodes.length === 0 ? (
                                        <EmptyState icon={BadgePercent} text="No marketing codes created yet" />
                                    ) : (
                                        <div className="space-y-2">
                                            {marketingCodes.map(mc => (
                                                <div key={mc.id} className="p-4 bg-white border border-gray-100 rounded-2xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-xs font-black text-gray-900 dark:text-slate-100">{mc.code}</h4>
                                                            {!mc.is_active && <span className="text-[8px] font-black uppercase bg-slate-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded-full">Inactive</span>}
                                                            {mc.is_expired && <span className="text-[8px] font-black uppercase bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full">Expired</span>}
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold truncate">
                                                            {mc.description} · {mc.uses_count}{mc.max_uses ? `/${mc.max_uses}` : ''} uses · {mc.ads_posted_count} ads · {Math.round(mc.conversion_rate)}% conversion
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <button disabled={actingId === mc.id} onClick={() => handleToggleMarketingCode(mc)} className="btn-premium bg-slate-100 text-gray-700 px-3 py-2 text-[10px] dark:bg-slate-800 dark:text-slate-200 disabled:opacity-50">
                                                            {mc.is_active ? 'Pause' : 'Activate'}
                                                        </button>
                                                        <button disabled={actingId === mc.id || !mc.is_active} onClick={() => handleDeactivateMarketingCode(mc.id)} className="btn-premium bg-slate-100 text-gray-700 px-3 py-2 text-[10px] hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-50">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'audit' && (
                                <div className="space-y-4 animate-scale-in">
                                    <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">Audit Log</h2>
                                    <div className="flex gap-2 flex-wrap items-end">
                                        <input value={auditAction} onChange={(e) => setAuditAction(e.target.value)} placeholder="Filter by action..." className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 w-48" />
                                        <input value={auditResourceType} onChange={(e) => setAuditResourceType(e.target.value)} placeholder="Filter by resource type..." className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 w-56" />
                                        <button onClick={handleApplyAuditFilter} className="btn-premium bg-slate-100 text-gray-700 px-3 py-2 text-[10px] dark:bg-slate-800 dark:text-slate-200">Apply</button>
                                    </div>

                                    {auditLogs.length === 0 ? (
                                        <EmptyState icon={ScrollText} text="No audit log entries found" />
                                    ) : (
                                        <div className="space-y-1.5">
                                            {auditLogs.map(log => (
                                                <div key={log.id} className="p-3.5 bg-white border border-gray-100 rounded-xl dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-gray-900 dark:text-slate-100">
                                                            <span className="text-primary">{log.action}</span> on {log.resource_type}{log.resource_id ? ` #${log.resource_id}` : ''}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold truncate">
                                                            {log.user_name || log.user_email || `User #${log.user_id ?? 'system'}`} {log.details ? `· ${log.details}` : ''}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'crm' && (
                                <div className="space-y-5 animate-scale-in">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">CRM &amp; Email Campaigns</h2>
                                        <SubTabs
                                            value={crmSubTab}
                                            onChange={(v) => setCrmSubTab(v as typeof crmSubTab)}
                                            options={[
                                                { id: 'analytics', name: 'Analytics', icon: TrendingUp },
                                                { id: 'send', name: 'Send Email', icon: Mail },
                                                { id: 'broadcast', name: 'Broadcast', icon: Radar },
                                            ]}
                                        />
                                    </div>

                                    {emailResultMessage && (
                                        <div className="p-3 rounded-xl bg-accent/10 text-accent text-xs font-bold">{emailResultMessage}</div>
                                    )}

                                    {crmSubTab === 'analytics' && (
                                        emailAnalytics ? (
                                            <div className="space-y-5">
                                                <div>
                                                    <h3 className="text-xs font-black text-gray-900 dark:text-slate-100 mb-2">Campaign Performance</h3>
                                                    <div className="space-y-2">
                                                        {Object.entries(emailAnalytics.campaigns).map(([name, stats]) => (
                                                            <div key={name} className="p-4 bg-white border border-gray-100 rounded-2xl card-shadow dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between gap-4">
                                                                <div className="min-w-0">
                                                                    <h4 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate">{name}</h4>
                                                                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">{stats.total} total · {stats.sent} sent · {stats.failed} failed</p>
                                                                </div>
                                                                <div className="flex gap-3 shrink-0 text-[10px] font-black">
                                                                    <span className="text-blue-500">Open {stats.open_rate}</span>
                                                                    <span className="text-accent">Click {stats.click_rate}</span>
                                                                    <span className="text-amber-500">CTR {stats.ctr}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {Object.keys(emailAnalytics.campaigns).length === 0 && <EmptyState icon={Mail} text="No campaigns sent yet" />}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="text-xs font-black text-gray-900 dark:text-slate-100 mb-2">Onboarding Funnel</h3>
                                                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                                        <StatCard label="Welcome Sent" value={emailAnalytics.onboarding_funnel.welcome_sent} color="blue" />
                                                        <StatCard label="Welcome Opened" value={emailAnalytics.onboarding_funnel.welcome_opened} color="green" />
                                                        <StatCard label="Profile Completed" value={emailAnalytics.onboarding_funnel.profile_sent} color="amber" />
                                                        <StatCard label="First Action" value={emailAnalytics.onboarding_funnel.first_action_sent} color="amber" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="text-xs font-black text-gray-900 dark:text-slate-100 mb-2">Regional Engagement ({emailAnalytics.regional_engagement.total_tracked_hits} tracked hits)</h3>
                                                    {emailAnalytics.regional_engagement.top_regions.length === 0 ? <p className="text-[11px] text-gray-400">No regional data yet</p> : (
                                                        <div className="space-y-1.5">
                                                            {emailAnalytics.regional_engagement.top_regions.map(r => (
                                                                <div key={r.region_cluster} className="p-3 bg-white border border-gray-100 rounded-xl dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-gray-700 dark:text-slate-300">
                                                                    <span>{r.region_cluster}.x.x</span>
                                                                    <span className="text-gray-400">{r.hits} hits</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-12 text-center text-sm font-semibold text-gray-400"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading...</div>
                                        )
                                    )}

                                    {crmSubTab === 'send' && (
                                        <form onSubmit={handleSendManualEmail} className="p-5 rounded-3xl bg-slate-50 border border-gray-200 dark:bg-slate-950 dark:border-slate-800 space-y-3 max-w-2xl">
                                            <h3 className="text-xs font-black text-gray-900 dark:text-slate-100">Send a tracked email to one customer</h3>
                                            <input required type="email" placeholder="Recipient email" value={manualEmailForm.email} onChange={(e) => setManualEmailForm(f => ({ ...f, email: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <input required placeholder="Subject line" value={manualEmailForm.subject} onChange={(e) => setManualEmailForm(f => ({ ...f, subject: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <input required placeholder="Email title (heading)" value={manualEmailForm.title} onChange={(e) => setManualEmailForm(f => ({ ...f, title: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <input placeholder="Subtitle (optional)" value={manualEmailForm.subtitle} onChange={(e) => setManualEmailForm(f => ({ ...f, subtitle: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <textarea required placeholder="HTML content" value={manualEmailForm.content_html} onChange={(e) => setManualEmailForm(f => ({ ...f, content_html: e.target.value }))} rows={5} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <GifUploadButton onInsert={(markup) => setManualEmailForm(f => ({ ...f, content_html: f.content_html ? `${f.content_html}\n${markup}` : markup }))} />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input placeholder="Button text (optional)" value={manualEmailForm.action_text} onChange={(e) => setManualEmailForm(f => ({ ...f, action_text: e.target.value }))} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                                <input placeholder="Button URL (optional)" value={manualEmailForm.action_url} onChange={(e) => setManualEmailForm(f => ({ ...f, action_url: e.target.value }))} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            </div>
                                            <button type="submit" disabled={actingId === 'send-manual-email'} className="btn-premium bg-primary text-white px-4 py-2.5 text-xs w-full shadow-md shadow-primary/20 hover:bg-primary-dark disabled:opacity-50">
                                                {actingId === 'send-manual-email' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                <span>Send Email</span>
                                            </button>
                                        </form>
                                    )}

                                    {crmSubTab === 'broadcast' && (
                                        <form onSubmit={handleSendBroadcast} className="p-5 rounded-3xl bg-red-50 border border-red-200 dark:bg-red-950/10 dark:border-red-900/40 space-y-3 max-w-2xl">
                                            <h3 className="text-xs font-black text-red-600 dark:text-red-400 flex items-center gap-1.5"><Radar className="h-3.5 w-3.5" /> Broadcast to ALL active users — use with care</h3>
                                            <p className="text-[10px] text-gray-500 dark:text-slate-400">Supports placeholders: {'{{name}} {{email}} {{phone}} {{location}} {{date}}'}</p>
                                            <input required placeholder="Subject line" value={broadcastForm.subject} onChange={(e) => setBroadcastForm(f => ({ ...f, subject: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <input required placeholder="Email title (heading)" value={broadcastForm.title} onChange={(e) => setBroadcastForm(f => ({ ...f, title: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <input placeholder="Subtitle (optional)" value={broadcastForm.subtitle} onChange={(e) => setBroadcastForm(f => ({ ...f, subtitle: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <textarea required placeholder="HTML content" value={broadcastForm.content_html} onChange={(e) => setBroadcastForm(f => ({ ...f, content_html: e.target.value }))} rows={5} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            <GifUploadButton onInsert={(markup) => setBroadcastForm(f => ({ ...f, content_html: f.content_html ? `${f.content_html}\n${markup}` : markup }))} />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input placeholder="Button text (optional)" value={broadcastForm.action_text} onChange={(e) => setBroadcastForm(f => ({ ...f, action_text: e.target.value }))} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                                <input placeholder="Button URL (optional)" value={broadcastForm.action_url} onChange={(e) => setBroadcastForm(f => ({ ...f, action_url: e.target.value }))} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                            </div>
                                            <button type="submit" disabled={actingId === 'send-broadcast'} className="btn-premium bg-red-500 text-white px-4 py-2.5 text-xs w-full shadow-md shadow-red-500/20 hover:bg-red-600 disabled:opacity-50">
                                                {actingId === 'send-broadcast' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
                                                <span>Broadcast to All Active Users</span>
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}

                            {activeTab === 'otp' && (
                                <div className="space-y-5 animate-scale-in">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <h2 className="text-base font-black text-gray-900 dark:text-slate-100 font-poppins">OTP &amp; Verification Tools</h2>
                                        <SubTabs
                                            value={otpSubTab}
                                            onChange={(v) => setOtpSubTab(v as typeof otpSubTab)}
                                            options={[
                                                { id: 'lookup', name: 'OTP Lookup', icon: KeyRound },
                                                { id: 'logs', name: 'OTP Logs', icon: ScrollText },
                                                { id: 'verification', name: 'Verification History', icon: ShieldCheck },
                                            ]}
                                        />
                                    </div>

                                    {otpSubTab === 'lookup' && (
                                        <div className="space-y-4 max-w-lg">
                                            <form onSubmit={handleLookupOtp} className="flex gap-2 items-end flex-wrap">
                                                <select value={otpLookupInput.channel} onChange={(e) => setOtpLookupInput(f => ({ ...f, channel: e.target.value as 'email' | 'phone' }))} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                                                    <option value="email">Email</option>
                                                    <option value="phone">Phone</option>
                                                </select>
                                                <input required value={otpLookupInput.value} onChange={(e) => setOtpLookupInput(f => ({ ...f, value: e.target.value }))} placeholder={otpLookupInput.channel === 'email' ? 'user@example.com' : '+2547XXXXXXXX'} className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                                <button type="submit" disabled={actingId === 'lookup-otp'} className="btn-premium bg-primary text-white px-4 py-2.5 text-xs shadow-md shadow-primary/20 hover:bg-primary-dark disabled:opacity-50">
                                                    {actingId === 'lookup-otp' ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Lookup
                                                </button>
                                            </form>

                                            {otpLookupResult && (
                                                <div className={`p-4 rounded-2xl border ${otpLookupResult.found ? 'bg-accent/10 border-accent/30' : 'bg-slate-50 border-gray-200 dark:bg-slate-950 dark:border-slate-800'}`}>
                                                    {otpLookupResult.found ? (
                                                        <>
                                                            <p className="text-2xl font-black tracking-widest text-accent">{otpLookupResult.code}</p>
                                                            <p className="text-[11px] text-gray-500 dark:text-slate-400 font-semibold mt-1">Expires in {otpLookupResult.expires_in_seconds}s · {otpLookupResult.channel}</p>
                                                        </>
                                                    ) : (
                                                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">{otpLookupResult.message}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {otpSubTab === 'logs' && (
                                        <div className="space-y-3">
                                            <form onSubmit={handleFilterOtpLogs} className="flex gap-2 flex-wrap items-end">
                                                <input value={otpLogFilter.identifier} onChange={(e) => setOtpLogFilter(f => ({ ...f, identifier: e.target.value }))} placeholder="Identifier (email/phone)" className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 w-52" />
                                                <select value={otpLogFilter.event_type} onChange={(e) => setOtpLogFilter(f => ({ ...f, event_type: e.target.value }))} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                                                    <option value="">Any event</option>
                                                    <option value="sent">Sent</option>
                                                    <option value="resent">Resent</option>
                                                    <option value="verified">Verified</option>
                                                    <option value="failed">Failed</option>
                                                    <option value="expired">Expired</option>
                                                    <option value="attempt_failed">Attempt failed</option>
                                                </select>
                                                <select value={otpLogFilter.channel} onChange={(e) => setOtpLogFilter(f => ({ ...f, channel: e.target.value }))} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                                                    <option value="">Any channel</option>
                                                    <option value="sms">SMS</option>
                                                    <option value="email">Email</option>
                                                </select>
                                                <button type="submit" className="btn-premium bg-slate-100 text-gray-700 px-3 py-2 text-[10px] dark:bg-slate-800 dark:text-slate-200">Apply</button>
                                            </form>

                                            {otpLogs.length === 0 ? <EmptyState icon={ScrollText} text="No OTP log entries found" /> : (
                                                <div className="space-y-1.5">
                                                    {otpLogs.map(log => (
                                                        <div key={log.id} className="p-3.5 bg-white border border-gray-100 rounded-xl dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between gap-4">
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">{log.identifier}</p>
                                                                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold capitalize">{log.channel} · {log.event_type} · {log.status} · {log.attempt_count} attempts</p>
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold shrink-0">{new Date(log.created_at).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {otpSubTab === 'verification' && (
                                        <div className="space-y-4 max-w-2xl">
                                            <form onSubmit={handleLookupVerification} className="flex gap-2 items-end">
                                                <input required value={verificationIdentifier} onChange={(e) => setVerificationIdentifier(e.target.value)} placeholder="Email or phone" className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                                                <button type="submit" disabled={actingId === 'lookup-verification'} className="btn-premium bg-primary text-white px-4 py-2.5 text-xs shadow-md shadow-primary/20 hover:bg-primary-dark disabled:opacity-50">
                                                    {actingId === 'lookup-verification' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserSearch className="h-4 w-4" />} Lookup
                                                </button>
                                            </form>

                                            {verificationResult && (
                                                verificationResult.user ? (
                                                    <div className="space-y-3">
                                                        <div className="p-4 bg-white border border-gray-100 rounded-2xl card-shadow dark:bg-slate-900 dark:border-slate-800">
                                                            <h4 className="text-xs font-black text-gray-900 dark:text-slate-100">{verificationResult.user.full_name}</h4>
                                                            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">{verificationResult.user.email} {verificationResult.user.phone ? `· ${verificationResult.user.phone}` : ''} {verificationResult.user.is_verified ? '· verified' : '· not verified'}</p>
                                                        </div>
                                                        {verificationResult.attempts.length === 0 ? <EmptyState icon={ShieldCheck} text="No verification attempts found" /> : (
                                                            <div className="space-y-1.5">
                                                                {verificationResult.attempts.map(a => (
                                                                    <div key={a.id} className="p-3 bg-white border border-gray-100 rounded-xl dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-gray-700 dark:text-slate-300">
                                                                        <span className="capitalize">{a.document_type} · {a.status}{a.auto_verification_status ? ` (${a.auto_verification_status})` : ''}</span>
                                                                        <span className="text-gray-400 text-[10px]">{new Date(a.created_at).toLocaleDateString()}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <EmptyState icon={UserSearch} text="No user found with that email or phone" />
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function GifUploadButton({ onInsert }: { onInsert: (markup: string) => void }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.gif')) {
            setError('Please choose a .gif file');
            return;
        }
        setError('');
        setUploading(true);
        try {
            const { url } = await listingsService.uploadImage(file);
            onInsert(`<img src="${url}" alt="" style="max-width:100%" />`);
        } catch (err) {
            console.error('Failed to upload GIF', err);
            setError('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <input ref={inputRef} type="file" accept=".gif,image/gif" className="hidden" onChange={handleFile} />
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="btn-premium bg-slate-100 text-gray-700 px-3 py-1.5 text-[10px] dark:bg-slate-800 dark:text-slate-200 disabled:opacity-50"
            >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                Insert GIF
            </button>
            {error && <span className="text-[10px] font-bold text-red-500">{error}</span>}
        </div>
    );
}

function ContentRow({ item, saving, onSave }: { item: SiteContent; saving: boolean; onSave: (key: string, value_en: string, value_so: string) => void }) {
    const [valueEn, setValueEn] = useState(item.value_en);
    const [valueSo, setValueSo] = useState(item.value_so || '');
    const dirty = valueEn !== item.value_en || valueSo !== (item.value_so || '');

    return (
        <div className="p-4 bg-white border border-gray-100 rounded-2xl card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">{item.key} · {item.page_group}</span>
                <button
                    disabled={!dirty || saving}
                    onClick={() => onSave(item.key, valueEn, valueSo)}
                    className="btn-premium bg-primary text-white px-3 py-1.5 text-[10px] shrink-0 disabled:opacity-40"
                >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input value={valueEn} onChange={(e) => setValueEn(e.target.value)} placeholder="English" className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
                <input value={valueSo} onChange={(e) => setValueSo(e.target.value)} placeholder="Somali" className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
            </div>
        </div>
    );
}

function CategoryNode({ category, expanded, onToggle, actingId, onUpdate, onDelete, onUpdateSub, onDeleteSub, onDeleteSubsub }: {
    category: Category;
    expanded: boolean;
    onToggle: () => void;
    actingId: string | number | null;
    onUpdate: (id: number, payload: Partial<{ name_en: string; name_so: string; slug: string; icon_name: string; image_url: string }>) => void;
    onDelete: (id: number) => void;
    onUpdateSub: (id: number, payload: Partial<{ name_en: string; name_so: string; slug: string; image_url: string }>) => void;
    onDeleteSub: (id: number) => void;
    onDeleteSubsub: (id: number) => void;
}) {
    const [nameEn, setNameEn] = useState(category.name_en);
    const [nameSo, setNameSo] = useState(category.name_so || '');
    const [slug, setSlug] = useState(category.slug);
    const [iconName, setIconName] = useState(category.icon_name);
    const saving = actingId === `category-${category.id}`;
    const dirty = nameEn !== category.name_en || nameSo !== (category.name_so || '') || slug !== category.slug || iconName !== category.icon_name;

    return (
        <div className="bg-white border border-gray-100 rounded-2xl card-shadow dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
            <div className="p-4 flex items-center gap-3">
                <button onClick={onToggle} className="shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200">
                    {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
                <input value={nameSo} onChange={(e) => setNameSo(e.target.value)} placeholder="Somali" className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
                <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-28 shrink-0 rounded-lg border border-gray-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
                <input value={iconName} onChange={(e) => setIconName(e.target.value)} className="w-24 shrink-0 rounded-lg border border-gray-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100" />
                <button disabled={!dirty || saving} onClick={() => onUpdate(category.id, { name_en: nameEn, name_so: nameSo, slug, icon_name: iconName })} className="btn-premium bg-primary text-white px-2.5 py-1.5 text-[10px] shrink-0 disabled:opacity-40">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                </button>
                <button disabled={saving} onClick={() => onDelete(category.id)} className="p-2 rounded-full bg-slate-100 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-300 shrink-0 disabled:opacity-50">
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>

            {expanded && (
                <div className="px-4 pb-4 pl-10 space-y-2 border-t border-gray-100 dark:border-slate-800 pt-3">
                    {(category.subcategories || []).length === 0 ? (
                        <p className="text-[11px] text-gray-400">No subcategories</p>
                    ) : (
                        (category.subcategories || []).map(sub => (
                            <SubcategoryNode key={sub.id} sub={sub} actingId={actingId} onUpdate={onUpdateSub} onDelete={onDeleteSub} onDeleteSubsub={onDeleteSubsub} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

function SubcategoryNode({ sub, actingId, onUpdate, onDelete, onDeleteSubsub }: {
    sub: SubCategory;
    actingId: string | number | null;
    onUpdate: (id: number, payload: Partial<{ name_en: string; name_so: string; slug: string; image_url: string }>) => void;
    onDelete: (id: number) => void;
    onDeleteSubsub: (id: number) => void;
}) {
    const [nameEn, setNameEn] = useState(sub.name_en);
    const [nameSo, setNameSo] = useState(sub.name_so || '');
    const [slug, setSlug] = useState(sub.slug);
    const saving = actingId === `subcategory-${sub.id}`;
    const dirty = nameEn !== sub.name_en || nameSo !== (sub.name_so || '') || slug !== sub.slug;

    return (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 space-y-2">
            <div className="flex items-center gap-2">
                <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                <input value={nameSo} onChange={(e) => setNameSo(e.target.value)} placeholder="Somali" className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-28 shrink-0 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100" />
                <button disabled={!dirty || saving} onClick={() => onUpdate(sub.id, { name_en: nameEn, name_so: nameSo, slug })} className="btn-premium bg-primary text-white px-2.5 py-1.5 text-[10px] shrink-0 disabled:opacity-40">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                </button>
                <button disabled={saving} onClick={() => onDelete(sub.id)} className="p-1.5 rounded-full bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 dark:bg-slate-900 dark:text-slate-300 shrink-0 disabled:opacity-50">
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
            {(sub.subsubcategories || []).length > 0 && (
                <div className="pl-6 space-y-1">
                    {(sub.subsubcategories || []).map(ss => (
                        <div key={ss.id} className="flex items-center justify-between gap-2 text-[11px] font-semibold text-gray-600 dark:text-slate-300">
                            <span>{ss.name_en} <span className="text-gray-400">/{ss.slug}</span></span>
                            <button disabled={actingId === `subsubcategory-${ss.id}`} onClick={() => onDeleteSubsub(ss.id)} className="text-gray-400 hover:text-red-500 disabled:opacity-50">
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function SubTabs({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { id: string; name: string; icon: React.ElementType }[] }) {
    return (
        <div className="flex gap-1.5 flex-wrap">
            {options.map(opt => {
                const Icon = opt.icon;
                const isCurrent = value === opt.id;
                return (
                    <button
                        key={opt.id}
                        onClick={() => onChange(opt.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all cursor-pointer ${isCurrent ? 'bg-primary text-white' : 'bg-slate-100 text-gray-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}
                    >
                        <Icon className="h-3 w-3" /> {opt.name}
                    </button>
                );
            })}
        </div>
    );
}

function StatCard({ label, value, color, suffix }: { label: string; value: number; color: 'amber' | 'green' | 'blue'; suffix?: string }) {
    const colorMap: Record<string, string> = {
        amber: 'text-amber-500 bg-amber-500/10',
        green: 'text-accent bg-accent/10',
        blue: 'text-primary bg-primary/10',
    };
    return (
        <div className="p-5 rounded-3xl bg-white border border-gray-100 card-shadow dark:bg-slate-900 dark:border-slate-800 space-y-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{label}</span>
            <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">{value.toLocaleString()}{suffix || ''}</h3>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${colorMap[color]}`}>
                {color === 'amber' ? 'Needs review' : color === 'green' ? 'Live now' : 'All time'}
            </span>
        </div>
    );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
    return (
        <div className="py-12 flex flex-col items-center gap-3 text-gray-400">
            <Icon className="h-8 w-8" />
            <p className="text-xs font-bold">{text}</p>
        </div>
    );
}
