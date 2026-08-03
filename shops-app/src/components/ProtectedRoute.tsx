import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'seller' | 'admin' | 'agent';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Wait for the persisted session to finish loading from storage before
    // deciding to redirect — otherwise an already-logged-in user gets
    // bounced because the store still holds its logged-out default state.
    if (!isHydrated) return;
    if (hasChecked) return;

    if (!isAuthenticated || !user) {
      setHasChecked(true);
      navigate('/login', { replace: true });
      return;
    }

    if (requiredRole === 'seller' && !user.is_seller) {
      setHasChecked(true);
      navigate('/', { replace: true });
      return;
    }

    if (requiredRole === 'admin' && !user.is_admin) {
      setHasChecked(true);
      navigate('/', { replace: true });
      return;
    }

    if (requiredRole === 'agent' && !user.is_agent) {
      setHasChecked(true);
      navigate('/', { replace: true });
      return;
    }

    setHasChecked(true);
  }, [isHydrated, isAuthenticated, user, requiredRole, navigate, hasChecked]);

  if (!isHydrated || !hasChecked) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (requiredRole === 'seller' && !user.is_seller) {
    return null;
  }

  if (requiredRole === 'admin' && !user.is_admin) {
    return null;
  }

  if (requiredRole === 'agent' && !user.is_agent) {
    return null;
  }

  return <>{children}</>;
}
