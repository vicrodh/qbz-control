import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout } from "./Layout";
import { languages, saveLanguage } from "../i18n";
import { type Theme, themes, applyTheme, getStoredTheme, saveTheme } from "../lib/theme";

type SettingsProps = {
  baseUrl: string;
  token: string;
  connected: boolean;
  statusText: string;
  onCopyToken: () => Promise<void>;
  onClear: () => void;
};

export function Settings({ baseUrl, token, connected, statusText, onCopyToken, onClear }: SettingsProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => getStoredTheme() || 'dark');

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    saveLanguage(langCode);
  };

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
    saveTheme(theme);
  };

  return (
    <Layout isConnected={connected}>
      <div className="stack">
        <h1 className="section-title">{t('settings.title')}</h1>

        <div className="card stack">
          <h2 className="section-subtitle">{t('settings.connection')}</h2>

          <div className="field">
            <label htmlFor="settings-base-url">{t('pairing.baseUrl')}</label>
            <input id="settings-base-url" type="text" value={baseUrl || ""} readOnly />
          </div>

          <div className="field">
            <label htmlFor="settings-token">{t('pairing.token')}</label>
            <input id="settings-token" type="text" value={token || ""} readOnly />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button className="secondary" onClick={onCopyToken} disabled={!token}>
              {t('actions.copy')} Token
            </button>
            <button className="secondary" onClick={() => navigate("/pairing")}>{t('pairing.connect')}</button>
          </div>

          <div className={`chip ${connected ? "connected" : ""}`}>{statusText}</div>

          <button className="ghost" onClick={onClear}>{t('settings.disconnect')}</button>
        </div>

        <div className="card stack">
          <h2 className="section-subtitle">{t('settings.appearance')}</h2>

          <div className="field">
            <label htmlFor="theme-select">{t('settings.theme')}</label>
            <select
              id="theme-select"
              value={currentTheme}
              onChange={(e) => handleThemeChange(e.target.value as Theme)}
            >
              {themes.map((theme) => (
                <option key={theme.value} value={theme.value}>
                  {t(theme.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="language-select">{t('settings.language')}</label>
            <select
              id="language-select"
              value={i18n.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card stack">
          <h2 className="section-subtitle">{t('settings.about')}</h2>
          <div>
            <div className="muted" style={{ fontSize: "12px", marginBottom: "4px" }}>
              {t('settings.version')}
            </div>
            <div>0.1.0</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
