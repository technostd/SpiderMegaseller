import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Layout from '../components/Layout';

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const checkAndRedirect = async () => {
      try {
        await api.get('/auth/user/');
        if (!cancelled) {
          navigate('/lk', { replace: true });
        }
      } catch {
        // Не авторизован — оставляем на странице логина
      }
    };

    checkAndRedirect();
    return () => { cancelled = true; };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.email as HTMLInputElement).value;
    const password = (form.password as HTMLInputElement).value;

    try {
      await api.post('/auth/login/', { email, password });
      navigate('/lk', { replace: true });
    } catch (err: any) {
      alert('Ошибка входа: ' + (err.response?.data?.detail || 'Неверный email или пароль'));
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto flex min-h-[calc(100vh-64px)] items-center justify-center py-20">
          <div className="w-full max-w-md">
            <div className="bg-card rounded-xl border border-border shadow-lg p-8">
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-bug h-8 w-8 text-primary"
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
                </div>
                <p className="text-muted-foreground mt-2">Войдите в ваш аккаунт</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Пароль
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-white hover:bg-emerald-700 h-11 rounded-md px-4 py-3 text-base"
                >
                  Войти
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-sm text-muted-foreground">
                  Нет аккаунта?{' '}
                  <a
                    href="https://t.me/technostd"
                    className="font-medium text-primary hover:underline transition-colors"
                  >
                    Свяжитесь с администратором
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}