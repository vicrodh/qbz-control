import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Install } from "./components/Install";
import { Pairing } from "./components/Pairing";
import { Controls } from "./components/Controls";
import { Queue } from "./components/Queue";
import { Search } from "./components/Search";
import { Favorites } from "./components/Favorites";
import { Settings } from "./components/Settings";
import { Album } from "./components/Album";
import { Artist } from "./components/Artist";
import { apiFetch, apiJson, buildWsUrl } from "./lib/api";
import { clearConfig, loadConfig, saveConfig } from "./lib/storage";
import type {
  ApiConfig,
  NowPlayingResponse,
  PingResponse,
  PlaybackState,
  QueueStateResponse,
  QueueTrack,
  SearchAllResponse,
  FavoriteType
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
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'Off' | 'All' | 'One'>('Off');
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  const refreshTimer = useRef<number | null>(null);
  const userActionInProgress = useRef(false);
  const wsDebounceTimer = useRef<number | null>(null);

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

  const refreshNowPlaying = useCallback(async (force = false) => {
    if (!connected || !config.baseUrl || !config.token) {
      return;
    }
    // Skip background refreshes while user action is in progress
    if (!force && userActionInProgress.current) {
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

  const refreshQueue = useCallback(async (force = false) => {
    if (!connected || !config.baseUrl || !config.token) {
      return;
    }
    // Skip background refreshes while user action is in progress
    if (!force && userActionInProgress.current) {
      return;
    }
    try {
      const data = await apiJson<QueueStateResponse>(config, "/api/queue");
      setQueueState(data);
      setShuffle(data.shuffle);
      const mode = data.repeat;
      setRepeat(mode === 'All' ? 'All' : mode === 'One' ? 'One' : 'Off');
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
      // Debounce WebSocket-triggered refreshes to avoid request spam
      if (wsDebounceTimer.current) {
        window.clearTimeout(wsDebounceTimer.current);
      }
      wsDebounceTimer.current = window.setTimeout(() => {
        refreshNowPlaying();
        refreshQueue();
      }, 200);
    };
    ws.onclose = () => {
      // Keep polling running as fallback.
    };
    return () => {
      if (wsDebounceTimer.current) {
        window.clearTimeout(wsDebounceTimer.current);
      }
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

  const handleSearchAll = useCallback(
    async (query: string): Promise<SearchAllResponse | null> => {
      if (!connected) return null;
      try {
        return await apiJson<SearchAllResponse>(
          config,
          `/api/search/all?q=${encodeURIComponent(query)}&limit=12&offset=0`
        );
      } catch (err) {
        setStatusText(`Search failed: ${(err as Error).message}`);
        return null;
      }
    },
    [connected, config]
  );

  const handlePlayAlbum = useCallback(
    async (albumId: string) => {
      if (!connected) return;
      userActionInProgress.current = true;
      try {
        await apiFetch(config, "/api/album/play", {
          method: "POST",
          body: JSON.stringify({ albumId })
        });
        await refreshNowPlaying(true);
        await refreshQueue(true);
      } catch (err) {
        setStatusText(`Failed to play album: ${(err as Error).message}`);
      } finally {
        userActionInProgress.current = false;
      }
    },
    [connected, config, refreshNowPlaying, refreshQueue]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleGetAlbum = useCallback(
    async (albumId: string): Promise<any | null> => {
      if (!connected) return null;
      try {
        return await apiJson(config, `/api/album/${encodeURIComponent(albumId)}`);
      } catch (err) {
        setStatusText(`Failed to load album: ${(err as Error).message}`);
        return null;
      }
    },
    [connected, config]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleGetArtist = useCallback(
    async (artistId: string): Promise<any | null> => {
      if (!connected) return null;
      try {
        return await apiJson(config, `/api/artist/${encodeURIComponent(artistId)}`);
      } catch (err) {
        setStatusText(`Failed to load artist: ${(err as Error).message}`);
        return null;
      }
    },
    [connected, config]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleGetFavorites = useCallback(
    async (type: FavoriteType): Promise<any | null> => {
      if (!connected) return null;
      try {
        return await apiJson(config, `/api/favorites?fav_type=${encodeURIComponent(type)}&limit=50`);
      } catch (err) {
        setStatusText(`Failed to load favorites: ${(err as Error).message}`);
        return null;
      }
    },
    [connected, config]
  );

  const handleRemoveFavorite = useCallback(
    async (type: FavoriteType, itemId: string) => {
      if (!connected) return;
      try {
        await apiFetch(config, "/api/favorites/remove", {
          method: "POST",
          body: JSON.stringify({ favType: type, itemId })
        });
      } catch (err) {
        setStatusText(`Failed to remove favorite: ${(err as Error).message}`);
      }
    },
    [connected, config]
  );

  const handlePlayQueueIndex = useCallback(
    async (index: number) => {
      if (!connected) return;
      userActionInProgress.current = true;
      try {
        await apiFetch(config, "/api/queue/play", {
          method: "POST",
          body: JSON.stringify({ index })
        });
        await refreshNowPlaying(true);
        await refreshQueue(true);
      } catch (err) {
        setStatusText(`Playback error: ${(err as Error).message}`);
      } finally {
        userActionInProgress.current = false;
      }
    },
    [connected, config, refreshNowPlaying, refreshQueue]
  );

  const handleAddToQueue = useCallback(
    async (track: QueueTrack) => {
      if (!connected) return;
      userActionInProgress.current = true;
      try {
        await apiFetch(config, "/api/queue/add", {
          method: "POST",
          body: JSON.stringify({ track })
        });
        await refreshQueue(true);
      } catch (err) {
        setStatusText(`Failed to add to queue: ${(err as Error).message}`);
      } finally {
        userActionInProgress.current = false;
      }
    },
    [connected, config, refreshQueue]
  );

  const handleShuffle = useCallback(async () => {
    if (!connected) return;
    try {
      const newShuffle = !shuffle;
      const res = await apiJson<{ shuffle: boolean; repeat: string }>(
        config,
        "/api/queue/shuffle",
        { method: "POST", body: JSON.stringify({ enabled: newShuffle }) }
      );
      setShuffle(res.shuffle);
    } catch (err) {
      setStatusText(`Shuffle error: ${(err as Error).message}`);
    }
  }, [connected, config, shuffle]);

  const handleRepeat = useCallback(async () => {
    if (!connected) return;
    try {
      // Cycle: Off -> All -> One -> Off
      const nextMode = repeat === 'Off' ? 'all' : repeat === 'All' ? 'one' : 'off';
      const res = await apiJson<{ shuffle: boolean; repeat: string }>(
        config,
        "/api/queue/repeat",
        { method: "POST", body: JSON.stringify({ mode: nextMode }) }
      );
      const mode = res.repeat.toLowerCase();
      setRepeat(mode === 'all' ? 'All' : mode === 'one' ? 'One' : 'Off');
    } catch (err) {
      setStatusText(`Repeat error: ${(err as Error).message}`);
    }
  }, [connected, config, repeat]);

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
            shuffle={shuffle}
            repeat={repeat}
            onPlay={handlePlay}
            onPause={handlePause}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSeek={handleSeek}
            onVolume={handleVolume}
            onShuffle={handleShuffle}
            onRepeat={handleRepeat}
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
        element={
          <Search
            connected={connected}
            onSearchAll={handleSearchAll}
            onAddToQueue={handleAddToQueue}
            onPlayAlbum={handlePlayAlbum}
          />
        }
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
      <Route
        path="/favorites"
        element={
          <Favorites
            connected={connected}
            onGetFavorites={handleGetFavorites}
            onAddToQueue={handleAddToQueue}
            onPlayAlbum={handlePlayAlbum}
            onRemoveFavorite={handleRemoveFavorite}
          />
        }
      />
      <Route
        path="/album/:albumId"
        element={
          <Album
            connected={connected}
            onGetAlbum={handleGetAlbum}
            onPlayAlbum={handlePlayAlbum}
            onAddToQueue={handleAddToQueue}
          />
        }
      />
      <Route
        path="/artist/:artistId"
        element={
          <Artist
            connected={connected}
            onGetArtist={handleGetArtist}
            onPlayAlbum={handlePlayAlbum}
          />
        }
      />
      <Route path="*" element={<Navigate to="/install" replace />} />
    </Routes>
  );
}
