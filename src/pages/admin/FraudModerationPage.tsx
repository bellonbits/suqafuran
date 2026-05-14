import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    ShieldAlert, AlertTriangle, 
    Monitor, User
} from 'lucide-react';
import { Button } from '../../components/Button';
import { cn } from '../../utils/cn';
import api from '../../services/api';
import { format } from 'date-fns';

const FraudModerationPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'events' | 'reports' | 'banned_devices'>('events');

    // Fetch Automated Fraud Events
    const { data: events } = useQuery({
        queryKey: ['admin-fraud-events'],
        queryFn: async () => {
            const res = await api.get('/trust_ops/fraud-events');
            return res.data;
        },
        enabled: activeTab === 'events'
    });

    // Fetch Community Reports
    const { data: reports } = useQuery({
        queryKey: ['admin-reports'],
        queryFn: async () => {
            const res = await api.get('/trust_ops/reports');
            return res.data;
        },
        enabled: activeTab === 'reports'
    });

    // Moderate Mutation
    const moderateMutation = useMutation({
        mutationFn: async ({ id, action, note }: { id: number, action: string, note: string }) => {
            return api.post(`/trust_ops/moderate-report/${id}`, { action, note });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
            queryClient.invalidateQueries({ queryKey: ['admin-fraud-events'] });
        }
    });

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ShieldAlert className="text-primary-600" />
                        Trust & Safety Moderation
                    </h1>
                    <p className="text-gray-500">Real-time fraud detection and community moderation portal.</p>
                </div>
                
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                    <button 
                        onClick={() => setActiveTab('events')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                            activeTab === 'events' ? "bg-primary-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        AI Fraud Events
                    </button>
                    <button 
                        onClick={() => setActiveTab('reports')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                            activeTab === 'reports' ? "bg-primary-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        Community Reports
                    </button>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="grid grid-cols-1 gap-6">
                {activeTab === 'events' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                Flagged Fraud Events
                            </h2>
                            <span className="text-xs text-gray-500">Showing last 100 events</span>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4">Target</th>
                                        <th className="px-6 py-4">Rule Triggered</th>
                                        <th className="px-6 py-4 text-center">Risk Score</th>
                                        <th className="px-6 py-4 text-center">Confidence</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {events?.map((event: any) => (
                                        <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                        {event.target_type === 'user' ? <User size={16} /> : <Monitor size={16} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 capitalize">{event.target_type}</p>
                                                        <p className="text-xs text-gray-500">ID: {event.target_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-primary-600 bg-primary-50/30 rounded px-2">
                                                {event.rule_name}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                                                    event.risk_score > 80 ? "bg-red-100 text-red-700" : 
                                                    event.risk_score > 40 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                                                )}>
                                                    {event.risk_score}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-500">
                                                {(event.confidence * 100).toFixed(0)}%
                                            </td>
                                            <td className="px-6 py-4 capitalize">
                                                <span className="text-xs font-medium text-gray-600">{event.status}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-xs">
                                                {format(new Date(event.created_at), 'MMM d, HH:mm')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" className="text-primary-600">
                                                    Investigate
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reports?.map((report: any) => (
                            <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Report #{report.id}</span>
                                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Pending</span>
                                </div>
                                
                                <h3 className="font-bold text-gray-900 mb-1">{report.reason}</h3>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-3 italic">"{report.description}"</p>
                                
                                <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">Reporter ID:</span>
                                        <span className="font-medium text-gray-900">{report.reporter_id}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">Target ID:</span>
                                        <span className="font-medium text-red-600">{report.reported_user_id || report.listing_id}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">Automated Risk:</span>
                                        <span className="font-bold text-gray-900">{report.risk_score}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex-1 text-xs border-red-200 text-red-600 hover:bg-red-50"
                                        onClick={() => moderateMutation.mutate({ id: report.id, action: 'ban', note: 'Community report approved' })}
                                    >
                                        Ban User
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex-1 text-xs"
                                        onClick={() => moderateMutation.mutate({ id: report.id, action: 'dismiss', note: 'Community report dismissed' })}
                                    >
                                        Dismiss
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FraudModerationPage;
