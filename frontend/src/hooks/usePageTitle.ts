import { useEffect } from 'react';

export function usePageTitle(title: string, subtitle = '') {
  useEffect(() => {
    document.title = subtitle ? `${title} — ${subtitle}` : title;
  }, [title, subtitle]);
}