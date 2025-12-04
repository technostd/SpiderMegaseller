// src/pages/Modules.tsx
import { PAGE_TITLES } from '../constants';
import Layout from '../components/Layout';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Modules() {
  useEffect(() => {
    document.title = PAGE_TITLES.MODULES;
  }, []);

  const modules = [
    {
      id: 1,
      title: 'ИИ-ответы на отзывы OZON',
      description: 'Автоматическое создание и отправка ответов на отзывы с помощью искусственного интеллекта. Поддерживает персонализацию и анализ тональности.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot h-6 w-6">
          <path d="M12 8V4H8"></path>
          <rect width="16" height="12" x="4" y="8" rx="2"></rect>
          <path d="M2 14h2"></path>
          <path d="M20 14h2"></path>
          <path d="M15 13v2"></path>
          <path d="M9 13v2"></path>
        </svg>
      ),
      platform: 'OZON',
      status: 'active',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      features: ['AI-анализ тональности', 'Автоответы', 'Шаблоны ответов']
    },
    {
      id: 2,
      title: 'Анализ остатков',
      description: 'Мониторинг складских остатков и прогнозирование необходимости дозаказа товаров. Интеграция с системой складского учёта.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-package h-6 w-6">
          <path d="M16.5 9.4 7.55 4.24"></path>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.29 7 12 12 20.71 7"></polyline>
          <line x1="12" y1="22" x2="12" y2="12"></line>
        </svg>
      ),
      platform: 'Все платформы',
      status: 'soon',
      badgeColor: 'bg-gray-100 text-gray-800',
      features: ['Прогнозирование спроса', 'Уведомления о низких остатках', 'Отчёты']
    },
    {
      id: 3,
      title: 'Анализ и автообновление цен',
      description: 'Автоматический мониторинг цен конкурентов и корректировка ваших цен для поддержания конкурентоспособности.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up h-6 w-6">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
          <polyline points="16 7 22 7 22 13"></polyline>
        </svg>
      ),
      platform: 'Wildberries, OZON',
      status: 'soon',
      badgeColor: 'bg-gray-100 text-gray-800',
      features: ['Мониторинг конкурентов', 'Автоцена', 'Гибкие правила']
    },
    {
      id: 4,
      title: 'Автозагрузка товаров',
      description: 'Автоматическая загрузка товаров из Excel/CSV файлов с поддержкой вариаций, фотографий и описаний.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload h-6 w-6">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
      ),
      platform: 'Все платформы',
      status: 'soon',
      badgeColor: 'bg-gray-100 text-gray-800',
      features: ['Пакетная загрузка', 'Валидация данных', 'Шаблоны']
    },
    {
      id: 5,
      title: 'Автоматизация доставки',
      description: 'Интеграция с службами доставки для автоматического создания заказов и отслеживания отправлений.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck h-6 w-6">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
          <path d="M15 18H9"></path>
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path>
          <circle cx="17" cy="18" r="2"></circle>
          <circle cx="7" cy="18" r="2"></circle>
        </svg>
      ),
      platform: 'CDEK, Boxberry, Почта России',
      status: 'soon',
      badgeColor: 'bg-gray-100 text-gray-800',
      features: ['Мультидоставка', 'Трекинг', 'Автосоздание накладных']
    },
    {
      id: 6,
      title: 'Отчётность и аналитика',
      description: 'Детальные отчёты по продажам, прибыли и конверсиям с возможностью настройки дашбордов.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bar-chart h-6 w-6">
          <line x1="12" y1="20" x2="12" y2="10"></line>
          <line x1="18" y1="20" x2="18" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="16"></line>
        </svg>
      ),
      platform: 'Все платформы',
      status: 'soon',
      badgeColor: 'bg-gray-100 text-gray-800',
      features: ['Дашборды', 'Экспорт в Excel', 'Сравнительная аналитика']
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="py-16 border-b border-border">
          <div className="container mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Модули автоматизации
              </h1>
              <p className="text-xl text-muted-foreground">
                Подключайте умные модули для автоматизации рутинных задач на маркетплейсах
              </p>
            </div>
          </div>
        </section>

        {/* Modules Grid */}
        <section className="py-20">
          <div className="container mx-auto">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className={`group relative rounded-xl border-2 p-6 transition-all hover:shadow-lg ${
                    module.status === 'active'
                      ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300'
                      : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                  }`}
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${module.badgeColor}`}>
                      {module.status === 'active' ? (
                        <>
                          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          Активен
                        </>
                      ) : (
                        <>
                          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                          Скоро
                        </>
                      )}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${
                    module.status === 'active' ? 'bg-emerald-100' : 'bg-gray-100'
                  }`}>
                    <div className={module.status === 'active' ? 'text-emerald-600' : 'text-gray-600'}>
                      {module.icon}
                    </div>
                  </div>

                  {/* Title & Platform */}
                  <h3 className="text-xl font-semibold mb-2">{module.title}</h3>
                  <div className="mb-4">
                    <span className="text-sm text-muted-foreground">Платформа: </span>
                    <span className="text-sm font-medium">{module.platform}</span>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground mb-6">{module.description}</p>

                  {/* Features */}
                  <div className="mb-8">
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Возможности:</h4>
                    <ul className="space-y-1">
                      {module.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <svg
                            className={`mr-2 h-4 w-4 ${
                              module.status === 'active' ? 'text-emerald-500' : 'text-gray-400'
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  {module.status === 'active' ? (
                    <Link
                      to="/dashboard/ai-reviews"
                      className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-emerald-50 hover:bg-emerald-700 h-10 px-4 text-sm"
                    >
                      Подключить
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 text-sm cursor-not-allowed"
                    >
                      Доступно скоро
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Coming Soon Notice */}
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-3 rounded-lg border border-border bg-card px-6 py-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock h-5 w-5 text-muted-foreground">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <div className="text-left">
                  <p className="font-medium">Новые модули в разработке</p>
                  <p className="text-sm text-muted-foreground">
                    Следите за обновлениями — скоро появятся новые инструменты для автоматизации
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-emerald-50/50">
          <div className="container mx-auto">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Готовы автоматизировать?</h2>
              <p className="text-muted-foreground mb-8">
                Начните с модуля ИИ-ответов на отзывы и экономьте до 15 часов в неделю на рутинных задачах
              </p>
              <Link
                to="/lk/module/ai-reviews"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-white hover:bg-emerald-700 h-11 px-8 text-base"
              >
                Начать использовать
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}