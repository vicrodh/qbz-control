import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconControls, IconQueue, IconSearch, IconSettings } from "./Icons";

type LayoutProps = {
  children: ReactNode;
  isConnected: boolean;
};

export function Layout({ children, isConnected }: LayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <img className="brand-logo" src="/qbz-logo.svg" alt="QBZ logo" />
          <div className="top-title">{t('app.name')}</div>
        </div>
        <div className="top-actions">
          <div className={`connection-dot ${isConnected ? "connected" : ""}`} />
          <Link to="/settings" aria-label={t('settings.title')}>
            <IconSettings size={18} />
          </Link>
        </div>
      </header>

      <main className="content">{children}</main>

      <nav className="tab-bar">
        <NavLink
          to="/controls"
          className={({ isActive }) => `tab-button ${isActive ? "active" : ""}`}
        >
          <IconControls className="tab-icon" />
          <span>{t('tabs.controls')}</span>
        </NavLink>
        <NavLink
          to="/queue"
          className={({ isActive }) => `tab-button ${isActive ? "active" : ""}`}
        >
          <IconQueue className="tab-icon" />
          <span>{t('tabs.queue')}</span>
        </NavLink>
        <NavLink
          to="/search"
          className={({ isActive }) => `tab-button ${isActive ? "active" : ""}`}
        >
          <IconSearch className="tab-icon" />
          <span>{t('tabs.search')}</span>
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `tab-button ${isActive ? "active" : ""}`}
        >
          <IconSettings className="tab-icon" />
          <span>{t('tabs.settings')}</span>
        </NavLink>
      </nav>
    </div>
  );
}
