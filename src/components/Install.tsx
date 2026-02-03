import { useNavigate } from "react-router-dom";
import { Layout } from "./Layout";

type InstallProps = {
  canInstall: boolean;
  isStandalone: boolean;
  onInstall: () => Promise<void>;
  isConnected: boolean;
};

export function Install({ canInstall, isStandalone, onInstall, isConnected }: InstallProps) {
  const navigate = useNavigate();

  return (
    <Layout isConnected={isConnected}>
      <div className="stack">
        <img className="install-logo" src="/qbz-logo.svg" alt="QBZ logo" />
        <h1 className="section-title">Install QBZ Control</h1>

        {isStandalone ? (
          <div className="card">
            <h2 className="section-subtitle">Already installed</h2>
            <p className="text-secondary">
              This device already runs the installed app. You can continue to pairing.
            </p>
          </div>
        ) : null}

        <div className="card">
          <h2 className="section-subtitle">iOS Safari</h2>
          <ol className="step-list">
            <li>Tap Share</li>
            <li>Tap Add to Home Screen</li>
            <li>Open from Home Screen</li>
          </ol>
        </div>

        <div className="card">
          <h2 className="section-subtitle">Android Chrome</h2>
          <ol className="step-list">
            <li>Open menu</li>
            <li>Tap Install app</li>
          </ol>
        </div>

        {canInstall ? (
          <button className="primary" onClick={onInstall}>
            Install App
          </button>
        ) : null}

        <button className="secondary" onClick={() => navigate("/pairing")}>Go to Pairing</button>

        <p className="helper-text">PWA runs locally on your network.</p>
      </div>
    </Layout>
  );
}
