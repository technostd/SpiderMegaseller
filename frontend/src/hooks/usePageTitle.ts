import { useEffect } from 'react';

export function usePageSubtitle(subtitle: string) {
    usePageTitle('Паук', subtitle)
}

export function useDefaultTitle() {
    usePageTitle('Паук — Твой помощник на маркетплейсах');
}

export function usePageTitle(title: string, subtitle = '') {
  useEffect(() => {
    document.title = subtitle ? `${title} — ${subtitle}` : title;
  }, [title, subtitle]);
}