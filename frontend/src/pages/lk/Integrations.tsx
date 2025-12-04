import { useState } from 'react';
import api from '../../api/client';
import DashboardLayout from "../../components/DashboardLayout.tsx";

export default function Integrations() {
  const [credentials, setCredentials] = useState({
    ozon: { client_id: '', api_key: '' },
    wb: { api_key: '' },
    ym: { api_key: '' },
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const handleChange = (mp: string, field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [mp]: { ...prev[mp as keyof typeof prev], [field]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent, mp: string) => {
    e.preventDefault();
    setSaving(mp);
    setMessage('');

    try {
      await api.post('/api/accounts/credentials/', {
        marketplace: mp,
        ...(credentials[mp as keyof typeof credentials] as any)
      });
      setMessage(`${mp.toUpperCase()} успешно подключён`);
    } catch (err: any) {
      setMessage('Ошибка: ' + (err.response?.data?.detail || 'неизвестно'));
    } finally {
      setSaving(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-emerald-900 mb-6">Интеграции с маркетплейсами</h1>

        <div className="space-y-8">
          {/* Ozon */}
          <div className="bg-white/80 backdrop-blur border border-white/30 rounded-xl p-6 shadow">
            <h2 className="text-xl font-semibold text-emerald-900 mb-4">Ozon</h2>
            <form onSubmit={(e) => handleSubmit(e, 'ozon')} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Client ID</label>
                <input
                  type="text"
                  value={credentials.ozon.client_id}
                  onChange={(e) => handleChange('ozon', 'client_id', e.target.value)}
                  className="w-full px-3 py-2 bg-white/80 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={credentials.ozon.api_key}
                  onChange={(e) => handleChange('ozon', 'api_key', e.target.value)}
                  className="w-full px-3 py-2 bg-white/80 border border-gray-300 rounded"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={saving === 'ozon'}
                className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving === 'ozon' ? 'Сохранение...' : 'Подключить Ozon'}
              </button>
            </form>
          </div>

          {/* Wildberries */}
          <div className="bg-white/80 backdrop-blur border border-white/30 rounded-xl p-6 shadow">
            <h2 className="text-xl font-semibold text-emerald-900 mb-4">Wildberries</h2>
            <form onSubmit={(e) => handleSubmit(e, 'wb')} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">API Key (только для статистики)</label>
                <input
                  type="password"
                  value={credentials.wb.api_key}
                  onChange={(e) => handleChange('wb', 'api_key', e.target.value)}
                  className="w-full px-3 py-2 bg-white/80 border border-gray-300 rounded"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={saving === 'wb'}
                className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving === 'wb' ? 'Сохранение...' : 'Подключить WB'}
              </button>
            </form>
          </div>
        </div>

        {message && (
          <div className="mt-6 p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800">
            {message}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}