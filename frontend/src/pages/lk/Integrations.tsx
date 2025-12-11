import {useState, useEffect} from 'react';
import api from '../../api/client';
import DashboardLayout from "../../components/DashboardLayout.tsx";
import {usePageSubtitle} from "../../hooks/usePageTitle.ts";
import {Edit2, Save, ExternalLink, Info, Link, X} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

export default function Integrations() {
    usePageSubtitle('Интеграции');
    const { showNotification } = useNotifications();

    const [credentials, setCredentials] = useState({
        ozon: {client_id: '', api_key: ''},
        wb: {api_key: ''},
        ym: {api_key: ''},
    });

    const [initialCredentials, setInitialCredentials] = useState({
        ozon: {client_id: '', api_key: ''},
        wb: {api_key: ''},
        ym: {api_key: ''},
    });

    const [editing, setEditing] = useState({
        ozon: false,
        wb: false,
        ym: false,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    // Загружаем сохранённые ключи при монтировании компонента
    useEffect(() => {
        const fetchCredentials = async () => {
            setLoading(true);
            try {
                const response = await api.get('/api/accounts/credentials/');
                if (response.data) {
                    const newCredentials = {
                        ozon: response.data.ozon || {client_id: '', api_key: ''},
                        wb: response.data.wb || {api_key: ''},
                        ym: response.data.ym || {api_key: ''},
                    };
                    setCredentials(newCredentials);
                    setInitialCredentials(newCredentials);

                    // Показываем уведомление, если есть сохранённые ключи
                    const hasAnyCredentials =
                        newCredentials.ozon.client_id ||
                        newCredentials.ozon.api_key ||
                        newCredentials.wb.api_key ||
                        newCredentials.ym.api_key;

                    if (hasAnyCredentials) {
                        showNotification('Ключи интеграций успешно загружены', 'success', 5000);
                    }
                }
            } catch (err: any) {
                console.error('Ошибка загрузки ключей:', err);
                showNotification('Ошибка при загрузке сохранённых ключей', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchCredentials();
    }, [showNotification]);

    const handleChange = (mp: string, field: string, value: string) => {
        setCredentials(prev => ({
            ...prev,
            [mp]: {...prev[mp as keyof typeof prev], [field]: value}
        }));
    };

    // Валидация полей перед отправкой
    const validateFields = (mp: string) => {
        const creds = credentials[mp as keyof typeof credentials];

        if (mp === 'ozon') {
            if (!creds.client_id?.trim() || !creds.api_key?.trim()) {
                showNotification('Для Ozon необходимо заполнить оба поля: Client ID и API Key', 'error');
                return false;
            }
        } else {
            if (!creds.api_key?.trim()) {
                showNotification(`Для ${mp.toUpperCase()} необходимо заполнить API Key`, 'error');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (mp: string) => {
        // Валидация
        if (!validateFields(mp)) {
            return;
        }

        setSaving(mp);

        try {
            await api.post('/api/accounts/credentials/', {
                marketplace: mp,
                ...(credentials[mp as keyof typeof credentials] as any)
            });

            // Показываем успешное уведомление
            showNotification(
                `${mp.toUpperCase()} успешно ${hasSavedCredentials(mp) ? 'обновлён' : 'подключён'}`,
                'success'
            );

            // Обновляем начальные значения после успешного сохранения
            setInitialCredentials(prev => ({
                ...prev,
                [mp]: credentials[mp as keyof typeof credentials]
            }));

            // Выходим из режима редактирования
            setEditing(prev => ({...prev, [mp]: false}));

        } catch (err: any) {
            showNotification(
                'Ошибка: ' + (err.response?.data?.detail || 'неизвестно'),
                'error'
            );
        } finally {
            setSaving(null);
        }
    };

    // Функция для проверки, есть ли сохранённые ключи у маркетплейса (проверяем начальные значения)
    const hasSavedCredentials = (mp: string) => {
        const initialCreds = initialCredentials[mp as keyof typeof initialCredentials];
        if (mp === 'ozon') {
            return initialCreds.client_id && initialCreds.api_key;
        }
        return initialCreds.api_key;
    };

    const toggleEdit = (mp: string) => {
        if (editing[mp]) {
            // Если выходим из режима редактирования, возвращаем оригинальные значения
            setCredentials(prev => ({
                ...prev,
                [mp]: initialCredentials[mp as keyof typeof initialCredentials]
            }));
        }
        setEditing(prev => ({...prev, [mp]: !prev[mp]}));
    };

    // Функция для отмены редактирования
    const handleCancel = (mp: string) => {
        // Возвращаем исходные значения
        setCredentials(prev => ({
            ...prev,
            [mp]: initialCredentials[mp as keyof typeof initialCredentials]
        }));
        setEditing(prev => ({...prev, [mp]: false}));
    };

    // Описания и ссылки для каждого маркетплейса
    const marketplaceInfo = {
        ozon: {
            name: 'Ozon',
            docsLink: 'https://docs.ozon.ru/api/seller/',
            description: 'Для автоматизации работы с Ozon вам потребуется Client ID и API Key. Получить их можно в личном кабинете продавца Ozon Seller.'
        },
        wb: {
            name: 'Wildberries',
            docsLink: 'https://openapi.wb.ru/',
            description: 'Для доступа к статистике Wildberries необходим API ключ. Получить токен можно в разделе "Настройки" -> "Доступ к API" личного кабинета Wildberries.'
        },
        ym: {
            name: 'Яндекс.Маркет',
            docsLink: 'https://yandex.ru/dev/market/partner-api/doc/ru/',
            description: 'Для интеграции с Яндекс.Маркет потребуется API ключ. Получить его можно в личном кабинете партнёра Яндекс.Маркета.'
        }
    };

    const renderMarketplaceForm = (mp: 'ozon' | 'wb' | 'ym') => {
        const info = marketplaceInfo[mp];
        const hasSaved = hasSavedCredentials(mp);
        const isCurrentlyEditing = editing[mp];

        return (
            <div className="bg-white/80 backdrop-blur border border-white/30 rounded-xl p-6 shadow relative">
                {/* Заголовок и кнопки */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-emerald-900">{info.name}</h2>
                        {hasSaved && !isCurrentlyEditing && (
                            <div className="flex items-center mt-1 text-sm text-emerald-600">
                                <Info size={14} className="mr-1"/>
                                <span>Ключи подключены</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {isCurrentlyEditing && (
                            <button
                                type="button"
                                onClick={() => handleCancel(mp)}
                                disabled={saving === mp}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
                            >
                                <X size={18}/>
                                Отмена
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => isCurrentlyEditing ? handleSubmit(mp) : toggleEdit(mp)}
                            disabled={loading || saving === mp}
                            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {saving === mp ? (
                                'Сохранение...'
                            ) : isCurrentlyEditing ? (
                                <>
                                    <Save size={18}/>
                                    Сохранить
                                </>
                            ) : hasSaved ? (
                                <>
                                    <Edit2 size={18}/>
                                    Изменить
                                </>
                            ) : (
                                <>
                                    <Link size={18}/>
                                    Подключить
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Описание и ссылка на документацию */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-700 text-sm mb-2">
                        <strong>Описание:</strong> {info.description}
                    </p>
                    <a
                        href={info.docsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                        Инструкция по получению API ключа
                        <ExternalLink size={14} className="ml-1"/>
                    </a>
                </div>

                {/* Форма */}
                <div className="space-y-4">
                    {/* Скрытые поля для отвлечения автозаполнения браузера */}
                    <div style={{display: 'none'}}>
                        <input
                            type="text"
                            name="username"
                            autoComplete="username"
                            tabIndex={-1}
                            readOnly
                        />
                        <input
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            tabIndex={-1}
                            readOnly
                        />
                    </div>

                    {mp === 'ozon' && (
                        <>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Client ID</label>
                                <input
                                    type="text"
                                    value={credentials.ozon.client_id}
                                    onChange={(e) => handleChange('ozon', 'client_id', e.target.value)}
                                    className="w-full px-3 py-2 bg-white/80 border border-gray-300 rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    disabled={!isCurrentlyEditing && hasSaved}
                                    required
                                    autoComplete="off"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">API Key</label>
                                <input
                                    type="password"
                                    value={credentials.ozon.api_key}
                                    onChange={(e) => handleChange('ozon', 'api_key', e.target.value)}
                                    className="w-full px-3 py-2 bg-white/80 border border-gray-300 rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    disabled={!isCurrentlyEditing && hasSaved}
                                    required
                                    placeholder={!isCurrentlyEditing && hasSaved ? "••••••••••••" : ""}
                                    autoComplete="new-password"
                                />
                            </div>
                        </>
                    )}

                    {(mp === 'wb' || mp === 'ym') && (
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">API Key</label>
                            <input
                                type="password"
                                value={credentials[mp].api_key}
                                onChange={(e) => handleChange(mp, 'api_key', e.target.value)}
                                className="w-full px-3 py-2 bg-white/80 border border-gray-300 rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                                disabled={!isCurrentlyEditing && hasSaved}
                                required
                                placeholder={!isCurrentlyEditing && hasSaved ? "••••••••••••" : ""}
                                autoComplete="new-password"
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-emerald-900 mb-2">Интеграции с маркетплейсами</h1>

                {/* Общее описание страницы */}
                <div
                    className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl">
                    <h2 className="text-lg font-semibold text-emerald-800 mb-3">
                        Подключите свои личные кабинеты на маркетплейсах
                    </h2>
                    <p className="text-gray-700 mb-4">
                        Прикрепите API ключи от ваших маркетплейсов, чтобы начать автоматизировать процессы управления
                        продажами. Наша система будет синхронизировать заказы, остатки товаров, цены и статистику,
                        экономя ваше время и минимизируя ручную работу.
                    </p>
                    <ul className="text-gray-600 text-sm space-y-2">
                        <li>• <strong>Автоматическая синхронизация</strong> заказов и обновление статусов</li>
                        <li>• <strong>Управление остатками</strong> товаров на нескольких складах</li>
                        <li>• <strong>Передача цен</strong> и скидок в маркетплейсы</li>
                        <li>• <strong>Защита от парсеров</strong> через настройку минимального и максимального остатка
                        </li>
                        <li>• <strong>Создание отчётов</strong> по комиссиям и начислениям</li>
                    </ul>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div
                            className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        <p className="mt-4 text-gray-600">Загрузка данных интеграций...</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {renderMarketplaceForm('ozon')}
                        {renderMarketplaceForm('wb')}
                        {renderMarketplaceForm('ym')}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}