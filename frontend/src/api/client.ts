// src/api/client.ts
import axios from 'axios';

const API_URL = import.meta.env.DEV
    ? window.location.hostname === 'localhost'
        ? 'http://localhost:8000/api'
        : `http://${window.location.hostname}:8000/api`
    : '/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {'Content-Type': 'application/json'},
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
    refreshSubscribers.forEach(callback => callback(token));
    refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
    refreshSubscribers.push(callback);
};

// Список публичных эндпоинтов, которые НЕ должны вызывать редирект
const PUBLIC_ENDPOINTS = [
    '/auth/login/',
    '/auth/register/',
    '/auth/password/reset/',
];

// Список публичных путей на фронтенде
const PUBLIC_PATHS = [
    '/',
    '/login',
    '/register',
    '/instructions',
    '/modules',
    '/module/ai-reviews',
    '/module/ai-reviews/test',
];

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Если ошибка не 401 или это публичный эндпоинт - просто прокидываем ошибку
        if (error.response?.status !== 401 ||
            PUBLIC_ENDPOINTS.some(endpoint => originalRequest.url?.includes(endpoint))) {
            return Promise.reject(error);
        }

        // Если пользователь на публичной странице - не делаем редирект
        if (PUBLIC_PATHS.some(path => window.location.pathname === path ||
            window.location.pathname.startsWith(path))) {
            return Promise.reject(error);
        }

        // Если 401 и это не запрос на refresh и мы еще не пытались повторить
        if (!originalRequest.url?.includes('token/refresh') && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve) => {
                    addRefreshSubscriber((token: string) => {
                        if (token) {
                            originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        }
                        resolve(api(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await axios.post(
                    'http://localhost:8000/api/auth/token/refresh/',
                    {},
                    {
                        withCredentials: true,
                        headers: {'Content-Type': 'application/json'}
                    }
                );

                // Если refresh возвращает новый токен
                if (response.data?.access) {
                    onRefreshed(response.data.access);
                    originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
                }

                isRefreshing = false;
                return api(originalRequest);
            } catch (refreshError) {
                console.log('[Token Refresh] Failed', refreshError);
                isRefreshing = false;

                // Вместо хардкодного редиректа - просто прокидываем ошибку
                // AuthProvider сам решит, нужно ли редиректить
                return Promise.reject(refreshError);
            }
        }

        // Если это ошибка refresh
        if (originalRequest.url?.includes('token/refresh')) {
            console.log('[Token Refresh] Refresh token expired');
        }

        return Promise.reject(error);
    }
);

export default api;