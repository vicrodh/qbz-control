import { useNavigate } from "react-router-dom";
import { Layout } from "./Layout";

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

  return (
    <Layout isConnected={connected}>
      <div className="stack">
        <h1 className="section-title">Settings</h1>

        <div className="card stack">
          <h2 className="section-subtitle">Connection</h2>

          <div className="field">
            <label htmlFor="settings-base-url">Base URL</label>
            <input id="settings-base-url" type="text" value={baseUrl || ""} readOnly />
          </div>

          <div className="field">
            <label htmlFor="settings-token">Token</label>
            <input id="settings-token" type="text" value={token || ""} readOnly />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button className="secondary" onClick={onCopyToken} disabled={!token}>
              Copy Token
            </button>
            <button className="secondary" onClick={() => navigate("/pairing")}>Edit</button>
          </div>

          <div className={`chip ${connected ? "connected" : ""}`}>{statusText}</div>

          <button className="ghost" onClick={onClear}>Forget Connection</button>
        </div>

        <div className="card stack">
          <h2 className="section-subtitle">About</h2>
          <div>
            <div className="muted" style={{ fontSize: "12px", marginBottom: "4px" }}>
              App Version
            </div>
            <div>0.1.0</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: "12px", marginBottom: "4px" }}>
              Build Date
            </div>
            <div>2026-02-03</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
