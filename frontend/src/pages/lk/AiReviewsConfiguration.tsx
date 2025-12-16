// frontend/src/pages/lk/AiReviewsConfiguration.tsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useNotifications } from '../../contexts/NotificationContext';
import { aiReviewsApi, type ModuleConfig } from '../../api/aiReviews';
import ozonIcon from '../../assets/ozon.svg';
import {
  Save,
  Settings,
  Shield,
  MessageSquare,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

const AiReviewsConfiguration: React.FC = () => {
  const { showNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ModuleConfig>({
    premoderate: false,
    auto_publish_positive: true,
    default_tone: 'нейтральный',
    max_response_length: 1000
  });
  const [yandexGptStatus, setYandexGptStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [ozonStatus, setOzonStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Добавляем флаг для отслеживания монтирования компонента
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Загружаем данные с небольшой задержкой
    const timer = setTimeout(() => {
      loadConfig();
      testConnections();
    }, 100);

    return () => {
      setIsMounted(false);
      clearTimeout(timer);
    };
  }, []);

  const loadConfig = async () => {
    if (!isMounted) return;

    try {
      setLoading(true);
      const data = await aiReviewsApi.getModuleConfig();
      if (data.config) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      // Используем setTimeout для гарантированного вызова после монтирования
      setTimeout(() => {
        showNotification('Ошибка загрузки конфигурации', 'error');
      }, 0);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  const testConnections = async () => {
    if (!isMounted) return;

    try {
      // Test Yandex GPT
      const gptResult = await aiReviewsApi.testYandexGPTConnection();
      setYandexGptStatus({
        success: gptResult.success || false,
        message: gptResult.status || gptResult.error || 'Неизвестная ошибка'
      });

    } catch (error) {
      console.error('Error testing connections:', error);
      setYandexGptStatus({
        success: false,
        message: 'Ошибка подключения к API'
      });

      // TODO: Test Ozon connection using stored credentials
      setOzonStatus({
        success: false,
        message: 'Требуется настройка в разделе "Интеграции"'
      });
    }
  };

  const handleConfigChange = (key: keyof ModuleConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      await aiReviewsApi.updateModuleConfig(config);
      showNotification('Конфигурация сохранена успешно', 'success');
    } catch (error) {
      console.error('Error saving config:', error);
      showNotification('Ошибка сохранения конфигурации', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleProcessReviews = async () => {
    try {
      setLoading(true);
      const result = await aiReviewsApi.processOzonReviews({
        days_back: 30
      });

      if (result.success) {
        showNotification(
          `Обработано ${result.processed} отзывов. Статусы: ${result.results.map(r => r.status).join(', ')}`,
          'success'
        );
      } else {
        showNotification(`Ошибка обработки: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error processing reviews:', error);
      showNotification('Ошибка обработки отзывов', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Настройки модуля AI Reviews
              </h1>
            </div>
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Сохранить
            </button>
          </div>
          <p className="text-gray-600">
            Настройте параметры автоматического анализа и ответов на отзывы
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка - основные настройки */}
          <div className="lg:col-span-2 space-y-8">
            {/* Карточка основных настроек */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <Settings className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Основные настройки
                </h2>
              </div>

              <div className="space-y-6">
                {/* Премодерация */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Премодерация ответов
                    </label>
                    <p className="text-sm text-gray-500">
                      Все ответы будут помещены в очередь на модерацию перед отправкой
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.premoderate}
                      onChange={(e) => handleConfigChange('premoderate', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Автопубликация положительных */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Автопубликация положительных ответов
                    </label>
                    <p className="text-sm text-gray-500">
                      Автоматически публиковать ответы на положительные отзывы
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.auto_publish_positive}
                      onChange={(e) => handleConfigChange('auto_publish_positive', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Тон ответов */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Тон ответов по умолчанию
                  </label>
                  <select
                    value={config.default_tone}
                    onChange={(e) => handleConfigChange('default_tone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="нейтральный">Нейтральный</option>
                    <option value="благодарный">Благодарный</option>
                    <option value="извиняющийся">Извиняющийся</option>
                    <option value="дружелюбный">Дружелюбный</option>
                  </select>
                </div>

                {/* Максимальная длина ответа */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Максимальная длина ответа
                    <span className="ml-2 text-sm text-gray-500">
                      ({config.max_response_length} символов)
                    </span>
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="100"
                    value={config.max_response_length}
                    onChange={(e) => handleConfigChange('max_response_length', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>100 симв.</span>
                    <span>2500 симв.</span>
                    <span>5000 симв.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Карточка автоматической обработки */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <Zap className="w-5 h-5 text-yellow-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Автоматическая обработка
                </h2>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600">
                  Запустите автоматическую обработку неотвеченных отзывов за последние 30 дней
                </p>

                <button
                  onClick={handleProcessReviews}
                  disabled={loading}
                  className="flex items-center justify-center w-full px-4 py-3 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-5 h-5 mr-2" />
                  )}
                  Запустить обработку отзывов
                </button>
              </div>
            </div>
          </div>

          {/* Правая колонка - статусы подключений */}
          <div className="space-y-8">
            {/* Статус Yandex GPT */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <MessageSquare className="w-5 h-5 text-purple-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Yandex GPT
                </h2>
              </div>

              {yandexGptStatus ? (
                <div className={`flex items-center p-3 rounded-lg ${yandexGptStatus.success ? 'bg-green-50' : 'bg-red-50'}`}>
                  {yandexGptStatus.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  )}
                  <span className={yandexGptStatus.success ? 'text-green-700' : 'text-red-700'}>
                    {yandexGptStatus.message}
                  </span>
                </div>
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Loader2 className="w-5 h-5 text-gray-400 mr-2 animate-spin" />
                  <span className="text-gray-600">Проверка подключения...</span>
                </div>
              )}
            </div>

            {/* Статус Ozon */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <img src={ozonIcon} alt="Ozon" className="w-5 h-5 mr-2"/>
                <h2 className="text-lg font-semibold text-gray-900">
                  Ozon API
                </h2>
              </div>

              {ozonStatus ? (
                <div className={`flex items-center p-3 rounded-lg ${ozonStatus.success ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  {ozonStatus.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                  )}
                  <span className={ozonStatus.success ? 'text-green-700' : 'text-yellow-700'}>
                    {ozonStatus.message}
                  </span>
                </div>
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Loader2 className="w-5 h-5 text-gray-400 mr-2 animate-spin" />
                  <span className="text-gray-600">Проверка подключения...</span>
                </div>
              )}

              <a
                href="/lk/integrations/ozon"
                className="inline-flex items-center mt-4 text-sm text-blue-600 hover:text-blue-800"
              >
                Настроить подключение
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Статистика */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <Shield className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Информация
                </h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Текущий режим:</span>
                  <span className={`font-medium ${config.premoderate ? 'text-yellow-600' : 'text-green-600'}`}>
                    {config.premoderate ? 'Премодерация' : 'Автопубликация'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Тон ответов:</span>
                  <span className="font-medium text-gray-900">{config.default_tone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Длина ответов:</span>
                  <span className="font-medium text-gray-900">{config.max_response_length} симв.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AiReviewsConfiguration;