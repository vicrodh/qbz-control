import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import QrScanner from "qr-scanner";
import { Layout } from "./Layout";
import { parseQrPayload } from "../lib/qr";

QrScanner.WORKER_PATH = new URL(
  "qr-scanner/qr-scanner-worker.min.js",
  import.meta.url
).toString();

type PairingProps = {
  baseUrl: string;
  token: string;
  connected: boolean;
  statusText: string;
  onSave: (baseUrl: string, token: string) => void;
  onTest: (baseUrl: string, token: string) => Promise<boolean>;
  onQrConfig: (baseUrl: string, token: string) => Promise<boolean>;
  isConnected: boolean;
};

export function Pairing({
  baseUrl,
  token,
  connected,
  statusText,
  onSave,
  onTest,
  onQrConfig,
  isConnected
}: PairingProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [localUrl, setLocalUrl] = useState(baseUrl);
  const [localToken, setLocalToken] = useState(token);
  const [isTesting, setIsTesting] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setLocalUrl(baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    setLocalToken(token);
  }, [token]);

  const handleTest = async () => {
    setIsTesting(true);
    const ok = await onTest(localUrl.trim(), localToken.trim());
    if (ok) {
      onSave(localUrl.trim(), localToken.trim());
    }
    setIsTesting(false);
  };

  const handleSave = () => {
    onSave(localUrl.trim(), localToken.trim());
  };

  useEffect(() => {
    if (!scanActive || !videoRef.current) return;
    setScanError(null);

    const scanner = new QrScanner(
      videoRef.current,
      async (result) => {
        const payload = typeof result === "string" ? result : result.data;
        const parsed = parseQrPayload(payload);
        if (!parsed) {
          setScanError(t('errors.invalidToken'));
          return;
        }

        setLocalUrl(parsed.baseUrl);
        setLocalToken(parsed.token);
        const ok = await onQrConfig(parsed.baseUrl, parsed.token);
        if (ok) {
          setScanActive(false);
          navigate("/controls");
        } else {
          setScanError(t('pairing.connectionFailed'));
        }
      },
      {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        maxScansPerSecond: 4
      }
    );

    scanner.start().catch((err) => {
      setScanError(`${t('errors.networkError')}: ${String(err)}`);
      setScanActive(false);
    });

    return () => {
      scanner.stop();
      scanner.destroy();
    };
  }, [scanActive, onQrConfig, navigate, t]);

  return (
    <Layout isConnected={isConnected}>
      <div className="stack">
        <h1 className="section-title">{t('pairing.title')}</h1>

        <div className="field">
          <label htmlFor="baseUrl">{t('pairing.baseUrl')}</label>
          <input
            id="baseUrl"
            type="url"
            placeholder={t('pairing.baseUrlPlaceholder')}
            value={localUrl}
            onChange={(event) => setLocalUrl(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="token">{t('pairing.token')}</label>
          <input
            id="token"
            type="text"
            placeholder={t('pairing.tokenPlaceholder')}
            value={localToken}
            onChange={(event) => setLocalToken(event.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button className="primary" onClick={handleTest} disabled={isTesting}>
            {isTesting ? t('pairing.testing') : t('pairing.testConnection')}
          </button>
          <button className="secondary" onClick={handleSave}>{t('actions.save')}</button>
        </div>

        <div className={`chip ${connected ? "connected" : ""}`}>{statusText}</div>

        <div className="card">
          <div className="section-subtitle">{t('pairing.scanQr')}</div>
          <p className="text-secondary">
            {t('pairing.scanQrDesc')}
          </p>

          <div className="qr-preview">
            <video ref={videoRef} muted playsInline />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {scanActive ? (
              <button className="secondary" onClick={() => setScanActive(false)}>
                {t('actions.cancel')}
              </button>
            ) : (
              <button className="primary" onClick={() => setScanActive(true)}>
                {t('pairing.scanQr')}
              </button>
            )}
          </div>

          {scanError ? <div className="helper-text">{scanError}</div> : null}
        </div>
      </div>
    </Layout>
  );
}
