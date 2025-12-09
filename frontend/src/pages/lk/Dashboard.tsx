import Layout from '../../components/Layout';
import {Link} from 'react-router-dom';
import {usePageSubtitle} from "../../hooks/usePageTitle.ts";

export default function Dashboard() {

    usePageSubtitle('Личный кабинет')

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-emerald-900 mb-6">Личный кабинет</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link
                        to="/lk/integrations"
                        className="block bg-white/80 backdrop-blur border border-white/30 rounded-xl p-6 shadow hover:shadow-md transition"
                    >
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-emerald-600 text-xl"><svg xmlns="http://www.w3.org/2000/svg"
                                                                            width="24" height="24" viewBox="0 0 24 24"
                                                                            fill="none" stroke="currentColor"
                                                                            stroke-width="2" stroke-linecap="round"
                                                                            stroke-linejoin="round"
                                                                            className="lucide lucide-waypoints-icon lucide-waypoints"><circle
                                cx="12" cy="4.5" r="2.5"/><path d="m10.2 6.3-3.9 3.9"/><circle cx="4.5" cy="12"
                                                                                               r="2.5"/><path
                                d="M7 12h10"/><circle cx="19.5" cy="12" r="2.5"/><path d="m13.8 17.7 3.9-3.9"/><circle
                                cx="12" cy="19.5" r="2.5"/></svg></span>
                        </div>
                        <h3 className="text-lg font-semibold text-emerald-900 mb-2">Интеграции</h3>
                        <p className="text-gray-600">Подключите Ozon, WB, Яндекс.Маркет</p>
                    </Link>

                    <Link
                        to="/lk/module/ai-reviews"
                        className="block bg-white/80 backdrop-blur border border-white/30 rounded-xl p-6 shadow hover:shadow-md transition"
                    >
            <span className="text-emerald-600 text-xl"><div
                className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-bot h-8 w-8 text-primary"
              >
                <path d="M12 8V4H8"></path>
                <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                <path d="M2 14h2"></path>
                <path d="M20 14h2"></path>
                <path d="M15 13v2"></path>
                <path d="M9 13v2"></path>
              </svg>
            </div></span>
                        <h3 className="text-lg font-semibold text-emerald-900 mb-2">ИИ-ответы на отзывы</h3>
                        <p className="text-gray-600">Генерируйте и отправляйте ответы</p>
                    </Link>
                </div>
            </div>
        </Layout>
    );
}