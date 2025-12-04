// src/pages/lk/ModuleSettings.tsx
import Layout from '../../components/Layout';
import { useParams } from 'react-router-dom';

export default function ModuleSettings() {
  const { id } = useParams();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-emerald-900 mb-6">
          Настройки модуля: {id === 'ai-reviews' ? 'ИИ-ответы на отзывы' : id}
        </h1>

        <div className="bg-white/80 backdrop-blur border border-white/30 rounded-xl p-6 shadow">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Маркетплейс
              </label>
              <select className="w-full px-3 py-2 bg-white/80 border border-gray-300 rounded">
                <option>Ozon</option>
                <option>Wildberries</option>
                <option>Яндекс.Маркет</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тоны ответов
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="flex items-center">
                  <input type="radio" name="tone" defaultChecked className="mr-2" />
                  Нейтральный
                </label>
                <label className="flex items-center">
                  <input type="radio" name="tone" className="mr-2" />
                  Дружелюбный
                </label>
                <label className="flex items-center">
                  <input type="radio" name="tone" className="mr-2" />
                  Формальный
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Запрещённые фразы (через запятую)
              </label>
              <input
                type="text"
                defaultValue="5 звёзд, звоните, пишите, компенсация"
                className="w-full px-3 py-2 bg-white/80 border border-gray-300 rounded"
              />
            </div>

            <button className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700">
              Сохранить настройки
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}