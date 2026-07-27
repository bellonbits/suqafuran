import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Search, Save, RefreshCw, Loader2, 
    AlertCircle, Home, Info, Phone, 
    Layout, Globe, Languages
} from 'lucide-react';
import { contentService } from '../../services/contentService';
import { Button } from '../../components/Button';
import enJson from '../../locales/en.json';
import soJson from '../../locales/so.json';

interface ContentItem {
    id: string;
    key: string;
    value_en: string;
    value_so: string;
    page_group: string;
}

const PAGE_GROUPS = [
    { id: 'all', label: 'All Content', icon: Globe },
    { id: 'landing', label: 'Home Page', icon: Home },
    { id: 'about', label: 'About Us', icon: Info },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'nav', label: 'Navigation', icon: Layout },
    { id: 'general', label: 'General', icon: Languages },
];

const WebEditorPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeGroup, setActiveGroup] = useState('all');
    const [savingKey, setSavingKey] = useState<string | null>(null);

    // Fetch all content from DB
    const { data: dbContent = [], isLoading } = useQuery<ContentItem[]>({
        queryKey: ['admin-site-content'],
        queryFn: contentService.getAllContent,
    });

    const updateMutation = useMutation({
        mutationFn: ({ key, data }: { key: string, data: any }) => 
            contentService.updateContent(key, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-site-content'] });
            setSavingKey(null);
        },
        onError: () => setSavingKey(null)
    });

    const syncMutation = useMutation({
        mutationFn: (data: { map: any, group: string }) => 
            contentService.syncContent(data.map, data.group),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-site-content'] });
            alert('Synced successfully!');
        }
    });

    const handleSave = (key: string, en: string, so: string) => {
        setSavingKey(key);
        updateMutation.mutate({ key, data: { value_en: en, value_so: so } });
    };

    const handleSync = () => {
        if (!confirm('This will import all keys from your local translation files into the database. Existing keys will be updated. Continue?')) return;
        
        // Prepare map for sync
        const syncMap: any = {};
        
        // Helper to flatten nested JSON and group by prefix
        const flattenAndSync = (obj: any, prefix = '') => {
            Object.keys(obj).forEach(key => {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    flattenAndSync(obj[key], fullKey);
                } else {
                    syncMap[fullKey] = {
                        en: obj[key],
                        so: getNestedValue(soJson, fullKey) || obj[key]
                    };
                }
            });
        };

        const getNestedValue = (obj: any, path: string) => {
            return path.split('.').reduce((acc, part) => acc && acc[part], obj);
        };

        flattenAndSync(enJson);
        
        // For simplicity, we sync in chunks or just the whole thing
        // Here we'll just determine the group based on the prefix
        syncMutation.mutate({ map: syncMap, group: 'auto' });
    };

    const filteredContent = useMemo(() => {
        return dbContent.filter((item) => {
            const matchesSearch = item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.value_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (item.value_so && item.value_so.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesGroup = activeGroup === 'all' || item.page_group === activeGroup || item.key.startsWith(activeGroup);
            return matchesSearch && matchesGroup;
        });
    }, [dbContent, searchTerm, activeGroup]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Web Editor</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage all bilingual site content and translations</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        onClick={handleSync}
                        disabled={syncMutation.isPending}
                        className="flex items-center gap-2"
                    >
                        {syncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Sync from JSON
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Filters */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Page Groups</h3>
                        <div className="space-y-1">
                            {PAGE_GROUPS.map(group => (
                                <button
                                    key={group.id}
                                    onClick={() => setActiveGroup(group.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        activeGroup === group.id 
                                        ? 'bg-primary-500 text-white shadow-md shadow-primary-200' 
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <group.icon className="w-4 h-4" />
                                    {group.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Editor */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Search by key or text content..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium"
                        />
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary-500" />}
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin" />
                                <p className="text-sm font-medium">Loading content library...</p>
                            </div>
                        ) : filteredContent.length === 0 ? (
                            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No results found for your search</p>
                            </div>
                        ) : (
                            filteredContent.map((item: any) => (
                                <ContentRow 
                                    key={item.id} 
                                    item={item} 
                                    onSave={handleSave}
                                    isSaving={savingKey === item.key}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ContentRowProps {
    item: any;
    onSave: (key: string, en: string, so: string) => void;
    isSaving: boolean;
}

const ContentRow: React.FC<ContentRowProps> = ({ item, onSave, isSaving }) => {
    const [en, setEn] = useState(item.value_en);
    const [so, setSo] = useState(item.value_so || '');
    const [isDirty, setIsDirty] = useState(false);

    const handleEnChange = (val: string) => {
        setEn(val);
        setIsDirty(val !== item.value_en || so !== (item.value_so || ''));
    };

    const handleSoChange = (val: string) => {
        setSo(val);
        setIsDirty(en !== item.value_en || val !== (item.value_so || ''));
    };

    const handleSave = () => {
        onSave(item.key, en, so);
        setIsDirty(false);
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:border-primary-200 transition-all">
            <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                <code className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{item.key}</code>
                <div className="flex items-center gap-2">
                    {isDirty && <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Unsaved Changes</span>}
                    <button 
                        onClick={handleSave}
                        disabled={!isDirty || isSaving}
                        className={`p-1.5 rounded-lg transition-all ${
                            isDirty 
                            ? 'text-primary-600 hover:bg-primary-50' 
                            : 'text-gray-300 pointer-events-none'
                        }`}
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                </div>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">English</label>
                    <textarea 
                        value={en}
                        onChange={(e) => handleEnChange(e.target.value)}
                        className="w-full min-h-[80px] text-sm bg-gray-50/30 border-gray-100 rounded-xl focus:ring-primary-500 focus:border-primary-500 p-3"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Somali</label>
                    <textarea 
                        value={so}
                        onChange={(e) => handleSoChange(e.target.value)}
                        placeholder="Add Somali translation..."
                        className="w-full min-h-[80px] text-sm bg-gray-50/30 border-gray-100 rounded-xl focus:ring-primary-500 focus:border-primary-500 p-3"
                    />
                </div>
            </div>
        </div>
    );
};

export { WebEditorPage };
