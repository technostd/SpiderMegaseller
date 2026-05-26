import api from './client';
import type { AnalyticsResponse, Period } from '../types/analytics';

export const fetchOzonAnalytics = async (period: Period = '30d'): Promise<AnalyticsResponse> => {
  const { data } = await api.get<AnalyticsResponse>('/ai-reviews/ozon/dashboard/', {
    params: { period },
  });
  return data;
};