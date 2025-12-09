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
            Автоматизация работы
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold text-emerald-600 mb-6">
            с маркетплейсами
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Упростите управление продажами на OZON, Wildberries и Яндекс.Маркет с помощью умных модулей автоматизации
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/lk"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-emerald-600 text-white hover:bg-emerald-700 h-11 px-8 text-base"
            >
              Начать работу
            </Link>
            <a
              href="/instructions"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-white hover:bg-emerald-50 h-11 px-8 text-base text-gray-700"
            >
              Узнать больше
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {/* ИИ-ассистент */}
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
              <h3 className="text-xl font-semibold text-gray-800 mb-2">ИИ-ассистент</h3>
              <p className="text-gray-600">
                Автоматические ответы на отзывы с помощью искусственного интеллекта
              </p>
            </div>

            {/* Быстрая интеграция */}
            <div className="text-center p-6">
              <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap h-6 w-6 text-emerald-600">
                  <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Быстрая интеграция</h3>
              <p className="text-gray-600">
                Подключите все популярные маркетплейсы за несколько минут
              </p>
            </div>

            {/* Безопасность */}
            <div className="text-center p-6">
              <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield h-6 w-6 text-emerald-600">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Безопасность</h3>
              <p className="text-gray-600">
                Все данные надёжно защищены и хранятся в зашифрованном виде
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}