import React, { useState, useEffect } from 'react';
import api from '../api/client';

interface ReviewAnalyzerProps {
    initialReviewText?: string;
    initialProductModel?: string;
    initialRating?: string;
    autoSubmit?: boolean;
    compact?: boolean;
    onAnalyze?: (data: any) => void;
}

export default function ReviewAnalyzer({
    initialReviewText = '',
    initialProductModel = '',
    initialRating = '',
    autoSubmit = false,
    compact = false,
    onAnalyze
}: ReviewAnalyzerProps) {
    const [form, setForm] = useState({
        review_text: initialReviewText,
        product_model: initialProductModel,
        original_rating: initialRating,
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Обновляем форму при изменении пропсов
    useEffect(() => {
        setForm({
            review_text: initialReviewText,
            product_model: initialProductModel,
            original_rating: initialRating,
        });
        // Сбрасываем результат при смене отзыва
        setResult(null);
        setError(null);
    }, [initialReviewText, initialProductModel, initialRating]);

    const sentimentConfig = {
        very_negative: { label: 'Очень негатив', bg: 'bg-red-100', text: 'text-red-800' },
        negative: { label: 'Негатив', bg: 'bg-orange-100', text: 'text-orange-800' },
        neutral: { label: 'Нейтрально', bg: 'bg-gray-100', text: 'text-gray-800' },
        positive: { label: 'Позитив', bg: 'bg-emerald-100', text: 'text-emerald-800' },
        very_positive: { label: 'Очень позитив', bg: 'bg-green-100', text: 'text-green-800' },
        mixed: { label: 'Смешанная', bg: 'bg-purple-100', text: 'text-purple-800' },
        critical: { label: 'Критическая', bg: 'bg-rose-100', text: 'text-rose-800' },
        suggestion: { label: 'Предложение', bg: 'bg-blue-100', text: 'text-blue-800' },
        question: { label: 'Вопрос', bg: 'bg-cyan-100', text: 'text-cyan-800' },
        default: { label: 'Не определена', bg: 'bg-gray-100', text: 'text-gray-500' }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!form.review_text.trim()) {
            setError('Введите текст отзыва');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/ai-reviews/analyze/', {
                review_text: form.review_text,
                product_model: form.product_model,
                original_rating: form.original_rating || '3',
            });

            if (response.data.success) {
                setResult(response.data);
                if (onAnalyze) onAnalyze(response.data);
            } else {
                setError(response.data.error || 'Не удалось проанализировать отзыв');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    const getAnalysisData = () => {
        if (!result || !result.data) return null;

        try {
            const analysisJson = result.data.analysis_data_json
                ? JSON.parse(result.data.analysis_data_json)
                : {};

            const issues = analysisJson.analysis?.identified_issues || [];
            const issuesList = issues.map((issue: any) => issue.issue_description);

            const recommendationMap: Record<string, string> = {
                'monitor': 'Следить за ситуацией',
                'investigate': 'Изучить проблему',
                'improve': 'Улучшить качество',
                'respond': 'Ответить клиенту',
                'replace': 'Заменить товар',
                'refund': 'Вернуть деньги',
                'contact': 'Связаться с клиентом',
                'update': 'Обновить информацию',
                'fix': 'Исправить ошибку',
                'apologize': 'Принести извинения'
            };

            const suggestions = [];
            if (analysisJson.analysis?.summary?.recommended_action) {
                const action = analysisJson.analysis.summary.recommended_action.toLowerCase();
                const russianAction = recommendationMap[action] || action;
                suggestions.push(`Рекомендуемое действие: ${russianAction}`);
            }
            if (analysisJson.analysis?.summary?.main_problem && analysisJson.analysis.summary.main_problem.trim()) {
                suggestions.push(`Основная проблема: ${analysisJson.analysis.summary.main_problem}`);
            }
            if (analysisJson.analysis?.summary?.priority_level) {
                const priorityMap: Record<string, string> = {
                    'low': 'Низкий',
                    'medium': 'Средний',
                    'high': 'Высокий',
                    'critical': 'Критический'
                };
                const priority = priorityMap[analysisJson.analysis.summary.priority_level] ||
                               analysisJson.analysis.summary.priority_level;
                suggestions.push(`Приоритет: ${priority}`);
            }

            return {
                generated_response: result.data.generated_response || 'Нет ответа',
                sentiment: result.data.sentiment || 'neutral',
                issues: issuesList,
                issues_count: issuesList.length,
                suggestions: suggestions.length > 0 ? suggestions : ['Рекомендации не найдены'],
                raw_analysis: analysisJson
            };
        } catch (error) {
            console.error("Ошибка при разборе данных анализа:", error);
            return {
                generated_response: result.data.generated_response || 'Нет ответа',
                sentiment: result.data.sentiment || 'neutral',
                issues: [],
                issues_count: 0,
                suggestions: ['Не удалось обработать данные анализа'],
                raw_analysis: {}
            };
        }
    };

    const analysisData = result ? getAnalysisData() : null;
    const sentiment = analysisData?.sentiment || 'default';
    const config = sentimentConfig[sentiment as keyof typeof sentimentConfig] || sentimentConfig.default;

    // Автоматически отправляем запрос при загрузке, если autoSubmit включен
    useEffect(() => {
        if (autoSubmit && form.review_text.trim() && !result && !loading) {
            handleSubmit();
        }
    }, [autoSubmit, form.review_text]);

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            {compact ? (
                // Компактный вид для карточек
                <div>
                    <div className="mb-3">
                        <div className="text-sm font-medium text-gray-500 mb-1">Отзыв:</div>
                        <div className="text-gray-700 italic line-clamp-2">"{form.review_text}"</div>
                    </div>

                    {!result && !loading && (
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !form.review_text.trim()}
                            className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        >
                            {loading ? 'Анализируем...' : 'Быстрый анализ'}
                        </button>
                    )}

                    {loading && (
                        <div className="text-center py-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
                        </div>
                    )}

                    {analysisData && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <div className={`px-2 py-1 rounded text-xs ${config.bg} ${config.text}`}>
                                    {config.label}
                                </div>
                                {analysisData.issues_count > 0 && (
                                    <div className="text-xs text-amber-600">
                                        {analysisData.issues_count} проблем
                                    </div>
                                )}
                            </div>
                            <div className="text-xs text-gray-600 line-clamp-2">
                                {analysisData.generated_response}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // Полный вид
                <>
                    <div className="mb-6">
                        <div className="text-sm font-medium text-gray-500 mb-1">Текст отзыва:</div>
                        <div className="bg-gray-50 border border-gray-200 rounded p-3 text-gray-700 italic">
                            "{form.review_text}"
                        </div>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            {form.product_model && <span>Модель: {form.product_model}</span>}
                            {form.original_rating && <span>Оценка: {form.original_rating}/5</span>}
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {!result && !loading && (
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !form.review_text.trim()}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg disabled:opacity-50 transition font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                            strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Анализируем...
                                </>
                            ) : 'Проанализировать отзыв'}
                        </button>
                    )}

                    {loading && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                            <p className="text-emerald-700 mt-4">ИИ анализирует отзыв...</p>
                        </div>
                    )}

                    {analysisData && !loading && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Результат анализа</h4>

                            <div className="space-y-6">
                                <div>
                                    <div className="text-sm font-medium text-gray-500 mb-2">Сгенерированный ответ</div>
                                    <div className="bg-emerald-50 border border-emerald-200 rounded p-4 text-gray-800">
                                        {analysisData.generated_response}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm font-medium text-gray-500 mb-2">Тональность</div>
                                        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
                                            {config.label}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-500 mb-2">Проблемы найдены</div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {analysisData.issues_count}
                                        </div>
                                    </div>
                                </div>

                                {analysisData.issues_count > 0 && (
                                    <div>
                                        <div className="text-sm font-medium text-gray-500 mb-2">Ключевые проблемы</div>
                                        <ul className="space-y-1.5">
                                            {analysisData.issues.map((issue: string, i: number) => (
                                                <li key={i} className="flex items-start">
                                                    <span className="text-red-500 mr-2 mt-0.5">•</span>
                                                    <span className="text-gray-700">{issue}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div>
                                    <div className="text-sm font-medium text-gray-500 mb-2">Рекомендации ИИ</div>
                                    <ul className="space-y-1.5">
                                        {analysisData.suggestions.map((s: string, i: number) => (
                                            <li key={i} className="flex items-start">
                                                <span className="text-emerald-500 mr-2 mt-0.5">•</span>
                                                <span className="text-gray-700">{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}