import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useNotifications } from '../../contexts/NotificationContext';
import { aiReviewsApi, type OzonReview, type ReviewAnalysis } from '../../api/aiReviews';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Star,
  Calendar,
  Package,
  Send,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText,
  Eye
} from 'lucide-react';

const AiReviewsModeration: React.FC = () => {
  const { showNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<number | null>(null);
  const [reviews, setReviews] = useState<OzonReview[]>([]);
  const [selectedReview, setSelectedReview] = useState<OzonReview | null>(null);
  const [analyses, setAnalyses] = useState<ReviewAnalysis[]>([]);
  const [filter, setFilter] = useState({
    moderation_status: 'pending',
    has_answer: false,
    rating: '' as string | number
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    answered: 0,
    pending_moderation: 0,
    answered_percentage: 0,
    average_rating: 0
  });

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [page, filter]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const params = {
        ...filter,
        page,
        page_size: 10
      };
      const data = await aiReviewsApi.getReviews(params);
      setReviews(data.results || data);
      setTotalPages(data.total_pages || 1);
    } catch (error) {
      console.error('Error loading reviews:', error);
      showNotification('Ошибка загрузки отзывов', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await aiReviewsApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSelectReview = async (review: OzonReview) => {
    setSelectedReview(review);
    try {
      const data = await aiReviewsApi.getReviewAnalyses(review.id);
      console.log('Analyses loaded from API:', data);
      setAnalyses(data || []);
    } catch (apiError) {
      console.error('API Error:', apiError);
      setAnalyses([]);
    }
  };

  const handleSendAnswer = async (reviewId: number, text: string) => {
    try {
      setSending(reviewId);
      await aiReviewsApi.sendAnswer(reviewId, text);
      showNotification('Ответ отправлен успешно', 'success');
      await loadReviews();
      await loadStats();
      // Обновляем анализы после отправки
      if (selectedReview?.id === reviewId) {
        const updatedAnalyses = await aiReviewsApi.getReviewAnalyses(reviewId);
        setAnalyses(updatedAnalyses || []);
      }
    } catch (error) {
      console.error('Error sending answer:', error);
      showNotification('Ошибка отправки ответа', 'error');
    } finally {
      setSending(null);
    }
  };

  const handleApproveAnswer = async (review: OzonReview, analysis: ReviewAnalysis) => {
    if (!analysis.generated_response) {
      showNotification('Нет текста ответа для отправки', 'error');
      return;
    }
    await handleSendAnswer(review.id, analysis.generated_response);
  };

  const handleRejectAnswer = async (review: OzonReview) => {
    showNotification('Ответ отклонен', 'info');
    setReviews(prev => prev.map(r =>
      r.id === review.id ? { ...r, moderation_status: 'not_submitted' } : r
    ));
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'not_submitted': { color: 'bg-gray-100 text-gray-800', label: 'Не отправлено' },
      'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'На модерации' },
      'sent': { color: 'bg-green-100 text-green-800', label: 'Отправлено' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_submitted;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
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
      case 'mixed':
      case 'смешанный':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !reviews.length) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Заголовок и статистика */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Модерация отзывов
              </h1>
              <p className="text-gray-600">
                Просматривайте, анализируйте и утверждайте автоматически сгенерированные ответы
              </p>
            </div>
            <button
              onClick={loadReviews}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </button>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Всего отзывов</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{stats.answered}</div>
              <div className="text-sm text-gray-600">Отвечено</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_moderation}</div>
              <div className="text-sm text-gray-600">На модерации</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{stats.average_rating.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Средний рейтинг</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка - список отзывов */}
          <div className="lg:col-span-2">
            {/* Фильтры */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Filter className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Фильтры:</span>
                </div>
                <select
                  value={filter.moderation_status}
                  onChange={(e) => setFilter(prev => ({ ...prev, moderation_status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="pending">На модерации</option>
                  <option value="not_submitted">Не отправлено</option>
                  <option value="sent">Отправлено</option>
                  <option value="">Все статусы</option>
                </select>
                <select
                  value={filter.rating}
                  onChange={(e) => setFilter(prev => ({ ...prev, rating: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Все оценки</option>
                  <option value="5">5 звезд</option>
                  <option value="4">4 звезды</option>
                  <option value="3">3 звезды</option>
                  <option value="2">2 звезды</option>
                  <option value="1">1 звезда</option>
                </select>
              </div>
            </div>

            {/* Список отзывов */}
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className={`bg-white rounded-xl shadow-sm border ${selectedReview?.id === review.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'} p-4 hover:shadow-md transition-shadow cursor-pointer`}
                  onClick={() => handleSelectReview(review)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {renderStars(review.rating)}
                          {getStatusBadge(review.moderation_status)}
                          {review.has_answer && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              Отвечен
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(review.created_at)}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-3 line-clamp-2">
                        {review.text}
                      </p>

                      {review.product_name && (
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <Package className="w-4 h-4 mr-1" />
                          {review.product_name}
                        </div>
                      )}

                      {review.latest_analysis && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Сгенерированный ответ:
                            </span>
                            <span className={`text-xs font-medium px-2 py-1 rounded ${getSentimentColor(review.latest_analysis.sentiment || '')}`}>
                              {review.latest_analysis.sentiment}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {review.latest_analysis.response_preview}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center mt-6 space-x-2">
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 text-sm font-medium text-gray-700">
                  Страница {page} из {totalPages}
                </span>
                <button
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Правая колонка - детали отзыва */}
          <div className="lg:col-span-1">
            {selectedReview ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Детали отзыва
                </h3>

                {/* Информация об отзыве */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Оценка
                    </label>
                    {renderStars(selectedReview.rating)}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Дата отзыва
                    </label>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(selectedReview.created_at)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Товар
                    </label>
                    <div className="flex items-center text-gray-600">
                      <Package className="w-4 h-4 mr-2" />
                      {selectedReview.product_name || 'Не указан'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Статус
                    </label>
                    {getStatusBadge(selectedReview.moderation_status)}
                  </div>
                </div>

                {/* Полный текст отзыва */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Полный текст отзыва
                  </label>
                  <div className="p-4 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedReview.text}
                    </p>
                  </div>
                </div>

                {/* Анализы отзыва */}
                {analyses.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">
                        Анализы отзыва ({analyses.length})
                      </h4>
                      <Link
                        to={`/lk/module/ai-reviews/analysis/${selectedReview.id}`}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Подробный анализ
                      </Link>
                    </div>

                    <div className="space-y-4">
                      {analyses.map((analysis) => (
                        <div
                          key={analysis.id}
                          className="p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-medium px-2 py-1 rounded ${getSentimentColor(analysis.sentiment || '')}`}>
                                {analysis.sentiment || 'Не определен'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(analysis.created_at)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {analysis.tokens_used} токенов
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-gray-700 text-sm whitespace-pre-wrap line-clamp-4">
                              {analysis.generated_response}
                            </p>
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveAnswer(selectedReview, analysis)}
                              disabled={sending === selectedReview.id}
                              className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              {sending === selectedReview.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Утвердить и отправить
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleRejectAnswer(selectedReview)}
                              className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Отклонить
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ручной ответ */}
                {!selectedReview.has_answer && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Ручной ответ
                    </h4>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Введите текст ответа..."
                      defaultValue={analyses[0]?.generated_response || ''}
                    />
                    <button
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea?.value) {
                          handleSendAnswer(selectedReview.id, textarea.value);
                        }
                      }}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Отправить ответ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Выберите отзыв
                </h3>
                <p className="text-gray-600">
                  Выберите отзыв из списка слева, чтобы просмотреть детали и отправить ответ
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AiReviewsModeration;