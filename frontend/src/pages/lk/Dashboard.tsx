import {useState, useEffect} from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import {Link} from 'react-router-dom';
import {usePageSubtitle} from "../../hooks/usePageTitle.ts";
import {
    Zap, Bot, CheckCircle, XCircle, AlertCircle,
    Settings, BarChart3, ExternalLink, Clock, RefreshCw, User, Mail, Phone,
    Calendar, Shield, Store
} from 'lucide-react';
import api from '../../api/client';
import {useNotifications} from '../../contexts/NotificationContext';

import ozonIcon from '../../assets/ozon.svg';
import wbIcon from '../../assets/wb.svg';
import ymIcon from '../../assets/ym.svg';

// Типы для маркетплейсов
interface MarketplaceStatus {
    name: string;
    key: string;
    connected: boolean;
    lastSync: string | null;
    icon: React.ReactNode;
    color: string;
    bgGradient: string;
    borderColor: string;
    docsLink: string;
    route: string;
}

// Типы для модулей
interface ModuleStatus {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    icon: React.ReactNode;
    bgGradient: string;
    borderColor: string;
    stats?: {
        total: number;
        today: number;
        successRate: number;
    };
}

// Тип для пользователя
interface UserInfo {
    name: string;
    email: string;
    phone: string;
    plan: string;
    registrationDate: string;
    stores: number;
    subscriptionEnd: string;
}

export default function Dashboard() {
    usePageSubtitle('Личный кабинет');
    const {showNotification} = useNotifications();

    const [userInfo, setUserInfo] = useState<UserInfo>({
        name: 'Иван Петров',
        email: 'ivan@example.com',
        phone: '+7 (999) 123-45-67',
        plan: 'Бизнес',
        registrationDate: '15.01.2024',
        stores: 3,
        subscriptionEnd: '15.01.2025'
    });

    const [marketplaces, setMarketplaces] = useState<MarketplaceStatus[]>([
        {
            name: 'Ozon',
            key: 'ozon',
            connected: false,
            lastSync: null,
            icon: <img src={ozonIcon} alt="Ozon" className="w-6 h-6"/>,
            color: 'text-white',
            bgGradient: 'bg-gradient-to-br from-blue-600 to-blue-800',
            borderColor: 'border-blue-300',
            docsLink: 'https://docs.ozon.ru/api/seller/',
            route: '/lk/integrations/ozon'
        },
        {
            name: 'Wildberries',
            key: 'wb',
            connected: false,
            lastSync: null,
            icon: <img src={wbIcon} alt="Wildberries" className="w-6 h-6"/>,
            color: 'text-white',
            bgGradient: 'bg-gradient-to-br from-purple-600 to-purple-800',
            borderColor: 'border-purple-300',
            docsLink: 'https://openapi.wb.ru/',
            route: '/lk/integrations/wb'
        },
        {
            name: 'Яндекс.Маркет',
            key: 'ym',
            connected: false,
            lastSync: null,
            icon: <img src={ymIcon} alt="Яндекс.Маркет" className="w-6 h-6"/>,
            color: 'text-white',
            bgGradient: 'bg-gradient-to-br from-red-500 to-red-700',
            borderColor: 'border-red-300',
            docsLink: 'https://yandex.ru/dev/market/partner-api/doc/ru/',
            route: '/lk/integrations/ym'
        }
    ]);

    const [modules, setModules] = useState<ModuleStatus[]>([
        {
            id: 'ai-reviews',
            name: 'ИИ-ответы на отзывы',
            description: 'Автоматическая генерация и отправка ответов на отзывы',
            enabled: false,
            icon: <Bot className="w-5 h-5"/>,
            bgGradient: 'bg-gradient-to-br from-emerald-50 to-blue-50',
            borderColor: 'border-emerald-200'
        },
        {
            id: 'analytics',
            name: 'Аналитика продаж',
            description: 'Детальная аналитика и отчеты по продажам',
            enabled: false,
            icon: <BarChart3 className="w-5 h-5"/>,
            bgGradient: 'bg-gradient-to-br from-blue-50 to-purple-50',
            borderColor: 'border-blue-200'
        },
        {
            id: 'auto-pricing',
            name: 'Автоценообразование',
            description: 'Автоматическая корректировка цен на товары',
            enabled: false,
            icon: <RefreshCw className="w-5 h-5"/>,
            bgGradient: 'bg-gradient-to-br from-amber-50 to-orange-50',
            borderColor: 'border-amber-200'
        }
    ]);

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalMarketplaces: 0,
        activeModules: 0,
        lastSync: 'Сегодня в 10:30',
        nextSync: 'Через 15 минут'
    });

    // Загружаем статусы интеграций и модулей
    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Загружаем статус интеграций
                const credentialsResponse = await api.get('/api/accounts/credentials/');

                // Загружаем статус модулей
                const modulesResponse = await api.get('/api/modules/status/');

                // Загружаем данные пользователя
                const userResponse = await api.get('/api/user/profile/');
                if (userResponse.data) {
                    setUserInfo(userResponse.data);
                }

                // Обновляем статусы маркетплейсов
                if (credentialsResponse.data) {
                    setMarketplaces(prev => prev.map(mp => ({
                        ...mp,
                        connected: !!credentialsResponse.data[mp.key]?.api_key ||
                            (mp.key === 'ozon' ? !!credentialsResponse.data[mp.key]?.client_id : false),
                        lastSync: credentialsResponse.data[mp.key]?.last_sync || null
                    })));
                }

                // Обновляем статусы модулей
                if (modulesResponse.data) {
                    setModules(prev => prev.map(module => ({
                        ...module,
                        enabled: modulesResponse.data[module.id]?.enabled || false,
                        stats: modulesResponse.data[module.id]?.stats || module.stats
                    })));
                }

                // Обновляем общую статистику
                const connectedCount = marketplaces.filter(mp =>
                    !!credentialsResponse.data?.[mp.key]?.api_key ||
                    (mp.key === 'ozon' ? !!credentialsResponse.data?.[mp.key]?.client_id : false)
                ).length;

                const activeModulesCount = modules.filter(m =>
                    modulesResponse.data?.[m.id]?.enabled
                ).length;

                setStats(prev => ({
                    ...prev,
                    totalMarketplaces: connectedCount,
                    activeModules: activeModulesCount
                }));

            } catch (err: any) {
                console.error('Ошибка загрузки данных дашборда:', err);
                showNotification('Ошибка загрузки данных дашборда', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
        // Обновляем данные каждые 5 минут
        const interval = setInterval(fetchDashboardData, 300000);

        return () => clearInterval(interval);
    }, [showNotification]);

    const handleRefresh = async () => {
        showNotification('Обновление данных...', 'info', 2000);
        // Здесь можно добавить вызов API для принудительного обновления
        setTimeout(() => {
            showNotification('Данные обновлены', 'success');
        }, 1000);
    };

    const handleSync = async (marketplaceKey: string) => {
        try {
            showNotification(`Запуск синхронизации ${marketplaceKey}...`, 'info', 3000);
            // Здесь будет вызов API синхронизации
            setTimeout(() => {
                showNotification(`${marketplaceKey} синхронизирован`, 'success');
                // Обновляем время последней синхронизации
                setMarketplaces(prev => prev.map(mp =>
                    mp.key === marketplaceKey
                        ? {
                            ...mp,
                            lastSync: new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})
                        }
                        : mp
                ));
            }, 2000);
        } catch (error) {
            showNotification(`Ошибка синхронизации ${marketplaceKey}`, 'error');
        }
    };

    const StatCard = ({title, value, icon, color}: {
        title: string;
        value: string | number;
        icon: React.ReactNode;
        color: string
    }) => (
        <div className="bg-white/80 backdrop-blur border border-white/30 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center`}>
                    {icon}
                </div>
                <span className="text-2xl font-bold text-emerald-900">{value}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>
    );

    const MarketplaceCard = ({marketplace}: { marketplace: MarketplaceStatus }) => (
        <div
            className={`${marketplace.bgGradient} backdrop-blur border ${marketplace.borderColor} rounded-xl p-5 shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div
                        className={`w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center`}>
                        <div className={marketplace.color}>
                            {marketplace.icon}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">{marketplace.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                            {marketplace.connected ? (
                                <>
                                    <CheckCircle className="w-4 h-4 text-emerald-300"/>
                                    <span className="text-xs text-emerald-200">Подключен</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-4 h-4 text-red-300"/>
                                    <span className="text-xs text-red-200">Не подключен</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex space-x-2">
                    {marketplace.connected && (
                        <button
                            onClick={() => handleSync(marketplace.key)}
                            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                            title="Синхронизировать"
                        >
                            <RefreshCw className="w-4 h-4"/>
                        </button>
                    )}
                    <Link
                        to={marketplace.route}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                        title="Настроить"
                    >
                        <Settings className="w-4 h-4"/>
                    </Link>
                </div>
            </div>

            {marketplace.connected ? (
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-white/80">Последняя синхронизация:</span>
                        <span className="font-medium text-white">
              {marketplace.lastSync || 'Сегодня в 10:30'}
            </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-white/60">
                        <Clock className="w-3 h-3"/>
                        <span>Следующая через 15 мин</span>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-sm text-white/80">Подключите для автоматической синхронизации</p>
                    <div className="flex justify-between items-center">
                        <a
                            href={marketplace.docsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-white hover:text-white/90"
                        >
                            <ExternalLink className="w-3 h-3 mr-1"/>
                            Инструкция
                        </a>
                        <Link
                            to={marketplace.route}
                            className="inline-flex items-center px-3 py-1 bg-white/20 text-white text-xs rounded-lg hover:bg-white/30 transition-colors"
                        >
                            Подключить
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );

    const ModuleCard = ({module}: { module: ModuleStatus }) => (
        <Link
            to={`/lk/module/${module.id}`}
            className={`block ${module.bgGradient} backdrop-blur border ${module.borderColor} rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div
                        className={`w-10 h-10 ${module.enabled ? 'bg-emerald-100' : 'bg-gray-100'} rounded-full flex items-center justify-center`}>
                        <div className={module.enabled ? 'text-emerald-600' : 'text-gray-400'}>
                            {module.icon}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-emerald-900">{module.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                            {module.enabled ? (
                                <>
                                    <CheckCircle className="w-4 h-4 text-emerald-500"/>
                                    <span className="text-xs text-emerald-600">Активен</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-4 h-4 text-amber-500"/>
                                    <span className="text-xs text-amber-600">Не настроен</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-emerald-600">
                    <Settings className="w-5 h-5"/>
                </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">{module.description}</p>

            {module.enabled && module.stats && (
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/60 rounded-lg p-2">
                        <div className="text-lg font-bold text-emerald-700">{module.stats.total}</div>
                        <div className="text-xs text-gray-600">всего</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2">
                        <div className="text-lg font-bold text-blue-700">{module.stats.today}</div>
                        <div className="text-xs text-gray-600">сегодня</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2">
                        <div className="text-lg font-bold text-purple-700">{module.stats.successRate}%</div>
                        <div className="text-xs text-gray-600">успех</div>
                    </div>
                </div>
            )}
        </Link>
    );

    const UserInfoCard = () => (
        <div
            className="bg-gradient-to-br from-emerald-50 to-blue-50 backdrop-blur border border-emerald-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-emerald-600"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-emerald-900">{userInfo.name}</h2>
                        <div className="flex items-center space-x-2 mt-1">
                            <Shield className="w-4 h-4 text-emerald-500"/>
                            <span className="text-sm text-emerald-600 font-medium">{userInfo.plan}</span>
                        </div>
                    </div>
                </div>
                <Link
                    to="/lk/profile"
                    className="text-emerald-600 hover:text-emerald-800 transition-colors"
                    title="Редактировать профиль"
                >
                    <Settings className="w-5 h-5"/>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-500"/>
                        <div>
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="text-sm font-medium text-gray-800">{userInfo.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-gray-500"/>
                        <div>
                            <p className="text-xs text-gray-500">Телефон</p>
                            <p className="text-sm font-medium text-gray-800">{userInfo.phone}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-gray-500"/>
                        <div>
                            <p className="text-xs text-gray-500">Регистрация</p>
                            <p className="text-sm font-medium text-gray-800">{userInfo.registrationDate}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Store className="w-4 h-4 text-gray-500"/>
                        <div>
                            <p className="text-xs text-gray-500">Магазинов</p>
                            <p className="text-sm font-medium text-gray-800">{userInfo.stores}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Шапка дашборда */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-emerald-900">Личный кабинет</h1>
                        <p className="text-gray-600 mt-1">Обзор подключенных сервисов и активности</p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <RefreshCw className="w-4 h-4"/>
                        <span>Обновить</span>
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div
                            className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        <p className="mt-4 text-gray-600">Загрузка данных дашборда...</p>
                    </div>
                ) : (
                    <>
                        {/* Карточка пользователя */}
                        <div className="mb-8">
                            <UserInfoCard/>
                        </div>

                        {/* Статистика */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                title="Подключено маркетплейсов"
                                value={stats.totalMarketplaces}
                                icon={<Zap className="w-5 h-5 text-white"/>}
                                color="bg-emerald-500"
                            />
                            <StatCard
                                title="Активных модулей"
                                value={stats.activeModules}
                                icon={<Bot className="w-5 h-5 text-white"/>}
                                color="bg-blue-500"
                            />
                            <StatCard
                                title="Последняя синхронизация"
                                value={stats.lastSync}
                                icon={<Clock className="w-5 h-5 text-white"/>}
                                color="bg-purple-500"
                            />
                            <StatCard
                                title="Следующая синхронизация"
                                value={stats.nextSync}
                                icon={<RefreshCw className="w-5 h-5 text-white"/>}
                                color="bg-amber-500"
                            />
                        </div>

                        {/* Маркетплейсы */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-emerald-900">Маркетплейсы</h2>
                                <Link
                                    to="/lk/integrations"
                                    className="text-sm text-emerald-600 hover:text-emerald-800 flex items-center"
                                >
                                    <Settings className="w-4 h-4 mr-1"/>
                                    Все интеграции
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {marketplaces.map((marketplace) => (
                                    <MarketplaceCard key={marketplace.key} marketplace={marketplace}/>
                                ))}
                            </div>
                        </div>

                        {/* Модули */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-emerald-900">Модули</h2>
                                <div className="text-sm text-gray-500">
                                    {modules.filter(m => m.enabled).length} из {modules.length} активны
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {modules.map((module) => (
                                    <ModuleCard key={module.id} module={module}/>
                                ))}
                            </div>
                        </div>

                        {/* Быстрые действия */}
                        <div
                            className="mt-8 bg-gradient-to-r from-emerald-50 to-blue-50 backdrop-blur border border-emerald-200 rounded-xl p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-emerald-800 mb-4">Быстрые действия</h3>
                            <div className="flex flex-wrap gap-4">
                                <Link
                                    to="/lk/integrations"
                                    className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                                >
                                    <Zap className="w-4 h-4 mr-2"/>
                                    Добавить маркетплейс
                                </Link>
                                <Link
                                    to="/lk/module/ai-reviews"
                                    className="inline-flex items-center px-4 py-2 bg-white text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors shadow-sm"
                                >
                                    <Bot className="w-4 h-4 mr-2"/>
                                    Настроить ИИ-ответы
                                </Link>
                                <button
                                    onClick={handleRefresh}
                                    className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2"/>
                                    Запустить синхронизацию
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}