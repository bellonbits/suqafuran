import React, { useState, useEffect } from 'react';
import { 
    Users, Search, Filter,
    Trash2, Power, PowerOff, ExternalLink, 
    CheckCircle2, Ban,
    Mail, Phone, Calendar, ShieldCheck
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
        if (!confirm('CRITICAL ACTION: Are you sure you want to PERMANENTLY DELETE this account for good? This cannot be undone and all user data will be lost.')) return;

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

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="text-primary-500" />
                        User Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Moderate accounts, manage status, and post on behalf of users.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Users', value: stats.total, icon: Users, color: 'blue' },
                    { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'green' },
                    { label: 'Inactive', value: stats.inactive, icon: Ban, color: 'amber' },
                    { label: 'Admins', value: stats.admins, icon: ShieldCheck, color: 'primary' }
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
                        placeholder="Search by name, email, or phone..."
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
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold">User Information</th>
                                <th className="px-6 py-4 font-bold">Status</th>
                                <th className="px-6 py-4 font-bold">Role & Level</th>
                                <th className="px-6 py-4 font-bold">Joined Date</th>
                                <th className="px-6 py-4 font-bold text-right">Actions</th>
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
                                        No users found matching your criteria.
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
                                                <p className="text-sm font-bold text-gray-900">{user.full_name || 'Anonymous'}</p>
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
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-fit ${user.is_admin ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {user.is_admin ? 'ADMIN' : 'USER'}
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
                                            <button 
                                                onClick={() => handleToggleStatus(user.id, user.is_active)}
                                                className={`p-2 rounded-lg transition-colors ${user.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`}
                                                title={user.is_active ? 'Deactivate' : 'Activate'}
                                            >
                                                {user.is_active ? <PowerOff size={18} /> : <Power size={18} />}
                                            </button>
                                            <button 
                                                onClick={() => handleImpersonate(user.id)}
                                                className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                                                title="Post Ad on behalf"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Permanently"
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
        </div>
    );
};

export default AdminUsersPage;
