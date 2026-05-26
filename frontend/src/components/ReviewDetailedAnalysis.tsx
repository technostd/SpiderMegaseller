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
  Star
} from 'lucide-react';

interface ReviewDetailedAnalysisProps {
  analysis: any; // один объект из массива с бэка
  expandedSections?: Record<string, boolean>;
  onToggleSection?: (section: string) => void;
}

const ReviewDetailedAnalysis: React.FC<ReviewDetailedAnalysisProps> = ({
  analysis,
  expandedSections = { sentiment: true, issues: true, aspects: true, phrases: true, summary: true },
  onToggleSection
}) => {
  // Берём самые полные данные
  const data = analysis.detailed_analysis || analysis.analysis_data || analysis;
  const reviewData = analysis.review_data || data.review_data || {};

  const toggleSection = (section: string) => {
    onToggleSection?.(section);
  };

  const getSentimentColor = (sentiment?: string) => {
    const s = sentiment?.toLowerCase() || '';
    if (s.includes('позитив') || s.includes('positive')) return 'bg-green-100 text-green-800';
    if (s.includes('негатив') || s.includes('negative')) return 'bg-red-100 text-red-800';
    if (s.includes('смешан') || s.includes('mixed')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity?: string) => {
    const s = severity?.toLowerCase() || '';
    if (s.includes('крити') || s.includes('critical')) return 'bg-red-100 text-red-800 border-red-200';
    if (s.includes('высок') || s.includes('high')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (s.includes('средн') || s.includes('medium')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Нормализация mentioned_aspects (может быть массив или объект)
  const aspects = data.analysis?.mentioned_aspects || {};
  const aspectsArray = Array.isArray(aspects) ? aspects :
    Object.entries(aspects).flatMap(([_, arr]) => arr || []);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-2xl border border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <div>
              <h4 className="font-semibold text-lg text-gray-900">Детальный анализ отзыва</h4>
              <p className="text-sm text-gray-600">
                {analysis.model_version || data.meta?.model} • {analysis.tokens_used || data.meta?.tokens_used} токенов
              </p>
            </div>
          </div>

          {(analysis.sentiment || data.analysis?.overall_sentiment?.sentiment) && (
            <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getSentimentColor(analysis.sentiment || data.analysis?.overall_sentiment?.sentiment)}`}>
              {analysis.sentiment || data.analysis?.overall_sentiment?.sentiment}
            </span>
          )}
        </div>
      </div>

      {/* Сгенерированный ответ */}
      {(analysis.generated_response || data.generated_response?.response_text) && (
        <div className="border border-gray-200 rounded-2xl p-5">
          <h5 className="font-semibold mb-3 text-gray-900">Сгенерированный ответ продавца</h5>
          <div className="bg-blue-50 p-5 rounded-xl text-gray-700 leading-relaxed">
            {analysis.generated_response || data.generated_response?.response_text}
          </div>
        </div>
      )}

      {/* Тональность */}
      {data.analysis?.overall_sentiment && (
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => toggleSection('sentiment')}
            className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h5 className="font-semibold">Тональность и эмоции</h5>
            </div>
            {expandedSections.sentiment ? <ChevronUp /> : <ChevronDown />}
          </button>

          {expandedSections.sentiment && (
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Общая тональность</p>
                  <div className={`inline-block px-4 py-2 rounded-xl ${getSentimentColor(data.analysis.overall_sentiment.sentiment)}`}>
                    {data.analysis.overall_sentiment.sentiment}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Основная эмоция</p>
                  <p className="font-medium">{data.analysis.overall_sentiment.main_emotion}</p>
                </div>
              </div>

              {data.analysis.overall_sentiment.sentiment_score !== undefined && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Интенсивность тональности</p>
                  {/* Можно оставить твой renderSentimentScore, если хочешь */}
                  <p className="text-sm font-medium">
                    {data.analysis.overall_sentiment.sentiment_score > 0 ? 'Позитивная' : 'Негативная'} ({data.analysis.overall_sentiment.sentiment_score.toFixed(2)})
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Упомянутые аспекты */}
      {aspectsArray.length > 0 && (
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => toggleSection('aspects')}
            className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-green-600" />
              <h5 className="font-semibold">Упомянутые аспекты</h5>
            </div>
            {expandedSections.aspects ? <ChevronUp /> : <ChevronDown />}
          </button>

          {expandedSections.aspects && (
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                {aspectsArray.map((aspect: string, idx: number) => (
                  <span key={idx} className="bg-gray-100 px-4 py-2 rounded-xl text-sm">
                    {aspect}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Выявленные проблемы */}
      {data.analysis?.identified_issues?.length > 0 && (
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => toggleSection('issues')}
            className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h5 className="font-semibold">
                Выявленные проблемы ({data.analysis.identified_issues.length})
              </h5>
            </div>
            {expandedSections.issues ? <ChevronUp /> : <ChevronDown />}
          </button>

          {expandedSections.issues && (
            <div className="p-5 space-y-4">
              {data.analysis.identified_issues.map((issue: any, idx: number) => (
                <div key={idx} className={`border rounded-2xl p-5 ${getSeverityColor(issue.severity_level)}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h6 className="font-semibold">{issue.issue_category}</h6>
                      <p className="mt-1 text-gray-700">{issue.issue_description}</p>
                    </div>
                    <span className="text-xs font-medium px-3 py-1 rounded-lg border">
                      {issue.severity_level}
                    </span>
                  </div>

                  {issue.mentioned_in_text && (
                    <p className="mt-3 text-sm italic text-gray-600 border-l-2 border-gray-300 pl-3">
                      «{issue.mentioned_in_text}»
                    </p>
                  )}

                  {issue.potential_solutions?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Рекомендуемые решения:</p>
                      <div className="flex flex-wrap gap-2">
                        {issue.potential_solutions.map((sol: string, i: number) => (
                          <span key={i} className="bg-white px-3 py-1 rounded-lg text-sm border">
                            {sol}
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

      {/* Резюме */}
      {data.analysis?.summary && (
        <div className="border border-gray-200 rounded-2xl p-5">
          <h5 className="font-semibold mb-4">Резюме анализа</h5>
          <div className="space-y-4">
            {data.analysis.summary.main_problem && (
              <div className="bg-yellow-50 p-4 rounded-xl">
                <p className="font-medium text-yellow-800">Основная проблема:</p>
                <p className="text-yellow-700 mt-1">{data.analysis.summary.main_problem}</p>
              </div>
            )}

            <div className="flex gap-4">
              {data.analysis.summary.priority_level && (
                <div className="flex-1 bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">Приоритет</p>
                  <p className="font-medium">{data.analysis.summary.priority_level}</p>
                </div>
              )}
              {data.analysis.summary.recommended_action && (
                <div className="flex-1 bg-blue-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">Рекомендация</p>
                  <p className="text-blue-700">{data.analysis.summary.recommended_action}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Мета */}
      <div className="text-xs text-gray-500 pt-4 border-t">
        Создано: {formatDate(analysis.created_at)} • Модель: {analysis.model_version}
      </div>
    </div>
  );
};

export default ReviewDetailedAnalysis;