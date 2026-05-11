export interface AnalyticsResponse {
  period: '7d' | '30d' | '90d';
  priority_matrix: PriorityItem[];
  quick_wins: QuickWin[];
  critical_alerts: string[];
  rating_trend: TrendPoint[];
  reviews_volume: TrendPoint[];
  ai_summary: string;
  ai_recommendations: Recommendation[];
}

export interface PriorityItem {
  problem: string;
  impact: 'Высокое' | 'Среднее' | 'Низкое';
  difficulty: 'Низкая' | 'Средняя' | 'Высокая';
}

export interface QuickWin {
  title: string;
  time: string;
  effect: string;
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  effect: string;
  difficulty: string;
}