// frontend/src/api/aiReviews.ts
import api from './client';

export interface OzonReview {
  id: number;
  review_id: number;
  product_id: number;
  offer_id: string;
  sku: string;
  text: string;
  short_text: string;
  rating: number | null;
  created_at: string;
  product_name: string;
  product_characteristics: Record<string, any>;
  has_answer: boolean;
  answer_text: string;
  answer_posted_at: string | null;
  answer_ozon_id: string;
  moderation_status: 'not_submitted' | 'pending' | 'sent';
  created_local: string;
  updated_local: string;
  analysis_count: number;
  latest_analysis: {
    id: number;
    sentiment: string;
    response_preview: string;
    created_at: string;
  } | null;
}

export interface ModuleConfig {
  premoderate: boolean;
  auto_publish_positive: boolean;
  default_tone: 'нейтральный' | 'благодарный' | 'извиняющийся' | 'дружелюбный';
  max_response_length: number;
}

export interface ReviewAnalysis {
  id: number;
  review: number;
  analysis_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  tokens_used: number;
  model_version: string;
  is_success: boolean;
  error_message: string | null;
  generated_response: string;
  sentiment: string;
  issues_count: number;
  response_preview: string;
}

export interface ProcessOzonRequest {
  days_back?: number;
}

export interface ProcessOzonResponse {
  success: boolean;
  processed: number;
  results: Array<{
    review_id: number;
    status: string;
    analysis_id?: number;
    response_preview?: string;
    error?: string;
  }>;
  timestamp: string;
  days_back: number;
  config: {
    premoderate: boolean;
  };
}

export interface ReviewStats {
  total: number;
  answered: number;
  pending_moderation: number;
  answered_percentage: number;
  average_rating: number;
}

// Основной API сервис
export const aiReviewsApi = {
  // Получение отзывов с фильтрацией
  getReviews: async (params?: {
    has_answer?: boolean;
    moderation_status?: string;
    rating?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  }) => {
    const response = await api.get('/ai-reviews/reviews/', { params });
    return response.data;
  },

  // Получение конкретного отзыва
  getReview: async (id: number) => {
    const response = await api.get(`/ai-reviews/reviews/${id}/`);
    return response.data;
  },

  // Отправка ответа на отзыв
  sendAnswer: async (reviewId: number, text: string) => {
    const response = await api.post(`/ai-reviews/reviews/${reviewId}/send_answer/`, { text });
    return response.data;
  },

  // Получение статистики
  getStats: async () => {
    const response = await api.get('/ai-reviews/reviews/stats/');
    return response.data;
  },

  // Автоматическая обработка отзывов из Ozon
  processOzonReviews: async (data: ProcessOzonRequest) => {
    const response = await api.post('/ai-reviews/process-ozon/', data);
    return response.data as ProcessOzonResponse;
  },

  getReviewAnalyses: async (reviewId: number) => {
    const response = await api.get(`/ai-reviews/reviews/${reviewId}/analyses/`);
    return response.data;
  },


  // Конфигурация модуля
  getModuleConfig: async () => {
    const response = await api.get('/accounts/module-config/ai_reviews/');
    return response.data;
  },

  updateModuleConfig: async (config: Partial<ModuleConfig>) => {
    const response = await api.post('/accounts/module-config/ai_reviews/', {
      config
    });
    return response.data;
  },

  // Получение схемы конфигурации
  getModuleSchema: async () => {
    const response = await api.get('/accounts/module-config/schema/ai_reviews/');
    return response.data;
  },

  // Тест подключения к Ozon
  testOzonConnection: async (apiKey: string, clientId: string) => {
    const response = await api.post('/ai-reviews/ozon/test/', {
      api_key: apiKey,
      client_id: clientId
    });
    return response.data;
  },

  // Тест подключения к Yandex GPT
  testYandexGPTConnection: async () => {
    const response = await api.get('/ai-reviews/test/');
    return response.data;
  }
};