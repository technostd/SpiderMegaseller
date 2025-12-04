// src/pages/AiReviewsTest.tsx
import Layout from '../components/Layout';
import ReviewAnalyzer from "../components/ReviewAnalyzer.tsx";

export default function AiReviewsTest() {
    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white/80 backdrop-blur border border-white/30 rounded-2xl p-6 shadow">
                    <h2 className="text-2xl font-bold text-emerald-900 mb-4">Демо: ИИ-генерация ответа</h2>
                    <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded">
                        <ReviewAnalyzer/>

                        <button className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700">
                            Сгенерировать ещё
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}