import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuth';
import type { User } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'seller' | 'admin' | 'agent';
}

function getStoredAuth(): { user: User | null; isAuthenticated: boolean } {
  if (typeof window === 'undefined') return { user: null, isAuthenticated: false };
  try {
    const raw = localStorage.getItem('suqafuran-auth-redesign');
    if (raw) {
      const parsed = JSON.parse(raw);
      const state = parsed?.state;
      if (state?.user && (state?.token || state?.isAuthenticated)) {
        return { user: state.user, isAuthenticated: true };
      }
    }
  } catch {}
  return { user: null, isAuthenticated: false };
}

// The backend doesn't consistently populate is_admin/is_agent/is_seller on
// every endpoint that returns a user object, so fall back to the generic
// `role` string and an email-keyword heuristic — mirrors the same fallback
// chain Header.tsx already uses for role detection.
function hasRole(user: User, role: 'seller' | 'admin' | 'agent'): boolean {
  const flagKey = `is_${role}` as 'is_seller' | 'is_admin' | 'is_agent';
  if (user[flagKey]) return true;

  const anyUser = user as any;
  if (anyUser.role === role) return true;

  if (user.email?.includes(role)) return true;

  return false;
}

// Admins can access any role-gated area (seller, agent, or admin dashboards)
// — being an admin is a superset of the other dashboard roles.
function isAuthorized(user: User, requiredRole: 'seller' | 'admin' | 'agent'): boolean {
  if (hasRole(user, requiredRole)) return true;
  if (requiredRole !== 'admin' && hasRole(user, 'admin')) return true;
  return false;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const store = useAuthStore();
  const stored = getStoredAuth();

  const user = store.user || stored.user;
  const isAuthenticated = store.isAuthenticated || stored.isAuthenticated;

  // Not logged in -> redirect immediately
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Insufficient permissions -> redirect to home
  if (requiredRole && !isAuthorized(user, requiredRole)) {
    return <Navigate to="/" replace />;
  }

  // Load immediately as opened with no loading screen
  return <>{children}</>;
}
