import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'seller' | 'admin' | 'agent';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
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
  }, [isAuthenticated, user, requiredRole, navigate, hasChecked]);

  if (!hasChecked) {
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
