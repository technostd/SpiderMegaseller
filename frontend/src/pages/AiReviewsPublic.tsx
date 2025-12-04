// src/pages/AiReviewsPublic.tsx
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

export default function AiReviewsPublic() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white/80 backdrop-blur border border-white/30 rounded-2xl p-8 shadow">
          <h1 className="text-3xl font-bold text-emerald-900 mb-4">ИИ-генерация ответов на отзывы</h1>
          <p className="text-gray-700 mb-6">
            Модуль автоматически создаёт вежливые и релевантные ответы на отзывы Ozon, Wildberries и Яндекс.Маркет.
            Соответствует правилам маркетплейсов: без просьб о 5★, контактов и обещаний компенсаций.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-emerald-600">⏱️</span>
              </div>
              <h3 className="font-semibold">За 10 секунд</h3>
              <p className="text-sm text-gray-600">Ответ готов быстрее, чем вы прочтёте отзыв</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-emerald-600">🔒</span>
              </div>
              <h3 className="font-semibold">Безопасно</h3>
              <p className="text-sm text-gray-600">Никаких контактов, просьб о звёздах</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-emerald-600">📈</span>
              </div>
              <h3 className="font-semibold">Эффективно</h3>
              <p className="text-sm text-gray-600">Повышает лояльность и снижает негатив</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/module/ai-reviews/test"
              className="flex-1 text-center bg-white/80 border border-emerald-200 text-emerald-700 py-3 rounded-lg hover:bg-emerald-50 transition"
            >
              Попробовать демо
            </Link>
            <Link
              to="/login"
              className="flex-1 text-center bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition"
            >
              Подключить модуль
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}