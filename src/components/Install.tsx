import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout } from "./Layout";

type InstallProps = {
  canInstall: boolean;
  isStandalone: boolean;
  onInstall: () => Promise<void>;
  isConnected: boolean;
};

export function Install({ canInstall, isStandalone, onInstall, isConnected }: InstallProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Layout isConnected={isConnected}>
      <div className="stack">
        <img className="install-logo" src="/qbz-logo.svg" alt="QBZ logo" />
        <h1 className="section-title">{t('install.title')}</h1>

        {isStandalone ? (
          <div className="card">
            <h2 className="section-subtitle">{t('install.alreadyInstalled')}</h2>
            <p className="text-secondary">
              {t('install.description')}
            </p>
          </div>
        ) : null}

        <div className="card">
          <h2 className="section-subtitle">iOS Safari</h2>
          <ol className="step-list">
            <li>{t('install.iosStep1', 'Tap Share')}</li>
            <li>{t('install.iosStep2', 'Tap Add to Home Screen')}</li>
            <li>{t('install.iosStep3', 'Open from Home Screen')}</li>
          </ol>
        </div>

        <div className="card">
          <h2 className="section-subtitle">Android Chrome</h2>
          <ol className="step-list">
            <li>{t('install.androidStep1', 'Open menu')}</li>
            <li>{t('install.androidStep2', 'Tap Install app')}</li>
          </ol>
        </div>

        {canInstall ? (
          <button className="primary" onClick={onInstall}>
            {t('install.button')}
          </button>
        ) : null}

        <button className="secondary" onClick={() => navigate("/pairing")}>
          {t('install.skip')}
        </button>

        <p className="helper-text">{t('install.subtitle')}</p>
      </div>
    </Layout>
  );
}
