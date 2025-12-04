// src/components/Header.tsx
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Header() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/user/');
        if (!cancelled) setUser(res.data);
      } catch (err: any) {
        if (!cancelled && err.response?.status === 401) {
          if (!window.location.pathname.startsWith('/login')) {
            navigate('/login', { replace: true });
          }
        }
      }
    };
    fetchUser();
    return () => { cancelled = true; };
  }, [navigate]);

  const handleLogout = async () => {
    await api.post('/auth/logout/');
    navigate('/login', { replace: true });
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Левая часть — логотип */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-800 hover:opacity-80 transition">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-bug h-6 w-6 text-emerald-600"
            >
              <path d="m8 2 1.88 1.88"></path>
              <path d="M14.12 3.88 16 2"></path>
              <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"></path>
              <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"></path>
              <path d="M12 20v-9"></path>
              <path d="M6.53 9C4.6 8.8 3 7.1 3 5"></path>
              <path d="M6 13H2"></path>
              <path d="M3 21c0-2.1 1.7-3.9 3.8-4"></path>
              <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"></path>
              <path d="M22 13h-4"></path>
              <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"></path>
            </svg>
            Паук
          </Link>

          {/* Навигация */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link className="text-sm font-medium text-gray-600 hover:text-gray-800 transition" to="/modules">
              Модули
            </Link>
            <Link className="text-sm font-medium text-gray-600 hover:text-gray-800 transition" to="/instructions">
              Инструкции
            </Link>
          </nav>
        </div>

        {/* Правая часть — действия */}
        <div className="flex items-center space-x-6">

          {user ? (
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-600 hover:text-gray-800 transition"
            >
              Разлогиниться
            </button>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-800 transition"
            >
              Войти
            </Link>
          )}

          <Link
            to="/lk"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-emerald-600 text-white hover:bg-emerald-700 h-10 px-4 py-2"
          >
            Личный кабинет
          </Link>
        </div>
      </div>
    </header>
  );
}