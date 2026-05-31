import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { listingService } from '../../services/listingService';
import type { Listing } from '../../types/listing';
import {
    LayoutDashboard,
    Store,
    Package,
    ShoppingCart,
    Users,
    CheckSquare,
    MessageSquare,
    BarChart3,
    Bot,
    Plus,
    Send,
    Globe,
    MapPin,
    ArrowRight,
    ShieldAlert,
    Sparkles,
    UserPlus,
    DollarSign,
    Clock,
    RefreshCw,
    X,
    Filter,
    ShieldCheck,
    Copy,
    AlertCircle,
    ExternalLink,
    Image as ImageIcon,
    Tag
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';
import type { Business, Employee, BusinessProduct, BusinessCustomer, Order, BusinessMessage, TeamMessage, BusinessTask } from '../../services/businessService';
import { businessService } from '../../services/businessService';
import { API_BASE_URL } from '../../services/api';

type TabType = 'overview' | 'storefront' | 'inventory' | 'orders' | 'crm' | 'team' | 'tasks' | 'messages' | 'analytics' | 'ai';

export function BusinessDashboard() {
    const navigate = useNavigate();
    const { token, user } = useAuthStore();
    
    // Core state
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
    const [myMembership, setMyMembership] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Additional UI state for Storefront editing and CRM Kanban
    const [storefrontData, setStorefrontData] = useState<Partial<Business>>({});
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [registerData, setRegisterData] = useState({
        name: '',
        slug: '',
        category: 'shop',
        description: '',
        address: '',
        phone: '',
        email: '',
    });

    // Sub-data states
    const [products, setProducts] = useState<BusinessProduct[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [customers, setCustomers] = useState<BusinessCustomer[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [tasks, setTasks] = useState<BusinessTask[]>([]);
    const [customerChats, setCustomerChats] = useState<Record<number, BusinessMessage[]>>({});
    const [activeCustomerId, setActiveCustomerId] = useState<number | null>(null);
    const [_teamMessages, setTeamMessages] = useState<TeamMessage[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);

    // My listings/ads linked to this shop
    const [myListings, setMyListings] = useState<Listing[]>([]);
    const [loadingListings, setLoadingListings] = useState(false);

    // WebSocket state
    const [wsConnected, setWsConnected] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);

    // Form inputs state
    const [chatInput, setChatInput] = useState('');
    const [newProduct, setNewProduct] = useState({
        name_en: '',
        name_so: '',
        price: '',
        description_en: '',
        sku: '',
        stock_level: '10',
        low_stock_threshold: '3',
    });
    const [newOrder, setNewOrder] = useState({
        customer_id: '',
        product_id: '',
        qty: '1',
        payment_method: 'cash',
        notes: '',
    });
    const [newInvite, setNewInvite] = useState({
        email: '',
        phone: '',
        role: 'sales_agent',
    });
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        status: 'todo' as any,
    });

    // AI Helper loading indicators
    const [aiGeneratingDesc, setAiGeneratingDesc] = useState(false);
    const [aiSuggestingPrice, setAiSuggestingPrice] = useState(false);
    const [aiSuggestingReply, setAiSuggestingReply] = useState(false);
    const [aiSummarizingChat, setAiSummarizingChat] = useState(false);
    const [aiSummaryText, setAiSummaryText] = useState('');
    const [aiSuggestedReplyList, setAiSuggestedReplyList] = useState<string[]>([]);

    // Storefront link copy & settings saving states
    const [copiedLink, setCopiedLink] = useState(false);
    const [savingStorefront, setSavingStorefront] = useState(false);

    const handleCopyStorefrontLink = async () => {
        if (!activeBusiness) return;
        const shareUrl = `${window.location.origin}/shop/${activeBusiness.slug}`;
        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setCopiedLink(true);
                toast.success('Storefront link copied!');
                setTimeout(() => setCopiedLink(false), 2000);
            } catch (err) {
                console.error('Failed to copy', err);
            }
        }
    };

    const handleSaveStorefront = async () => {
        if (!activeBusiness) return;
        setSavingStorefront(true);
        try {
            const updated = await businessService.updateBusiness(activeBusiness.id, {
                name: storefrontData.name,
                show_in_nearby: storefrontData.show_in_nearby
            });
            setActiveBusiness(updated);
            setBusinesses(prev => prev.map(b => b.id === updated.id ? updated : b));
            toast.success('Storefront settings updated successfully!');
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to update storefront settings');
        } finally {
            setSavingStorefront(false);
        }
    };

    // Keep storefrontData in sync with activeBusiness shifts
    useEffect(() => {
        if (activeBusiness) {
            setStorefrontData({
                name: activeBusiness.name,
                show_in_nearby: activeBusiness.show_in_nearby
            });
        }
    }, [activeBusiness]);

    // Fetch initial list of user's businesses
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        loadBusinesses();
    }, [token]);

    // Re-fetch all workspace sub-data when active business shifts
    useEffect(() => {
        if (!activeBusiness) return;
        loadWorkspaceData();
        loadMyListings();
        setupWebSocket();
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [activeBusiness]);

    // Load user's own listings/ads to link to this shop
    const loadMyListings = async () => {
        try {
            setLoadingListings(true);
            const listings = await listingService.getMyListings();
            setMyListings(listings);
        } catch (e) {
            console.error('Failed to load listings', e);
        } finally {
            setLoadingListings(false);
        }
    };

    const loadBusinesses = async () => {
        try {
            setLoading(true);
            const list = await businessService.getMyBusinesses();
            setBusinesses(list);
            if (list.length > 0) {
                setActiveBusiness(list[0]);
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to load workspaces');
        } finally {
            setLoading(false);
        }
    };

    const loadWorkspaceData = async () => {
        if (!activeBusiness) return;
        const bId = activeBusiness.id;
        try {
            // Load DB lists
            const [prods, ords, custs, emps, tsks, tms, an] = await Promise.all([
                businessService.getProducts(bId),
                businessService.getOrders(bId),
                businessService.getCustomers(bId),
                businessService.getEmployees(bId),
                businessService.getTasks(bId),
                businessService.getTeamChatHistory(bId),
                businessService.getAnalytics(bId).catch(() => null)
            ]);
            
            setProducts(prods);
            setOrders(ords);
            setCustomers(custs);
            setEmployees(emps);
            setTasks(tsks);
            setTeamMessages(tms);
            setAnalytics(an);

            // Determine active user's role membership
            const userEmp = emps.find(e => e.user_id === user?.id);
            if (userEmp) {
                setMyMembership(userEmp);
            } else if (activeBusiness.owner_id === user?.id) {
                setMyMembership({
                    id: 0,
                    business_id: bId,
                    user_id: user.id,
                    role: 'owner',
                    is_active: true,
                    performance_sales: 0,
                    performance_responses: 0,
                    performance_orders_handled: 0
                });
            }

            if (custs.length > 0 && activeCustomerId === null) {
                setActiveCustomerId(custs[0].user_id);
            }
        } catch (e) {
            console.error(e);
            toast.error('Partial database workspace sync failed');
        }
    };

    // WebSocket multiplexer receiver
    const setupWebSocket = () => {
        if (!activeBusiness || !token) return;
        
        // WS path construction
        const wsUrlStr = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');
        const socket = new WebSocket(`${wsUrlStr}/businesses/${activeBusiness.id}/chat/ws?token=${token}`);
        socketRef.current = socket;

        socket.onopen = () => {
            setWsConnected(true);
            logger('WebSocket connection live with Event Broker');
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const { type, payload } = data;
                
                // Real-time Kafka-emitted Events handler
                if (type === "customer_message" || type === "MESSAGE_RECEIVED") {
                    const msg = payload as BusinessMessage;
                    setCustomerChats(prev => {
                        const custId = msg.customer_id;
                        const exist = prev[custId] || [];
                        return { ...prev, [custId]: [...exist, msg] };
                    });
                    if (msg.is_from_customer) {
                        toast(`New message from customer!`, { icon: '💬' });
                    }
                } else if (type === "team_message" || type === "TEAM_ANNOUNCEMENT") {
                    const msg = payload as TeamMessage;
                    setTeamMessages(prev => [...prev, msg]);
                    if (msg.is_announcement) {
                        toast(`Team Announcement: ${msg.content}`, { icon: '📢' });
                    }
                } else if (type === "STOCK_LOW") {
                    toast.error(`ALERT: Stock is low on item ${payload.product_name}!`);
                    // Refresh products in-place
                    businessService.getProducts(activeBusiness.id).then(setProducts);
                } else if (type === "ORDER_PLACED") {
                    toast.success(`NEW ORDER RECEIVED: $${payload.total_amount}!`);
                    // Reload orders and analytics
                    businessService.getOrders(activeBusiness.id).then(setOrders);
                    businessService.getAnalytics(activeBusiness.id).then(setAnalytics).catch(() => null);
                } else if (type === "error") {
                    toast.error(data.error || 'Socket logic failure');
                }
            } catch (err) {
                console.error('Socket parse err', err);
            }
        };

        socket.onclose = () => {
            setWsConnected(false);
            logger('WebSocket connection closed');
        };

        socket.onerror = (e) => {
            console.error('Socket error', e);
        };
    };

    const logger = (msg: string) => {
        console.log(`[SUQAFURAN SAAS] ${msg}`);
    };

    // Load selected customer chats on-demand
    useEffect(() => {
        if (!activeBusiness || activeCustomerId === null) return;
        if (customerChats[activeCustomerId]) return; // already loaded

        businessService.getCustomerChatHistory(activeBusiness.id, activeCustomerId)
            .then(history => {
                setCustomerChats(prev => ({ ...prev, [activeCustomerId]: history }));
            })
            .catch(() => {});
    }, [activeCustomerId, activeBusiness]);

    // Business workspace onboarding POST
    const handleRegisterBusiness = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const created = await businessService.registerBusiness(registerData);
            toast.success('Workspace configured successfully!');
            setIsRegisterModalOpen(false);
            setBusinesses(prev => [...prev, created]);
            setActiveBusiness(created);
            setActiveTab('overview');
            setRegisterData({
                name: '',
                slug: '',
                category: 'shop',
                description: '',
                address: '',
                phone: '',
                email: '',
            });
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to initialize workspace');
        }
    };

    // Generate description via Groq AI
    const handleAIGenerateDescription = async () => {
        if (!activeBusiness || !newProduct.name_en) {
            toast.error('Provide at least a Product Name to generate description');
            return;
        }
        try {
            setAiGeneratingDesc(true);
            const text = await businessService.aiGenerateDescription(
                activeBusiness.id,
                `Write a high-end marketing description for product: ${newProduct.name_en}. Key properties: ${newProduct.description_en}`
            );
            setNewProduct(prev => ({ ...prev, description_en: text }));
            toast.success('AI description populated!');
        } catch (e) {
            toast.error('AI text generator offline');
        } finally {
            setAiGeneratingDesc(false);
        }
    };

    // Suggest price via Groq AI
    const handleAISuggestPrice = async () => {
        if (!activeBusiness || !newProduct.name_en) {
            toast.error('Provide a product name first');
            return;
        }
        try {
            setAiSuggestingPrice(true);
            const recommendation = await businessService.aiSuggestPrice(
                activeBusiness.id,
                newProduct.name_en,
                activeBusiness.category
            );
            if (recommendation && recommendation.suggested_price) {
                setNewProduct(prev => ({ ...prev, price: String(recommendation.suggested_price) }));
                toast.success(`AI Recommended Price: $${recommendation.suggested_price}`);
            } else {
                toast.error('AI was unable to estimate pricing matching this title');
            }
        } catch (e) {
            toast.error('Price estimation tool offline');
        } finally {
            setAiSuggestingPrice(false);
        }
    };

    // Suggest replies via Groq AI
    const handleAISuggestReply = async () => {
        if (!activeBusiness || activeCustomerId === null) return;
        try {
            setAiSuggestingReply(true);
            const list = await businessService.aiSuggestReply(activeBusiness.id, activeCustomerId);
            setAiSuggestedReplyList(list);
            toast.success('AI replies drafted!');
        } catch (e) {
            toast.error('AI reply draft tool offline');
        } finally {
            setAiSuggestingReply(false);
        }
    };

    // Summarize chat logs via Groq AI
    const handleAISummarizeChat = async () => {
        if (!activeBusiness || activeCustomerId === null) return;
        try {
            setAiSummarizingChat(true);
            const summary = await businessService.aiSummarizeChat(activeBusiness.id, activeCustomerId);
            setAiSummaryText(summary);
            toast.success('Chat summary generated!');
        } catch (e) {
            toast.error('Chat summarization tool offline');
        } finally {
            setAiSummarizingChat(false);
        }
    };

    // Post messaging updates (WebSocket or HTTP REST fallback)
    const handleSendCustomerMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeBusiness || activeCustomerId === null || !chatInput.trim()) return;

        // If WS is live, push down socket channels
        if (wsConnected && socketRef.current) {
            socketRef.current.send(JSON.stringify({
                type: 'customer_message',
                token: token,
                payload: {
                    customer_id: activeCustomerId,
                    content: chatInput,
                    tags: ['crm_support']
                }
            }));
            // Optimistic insert
            const mockMsg: BusinessMessage = {
                id: Math.random(),
                business_id: activeBusiness.id,
                customer_id: activeCustomerId,
                sender_id: user?.id || 0,
                content: chatInput,
                is_from_customer: false,
                is_read: true,
                tags: ['crm_support'],
                created_at: new Date().toISOString()
            };
            setCustomerChats(prev => ({
                ...prev,
                [activeCustomerId]: [...(prev[activeCustomerId] || []), mockMsg]
            }));
            setChatInput('');
            setAiSuggestedReplyList([]);
        } else {
            // Fallback to HTTP REST
            try {
                const sent = await businessService.sendCustomerChatMessage(
                    activeBusiness.id,
                    activeCustomerId,
                    chatInput,
                    ['crm_support']
                );
                setCustomerChats(prev => ({
                    ...prev,
                    [activeCustomerId]: [...(prev[activeCustomerId] || []), sent]
                }));
                setChatInput('');
                setAiSuggestedReplyList([]);
            } catch (e) {
                toast.error('Failed to dispatch message');
            }
        }
    };

    // Register product item
    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeBusiness) return;
        try {
            const added = await businessService.addProduct(activeBusiness.id, {
                name_en: newProduct.name_en,
                name_so: newProduct.name_so || undefined,
                price: parseFloat(newProduct.price),
                description_en: newProduct.description_en || undefined,
                sku: newProduct.sku || undefined,
                stock_level: parseInt(newProduct.stock_level),
                low_stock_threshold: parseInt(newProduct.low_stock_threshold)
            });
            toast.success('Product added successfully!');
            setProducts(prev => [...prev, added]);
            setNewProduct({
                name_en: '',
                name_so: '',
                price: '',
                description_en: '',
                sku: '',
                stock_level: '10',
                low_stock_threshold: '3',
            });
        } catch (e) {
            toast.error('Failed to log product entry');
        }
    };

    // Record customer manual order
    const handleRecordOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeBusiness) return;
        const prod = products.find(p => p.id === parseInt(newOrder.product_id));
        if (!prod) {
            toast.error('Selected product not found');
            return;
        }
        const qty = parseInt(newOrder.qty);
        if (prod.stock_level < qty) {
            toast.error(`Low stock: only ${prod.stock_level} available`);
            return;
        }

        try {
            const items = [{ product_id: prod.id, name: prod.name_en, price: prod.price, qty: qty }];
            const total = prod.price * qty;
            
            const ord = await businessService.recordOrder(activeBusiness.id, {
                customer_id: parseInt(newOrder.customer_id),
                items: items,
                total_amount: total,
                payment_method: newOrder.payment_method,
                notes: newOrder.notes || undefined
            });
            toast.success('Manual order recorded!');
            setOrders(prev => [...prev, ord]);
            setNewOrder({
                customer_id: '',
                product_id: '',
                qty: '1',
                payment_method: 'cash',
                notes: '',
            });
            // Reload database products & analytics
            loadWorkspaceData();
        } catch (e) {
            toast.error('Failed to log order registration');
        }
    };

    // Invite new worker role
    const handleInviteEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeBusiness) return;
        if (!newInvite.email && !newInvite.phone) {
            toast.error('Provide at least email or phone');
            return;
        }
        try {
            const invited = await businessService.inviteEmployee(activeBusiness.id, {
                email: newInvite.email || undefined,
                phone: newInvite.phone || undefined,
                role: newInvite.role
            });
            toast.success('Invitation successfully dispatched!');
            setEmployees(prev => [...prev, invited]);
            setNewInvite({ email: '', phone: '', role: 'sales_agent' });
        } catch (e) {
            toast.error('Failed to create invite log');
        }
    };

    // Create a new task
    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeBusiness || !newTask.title) return;
        try {
            const added = await businessService.createTask(activeBusiness.id, {
                title: newTask.title,
                description: newTask.description || undefined,
                status: newTask.status
            });
            toast.success('Task created successfully!');
            setTasks(prev => [...prev, added]);
            setNewTask({ title: '', description: '', status: 'todo' });
        } catch (e) {
            toast.error('Failed to save task');
        }
    };

    // Update order status lifecycle
    const handleChangeOrderStatus = async (orderId: number, status: string) => {
        if (!activeBusiness) return;
        try {
            const updated = await businessService.updateOrder(activeBusiness.id, orderId, { status });
            setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
            toast.success(`Order status updated to ${status}`);
            loadWorkspaceData(); // Refresh analytics
        } catch (e) {
            toast.error('Failed to update status');
        }
    };

    // Update Kanban column of a task
    const handleMoveTask = async (taskId: number, newCol: 'todo' | 'in_progress' | 'review' | 'done') => {
        if (!activeBusiness) return;
        try {
            const updated = await businessService.updateTask(activeBusiness.id, taskId, { status: newCol });
            setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
        } catch (e) {
            toast.error('Task move blocked');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white text-slate-800 flex-col gap-4">
                <RefreshCw className="h-10 w-10 animate-spin text-sky-500" />
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Syncing Suqafuran OS...</p>
            </div>
        );
    }

    // ONBOARDING WORKSPACE SCREEN (If no businesses exist)
    if (businesses.length === 0 && !isRegisterModalOpen) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 relative overflow-hidden">
                {/* Background glow effects */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-200/10 rounded-full blur-3xl" />
                
                <div className="max-w-xl w-full text-center space-y-8 relative z-10">
                    <div className="mx-auto w-20 h-20 rounded-[28px] bg-gradient-to-tr from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-400/20">
                        <Store className="h-10 w-10 text-white" />
                    </div>
                    
                    <div className="space-y-3">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 font-outfit">
                            Welcome to the Suqafuran <span className="bg-gradient-to-r from-sky-50 to-sky-600 bg-clip-text text-transparent">Business Hub</span>
                        </h1>
                        <p className="text-slate-650 text-base leading-relaxed">
                            Configure your enterprise workspace in a single click. Publish catalogs, manage employees with fine-grained roles, orchestrate real-time chats, and leverage advanced Groq AI to double your sales.
                        </p>
                    </div>

                    <div className="bg-white border border-sky-100/70 shadow-[0_8px_30px_rgba(0,0,0,0.02)] rounded-3xl p-6 text-left space-y-4">
                        <h3 className="text-slate-900 font-bold text-sm uppercase tracking-wider text-sky-600">Included Core Features</h3>
                        <ul className="grid grid-cols-2 gap-3 text-xs font-medium text-slate-700">
                            <li className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-sky-500" /> Multi-tenant RBAC Security
                            </li>
                            <li className="flex items-center gap-2">
                                <RefreshCw className="h-4 w-4 text-sky-500" /> Confluent Kafka Real-Time Stream
                            </li>
                            <li className="flex items-center gap-2">
                                <Bot className="h-4 w-4 text-sky-500" /> Groq AI Pricing & Description
                            </li>
                            <li className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-sky-500" /> Fast Redis Analytics Cache
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={() => setIsRegisterModalOpen(true)}
                        className="w-full h-12 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-black uppercase text-sm tracking-wider rounded-2xl shadow-xl hover:shadow-sky-500/10 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        Initialize Your First Workspace <ArrowRight className="h-5 w-5" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex bg-[#f8f9fa] text-[#1a1a1a] overflow-hidden font-sans">
            
            {/* 1. SAAS MASTER SIDEBAR */}
            <aside className="w-64 bg-white border-r border-[#f0f0ee] flex flex-col shrink-0">
                {/* Brand Header */}
                <div className="p-6 border-b border-[#f0f0ee]">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-white font-extrabold text-lg shadow-sm">B</div>
                        <span className="text-xl font-extrabold tracking-tight text-[#1a1a1a]">BizLink</span>
                    </Link>
                </div>

                {/* Workspaces / Active Workspace Selector */}
                {businesses.length > 0 && (
                    <div className="px-5 py-4 border-b border-[#f0f0ee] bg-slate-50/20">
                        <p className="text-[10px] font-extrabold text-[#7d7d7d] uppercase tracking-wider mb-2.5 px-1">Workspaces</p>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto hide-scrollbar">
                            {businesses.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => setActiveBusiness(b)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-[0.98] ${
                                        activeBusiness?.id === b.id
                                            ? 'bg-[#f4f4f0] text-[#1a1a1a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]'
                                            : 'text-[#7d7d7d] hover:bg-slate-50 hover:text-[#1a1a1a]'
                                    }`}
                                >
                                    <span className="truncate pr-2">{b.name}</span>
                                    {activeBusiness?.id === b.id && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sidebar Navigation Link Tabs */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {[
                        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
                        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
                        { id: 'crm', label: 'Customers', icon: Users },
                        { id: 'messages', label: 'Activity / Chat', icon: MessageSquare },
                        { id: 'storefront', label: 'Storefront Settings', icon: Store },
                        { id: 'inventory', label: 'Inventory / Catalog', icon: Package },
                        { id: 'orders', label: 'Orders', icon: ShoppingCart },
                        { id: 'team', label: 'Team Roster', icon: ShieldCheck },
                        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                        { id: 'ai', label: 'AI Copilot', icon: Bot }
                    ].map(item => {
                        const Icon = item.icon;
                        const isSel = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as TabType)}
                                className={`flex items-center gap-3.5 w-full px-4 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all duration-200 active:scale-[0.98] ${
                                    isSel
                                        ? 'bg-orange-50 text-orange-600 shadow-[inset_0_1px_2px_rgba(249,115,22,0.02)]'
                                        : 'text-[#7d7d7d] hover:bg-orange-50/20 hover:text-orange-500'
                                }`}
                            >
                                <Icon className={`h-4.5 w-4.5 ${isSel ? 'text-orange-500' : 'text-[#a3a3a3]'}`} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Members Section (Active Employees list) */}
                <div className="px-4 py-4 border-t border-[#f0f0ee]">
                    <div className="flex items-center justify-between px-2 mb-2.5">
                        <p className="text-[10px] font-extrabold text-[#7d7d7d] uppercase tracking-wider">Members</p>
                        <button
                            onClick={() => setActiveTab('team')}
                            className="text-[#7d7d7d] hover:text-[#1a1a1a] transition-all p-0.5 hover:bg-slate-50 rounded-md"
                            title="Manage Team"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="space-y-2 max-h-36 overflow-y-auto hide-scrollbar">
                        {employees.slice(0, 4).map((e, idx) => {
                            const colors = [
                                'bg-rose-100 text-rose-700',
                                'bg-emerald-100 text-emerald-700',
                                'bg-amber-100 text-amber-700',
                                'bg-sky-100 text-sky-700'
                            ];
                            const avatarColor = colors[idx % colors.length];
                            return (
                                <div key={e.id} className="flex items-center justify-between px-2 py-1 rounded-xl transition-all duration-200 hover:bg-slate-50">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="relative shrink-0">
                                            <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center font-bold text-[10px] uppercase ${avatarColor}`}>
                                                {e.invite_email?.[0] || e.role[0]}
                                            </div>
                                            {e.is_active && (
                                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold text-[#1a1a1a] truncate">
                                                {e.user_id ? `Member #${e.user_id}` : e.invite_email || 'Invited User'}
                                            </p>
                                            <p className="text-[9px] text-[#7d7d7d] font-bold uppercase tracking-wider truncate">
                                                {e.role.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {employees.length === 0 && (
                            <p className="text-[10px] text-[#7d7d7d] italic px-2 py-1">No workers active.</p>
                        )}
                    </div>
                </div>

                {/* Footer Controls / Profile */}
                <div className="p-4 border-t border-[#f0f0ee] bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-extrabold text-xs text-[#1a1a1a]">
                                {user?.full_name?.[0] || 'U'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-[#1a1a1a] truncate">{user?.full_name}</p>
                                <p className="text-[9px] uppercase font-black tracking-widest text-orange-600 truncate bg-orange-50/60 border border-orange-100/30 px-2 py-0.5 rounded-full mt-0.5 inline-block">
                                    {myMembership?.role || 'owner'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="text-[#7d7d7d] hover:text-orange-500 transition-all p-1 hover:bg-orange-50 rounded-lg active:scale-95 duration-100"
                            title="Return to Marketplace"
                        >
                            <ArrowRight className="h-4.5 w-4.5 rotate-180" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* 2. MAIN HUB WORKSPACE CONTENT */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#f8f9fa] h-full overflow-hidden">
                
                {/* 2.1 HEADER */}
                <header className="h-16 shrink-0 border-b border-[#f0f0ee] bg-white flex items-center justify-between px-8">
                    {/* Left Search Bar */}
                    <div className="flex items-center gap-3 w-80 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100 hover:border-orange-250 transition-all duration-200">
                        <svg className="h-4 w-4 text-[#7d7d7d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder={
                                activeTab === 'crm' ? "Search customer..." :
                                activeTab === 'inventory' ? "Search products..." : "Search workspace..."
                            }
                            className="bg-transparent border-none outline-none text-xs font-bold text-[#1a1a1a] placeholder-[#7d7d7d] w-full"
                        />
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-4.5">
                        <div className="flex items-center gap-3.5 text-xs font-bold text-[#7d7d7d]">
                            <button className="flex items-center gap-1 hover:text-orange-500 transition-all duration-150 active:scale-95">
                                <Filter className="h-3.5 w-3.5" /> Sort by
                            </button>
                            <button className="flex items-center gap-1 hover:text-orange-500 transition-all duration-150 active:scale-95">
                                Filters
                            </button>
                            {activeBusiness && (
                                <span className="text-[10px] font-black uppercase bg-orange-50 border border-orange-100 text-orange-600 px-3 py-1 rounded-full">
                                    slug: /{activeBusiness.slug}
                                </span>
                            )}
                        </div>

                        {/* Live Socket Status LED indicator */}
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-1 rounded-full border",
                            wsConnected 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100/50" 
                                : "bg-rose-50 text-rose-700 border-rose-100/50"
                        )}>
                            <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                                {wsConnected ? 'Broker Online' : 'Syncing'}
                            </span>
                        </div>

                        {/* Marketplace Redirect */}
                        <Link
                            to="/dashboard"
                            className="bg-orange-50 hover:bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest py-1.5 px-3.5 rounded-xl border border-orange-100/50 transition-all duration-200 active:scale-95 shadow-sm"
                        >
                            ← Marketplace
                        </Link>
                    </div>
                </header>

                {/* 2.2 CONTENT BODY SCROLLER */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <div className="w-full space-y-6">

                        {/* --- TAB: OVERVIEW --- */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Stats Metrics Cards Grid */}
                                <div className="grid grid-cols-4 gap-5">
                                    {[
                                        { label: 'Workspace Revenue', value: `$${analytics?.revenue || '0.00'}`, trend: '+8.4%', trendColor: 'text-[#15803d] bg-[#ebf8f2]', icon: DollarSign, colorBg: 'bg-[#ebf8f2] border border-[#d1f2e1]/40', colorText: 'text-[#15803d]' },
                                        { label: 'Completed Orders', value: analytics?.completed_orders || 0, trend: '+2.1%', trendColor: 'text-[#b45309] bg-[#fff6e0]', icon: ShoppingCart, colorBg: 'bg-[#fff6e0] border border-[#feebd1]/40', colorText: 'text-[#b45309]' },
                                        { label: 'Products in Catalog', value: analytics?.product_count || 0, trend: 'Catalog size', trendColor: 'text-[#0369a1] bg-[#e0f2fe]', icon: Package, colorBg: 'bg-[#e0f2fe] border border-[#bde4ff]/40', colorText: 'text-[#0369a1]' },
                                        { label: 'Active Customers', value: analytics?.customer_count || 0, trend: 'Relationships', trendColor: 'text-[#6d28d9] bg-[#faf5ff]', icon: Users, colorBg: 'bg-[#faf5ff] border border-[#f3e8ff]/40', colorText: 'text-[#6d28d9]' }
                                    ].map((c, i) => {
                                        const Icon = c.icon;
                                        return (
                                            <div key={i} className={`${c.colorBg} rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between h-36 relative overflow-hidden transition-all duration-300 hover:scale-[1.02]`}>
                                                <div className="flex justify-between items-start">
                                                    <p className={`text-[10px] font-extrabold uppercase tracking-wider opacity-85 ${c.colorText}`}>{c.label}</p>
                                                    <div className={`p-2 rounded-xl bg-white/60 shrink-0 ${c.colorText}`}>
                                                        <Icon className="h-4.5 w-4.5" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className={`text-2.5xl font-extrabold tracking-tight ${c.colorText}`}>{c.value}</h3>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${c.trendColor}`}>{c.trend}</span>
                                                        <span className={`text-[9px] opacity-75 font-semibold ${c.colorText}`}>since last week</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Danger Warning Alert if Stock is Low */}
                                {analytics?.low_stock_count > 0 && (
                                    <div className="bg-[#fef7e0] border border-[#fcdcad]/50 rounded-[20px] p-4 flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.015)]">
                                        <div className="flex items-center gap-3.5">
                                            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0">
                                                <ShieldAlert className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold uppercase text-amber-800 tracking-wider">Inventory Restock Alert</h4>
                                                <p className="text-xs text-amber-700 font-bold mt-0.5">There are {analytics.low_stock_count} products falling below their minimum stock threshold.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab('inventory')}
                                            className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#2d2d2d] text-white text-xs font-bold rounded-xl transition-all duration-200 active:scale-95 shadow-sm"
                                        >
                                            Restock Now
                                        </button>
                                    </div>
                                )}

                                {/* Main overview details */}
                                <div className="grid grid-cols-3 gap-6">
                                    {/* Quick Order Logging Widget */}
                                    <div className="col-span-1 bg-white border border-[#f0f0ee] rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.015)] space-y-5">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">Log Manual Sale</h3>
                                        <form onSubmit={handleRecordOrder} className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-extrabold text-[#7d7d7d] uppercase tracking-wider">Select Product</label>
                                                <select
                                                    value={newOrder.product_id}
                                                    onChange={e => setNewOrder(prev => ({ ...prev, product_id: e.target.value }))}
                                                    required
                                                    className="w-full bg-[#f8f9fa] border border-[#f0f0ee] text-xs font-bold py-2.5 px-3.5 rounded-xl text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] mt-1.5 transition-all"
                                                >
                                                    <option value="">-- Choose Item --</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name_en} (${p.price})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-extrabold text-[#7d7d7d] uppercase tracking-wider">Quantity</label>
                                                    <input
                                                        type="number"
                                                        value={newOrder.qty}
                                                        onChange={e => setNewOrder(prev => ({ ...prev, qty: e.target.value }))}
                                                        required
                                                        min="1"
                                                        className="w-full bg-[#f8f9fa] border border-[#f0f0ee] text-xs font-bold py-2.5 px-3.5 rounded-xl text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] mt-1.5 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-extrabold text-[#7d7d7d] uppercase tracking-wider">Customer</label>
                                                    <select
                                                        value={newOrder.customer_id}
                                                        onChange={e => setNewOrder(prev => ({ ...prev, customer_id: e.target.value }))}
                                                        required
                                                        className="w-full bg-[#f8f9fa] border border-[#f0f0ee] text-xs font-bold py-2.5 px-3.5 rounded-xl text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] mt-1.5 transition-all"
                                                    >
                                                        <option value="">-- Choose --</option>
                                                        {customers.map(c => (
                                                            <option key={c.id} value={c.user_id}>Customer #{c.user_id}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                className="w-full py-2.5 bg-[#1a1a1a] hover:bg-[#2d2d2d] text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-sm active:scale-95"
                                            >
                                                Log Order Completion
                                            </button>
                                        </form>
                                    </div>

                                    {/* Workspace activity lists */}
                                    <div className="col-span-2 bg-white border border-[#f0f0ee] rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.015)] space-y-5">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a]">Recent Workspace Orders</h3>
                                            <button
                                                onClick={() => setActiveTab('orders')}
                                                className="text-xs font-bold text-[#7d7d7d] hover:text-[#1a1a1a] transition-all"
                                            >
                                                See all
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs font-semibold text-[#1a1a1a]">
                                                <thead>
                                                    <tr className="border-b border-[#f0f0ee] text-[#7d7d7d] font-bold uppercase tracking-wider">
                                                        <th className="py-3">ID</th>
                                                        <th>Customer</th>
                                                        <th>Amount</th>
                                                        <th>Method</th>
                                                        <th>Status</th>
                                                        <th>Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orders.slice(-5).reverse().map(o => (
                                                        <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                            <td className="py-3.5 font-bold">#{o.id}</td>
                                                            <td>Customer #{o.customer_id}</td>
                                                            <td className="font-bold text-[#1a1a1a]">${o.total_amount}</td>
                                                            <td className="capitalize text-[#7d7d7d]">{o.payment_method}</td>
                                                            <td>
                                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                                    o.status === 'completed' ? 'bg-[#e6f4ea] text-[#137333]' :
                                                                    o.status === 'pending' ? 'bg-[#fef7e0] text-[#b06000]' : 'bg-slate-100 text-[#7d7d7d]'
                                                                }`}>
                                                                    {o.status}
                                                                </span>
                                                            </td>
                                                            <td className="text-[#7d7d7d] text-[10px]">
                                                                {new Date(o.created_at).toLocaleDateString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {orders.length === 0 && (
                                                        <tr>
                                                            <td colSpan={6} className="py-8 text-center text-[#7d7d7d] italic">No orders logged in this workspace yet.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* CRM Sidebar logs */}
                                        <div className="col-span-1 bg-slate-50 border border-[#eef0f2] rounded-2xl p-5 space-y-4">
                                            <h4 className="text-xs font-black uppercase text-orange-600 tracking-wider">Configure Loyalty & Segments</h4>
                                            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Customer segments (New, Regular, VIP, Inactive) are automatically updated in real-time by the Confluent Kafka broker as manual or marketplace purchases complete.</p>
                                            <div className="bg-white border border-slate-150 p-4 rounded-xl text-[10px] font-semibold text-slate-600 leading-relaxed shadow-sm">
                                                VIP triggers automatically at 5+ completed orders. Loyalty calculations reward 10 points for every $100 spent.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                                            {/* --- TAB: STOREFRONT --- */}
                        {activeTab === 'storefront' && (
                            <div className="bg-white border border-[#eef0f2] shadow-[0_8px_30px_rgba(0,0,0,0.015)] rounded-3xl p-6 space-y-6 text-slate-800 animate-fade-in-up">
                                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Storefront Design & Settings</h3>
                                    <span className="text-[10px] font-black uppercase bg-orange-50 border border-orange-100 text-orange-600 px-3 py-1 rounded-full">
                                        Public Store Settings
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Business Title</label>
                                            <input
                                                type="text"
                                                value={storefrontData.name ?? activeBusiness?.name ?? ''}
                                                onChange={e => setStorefrontData(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3.5 rounded-xl text-slate-800 mt-1.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Workspace Bio / Description</label>
                                            <textarea
                                                disabled
                                                rows={3}
                                                className="w-full bg-slate-50 border border-slate-200 text-xs py-2 px-3 rounded-xl text-slate-400 mt-1.5 cursor-not-allowed font-medium"
                                                placeholder={activeBusiness?.description || "Workspace biography..."}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Phone</label>
                                                <input
                                                    type="text"
                                                    value={activeBusiness?.phone || ''}
                                                    disabled
                                                    className="w-full bg-slate-50 border border-slate-200 text-xs py-2 px-3 rounded-xl text-slate-400 mt-1.5 cursor-not-allowed font-medium"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Email</label>
                                                <input
                                                    type="text"
                                                    value={activeBusiness?.email || ''}
                                                    disabled
                                                    className="w-full bg-slate-50 border border-slate-200 text-xs py-2 px-3 rounded-xl text-slate-400 mt-1.5 cursor-not-allowed font-medium"
                                                />
                                            </div>
                                        </div>

                                        {/* Neary Directory Opt-in toggle */}
                                        <div className="bg-slate-50 border border-[#eef0f2] rounded-2xl p-5 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-xs font-black uppercase text-orange-600 tracking-wider">Shops Near You Opt-in</h4>
                                                    <p className="text-[10px] text-slate-500 mt-1 font-medium">Opt-in to be discovered under the "Shops Near You" homepage feed.</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setStorefrontData(prev => ({ ...prev, show_in_nearby: !prev.show_in_nearby }))}
                                                    className={cn(
                                                        "w-11 h-6 rounded-full transition-all duration-300 relative border",
                                                        storefrontData.show_in_nearby 
                                                            ? "bg-orange-500 border-orange-400" 
                                                            : "bg-slate-200 border-slate-300"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all duration-300 shadow",
                                                        storefrontData.show_in_nearby ? "left-5.5" : "left-1"
                                                    )} />
                                                </button>
                                            </div>

                                            {/* Approval state indicator */}
                                            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Approval Status:</span>
                                                {!storefrontData.show_in_nearby ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-500 border border-slate-300/40">
                                                        Inactive (Opt-in above)
                                                    </span>
                                                ) : activeBusiness?.is_approved ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100/50 flex items-center gap-1">
                                                        <ShieldCheck className="h-3 w-3" /> Live & Approved
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100 flex items-center gap-1 animate-pulse">
                                                        <AlertCircle className="h-3 w-3" /> Pending Admin Approval
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Save changes button */}
                                        <button
                                            type="button"
                                            onClick={handleSaveStorefront}
                                            disabled={savingStorefront || (storefrontData.name === activeBusiness?.name && storefrontData.show_in_nearby === activeBusiness?.show_in_nearby)}
                                            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-none border border-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-200 shadow-md shadow-orange-100/80 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            {savingStorefront ? 'Saving settings...' : 'Save Storefront Settings'}
                                        </button>
                                    </div>
 
                                    <div className="space-y-4">
                                        <div className="bg-slate-50 border border-[#eef0f2] rounded-2xl p-5 space-y-3">
                                            <h4 className="text-[10px] font-black uppercase text-orange-600 tracking-wider">Public Storefront Metadata</h4>
                                            <div className="space-y-2 text-xs font-bold text-slate-600">
                                                <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> Address: <span className="text-slate-800">{activeBusiness?.address || 'Not mapped'}</span></p>
                                                <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" /> Category: <span className="capitalize text-slate-800">{activeBusiness?.category}</span></p>
                                                <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-slate-400" /> Verified Merchant: <span className="text-slate-800">{activeBusiness?.is_verified ? 'Yes' : 'Pending Verification'}</span></p>
                                                <p className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-slate-400" /> Trust Score: <span className="text-slate-855 font-black">{activeBusiness?.trust_score}/100</span></p>
                                            </div>
                                        </div>
 
                                        <div className="bg-orange-50/40 border border-orange-100/60 rounded-2xl p-5 flex flex-col items-center justify-center text-center py-6 gap-3 shadow-inner">
                                            <Globe className="h-8 w-8 text-orange-500 animate-pulse" />
                                            <div>
                                                <h4 className="text-xs font-black uppercase text-orange-950">Your Shop Website Link</h4>
                                                <p className="text-[9px] text-orange-700/80 mt-1 max-w-[240px] mx-auto font-medium">Share this custom storefront URL with customers. It populates all your business details and catalog products!</p>
                                            </div>
 
                                            {/* Link Display and Copy Action Container */}
                                            {activeBusiness && (
                                                <div className="w-full flex items-center gap-2 bg-white border border-orange-100 rounded-xl p-2.5 mt-2.5 shadow-sm">
                                                    <span className="text-[10px] text-orange-600 font-extrabold truncate flex-1 text-left select-all pr-2">
                                                        {`${window.location.origin}/shop/${activeBusiness.slug}`}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={handleCopyStorefrontLink}
                                                        className="p-1.5 hover:bg-orange-50 active:scale-95 text-orange-400 hover:text-orange-600 rounded transition-all shrink-0 border border-transparent hover:border-orange-200 animate-fade-in"
                                                        title="Copy Link"
                                                    >
                                                        {copiedLink ? (
                                                            <span className="text-[9px] font-black uppercase text-emerald-600 flex items-center gap-0.5">
                                                                Copied!
                                                            </span>
                                                        ) : (
                                                            <Copy className="h-3.5 w-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: INVENTORY --- */}
                        {activeTab === 'inventory' && (
                            <div className="space-y-6 animate-fade-in-up">

                                {/* ── MY ADS / LISTINGS SECTION ── */}
                                <div className="bg-white border border-[#eef0f2] shadow-[0_8px_30px_rgba(0,0,0,0.015)] rounded-3xl p-6 space-y-5">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">My Ads — Linked to This Shop</h3>
                                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">All listings you've posted are automatically displayed on your shop profile page.</p>
                                        </div>
                                        <Link
                                            to="/post-ad"
                                            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-md shadow-orange-100 active:scale-95"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> Post New Ad
                                        </Link>
                                    </div>

                                    {loadingListings ? (
                                        <div className="flex items-center justify-center py-10 gap-3 text-slate-400">
                                            <RefreshCw className="h-5 w-5 animate-spin text-orange-400" />
                                            <span className="text-xs font-semibold">Loading your ads...</span>
                                        </div>
                                    ) : myListings.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                                            <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                                                <Tag className="h-6 w-6 text-orange-400" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-slate-600">No ads posted yet</p>
                                                <p className="text-[11px] text-slate-400 mt-1">Post your first ad and it will automatically appear on your shop page.</p>
                                            </div>
                                            <Link
                                                to="/post-ad"
                                                className="mt-2 flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all shadow-md shadow-orange-100 active:scale-95"
                                            >
                                                <Plus className="h-3.5 w-3.5" /> Post First Ad
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                            {myListings.map(listing => {
                                                const thumb = listing.images?.[0];
                                                const statusColor = listing.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : listing.status === 'pending'
                                                    ? 'bg-orange-50 text-orange-600 border-orange-100'
                                                    : 'bg-slate-100 text-slate-500 border-slate-200';
                                                return (
                                                    <Link
                                                        key={listing.id}
                                                        to={`/listings/${listing.id}`}
                                                        className="group relative bg-white border border-[#eef0f2] rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-200 flex flex-col"
                                                    >
                                                        {/* Thumbnail */}
                                                        <div className="relative aspect-square bg-slate-50 overflow-hidden">
                                                            {thumb ? (
                                                                <img
                                                                    src={thumb}
                                                                    alt={listing.title_en}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <ImageIcon className="h-8 w-8 text-slate-300" />
                                                                </div>
                                                            )}
                                                            {/* Status badge */}
                                                            <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusColor}`}>
                                                                {listing.status}
                                                            </span>
                                                            {/* Boost badge */}
                                                            {listing.boost_level && listing.boost_level > 0 ? (
                                                                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-100">
                                                                    Boosted
                                                                </span>
                                                            ) : null}
                                                            {/* Hover overlay */}
                                                            <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/5 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                <ExternalLink className="h-5 w-5 text-orange-500 drop-shadow" />
                                                            </div>
                                                        </div>

                                                        {/* Info */}
                                                        <div className="p-3 flex flex-col gap-1 flex-1">
                                                            <p className="text-xs font-bold text-slate-800 leading-tight line-clamp-2">{listing.title_en}</p>
                                                            <p className="text-sm font-extrabold text-orange-600 mt-auto">
                                                                {listing.currency} {listing.price.toLocaleString()}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium mt-1">
                                                                {listing.views != null && <span>👁 {listing.views}</span>}
                                                                {listing.leads != null && <span>🔗 {listing.leads}</span>}
                                                                <span className="ml-auto truncate">{listing.location}</span>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* ── BUSINESS PRODUCT CATALOG ── */}
                                <div className="grid grid-cols-3 gap-6">
                                {/* Create catalog item card */}
                                <div className="col-span-1 bg-white border border-[#eef0f2] shadow-[0_8px_30px_rgba(0,0,0,0.015)] rounded-3xl p-6 space-y-5">
                                    <div className="pb-2 border-b border-slate-100">
                                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Add Product Entry</h3>
                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Track inventory stock levels for offline/in-store products.</p>
                                    </div>
                                    <form onSubmit={handleAddProduct} className="space-y-3.5">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Product Name (EN)</label>
                                            <input
                                                type="text"
                                                value={newProduct.name_en}
                                                onChange={e => setNewProduct(prev => ({ ...prev, name_en: e.target.value }))}
                                                required
                                                className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3.5 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 mt-1.5 font-bold transition-all"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3.5">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                                    Price ($) 
                                                    <button
                                                        type="button"
                                                        onClick={handleAISuggestPrice}
                                                        className="text-[9px] font-black text-orange-500 hover:text-orange-650 uppercase tracking-wider transition-colors"
                                                    >
                                                        {aiSuggestingPrice ? '...' : 'AI Recommend'}
                                                    </button>
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={newProduct.price}
                                                    onChange={e => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                                                    required
                                                    className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3.5 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 mt-1.5 font-bold transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SKU Code</label>
                                                <input
                                                    type="text"
                                                    value={newProduct.sku}
                                                    onChange={e => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                                                    className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3.5 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 mt-1.5 font-bold transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                                Description 
                                                <button
                                                    type="button"
                                                    onClick={handleAIGenerateDescription}
                                                    className="text-[9px] font-black text-orange-500 hover:text-orange-650 uppercase tracking-wider transition-colors"
                                                >
                                                    {aiGeneratingDesc ? '...' : 'AI Generate'}
                                                </button>
                                            </label>
                                            <textarea
                                                value={newProduct.description_en}
                                                onChange={e => setNewProduct(prev => ({ ...prev, description_en: e.target.value }))}
                                                rows={3}
                                                className="w-full bg-slate-50 border border-slate-200 text-xs py-2 px-3 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 mt-1.5 font-medium transition-all"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3.5">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stock Level</label>
                                                <input
                                                    type="number"
                                                    value={newProduct.stock_level}
                                                    onChange={e => setNewProduct(prev => ({ ...prev, stock_level: e.target.value }))}
                                                    required
                                                    className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3.5 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 mt-1.5 font-bold transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Low Stock Min</label>
                                                <input
                                                    type="number"
                                                    value={newProduct.low_stock_threshold}
                                                    onChange={e => setNewProduct(prev => ({ ...prev, low_stock_threshold: e.target.value }))}
                                                    required
                                                    className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3.5 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 mt-1.5 font-bold transition-all"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-orange-100 flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <Plus className="h-4 w-4" /> Save Product Record
                                        </button>
                                    </form>
                                </div>

                                {/* Catalog grid */}
                                <div className="col-span-2 bg-white border border-[#eef0f2] shadow-[0_8px_30px_rgba(0,0,0,0.015)] rounded-3xl p-6 space-y-5">
                                    <div className="pb-2 border-b border-slate-100">
                                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Stock Catalog</h3>
                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Manage in-store or offline product stock levels.</p>
                                    </div>
                                    
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                                                    <th className="py-2.5">Name</th>
                                                    <th>Price</th>
                                                    <th>Stock</th>
                                                    <th>Sku</th>
                                                    <th>Performance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {products.map(p => {
                                                    const isLow = p.stock_level <= p.low_stock_threshold;
                                                    return (
                                                        <tr key={p.id} className="border-b border-slate-50 hover:bg-orange-50/10 text-slate-700 font-semibold transition-colors">
                                                            <td className="py-3">
                                                                <div className="font-bold text-slate-900">{p.name_en}</div>
                                                                <div className="text-[10px] text-slate-400 font-medium max-w-[200px] truncate">{p.description_en}</div>
                                                            </td>
                                                            <td className="font-extrabold text-slate-950">${p.price}</td>
                                                            <td>
                                                                <span className={cn(
                                                                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 border",
                                                                    isLow 
                                                                        ? "bg-orange-50 text-orange-600 border-orange-100/50" 
                                                                        : "bg-slate-100 text-slate-600 border-slate-200/50"
                                                                )}>
                                                                    {p.stock_level} Unit{p.stock_level !== 1 ? 's' : ''} {isLow ? '(LOW)' : ''}
                                                                </span>
                                                            </td>
                                                            <td className="font-mono text-slate-500 font-bold">{p.sku || 'N/A'}</td>
                                                            <td>
                                                                <div className="text-[10px] text-slate-500 font-medium space-y-0.5">
                                                                    <p>Views: <span className="font-bold text-slate-700">{p.views}</span></p>
                                                                    <p>Sales: <span className="font-bold text-slate-700">{p.sales}</span></p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                </div>
                            </div>
                        )}
                                            {/* --- TAB: ORDERS --- */}
                        {activeTab === 'orders' && (
                            <div className="bg-white border border-[#eef0f2] shadow-[0_8px_30px_rgba(0,0,0,0.015)] rounded-3xl p-6 space-y-5 text-slate-800 animate-fade-in-up">
                                <div className="pb-2 border-b border-slate-100">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Workspace Order History</h3>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                                                <th className="py-3">Order ID</th>
                                                <th>Customer</th>
                                                <th>Order Items</th>
                                                <th>Total Value</th>
                                                <th>Payment</th>
                                                <th>Status</th>
                                                <th>Lifecycle Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map(o => (
                                                <tr key={o.id} className="border-b border-slate-50 hover:bg-orange-50/10 text-slate-700 font-semibold transition-colors">
                                                    <td className="py-3.5 font-bold text-slate-900">#{o.id}</td>
                                                    <td>
                                                        <div className="text-slate-850 font-bold">ID: {o.customer_id}</div>
                                                        {o.notes && <div className="text-[10px] text-slate-400 font-medium">Note: {o.notes}</div>}
                                                    </td>
                                                    <td>
                                                        <div className="space-y-0.5">
                                                            {o.items?.map((item: any, idx: number) => (
                                                                <div key={idx} className="text-slate-500 font-medium">
                                                                    {item.qty}x {item.name || `Product ${item.product_id}`}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="font-extrabold text-slate-950">${o.total_amount}</td>
                                                    <td className="capitalize text-slate-500">{o.payment_method}</td>
                                                    <td>
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                            o.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50' :
                                                            o.status === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100/50' : 
                                                            o.status === 'processing' ? 'bg-sky-50 text-sky-700 border-sky-100/50' : 'bg-slate-100 text-slate-500 border-slate-200/50'
                                                        )}>
                                                            {o.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {o.status !== 'completed' && o.status !== 'cancelled' && (
                                                            <div className="flex gap-1.5">
                                                                {o.status === 'pending' && (
                                                                    <button
                                                                        onClick={() => handleChangeOrderStatus(o.id, 'processing')}
                                                                        className="px-2.5 py-1 bg-orange-500 hover:bg-orange-650 active:scale-95 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm shadow-orange-100 cursor-pointer"
                                                                    >
                                                                        Process
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleChangeOrderStatus(o.id, 'completed')}
                                                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                                                >
                                                                    Complete
                                                                </button>
                                                                <button
                                                                    onClick={() => handleChangeOrderStatus(o.id, 'cancelled')}
                                                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100/50 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {orders.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="py-10 text-center text-slate-400 italic">No order entries recorded yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: TEAM ROSTER --- */}
                        {activeTab === 'team' && (
                            <div className="grid grid-cols-3 gap-6 animate-fade-in-up">
                                {/* Invite employee card */}
                                <div className="col-span-1 bg-white border border-[#eef0f2] shadow-[0_8px_30px_rgba(0,0,0,0.015)] rounded-3xl p-6 space-y-5 text-slate-800">
                                    <div className="pb-2 border-b border-slate-100">
                                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Invite Workspace Worker</h3>
                                    </div>
                                    <form onSubmit={handleInviteEmployee} className="space-y-3.5">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                                            <input
                                                type="email"
                                                value={newInvite.email}
                                                onChange={e => setNewInvite(prev => ({ ...prev, email: e.target.value }))}
                                                className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3.5 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 mt-1.5 font-bold transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone Number</label>
                                            <input
                                                type="text"
                                                value={newInvite.phone}
                                                onChange={e => setNewInvite(prev => ({ ...prev, phone: e.target.value }))}
                                                className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3.5 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 mt-1.5 font-bold transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">RBAC Role Privilege</label>
                                            <select
                                                value={newInvite.role}
                                                onChange={e => setNewInvite(prev => ({ ...prev, role: e.target.value }))}
                                                required
                                                className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 mt-1.5 font-bold transition-all cursor-pointer"
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="manager">Manager</option>
                                                <option value="sales_agent">Sales Agent</option>
                                                <option value="support_agent">Support Agent</option>
                                                <option value="inventory_staff">Inventory Staff</option>
                                            </select>
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-orange-100 flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <UserPlus className="h-4 w-4" /> Send Invite
                                        </button>
                                    </form>
                                </div>

                                {/* Active roster list */}
                                <div className="col-span-2 bg-white border border-[#eef0f2] shadow-[0_8px_30px_rgba(0,0,0,0.015)] rounded-3xl p-6 space-y-5 text-slate-800">
                                    <div className="pb-2 border-b border-slate-100">
                                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Active Roster & Performance</h3>
                                    </div>
                                    
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                                                    <th className="py-2.5">Worker Name</th>
                                                    <th>Role</th>
                                                    <th>Status</th>
                                                    <th>Sales Logged</th>
                                                    <th>Chat Responses</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {employees.map(e => (
                                                    <tr key={e.id} className="border-b border-slate-50 hover:bg-orange-50/10 text-slate-700 font-semibold transition-colors">
                                                        <td className="py-3">
                                                            <div className="font-bold text-slate-900">ID: {e.user_id || 'Pending Invite'}</div>
                                                            <div className="text-[10px] text-slate-400 font-medium">{e.invite_email || e.invite_phone}</div>
                                                        </td>
                                                        <td>
                                                            <span className="uppercase font-black text-orange-600 text-[10px] tracking-widest bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md">
                                                                {e.role.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={cn(
                                                                "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                                                                e.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50' : 'bg-slate-100 text-slate-500 border-slate-200/50'
                                                            )}>
                                                                {e.is_active ? 'Active' : 'Pending Invite'}
                                                            </span>
                                                        </td>
                                                        <td className="font-extrabold text-slate-900">${e.performance_sales}</td>
                                                        <td className="text-slate-500 font-medium">{e.performance_responses} times</td>
                                                    </tr>
                                                ))}
                                                {employees.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="py-10 text-center text-slate-400 italic">No workers active.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: KANBAN TASKS --- */}
                        {activeTab === 'tasks' && (
                            <div className="space-y-6">
                                {/* Create quick task form */}
                                <div className="bg-white border border-[#eef0f2] shadow-[0_8px_30px_rgba(0,0,0,0.015)] rounded-2xl p-5 space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Log Team Task</h3>
                                    <form onSubmit={handleCreateTask} className="flex gap-4 items-end">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Task Title</label>
                                            <input
                                                type="text"
                                                value={newTask.title}
                                                onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                                                required
                                                placeholder="Describe actions needed..."
                                                className="w-full bg-slate-50 border border-slate-200 text-xs py-2 px-3 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 mt-1 font-bold"
                                            />
                                        </div>
                                        <div className="w-48">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kanban Column</label>
                                            <select
                                                value={newTask.status}
                                                onChange={e => setNewTask(prev => ({ ...prev, status: e.target.value as any }))}
                                                className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 mt-1 font-bold cursor-pointer"
                                            >
                                                <option value="todo">Todo</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="review">Review</option>
                                                <option value="done">Done</option>
                                            </select>
                                        </div>
                                        <button
                                            type="submit"
                                            className="py-2.5 px-6 bg-gradient-to-r from-sky-500 to-sky-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shrink-0 cursor-pointer shadow-md shadow-sky-100"
                                        >
                                            Publish Task
                                        </button>
                                    </form>
                                </div>

                                {/* Kanban Layout Columns */}
                                <div className="grid grid-cols-4 gap-4">
                                    {(['todo', 'in_progress', 'review', 'done'] as const).map(col => {
                                        const list = tasks.filter(t => t.status === col);
                                        return (
                                            <div key={col} className="bg-[#f8f9fa] border border-[#eef0f2] rounded-2xl p-4 space-y-4">
                                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 capitalize">
                                                        {col.replace('_', ' ')}
                                                    </h4>
                                                    <span className="text-[10px] font-black bg-sky-50 text-sky-600 border border-sky-100/50 px-2 py-0.5 rounded-full">
                                                        {list.length}
                                                    </span>
                                                </div>

                                                <div className="space-y-2 min-h-[300px]">
                                                    {list.map(t => (
                                                        <div key={t.id} className="bg-white border border-sky-100/60 p-3 rounded-xl shadow-sm space-y-3">
                                                            <div className="text-xs font-bold text-slate-800 leading-snug">{t.title}</div>
                                                            {t.description && <p className="text-[10px] text-slate-500 leading-normal font-medium">{t.description}</p>}
                                                            
                                                            <div className="flex gap-1 pt-1.5 border-t border-slate-150 justify-end">
                                                                {col !== 'todo' && (
                                                                    <button
                                                                        onClick={() => handleMoveTask(t.id, col === 'in_progress' ? 'todo' : col === 'review' ? 'in_progress' : 'review')}
                                                                        className="text-[9px] font-extrabold text-slate-400 hover:text-slate-650 px-1 cursor-pointer"
                                                                    >
                                                                        ← Move
                                                                    </button>
                                                                )}
                                                                {col !== 'done' && (
                                                                    <button
                                                                        onClick={() => handleMoveTask(t.id, col === 'todo' ? 'in_progress' : col === 'in_progress' ? 'review' : 'done')}
                                                                        className="text-[9px] font-extrabold text-sky-600 hover:text-sky-800 px-1 ml-auto cursor-pointer"
                                                                    >
                                                                        Move →
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {list.length === 0 && (
                                                        <div className="text-center py-10 text-[10px] text-slate-400 font-bold italic">Column Empty</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* --- TAB: UNIFIED MESSAGING / CHAT --- */}
                        {activeTab === 'messages' && (
                            <div className="bg-white border border-[#eef0f2] rounded-3xl h-[550px] flex overflow-hidden shadow-sm">
                                {/* Chats list sidebar */}
                                <div className="w-72 border-r border-[#eef0f2] flex flex-col shrink-0 bg-slate-50/40">
                                    <div className="p-4 border-b border-[#eef0f2] bg-white">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Customer Threads</h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                        {customers.map(c => {
                                            const isSel = activeCustomerId === c.user_id;
                                            return (
                                                <button
                                                    key={c.id}
                                                    onClick={() => setActiveCustomerId(c.user_id)}
                                                    className={`w-full text-left p-3 rounded-xl transition-all border ${
                                                        isSel ? 'bg-sky-50/40 border-sky-100 text-slate-900 font-bold' : 'border-transparent hover:bg-slate-100/70 text-slate-700'
                                                    }`}
                                                >
                                                    <div className="text-xs font-bold text-slate-900">Customer #{c.user_id}</div>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-[9px] font-black uppercase text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">{c.segmentation} Segment</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        {customers.length === 0 && (
                                            <div className="text-center py-10 text-slate-400 text-[11px] font-bold italic">No customer logs registered</div>
                                        )}
                                    </div>
                                </div>

                                {/* Active chat conversation panel */}
                                <div className="flex-1 flex flex-col min-w-0 bg-[#f8f9fa]">
                                    {activeCustomerId !== null ? (
                                        <>
                                            {/* Chat Header details */}
                                            <div className="p-4 border-b border-[#eef0f2] bg-white flex justify-between items-center shrink-0">
                                                <div>
                                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Customer #{activeCustomerId}</h4>
                                                    <p className="text-[10px] text-slate-400 font-medium">Multiplexed Real-Time WebSocket Channel</p>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleAISummarizeChat}
                                                        disabled={aiSummarizingChat}
                                                        className="px-2.5 py-1 bg-sky-50 border border-sky-100/50 text-[9px] font-black uppercase tracking-wider rounded hover:bg-sky-100 text-sky-600 cursor-pointer transition-colors"
                                                    >
                                                        {aiSummarizingChat ? 'Summarizing...' : 'AI Summarize'}
                                                    </button>
                                                    <button
                                                        onClick={handleAISuggestReply}
                                                        disabled={aiSuggestingReply}
                                                        className="px-2.5 py-1 bg-[#f5f3ff] border border-violet-100 text-[9px] font-black uppercase tracking-wider rounded hover:bg-[#ede9fe] text-violet-600 cursor-pointer transition-colors"
                                                    >
                                                        {aiSuggestingReply ? 'Drafting...' : 'AI Suggest Reply'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* AI Summary display if exists */}
                                            {aiSummaryText && (
                                                <div className="p-3 bg-sky-50/80 border-b border-sky-100/80 flex gap-2.5 items-start text-[11px] font-medium text-slate-700">
                                                    <Sparkles className="h-4.5 w-4.5 text-sky-500 shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <span className="font-bold text-sky-600">Groq AI Conversation Summary:</span> {aiSummaryText}
                                                    </div>
                                                    <button onClick={() => setAiSummaryText('')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Messages scroller */}
                                            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                                                {(customerChats[activeCustomerId] || []).map(msg => {
                                                    const isMe = !msg.is_from_customer;
                                                    return (
                                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[70%] p-3 rounded-2xl text-xs leading-relaxed ${
                                                                isMe
                                                                    ? 'bg-gradient-to-tr from-sky-400 to-sky-600 text-white rounded-tr-none shadow-sm'
                                                                    : 'bg-white text-slate-800 border border-slate-200/60 rounded-tl-none shadow-[0_2px_8px_rgba(0,0,0,0.02)]'
                                                                }`}>
                                                                <p className="font-semibold">{msg.content}</p>
                                                                <span className={`text-[8px] block text-right mt-1.5 font-bold uppercase tracking-widest ${isMe ? 'text-white/60' : 'text-slate-400'}`}>
                                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {(customerChats[activeCustomerId] || []).length === 0 && (
                                                    <div className="text-center py-20 text-slate-400 font-bold italic text-xs">Send a message to open conversation</div>
                                                )}
                                            </div>

                                            {/* AI Suggested replies array */}
                                            {aiSuggestedReplyList.length > 0 && (
                                                <div className="p-3 bg-[#f5f3ff]/50 border-t border-violet-100/50 space-y-2 max-h-24 overflow-y-auto">
                                                    <p className="text-[9px] font-black uppercase text-violet-600 tracking-wider">AI Suggested Quick Replies:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {aiSuggestedReplyList.map((reply, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => {
                                                                    setChatInput(reply);
                                                                    setAiSuggestedReplyList([]);
                                                                }}
                                                                className="px-2 py-1 bg-white border border-violet-100 text-[10px] text-violet-700 hover:bg-violet-50 rounded-lg text-left truncate max-w-xs cursor-pointer font-bold transition-all"
                                                            >
                                                                {reply}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Chat input box */}
                                            <form onSubmit={handleSendCustomerMessage} className="p-4 border-t border-[#eef0f2] bg-white flex gap-2.5 shrink-0">
                                                <input
                                                    type="text"
                                                    value={chatInput}
                                                    onChange={e => setChatInput(e.target.value)}
                                                    placeholder="Write your customer message..."
                                                    className="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-xl py-2.5 px-4 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 font-bold"
                                                />
                                                <button
                                                    type="submit"
                                                    className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl px-5 h-10 flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-md shadow-sky-100"
                                                >
                                                    <Send className="h-4.5 w-4.5" />
                                                </button>
                                            </form>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex flex-col justify-center items-center text-center p-8 gap-3">
                                            <MessageSquare className="h-10 w-10 text-slate-300" />
                                            <div>
                                                <h4 className="text-xs font-black uppercase text-slate-500">Active chat segment closed</h4>
                                                <p className="text-[10px] text-slate-400 mt-1 font-bold">Select a customer thread from the left-hand sidebar to orchestrate communications.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* --- TAB: ANALYTICS --- */}
                        {activeTab === 'analytics' && (
                            <div className="space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">SaaS Metrics Workspace</h3>

                                <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-2 bg-slate-950/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                                        <h4 className="text-xs font-black uppercase text-slate-300">Sales Trend Last 7 Days</h4>
                                        
                                        {/* Pure CSS/Grid visual Bar Chart representation */}
                                        <div className="h-64 flex items-end gap-6 border-b border-slate-800 pb-2.5 px-5">
                                            {analytics?.sales_trends_7d?.map((t: any, idx: number) => {
                                                const maxRev = Math.max(...(analytics.sales_trends_7d.map((x: any) => x.revenue) || [100]));
                                                const htPct = maxRev > 0 ? (t.revenue / maxRev) * 80 : 0;
                                                return (
                                                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                                                        <div className="text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded shadow">
                                                            ${t.revenue}
                                                        </div>
                                                        <div
                                                            className="w-full bg-gradient-to-t from-sky-600 to-indigo-500 hover:from-sky-500 hover:to-indigo-400 rounded-t-lg transition-all"
                                                            style={{ height: `${Math.max(10, htPct)}%` }}
                                                        />
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                                                            {t.date.split('-').slice(1).join('/')}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                            {(!analytics?.sales_trends_7d || analytics.sales_trends_7d.length === 0) && (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-650">No completed orders logged recently</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Metrics summary card */}
                                    <div className="col-span-1 bg-slate-950/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                                        <h4 className="text-xs font-black uppercase text-slate-300">Fast Redis Analytics</h4>
                                        <p className="text-[10px] text-slate-400 leading-relaxed">Workspace sales, CRM segments, low stock counts, and performance charts are dynamically compiled from Confluent Kafka events and cached inside the Redis cluster with a 5-minute TTL.</p>
                                        
                                        <div className="space-y-2 border-t border-slate-850 pt-4">
                                            <div className="flex justify-between text-xs font-semibold text-slate-300">
                                                <span>Total Workspace Revenue</span>
                                                <span className="text-white font-bold">${analytics?.revenue || '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-semibold text-slate-300">
                                                <span>Average Basket Amount</span>
                                                <span className="text-white font-bold">
                                                    ${analytics?.completed_orders > 0 ? (analytics.revenue / analytics.completed_orders).toFixed(2) : '0.00'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs font-semibold text-slate-300">
                                                <span>Total Customer Retention</span>
                                                <span className="text-white font-bold">{analytics?.customer_count} unique profiles</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: AI WORKSPACE --- */}
                        {activeTab === 'ai' && (
                            <div className="bg-white border border-[#eef0f2] rounded-3xl p-6 space-y-6 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-sky-600 flex items-center justify-center text-white shrink-0 shadow">
                                        <Bot className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Groq AI Workspace Assistants</h3>
                                        <p className="text-[11px] text-slate-500 font-bold">Generate copywriting, analyze local prices, translate profiles, and write marketing pitches.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                    <div className="space-y-4 bg-white border border-sky-100/70 p-5 rounded-2xl shadow-sm hover:border-sky-300 transition-all duration-200">
                                        <h4 className="text-xs font-black uppercase text-sky-600 tracking-wider">Interactive Copywriting Generator</h4>
                                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Submit parameters to auto-generate highly engaging Somali or English description paragraphs for new catalog items.</p>
                                        <button
                                            onClick={() => {
                                                setActiveTab('inventory');
                                                toast('AI generators can be tested inside the Inventory page forms!');
                                            }}
                                            className="px-4 py-2 bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-650 rounded-xl hover:border-slate-400 transition-all flex items-center gap-1.5 cursor-pointer"
                                        >
                                            Go to Product Catalog <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-4 bg-white border border-violet-100/70 p-5 rounded-2xl shadow-sm hover:border-violet-300 transition-all duration-200">
                                        <h4 className="text-xs font-black uppercase text-violet-600 tracking-wider">AI Customer Conversation Summarizer</h4>
                                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Summarize long messaging histories down to single paragraphs highlighting status and customer requirements.</p>
                                        <button
                                            onClick={() => {
                                                setActiveTab('messages');
                                                toast('Chat summarization is built directly into Customer Thread Chats!');
                                            }}
                                            className="px-4 py-2 bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-650 rounded-xl hover:border-slate-400 transition-all flex items-center gap-1.5 cursor-pointer"
                                        >
                                            Go to Unified Chat Hub <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </main>

            {/* --- REGISTER WORKSPACE DIALOG MODAL --- */}
            {isRegisterModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white border border-sky-100 rounded-[28px] max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
                        <button
                            onClick={() => {
                                if (businesses.length > 0) setIsRegisterModalOpen(false);
                            }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-650"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Configure Workspace</h3>
                            <p className="text-[11px] text-slate-500 leading-normal">Register a multi-tenant business workspace instance in the Suqafuran directory.</p>
                        </div>

                        <form onSubmit={handleRegisterBusiness} className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Business Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={registerData.name}
                                        onChange={e => {
                                            const val = e.target.value;
                                            const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                            setRegisterData(prev => ({ ...prev, name: val, slug: generatedSlug }));
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 text-xs py-2 px-3 rounded-lg text-slate-800 mt-1 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unique URL Slug</label>
                                    <input
                                        type="text"
                                        required
                                        value={registerData.slug}
                                        onChange={e => setRegisterData(prev => ({ ...prev, slug: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 text-xs py-2 px-3 rounded-lg text-slate-800 mt-1 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 font-bold"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Workspace Category</label>
                                    <select
                                        value={registerData.category}
                                        onChange={e => setRegisterData(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3 rounded-lg text-slate-800 mt-1 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 font-bold cursor-pointer"
                                    >
                                        <option value="shop">Shop / Retail</option>
                                        <option value="service">Service Provider</option>
                                        <option value="restaurant">Restaurant / Cafe</option>
                                        <option value="freelancer">Freelancer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Address</label>
                                    <input
                                        type="text"
                                        value={registerData.address}
                                        onChange={e => setRegisterData(prev => ({ ...prev, address: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 text-xs py-2 px-3 rounded-lg text-slate-800 mt-1 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 font-bold"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Phone</label>
                                    <input
                                        type="text"
                                        value={registerData.phone}
                                        onChange={e => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 text-xs py-2 px-3 rounded-lg text-slate-800 mt-1 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Email</label>
                                    <input
                                        type="email"
                                        value={registerData.email}
                                        onChange={e => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 text-xs py-2 px-3 rounded-lg text-slate-800 mt-1 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 font-bold"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</label>
                                <textarea
                                    value={registerData.description}
                                    onChange={e => setRegisterData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={2}
                                    className="w-full bg-slate-50 border border-slate-200 text-xs py-2 px-3 rounded-lg text-slate-800 mt-1 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 font-bold"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-sky-100 cursor-pointer"
                            >
                                Setup Workspace Instance
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default BusinessDashboard;
