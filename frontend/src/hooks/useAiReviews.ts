// frontend/src/hooks/useAiReviews.ts
import { useState, useCallback } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { aiReviewsApi } from '../api/aiReviews';

export const useAiReviews = () => {
  const { showNotification } = useNotifications();
  const [loading, setLoading] = useState(false);

  const processReviews = useCallback(async (daysBack: number = 30) => {
    try {
      setLoading(true);
      const result = await aiReviewsApi.processOzonReviews({ days_back: daysBack });
      if (result.success) {
        showNotification(`Обработано ${result.processed} отзывов`, 'success');
      }
      return result;
    } catch (error) {
      console.error('Error processing reviews:', error);
      showNotification('Ошибка обработки отзывов', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const sendAnswer = useCallback(async (reviewId: number, text: string) => {
    try {
      setLoading(true);
      const result = await aiReviewsApi.sendAnswer(reviewId, text);
      showNotification('Ответ отправлен успешно', 'success');
      return result;
    } catch (error) {
      console.error('Error sending answer:', error);
      showNotification('Ошибка отправки ответа', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const loadReviews = useCallback(async (params?: any) => {
    try {
      setLoading(true);
      const data = await aiReviewsApi.getReviews(params);
      return data;
    } catch (error) {
      console.error('Error loading reviews:', error);
      showNotification('Ошибка загрузки отзывов', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  return {
    loading,
    processReviews,
    sendAnswer,
    loadReviews
  };
};