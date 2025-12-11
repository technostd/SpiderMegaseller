// context/NotificationContext.tsx
import { createContext, useContext, useState, type ReactNode, useCallback } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    duration?: number; // в миллисекундах
    timestamp: number;
}

interface NotificationContextType {
    notifications: Notification[];
    showNotification: (message: string, type?: NotificationType, duration?: number) => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const MAX_NOTIFICATIONS = 7;

    const showNotification = useCallback((
        message: string,
        type: NotificationType = 'info',
        duration = 10000
    ) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const newNotification: Notification = {
            id,
            message,
            type,
            duration,
            timestamp: Date.now(),
        };

        setNotifications(prev => {
            const newNotifications = [newNotification, ...prev];
            // Ограничиваем количество уведомлений
            if (newNotifications.length > MAX_NOTIFICATIONS) {
                return newNotifications.slice(0, MAX_NOTIFICATIONS);
            }
            return newNotifications;
        });
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            showNotification,
            removeNotification,
            clearNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}