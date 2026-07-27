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
    ShieldCheck,
    Copy,
    AlertCircle,
    ExternalLink,
    Image as ImageIcon,
    Tag,
    Camera,
    Loader2,
    Menu
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';
import { getImageUrl } from '../../utils/imageUtils';
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

    // AI Copilot standalone tool state
    const [copilotDescName, setCopilotDescName] = useState('');
    const [copilotDescContext, setCopilotDescContext] = useState('');
    const [copilotDescOutput, setCopilotDescOutput] = useState('');
    const [copilotDescLoading, setCopilotDescLoading] = useState(false);
    const [copilotPriceName, setCopilotPriceName] = useState('');
    const [copilotPriceCategory, setCopilotPriceCategory] = useState('shop');
    const [copilotPriceOutput, setCopilotPriceOutput] = useState<number | null>(null);
    const [copilotPriceLoading, setCopilotPriceLoading] = useState(false);

    // Mobile sidebar toggle
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // CRM & global search state
    const [activeCrmCustomer, setActiveCrmCustomer] = useState<BusinessCustomer | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [crmNotes, setCrmNotes] = useState('');
    const [savingCrmNotes, setSavingCrmNotes] = useState(false);

    // Storefront link copy & settings saving states
    const [copiedLink, setCopiedLink] = useState(false);
    const [savingStorefront, setSavingStorefront] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

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
                show_in_nearby: storefrontData.show_in_nearby,
                description: storefrontData.description,
                phone: storefrontData.phone,
                email: storefrontData.email,
                address: storefrontData.address,
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

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!activeBusiness || !e.target.files?.[0]) return;
        setUploadingLogo(true);
        try {
            const { url } = await listingService.uploadImage(e.target.files[0]);
            const updated = await businessService.updateBusiness(activeBusiness.id, { logo_url: url });
            setActiveBusiness(updated);
            setBusinesses(prev => prev.map(b => b.id === updated.id ? updated : b));
            toast.success('Shop logo updated!');
        } catch {
            toast.error('Failed to upload logo');
        } finally {
            setUploadingLogo(false);
            if (logoInputRef.current) logoInputRef.current.value = '';
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!activeBusiness || !e.target.files?.[0]) return;
        setUploadingBanner(true);
        try {
            const { url } = await listingService.uploadImage(e.target.files[0]);
            const updated = await businessService.updateBusiness(activeBusiness.id, { banner_url: url });
            setActiveBusiness(updated);
            setBusinesses(prev => prev.map(b => b.id === updated.id ? updated : b));
            toast.success('Shop banner updated!');
        } catch {
            toast.error('Failed to upload banner');
        } finally {
            setUploadingBanner(false);
            if (bannerInputRef.current) bannerInputRef.current.value = '';
        }
    };

    // Keep storefrontData in sync with activeBusiness shifts
    useEffect(() => {
        if (activeBusiness) {
            setStorefrontData({
                name: activeBusiness.name,
                show_in_nearby: activeBusiness.show_in_nearby,
                description: activeBusiness.description,
                phone: activeBusiness.phone,
                email: activeBusiness.email,
                address: activeBusiness.address,
            });
        }
    }, [activeBusiness]);

    useEffect(() => {
        setCrmNotes(activeCrmCustomer?.notes || '');
    }, [activeCrmCustomer]);

    useEffect(() => {
        setSearchQuery('');
    }, [activeTab]);

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

    // AI Copilot — standalone description generator
    const handleCopilotGenerateDesc = async () => {
        if (!activeBusiness || !copilotDescName.trim()) { toast.error('Enter a product name first'); return; }
        setCopilotDescLoading(true);
        try {
            const text = await businessService.aiGenerateDescription(
                activeBusiness.id,
                `Write a compelling product description for: ${copilotDescName}.${copilotDescContext ? ' Additional context: ' + copilotDescContext : ''}`
            );
            setCopilotDescOutput(text);
        } catch { toast.error('AI description generator offline'); }
        finally { setCopilotDescLoading(false); }
    };

    // AI Copilot — standalone price advisor
    const handleCopilotSuggestPrice = async () => {
        if (!activeBusiness || !copilotPriceName.trim()) { toast.error('Enter a product name first'); return; }
        setCopilotPriceLoading(true);
        try {
            const result = await businessService.aiSuggestPrice(activeBusiness.id, copilotPriceName, copilotPriceCategory);
            if (result?.suggested_price) { setCopilotPriceOutput(result.suggested_price); }
            else { toast.error('AI could not estimate a price for this item'); }
        } catch { toast.error('Price advisor offline'); }
        finally { setCopilotPriceLoading(false); }
    };

    // Save CRM customer notes
    const handleSaveCrmNotes = async () => {
        if (!activeBusiness || !activeCrmCustomer) return;
        setSavingCrmNotes(true);
        try {
            const updated = await businessService.updateCustomerNotes(activeBusiness.id, activeCrmCustomer.id, crmNotes);
            setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
            setActiveCrmCustomer(updated);
            toast.success('Customer notes saved!');
        } catch {
            toast.error('Failed to save notes');
        } finally {
            setSavingCrmNotes(false);
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

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* 1. SAAS MASTER SIDEBAR */}
            <aside className={cn(
                "fixed md:relative inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#f0f0ee] flex flex-col shrink-0 transition-transform duration-300",
                sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
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
                <header className="h-14 md:h-16 shrink-0 border-b border-[#f0f0ee] bg-white flex items-center justify-between px-3 md:px-6 gap-3">
                    {/* Hamburger (mobile only) */}
                    <button
                        className="md:hidden p-2 rounded-lg text-[#7d7d7d] hover:bg-slate-50 active:scale-95 shrink-0"
                        onClick={() => setSidebarOpen(v => !v)}
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    {/* Search Bar */}
                    <div className="hidden md:flex items-center gap-3 w-72 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100 transition-all duration-200">
                        <svg className="h-4 w-4 text-[#7d7d7d] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder={
                                activeTab === 'crm' ? "Search customer..." :
                                activeTab === 'inventory' ? "Search products..." : "Search workspace..."
                            }
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs font-bold text-[#1a1a1a] placeholder-[#7d7d7d] w-full"
                        />
                    </div>

                    {/* Active tab label on mobile */}
                    <span className="md:hidden text-sm font-black text-[#1a1a1a] capitalize truncate flex-1">
                        {activeTab.replace('_', ' ')}
                    </span>

                    {/* Right Controls */}
                    <div className="flex items-center gap-2 md:gap-4">
                        {/* Live Socket Status LED */}
                        <div className={cn(
                            "flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-full border",
                            wsConnected
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100/50"
                                : "bg-rose-50 text-rose-700 border-rose-100/50"
                        )}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            <span className="hidden md:inline text-[9px] font-black uppercase tracking-widest">
                                {wsConnected ? 'Broker Online' : 'Syncing'}
                            </span>
                        </div>

                        {/* Marketplace Redirect */}
                        <Link
                            to="/dashboard"
                            className="bg-orange-50 hover:bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest py-1.5 px-2.5 md:px-3.5 rounded-xl border border-orange-100/50 transition-all duration-200 active:scale-95 shadow-sm whitespace-nowrap"
                        >
                            ← Market
                        </Link>
                    </div>
                </header>

                {/* 2.2 CONTENT BODY SCROLLER */}
                <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-slate-50">
                    <div className="w-full space-y-4 md:space-y-6">

                        {/* --- TAB: OVERVIEW --- */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Stats Metrics Cards Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
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
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                                    {/* Quick Order Logging Widget */}
                                    <div className="lg:col-span-1 bg-white border border-[#f0f0ee] rounded-[24px] p-4 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.015)] space-y-5">
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
                                    <div className="lg:col-span-2 bg-white border border-[#f0f0ee] rounded-[24px] p-4 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.015)] space-y-5">
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
                                                            <td className="font-bold text-[#1a1a1a]">${Number(o.total_amount).toFixed(2)}</td>
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

                                {/* Profile Picture & Banner Upload */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Shop Profile Picture & Banner</label>
                                    <div className="flex items-center gap-4">
                                        {/* Logo */}
                                        <div className="relative shrink-0">
                                            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
                                                {activeBusiness?.logo_url ? (
                                                    <img src={getImageUrl(activeBusiness.logo_url)} alt="logo" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full text-white font-black text-2xl uppercase flex items-center justify-center" style={{ backgroundColor: activeBusiness?.brand_color || '#2563eb' }}>
                                                        {activeBusiness?.name?.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => logoInputRef.current?.click()}
                                                disabled={uploadingLogo}
                                                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-orange-500 hover:bg-orange-600 border-2 border-white text-white flex items-center justify-center shadow-md active:scale-90 transition-all disabled:opacity-60"
                                            >
                                                {uploadingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                                            </button>
                                            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                            <p className="text-[9px] text-slate-400 font-bold text-center mt-2">Logo</p>
                                        </div>

                                        {/* Banner */}
                                        <div className="relative flex-1">
                                            <div className="w-full h-20 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
                                                {activeBusiness?.banner_url ? (
                                                    <img src={getImageUrl(activeBusiness.banner_url)} alt="banner" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1 text-slate-300">
                                                        <ImageIcon className="h-6 w-6" />
                                                        <span className="text-[9px] font-bold">No banner set</span>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => bannerInputRef.current?.click()}
                                                disabled={uploadingBanner}
                                                className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 hover:bg-black/70 text-white text-[9px] font-black px-2 py-1 rounded-lg active:scale-95 transition-all disabled:opacity-60"
                                            >
                                                {uploadingBanner ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                                                {uploadingBanner ? 'Uploading...' : 'Change Banner'}
                                            </button>
                                            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                                            <p className="text-[9px] text-slate-400 font-bold mt-2">Banner (shown at top of your shop page)</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                                                value={storefrontData.description ?? ''}
                                                onChange={e => setStorefrontData(prev => ({ ...prev, description: e.target.value }))}
                                                rows={3}
                                                placeholder="Describe your business..."
                                                className="w-full bg-slate-50 border border-slate-200 text-xs py-2 px-3 rounded-xl text-slate-800 mt-1.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium resize-none"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Phone</label>
                                                <input
                                                    type="text"
                                                    value={storefrontData.phone ?? ''}
                                                    onChange={e => setStorefrontData(prev => ({ ...prev, phone: e.target.value }))}
                                                    placeholder="+252..."
                                                    className="w-full bg-slate-50 border border-slate-200 text-xs py-2 px-3 rounded-xl text-slate-800 mt-1.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Email</label>
                                                <input
                                                    type="email"
                                                    value={storefrontData.email ?? ''}
                                                    onChange={e => setStorefrontData(prev => ({ ...prev, email: e.target.value }))}
                                                    placeholder="shop@example.com"
                                                    className="w-full bg-slate-50 border border-slate-200 text-xs py-2 px-3 rounded-xl text-slate-800 mt-1.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Physical Address</label>
                                            <input
                                                type="text"
                                                value={storefrontData.address ?? ''}
                                                onChange={e => setStorefrontData(prev => ({ ...prev, address: e.target.value }))}
                                                placeholder="Street, City, Country"
                                                className="w-full bg-slate-50 border border-slate-200 text-xs py-2 px-3 rounded-xl text-slate-800 mt-1.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium"
                                            />
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
                                            disabled={savingStorefront}
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
                                            {myListings.filter(l => !searchQuery || l.title_en?.toLowerCase().includes(searchQuery.toLowerCase()) || l.title_so?.toLowerCase().includes(searchQuery.toLowerCase())).map(listing => {
                                                const thumb = listing.images?.[0];
                                                const statusColor = listing.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : listing.status === 'pending'
                                                    ? 'bg-orange-50 text-orange-600 border-orange-100'
                                                    : 'bg-slate-100 text-slate-500 border-slate-200';
                                                return (
                                                    <Link
                                                        key={listing.id}
                                                        to={`/listing/${listing.id}`}
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
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                                {/* Create catalog item card */}
                                <div className="lg:col-span-1 bg-white border border-[#eef0f2] shadow-[0_8px_30px_rgba(0,0,0,0.015)] rounded-3xl p-4 md:p-6 space-y-5">
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
                                <div className="lg:col-span-2 bg-white border border-[#eef0f2] shadow-[0_8px_30px_rgba(0,0,0,0.015)] rounded-3xl p-4 md:p-6 space-y-5">
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
                                                {products.filter(p => !searchQuery || p.name_en.toLowerCase().includes(searchQuery.toLowerCase()) || (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase())).map(p => {
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
                                                    <td className="font-extrabold text-slate-950">${Number(o.total_amount).toFixed(2)}</td>
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

                        {/* --- TAB: CRM / CUSTOMERS --- */}
                        {activeTab === 'crm' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in-up">
                                {/* Customer list panel */}
                                <div className="bg-white border border-[#eef0f2] shadow-[0_8px_30px_rgba(0,0,0,0.015)] rounded-3xl flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
                                    <div className="p-4 border-b border-slate-100 shrink-0">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Customer Profiles</h3>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{customers.length} registered</p>
                                    </div>
                                    <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                                        {customers
                                            .filter(c => !searchQuery ||
                                                String(c.user_id).includes(searchQuery) ||
                                                c.segmentation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                (c.notes || '').toLowerCase().includes(searchQuery.toLowerCase()))
                                            .map(c => {
                                                const segColors: Record<string, string> = {
                                                    new: 'bg-sky-50 text-sky-700 border-sky-100',
                                                    regular: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                                                    VIP: 'bg-amber-50 text-amber-700 border-amber-100',
                                                    inactive: 'bg-slate-100 text-slate-500 border-slate-200',
                                                };
                                                const isSel = activeCrmCustomer?.id === c.id;
                                                return (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => setActiveCrmCustomer(c)}
                                                        className={`w-full text-left p-4 transition-all duration-150 border-l-2 ${isSel ? 'bg-orange-50/80 border-l-orange-400' : 'hover:bg-slate-50 border-l-transparent'}`}
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-xs font-black text-slate-900 truncate">Customer #{c.user_id}</span>
                                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border shrink-0 ${segColors[c.segmentation] || segColors.new}`}>
                                                                {c.segmentation}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2 mt-1.5 text-[10px] text-slate-500 font-semibold">
                                                            <span>{c.total_orders} orders</span>
                                                            <span>·</span>
                                                            <span>${c.total_spent.toFixed(2)} spent</span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        {customers.length === 0 && (
                                            <div className="py-16 text-center text-slate-400 text-[11px] font-bold italic px-4">
                                                No customers yet. They appear here after their first order.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Customer detail panel */}
                                <div className="lg:col-span-2 space-y-4">
                                    {activeCrmCustomer ? (
                                        <>
                                            {/* Header */}
                                            <div className="bg-white border border-[#eef0f2] rounded-2xl p-4 md:p-5 flex items-center justify-between shadow-sm">
                                                <div>
                                                    <h3 className="text-sm font-black text-slate-900">Customer #{activeCrmCustomer.user_id}</h3>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        Joined {new Date(activeCrmCustomer.created_at).toLocaleDateString()}
                                                        {activeCrmCustomer.last_purchase_at && ` · Last purchase ${new Date(activeCrmCustomer.last_purchase_at).toLocaleDateString()}`}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => { setActiveCustomerId(activeCrmCustomer.user_id); setActiveTab('messages'); }}
                                                    className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-md shadow-orange-100 active:scale-95 cursor-pointer"
                                                >
                                                    <MessageSquare className="h-3.5 w-3.5" /> Open Chat
                                                </button>
                                            </div>

                                            {/* Stats */}
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { label: 'Total Orders', value: activeCrmCustomer.total_orders, color: 'text-orange-600' },
                                                    { label: 'Total Spent', value: `$${activeCrmCustomer.total_spent.toFixed(2)}`, color: 'text-emerald-600' },
                                                    { label: 'Loyalty Score', value: activeCrmCustomer.loyalty_score, color: 'text-sky-600' },
                                                ].map(({ label, value, color }) => (
                                                    <div key={label} className="bg-white border border-[#eef0f2] rounded-2xl p-4 shadow-sm text-center">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                                                        <p className={`text-xl font-black mt-1 ${color}`}>{value}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Notes */}
                                            <div className="bg-white border border-[#eef0f2] rounded-2xl p-4 shadow-sm space-y-3">
                                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Internal Notes</h4>
                                                <textarea
                                                    value={crmNotes}
                                                    onChange={e => setCrmNotes(e.target.value)}
                                                    rows={3}
                                                    placeholder="Add private notes about this customer..."
                                                    className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3.5 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 font-medium resize-none transition-all"
                                                />
                                                <button
                                                    onClick={handleSaveCrmNotes}
                                                    disabled={savingCrmNotes}
                                                    className="flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                                >
                                                    {savingCrmNotes && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                                    Save Notes
                                                </button>
                                            </div>

                                            {/* Order history */}
                                            <div className="bg-white border border-[#eef0f2] rounded-2xl p-4 shadow-sm space-y-3">
                                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Order History</h4>
                                                {orders.filter(o => o.customer_id === activeCrmCustomer.user_id).length === 0 ? (
                                                    <p className="text-[11px] text-slate-400 italic py-4 text-center">No orders from this customer yet.</p>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left text-xs">
                                                            <thead>
                                                                <tr className="border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                                                                    <th className="pb-2">Order</th>
                                                                    <th>Status</th>
                                                                    <th>Amount</th>
                                                                    <th>Payment</th>
                                                                    <th>Date</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {orders
                                                                    .filter(o => o.customer_id === activeCrmCustomer.user_id)
                                                                    .map(o => (
                                                                        <tr key={o.id} className="border-b border-slate-50 hover:bg-orange-50/10 text-slate-700 transition-colors">
                                                                            <td className="py-2.5 font-bold text-slate-900">#{o.id}</td>
                                                                            <td>
                                                                                <span className={cn(
                                                                                    "px-2 py-0.5 rounded-md text-[9px] font-black uppercase border",
                                                                                    o.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                                    o.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                                    o.status === 'processing' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                                                                                    'bg-slate-100 text-slate-500 border-slate-200'
                                                                                )}>
                                                                                    {o.status}
                                                                                </span>
                                                                            </td>
                                                                            <td className="font-extrabold text-slate-900">${o.total_amount.toFixed(2)}</td>
                                                                            <td className="text-slate-500 font-medium capitalize">{o.payment_method}</td>
                                                                            <td className="text-slate-400 text-[10px]">{new Date(o.created_at).toLocaleDateString()}</td>
                                                                        </tr>
                                                                    ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="bg-white border border-[#eef0f2] rounded-3xl h-64 flex flex-col items-center justify-center text-slate-400 shadow-sm gap-3">
                                            <Users className="h-8 w-8 text-slate-200" />
                                            <p className="text-sm font-bold">Select a customer to view their profile</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* --- TAB: TEAM ROSTER --- */}
                        {activeTab === 'team' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in-up">
                                {/* Invite employee card */}
                                <div className="lg:col-span-1 bg-white border border-[#eef0f2] shadow-[0_8px_30px_rgba(0,0,0,0.015)] rounded-3xl p-4 md:p-6 space-y-5 text-slate-800">
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
                                <div className="lg:col-span-2 bg-white border border-[#eef0f2] shadow-[0_8px_30px_rgba(0,0,0,0.015)] rounded-3xl p-4 md:p-6 space-y-5 text-slate-800">
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
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
                            <div className="space-y-5 animate-fade-in-up">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Analytics & Metrics</h3>
                                    <button
                                        onClick={() => businessService.getAnalytics(activeBusiness!.id).then(setAnalytics).catch(() => null)}
                                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 px-3 py-1.5 bg-white border border-slate-200 rounded-xl transition-all"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" /> Refresh
                                    </button>
                                </div>

                                {/* KPI summary row */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Total Revenue', value: `$${Number(analytics?.revenue || 0).toFixed(2)}`, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                                        { label: 'Completed Orders', value: analytics?.completed_orders ?? 0, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
                                        { label: 'Avg. Basket', value: `$${analytics?.completed_orders > 0 ? (analytics.revenue / analytics.completed_orders).toFixed(2) : '0.00'}`, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' },
                                        { label: 'Customers', value: analytics?.customer_count ?? 0, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
                                    ].map(({ label, value, color, bg }) => (
                                        <div key={label} className={`${bg} border rounded-2xl p-4 text-center`}>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
                                            <p className={`text-xl font-black mt-1 ${color}`}>{value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Sales chart + stock alert */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
                                    <div className="lg:col-span-2 bg-white border border-[#eef0f2] rounded-2xl p-5 space-y-4 shadow-sm">
                                        <h4 className="text-xs font-black uppercase text-slate-700">Revenue Trend — Last 7 Days</h4>
                                        <div className="h-56 flex items-end gap-3 border-b border-slate-100 pb-2 px-2">
                                            {analytics?.sales_trends_7d?.map((t: any, idx: number) => {
                                                const maxRev = Math.max(...analytics.sales_trends_7d.map((x: any) => x.revenue), 1);
                                                const htPct = (t.revenue / maxRev) * 85;
                                                return (
                                                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                                                        <div className="text-[10px] font-black text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-sm whitespace-nowrap">
                                                            ${Number(t.revenue).toFixed(2)}
                                                        </div>
                                                        <div
                                                            className="w-full bg-gradient-to-t from-orange-500 to-orange-300 hover:from-orange-600 hover:to-orange-400 rounded-t-xl transition-all"
                                                            style={{ height: `${Math.max(8, htPct)}%` }}
                                                        />
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                                            {t.date.split('-').slice(1).join('/')}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                            {(!analytics?.sales_trends_7d || analytics.sales_trends_7d.length === 0) && (
                                                <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-400 font-bold italic">No completed orders in the last 7 days</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Low stock alert */}
                                        <div className={`border rounded-2xl p-4 space-y-2 ${(analytics?.low_stock_count ?? 0) > 0 ? 'bg-amber-50 border-amber-100' : 'bg-white border-[#eef0f2]'} shadow-sm`}>
                                            <h4 className="text-xs font-black uppercase text-slate-700">Stock Health</h4>
                                            {(analytics?.low_stock_count ?? 0) > 0 ? (
                                                <>
                                                    <p className="text-2xl font-black text-amber-600">{analytics.low_stock_count} low</p>
                                                    <p className="text-[10px] text-amber-700 font-semibold">products below min threshold</p>
                                                    <button onClick={() => setActiveTab('inventory')} className="text-[10px] font-black uppercase tracking-widest text-amber-700 hover:text-amber-900 flex items-center gap-1">
                                                        Restock now <ArrowRight className="h-3 w-3" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-2xl font-black text-emerald-600">{analytics?.product_count ?? 0}</p>
                                                    <p className="text-[10px] text-emerald-700 font-semibold">products, all in stock</p>
                                                </>
                                            )}
                                        </div>

                                        {/* CRM segments */}
                                        <div className="bg-white border border-[#eef0f2] rounded-2xl p-4 space-y-3 shadow-sm">
                                            <h4 className="text-xs font-black uppercase text-slate-700">Customer Segments</h4>
                                            {(['VIP', 'regular', 'new', 'inactive'] as const).map(seg => {
                                                const count = customers.filter(c => c.segmentation === seg).length;
                                                const segColor: Record<string, string> = { VIP: 'bg-amber-400', regular: 'bg-emerald-400', new: 'bg-sky-400', inactive: 'bg-slate-300' };
                                                const pct = customers.length > 0 ? (count / customers.length) * 100 : 0;
                                                return (
                                                    <div key={seg} className="space-y-1">
                                                        <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase">
                                                            <span>{seg}</span><span>{count}</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all ${segColor[seg]}`} style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: AI COPILOT --- */}
                        {activeTab === 'ai' && (
                            <div className="space-y-5 animate-fade-in-up">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-5 md:p-6 flex items-center gap-4 shadow-lg">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                                        <Bot className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-wider text-white">Groq AI Copilot</h3>
                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Powered by Groq LLM — generate product descriptions, get pricing advice, and draft customer replies.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                    {/* Tool 1: Description Generator */}
                                    <div className="bg-white border border-[#eef0f2] rounded-3xl p-5 space-y-4 shadow-sm">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                                                <Sparkles className="h-4 w-4 text-sky-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Product Description Generator</h4>
                                                <p className="text-[10px] text-slate-400 font-medium">AI writes compelling copy for your products</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Product Name *</label>
                                                <input
                                                    type="text"
                                                    value={copilotDescName}
                                                    onChange={e => setCopilotDescName(e.target.value)}
                                                    placeholder="e.g. Leather Office Chair"
                                                    className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3.5 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 mt-1.5 font-bold transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Additional Context (optional)</label>
                                                <input
                                                    type="text"
                                                    value={copilotDescContext}
                                                    onChange={e => setCopilotDescContext(e.target.value)}
                                                    placeholder="e.g. ergonomic, adjustable height, black"
                                                    className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3.5 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 mt-1.5 font-medium transition-all"
                                                />
                                            </div>
                                            <button
                                                onClick={handleCopilotGenerateDesc}
                                                disabled={copilotDescLoading || !activeBusiness}
                                                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-sky-100"
                                            >
                                                {copilotDescLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</> : <><Sparkles className="h-3.5 w-3.5" /> Generate Description</>}
                                            </button>
                                            {copilotDescOutput && (
                                                <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 space-y-2">
                                                    <p className="text-[10px] font-black uppercase text-sky-600 tracking-widest">Generated Copy</p>
                                                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{copilotDescOutput}</p>
                                                    <button
                                                        onClick={() => { navigator.clipboard?.writeText(copilotDescOutput); toast.success('Copied to clipboard!'); }}
                                                        className="text-[10px] font-black uppercase text-sky-600 hover:text-sky-800 flex items-center gap-1 transition-colors"
                                                    >
                                                        <Copy className="h-3 w-3" /> Copy Text
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tool 2: Price Advisor */}
                                    <div className="bg-white border border-[#eef0f2] rounded-3xl p-5 space-y-4 shadow-sm">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                                <DollarSign className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">AI Pricing Advisor</h4>
                                                <p className="text-[10px] text-slate-400 font-medium">Get market-aware price suggestions</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Product Name *</label>
                                                <input
                                                    type="text"
                                                    value={copilotPriceName}
                                                    onChange={e => setCopilotPriceName(e.target.value)}
                                                    placeholder="e.g. Samsung Galaxy A54"
                                                    className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3.5 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 mt-1.5 font-bold transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</label>
                                                <select
                                                    value={copilotPriceCategory}
                                                    onChange={e => setCopilotPriceCategory(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 text-xs py-2.5 px-3 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 mt-1.5 font-bold transition-all cursor-pointer"
                                                >
                                                    <option value="shop">Shop / Retail</option>
                                                    <option value="electronics">Electronics</option>
                                                    <option value="fashion">Fashion & Clothing</option>
                                                    <option value="food">Food & Groceries</option>
                                                    <option value="furniture">Furniture & Home</option>
                                                    <option value="service">Service</option>
                                                    <option value="vehicles">Vehicles</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <button
                                                onClick={handleCopilotSuggestPrice}
                                                disabled={copilotPriceLoading || !activeBusiness}
                                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-100"
                                            >
                                                {copilotPriceLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Advising...</> : <><DollarSign className="h-3.5 w-3.5" /> Suggest Price</>}
                                            </button>
                                            {copilotPriceOutput !== null && (
                                                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                                                    <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">AI Suggested Price</p>
                                                    <p className="text-3xl font-black text-emerald-700 mt-1">${copilotPriceOutput.toFixed(2)}</p>
                                                    <p className="text-[10px] text-emerald-600 font-medium mt-1">Estimated market rate for this category</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick-access shortcuts */}
                                <div className="bg-white border border-[#eef0f2] rounded-2xl p-4 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">More AI Features In Other Tabs</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { label: 'AI Reply Suggestions', tab: 'messages' as TabType, desc: 'in Chat' },
                                            { label: 'AI Chat Summarizer', tab: 'messages' as TabType, desc: 'in Chat' },
                                            { label: 'AI Product Copy', tab: 'inventory' as TabType, desc: 'in Inventory' },
                                            { label: 'AI Price for Products', tab: 'inventory' as TabType, desc: 'in Inventory' },
                                        ].map(({ label, tab, desc }) => (
                                            <button
                                                key={label}
                                                onClick={() => setActiveTab(tab)}
                                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-orange-600 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 px-3 py-1.5 rounded-xl transition-all"
                                            >
                                                {label} <span className="text-slate-400 normal-case font-medium">({desc})</span>
                                            </button>
                                        ))}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
