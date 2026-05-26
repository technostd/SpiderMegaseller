import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import DashboardLayout from "../../components/DashboardLayout.tsx";
import { fetchOzonAnalytics } from '../../api/ozonAnalytics';
import type { AnalyticsResponse, Period } from '../../types/analytics';

const periods: { id: Period; label: string }[] = [
  { id: '7d', label: '7 дней' },
  { id: '30d', label: '30 дней' },
  { id: '90d', label: '90 дней' },
];

export default function OzonAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const [activeTab, setActiveTab] = useState('urgent');

  const { data, isLoading, error } = useQuery({
    queryKey: ['ozon-analytics', period],
    queryFn: () => fetchOzonAnalytics(period),
    staleTime: 1000 * 60 * 5,
  });

  if (error) {
    return <DashboardLayout><div className="p-12 text-center text-red-600">Ошибка загрузки данных. Попробуйте позже.</div></DashboardLayout>;
  }

  // ✅ Исправленный расчёт среднего рейтинга за период
  const avgRating = data?.rating_trend.length
    ? (data.rating_trend.reduce((acc, cur) => acc + cur.value, 0) / data.rating_trend.length).toFixed(2)
    : '0.00';

  const totalReviews = data?.reviews_volume.reduce((acc, cur) => acc + cur.value, 0) || 0;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-6 py-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Аналитика отзывов Ozon</h1>
            <p className="text-gray-600 mt-2">Сводка по отзывам, проблемам и рекомендациям AI.</p>
          </div>
          <div className="flex gap-2">
            {periods.map(p => (
              <button key={p.id} onClick={() => setPeriod(p.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${period === p.id ? 'bg-emerald-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-100'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <MetricsSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard title="Средний рейтинг" value={`${avgRating} ★`} color="text-emerald-600"/>
            <MetricCard title="Всего отзывов" value={totalReviews} color="text-gray-900"/>
            <MetricCard title="Критических алертов" value={data?.critical_alerts.length || 0} color="text-red-500"/>
            <MetricCard title="AI-рекомендаций" value={data?.ai_recommendations.length || 0} color="text-blue-500"/>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
          {[
            {id: 'urgent', label: '🔥 Что исправить'},
            {id: 'trends', label: '📊 Динамика и тренды'},
            {id: 'ai', label: '🤖 AI инсайты'},
            {id: 'products', label: '📦 Товары и возвраты'},
            {id: 'customers', label: '👥 Клиенты'},
            {id: 'card', label: '🛍️ Карточка товара'},
            {id: 'responses', label: '💬 Ответы'},
          ].map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition ${activeTab === tab.id ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white border text-gray-700 hover:bg-gray-100'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading && (
          <>
            {activeTab === 'urgent' && <UrgentSkeleton />}
            {activeTab === 'trends' && <ChartsSkeleton />}
            {activeTab === 'ai' && <TextSkeleton />}
            {activeTab === 'products' && <ListSkeleton />}
            {activeTab === 'customers' && <ListSkeleton />}
            {activeTab === 'card' && <TextSkeleton />}
            {activeTab === 'responses' && <TextSkeleton />}
          </>
        )}

        {!isLoading && data && (
          <>
            {activeTab === 'urgent' && <UrgentTab data={data}/>}
            {activeTab === 'trends' && <TrendsTab data={data}/>}
            {activeTab === 'ai' && <AiTab data={data}/>}
            {activeTab === 'products' && <ProductsTab data={data}/>}
            {activeTab === 'customers' && <CustomersTab data={data}/>}
            {activeTab === 'card' && <CardAnalysisTab data={data}/>}
            {activeTab === 'responses' && <ResponseEffectivenessTab data={data}/>}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// ==================== COMPONENTS ====================

function MetricCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">
      <div className="text-sm text-gray-500 mb-2">{title}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function UrgentTab({ data }: { data: AnalyticsResponse }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Матрица приоритетов</h2>
        {data.priority_matrix.length === 0 ? <p className="text-gray-500">Проблем не выявлено.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead><tr className="text-left border-b"><th className="py-3 pr-4">Проблема</th><th className="py-3 pr-4">Влияние</th><th className="py-3 pr-4">Сложность</th></tr></thead>
              <tbody>
                {data.priority_matrix.map((item, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium">{item.problem}</td>
                    <td className="py-3 pr-4"><Badge value={item.impact}/></td>
                    <td className="py-3 pr-4 text-gray-600">{item.difficulty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">⚡ Quick Wins</h2>
          {data.quick_wins.length === 0 ? <p className="text-gray-500">Нет быстрых улучшений.</p> : (
            <div className="space-y-4">
              {data.quick_wins.map((item, i) => (
                <div key={i} className="border rounded-lg p-4 bg-gray-50">
                  <div className="font-semibold">{item.title}</div>
                  <div className="text-sm text-gray-600 mt-2">Время: {item.time}</div>
                  <div className="text-sm text-emerald-600">Эффект: {item.effect}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-red-700 mb-4">🔴 Критические проблемы</h2>
          {data.critical_alerts.length === 0 ? <p className="text-gray-600">Критических проблем нет.</p> : (
            <ul className="space-y-2">
              {data.critical_alerts.map((alert, i) => <li key={i} className="text-red-700">• {alert}</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function TrendsTab({ data }: { data: AnalyticsResponse }) {
  const COLORS = ['#10b981', '#6366f1'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard title="Динамика среднего рейтинга">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.rating_trend}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="date" tick={{fontSize: 10}}/>
            <YAxis domain={[1, 5]}/>
            <Tooltip/>
            <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{r: 3}}/>
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Количество отзывов">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.reviews_volume}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="date" tick={{fontSize: 10}}/>
            <YAxis/>
            <Tooltip/>
            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}/>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="bg-white border rounded-xl p-6 shadow-sm lg:col-span-2">
        <h2 className="text-xl font-semibold mb-4">Сравнение эффективности ответов</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <div className="text-3xl font-bold text-emerald-600">{data.response_effectiveness.with_answer_change_pct}%</div>
            <div className="text-sm text-gray-600 mt-1">Позитивных с ответом</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-3xl font-bold text-red-600">{data.response_effectiveness.without_answer_change_pct}%</div>
            <div className="text-sm text-gray-600 mt-1">Позитивных без ответа</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{data.response_effectiveness.avg_response_time_hours}ч</div>
            <div className="text-sm text-gray-600 mt-1">Среднее время ответа</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AiTab({ data }: { data: AnalyticsResponse }) {
  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">🤖 AI Summary</h2>
        <p className="text-gray-700 leading-relaxed">{data.ai_summary}</p>
      </div>
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">AI рекомендации</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.ai_recommendations.map((item, i) => (
            <div key={i} className="border rounded-xl p-4 bg-gray-50">
              <div className="mb-3"><Badge value={item.priority === 'high' ? 'Высокий' : item.priority === 'medium' ? 'Средний' : 'Низкий'}/></div>
              <div className="font-semibold">{item.title}</div>
              <div className="text-sm text-gray-600 mt-2">Сложность: {item.difficulty}</div>
              <div className="text-sm text-emerald-600">Эффект: {item.effect}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductsTab({ data }: { data: AnalyticsResponse }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Товары</h2>
        {data.assortment.length === 0 ? <p className="text-gray-500">Нет данных.</p> : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {data.assortment.map((product) => (
              <div key={product.sku} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{product.rating} ★</div>
                    <div className="text-sm text-gray-500">{product.reviews} отзывов</div>
                    <div className={`text-sm font-medium ${
                      product.trend === 'new' ? 'text-gray-500' :
                      product.trend.startsWith('+') ? 'text-emerald-600' : 'text-red-500'
                    }`}>{product.trend}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Причины возвратов</h2>
        {data.returns_analysis.total_returns === 0 ? <p className="text-gray-500">Возвратов нет.</p> : (
          <>
            <div className="space-y-4 mb-4">
              {data.returns_analysis.reasons.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.reason}</span>
                    <span className="text-gray-500">{item.pct}% • {item.cost_rub} ₽</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{width: `${item.pct}%`}}/>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Всего возвратов:</span>
                <span className="font-semibold">{data.returns_analysis.total_returns}</span>
              </div>
              <div className="flex justify-between">
                <span>Общая стоимость:</span>
                <span className="font-semibold text-red-600">{data.returns_analysis.total_cost_rub} ₽</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ✅ НОВАЯ вкладка: Сегменты клиентов
function CustomersTab({ data }: { data: AnalyticsResponse }) {
  const pieData = data.customer_segments.map(seg => ({
    name: seg.type,
    value: seg.count,
    rating: seg.rating
  }));

  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Сегменты клиентов</h2>
        {data.customer_segments.length === 0 ? <p className="text-gray-500">Нет данных.</p> : (
          <div className="space-y-4">
            {data.customer_segments.map((seg, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold">{seg.type}</div>
                  <div className="text-sm text-gray-500">{seg.count} клиентов</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-600">{seg.rating} ★</div>
                  <div className="text-xs text-gray-500">средний рейтинг</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Распределение</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ✅ НОВАЯ вкладка: Анализ карточки товара
function CardAnalysisTab({ data }: { data: AnalyticsResponse }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Соответствие описанию</h2>
        <div className="flex items-center justify-center">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
              <circle
                cx="80" cy="80" r="70" fill="none"
                stroke={data.card_analysis.match_description_pct >= 80 ? '#10b981' : '#f59e0b'}
                strokeWidth="12"
                strokeDasharray={`${data.card_analysis.match_description_pct * 4.4} 440`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold">{data.card_analysis.match_description_pct}%</span>
            </div>
          </div>
        </div>
        <p className="text-center text-sm text-gray-600 mt-4">
          Товаров с полным соответствием описанию
        </p>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Фото в отзывах</h2>
        <div className="flex items-center justify-center">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
              <circle
                cx="80" cy="80" r="70" fill="none"
                stroke="#6366f1"
                strokeWidth="12"
                strokeDasharray={`${data.card_analysis.photo_in_reviews_pct * 4.4} 440`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold">{data.card_analysis.photo_in_reviews_pct}%</span>
            </div>
          </div>
        </div>
        <p className="text-center text-sm text-gray-600 mt-4">
          Отзывов с фотографиями товара
        </p>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Выявленные проблемы</h2>
        {data.card_analysis.issues.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Проблем не обнаружено ✓</p>
        ) : (
          <ul className="space-y-2">
            {data.card_analysis.issues.map((issue, i) => (
              <li key={i} className="flex items-start text-sm">
                <span className="text-red-500 mr-2">•</span>
                <span className="text-gray-700">{issue}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ✅ НОВАЯ вкладка: Эффективность ответов
function ResponseEffectivenessTab({ data }: { data: AnalyticsResponse }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Влияние ответов на рейтинг</h2>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">С ответом</span>
              <span className="text-emerald-600 font-bold">{data.response_effectiveness.with_answer_change_pct}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{width: `${data.response_effectiveness.with_answer_change_pct}%`}}/>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Без ответа</span>
              <span className="text-red-600 font-bold">{data.response_effectiveness.without_answer_change_pct}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-400 rounded-full" style={{width: `${data.response_effectiveness.without_answer_change_pct}%`}}/>
            </div>
          </div>
          <div className="pt-4 border-t">
            <div className="text-sm text-gray-600">
              Разница: <span className="font-semibold text-emerald-600">
                +{(data.response_effectiveness.with_answer_change_pct - data.response_effectiveness.without_answer_change_pct).toFixed(1)}%
              </span> в пользу ответов
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Экономия времени</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-blue-600">{data.response_effectiveness.ai_generated_count}</div>
            <div className="text-sm text-gray-600 mt-1">AI-ответов</div>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-emerald-600">{data.response_effectiveness.time_saved_hours}ч</div>
            <div className="text-sm text-gray-600 mt-1">Сэкономлено</div>
          </div>
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between mb-2">
              <span>Среднее время ответа:</span>
              <span className="font-medium">{data.response_effectiveness.avg_response_time_hours} ч</span>
            </div>
            <div className="flex justify-between">
              <span>Прогноз экономии/мес:</span>
              <span className="font-medium text-emerald-600">
                ~{(data.response_effectiveness.time_saved_hours * 4).toFixed(1)} ч
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="h-72">{children}</div>
    </div>
  );
}

function Badge({ value }: { value: string }) {
  let className = 'bg-gray-100 text-gray-700';
  if (value.includes('Высок')) className = 'bg-red-100 text-red-700';
  else if (value.includes('Сред')) className = 'bg-yellow-100 text-yellow-700';
  else if (value.includes('Низ')) className = 'bg-emerald-100 text-emerald-700';
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${className}`}>{value}</span>;
}

// ==================== SKELETONS ====================
const SkeletonBox = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white border rounded-xl p-5 shadow-sm">
          <SkeletonBox className="h-4 w-24 mb-4" />
          <SkeletonBox className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

function UrgentSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <SkeletonBox className="h-6 w-48 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between border-b pb-3 last:border-0">
              <SkeletonBox className="h-4 w-1/2" />
              <SkeletonBox className="h-4 w-16" />
              <SkeletonBox className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <SkeletonBox className="h-6 w-32" />
          {[1, 2].map(i => <SkeletonBox key={i} className="h-20 w-full rounded-lg" />)}
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <SkeletonBox className="h-6 w-48 mb-4 bg-red-200" />
          <SkeletonBox className="h-4 w-full bg-red-200 mb-2" />
          <SkeletonBox className="h-4 w-3/4 bg-red-200" />
        </div>
      </div>
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2].map(i => (
        <div key={i} className="bg-white border rounded-xl p-6 shadow-sm">
          <SkeletonBox className="h-6 w-48 mb-4" />
          <div className="h-72 w-full flex items-center justify-center">
            <div className="text-gray-300 text-sm">Загрузка графика...</div>
          </div>
        </div>
      ))}
      <div className="bg-white border rounded-xl p-6 shadow-sm lg:col-span-2">
         <SkeletonBox className="h-6 w-48 mb-4" />
         <SkeletonBox className="h-24 w-full bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

function TextSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <SkeletonBox className="h-6 w-32 mb-4" />
        <SkeletonBox className="h-4 w-full mb-2" />
        <SkeletonBox className="h-4 w-5/6 mb-2" />
        <SkeletonBox className="h-4 w-4/6" />
      </div>
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <SkeletonBox className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <SkeletonBox key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <SkeletonBox className="h-6 w-24 mb-4" />
        {[1, 2, 3].map(i => <SkeletonBox key={i} className="h-24 w-full mb-4 last:mb-0 rounded-lg" />)}
      </div>
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <SkeletonBox className="h-6 w-48 mb-4" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="mb-4">
            <div className="flex justify-between mb-2"><SkeletonBox className="h-4 w-1/3" /><SkeletonBox className="h-4 w-16" /></div>
            <SkeletonBox className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}