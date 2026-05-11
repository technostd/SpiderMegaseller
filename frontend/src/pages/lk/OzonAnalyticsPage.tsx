import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const mockData = {
  avg_rating: 4.4,
  total_reviews: 248,
  negative_reviews: 32,
  resolved_problems: 18,

  priority_matrix: [
    { problem: 'Размер не соответствует описанию', impact: 'Высокое', difficulty: 'Низкая' },
    { problem: 'Плохая упаковка товара', impact: 'Среднее', difficulty: 'Средняя' },
    { problem: 'Цвет отличается от фото', impact: 'Среднее', difficulty: 'Низкая' },
    { problem: 'Долгая доставка', impact: 'Низкое', difficulty: 'Высокая' },
  ],

  quick_wins: [
    { title: 'Добавить размерную сетку', time: '1 час', effect: '+0.2★ к рейтингу' },
    { title: 'Обновить фотографии товара', time: '2 часа', effect: 'Меньше возвратов' },
    { title: 'Добавить предупреждение про упаковку', time: '30 минут', effect: 'Меньше негатива' },
  ],

  critical_alerts: [
    '5 отзывов за 3 дня о браке товара',
    'Покупатели часто жалуются на неверный размер',
    'В последних отзывах выросло число жалоб на упаковку',
  ],

  rating_trend: [
    { date: '01.05', value: 4.1 },
    { date: '03.05', value: 4.2 },
    { date: '05.05', value: 4.0 },
    { date: '07.05', value: 4.4 },
    { date: '09.05', value: 4.3 },
    { date: '11.05', value: 4.5 },
  ],

  reviews_volume: [
    { date: '01.05', value: 12 },
    { date: '03.05', value: 18 },
    { date: '05.05', value: 9 },
    { date: '07.05', value: 24 },
    { date: '09.05', value: 16 },
    { date: '11.05', value: 21 },
  ],

  topic_trends: [
    { topic: 'Размер', value: 42 },
    { topic: 'Упаковка', value: 28 },
    { topic: 'Качество', value: 24 },
    { topic: 'Фото', value: 18 },
  ],

  ai_summary:
    'AI выявил, что основные проблемы связаны с размером, упаковкой и несоответствием фотографий товара. Самое быстрое улучшение — добавить размерную сетку и обновить карточку товара.',

  ai_recommendations: [
    { priority: 'high', title: 'Исправить описание размеров', difficulty: '1–2 часа', effect: '+0.2★' },
    { priority: 'medium', title: 'Добавить реальные фото товара', difficulty: '2–3 часа', effect: 'Меньше возвратов' },
    { priority: 'medium', title: 'Усилить описание упаковки', difficulty: '30 минут', effect: 'Меньше негативных отзывов' },
  ],

  products: [
    { sku: 'OZ-101', name: 'Футболка базовая', rating: 4.7, reviews: 89, trend: '+0.2' },
    { sku: 'OZ-204', name: 'Худи oversize', rating: 4.3, reviews: 64, trend: '-0.1' },
    { sku: 'OZ-315', name: 'Кроссовки летние', rating: 4.1, reviews: 95, trend: '-0.3' },
  ],

  returns: [
    { reason: 'Не подошёл размер', pct: 45, cost: '560 ₽' },
    { reason: 'Брак товара', pct: 25, cost: '420 ₽' },
    { reason: 'Цвет отличается от фото', pct: 18, cost: '270 ₽' },
  ],
};

const tabs = [
  { id: 'urgent', label: '🔥 Что исправить' },
  { id: 'trends', label: '📊 Динамика и тренды' },
  { id: 'ai', label: '🤖 AI инсайты' },
  { id: 'products', label: '📦 Товары и возвраты' },
];

export default function OzonAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('urgent');

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <p className="text-sm text-gray-500 mb-2">Личный кабинет / AI отзывы</p>
        <h1 className="text-3xl font-bold text-gray-900">
          Аналитика отзывов Ozon
        </h1>
        <p className="text-gray-600 mt-2">
          Сводка по отзывам, проблемам, динамике рейтинга и рекомендациям AI.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Средний рейтинг" value={`${mockData.avg_rating} ★`} color="text-emerald-600" />
        <MetricCard title="Всего отзывов" value={mockData.total_reviews} color="text-gray-900" />
        <MetricCard title="Негативных отзывов" value={mockData.negative_reviews} color="text-red-500" />
        <MetricCard title="Решённых проблем" value={mockData.resolved_problems} color="text-blue-500" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={
              activeTab === tab.id
                ? 'px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium shadow-sm'
                : 'px-4 py-2 rounded-lg bg-white border text-gray-700 hover:bg-gray-100 font-medium'
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'urgent' && <UrgentTab />}
      {activeTab === 'trends' && <TrendsTab />}
      {activeTab === 'ai' && <AiTab />}
      {activeTab === 'products' && <ProductsTab />}
    </div>
  );
}

function MetricCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">
      <div className="text-sm text-gray-500 mb-2">{title}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function UrgentTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Матрица приоритетов</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="py-3 pr-4">Проблема</th>
                <th className="py-3 pr-4">Влияние</th>
                <th className="py-3 pr-4">Сложность</th>
              </tr>
            </thead>
            <tbody>
              {mockData.priority_matrix.map((item, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  <td className="py-3 pr-4 font-medium">{item.problem}</td>
                  <td className="py-3 pr-4">
                    <Badge value={item.impact} />
                  </td>
                  <td className="py-3 pr-4 text-gray-600">{item.difficulty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">⚡ Quick Wins</h2>

          <div className="space-y-4">
            {mockData.quick_wins.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="font-semibold">{item.title}</div>
                <div className="text-sm text-gray-600 mt-2">Время: {item.time}</div>
                <div className="text-sm text-emerald-600">Эффект: {item.effect}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-red-700 mb-4">
            🔴 Критические проблемы
          </h2>

          <ul className="space-y-2">
            {mockData.critical_alerts.map((alert, index) => (
              <li key={index} className="text-red-700">
                • {alert}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function TrendsTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard title="Динамика среднего рейтинга">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockData.rating_trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[1, 5]} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Количество отзывов">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockData.reviews_volume}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Самые частые темы в отзывах">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockData.topic_trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="topic" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Прогноз</h2>
        <p className="text-gray-700 leading-relaxed">
          При текущей динамике рейтинг может вырасти до{' '}
          <span className="font-semibold text-emerald-600">4.6★</span> за месяц,
          если исправить проблемы с размером и упаковкой.
        </p>
      </div>
    </div>
  );
}

function AiTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">AI Summary</h2>
        <p className="text-gray-700 leading-relaxed">{mockData.ai_summary}</p>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">AI рекомендации</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockData.ai_recommendations.map((item, index) => (
            <div key={index} className="border rounded-xl p-4 bg-gray-50">
              <div className="mb-3">
                <Badge value={item.priority === 'high' ? 'Высокий' : 'Средний'} />
              </div>
              <div className="font-semibold">{item.title}</div>
              <div className="text-sm text-gray-600 mt-2">
                Сложность: {item.difficulty}
              </div>
              <div className="text-sm text-emerald-600">
                Эффект: {item.effect}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductsTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Товары</h2>

        <div className="space-y-4">
          {mockData.products.map((product) => (
            <div key={product.sku} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between gap-4">
                <div>
                  <div className="font-semibold">{product.name}</div>
                  <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                </div>

                <div className="text-right">
                  <div className="font-bold">{product.rating} ★</div>
                  <div className="text-sm text-gray-500">{product.reviews} отзывов</div>
                  <div
                    className={
                      product.trend.startsWith('+')
                        ? 'text-sm text-emerald-600'
                        : 'text-sm text-red-500'
                    }
                  >
                    {product.trend}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Причины возвратов</h2>

        <div className="space-y-5">
          {mockData.returns.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">{item.reason}</span>
                <span className="text-gray-500">{item.pct}% / {item.cost}</span>
              </div>

              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-emerald-500 rounded-full"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="h-72">{children}</div>
    </div>
  );
}

function Badge({ value }: { value: string }) {
  let className = 'bg-gray-100 text-gray-700';

  if (value === 'Высокое' || value === 'Высокий') {
    className = 'bg-red-100 text-red-700';
  }

  if (value === 'Среднее' || value === 'Средний') {
    className = 'bg-yellow-100 text-yellow-700';
  }

  if (value === 'Низкое') {
    className = 'bg-emerald-100 text-emerald-700';
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {value}
    </span>
  );
}