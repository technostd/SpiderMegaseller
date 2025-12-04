// src/pages/Instructions.tsx
import Layout from "../components/Layout.tsx";

export default function Instructions() {
    return (
        <Layout>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Как использовать платформу</h1>

                <div className="space-y-8">
                    <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Подключение API-ключей</h2>
                        <ol className="list-decimal list-inside space-y-2 text-gray-600">
                            <li>Перейдите в раздел «Настройки» → «Интеграции»</li>
                            <li>Выберите маркетплейс (Ozon, Wildberries, Яндекс.Маркет)</li>
                            <li>Вставьте Client ID и API Key из личного кабинета маркетплейса</li>
                            <li>Нажмите «Сохранить» — ключи будут зашифрованы и безопасны</li>
                        </ol>
                    </section>

                    <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Генерация ответов на отзывы</h2>
                        <ol className="list-decimal list-inside space-y-2 text-gray-600">
                            <li>Перейдите в модуль «ИИ-ответы»</li>
                            <li>Нажмите «Загрузить отзывы» — система подтянет последние отзывы из Ozon</li>
                            <li>Для каждого отзыва нажмите «Сгенерировать ответ» — ИИ предложит вариант</li>
                            <li>Отредактируйте ответ при необходимости и отправьте</li>
                        </ol>
                    </section>

                    <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Безопасность</h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            <li>API-ключи хранятся в зашифрованном виде — даже администратор не может их увидеть</li>
                            <li>Все запросы к маркетплейсам идут через наш сервер — ваш IP и ключи не разглашаются</li>
                            <li>Авторизация через JWT в httpOnly cookies — защита от XSS и CSRF</li>
                        </ul>
                    </section>
                </div>

                <div className="mt-8 p-4 bg-emerald-50 rounded">
                    <p className="text-emerald-800">
                        Внимание: ИИ генерирует ответы, но всегда проверяйте их перед отправкой — соблюдайте правила
                        маркетплейсов.
                    </p>
                </div>
            </main>

        </Layout>
    );
}