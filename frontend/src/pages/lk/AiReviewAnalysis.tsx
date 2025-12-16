import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useNotifications } from '../../contexts/NotificationContext';
import { aiReviewsApi, type ReviewAnalysis, type OzonReview } from '../../api/aiReviews';
import ReviewDetailedAnalysis from '../../components/ReviewDetailedAnalysis';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  MessageSquare,
  Star,
  Calendar,
  Package
} from 'lucide-react';

const AiReviewAnalysisPage: React.FC = () => {
  const { reviewId, analysisId } = useParams<{ reviewId: string; analysisId?: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<OzonReview | null>(null);
  const [analyses, setAnalyses] = useState<ReviewAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<ReviewAnalysis | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    sentiment: true,
    issues: true,
    aspects: true,
    phrases: true,
    summary: true
  });

  useEffect(() => {
    if (reviewId) {
      loadData();
    }
  }, [reviewId, analysisId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Загружаем отзыв
      const reviewData = await aiReviewsApi.getReview(parseInt(reviewId!));
      setReview(reviewData);

      // Загружаем анализы
      const analysesData = await aiReviewsApi.getReviewAnalyses(parseInt(reviewId!));
      setAnalyses(analysesData);

      // Выбираем анализ
      if (analysisId) {
        const foundAnalysis = analysesData.find(a => a.id.toString() === analysisId);
        setSelectedAnalysis(foundAnalysis || analysesData[0] || null);
      } else if (analysesData.length > 0) {
        setSelectedAnalysis(analysesData[0]);
      }
    } catch (error) {
      console.error('Error loading analysis data:', error);
      showNotification('Ошибка загрузки анализа', 'error');
    } finally {
      setLoading(false);
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!review) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Отзыв не найден</h2>
            <p className="text-gray-600 mb-4">Запрошенный отзыв не существует или у вас нет к нему доступа.</p>
            <Link
              to="/lk/module/ai-reviews/moderation"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться к модерации
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4">
        {/* Хлебные крошки и навигация */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <nav className="flex items-center text-sm text-gray-600 mb-2">
                <Link to="/lk/module/ai-reviews/moderation" className="hover:text-blue-600">
                  Модерация отзывов
                </Link>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">Анализ отзыва #{reviewId}</span>
              </nav>
              <h1 className="text-2xl font-bold text-gray-900">
                Детальный анализ отзыва
              </h1>
            </div>
            <button
              onClick={() => navigate('/lk/module/ai-reviews/moderation')}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к модерации
            </button>
          </div>

          {/* Информация об отзыве */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Товар
                </label>
                <div className="flex items-center text-gray-900">
                  <Package className="w-4 h-4 mr-2" />
                  {review.product_name || 'Не указан'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Оценка
                </label>
                {renderStars(review.rating)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата отзыва
                </label>
                <div className="flex items-center text-gray-900">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDate(review.created_at)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Статус
                </label>
                <div className="text-sm">
                  {review.has_answer ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      Отвечен
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                      Не отвечен
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Текст отзыва
              </label>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{review.text}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Левая колонка - список анализов */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Анализы ({analyses.length})
              </h3>

              {analyses.length > 0 ? (
                <div className="space-y-3">
                  {analyses.map((analysis) => (
                    <button
                      key={analysis.id}
                      onClick={() => setSelectedAnalysis(analysis)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedAnalysis?.id === analysis.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            Анализ #{analysis.id}
                          </span>
                        </div>
                        {analysis.sentiment && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            getSentimentColor(analysis.sentiment)
                          }`}>
                            {analysis.sentiment}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(analysis.created_at)}
                      </div>
                      {analysis.generated_response && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {analysis.generated_response.substring(0, 100)}...
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Анализы не найдены</p>
                </div>
              )}
            </div>
          </div>

          {/* Правая колонка - детальный анализ */}
          <div className="lg:col-span-3">
            {selectedAnalysis ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Анализ #{selectedAnalysis.id}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {formatDate(selectedAnalysis.created_at)}
                  </div>
                </div>

                <ReviewDetailedAnalysis
                  analysis={selectedAnalysis}
                  reviewData={{
                    product_name: review.product_name,
                    rating: review.rating,
                    text: review.text,
                    created_at: review.created_at
                  }}
                  expandedSections={expandedSections}
                  onToggleSection={toggleSection}
                />

                {/* Кнопки действий */}
                {!review.has_answer && selectedAnalysis.generated_response && (
                  <div className="mt-8 p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Действия с ответом</h4>
                    <div className="flex space-x-3">
                      <button
                        onClick={async () => {
                          try {
                            await aiReviewsApi.sendAnswer(review.id, selectedAnalysis.generated_response!);
                            showNotification('Ответ успешно отправлен', 'success');
                            navigate('/lk/module/ai-reviews/moderation');
                          } catch (error) {
                            showNotification('Ошибка отправки ответа', 'error');
                          }
                        }}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium"
                      >
                        Отправить ответ
                      </button>
                      <button
                        onClick={() => {
                          navigate(`/lk/module/ai-reviews/moderation`);
                        }}
                        className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 font-medium"
                      >
                        Вернуться к модерации
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : analyses.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Нет доступных анализов
                </h3>
                <p className="text-gray-600 mb-4">
                  Для этого отзыва еще не созданы анализы.
                </p>
                <button
                  onClick={() => navigate('/lk/module/ai-reviews/moderation')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Вернуться к модерации
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AiReviewAnalysisPage;