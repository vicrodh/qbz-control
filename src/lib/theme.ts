export type Theme =
  | 'dark'
  | 'light'
  | 'oled'
  | 'warm'
  | 'nord'
  | 'dracula'
  | 'tokyo-night'
  | 'catppuccin-mocha'
  | 'rumi'
  | 'mira'
  | 'zoey';

const STORAGE_KEY = 'qbz-control-theme';

export const themes: { value: Theme; labelKey: string }[] = [
  { value: 'dark', labelKey: 'settings.themeDark' },
  { value: 'light', labelKey: 'settings.themeLight' },
  { value: 'oled', labelKey: 'settings.themeOled' },
  { value: 'warm', labelKey: 'settings.themeWarm' },
  { value: 'nord', labelKey: 'settings.themeNord' },
  { value: 'dracula', labelKey: 'settings.themeDracula' },
  { value: 'tokyo-night', labelKey: 'settings.themeTokyoNight' },
  { value: 'catppuccin-mocha', labelKey: 'settings.themeCatppuccin' },
  { value: 'rumi', labelKey: 'settings.themeRumi' },
  { value: 'mira', labelKey: 'settings.themeMira' },
  { value: 'zoey', labelKey: 'settings.themeZoey' },
];

export function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && themes.some(t => t.value === stored)) {
      return stored as Theme;
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
