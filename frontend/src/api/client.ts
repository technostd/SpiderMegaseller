import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
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

api.interceptors.request.use(
  (config) => {
    // Можно добавить логирование запросов для отладки
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.log(`[API Error] ${error.response?.status} ${error.config?.url}`, error.response?.data);

    const originalRequest = error.config;

    // Если 401 и это не запрос на refresh и мы еще не пытались повторить
    if (error.response?.status === 401 &&
        !originalRequest.url?.includes('token/refresh') &&
        !originalRequest._retry) {

      if (isRefreshing) {
        // Ждём, пока refresh завершится
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Делаем POST запрос на refresh с корректными данными
        console.log('[Token Refresh] Attempting token refresh...');

        const response = await axios.post(
          'http://localhost:8000/api/auth/token/refresh/',
          {}, // Empty body if using cookies
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        console.log('[Token Refresh] Success');

        // Если refresh возвращает новый токен в JSON (опционально)
        if (response.data?.access) {
          // Сохраняем новый токен для подписчиков
          onRefreshed(response.data.access);

          // Обновляем заголовок для текущего запроса
          originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
        }

        // Повторяем оригинальный запрос
        return api(originalRequest);
      } catch (refreshError) {
        console.log('[Token Refresh] Failed', refreshError);

        // Refresh провалился — редирект на логин
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Если это ошибка refresh, тоже редиректим на логин
    if (error.response?.status === 401 && originalRequest.url?.includes('token/refresh')) {
      console.log('[Token Refresh] Refresh token expired, redirecting to login');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;