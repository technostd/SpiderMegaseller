import { useQuery } from '@tanstack/react-query';
import type { AnalyticsResponse } from '../types/analytics';

const mockData: AnalyticsResponse = {
  period: '30d',

  priority_matrix: [
    {
      problem: 'Размер не соответствует описанию',
      impact: 'Высокое',
      difficulty: 'Низкая',
    },
    {
      problem: 'Плохая упаковка товара',
      impact: 'Среднее',
      difficulty: 'Средняя',
    },
    {
      problem: 'Цвет отличается от фото',
      impact: 'Среднее',
      difficulty: 'Низкая',
    },
  ],

  quick_wins: [
    {
      title: 'Добавить размерную сетку',
      time: '1 час',
      effect: '+0.2★ к рейтингу',
    },
    {
      title: 'Обновить фотографии товара',
      time: '2 часа',
      effect: 'Меньше возвратов',
    },
    {
      title: 'Добавить предупреждение про упаковку',
      time: '30 минут',
      effect: 'Меньше негативных отзывов',
    },
  ],

  critical_alerts: [
    '5 отзывов за 3 дня о браке товара',
    'Покупатели часто жалуются на неверный размер',
  ],

  rating_trend: [
    { date: '2026-04-12', value: 4.1 },
    { date: '2026-04-17', value: 4.2 },
    { date: '2026-04-22', value: 4.0 },
    { date: '2026-04-27', value: 4.3 },
    { date: '2026-05-02', value: 4.4 },
    { date: '2026-05-07', value: 4.5 },
  ],

  reviews_volume: [
    { date: '2026-04-12', value: 12 },
    { date: '2026-04-17', value: 18 },
    { date: '2026-04-22', value: 9 },
    { date: '2026-04-27', value: 21 },
    { date: '2026-05-02', value: 17 },
    { date: '2026-05-07', value: 24 },
  ],

  ai_summary:
    'AI выявил, что главные проблемы связаны с размером, упаковкой и несоответствием фотографий товара.',

  ai_recommendations: [
    {
      priority: 'high',
      title: 'Исправить описание размеров',
      effect: '+150₽/мес',
      difficulty: '1–2 часа',
    },
    {
      priority: 'medium',
      title: 'Добавить реальные фото покупателей',
      effect: 'Снижение возвратов',
      difficulty: '2–3 часа',
    },
  ],
};

export const fetchOzonAnalytics = async (): Promise<AnalyticsResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockData), 500);
  });
};

export const useOzonAnalytics = () => {
  return useQuery({
    queryKey: ['ozon-analytics'],
    queryFn: fetchOzonAnalytics,
  });
};