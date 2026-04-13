import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguageField } from '../hooks/useLanguageField';
import { ChevronRight } from 'lucide-react';
import { getCategoryIcon } from '../utils/categoryIcons';
import { getImageUrl } from '../utils/imageUtils';

interface CategoryDirectoryProps {
    categories: any[];
}

export const CategoryDirectory: React.FC<CategoryDirectoryProps> = ({ categories }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { getField } = useLanguageField();

    // Level 1: hovered category index (null = hidden)
    const [activeIdx, setActiveIdx] = useState<number | null>(null);
    // Level 2: hovered subcategory index (null = hidden)
    const [activeSubIdx, setActiveSubIdx] = useState<number | null>(null);

    if (!categories || categories.length === 0) return null;

    const activeCategory = activeIdx !== null ? categories[activeIdx] : null;
    const subcategories = activeCategory?.subcategories || [];

    const activeSubcategory = activeSubIdx !== null ? subcategories[activeSubIdx] : null;
    const subsubcategories = activeSubcategory?.subsubcategories || [];

    const goToCategory = (slug: string | number) =>
        navigate(`/category/${slug}`);

    const goToSubcategory = (catSlug: string | number, subName: string) =>
        navigate(`/category/${catSlug}?subcategory=${encodeURIComponent(subName)}`);

    const goToSubSubcategory = (catSlug: string | number, subName: string, ssName: string) =>
        navigate(`/category/${catSlug}?subcategory=${encodeURIComponent(subName)}&subsubcategory=${encodeURIComponent(ssName)}`);

    const handleMouseLeave = () => {
        setActiveIdx(null);
        setActiveSubIdx(null);
    };

    return (
        <>
            {/* ── Desktop: multi-level flyout ── */}
            <div
                className="hidden md:block relative"
                onMouseLeave={handleMouseLeave}
            >
                {/* "Categories" header */}
                <div className="bg-primary-600 px-4 py-2.5 rounded-t-2xl border border-primary-600">
                    <p className="text-white text-xs font-extrabold uppercase tracking-widest">
                        {t('listing.category', 'Categories')}
                    </p>
                </div>

                {/* Level 1 — main category list */}
                <div className="w-[300px] bg-white border border-t-0 border-gray-100 rounded-b-2xl overflow-y-auto divide-y divide-gray-50">
                    {categories.map((cat, idx) => {
                        const Icon = getCategoryIcon(cat.icon_name || cat.slug);
                        const isActive = idx === activeIdx;
                        const hasSubcats = (cat.subcategories?.length ?? 0) > 0;
                        return (
                            <button
                                key={cat.id}
                                onMouseEnter={() => {
                                    setActiveIdx(hasSubcats ? idx : null);
                                    setActiveSubIdx(null);
                                }}
                                onClick={() => goToCategory(cat.slug || cat.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all relative ${
                                    isActive
                                        ? 'bg-primary-50 border-l-[3px] border-l-primary-500'
                                        : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
                                }`}
                            >
                                <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                                    {cat.image_url ? (
                                        <img src={getImageUrl(cat.image_url)} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Icon size={20} className={isActive ? 'text-primary-500' : 'text-gray-400'} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[13px] font-bold leading-tight ${isActive ? 'text-primary-700' : 'text-gray-800'}`}>
                                        {getField(cat, 'name')}
                                    </p>
                                </div>
                                {hasSubcats && (
                                    <ChevronRight size={14} className={isActive ? 'text-primary-500' : 'text-gray-300'} />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Level 2 — subcategory flyout */}
                {activeCategory && subcategories.length > 0 && (
                    <div
                        className="absolute left-[300px] top-0 z-30 w-[280px] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-y-auto max-h-[520px]"
                        onMouseEnter={() => {/* keep open */}}
                    >
                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100 rounded-t-2xl">
                            <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest truncate">
                                {getField(activeCategory, 'name')}
                            </p>
                            <button
                                onClick={() => goToCategory(activeCategory.slug || activeCategory.id)}
                                className="text-[11px] text-primary-600 font-bold hover:underline shrink-0 ml-2"
                            >
                                {t('landing.viewAll', 'View all')} →
                            </button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {subcategories.map((sub: any, subIdx: number) => {
                                const isSubActive = subIdx === activeSubIdx;
                                const hasSubSubs = (sub.subsubcategories?.length ?? 0) > 0;
                                return (
                                    <button
                                        key={sub.id || subIdx}
                                        onMouseEnter={() => setActiveSubIdx(hasSubSubs ? subIdx : null)}
                                        onClick={() => goToSubcategory(activeCategory.slug || activeCategory.id, getField(sub, 'name'))}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                                            isSubActive ? 'bg-primary-50' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                                            {sub.image_url ? (
                                                <img src={getImageUrl(sub.image_url)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className={`w-2 h-2 rounded-full ${isSubActive ? 'bg-primary-400' : 'bg-gray-300'}`} />
                                            )}
                                        </div>
                                        <p className={`flex-1 text-[13px] font-semibold leading-tight truncate ${isSubActive ? 'text-primary-600' : 'text-gray-700'}`}>
                                            {getField(sub, 'name')}
                                        </p>
                                        {hasSubSubs && (
                                            <ChevronRight size={13} className={isSubActive ? 'text-primary-400' : 'text-gray-300'} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Level 3 — sub-subcategory flyout */}
                {activeSubcategory && subsubcategories.length > 0 && (
                    <div
                        className="absolute left-[580px] top-0 z-40 w-[260px] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-y-auto max-h-[520px]"
                    >
                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100 rounded-t-2xl">
                            <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest truncate">
                                {getField(activeSubcategory, 'name')}
                            </p>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {subsubcategories.map((ss: any, ssIdx: number) => (
                                <button
                                    key={ss.id || ssIdx}
                                    onClick={() => goToSubSubcategory(
                                        activeCategory!.slug || activeCategory!.id,
                                        getField(activeSubcategory, 'name'),
                                        getField(ss, 'name')
                                    )}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-primary-50 transition-all group"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-primary-400 shrink-0 ml-1 transition-colors" />
                                    <p className="flex-1 text-[13px] font-medium text-gray-700 group-hover:text-primary-600 leading-tight truncate">
                                        {getField(ss, 'name')}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Mobile: vertical list ── */}
            <div className="md:hidden space-y-1.5">
                {categories.map((cat) => {
                    const Icon = getCategoryIcon(cat.icon_name || cat.slug);
                    return (
                        <button
                            key={cat.id}
                            onClick={() => goToCategory(cat.slug || cat.id)}
                            className="w-full flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all"
                        >
                            <div className="w-10 h-10 rounded-lg bg-gray-50 shrink-0 overflow-hidden flex items-center justify-center">
                                {cat.image_url ? (
                                    <img src={getImageUrl(cat.image_url)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Icon size={20} className="text-primary-500" />
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-[13.5px] font-bold text-gray-800 truncate">{getField(cat, 'name')}</p>
                                {cat.subcategories?.length > 0 && (
                                    <p className="text-[11px] text-gray-400">{cat.subcategories.length} {t('landing.subcategories', 'subcategories')}</p>
                                )}
                            </div>
                            <ChevronRight size={16} className="text-gray-300 shrink-0" />
                        </button>
                    );
                })}
            </div>
        </>
    );
};
