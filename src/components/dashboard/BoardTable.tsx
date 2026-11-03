import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface BoardTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  filterTabs?: { id: string; label: string; count?: number }[];
  activeFilter?: string;
  onFilterChange?: (filterId: string) => void;
  pageSize?: number;
  emptyTitle?: string;
  emptySubtitle?: string;
  renderMobileCard?: (item: T) => React.ReactNode;
  actions?: React.ReactNode;
}

export function BoardTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  searchable = true,
  searchPlaceholder = 'Search records...',
  searchFilter,
  filterTabs,
  activeFilter,
  onFilterChange,
  pageSize = 10,
  emptyTitle = 'No records found',
  emptySubtitle = 'There are no items to display right now.',
  renderMobileCard,
  actions,
}: BoardTableProps<T>) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data by search
  const filteredData = data.filter((item) => {
    if (!search.trim() || !searchFilter) return true;
    return searchFilter(item, search.trim().toLowerCase());
  });

  // Pagination
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* ── Table Top Bar ──────────────────────────────────────────── */}
      {(searchable || filterTabs || actions) && (
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            {/* Search Box */}
            {searchable && (
              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 rounded-xl outline-none transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Filter Tabs */}
            {filterTabs && filterTabs.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {filterTabs.map((tab) => {
                  const isActive = activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        onFilterChange?.(tab.id);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5",
                        isActive
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded-full text-[10px]",
                            isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                          )}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}

      {/* ── Desktop Table Body ─────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider font-bold text-slate-400 border-b border-slate-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3.5 font-bold",
                    col.align === 'center' && "text-center",
                    col.align === 'right' && "text-right",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-500 mx-auto mb-2" />
                  <span>Loading records...</span>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <p className="text-sm font-bold text-slate-800">{emptyTitle}</p>
                  <p className="text-xs text-slate-400 mt-1">{emptySubtitle}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr key={keyExtractor(item)} className="hover:bg-slate-50/60 transition-colors">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3.5 align-middle text-slate-800 font-medium",
                        col.align === 'center' && "text-center",
                        col.align === 'right' && "text-right",
                        col.className
                      )}
                    >
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Card View (For small screens) ────────────────────── */}
      <div className="md:hidden divide-y divide-slate-100">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-sky-500 mx-auto mb-2" />
            <span className="text-xs">Loading records...</span>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <p className="text-sm font-bold text-slate-800">{emptyTitle}</p>
            <p className="text-xs text-slate-400 mt-1">{emptySubtitle}</p>
          </div>
        ) : (
          paginatedData.map((item) => (
            <div key={keyExtractor(item)} className="p-4 space-y-2">
              {renderMobileCard ? (
                renderMobileCard(item)
              ) : (
                columns.map((col) => (
                  <div key={col.key} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-400">{col.header}:</span>
                    <span className="text-slate-800 font-medium text-right">
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </span>
                  </div>
                ))
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Pagination Footer ──────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-700">{startIndex + 1}</span> to{' '}
            <span className="font-bold text-slate-700">
              {Math.min(startIndex + pageSize, totalItems)}
            </span>{' '}
            of <span className="font-bold text-slate-700">{totalItems}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-slate-700">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BoardTable;

