import { useState, useEffect } from 'react';

const STORAGE_KEY = 'gi_demo_ai_suggestions';
const EVENT_NAME  = 'gi-demo-ai-suggestions-changed';

export function useAISuggestions(): boolean {
  const [enabled, setEnabled] = useState(() =>
    localStorage.getItem(STORAGE_KEY) === 'true'
  );

  useEffect(() => {
    const handler = () =>
      setEnabled(localStorage.getItem(STORAGE_KEY) === 'true');
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  return enabled;
}

export function toggleAISuggestions(): void {
  const current = localStorage.getItem(STORAGE_KEY) === 'true';
  localStorage.setItem(STORAGE_KEY, String(!current));
  window.dispatchEvent(new Event(EVENT_NAME));
}
