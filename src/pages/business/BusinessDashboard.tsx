import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
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
    ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
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
    const [kanbanData] = useState<Record<string, BusinessCustomer[]>>({ contacted: [], negotiation: [], offerSent: [], dealClosed: [] });
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
        setupWebSocket();
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [activeBusiness]);

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
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 flex-col gap-4">
                <RefreshCw className="h-10 w-10 animate-spin text-sky-500" />
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Syncing Suqafuran OS...</p>
            </div>
        );
    }

    // ONBOARDING WORKSPACE SCREEN (If no businesses exist)
    if (businesses.length === 0 && !isRegisterModalOpen) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
                {/* Background glow effects */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
                
                <div className="max-w-xl w-full text-center space-y-8 relative z-10">
                    <div className="mx-auto w-20 h-20 rounded-[28px] bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                        <Store className="h-10 w-10 text-white" />
                    </div>
                    
                    <div className="space-y-3">
                        <h1 className="text-4xl font-black tracking-tight text-white font-outfit">
                            Welcome to the Suqafuran <span className="bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">Business Hub</span>
                        </h1>
                        <p className="text-slate-400 text-base leading-relaxed">
                            Configure your enterprise workspace in a single click. Publish catalogs, manage employees with fine-grained roles, orchestrate real-time chats, and leverage advanced Groq AI to double your sales.
                        </p>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-left space-y-4">
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider text-sky-400">Included Core Features</h3>
                        <ul className="grid grid-cols-2 gap-3 text-xs font-medium text-slate-300">
                            <li className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Multi-tenant RBAC Security
                            </li>
                            <li className="flex items-center gap-2">
                                <RefreshCw className="h-4 w-4 text-emerald-500" /> Confluent Kafka Real-Time Stream
                            </li>
                            <li className="flex items-center gap-2">
                                <Bot className="h-4 w-4 text-emerald-500" /> Groq AI Pricing & Description
                            </li>
                            <li className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-emerald-500" /> Fast Redis Analytics Cache
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={() => setIsRegisterModalOpen(true)}
                        className="w-full h-12 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black uppercase text-sm tracking-wider rounded-2xl shadow-xl hover:shadow-sky-500/10 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
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
                                className={`flex items-center gap-3.5 w-full px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 active:scale-[0.98] ${
                                    isSel
                                        ? 'bg-[#f4f4f0] text-[#1a1a1a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]'
                                        : 'text-[#7d7d7d] hover:bg-slate-50 hover:text-[#1a1a1a]'
                                }`}
                            >
                                <Icon className={`h-4.5 w-4.5 ${isSel ? 'text-[#1a1a1a]' : 'text-[#a3a3a3]'}`} />
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
                                <p className="text-[9px] uppercase font-bold tracking-wider text-amber-600 truncate">
                                    {myMembership?.role || 'owner'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="text-[#7d7d7d] hover:text-[#1a1a1a] transition-all p-1 hover:bg-[#f4f4f0] rounded-lg active:scale-95 duration-100"
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
                    <div className="flex items-center gap-3 w-80 bg-[#f4f4f0] px-3.5 py-2 rounded-xl border border-slate-100 hover:bg-[#eaeaea]/40 transition-all duration-200">
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
                            <button className="flex items-center gap-1 hover:text-[#1a1a1a] transition-all duration-150 active:scale-95">
                                <Filter className="h-3.5 w-3.5" /> Sort by
                            </button>
                            <button className="flex items-center gap-1 hover:text-[#1a1a1a] transition-all duration-150 active:scale-95">
                                Filters
                            </button>
                            {activeBusiness && (
                                <span className="text-[10px] font-extrabold bg-[#f4f4f0] border border-slate-200/50 px-2.5 py-1 rounded-full text-[#1a1a1a]">
                                    slug: /{activeBusiness.slug}
                                </span>
                            )}
                        </div>

                        {/* Live Socket Status LED indicator */}
                        <div className="flex items-center gap-2 bg-[#f4f4f0] px-3 py-1 rounded-full border border-slate-200/40">
                            <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-500 shadow-md shadow-emerald-500/20 animate-pulse' : 'bg-rose-500'}`} />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#7d7d7d]">
                                {wsConnected ? 'Broker Online' : 'Syncing'}
                            </span>
                        </div>

                        {/* Marketplace Redirect */}
                        <Link
                            to="/dashboard"
                            className="bg-[#f4f4f0] hover:bg-[#eaeaea] text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wider py-1.5 px-3.5 rounded-xl border border-slate-200/40 transition-all duration-200 active:scale-95"
                        >
                            ← Marketplace
                        </Link>
                    </div>
                </header>

                {/* 2.2 CONTENT BODY SCROLLER */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-900/40">
                    <div className="max-w-7xl mx-auto space-y-6">

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
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: CRM --- */}
                        {activeTab === 'crm' && (
                             <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-lg">
                                 <h3 className="text-lg font-bold text-slate-800 mb-4">CRM Overview</h3>
                                 <div className="grid grid-cols-4 gap-4 mb-6">
                                     <div className="bg-white/60 backdrop-blur rounded-xl p-4 shadow">
                                         <p className="text-xs font-medium text-slate-600">Revenue</p>
                                         <p className="text-2xl font-bold text-slate-800">${analytics?.revenue?.toFixed(2) ?? '0.00'}</p>
                                     </div>
                                     <div className="bg-white/60 backdrop-blur rounded-xl p-4 shadow">
                                         <p className="text-xs font-medium text-slate-600">Orders</p>
                                         <p className="text-2xl font-bold text-slate-800">{analytics?.completed_orders ?? 0}</p>
                                     </div>
                                     <div className="bg-white/60 backdrop-blur rounded-xl p-4 shadow">
                                         <p className="text-xs font-medium text-slate-600">Customers</p>
                                         <p className="text-2xl font-bold text-slate-800">{analytics?.customer_count ?? 0}</p>
                                     </div>
                                     <div className="bg-white/60 backdrop-blur rounded-xl p-4 shadow">
                                         <p className="text-xs font-medium text-slate-600">Loyalty</p>
                                         <p className="text-2xl font-bold text-slate-800">{analytics?.loyalty_score ?? 0}</p>
                                     </div>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4 mb-6">
                                     <div className="bg-white/60 backdrop-blur rounded-xl p-4 flex items-center">
                                         <div className="w-1/2">
                                             <p className="text-xs font-medium text-slate-600">New Customers (Mon-Fri)</p>
                                             <div className="flex space-x-1 mt-2">
                                                 {["Mon","Tue","Wed","Thu","Fri"].map((day)=> (
                                                     <div key={day} className="flex-1 h-4 bg-slate-200 rounded" style={{height: `${Math.random()*60+20}%`}}></div>
                                                 ))}
                                             </div>
                                         </div>
                                     </div>
                                     <div className="bg-white/60 backdrop-blur rounded-xl p-4 flex items-center justify-center">
                                         <svg viewBox="0 0 100 50" className="w-24 h-24">
                                             <path d="M10,45 A40,40 0 0,1 90,45" fill="none" stroke="#e5e7eb" strokeWidth="10"/>
                                             <path d="M10,45 A40,40 0 0,1 90,45" fill="none" stroke="#3b82f6" strokeWidth="10" strokeDasharray="251.2" strokeDashoffset={`${251.2 - (251.2 * (analytics?.deal_success_rate||0)/100)}`}/>
                                             <text x="50" y="30" textAnchor="middle" className="text-sm fill-slate-800 font-bold">{analytics?.deal_success_rate ?? 0}%</text>
                                         </svg>
                                     </div>
                                 </div>
                                 <h4 className="text-md font-semibold text-slate-700 mb-2">Deal Pipeline</h4>
                                 <div className="grid grid-cols-4 gap-4">
                                     {['contacted','negotiation','offerSent','dealClosed'].map(col => (
                                         <div key={col} className="bg-white/60 backdrop-blur rounded-xl p-3 min-h-[200px]">
                                             <h5 className="text-sm font-medium text-slate-600 capitalize mb-2">{col.replace(/([A-Z])/g, ' $1')}</h5>
                                             <div className="space-y-2">
                                                 {kanbanData[col]?.map(cust => (
                                                     <div key={cust.id} className="bg-white border border-slate-200 rounded p-2 shadow-sm hover:shadow-md transition-shadow cursor-move">
                                                         <p className="text-xs font-bold">Customer #{cust.user_id}</p>
                                                         <p className="text-xs text-slate-500">{cust.notes?.slice(0,30)}</p>
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         )}

                        {/* --- TAB: STOREFRONT --- */}
                        {activeTab === 'storefront' && (
                            <div className="bg-slate-950/30 border border-slate-800/80 rounded-2xl p-6 space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">Storefront Design & Settings</h3>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Title</label>
                                            <input
                                                type="text"
                                                value={storefrontData.name ?? activeBusiness?.name ?? ''}
                                                onChange={e => setStorefrontData(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full bg-white border border-slate-300 text-xs py-2.5 px-3.5 rounded-lg text-slate-800 mt-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workspace Bio / Description</label>
                                            <textarea
                                                disabled
                                                rows={3}
                                                className="w-full bg-slate-900 border border-slate-800 text-xs py-2 px-3 rounded-lg text-slate-400 mt-1 cursor-not-allowed"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Phone</label>
                                                <input
                                                    type="text"
                                                    value={activeBusiness?.phone || ''}
                                                    disabled
                                                    className="w-full bg-slate-900 border border-slate-800 text-xs py-2 px-3 rounded-lg text-slate-400 mt-1 cursor-not-allowed"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Email</label>
                                                <input
                                                    type="text"
                                                    value={activeBusiness?.email || ''}
                                                    disabled
                                                    className="w-full bg-slate-900 border border-slate-800 text-xs py-2 px-3 rounded-lg text-slate-400 mt-1 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                                            <h4 className="text-[10px] font-black uppercase text-sky-400 tracking-wider">Public Storefront Metadata</h4>
                                            <div className="space-y-2 text-xs font-semibold text-slate-300">
                                                <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-500" /> Address: {activeBusiness?.address || 'Not mapped'}</p>
                                                <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-500" /> Category: <span className="capitalize">{activeBusiness?.category}</span></p>
                                                <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-slate-500" /> Verified Merchant: {activeBusiness?.is_verified ? 'Yes' : 'Pending Verification'}</p>
                                                <p className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-slate-500" /> Trust Score: {activeBusiness?.trust_score}/100</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center py-8 gap-3">
                                            <Globe className="h-10 w-10 text-indigo-500" />
                                            <div>
                                                <h4 className="text-xs font-black uppercase text-white">Online Digital Storefront</h4>
                                                <p className="text-[10px] text-slate-400 mt-1">This workspace is automatically mapped inside the customer marketplace discover index.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: INVENTORY --- */}
                        {activeTab === 'inventory' && (
                            <div className="grid grid-cols-3 gap-6">
                                {/* Create catalog item card */}
                                <div className="col-span-1 bg-slate-950/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Add Product Entry</h3>
                                    <form onSubmit={handleAddProduct} className="space-y-3">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Name (EN)</label>
                                            <input
                                                type="text"
                                                value={newProduct.name_en}
                                                onChange={e => setNewProduct(prev => ({ ...prev, name_en: e.target.value }))}
                                                required
                                                className="w-full bg-slate-900 border border-slate-800 text-xs py-2 px-3 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 mt-1"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                                    Price ($) 
                                                    <button
                                                        type="button"
                                                        onClick={handleAISuggestPrice}
                                                        className="text-[9px] font-black text-sky-400 uppercase hover:underline"
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
                                                    className="w-full bg-slate-900 border border-slate-800 text-xs py-2 px-3 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 mt-1"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU Code</label>
                                                <input
                                                    type="text"
                                                    value={newProduct.sku}
                                                    onChange={e => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
                                                    className="w-full bg-slate-900 border border-slate-800 text-xs py-2 px-3 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 mt-1"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                                Description 
                                                <button
                                                    type="button"
                                                    onClick={handleAIGenerateDescription}
                                                    className="text-[9px] font-black text-sky-400 uppercase hover:underline"
                                                >
                                                    {aiGeneratingDesc ? '...' : 'AI Generate'}
                                                </button>
                                            </label>
                                            <textarea
                                                value={newProduct.description_en}
                                                onChange={e => setNewProduct(prev => ({ ...prev, description_en: e.target.value }))}
                                                rows={3}
                                                className="w-full bg-slate-900 border border-slate-800 text-xs py-2 px-3 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 mt-1"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Level</label>
                                                <input
                                                    type="number"
                                                    value={newProduct.stock_level}
                                                    onChange={e => setNewProduct(prev => ({ ...prev, stock_level: e.target.value }))}
                                                    required
                                                    className="w-full bg-slate-900 border border-slate-800 text-xs py-2 px-3 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 mt-1"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Low Stock Min</label>
                                                <input
                                                    type="number"
                                                    value={newProduct.low_stock_threshold}
                                                    onChange={e => setNewProduct(prev => ({ ...prev, low_stock_threshold: e.target.value }))}
                                                    required
                                                    className="w-full bg-slate-900 border border-slate-800 text-xs py-2 px-3 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 mt-1"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <Plus className="h-4 w-4" /> Save Product Record
                                        </button>
                                    </form>
                                </div>

                                {/* Catalog catalog grid */}
                                <div className="col-span-2 bg-slate-950/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Catalog Catalog</h3>
                                    
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
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
                                                        <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-900/30 text-slate-300 font-medium">
                                                            <td className="py-3">
                                                                <div className="font-bold text-white">{p.name_en}</div>
                                                                <div className="text-[10px] text-slate-500 max-w-[200px] truncate">{p.description_en}</div>
                                                            </td>
                                                            <td className="font-bold text-white">${p.price}</td>
                                                            <td>
                                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                                                    isLow ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                                                                }`}>
                                                                    {p.stock_level} Unit{p.stock_level !== 1 ? 's' : ''} {isLow ? '(LOW)' : ''}
                                                                </span>
                                                            </td>
                                                            <td>{p.sku || 'N/A'}</td>
                                                            <td>
                                                                <div className="text-[10px] text-slate-400 space-y-0.5">
                                                                    <p>Views: {p.views}</p>
                                                                    <p>Sales: {p.sales}</p>
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
                        )}

                        {/* --- TAB: ORDERS --- */}
                        {activeTab === 'orders' && (
                            <div className="bg-slate-950/30 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">Workspace Order History</h3>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
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
                                                <tr key={o.id} className="border-b border-slate-800/50 hover:bg-slate-900/30 text-slate-300 font-medium">
                                                    <td className="py-3 font-bold text-white">#{o.id}</td>
                                                    <td>
                                                        <div>ID: {o.customer_id}</div>
                                                        {o.notes && <div className="text-[10px] text-slate-500">Note: {o.notes}</div>}
                                                    </td>
                                                    <td>
                                                        <div className="space-y-0.5">
                                                            {o.items?.map((item: any, idx: number) => (
                                                                <div key={idx} className="text-slate-400">
                                                                    {item.qty}x {item.name || `Product ${item.product_id}`}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="font-bold text-white">${o.total_amount}</td>
                                                    <td className="capitalize">{o.payment_method}</td>
                                                    <td>
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                            o.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                                            o.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 
                                                            o.status === 'processing' ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-400'
                                                        }`}>
                                                            {o.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {o.status !== 'completed' && o.status !== 'cancelled' && (
                                                            <div className="flex gap-1.5">
                                                                {o.status === 'pending' && (
                                                                    <button
                                                                        onClick={() => handleChangeOrderStatus(o.id, 'processing')}
                                                                        className="px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white text-[9px] font-black uppercase tracking-wider rounded transition-all"
                                                                    >
                                                                        Process
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleChangeOrderStatus(o.id, 'completed')}
                                                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider rounded transition-all"
                                                                >
                                                                    Complete
                                                                </button>
                                                                <button
                                                                    onClick={() => handleChangeOrderStatus(o.id, 'cancelled')}
                                                                    className="px-2 py-1 bg-rose-950 text-rose-400 text-[9px] font-black uppercase tracking-wider rounded transition-all"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: CRM / CUSTOMERS --- */}
                        {activeTab === 'crm' && (
                            <div className="bg-slate-950/30 border border-slate-800/80 rounded-2xl p-6 space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">CRM - Customer Profiles</h3>
                                
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-2 space-y-4">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                                                        <th className="py-2.5">User ID</th>
                                                        <th>Segment</th>
                                                        <th>Purchase History</th>
                                                        <th>Loyalty Points</th>
                                                        <th>Relationship Notes</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {customers.map(c => (
                                                        <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-900/30 text-slate-300 font-medium">
                                                            <td className="py-3 font-bold text-white">Customer #{c.user_id}</td>
                                                            <td>
                                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                                                    c.segmentation === 'VIP' ? 'bg-amber-500/20 text-amber-400' :
                                                                    c.segmentation === 'regular' ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-400'
                                                                }`}>
                                                                    {c.segmentation}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div className="space-y-0.5">
                                                                    <p>Orders: {c.total_orders}</p>
                                                                    <p className="font-bold text-white">Spent: ${c.total_spent}</p>
                                                                </div>
                                                            </td>
                                                            <td>{c.loyalty_score} pts</td>
                                                            <td className="max-w-[150px] truncate">{c.notes || 'None logged'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* CRM Actions */}
                                    <div className="col-span-1 bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-4">
                                        <h4 className="text-xs font-black uppercase text-sky-400 tracking-wider">Configure Loyalty & Segments</h4>
                                        <p className="text-[10px] text-slate-400">Customer segments (New, Regular, VIP, Inactive) are automatically updated in real-time by the Confluent Kafka broker as manual or marketplace purchases complete.</p>
                                        <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg text-[10px] font-medium text-slate-300 leading-relaxed">
                                            VIP triggers automatically at 5+ completed orders. Loyalty calculations reward 10 points for every $100 spent.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: TEAM ROSTER --- */}
                        {activeTab === 'team' && (
                            <div className="grid grid-cols-3 gap-6">
                                {/* Invite employee card */}
                                <div className="col-span-1 bg-slate-950/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Invite Workspace Worker</h3>
                                    <form onSubmit={handleInviteEmployee} className="space-y-3">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                                            <input
                                                type="email"
                                                value={newInvite.email}
                                                onChange={e => setNewInvite(prev => ({ ...prev, email: e.target.value }))}
                                                className="w-full bg-slate-900 border border-slate-800 text-xs py-2 px-3 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 mt-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                                            <input
                                                type="text"
                                                value={newInvite.phone}
                                                onChange={e => setNewInvite(prev => ({ ...prev, phone: e.target.value }))}
                                                className="w-full bg-slate-900 border border-slate-800 text-xs py-2 px-3 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 mt-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RBAC Role Privilege</label>
                                            <select
                                                value={newInvite.role}
                                                onChange={e => setNewInvite(prev => ({ ...prev, role: e.target.value }))}
                                                required
                                                className="w-full bg-slate-900 border border-slate-800 text-xs py-2 px-3 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 mt-1"
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
                                            className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <UserPlus className="h-4 w-4" /> Send Invite
                                        </button>
                                    </form>
                                </div>

                                {/* Active roster list */}
                                <div className="col-span-2 bg-slate-950/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Active Roster & Performance</h3>
                                    
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                                                    <th className="py-2.5">Worker Name</th>
                                                    <th>Role</th>
                                                    <th>Status</th>
                                                    <th>Sales Logged</th>
                                                    <th>Chat Responses</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {employees.map(e => (
                                                    <tr key={e.id} className="border-b border-slate-800/50 hover:bg-slate-900/30 text-slate-300 font-medium">
                                                        <td className="py-3">
                                                            <div className="font-bold text-white">ID: {e.user_id || 'Pending Invite'}</div>
                                                            <div className="text-[10px] text-slate-500">{e.invite_email || e.invite_phone}</div>
                                                        </td>
                                                        <td className="uppercase font-black text-amber-500 text-[10px] tracking-wider">{e.role}</td>
                                                        <td>
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                                                e.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                                                            }`}>
                                                                {e.is_active ? 'Active' : 'Pending Invite'}
                                                            </span>
                                                        </td>
                                                        <td className="font-bold">${e.performance_sales}</td>
                                                        <td>{e.performance_responses} times</td>
                                                    </tr>
                                                ))}
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
                                <div className="bg-slate-950/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Log Team Task</h3>
                                    <form onSubmit={handleCreateTask} className="flex gap-4 items-end">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Title</label>
                                            <input
                                                type="text"
                                                value={newTask.title}
                                                onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                                                required
                                                placeholder="Describe actions needed..."
                                                className="w-full bg-slate-900 border border-slate-800 text-xs py-2 px-3 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 mt-1"
                                            />
                                        </div>
                                        <div className="w-48">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kanban Column</label>
                                            <select
                                                value={newTask.status}
                                                onChange={e => setNewTask(prev => ({ ...prev, status: e.target.value as any }))}
                                                className="w-full bg-slate-900 border border-slate-800 text-xs py-2.5 px-3 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 mt-1"
                                            >
                                                <option value="todo">Todo</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="review">Review</option>
                                                <option value="done">Done</option>
                                            </select>
                                        </div>
                                        <button
                                            type="submit"
                                            className="py-2.5 px-6 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shrink-0"
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
                                            <div key={col} className="bg-slate-950/20 border border-slate-800 rounded-2xl p-4 space-y-4">
                                                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 capitalize">
                                                        {col.replace('_', ' ')}
                                                    </h4>
                                                    <span className="text-[10px] font-black bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                                                        {list.length}
                                                    </span>
                                                </div>

                                                <div className="space-y-2 min-h-[300px]">
                                                    {list.map(t => (
                                                        <div key={t.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-sm space-y-3">
                                                            <div className="text-xs font-bold text-white leading-snug">{t.title}</div>
                                                            {t.description && <p className="text-[10px] text-slate-400 leading-normal">{t.description}</p>}
                                                            
                                                            <div className="flex gap-1 pt-1.5 border-t border-slate-850 justify-end">
                                                                {col !== 'todo' && (
                                                                    <button
                                                                        onClick={() => handleMoveTask(t.id, col === 'in_progress' ? 'todo' : col === 'review' ? 'in_progress' : 'review')}
                                                                        className="text-[9px] font-extrabold text-slate-500 hover:text-slate-300 px-1"
                                                                    >
                                                                        ← Move
                                                                    </button>
                                                                )}
                                                                {col !== 'done' && (
                                                                    <button
                                                                        onClick={() => handleMoveTask(t.id, col === 'todo' ? 'in_progress' : col === 'in_progress' ? 'review' : 'done')}
                                                                        className="text-[9px] font-extrabold text-sky-400 hover:text-sky-300 px-1 ml-auto"
                                                                    >
                                                                        Move →
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {list.length === 0 && (
                                                        <div className="text-center py-10 text-[10px] text-slate-600 font-medium">Column Empty</div>
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
                            <div className="bg-slate-950/30 border border-slate-800 rounded-2xl h-[550px] flex overflow-hidden">
                                {/* Chats list sidebar */}
                                <div className="w-72 border-r border-slate-800 flex flex-col shrink-0">
                                    <div className="p-4 border-b border-slate-850">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Customer Threads</h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                        {customers.map(c => {
                                            const isSel = activeCustomerId === c.user_id;
                                            return (
                                                <button
                                                    key={c.id}
                                                    onClick={() => setActiveCustomerId(c.user_id)}
                                                    className={`w-full text-left p-3 rounded-xl transition-all ${
                                                        isSel ? 'bg-slate-900 border border-slate-800' : 'hover:bg-slate-900/40'
                                                    }`}
                                                >
                                                    <div className="text-xs font-bold text-white">Customer #{c.user_id}</div>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-[9px] font-black uppercase text-amber-500">{c.segmentation} Segment</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        {customers.length === 0 && (
                                            <div className="text-center py-10 text-slate-650 text-[11px]">No customer logs registered</div>
                                        )}
                                    </div>
                                </div>

                                {/* Active chat conversation panel */}
                                <div className="flex-1 flex flex-col min-w-0 bg-slate-950/20">
                                    {activeCustomerId !== null ? (
                                        <>
                                            {/* Chat Header details */}
                                            <div className="p-4 border-b border-slate-850 flex justify-between items-center shrink-0">
                                                <div>
                                                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Customer #{activeCustomerId}</h4>
                                                    <p className="text-[10px] text-slate-400">Multiplexed Real-Time WebSocket Channel</p>
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleAISummarizeChat}
                                                        disabled={aiSummarizingChat}
                                                        className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-[9px] font-black uppercase tracking-wider rounded hover:bg-slate-800 text-sky-400"
                                                    >
                                                        {aiSummarizingChat ? 'Summarizing...' : 'AI Summarize'}
                                                    </button>
                                                    <button
                                                        onClick={handleAISuggestReply}
                                                        disabled={aiSuggestingReply}
                                                        className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-[9px] font-black uppercase tracking-wider rounded hover:bg-slate-800 text-indigo-400"
                                                    >
                                                        {aiSuggestingReply ? 'Drafting...' : 'AI Suggest Reply'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* AI Summary display if exists */}
                                            {aiSummaryText && (
                                                <div className="p-3 bg-indigo-950/30 border-b border-indigo-900/50 flex gap-2.5 items-start text-[11px] font-medium text-slate-200">
                                                    <Sparkles className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <span className="font-bold text-indigo-400">Groq AI Conversation Summary:</span> {aiSummaryText}
                                                    </div>
                                                    <button onClick={() => setAiSummaryText('')} className="text-slate-500 hover:text-slate-300">
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
                                                                    ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white rounded-tr-none'
                                                                    : 'bg-slate-900 text-slate-200 border border-slate-850 rounded-tl-none'
                                                            }`}>
                                                                <p>{msg.content}</p>
                                                                <span className="text-[8px] text-white/50 block text-right mt-1.5 font-bold uppercase tracking-widest">
                                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {(customerChats[activeCustomerId] || []).length === 0 && (
                                                    <div className="text-center py-20 text-slate-650 text-xs">Send a message to open conversation</div>
                                                )}
                                            </div>

                                            {/* AI Suggested replies array */}
                                            {aiSuggestedReplyList.length > 0 && (
                                                <div className="p-3 bg-slate-900 border-t border-slate-850 space-y-2 max-h-24 overflow-y-auto">
                                                    <p className="text-[9px] font-black uppercase text-indigo-400 tracking-wider">AI Suggested Quick Replies:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {aiSuggestedReplyList.map((reply, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => {
                                                                    setChatInput(reply);
                                                                    setAiSuggestedReplyList([]);
                                                                }}
                                                                className="px-2 py-1 bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:text-white rounded-lg hover:border-slate-600 text-left truncate max-w-xs"
                                                            >
                                                                {reply}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Chat input box */}
                                            <form onSubmit={handleSendCustomerMessage} className="p-4 border-t border-slate-850 bg-slate-950/40 flex gap-2.5 shrink-0">
                                                <input
                                                    type="text"
                                                    value={chatInput}
                                                    onChange={e => setChatInput(e.target.value)}
                                                    placeholder="Write your customer message..."
                                                    className="flex-1 bg-slate-900 border border-slate-800 text-xs rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                                />
                                                <button
                                                    type="submit"
                                                    className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl px-5 h-10 flex items-center justify-center transition-all shrink-0 cursor-pointer"
                                                >
                                                    <Send className="h-4.5 w-4.5" />
                                                </button>
                                            </form>
                                        </>
                                    ) : (
                                        <div className="flex-1 flex flex-col justify-center items-center text-center p-8 gap-3">
                                            <MessageSquare className="h-10 w-10 text-slate-700" />
                                            <div>
                                                <h4 className="text-xs font-black uppercase text-slate-400">Active chat segment closed</h4>
                                                <p className="text-[10px] text-slate-650 mt-1">Select a customer thread from the left-hand sidebar to orchestrate communications.</p>
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
                            <div className="bg-slate-950/30 border border-slate-800 rounded-2xl p-6 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow">
                                        <Bot className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-wider text-white">Groq AI Workspace Assistants</h3>
                                        <p className="text-[11px] text-slate-400">Generate copywriting, analyze local prices, translate profiles, and write marketing pitches.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-850">
                                    <div className="space-y-4 bg-slate-900/30 border border-slate-850 p-5 rounded-2xl">
                                        <h4 className="text-xs font-black uppercase text-sky-400 tracking-wider">Interactive Copywriting Generator</h4>
                                        <p className="text-[10px] text-slate-400">Submit parameters to auto-generate highly engaging Somali or English description paragraphs for new catalog items.</p>
                                        <button
                                            onClick={() => {
                                                setActiveTab('inventory');
                                                toast('AI generators can be tested inside the Inventory page forms!');
                                            }}
                                            className="px-4 py-2 bg-slate-950 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-200 rounded-xl hover:border-slate-600 transition-all flex items-center gap-1.5"
                                        >
                                            Go to Product Catalog <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-4 bg-slate-900/30 border border-slate-850 p-5 rounded-2xl">
                                        <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">AI Customer Conversation Summarizer</h4>
                                        <p className="text-[10px] text-slate-400">Summarize long messaging histories down to single paragraphs highlighting status and customer requirements.</p>
                                        <button
                                            onClick={() => {
                                                setActiveTab('messages');
                                                toast('Chat summarization is built directly into Customer Thread Chats!');
                                            }}
                                            className="px-4 py-2 bg-slate-950 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-200 rounded-xl hover:border-slate-600 transition-all flex items-center gap-1.5"
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
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-[28px] max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
                        <button
                            onClick={() => {
                                if (businesses.length > 0) setIsRegisterModalOpen(false);
                            }}
                            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-white uppercase tracking-wider">Configure Workspace</h3>
                            <p className="text-[11px] text-slate-400 leading-normal">Register a multi-tenant business workspace instance in the Suqafuran directory.</p>
                        </div>

                        <form onSubmit={handleRegisterBusiness} className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={registerData.name}
                                        onChange={e => {
                                            const val = e.target.value;
                                            const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                            setRegisterData(prev => ({ ...prev, name: val, slug: generatedSlug }));
                                        }}
                                        className="w-full bg-slate-950 border border-slate-800 text-xs py-2 px-3 rounded-lg text-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unique URL Slug</label>
                                    <input
                                        type="text"
                                        required
                                        value={registerData.slug}
                                        onChange={e => setRegisterData(prev => ({ ...prev, slug: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-800 text-xs py-2 px-3 rounded-lg text-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workspace Category</label>
                                    <select
                                        value={registerData.category}
                                        onChange={e => setRegisterData(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-800 text-xs py-2.5 px-3 rounded-lg text-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                    >
                                        <option value="shop">Shop / Retail</option>
                                        <option value="service">Service Provider</option>
                                        <option value="restaurant">Restaurant / Cafe</option>
                                        <option value="freelancer">Freelancer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</label>
                                    <input
                                        type="text"
                                        value={registerData.address}
                                        onChange={e => setRegisterData(prev => ({ ...prev, address: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-800 text-xs py-2 px-3 rounded-lg text-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Phone</label>
                                    <input
                                        type="text"
                                        value={registerData.phone}
                                        onChange={e => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-800 text-xs py-2 px-3 rounded-lg text-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Email</label>
                                    <input
                                        type="email"
                                        value={registerData.email}
                                        onChange={e => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-800 text-xs py-2 px-3 rounded-lg text-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                                <textarea
                                    value={registerData.description}
                                    onChange={e => setRegisterData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={2}
                                    className="w-full bg-slate-950 border border-slate-800 text-xs py-2 px-3 rounded-lg text-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black uppercase tracking-wider rounded-xl transition-all"
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
