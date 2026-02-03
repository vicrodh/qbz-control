export type Theme = 'dark' | 'light' | 'oled';

const STORAGE_KEY = 'qbz-control-theme';

export function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light' || stored === 'oled') {
      return stored;
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

export function initTheme(): Theme {
  const stored = getStoredTheme();
  const theme = stored || 'dark';
  applyTheme(theme);
  return theme;
}
