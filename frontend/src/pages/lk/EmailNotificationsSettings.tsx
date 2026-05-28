import { useEffect, useState, type ReactNode } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  Save,
  Shield,
  TriangleAlert,
} from 'lucide-react';

import type { EmailPreferences } from '../../api/email';

import {
  getEmailPreferences,
  updateEmailPreferences,
} from '../../api/email';

const DIGEST_OPTIONS = [
  {
    value: 'immediate',
    label: 'Мгновенно',
    description: 'Письмо будет отправляться сразу после появления новых ответов.',
  },
  {
    value: 'hourly',
    label: 'Раз в час',
    description: 'Ответы на модерации будут собираться в часовой дайджест.',
  },
  {
    value: 'daily',
    label: 'Раз в сутки',
    description: 'Сводка будет приходить один раз в день.',
  },
] as const;

export default function EmailNotificationsSettings() {
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [initialPreferences, setInitialPreferences] = useState<EmailPreferences | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const data = await getEmailPreferences();

      setPreferences(data);
      setInitialPreferences(data);
    } catch (error) {
      console.error(error);
      setErrorMessage('Не удалось загрузить настройки email-уведомлений.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!preferences) return;

    try {
      setIsSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      const updated = await updateEmailPreferences(preferences);

      setPreferences(updated);
      setInitialPreferences(updated);
      setSuccessMessage('Настройки успешно сохранены.');
    } catch (error) {
      console.error(error);
      setErrorMessage('Не удалось сохранить настройки. Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
    }
  }

  function updateField<K extends keyof EmailPreferences>(
    field: K,
    value: EmailPreferences[K]
  ) {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      [field]: value,
    });
  }

  const hasChanges =
    JSON.stringify(preferences) !== JSON.stringify(initialPreferences);

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex min-h-[360px] items-center justify-center rounded-2xl border bg-white">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Загрузка настроек уведомлений...</span>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!preferences) {
    return (
      <PageShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {errorMessage || 'Настройки не найдены.'}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <Mail className="h-4 w-4" />
              Личный кабинет / Настройки
            </div>

            <h1 className="text-3xl font-bold text-gray-900">
              Email-уведомления
            </h1>

            <p className="mt-2 max-w-3xl text-gray-600">
              Управляйте транзакционными письмами: ошибки интеграций,
              модерация ответов, отчёты обработки и безопасность аккаунта.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={loadPreferences}
              className="inline-flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Обновить
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Сохранить
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Основные настройки
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Выберите, какие события должны отправлять письма пользователю.
                </p>
              </div>

              <Toggle
                checked={preferences.is_active}
                onChange={(value) => updateField('is_active', value)}
              />
            </div>

            {!preferences.is_active && (
              <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                Email-уведомления отключены. Остальные настройки сохранены, но
                письма отправляться не будут.
              </div>
            )}

            <div className="space-y-4">
              <SettingRow
                icon={<TriangleAlert className="h-5 w-5 text-red-500" />}
                title="Ошибки интеграций"
                description="Уведомления об ошибках подключения или авторизации Ozon API и Yandex GPT."
                checked={preferences.notify_integration_errors}
                disabled={!preferences.is_active}
                onChange={(value) =>
                  updateField('notify_integration_errors', value)
                }
              />

              <SettingRow
                icon={<Bell className="h-5 w-5 text-yellow-500" />}
                title="Очередь модерации"
                description="Письма о новых AI-ответах, которые нужно проверить перед публикацией."
                checked={preferences.notify_moderation_queue}
                disabled={!preferences.is_active}
                onChange={(value) =>
                  updateField('notify_moderation_queue', value)
                }
              />

              <SettingRow
                icon={<RefreshCw className="h-5 w-5 text-emerald-500" />}
                title="Отчёты обработки отзывов"
                description="Краткий отчёт после пакетной обработки отзывов Ozon."
                checked={preferences.notify_processing_report}
                disabled={!preferences.is_active}
                onChange={(value) =>
                  updateField('notify_processing_report', value)
                }
              />

              <SettingRow
                icon={<Shield className="h-5 w-5 text-blue-500" />}
                title="Безопасность аккаунта"
                description="Письма о смене ключей, обновлении доступов и важных действиях в аккаунте."
                checked={preferences.notify_security}
                disabled={!preferences.is_active}
                onChange={(value) => updateField('notify_security', value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Частота дайджеста
              </h2>
            </div>

            <p className="mb-5 text-sm text-gray-500">
              Настройка применяется к письмам по модерации AI-ответов.
            </p>

            <div className="space-y-3">
              {DIGEST_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`block cursor-pointer rounded-xl border p-4 transition ${
                    preferences.moderation_digest_interval === option.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  } ${
                    !preferences.is_active ||
                    !preferences.notify_moderation_queue
                      ? 'cursor-not-allowed opacity-60'
                      : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <input
                      type="radio"
                      name="moderation_digest_interval"
                      value={option.value}
                      checked={
                        preferences.moderation_digest_interval === option.value
                      }
                      disabled={
                        !preferences.is_active ||
                        !preferences.notify_moderation_queue
                      }
                      onChange={() =>
                        updateField(
                          'moderation_digest_interval',
                          option.value
                        )
                      }
                      className="mt-1"
                    />

                    <div>
                      <div className="font-medium text-gray-900">
                        {option.label}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Системная информация
              </h2>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between gap-4">
                <span>Статус:</span>
                <span
                  className={
                    preferences.is_active
                      ? 'font-medium text-emerald-600'
                      : 'font-medium text-red-500'
                  }
                >
                  {preferences.is_active ? 'Активны' : 'Отключены'}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span>Дайджест:</span>
                <span className="font-medium text-gray-900">
                  {
                    DIGEST_OPTIONS.find(
                      (item) =>
                        item.value === preferences.moderation_digest_interval
                    )?.label
                  }
                </span>
              </div>

              {preferences.updated_at && (
                <div className="flex justify-between gap-4">
                  <span>Обновлено:</span>
                  <span className="text-right font-medium text-gray-900">
                    {new Date(preferences.updated_at).toLocaleString('ru-RU')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">{children}</div>
    </div>
  );
}

function SettingRow({
  icon,
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition ${
        disabled ? 'bg-gray-50 opacity-70' : 'bg-white hover:bg-gray-50'
      }`}
    >
      <div className="flex gap-4">
        <div className="mt-1">{icon}</div>

        <div>
          <div className="font-medium text-gray-900">{title}</div>
          <div className="mt-1 text-sm text-gray-500">{description}</div>
        </div>
      </div>

      <Toggle checked={checked} disabled={disabled} onChange={onChange} />
    </div>
  );
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
        checked ? 'bg-emerald-600' : 'bg-gray-300'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}