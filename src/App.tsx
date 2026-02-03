import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Install } from "./components/Install";
import { Pairing } from "./components/Pairing";
import { Controls } from "./components/Controls";
import { Queue } from "./components/Queue";
import { Search } from "./components/Search";
import { Settings } from "./components/Settings";
import { apiFetch, apiJson, buildWsUrl } from "./lib/api";
import { clearConfig, loadConfig, saveConfig } from "./lib/storage";
import type {
  ApiConfig,
  NowPlayingResponse,
  PingResponse,
  PlaybackState,
  QueueStateResponse,
  QueueTrack,
  SearchResultsPage,
  SearchTrack
} from "./lib/types";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function App() {
  const [config, setConfig] = useState<ApiConfig>(() => loadConfig());
  const [connected, setConnected] = useState(false);
  const [statusText, setStatusText] = useState("Not connected");
  const [deviceName, setDeviceName] = useState("QBZ");
  const [deviceVersion, setDeviceVersion] = useState("-");
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [track, setTrack] = useState<QueueTrack | null>(null);
  const [queueState, setQueueState] = useState<QueueStateResponse | null>(null);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  const refreshTimer = useRef<number | null>(null);

  const statusLine = useMemo(() => {
    if (!connected) {
      return statusText;
    }
    return `Connected to ${deviceName} (v${deviceVersion})`;
  }, [connected, deviceName, deviceVersion, statusText]);

  const statusFooter = useMemo(() => {
    if (!connected) {
      return "Not connected";
    }
    return config.baseUrl ? `Connected to QBZ on ${config.baseUrl}` : "Connected";
  }, [connected, config.baseUrl]);

  const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, "");

  const handleSaveConfig = (baseUrl: string, token: string) => {
    const next = { baseUrl: normalizeBaseUrl(baseUrl), token };
    setConfig(next);
    saveConfig(next);
  };

  const handleClearConfig = () => {
    clearConfig();
    setConfig({ baseUrl: "", token: "" });
    setConnected(false);
    setStatusText("Not connected");
    setPlayback(null);
    setTrack(null);
  };

  const testConnection = useCallback(
    async (overrideConfig?: ApiConfig) => {
      const cfg = overrideConfig
        ? { baseUrl: normalizeBaseUrl(overrideConfig.baseUrl), token: overrideConfig.token }
        : config;
      if (!cfg.baseUrl || !cfg.token) {
        setConnected(false);
        setStatusText("Missing base URL or token");
        return false;
      }
      try {
        const data = await apiJson<PingResponse>(cfg, "/api/ping");
        if (data.ok) {
          setConnected(true);
          setDeviceName(data.name || "QBZ");
          setDeviceVersion(data.version || "-");
          setStatusText("Connected");
          return true;
        }
        setConnected(false);
        setStatusText("Remote control not available");
        return false;
      } catch (err) {
        setConnected(false);
        setStatusText(`Connection failed: ${(err as Error).message}`);
        return false;
      }
    },
    [config]
  );

  const refreshNowPlaying = useCallback(async () => {
    if (!connected || !config.baseUrl || !config.token) {
      return;
    }
    try {
      const data = await apiJson<NowPlayingResponse>(config, "/api/now-playing");
      setPlayback(data.playback);
      setTrack(data.track);
    } catch (err) {
      setConnected(false);
      setStatusText(`Disconnected: ${(err as Error).message}`);
      setPlayback(null);
      setTrack(null);
    }
  }, [connected, config]);

  const refreshQueue = useCallback(async () => {
    if (!connected || !config.baseUrl || !config.token) {
      return;
    }
    try {
      const data = await apiJson<QueueStateResponse>(config, "/api/queue");
      setQueueState(data);
    } catch (err) {
      console.error("Failed to fetch queue:", err);
    }
  }, [connected, config]);

  const startPolling = useCallback(() => {
    if (refreshTimer.current) {
      window.clearInterval(refreshTimer.current);
    }
    refreshTimer.current = window.setInterval(() => {
      refreshNowPlaying();
    }, 1500);
  }, [refreshNowPlaying]);

  useEffect(() => {
    if (!config.baseUrl || !config.token) {
      return;
    }
    testConnection(config).then((ok) => {
      if (ok) {
        refreshNowPlaying();
        refreshQueue();
      }
    });
  }, [config.baseUrl, config.token, testConnection, refreshNowPlaying, refreshQueue]);

  useEffect(() => {
    if (!connected) {
      if (refreshTimer.current) {
        window.clearInterval(refreshTimer.current);
        refreshTimer.current = null;
      }
      return;
    }
    startPolling();
    return () => {
      if (refreshTimer.current) {
        window.clearInterval(refreshTimer.current);
        refreshTimer.current = null;
      }
    };
  }, [connected, startPolling]);

  useEffect(() => {
    if (!connected || !config.baseUrl || !config.token) {
      return;
    }
    const ws = new WebSocket(buildWsUrl(config));
    ws.onmessage = () => {
      refreshNowPlaying();
      refreshQueue();
    };
    ws.onclose = () => {
      // Keep polling running as fallback.
    };
    return () => {
      ws.close();
    };
  }, [connected, config.baseUrl, config.token, refreshNowPlaying, refreshQueue]);

  const handlePlay = useCallback(async () => {
    if (!connected) return;
    try {
      await apiFetch(config, "/api/playback/play", { method: "POST" });
      await refreshNowPlaying();
    } catch (err) {
      setStatusText(`Playback error: ${(err as Error).message}`);
    }
  }, [connected, config, refreshNowPlaying]);

  const handlePause = useCallback(async () => {
    if (!connected) return;
    try {
      await apiFetch(config, "/api/playback/pause", { method: "POST" });
      await refreshNowPlaying();
    } catch (err) {
      setStatusText(`Playback error: ${(err as Error).message}`);
    }
  }, [connected, config, refreshNowPlaying]);

  const handleNext = useCallback(async () => {
    if (!connected) return;
    try {
      await apiFetch(config, "/api/playback/next", { method: "POST" });
      await refreshNowPlaying();
    } catch (err) {
      setStatusText(`Playback error: ${(err as Error).message}`);
    }
  }, [connected, config, refreshNowPlaying]);

  const handlePrevious = useCallback(async () => {
    if (!connected) return;
    try {
      await apiFetch(config, "/api/playback/previous", { method: "POST" });
      await refreshNowPlaying();
    } catch (err) {
      setStatusText(`Playback error: ${(err as Error).message}`);
    }
  }, [connected, config, refreshNowPlaying]);

  const handleSeek = useCallback(
    async (position: number) => {
      if (!connected) return;
      try {
        await apiFetch(config, "/api/playback/seek", {
          method: "POST",
          body: JSON.stringify({ position })
        });
        await refreshNowPlaying();
      } catch (err) {
        setStatusText(`Seek error: ${(err as Error).message}`);
      }
    },
    [connected, config, refreshNowPlaying]
  );

  const handleVolume = useCallback(
    async (volume: number) => {
      if (!connected) return;
      try {
        await apiFetch(config, "/api/playback/volume", {
          method: "POST",
          body: JSON.stringify({ volume })
        });
      } catch (err) {
        setStatusText(`Volume error: ${(err as Error).message}`);
      }
    },
    [connected, config]
  );

  const handleSearch = useCallback(
    async (query: string): Promise<SearchResultsPage<SearchTrack> | null> => {
      if (!connected) return null;
      try {
        return await apiJson<SearchResultsPage<SearchTrack>>(
          config,
          `/api/search?q=${encodeURIComponent(query)}&limit=20&offset=0`
        );
      } catch (err) {
        setStatusText(`Search failed: ${(err as Error).message}`);
        return null;
      }
    },
    [connected, config]
  );

  const handlePlayQueueIndex = useCallback(
    async (index: number) => {
      if (!connected) return;
      try {
        await apiFetch(config, "/api/queue/play", {
          method: "POST",
          body: JSON.stringify({ index })
        });
        await refreshNowPlaying();
        await refreshQueue();
      } catch (err) {
        setStatusText(`Playback error: ${(err as Error).message}`);
      }
    },
    [connected, config, refreshNowPlaying, refreshQueue]
  );

  useEffect(() => {
    const updateStandalone = () => {
      setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    };
    updateStandalone();

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", updateStandalone);
    window.addEventListener("visibilitychange", updateStandalone);

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", updateStandalone);
      window.removeEventListener("visibilitychange", updateStandalone);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }, [installEvent]);

  const handleCopyToken = useCallback(async () => {
    if (!config.token) return;
    await navigator.clipboard.writeText(config.token);
    setStatusText("Token copied");
  }, [config.token]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/install" replace />} />
      <Route
        path="/install"
        element={
          <Install
            canInstall={Boolean(installEvent)}
            isStandalone={isStandalone}
            onInstall={handleInstall}
            isConnected={connected}
          />
        }
      />
      <Route
        path="/pairing"
        element={
          <Pairing
            baseUrl={config.baseUrl}
            token={config.token}
            connected={connected}
            statusText={statusLine}
            onSave={handleSaveConfig}
            onTest={async (baseUrl, token) => testConnection({ baseUrl, token })}
            onQrConfig={async (baseUrl, token) => {
              handleSaveConfig(baseUrl, token);
              const ok = await testConnection({ baseUrl, token });
              if (ok) {
                await refreshNowPlaying();
              }
              return ok;
            }}
            isConnected={connected}
          />
        }
      />
      <Route
        path="/controls"
        element={
          <Controls
            playback={playback}
            track={track}
            connected={connected}
            statusLine={statusFooter}
            onPlay={handlePlay}
            onPause={handlePause}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSeek={handleSeek}
            onVolume={handleVolume}
          />
        }
      />
      <Route
        path="/queue"
        element={
          <Queue
            connected={connected}
            queueState={queueState}
            onPlayIndex={handlePlayQueueIndex}
          />
        }
      />
      <Route
        path="/search"
        element={<Search connected={connected} onSearch={handleSearch} />}
      />
      <Route
        path="/settings"
        element={
          <Settings
            baseUrl={config.baseUrl}
            token={config.token}
            connected={connected}
            statusText={statusLine}
            onCopyToken={handleCopyToken}
            onClear={handleClearConfig}
          />
        }
      />
      <Route path="*" element={<Navigate to="/install" replace />} />
    </Routes>
  );
}
