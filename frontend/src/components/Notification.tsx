// components/Notification.tsx
import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
    id: string;
    message: string;
    type?: NotificationType;
    duration?: number; // в миллисекундах
    onClose: () => void;
}

export default function Notification({
    id,
    message,
    type = 'info',
    duration = 10000, // 10 секунд по умолчанию
    onClose
}: NotificationProps) {
    const [isClosing, setIsClosing] = useState(false);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (!message) return;

        let startTime = Date.now();
        const totalTime = duration;

        // Анимация прогресс-бара
        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, totalTime - elapsed);
            const newProgress = (remaining / totalTime) * 100;
            setProgress(newProgress);
        }, 50);

        // Начинаем закрытие за 300ms до окончания времени
        const closeTimer = setTimeout(() => {
            setIsClosing(true);
        }, duration - 300);

        // Полностью закрываем через duration
        const hideTimer = setTimeout(() => {
            onClose();
        }, duration);

        return () => {
            clearInterval(progressInterval);
            clearTimeout(closeTimer);
            clearTimeout(hideTimer);
        };
    }, [message, duration, onClose, id]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };

    const typeConfig = {
        success: {
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            text: 'text-emerald-800',
            icon: <CheckCircle size={20} className="text-emerald-600" />
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-800',
            icon: <AlertCircle size={20} className="text-red-600" />
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-800',
            icon: <Info size={20} className="text-blue-600" />
        },
        warning: {
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-800',
            icon: <AlertTriangle size={20} className="text-amber-600" />
        }
    };

    const config = typeConfig[type];

    return (
        <div
            className={`
                transition-all duration-300 ease-in-out transform
                ${isClosing ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
                ${config.bg} ${config.border} ${config.text}
                border rounded-lg shadow-lg overflow-hidden
                animate-slideInRight
            `}
        >
            {/* Прогресс-бар */}
            <div className="h-1 w-full bg-gray-200">
                <div
                    className={`h-full ${
                        type === 'success' ? 'bg-emerald-500' :
                        type === 'error' ? 'bg-red-500' :
                        type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                    } transition-all duration-50 ease-linear`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="p-4 flex items-start justify-between">
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                        {config.icon}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium">{message}</p>
                    </div>
                </div>
                <button
                    onClick={handleClose}
                    className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Закрыть уведомление"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}