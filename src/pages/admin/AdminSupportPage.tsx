import React, { useState, useEffect } from 'react';
import { 
    LifeBuoy, CheckCircle2, User, Calendar,
    MoreVertical, Bot, Flag, Save
} from 'lucide-react';
import { supportService } from '../../services/supportService';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/cn';

interface Ticket {
    id: number;
    user_id?: number;
    subject: string;
    status: 'open' | 'resolved' | 'pending';
    priority: 'low' | 'medium' | 'high';
    chat_history: any[];
    last_agent_response: string;
    admin_notes?: string;
    created_at: string;
    updated_at: string;
}

export const AdminSupportPage: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('open');
    const [adminNote, setAdminNote] = useState('');

    useEffect(() => {
        loadData();
    }, [filterStatus]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [data] = await Promise.all([
                supportService.getTickets({ status: filterStatus === 'all' ? undefined : filterStatus }),
                supportService.getStats()
            ]);
            setTickets(data);
        } catch (error) {
            toast.error('Failed to load support data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (ticketId: number, status: string) => {
        try {
            await supportService.updateTicket(ticketId, { status });
            toast.success(`Ticket marked as ${status}`);
            loadData();
            if (selectedTicket?.id === ticketId) {
                setSelectedTicket(prev => prev ? { ...prev, status: status as any } : null);
            }
        } catch (error) {
            toast.error('Failed to update ticket');
        }
    };

    const handleSaveNote = async () => {
        if (!selectedTicket) return;
        try {
            await supportService.updateTicket(selectedTicket.id, { admin_notes: adminNote });
            toast.success('Note saved');
            setSelectedTicket({ ...selectedTicket, admin_notes: adminNote });
            loadData();
        } catch (error) {
            toast.error('Failed to save note');
        }
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'high': return 'bg-red-100 text-red-700 border-red-200';
            case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Sidebar List */}
            <div className="w-80 border-r border-gray-100 bg-white flex flex-col shrink-0">
                <div className="p-4 border-b border-gray-50">
                    <h1 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                        <LifeBuoy className="text-primary-500" size={20} />
                        Support Follow-up
                    </h1>
                    <div className="flex gap-1 mt-4">
                        {['all', 'open', 'resolved'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={cn(
                                    "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                                    filterStatus === s 
                                        ? "bg-primary-500 text-white shadow-sm" 
                                        : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                                )}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="p-4 animate-pulse border-b border-gray-50">
                                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-50 rounded w-1/2"></div>
                            </div>
                        ))
                    ) : tickets.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 text-xs italic">
                            No tickets found
                        </div>
                    ) : (
                        tickets.map((ticket) => (
                            <button
                                key={ticket.id}
                                onClick={() => {
                                    setSelectedTicket(ticket);
                                    setAdminNote(ticket.admin_notes || '');
                                }}
                                className={cn(
                                    "w-full p-4 text-left border-b border-gray-50 transition-colors hover:bg-gray-50/50",
                                    selectedTicket?.id === ticket.id ? "bg-primary-50/50 border-r-4 border-r-primary-500" : ""
                                )}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase", getPriorityColor(ticket.priority))}>
                                        {ticket.priority}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(ticket.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-gray-900 truncate mb-1">{ticket.subject}</p>
                                <p className="text-xs text-gray-500 line-clamp-1">{ticket.last_agent_response}</p>
                                {ticket.status === 'resolved' && (
                                    <div className="mt-2 flex items-center gap-1 text-[10px] text-green-600 font-bold">
                                        <CheckCircle2 size={10} /> Resolved
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-gray-50 flex flex-col">
                {selectedTicket ? (
                    <>
                        {/* Detail Header */}
                        <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-lg">
                                    {selectedTicket.user_id ? 'U' : 'G'}
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold text-gray-900">{selectedTicket.subject}</h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <User size={12} /> User ID: {selectedTicket.user_id || 'Guest'}
                                        </span>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Calendar size={12} /> {new Date(selectedTicket.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedTicket.status !== 'resolved' && (
                                    <button 
                                        onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                                    >
                                        <CheckCircle2 size={18} /> Mark Resolved
                                    </button>
                                )}
                                <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                    <MoreVertical size={20} className="text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Chat History & Notes */}
                        <div className="flex-1 overflow-hidden flex">
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Chat History (User vs Agent)</h3>
                                {selectedTicket.chat_history.map((msg, i) => (
                                    <div key={i} className={cn(
                                        "flex gap-3 max-w-[85%]",
                                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                    )}>
                                        <div className={cn(
                                            "w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white",
                                            msg.role === 'user' ? "bg-gray-400" : "bg-primary-500"
                                        )}>
                                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                        </div>
                                        <div className={cn(
                                            "px-4 py-3 rounded-2xl text-sm shadow-sm",
                                            msg.role === 'user' 
                                                ? "bg-white text-gray-800 border border-gray-100 rounded-tr-none" 
                                                : "bg-primary-500 text-white rounded-tl-none"
                                        )}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Side Panel (Notes) */}
                            <div className="w-80 bg-white border-l border-gray-100 p-6 flex flex-col shrink-0">
                                <div className="flex items-center gap-2 text-gray-900 font-bold text-sm mb-4">
                                    <Flag size={16} className="text-amber-500" />
                                    Admin Notes
                                </div>
                                <textarea
                                    className="flex-1 w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary-500 transition-all resize-none mb-4"
                                    placeholder="Add internal notes for follow-up..."
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                />
                                <button 
                                    onClick={handleSaveNote}
                                    className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                                >
                                    <Save size={18} />
                                    Save Notes
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                        <div className="w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center text-primary-500 mb-6">
                            <LifeBuoy size={40} />
                        </div>
                        <h3 className="text-xl font-extrabold text-gray-900">Support Management</h3>
                        <p className="text-gray-500 max-w-xs mt-2">Select a ticket from the sidebar to review the conversation and follow up with the user.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSupportPage;
