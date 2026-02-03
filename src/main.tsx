import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./i18n"; // Initialize i18n before app
import { initTheme } from "./lib/theme";
import "./styles.css";

// Initialize theme before rendering
initTheme();

registerSW({
  immediate: true
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
