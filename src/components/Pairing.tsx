import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
          setScanError("Invalid QR payload.");
          return;
        }

        setLocalUrl(parsed.baseUrl);
        setLocalToken(parsed.token);
        const ok = await onQrConfig(parsed.baseUrl, parsed.token);
        if (ok) {
          setScanActive(false);
          navigate("/controls");
        } else {
          setScanError("Pairing failed. Check the desktop app.");
        }
      },
      {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        maxScansPerSecond: 4
      }
    );

    scanner.start().catch((err) => {
      setScanError(`Camera error: ${String(err)}`);
      setScanActive(false);
    });

    return () => {
      scanner.stop();
      scanner.destroy();
    };
  }, [scanActive, onQrConfig, navigate]);

  return (
    <Layout isConnected={isConnected}>
      <div className="stack">
        <h1 className="section-title">Pair with QBZ</h1>

        <div className="field">
          <label htmlFor="baseUrl">Base URL</label>
          <input
            id="baseUrl"
            type="url"
            placeholder="http://192.168.1.10:8182"
            value={localUrl}
            onChange={(event) => setLocalUrl(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="token">Token</label>
          <input
            id="token"
            type="text"
            placeholder="Paste token"
            value={localToken}
            onChange={(event) => setLocalToken(event.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button className="primary" onClick={handleTest} disabled={isTesting}>
            {isTesting ? "Testing..." : "Test Connection"}
          </button>
          <button className="secondary" onClick={handleSave}>Save</button>
        </div>

        <div className={`chip ${connected ? "connected" : ""}`}>{statusText}</div>

        <div className="card">
          <div className="section-subtitle">Scan QR</div>
          <p className="text-secondary">
            Use the QR from QBZ Settings to auto-fill the URL and token.
          </p>

          <div className="qr-preview">
            <video ref={videoRef} muted playsInline />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {scanActive ? (
              <button className="secondary" onClick={() => setScanActive(false)}>
                Stop Scan
              </button>
            ) : (
              <button className="primary" onClick={() => setScanActive(true)}>
                Start Scan
              </button>
            )}
          </div>

          {scanError ? <div className="helper-text">{scanError}</div> : null}
        </div>
      </div>
    </Layout>
  );
}
