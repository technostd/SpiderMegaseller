// src/components/PrivateRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { checkAuth } from '../api/checkAuth';

export default function PrivateRoute() {
  const [authStatus, setAuthStatus] = useState<'idle' | 'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      const isAuth = await checkAuth();
      if (!cancelled) {
        setAuthStatus(isAuth ? 'authenticated' : 'unauthenticated');
      }
    };

    verify();
    return () => { cancelled = true; };
  }, []);

  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <div className="text-emerald-700">Проверка доступа...</div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}