import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, Bell, LogOut, Shield } from 'lucide-react';
import { Logo } from '../Logo';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../utils/cn';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number | null;
  badgeTone?: 'blue' | 'amber' | 'rose' | 'emerald';
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export interface DashboardShellProps {
  sections: NavSection[];
  children: React.ReactNode;
  brandTitle?: string;
  brandSubtitle?: string;
  showMobileBottomNav?: boolean;
  mobileBottomNavItems?: NavItem[];
  actions?: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  sections,
  children,
  brandTitle = 'Suqafuran',
  brandSubtitle,
  showMobileBottomNav = false,
  mobileBottomNavItems = [],
  actions,
}) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close drawer on path change
  React.useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  const displayName = (user as any)?.business_name || user?.full_name || user?.email?.split('@')[0] || 'User';
  const roleLabel = user?.is_admin ? 'Admin' : (user?.is_agent ? 'Agent' : 'Seller');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row antialiased">
      {/* ── Mobile Top Header ──────────────────────────────────────── */}
      <header className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-4 py-3 flex items-center justify-between safe-top">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="p-2 -ml-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation drawer"
          >
            {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/" className="flex items-center gap-2">
            <Logo size="sm" />
            {brandSubtitle && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                {brandSubtitle}
              </span>
            )}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {actions}
          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold font-mono">
            {displayName[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      {/* ── Mobile Backdrop ────────────────────────────────────────── */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* ── Sidebar (Desktop & Mobile Drawer) ──────────────────────── */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-out md:static md:translate-x-0 shrink-0",
          mobileDrawerOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Sidebar Brand Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <Logo size="md" />
              {brandSubtitle && (
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md border border-sky-100">
                  {brandSubtitle}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
            {sections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {section.title && (
                  <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {section.title}
                  </p>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path ||
                    (item.path !== '/admin-dashboard' && item.path !== '/seller-dashboard' && location.pathname.startsWith(item.path));

                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={cn(
                        "group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 min-h-[42px]",
                        isActive
                          ? "bg-sky-50 text-sky-700 shadow-xs border border-sky-200/80 font-bold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-colors",
                            isActive ? "text-sky-600" : "text-slate-400 group-hover:text-slate-600"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== undefined && item.badge !== null && item.badge !== '' && (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
                            item.badgeTone === 'rose' ? "bg-rose-100 text-rose-700" :
                            item.badgeTone === 'amber' ? "bg-amber-100 text-amber-800" :
                            item.badgeTone === 'emerald' ? "bg-emerald-100 text-emerald-800" :
                            "bg-sky-100 text-sky-700"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* User Profile Card at Bottom */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm text-xs">
                  {displayName[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                  <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold text-sky-700 bg-sky-100">
                    {roleLabel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Log out"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ──────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full content-bottom-safe">
          {children}
        </div>
      </main>

      {/* ── Mobile Sticky Bottom Navigation (If enabled) ───────────── */}
      {showMobileBottomNav && mobileBottomNavItems.length > 0 && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around bottom-nav-safe">
          {mobileBottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isCenterCta = item.id === 'create' || item.id === 'new';

            if (isCenterCta) {
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className="-mt-5 w-12 h-12 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 transition-transform active:scale-95"
                  aria-label={item.label}
                >
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </Link>
              );
            }

            return (
              <Link
                key={item.id}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors relative min-w-[56px]",
                  isActive ? "text-sky-600 font-bold" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] leading-tight">{item.label}</span>
                {item.badge !== undefined && item.badge !== null && item.badge !== '' && (
                  <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-sky-500" />
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
};

export default DashboardShell;

