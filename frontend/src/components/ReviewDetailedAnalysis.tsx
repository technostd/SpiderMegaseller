import React from 'react';
import {
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  BarChart3,
  FileText,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Calendar,
  Star,
  Package
} from 'lucide-react';
import type {ReviewAnalysis} from '../api/aiReviews';

// Типы для расширенного анализа
interface DetailedAnalysis {
  review_data?: {
    product_model?: string;
    original_rating?: number;
    review_text?: string;
    review_date?: string;
    extracted_rating_change?: number | null;
  };
  generated_response?: {
    response_text?: string;
    response_tone?: string;
    response_purpose?: string;
    key_points_addressed?: string[];
  };
  analysis?: {
    overall_sentiment?: {
      sentiment?: string;
      sentiment_score?: number;
      main_emotion?: string;
    };
    mentioned_aspects?: {
      product_related?: string[];
      service_related?: string[];
      logistics_related?: string[];
    };
    identified_issues?: Array<{
      issue_category?: string;
      issue_description?: string;
      mentioned_in_text?: string;
      severity_level?: string;
      potential_solutions?: string[];
    }>;
    key_phrases?: {
      positive_phrases?: string[];
      negative_phrases?: string[];
      suggestions?: string[];
    };
    summary?: {
      main_problem?: string;
      priority_level?: string;
      recommended_action?: string;
    };
  };
  meta?: {
    model?: string;
    tokens_used?: number;
    timestamp?: string;
    [key: string]: any;
  };
}

interface ReviewDetailedAnalysisProps {
  analysis: ReviewAnalysis;
  reviewData?: {
    product_name?: string;
    rating?: number;
    text?: string;
    created_at?: string;
  };
  expandedSections?: Record<string, boolean>;
  onToggleSection?: (section: string) => void;
}

const ReviewDetailedAnalysis: React.FC<ReviewDetailedAnalysisProps> = ({
  analysis,
  reviewData,
  expandedSections = {
    sentiment: true,
    issues: true,
    aspects: true,
    phrases: true,
    summary: true
  },
  onToggleSection
}) => {
  const detailedData = analysis.analysis_data as DetailedAnalysis;

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
      case 'позитивный':
        return 'bg-green-100 text-green-800';
      case 'negative':
      case 'негативный':
        return 'bg-red-100 text-red-800';
      case 'neutral':
      case 'нейтральный':
        return 'bg-blue-100 text-blue-800';
      case 'mixed':
      case 'смешанный':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'критическая':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
      case 'высокая':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
      case 'средняя':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
      case 'низкая':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating}/5</span>
      </div>
    );
  };

  const renderSentimentScore = (score: number) => {
    const width = Math.abs(score) * 50 + 50;
    const isPositive = score > 0;

    return (
      <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium z-10">
            {score > 0 ? '+' : ''}{score.toFixed(2)}
          </span>
        </div>
        <div
          className={`absolute top-0 h-full transition-all duration-300 ${isPositive ? 'bg-green-500 left-1/2' : 'bg-red-500 right-1/2'}`}
          style={{ width: `${width}%` }}
        />
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-800" />
      </div>
    );
  };

  const toggleSection = (section: string) => {
    if (onToggleSection) {
      onToggleSection(section);
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок анализа */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <div>
              <h4 className="font-semibold text-gray-900">Анализ отзыва</h4>
              <p className="text-sm text-gray-600">
                Модель: {detailedData.meta?.model || analysis.model_version}
                {detailedData.meta?.tokens_used && ` • ${detailedData.meta.tokens_used} токенов`}
              </p>
            </div>
          </div>
          {detailedData.analysis?.overall_sentiment?.sentiment && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(detailedData.analysis.overall_sentiment.sentiment)}`}>
              {detailedData.analysis.overall_sentiment.sentiment}
            </span>
          )}
        </div>
      </div>

      {/* Сгенерированный ответ */}
      {detailedData.generated_response?.response_text && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-3">Сгенерированный ответ</h5>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{detailedData.generated_response.response_text}</p>
            <div className="flex items-center mt-3 space-x-4 text-sm text-gray-600">
              {detailedData.generated_response.response_tone && (
                <span>Тон: {detailedData.generated_response.response_tone}</span>
              )}
              {detailedData.generated_response.response_purpose && (
                <span>Цель: {detailedData.generated_response.response_purpose}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Секция тональности */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('sentiment')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h5 className="font-medium text-gray-900">Тональность и эмоции</h5>
          </div>
          {expandedSections.sentiment ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {expandedSections.sentiment && detailedData.analysis?.overall_sentiment && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Общая тональность</label>
                <div className={`px-3 py-2 rounded-lg ${getSentimentColor(detailedData.analysis.overall_sentiment.sentiment || '')}`}>
                  <span className="font-medium">{detailedData.analysis.overall_sentiment.sentiment || 'Не определена'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Основная эмоция</label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="font-medium">{detailedData.analysis.overall_sentiment.main_emotion || 'Не определена'}</span>
                </div>
              </div>
            </div>

            {detailedData.analysis.overall_sentiment.sentiment_score !== undefined && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">Интенсивность тональности</label>
                  <span className="text-sm text-gray-600">
                    {detailedData.analysis.overall_sentiment.sentiment_score > 0 ? 'Позитивная' :
                     detailedData.analysis.overall_sentiment.sentiment_score < 0 ? 'Негативная' : 'Нейтральная'}
                  </span>
                </div>
                {renderSentimentScore(detailedData.analysis.overall_sentiment.sentiment_score)}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Негативная</span>
                  <span>Нейтральная</span>
                  <span>Позитивная</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Секция аспектов */}
      {detailedData.analysis?.mentioned_aspects && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('aspects')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-green-600" />
              <h5 className="font-medium text-gray-900">Упомянутые аспекты</h5>
            </div>
            {expandedSections.aspects ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.aspects && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(detailedData.analysis.mentioned_aspects).map(([key, value]) => (
                  value && value.length > 0 && (
                    <div key={key} className="bg-gray-50 rounded-lg p-4">
                      <h6 className="font-medium text-gray-900 mb-2 capitalize">
                        {key === 'product_related' ? 'Товар' :
                         key === 'service_related' ? 'Сервис' : 'Логистика'}
                      </h6>
                      <div className="space-y-1">
                        {value.map((item, idx) => (
                          <div key={idx} className="flex items-center text-sm text-gray-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Секция проблем */}
      {detailedData.analysis?.identified_issues && detailedData.analysis.identified_issues.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('issues')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h5 className="font-medium text-gray-900">
                Выявленные проблемы ({detailedData.analysis.identified_issues.length})
              </h5>
            </div>
            {expandedSections.issues ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.issues && (
            <div className="p-4 space-y-4">
              {detailedData.analysis.identified_issues.map((issue, idx) => (
                <div key={idx} className={`border rounded-lg p-4 ${getSeverityColor(issue.severity_level || '')}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h6 className="font-medium">{issue.issue_category}</h6>
                      <p className="text-sm text-gray-700 mt-1">{issue.issue_description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity_level || '')}`}>
                      {issue.severity_level}
                    </span>
                  </div>

                  {issue.mentioned_in_text && (
                    <div className="mt-3 p-2 bg-white/50 rounded text-sm italic">
                      "{issue.mentioned_in_text}"
                    </div>
                  )}

                  {issue.potential_solutions && issue.potential_solutions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Возможные решения:</p>
                      <div className="flex flex-wrap gap-2">
                        {issue.potential_solutions.map((solution, sIdx) => (
                          <span key={sIdx} className="px-2 py-1 bg-white rounded text-sm">
                            {solution}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Секция ключевых фраз */}
      {detailedData.analysis?.key_phrases && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('phrases')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <h5 className="font-medium text-gray-900">Ключевые фразы</h5>
            </div>
            {expandedSections.phrases ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.phrases && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {detailedData.analysis.key_phrases.positive_phrases && detailedData.analysis.key_phrases.positive_phrases.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <ThumbsUp className="w-4 h-4 text-green-600 mr-2" />
                      <h6 className="font-medium text-green-800">Позитивные</h6>
                    </div>
                    <div className="space-y-1">
                      {detailedData.analysis.key_phrases.positive_phrases.map((phrase, idx) => (
                        <div key={idx} className="text-sm text-green-700">{phrase}</div>
                      ))}
                    </div>
                  </div>
                )}

                {detailedData.analysis.key_phrases.negative_phrases && detailedData.analysis.key_phrases.negative_phrases.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <ThumbsDown className="w-4 h-4 text-red-600 mr-2" />
                      <h6 className="font-medium text-red-800">Негативные</h6>
                    </div>
                    <div className="space-y-1">
                      {detailedData.analysis.key_phrases.negative_phrases.map((phrase, idx) => (
                        <div key={idx} className="text-sm text-red-700">{phrase}</div>
                      ))}
                    </div>
                  </div>
                )}

                {detailedData.analysis.key_phrases.suggestions && detailedData.analysis.key_phrases.suggestions.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600 mr-2" />
                      <h6 className="font-medium text-blue-800">Предложения</h6>
                    </div>
                    <div className="space-y-1">
                      {detailedData.analysis.key_phrases.suggestions.map((suggestion, idx) => (
                        <div key={idx} className="text-sm text-blue-700">{suggestion}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Секция резюме */}
      {detailedData.analysis?.summary && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('summary')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <h5 className="font-medium text-gray-900">Резюме анализа</h5>
            </div>
            {expandedSections.summary ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.summary && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {detailedData.analysis.summary.main_problem && (
                  <div className="md:col-span-2 bg-yellow-50 rounded-lg p-4">
                    <h6 className="font-medium text-yellow-800 mb-2">Основная проблема</h6>
                    <p className="text-yellow-700">{detailedData.analysis.summary.main_problem}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h6 className="font-medium text-gray-800 mb-1">Приоритет</h6>
                    <span className={`px-2 py-1 rounded text-sm ${getSeverityColor(detailedData.analysis.summary.priority_level || '')}`}>
                      {detailedData.analysis.summary.priority_level}
                    </span>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h6 className="font-medium text-blue-800 mb-1">Рекомендуемое действие</h6>
                    <p className="text-blue-700 text-sm">{detailedData.analysis.summary.recommended_action}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Мета-информация */}
      {detailedData.meta && (
        <div className="text-xs text-gray-500 border-t pt-3">
          <div className="flex flex-wrap justify-between gap-2">
            <span>Модель: {detailedData.meta.model || analysis.model_version}</span>
            <span>Токены: {detailedData.meta.tokens_used || analysis.tokens_used}</span>
            <span>Время: {detailedData.meta.timestamp ? formatDate(detailedData.meta.timestamp) : formatDate(analysis.created_at)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewDetailedAnalysis;