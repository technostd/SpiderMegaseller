import Layout from "../components/Layout.tsx";
import {usePageSubtitle} from "../hooks/usePageTitle.ts";

export default function Instructions() {
  usePageSubtitle('Инструкция');

  return (
    <Layout>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Как использовать модуль ИИ-ответов для OZON</h1>

        <div className="space-y-8">
          {/* Шаг 1: Подключение OZON */}
          <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Подключение к OZON Seller API</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Перейдите в раздел <strong>«Личный кабинет» → «Интеграции»</strong></li>
              <li>Выберите <strong>OZON</strong> и нажмите «Подключить»</li>
              <li>Вставьте <strong>Client ID</strong> и <strong>API Key</strong> из личного кабинета продавца OZON Seller</li>
              <li>Нажмите «Сохранить» — ключи будут зашифрованы и безопасны</li>
            </ol>
            <p className="mt-4 text-sm text-gray-500">
              🔗 <a href="https://docs.ozon.ru/api/seller/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                Инструкция по получению ключей в документации OZON
              </a>
            </p>
          </section>

          {/* Шаг 2: Настройка модуля */}
          <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Настройка ИИ-модуля</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Перейдите в <strong>«Модули» → «ИИ-ответы» → «Настройки»</strong></li>
              <li>Выберите режим: <em>Премодерация</em> (ручное утверждение) или <em>Автопубликация</em> (для позитивных отзывов)</li>
              <li>Настройте тон ответов: нейтральный, благодарный, извиняющийся или дружелюбный</li>
              <li>Укажите максимальную длину ответа (по умолчанию — 1000 символов)</li>
            </ol>
          </section>

          {/* Шаг 3: Работа с отзывами */}
          <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Анализ и ответы на отзывы</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>В разделе <strong>«Модерация»</strong> нажмите «Загрузить отзывы» — система подтянет неотвеченные отзывы из OZON</li>
              <li>Для каждого отзыва ИИ предложит:
                <ul className="list-disc list-inside ml-4 mt-1 text-gray-600">
                  <li>Тональность и ключевые проблемы</li>
                  <li>Готовый черновик ответа</li>
                  <li>Рекомендации по улучшению товара</li>
                </ul>
              </li>
              <li>Отредактируйте ответ при необходимости и нажмите «Отправить» — он будет опубликован в OZON</li>
              <li>Или включите автообработку, чтобы система сама отправляла ответы на позитивные отзывы</li>
            </ol>
          </section>

          {/* Шаг 4: Аналитика */}
          <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Аналитика и инсайты</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Перейдите во вкладку <strong>«Аналитика»</strong> для просмотра сводок по отзывам</li>
              <li>Система покажет:
                <ul className="list-disc list-inside ml-4 mt-1 text-gray-600">
                  <li>Динамику рейтинга и частые проблемы</li>
                  <li>Приоритетные задачи для улучшения карточек</li>
                  <li>AI-рекомендации с оценкой сложности и эффекта</li>
                </ul>
              </li>
            </ul>
          </section>

          {/* Безопасность */}
          <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🔐 Безопасность данных</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>API-ключи OZON хранятся в зашифрованном виде — недоступны даже администраторам</li>
              <li>Все запросы к OZON API идут через наш сервер — ваши ключи не передаются на фронтенд</li>
              <li>Авторизация через JWT в httpOnly cookies — защита от XSS и CSRF-атак</li>
              <li>Данные отзывов и ответов хранятся только в рамках вашего аккаунта</li>
            </ul>
          </section>
        </div>

        {/* Важное предупреждение */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded">
          <p className="text-amber-800 font-medium">
            ⚠️ Важно: ИИ генерирует черновики ответов, но всегда проверяйте их перед отправкой.
            Соблюдайте <a href="https://docs.ozon.ru/api/seller/#section/Pravila-raboty-s-otzyvami" target="_blank" rel="noopener noreferrer" className="underline">
              правила работы с отзывами OZON
            </a>: не просите изменить оценку, не указывайте контакты и не обещайте компенсации.
          </p>
        </div>
      </main>
    </Layout>
  );
}