import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface EmailPreferences {
  is_active: boolean;
  notify_integration_errors: boolean;
  notify_moderation_queue: boolean;
  moderation_digest_interval: 'immediate' | 'hourly' | 'daily';
  notify_processing_report: boolean;
  notify_security: boolean;
  updated_at?: string;
}

function getCookie(name: string): string | null {
  const cookies = document.cookie ? document.cookie.split('; ') : [];

  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.split('=');

    if (key === name) {
      return decodeURIComponent(valueParts.join('='));
    }
  }

  return null;
}

export async function getEmailPreferences(): Promise<EmailPreferences> {
  const response = await axios.get<EmailPreferences>(
    `${API_BASE_URL}/api/accounts/email-preferences/`,
    {
      withCredentials: true,
    }
  );

  return response.data;
}

export async function updateEmailPreferences(
  payload: Partial<EmailPreferences>
): Promise<EmailPreferences> {
  const csrfToken = getCookie('csrftoken');

  const response = await axios.patch<EmailPreferences>(
    `${API_BASE_URL}/api/accounts/email-preferences/`,
    payload,
    {
      withCredentials: true,
      headers: csrfToken
        ? {
            'X-CSRFToken': csrfToken,
          }
        : undefined,
    }
  );

  return response.data;
}