import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Edit2,
    ExternalLink,
    Info,
    Link as LinkIcon,
    Mail,
    Save,
    X,
} from 'lucide-react';

import api from '../../api/client';
import DashboardLayout from '../../components/DashboardLayout.tsx';
import { usePageSubtitle } from '../../hooks/usePageTitle.ts';
import { useNotifications } from '../../contexts/NotificationContext';

type Marketplace = 'ozon' | 'wb' | 'ym';

type CredentialsState = {
    ozon: {
        client_id: string;
        api_key: string;
    };
    wb: {
        api_key: string;
    };
    ym: {
        api_key: string;
    };
};

type EditingState = Record<Marketplace, boolean>;

type MarketplaceInfo = {
    name: string;
    docsLink: string;
    description: string;
};

const emptyCredentials: CredentialsState = {
    ozon: {
        client_id: '',
        api_key: '',
    },
    wb: {
        api_key: '',
    },
    ym: {
        api_key: '',
    },
};

export default function Integrations() {
    usePageSubtitle('Интеграции');

    const { showNotification } = useNotifications();

    const [credentials, setCredentials] = useState<CredentialsState>(emptyCredentials);
    const [initialCredentials, setInitialCredentials] = useState<CredentialsState>(emptyCredentials);

    const [editing, setEditing] = useState<EditingState>({
        ozon: false,
        wb: false,
        ym: false,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<Marketplace | null>(null);

    useEffect(() => {
        const fetchCredentials = async () => {
            setLoading(true);

            try {
                const response = await api.get('/accounts/credentials/');

                const newCredentials: CredentialsState = {
                    ozon: {
                        client_id: response.data?.ozon?.client_id || '',
                        api_key: response.data?.ozon?.api_key || '',
                    },
                    wb: {
                        api_key: response.data?.wb?.api_key || '',
                    },
                    ym: {
                        api_key: response.data?.ym?.api_key || '',
                    },
                };

                setCredentials(newCredentials);
                setInitialCredentials(newCredentials);

                const hasAnyCredentials =
                    Boolean(newCredentials.ozon.client_id) ||
                    Boolean(newCredentials.ozon.api_key) ||
                    Boolean(newCredentials.wb.api_key) ||
                    Boolean(newCredentials.ym.api_key);

                if (hasAnyCredentials) {
                    showNotification('Ключи интеграций успешно загружены', 'success', 5000);
                }
            } catch (err) {
                console.error('Ошибка загрузки ключей:', err);
                showNotification('Ошибка при загрузке сохранённых ключей', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchCredentials();
    }, [showNotification]);

    const handleChange = (
        mp: Marketplace,
        field: 'client_id' | 'api_key',
        value: string
    ) => {
        setCredentials((prev) => {
            if (mp === 'ozon') {
                return {
                    ...prev,
                    ozon: {
                        ...prev.ozon,
                        [field]: value,
                    },
                };
            }

            return {
                ...prev,
                [mp]: {
                    ...prev[mp],
                    api_key: value,
                },
            };
        });
    };

    const validateFields = (mp: Marketplace) => {
        if (mp === 'ozon') {
            if (!credentials.ozon.client_id.trim() || !credentials.ozon.api_key.trim()) {
                showNotification(
                    'Для Ozon необходимо заполнить оба поля: Client ID и API Key',
                    'error'
                );
                return false;
            }

            return true;
        }

        if (!credentials[mp].api_key.trim()) {
            showNotification(
                `Для ${mp.toUpperCase()} необходимо заполнить API Key`,
                'error'
            );
            return false;
        }

        return true;
    };

    const hasSavedCredentials = (mp: Marketplace) => {
        if (mp === 'ozon') {
            return Boolean(
                initialCredentials.ozon.client_id &&
                initialCredentials.ozon.api_key
            );
        }

        return Boolean(initialCredentials[mp].api_key);
    };

    const handleSubmit = async (mp: Marketplace) => {
        if (!validateFields(mp)) {
            return;
        }

        setSaving(mp);

        try {
            const payload =
                mp === 'ozon'
                    ? {
                          marketplace: mp,
                          client_id: credentials.ozon.client_id,
                          api_key: credentials.ozon.api_key,
                      }
                    : {
                          marketplace: mp,
                          api_key: credentials[mp].api_key,
                      };

            await api.post('/accounts/credentials/', payload);

            showNotification(
                `${mp.toUpperCase()} успешно ${
                    hasSavedCredentials(mp) ? 'обновлён' : 'подключён'
                }`,
                'success'
            );

            setInitialCredentials((prev) => ({
                ...prev,
                [mp]: credentials[mp],
            }));

            setEditing((prev) => ({
                ...prev,
                [mp]: false,
            }));
        } catch (err: any) {
            showNotification(
                'Ошибка: ' + (err.response?.data?.detail || err.response?.data?.error || 'неизвестно'),
                'error'
            );
        } finally {
            setSaving(null);
        }
    };

    const toggleEdit = (mp: Marketplace) => {
        if (editing[mp]) {
            setCredentials((prev) => ({
                ...prev,
                [mp]: initialCredentials[mp],
            }));
        }

        setEditing((prev) => ({
            ...prev,
            [mp]: !prev[mp],
        }));
    };

    const handleCancel = (mp: Marketplace) => {
        setCredentials((prev) => ({
            ...prev,
            [mp]: initialCredentials[mp],
        }));

        setEditing((prev) => ({
            ...prev,
            [mp]: false,
        }));
    };

    const marketplaceInfo: Record<Marketplace, MarketplaceInfo> = {
        ozon: {
            name: 'Ozon',
            docsLink: 'https://docs.ozon.ru/api/seller/',
            description:
                'Для автоматизации работы с Ozon вам потребуется Client ID и API Key. Получить их можно в личном кабинете продавца Ozon Seller.',
        },
        wb: {
            name: 'Wildberries',
            docsLink: 'https://openapi.wb.ru/',
            description:
                'Для доступа к статистике Wildberries необходим API ключ. Получить токен можно в разделе "Настройки" -> "Доступ к API" личного кабинета Wildberries.',
        },
        ym: {
            name: 'Яндекс.Маркет',
            docsLink: 'https://yandex.ru/dev/market/partner-api/doc/ru/',
            description:
                'Для интеграции с Яндекс.Маркет потребуется API ключ. Получить его можно в личном кабинете партнёра Яндекс.Маркета.',
        },
    };

    const renderMarketplaceForm = (mp: Marketplace) => {
        const info = marketplaceInfo[mp];
        const hasSaved = hasSavedCredentials(mp);
        const isCurrentlyEditing = editing[mp];

        return (
            <div className="bg-white/80 backdrop-blur border border-white/30 rounded-xl p-6 shadow relative">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-emerald-900">
                            {info.name}
                        </h2>

                        {hasSaved && !isCurrentlyEditing && (
                            <div className="flex items-center mt-1 text-sm text-emerald-600">
                                <Info size={14} className="mr-1" />
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
                                <X size={18} />
                                Отмена
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() =>
                                isCurrentlyEditing ? handleSubmit(mp) : toggleEdit(mp)
                            }
                            disabled={loading || saving === mp}
                            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {saving === mp ? (
                                'Сохранение...'
                            ) : isCurrentlyEditing ? (
                                <>
                                    <Save size={18} />
                                    Сохранить
                                </>
                            ) : hasSaved ? (
                                <>
                                    <Edit2 size={18} />
                                    Изменить
                                </>
                            ) : (
                                <>
                                    <LinkIcon size={18} />
                                    Подключить
                                </>
                            )}
                        </button>
                    </div>
                </div>

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
                        <ExternalLink size={14} className="ml-1" />
                    </a>
                </div>

                <div className="space-y-4">
                    <div style={{ display: 'none' }}>
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
                                <label className="block text-sm text-gray-700 mb-1">
                                    Client ID
                                </label>

                                <input
                                    type="text"
                                    value={credentials.ozon.client_id}
                                    onChange={(e) =>
                                        handleChange('ozon', 'client_id', e.target.value)
                                    }
                                    className="w-full px-3 py-2 bg-white/80 border border-gray-300 rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    disabled={!isCurrentlyEditing && hasSaved}
                                    required
                                    autoComplete="off"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-700 mb-1">
                                    API Key
                                </label>

                                <input
                                    type="password"
                                    value={credentials.ozon.api_key}
                                    onChange={(e) =>
                                        handleChange('ozon', 'api_key', e.target.value)
                                    }
                                    className="w-full px-3 py-2 bg-white/80 border border-gray-300 rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    disabled={!isCurrentlyEditing && hasSaved}
                                    required
                                    placeholder={
                                        !isCurrentlyEditing && hasSaved
                                            ? '••••••••••••'
                                            : ''
                                    }
                                    autoComplete="new-password"
                                />
                            </div>
                        </>
                    )}

                    {(mp === 'wb' || mp === 'ym') && (
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">
                                API Key
                            </label>

                            <input
                                type="password"
                                value={credentials[mp].api_key}
                                onChange={(e) =>
                                    handleChange(mp, 'api_key', e.target.value)
                                }
                                className="w-full px-3 py-2 bg-white/80 border border-gray-300 rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                                disabled={!isCurrentlyEditing && hasSaved}
                                required
                                placeholder={
                                    !isCurrentlyEditing && hasSaved
                                        ? '••••••••••••'
                                        : ''
                                }
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
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h1 className="text-2xl font-bold text-emerald-900">
                        Интеграции с маркетплейсами
                    </h1>

                    <RouterLink
                        to="/lk/settings/email"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition"
                    >
                        <Mail size={18} />
                        Email-уведомления
                    </RouterLink>
                </div>

                <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl">
                    <h2 className="text-lg font-semibold text-emerald-800 mb-3">
                        Подключите свои личные кабинеты на маркетплейсах
                    </h2>

                    <p className="text-gray-700 mb-4">
                        Прикрепите API ключи от ваших маркетплейсов, чтобы начать
                        автоматизировать процессы управления продажами. Наша система
                        будет синхронизировать заказы, остатки товаров, цены и
                        статистику, экономя ваше время и минимизируя ручную работу.
                    </p>

                    <ul className="text-gray-600 text-sm space-y-2">
                        <li>
                            • <strong>Автоматическая синхронизация</strong> заказов и
                            обновление статусов
                        </li>
                        <li>
                            • <strong>Управление остатками</strong> товаров на нескольких
                            складах
                        </li>
                        <li>
                            • <strong>Передача цен</strong> и скидок в маркетплейсы
                        </li>
                        <li>
                            • <strong>Защита от парсеров</strong> через настройку
                            минимального и максимального остатка
                        </li>
                        <li>
                            • <strong>Создание отчётов</strong> по комиссиям и начислениям
                        </li>
                    </ul>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                        <p className="mt-4 text-gray-600">
                            Загрузка данных интеграций...
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {renderMarketplaceForm('ozon')}
                        {/* {renderMarketplaceForm('wb')} */}
                        {/* {renderMarketplaceForm('ym')} */}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}