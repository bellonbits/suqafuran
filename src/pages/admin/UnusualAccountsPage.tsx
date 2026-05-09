import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Shield, AlertTriangle, Users, HardDrive, Globe } from 'lucide-react';
import { Button } from '../../components/Button';

interface AccountSignal {
    id: number;
    full_name: string;
    email: string;
    device_fingerprint: string;
    last_ip: string;
    trust_score: number;
    verified_level: string;
    created_at: string;
    linked_accounts_count: number;
}

const UnusualAccountsPage: React.FC = () => {
    const { data: accounts, isLoading } = useQuery<AccountSignal[]>({
        queryKey: ['unusual-accounts'],
        queryFn: () => api.get('/trust_ops/admin/unusual-accounts').then(res => res.data),
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="h-6 w-6 text-primary-600" />
                        Forensic Signal Tracker
                    </h1>
                    <p className="text-sm text-gray-500">Tracking accounts with shared device fingerprints or suspicious network patterns.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-bold text-amber-700">{accounts?.length || 0} Flagged Clusters</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="p-20 text-center text-gray-400">Loading forensic data...</div>
                ) : accounts?.map(acc => (
                    <div key={acc.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                                    {acc.full_name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{acc.full_name}</h3>
                                    <p className="text-xs text-gray-500">{acc.email}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-black border border-red-100 uppercase tracking-widest">
                                    Risk Score: {acc.linked_accounts_count * 100}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Joined {new Date(acc.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-2 text-gray-500 mb-2">
                                    <HardDrive className="h-3.5 w-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Device ID</span>
                                </div>
                                <code className="text-xs font-mono text-gray-700 break-all">{acc.device_fingerprint || 'MISSING'}</code>
                            </div>
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-2 text-gray-500 mb-2">
                                    <Globe className="h-3.5 w-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Last IP Address</span>
                                </div>
                                <code className="text-xs font-mono text-gray-700">{acc.last_ip || 'N/A'}</code>
                            </div>
                            <div className="p-4 rounded-2xl bg-primary-50 border border-primary-100">
                                <div className="flex items-center gap-2 text-primary-600 mb-2">
                                    <Users className="h-3.5 w-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Fingerprint Clusters</span>
                                </div>
                                <p className="text-sm font-bold text-primary-700">{acc.linked_accounts_count} linked accounts</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button size="sm" variant="outline" className="rounded-xl flex-1 text-xs font-bold border-gray-200">View History</Button>
                            <Button size="sm" variant="secondary" className="rounded-xl flex-1 text-xs font-bold bg-red-600 hover:bg-red-700 border-none text-white">
                                Freeze Cluster
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UnusualAccountsPage;
