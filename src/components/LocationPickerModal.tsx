import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, XCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import type { State, Region } from '../utils/somaliRegions';
import { SOMALI_STATES } from '../utils/somaliRegions';

interface LocationPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (location: string) => void;
    title?: string;
}

type SelectionLevel = 'state' | 'region' | 'town';

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    title = "Choose Location"
}) => {
    const [level, setLevel] = useState<SelectionLevel>('state');
    const [selectedState, setSelectedState] = useState<State | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleBack = () => {
        if (level === 'town') {
            setLevel('region');
            setSelectedRegion(null);
        } else if (level === 'region') {
            setLevel('state');
            setSelectedState(null);
        }
    };

    const filteredItems = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();

        if (level === 'state') {
            return SOMALI_STATES.filter(state =>
                state.name.toLowerCase().includes(query) ||
                state.regions.some(r => r.name.toLowerCase().includes(query)) ||
                state.regions.some(r => r.towns.some(t => t.toLowerCase().includes(query)))
            );
        }

        if (level === 'region' && selectedState) {
            return selectedState.regions.filter(region =>
                region.name.toLowerCase().includes(query) ||
                region.towns.some(t => t.toLowerCase().includes(query))
            );
        }

        if (level === 'town' && selectedRegion) {
            return selectedRegion.towns.filter(town =>
                town.toLowerCase().includes(query)
            );
        }

        return [];
    }, [level, selectedState, selectedRegion, searchQuery]);

    const handleSelect = (item: any) => {
        setSearchQuery('');
        if (level === 'state') {
            setSelectedState(item as State);
            setLevel('region');
        } else if (level === 'region') {
            setSelectedRegion(item as Region);
            setLevel('town');
        } else if (level === 'town') {
            onSelect(`${item}, ${selectedRegion?.name}, ${selectedState?.name}`);
            onClose();
            // Reset for next time
            setTimeout(() => {
                setLevel('state');
                setSelectedState(null);
                setSelectedRegion(null);
            }, 300);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden max-h-[85vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                {level !== 'state' && (
                                    <button
                                        onClick={handleBack}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                )}
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                                    <p className="text-xs text-secondary-500 font-semibold uppercase tracking-wider mt-0.5">
                                        {level === 'state' ? 'Select State' :
                                            level === 'region' ? `Region in ${selectedState?.name}` :
                                                `Town in ${selectedRegion?.name}`}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <XCircle className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4 bg-gray-50 border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={`Search ${level}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto custom-scrollbar flex-1 p-4 bg-white">
                            <div className="space-y-1.5">
                                {level === 'state' && (
                                    <button
                                        onClick={() => { onSelect("All Somalia"); onClose(); }}
                                        className="w-full text-left p-4 rounded-2xl hover:bg-primary-50 text-gray-600 font-medium transition-colors flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <span>All Somalia</span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                                    </button>
                                )}

                                {filteredItems.map((item: any, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelect(item)}
                                        className="w-full text-left p-4 rounded-2xl hover:bg-primary-50 text-gray-800 font-semibold transition-all flex items-center justify-between group border border-transparent hover:border-primary-100"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-primary-600 transition-colors shadow-sm">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-900">{level === 'town' ? item : item.name}</span>
                                                {level === 'state' && (
                                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                                        {item.regions.length} Regions
                                                    </span>
                                                )}
                                                {level === 'region' && (
                                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                                        {item.towns.length} Towns
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                                    </button>
                                ))}

                                {filteredItems.length === 0 && (
                                    <div className="py-12 flex flex-col items-center text-center px-6">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <Search className="w-8 h-8 text-gray-200" />
                                        </div>
                                        <h3 className="text-gray-900 font-bold">No locations found</h3>
                                        <p className="text-sm text-gray-500 mt-1">Try a different search term or check the spelling.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Breadcrumbs / Progress */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${level === 'state' ? 'bg-primary-600 scale-125' : 'bg-primary-200'}`}></span>
                            <span className={`flex-1 h-0.5 ${level !== 'state' ? 'bg-primary-600' : 'bg-gray-200'}`}></span>
                            <span className={`w-2 h-2 rounded-full ${level === 'region' ? 'bg-primary-600 scale-125' : level === 'town' ? 'bg-primary-600' : 'bg-gray-200'}`}></span>
                            <span className={`flex-1 h-0.5 ${level === 'town' ? 'bg-primary-600' : 'bg-gray-200'}`}></span>
                            <span className={`w-2 h-2 rounded-full ${level === 'town' ? 'bg-primary-600 scale-125' : 'bg-gray-200'}`}></span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
