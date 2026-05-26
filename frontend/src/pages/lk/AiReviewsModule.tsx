// src/pages/lk/AiReviewsModule.tsx
import { useState, useEffect } from 'react';
import ReviewAnalyzer from '../../components/ReviewAnalyzer';
import {usePageSubtitle} from "../../hooks/usePageTitle.ts";
import DashboardLayout from "../../components/DashboardLayout.tsx";

export default function AiReviewsModule() {

    usePageSubtitle('Модуль ИИ-анализа отзывов OZON')

    const [activeExample, setActiveExample] = useState<string | null>(null);
    const [currentReview, setCurrentReview] = useState({
        review_text: '',
        product_model: '',
        original_rating: '',
    });

    const testReviews = [
        {
            id: '1',
            title: 'Негативный отзыв о батарее',
            review_text: 'Батарея садится за 1 день, хотя заявлено 7. Разочарован.',
            product_model: 'Фитнес-браслет X9',
            original_rating: '2',
            sentiment: 'negative',
            color: 'bg-white border-l-4 border-red-500'
        },
        {
            id: '2',
            title: 'Смешанные чувства',
            review_text: 'Красивая упаковка, хороший звук, но Bluetooth часто отваливается. За свои деньги неплохо.',
            product_model: 'Bluetooth-колонка SoundWave',
            original_rating: '4',
            sentiment: 'mixed',
            color: 'bg-white border-l-4 border-purple-500'
        },
        {
            id: '3',
            title: 'Очень положительный',
            review_text: 'Лучшая покупка в моей жизни! Работает идеально, батарея держит 2 недели, дизайн потрясающий. Рекомендую всем!',
            product_model: 'Смарт-часы Ultra',
            original_rating: '5',
            sentiment: 'very_positive',
            color: 'bg-white border-l-4 border-green-500'
        },
        {
            id: '4',
            title: 'Нейтральный с вопросом',
            review_text: 'Товар пришел вовремя, упаковка целая. Не понял, как настроить синхронизацию с телефоном. Инструкция не очень понятная.',
            product_model: 'Умные весы',
            original_rating: '3',
            sentiment: 'neutral',
            color: 'bg-white border-l-4 border-gray-400'
        },
        {
            id: '5',
            title: 'Критический обзор',
            review_text: 'УЖАСНОЕ качество! Сломалось через 2 дня использования. Гарантия не работает, служба поддержки не отвечает. Никому не советую!',
            product_model: 'Электрическая зубная щетка',
            original_rating: '1',
            sentiment: 'critical',
            color: 'bg-white border-l-4 border-rose-500'
        },
        {
            id: '6',
            title: 'Предложение по улучшению',
            review_text: 'В целом товаром доволен, но было бы здоровье, если бы добавили функцию автоматического определения продуктов. Сейчас приходится всё вводить вручную.',
            product_model: 'Умный холодильник',
            original_rating: '4',
            sentiment: 'suggestion',
            color: 'bg-white border-l-4 border-blue-500'
        },
        {
            id: '7',
            title: 'Очень негативный с претензией',
            review_text: 'Полный развод! Товар не соответствует описанию, материалы дешевые, запах неприятный. Требую возврата денег и компенсации!',
            product_model: 'Кожаный чехол для телефона',
            original_rating: '1',
            sentiment: 'very_negative',
            color: 'bg-white border-l-4 border-red-600'
        },
        {
            id: '8',
            title: 'Позитивный с небольшим замечанием',
            review_text: 'Отличный товар, работает как часы. Единственное - инструкция на английском, пришлось переводить. В остальном все супер!',
            product_model: 'Кофемашина Deluxe',
            original_rating: '5',
            sentiment: 'positive',
            color: 'bg-white border-l-4 border-emerald-500'
        },
        {
            id: '9',
            title: 'Вопрос о функционале',
            review_text: 'Здравствуйте! Подскажите, поддерживается ли подключение к iPhone 15? И можно ли использовать одновременно с Android-устройством?',
            product_model: 'Беспроводные наушники',
            original_rating: '3',
            sentiment: 'question',
            color: 'bg-white border-l-4 border-cyan-500'
        },
        {
            id: '10',
            title: 'Недовольство доставкой',
            review_text: 'Товар хороший, но доставка подвела. Задержали на 5 дней, курьер не позвонил, просто оставил у двери. Сам товар работает нормально.',
            product_model: 'Робот-пылесос',
            original_rating: '2',
            sentiment: 'negative',
            color: 'bg-white border-l-4 border-orange-500'
        }
    ];

    const handleExampleClick = (review: any) => {
        setActiveExample(review.id);
        setCurrentReview({
            review_text: review.review_text,
            product_model: review.product_model,
            original_rating: review.original_rating,
        });
    };

    const handleManualSubmit = (reviewText: string, productModel: string, rating: string) => {
        setActiveExample(null);
        setCurrentReview({
            review_text: reviewText,
            product_model: productModel,
            original_rating: rating,
        });
    };

    // Автоматически выбираем первый пример при загрузке
    useEffect(() => {
        if (testReviews.length > 0 && !activeExample) {
            handleExampleClick(testReviews[0]);
        }
    }, []);


  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-8 space-y-8 ">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-bot h-8 w-8 text-primary"
                >
                  <path d="M12 8V4H8"></path>
                  <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                  <path d="M2 14h2"></path>
                  <path d="M20 14h2"></path>
                  <path d="M15 13v2"></path>
                  <path d="M9 13v2"></path>
                </svg>
                <h1 className="text-3xl font-bold text-foreground">ИИ-ответы на отзывы OZON</h1>
              </div>
              <p className="text-muted-foreground">Автоматическая генерация персонализированных ответов</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h2 className="text-2xl font-semibold leading-none tracking-tight text-foreground">О модуле</h2>
                </div>
                <div className="p-6 pt-0 space-y-3 text-muted-foreground">
                  <p>
                    Этот модуль автоматически получает новые отзывы с OZON и генерирует на них персонализированные ответы с
                    помощью искусственного интеллекта.
                  </p>
                  <p>
                    ИИ анализирует тональность отзыва, выявляет ключевые моменты и формирует вежливый, релевантный ответ,
                    который помогает улучшить репутацию вашего магазина.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Примеры отзывов для анализа</h2>
                <p className="text-muted-foreground mb-4">
                  Нажмите на любой пример, чтобы проанализировать его с помощью ИИ
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {testReviews.map((review) => (
                    <div
                      key={review.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        activeExample === review.id ? 'ring-2 ring-primary/50 shadow-sm' : 'hover:border-muted'
                      }`}
                      onClick={() => handleExampleClick(review)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-foreground text-sm">{review.title}</h3>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            (parseInt(review.original_rating) <= 2)
                              ? 'bg-destructive/10 text-destructive'
                              : (parseInt(review.original_rating) >= 4)
                              ? 'bg-success/10 text-success'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {review.original_rating}/5
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2 italic">
                        "{review.review_text}"
                      </p>
                      <div className="text-xs text-muted-foreground">{review.product_model}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ручной ввод */}
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Ручной анализ отзыва</h2>
                <ManualReviewForm onSubmit={handleManualSubmit} />
              </div>
            </div>

            {/* Правая колонка */}
            <div className="space-y-6">
              <ReviewAnalyzer
                initialReviewText={currentReview.review_text}
                initialProductModel={currentReview.product_model}
                initialRating={currentReview.original_rating}
                autoSubmit={!!activeExample}
                compact={false}
              />

              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h3 className="font-semibold text-foreground mb-4">Как это работает</h3>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>ИИ определяет тональность отзыва (негатив, позитив, нейтрал)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Находит ключевые проблемы (батарея, доставка, качество)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Генерирует вежливый ответ по правилам Ozon</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span>Даёт рекомендации: что улучшить в товаре</span>
                  </li>
                </ul>
              </div>

              {/* Статистика */}
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h3 className="font-semibold text-foreground mb-3">Статистика анализа</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">10</div>
                    <div className="text-sm text-muted-foreground">Примеров</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">1-2с</div>
                    <div className="text-sm text-muted-foreground">Время анализа</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">7</div>
                    <div className="text-sm text-muted-foreground">Типов тональности</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">99%</div>
                    <div className="text-sm text-muted-foreground">Точность ИИ</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}

// Компонент формы — только стили
function ManualReviewForm({ onSubmit }: { onSubmit: (reviewText: string, productModel: string, rating: string) => void }) {
  const [formData, setFormData] = useState({
    review_text: '',
    product_model: '',
    original_rating: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.review_text.trim()) {
      onSubmit(formData.review_text, formData.product_model, formData.original_rating);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="review_text" className="block text-sm font-medium text-muted-foreground mb-1">
          Текст отзыва
        </label>
        <textarea
          id="review_text"
          value={formData.review_text}
          onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          rows={3}
          placeholder="Введите текст отзыва для анализа..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="product_model" className="block text-sm font-medium text-muted-foreground mb-1">
            Модель товара
          </label>
          <input
            id="product_model"
            type="text"
            value={formData.product_model}
            onChange={(e) => setFormData({ ...formData, product_model: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            placeholder="Например: Фитнес-браслет X9"
          />
        </div>

        <div>
          <label htmlFor="original_rating" className="block text-sm font-medium text-muted-foreground mb-1">
            Оценка (1–5)
          </label>
          <input
            id="original_rating"
            type="number"
            min="1"
            max="5"
            value={formData.original_rating}
            onChange={(e) => setFormData({ ...formData, original_rating: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            placeholder="3"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-emerald-600 text-white hover:bg-emerald-700    h-11"
      >
        Анализировать вручную
      </button>
    </form>
  );
}