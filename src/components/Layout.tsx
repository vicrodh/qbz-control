import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { IconControls, IconSearch, IconSettings } from "./Icons";

type LayoutProps = {
  children: ReactNode;
  isConnected: boolean;
};

export function Layout({ children, isConnected }: LayoutProps) {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <img className="brand-logo" src="/qbz-logo.svg" alt="QBZ logo" />
          <div className="top-title">QBZ Control</div>
        </div>
        <div className="top-actions">
          <div className={`connection-dot ${isConnected ? "connected" : ""}`} />
          <Link to="/settings" aria-label="Open settings">
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
          <span>Controls</span>
        </NavLink>
        <NavLink
          to="/search"
          className={({ isActive }) => `tab-button ${isActive ? "active" : ""}`}
        >
          <IconSearch className="tab-icon" />
          <span>Search</span>
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `tab-button ${isActive ? "active" : ""}`}
        >
          <IconSettings className="tab-icon" />
          <span>Settings</span>
        </NavLink>
      </nav>
    </div>
  );
}
