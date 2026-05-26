import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import {useDefaultTitle} from "../hooks/usePageTitle.ts";

export default function Home() {
  useDefaultTitle();

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            ИИ-анализ отзывов
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold text-emerald-600 mb-6">
            для продавцов OZON
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Автоматически анализируйте отзывы, получайте готовые ответы и улучшайте репутацию магазина на OZON с помощью искусственного интеллекта
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/lk"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-emerald-600 text-white hover:bg-emerald-700 h-11 px-8 text-base"
            >
              Войти в кабинет
            </Link>
            <a
              href="/instructions"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-white hover:bg-emerald-50 h-11 px-8 text-base text-gray-700"
            >
              Как это работает
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {/* ИИ-анализ отзывов */}
            <div className="text-center p-6">
              <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bot h-6 w-6 text-emerald-600">
                  <path d="M12 8V4H8"></path>
                  <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                  <path d="M2 14h2"></path>
                  <path d="M20 14h2"></path>
                  <path d="M15 13v2"></path>
                  <path d="M9 13v2"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">ИИ-анализ отзывов</h3>
              <p className="text-gray-600">
                Автоматическое определение тональности, выявление проблем и генерация вежливых ответов для OZON
              </p>
            </div>

            {/* Модерация и отправка */}
            <div className="text-center p-6">
              <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square h-6 w-6 text-emerald-600">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Модерация и отправка</h3>
              <p className="text-gray-600">
                Просматривайте, редактируйте и отправляйте ответы на отзывы прямо в OZON из единого интерфейса
              </p>
            </div>

            {/* Аналитика и инсайты */}
            <div className="text-center p-6">
              <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bar-chart h-6 w-6 text-emerald-600">
                  <line x1="12" y1="20" x2="12" y2="10"></line>
                  <line x1="18" y1="20" x2="18" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="16"></line>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Аналитика и инсайты</h3>
              <p className="text-gray-600">
                Получайте сводки по проблемам товаров, трендам отзывов и рекомендациям по улучшению карточек
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}