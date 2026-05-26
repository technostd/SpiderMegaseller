import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useNotifications } from '../../contexts/NotificationContext';
import { aiReviewsApi, type ReviewAnalysis, type OzonReview } from '../../api/aiReviews';
import {
  ArrowLeft, ArrowRight, SkipForward, Send, Loader2, AlertCircle,
  Package, Star, Calendar, ExternalLink, CheckCircle, XCircle,
  MessageSquare, Sparkles, RefreshCw, Keyboard, Tag, DollarSign,
  Hash, FileText, Link as LinkIcon
} from 'lucide-react';

interface QueueItem {
  review: OzonReview;
  analysis?: ReviewAnalysis;
  loadingAnalysis: boolean;
}

const QuickModerationPage: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotifications();

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const current = queue[currentIndex];

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await aiReviewsApi.getReviews({
        moderation_status: 'pending',
        has_answer: false,
        page_size: 50
      });
      const reviews = data.results || data;
      const queueItems: QueueItem[] = reviews.map((review: OzonReview) => ({
        review,
        loadingAnalysis: !review.latest_analysis
      }));
      setQueue(queueItems);
      if (queueItems.length > 0 && !queueItems[0].analysis) {
        await loadAnalysis(queueItems[0].review);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
      showNotification('Ошибка загрузки очереди', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const loadAnalysis = async (review: OzonReview) => {
    try {
      const analyses = await aiReviewsApi.getReviewAnalyses(review.id);
      const latest = analyses[0];
      setQueue(prev => prev.map(item =>
        item.review.id === review.id
          ? { ...item, analysis: latest, loadingAnalysis: false }
          : item
      ));
      if (latest?.generated_response) {
        setResponseText(latest.generated_response);
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
      setQueue(prev => prev.map(item =>
        item.review.id === review.id
          ? { ...item, loadingAnalysis: false }
          : item
      ));
    }
  };

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  useEffect(() => {
    if (current?.analysis?.generated_response) {
      setResponseText(current.analysis.generated_response);
    } else {
      setResponseText('');
    }
  }, [currentIndex, current]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); goToPrevious(); break;
        case 'ArrowRight': e.preventDefault(); goToNext(); break;
        case 's': case 'S': e.preventDefault(); handleSend(); break;
        case 'x': case 'X': e.preventDefault(); handleSkip(); break;
        case 'e': case 'E': e.preventDefault(); textareaRef.current?.focus(); break;
        case '?': e.preventDefault(); setShowShortcuts(prev => !prev); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, queue, responseText]);

  const goToPrevious = () => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); };
  const goToNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      showNotification('Очередь пуста', 'info');
    }
  };

  const handleSkip = async () => {
    if (!current) return;
    setQueue(prev => prev.map((item, idx) =>
      idx === currentIndex ? { ...item, review: { ...item.review, moderation_status: 'not_submitted' as const } } : item
    ));
    showNotification('Отзыв пропущен', 'info');
    goToNext();
  };

  const handleSend = async () => {
    if (!current || !responseText.trim()) {
      showNotification('Введите текст ответа', 'error');
      return;
    }
    setSending(true);
    try {
      await aiReviewsApi.sendAnswer(current.review.id, responseText);
      setQueue(prev => prev.map((item, idx) =>
        idx === currentIndex ? { ...item, review: { ...item.review, has_answer: true, moderation_status: 'sent' as const } } : item
      ));
      showNotification('Ответ отправлен', 'success');
      goToNext();
    } catch (error) {
      console.error('Error sending answer:', error);
      showNotification('Ошибка отправки', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleResponseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponseText(e.target.value);
  };

  const openProductCard = (review: OzonReview) => {
    window.open(`https://ozon.ru/product/${review.product_id}`, '_blank');
  };

  const openOriginalReview = (review: OzonReview) => {
    window.open(`https://ozon.ru/review/${review.review_id}`, '_blank');
  };

  const getSentimentBadge = (sentiment?: string) => {
    if (!sentiment) return null;
    const s = sentiment.toLowerCase();
    if (s.includes('позитив') || s.includes('positive'))
      return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Позитив</span>;
    if (s.includes('негатив') || s.includes('negative'))
      return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">Негатив</span>;
    if (s.includes('смешан') || s.includes('mixed'))
      return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">Смешанный</span>;
    return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">Нейтральный</span>;
  };

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null;
    const s = severity.toLowerCase();
    if (s.includes('крити') || s.includes('critical'))
      return <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs">Крит.</span>;
    if (s.includes('высок') || s.includes('high'))
      return <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">Высок.</span>;
    if (s.includes('средн') || s.includes('medium'))
      return <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Сред.</span>;
    return <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Низк.</span>;
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-2">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
          ))}
        </div>
        <span className="text-base font-semibold text-gray-900">{rating}.0</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatPrice = (price: string | number | undefined) => {
    if (!price) return '—';
    const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^\d.]/g, '')) : price;
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(numPrice);
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

  if (queue.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Очередь пуста</h2>
          <p className="text-gray-600 mb-6">Все отзывы обработаны или нет отзывов на модерации.</p>
          <div className="flex justify-center gap-4">
            <button onClick={fetchQueue} className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <RefreshCw className="w-4 h-4 mr-2" /> Обновить
            </button>
            <button onClick={() => navigate('/lk/module/ai-reviews/moderation')} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <ArrowLeft className="w-4 h-4 mr-2" /> К списку отзывов
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!current) return null;

  const { review, analysis, loadingAnalysis } = current;
  const productInfo = (review as any).product_info || {};

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Header — компактный */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/lk/module/ai-reviews/moderation')} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">БЫСТРАЯ МОДЕРАЦИЯ</h1>
              <p className="text-xs text-gray-400">
                {currentIndex + 1} / {queue.length} • {queue.filter(q => q.review.moderation_status === 'pending').length} на модерации
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowShortcuts(prev => !prev)} className="flex items-center px-2 py-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded text-xs">
              <Keyboard className="w-3.5 h-3.5 mr-1" /> Горячие клавиши
            </button>
            <button onClick={fetchQueue} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Обновить">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Shortcuts */}
        {showShortcuts && (
          <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">Горячие клавиши</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
              <div className="flex items-center"><kbd className="px-1.5 py-0.5 bg-gray-200 rounded mr-1.5 text-xs">←</kbd> Пред.</div>
              <div className="flex items-center"><kbd className="px-1.5 py-0.5 bg-gray-200 rounded mr-1.5 text-xs">→</kbd> След.</div>
              <div className="flex items-center"><kbd className="px-1.5 py-0.5 bg-gray-200 rounded mr-1.5 text-xs">S</kbd> Отправить</div>
              <div className="flex items-center"><kbd className="px-1.5 py-0.5 bg-gray-200 rounded mr-1.5 text-xs">X</kbd> Пропустить</div>
              <div className="flex items-center"><kbd className="px-1.5 py-0.5 bg-gray-200 rounded mr-1.5 text-xs">E</kbd> Редактировать</div>
              <div className="flex items-center"><kbd className="px-1.5 py-0.5 bg-gray-200 rounded mr-1.5 text-xs">?</kbd> Справка</div>
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="mb-3">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }} />
          </div>
        </div>

        {/* CARDS ROW — Отзыв + Товар */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          {/* ========== КАРТОЧКА ОТЗЫВ ========== */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Заголовок карточки — стиль второго скрина */}
            <div className="px-4 py-2 border-b border-gray-100">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Отзыв
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {/* Оценка + Дата в одной строке */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">ОЦЕНКА ПОКУПАТЕЛЯ</p>
                  {renderStars(review.rating)}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">ДАТА ОТЗЫВА</p>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{formatDate(review.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Статус + Тональность в одной строке */}
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">СТАТУС</p>
                  <div className="flex items-center gap-1.5">
                    {review.has_answer ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                        <CheckCircle className="w-3 h-3" /> Отвечен
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                        <AlertCircle className="w-3 h-3" /> Не отвечен
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      review.moderation_status === 'pending' ? 'bg-blue-100 text-blue-700' :
                      review.moderation_status === 'sent' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {review.moderation_status === 'pending' ? 'На модерации' : review.moderation_status === 'sent' ? 'Отправлен' : 'Не отправлен'}
                    </span>
                  </div>
                </div>
                {analysis && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">ТОНАЛЬНОСТЬ (AI)</p>
                    {getSentimentBadge(analysis.sentiment)}
                  </div>
                )}
              </div>

              {/* Текст отзыва */}
              <div>
                <p className="text-xs text-gray-400 mb-1">ТЕКСТ ОТЗЫВА</p>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-28 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-snug">{review.text}</p>
                </div>
              </div>

              {/* Ссылка на оригинал */}
              <button onClick={() => openOriginalReview(review)} className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 font-medium">
                <ExternalLink className="w-3 h-3" />
                Открыть оригинал на Ozon
              </button>
            </div>
          </div>

          {/* ========== КАРТОЧКА ТОВАР ========== */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Заголовок карточки — стиль второго скрина */}
            <div className="px-4 py-2 border-b border-gray-100">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                Товар
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {/* Название + Цена в одной строке */}
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-4">
                  <p className="text-xs text-gray-400 mb-1">НАЗВАНИЕ</p>
                  <div className="flex items-start gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 leading-tight">{review.product_name || 'Не указано'}</p>
                      {productInfo.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{productInfo.description}</p>
                      )}
                    </div>
                  </div>
                </div>
                {(productInfo.price || productInfo.pricing) && (
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400 mb-1">ЦЕНА</p>
                    <div className="flex items-center gap-1 justify-end text-sm font-semibold text-gray-900">
                      <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                      {formatPrice(productInfo.price || productInfo.pricing?.price)}
                    </div>
                  </div>
                )}
              </div>

              {/* SKU + Offer ID в одной строке */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">SKU</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 font-mono">
                    <Hash className="w-3.5 h-3.5 text-gray-400" />
                    {review.sku || productInfo.sku || '—'}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">OFFER ID</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 font-mono">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    {productInfo.offer_id || review.offer_id || '—'}
                  </div>
                </div>
              </div>

              {/* Изображения */}
              {productInfo.images && productInfo.images.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">ИЗОБРАЖЕНИЯ</p>
                  <div className="flex gap-1.5">
                    {productInfo.images.slice(0, 4).map((img: any, idx: number) => (
                      <div key={idx} className="w-12 h-12 rounded border border-gray-200 overflow-hidden bg-gray-50 shrink-0">
                        <img src={img.url || img} alt={`img-${idx}`} className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    ))}
                    {productInfo.images.length > 4 && (
                      <div className="w-12 h-12 rounded border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                        +{productInfo.images.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Характеристики — обводка в стиле поля даты */}
              {(productInfo.characteristics || review.product_characteristics) && Object.keys(productInfo.characteristics || review.product_characteristics || {}).length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">ХАРАКТЕРИСТИКИ</p>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-36 overflow-y-auto">
                    {Object.entries(productInfo.characteristics || review.product_characteristics || {}).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center gap-2 px-3 py-1.5">
                        <span className="text-xs text-gray-400 w-24 shrink-0 truncate">{key}</span>
                        <span className="text-xs text-gray-700 truncate">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ссылка на товар */}
              <button onClick={() => openProductCard(review)} className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 font-medium">
                <LinkIcon className="w-3 h-3" />
                Открыть карточку товара
              </button>
            </div>
          </div>
        </div>

        {/* AI ANALYSIS + ACTIONS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* AI Analysis */}
          <div className="lg:col-span-2">
            {loadingAnalysis ? (
              <div className="border border-gray-200 rounded-lg p-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Загрузка анализа...</p>
              </div>
            ) : analysis ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    AI-анализ
                  </h2>
                </div>
                <div className="p-4">
                  {/* Ответ */}
                  {analysis.generated_response && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 mb-1">ПРЕДЛОЖЕННЫЙ ОТВЕТ</p>
                      <textarea
                        ref={textareaRef}
                        value={responseText}
                        onChange={handleResponseChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-20 resize-y"
                        placeholder="Введите или отредактируйте ответ..."
                      />
                      <div className="text-xs text-gray-400 mt-0.5 text-right">{responseText.length} / 1000</div>
                    </div>
                  )}

                  {/* Summary — проблемы и рекомендации */}
                  {analysis.analysis_data?.analysis?.summary && (
                    <div className="flex gap-3 mb-3">
                      {analysis.analysis_data.analysis.summary.main_problem && (
                        <div className="flex-1 p-2 bg-yellow-50 rounded border border-yellow-200">
                          <p className="text-xs font-medium text-yellow-700">ПРОБЛЕМА</p>
                          <p className="text-xs text-yellow-600 mt-0.5 leading-snug">{analysis.analysis_data.analysis.summary.main_problem}</p>
                        </div>
                      )}
                      {analysis.analysis_data.analysis.summary.recommended_action && (
                        <div className="flex-1 p-2 bg-blue-50 rounded border border-blue-200">
                          <p className="text-xs font-medium text-blue-700">РЕКОМЕНДАЦИЯ</p>
                          <p className="text-xs text-blue-600 mt-0.5 leading-snug">{analysis.analysis_data.analysis.summary.recommended_action}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Проблемы */}
                  {analysis.analysis_data?.analysis?.identified_issues?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">ВЫЯВЛЕННЫЕ ПРОБЛЕМЫ ({analysis.analysis_data.analysis.identified_issues.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.analysis_data.analysis.identified_issues.map((issue: any, idx: number) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded text-xs border border-red-200">
                            {issue.issue_category}
                            {getSeverityBadge(issue.severity_level)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 text-center">
                <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                <p className="text-xs text-gray-500 mb-3">Анализ не найден</p>
                <button onClick={() => loadAnalysis(review)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs">
                  Запустить анализ
                </button>
              </div>
            )}
          </div>

          {/* Actions Panel */}
          <div>
            <div className="border border-gray-200 rounded-lg overflow-hidden sticky top-24">
              <div className="px-4 py-2 border-b border-gray-100">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Действия</h2>
              </div>
              <div className="p-3 space-y-2">
                <button
                  onClick={handleSend}
                  disabled={sending || !responseText.trim() || loadingAnalysis}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Отправка...' : 'Отправить и далее'}
                </button>
                <button
                  onClick={handleSkip}
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm font-medium transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                  Пропустить
                </button>

                <div className="pt-2 border-t border-gray-100">
                  <div className="flex gap-1.5">
                    <button onClick={goToPrevious} disabled={currentIndex === 0}
                      className="flex-1 flex items-center justify-center px-2 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                      <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                      <span className="text-xs">Назад</span>
                    </button>
                    <button onClick={goToNext} disabled={currentIndex === queue.length - 1}
                      className="flex-1 flex items-center justify-center px-2 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                      <span className="text-xs">Далее</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="px-3 pb-3">
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="p-2 bg-green-50 rounded text-center">
                    <div className="text-sm font-bold text-green-600">{queue.filter(q => q.review.has_answer).length}</div>
                    <div className="text-xs text-gray-500">Отвечено</div>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded text-center">
                    <div className="text-sm font-bold text-yellow-600">{queue.filter(q => q.review.moderation_status === 'pending').length}</div>
                    <div className="text-xs text-gray-500">Осталось</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QuickModerationPage;