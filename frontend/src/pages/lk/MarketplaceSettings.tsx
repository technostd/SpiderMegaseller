// pages/MarketplaceSettings.tsx
import {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import {usePageSubtitle} from "../../hooks/usePageTitle.ts";
import {ArrowLeft, Save, ExternalLink, Eye, EyeOff, CheckCircle, AlertCircle} from 'lucide-react';
import api from '../../api/client';
import {useNotifications} from '../../contexts/NotificationContext';

import ozonIcon from '../../assets/ozon.svg';
import wbIcon from '../../assets/wb.svg';
import ymIcon from '../../assets/ym.svg';

const marketplaceConfigs = {
    ozon: {
        name: 'Ozon',
        color: 'bg-gradient-to-br from-blue-600 to-blue-800',
        bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
        borderColor: 'border-blue-200',
        icon: <img src={ozonIcon} alt="Ozon" className="w-16 h-16"/>,
        description: 'Подключение Ozon Seller API для автоматизации продаж',
        docsLink: 'https://docs.ozon.ru/api/seller/',
        docsName: 'Ozon Seller API',
        fields: [
            {
                name: 'client_id',
                label: 'Client ID',
                type: 'text',
                required: true,
                placeholder: 'Введите ваш Client ID из кабинета Ozon',
                help: 'Находится в разделе "Интеграции" → "API ключи"'
            },
            {
                name: 'api_key',
                label: 'API Key',
                type: 'password',
                required: true,
                placeholder: 'Введите ваш API ключ',
                help: 'Секретный ключ для доступа к API Ozon'
            }
        ]
    },
    wb: {
        name: 'Wildberries',
        color: 'bg-gradient-to-br from-purple-600 to-purple-800',
        bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
        borderColor: 'border-purple-200',
        icon: <img src={wbIcon} alt="Wildberries" className="w-16 h-16"/>,
        description: 'Подключение Wildberries API для работы с заказами и статистикой',
        docsLink: 'https://openapi.wb.ru/',
        docsName: 'Wildberries API',
        fields: [
            {
                name: 'api_key',
                label: 'API Key',
                type: 'password',
                required: true,
                placeholder: 'Введите ваш API ключ из кабинета WB',
                help: 'Можно получить в разделе "Настройки" → "Доступ к API"'
            }
        ]
    },
    ym: {
        name: 'Яндекс.Маркет',
        color: 'bg-gradient-to-br from-red-500 to-red-700',
        bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
        borderColor: 'border-red-200',
        icon: <img src={ymIcon} alt="Яндекс.Маркет" className="w-16 h-16"/>,
        description: 'Подключение Яндекс.Маркет API для управления товарами и заказами',
        docsLink: 'https://yandex.ru/dev/market/partner-api/doc/ru/',
        docsName: 'Яндекс.Маркет API',
        fields: [
            {
                name: 'api_key',
                label: 'API Key',
                type: 'password',
                required: true,
                placeholder: 'Введите ваш API ключ из кабинета Яндекс.Маркет',
                help: 'Токен можно получить в личном кабинете партнёра'
            }
        ]
    }
};

export default function MarketplaceSettings() {
    const {marketplaceId} = useParams<{ marketplaceId: string }>();
    const navigate = useNavigate();
    const {showNotification} = useNotifications();

    const config = marketplaceConfigs[marketplaceId as keyof typeof marketplaceConfigs];
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [credentials, setCredentials] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [hasExistingCredentials, setHasExistingCredentials] = useState(false);

    usePageSubtitle(config ? `Настройка ${config.name}` : 'Настройка маркетплейса');

    useEffect(() => {
        const fetchCredentials = async () => {
            if (!marketplaceId) return;

            setLoading(true);
            try {
                // Получаем все сохранённые ключи
                const response = await api.get('/api/accounts/credentials/');
                if (response.data && response.data[marketplaceId]) {
                    const marketplaceCreds = response.data[marketplaceId];
                    setCredentials(marketplaceCreds);

                    // Проверяем, есть ли уже сохранённые ключи
                    const hasKeys = config.fields.every(field =>
                        marketplaceCreds[field.name] && marketplaceCreds[field.name].trim()
                    );
                    setHasExistingCredentials(hasKeys);
                }
            } catch (err: any) {
                console.error('Ошибка загрузки ключей:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCredentials();
    }, [marketplaceId]);

    const handleChange = (field: string, value: string) => {
        setCredentials(prev => ({...prev, [field]: value}));
    };

    const validateForm = () => {
        if (!config) return false;

        for (const field of config.fields) {
            if (field.required && (!credentials[field.name] || !credentials[field.name].trim())) {
                showNotification(`Поле "${field.label}" обязательно для заполнения`, 'error');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!marketplaceId || !config) return;

        if (!validateForm()) {
            return;
        }

        setSaving(true);
        try {
            await api.post('/api/accounts/credentials/', {
                marketplace: marketplaceId,
                ...credentials
            });

            showNotification(
                `${config.name} успешно ${hasExistingCredentials ? 'обновлён' : 'подключён'}`,
                'success'
            );
            navigate('/lk/integrations');
        } catch (err: any) {
            showNotification('Ошибка сохранения: ' + (err.response?.data?.detail || 'неизвестно'), 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!config) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Маркетплейс не найден</h2>
                        <button
                            onClick={() => navigate('/lk/integrations')}
                            className="inline-flex items-center text-emerald-600 hover:text-emerald-800 font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2"/>
                            Вернуться к интеграциям
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="text-center py-12">
                        <div
                            className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        <p className="mt-4 text-gray-600">Загрузка настроек...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Навигация */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/lk/integrations')}
                        className="inline-flex items-center text-emerald-600 hover:text-emerald-800 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2"/>
                        Назад к интеграциям
                    </button>
                </div>

                {/* Заголовок */}
                <div className={`${config.bgColor} border ${config.borderColor} rounded-2xl p-8 mb-8`}>
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            {config.icon}
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{config.name}</h1>
                                <p className="text-gray-600 mt-1">{config.description}</p>
                            </div>
                        </div>
                        {hasExistingCredentials && (
                            <div className="flex items-center bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                                <CheckCircle className="w-4 h-4 mr-2"/>
                                <span className="text-sm font-medium">Уже подключено</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Что даёт интеграция?</h3>
                            <ul className="space-y-2 text-gray-600">
                                <li className="flex items-center">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                                    Автоматическая синхронизация заказов
                                </li>
                                <li className="flex items-center">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                                    Управление остатками товаров
                                </li>
                                <li className="flex items-center">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                                    Обновление цен и скидок
                                </li>
                                <li className="flex items-center">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                                    Статистика продаж и аналитика
                                </li>
                            </ul>
                        </div>
                        <div className="bg-white/80 rounded-xl p-4 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Полезные ссылки</h3>
                            <a
                                href={config.docsLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-2"
                            >
                                <ExternalLink className="w-4 h-4 mr-2"/>
                                Документация {config.docsName}
                            </a>
                            <p className="text-sm text-gray-500 mt-3">
                                Инструкция по получению API ключей доступна в официальной документации
                            </p>
                        </div>
                    </div>
                </div>

                {/* Форма */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Настройка API ключей</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Скрытые поля для отвлечения автозаполнения */}
                        <div style={{display: 'none'}}>
                            <input type="text" name="username" autoComplete="username" readOnly/>
                            <input type="password" name="password" autoComplete="current-password" readOnly/>
                        </div>

                        {config.fields.map((field) => (
                            <div key={field.name} className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>

                                {field.type === 'password' ? (
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={credentials[field.name] || ''}
                                            onChange={(e) => handleChange(field.name, e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
                                            placeholder={field.placeholder}
                                            required={field.required}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                                        </button>
                                    </div>
                                ) : (
                                    <input
                                        type={field.type}
                                        value={credentials[field.name] || ''}
                                        onChange={(e) => handleChange(field.name, e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
                                        placeholder={field.placeholder}
                                        required={field.required}
                                        autoComplete="off"
                                    />
                                )}

                                {field.help && (
                                    <p className="text-sm text-gray-500">{field.help}</p>
                                )}
                            </div>
                        ))}

                        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                            <div className="text-sm text-gray-500">
                                <AlertCircle className="w-4 h-4 inline mr-1"/>
                                Ключи хранятся в зашифрованном виде
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    type="button"
                                    onClick={() => navigate('/lk/integrations')}
                                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    {saving ? (
                                        <>
                                            <div
                                                className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Сохранение...
                                        </>
                                    ) : hasExistingCredentials ? (
                                        <>
                                            <Save className="w-5 h-5 mr-2"/>
                                            Обновить ключи
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5 mr-2"/>
                                            Подключить {config.name}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}