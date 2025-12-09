// src/contexts/AuthContext.tsx
import {createContext, useContext, useEffect, useState} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import api from '../api/client';

const PROTECTED_PATHS = [
    '/lk',
];

const DEFAULT_AFTER_LOGIN = '/lk';

interface User {
    id: number;
    email: string;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

// Создаем контекст с начальным значением undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // Функция для проверки авторизации
    const checkAuth = async () => {
        try {
            const res = await api.get('/auth/user/');
            setUser(res.data);
            return true;
        } catch (err: any) {
            if (err.response?.status === 401) {
                setUser(null);
                return false;
            }
            // Другие ошибки (сеть, 500 и т.д.) - не сбрасываем авторизацию
            throw err;
        }
    };

    // Инициализация при загрузке приложения
    useEffect(() => {
        let cancelled = false;

        const initAuth = async () => {
            try {
                await checkAuth();
            } catch (error) {
                console.error('Auth init error:', error);
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        initAuth();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const isProtectedPath = PROTECTED_PATHS.some(path =>
            location.pathname.startsWith(path)
        );

        if (isProtectedPath && !user && !isLoading) {
            navigate('/login', {
                replace: true,
                state: {from: location.pathname}
            });
        }
    }, [location.pathname, user, isLoading, navigate]);

    const login = async (email: string, password: string) => {
        await api.post('/auth/login/', {email, password});
        await checkAuth();

        const from = (location.state as any)?.from || DEFAULT_AFTER_LOGIN;
        navigate(from, {replace: true});
    };

    const logout = async () => {
        await api.post('/auth/logout/');
        setUser(null);
        navigate('/login', {replace: true});
    };

    const refreshUser = async () => {
        await checkAuth();
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            logout,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}