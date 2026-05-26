export type Period = '7d' | '30d' | '90d';

export interface AnalyticsResponse {
  period: Period;
  priority_matrix: PriorityItem[];
  quick_wins: QuickWin[];
  critical_alerts: string[];
  rating_trend: TrendPoint[];
  reviews_volume: TrendPoint[];
  ai_summary: string;
  ai_recommendations: AIRecommendation[];
  card_analysis: CardAnalysis;
  returns_analysis: ReturnsAnalysis;
  customer_segments: CustomerSegment[];
  assortment: AssortmentItem[];
  response_effectiveness: ResponseEffectiveness;
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

export interface AIRecommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  effect: string;
  difficulty: string;
}

export interface CardAnalysis {
  match_description_pct: number;
  photo_in_reviews_pct: number;
  issues: string[];
}

export interface ReturnReason {
  reason: string;
  pct: number;
  cost_rub: number;
}

export interface ReturnsAnalysis {
  reasons: ReturnReason[];
  total_returns: number;
  total_cost_rub: number;
}

export interface CustomerSegment {
  type: string;
  rating: number;
  count: number;
}

export interface AssortmentItem {
  sku: string;
  name: string;
  rating: number;
  reviews: number;
  trend: string;
}

export interface ResponseEffectiveness {
  with_answer_change_pct: number;
  without_answer_change_pct: number;
  avg_response_time_hours: number;
  ai_generated_count: number;
  time_saved_hours: number;
}