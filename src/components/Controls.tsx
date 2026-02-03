import { useMemo, useRef, useState } from "react";
import { Layout } from "./Layout";
import { IconNext, IconPause, IconPlay, IconPrevious } from "./Icons";
import { clamp, formatTime } from "../lib/format";
import type { PlaybackState, QueueTrack } from "../lib/types";

type ControlsProps = {
  playback: PlaybackState | null;
  track: QueueTrack | null;
  connected: boolean;
  statusLine: string;
  onPlay: () => Promise<void>;
  onPause: () => Promise<void>;
  onNext: () => Promise<void>;
  onPrevious: () => Promise<void>;
  onSeek: (position: number) => Promise<void>;
  onVolume: (volume: number) => Promise<void>;
};

export function Controls({
  playback,
  track,
  connected,
  statusLine,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSeek,
  onVolume
}: ControlsProps) {
  const [seekValue, setSeekValue] = useState<number | null>(null);
  const volumeTimeout = useRef<number | null>(null);

  const position = seekValue ?? playback?.position ?? 0;
  const duration = playback?.duration ?? 0;
  const progress = duration ? (position / duration) * 100 : 0;
  const volumePercent = useMemo(() => {
    if (!playback) return 0;
    return clamp(Math.round(playback.volume * 100), 0, 100);
  }, [playback]);

  const handleSeekCommit = async () => {
    if (seekValue === null) return;
    await onSeek(seekValue);
    setSeekValue(null);
  };

  const handleVolumeChange = (value: number) => {
    if (volumeTimeout.current) {
      window.clearTimeout(volumeTimeout.current);
    }
    volumeTimeout.current = window.setTimeout(() => {
      onVolume(clamp(value / 100, 0, 1));
    }, 120);
  };

  const isPlaying = playback?.is_playing ?? false;

  return (
    <Layout isConnected={connected}>
      <div className="stack" style={{ alignItems: "center" }}>
        <div className="controls-art">
          {track?.artwork_url ? (
            <img src={track.artwork_url} alt={track.title} />
          ) : null}
        </div>

        <div style={{ width: "100%" }}>
          <div className="track-title">{track?.title || "No track"}</div>
          <div className="track-subtitle">
            {track ? `${track.artist} — ${track.album}` : "---"}
          </div>
        </div>

        <div style={{ width: "100%" }}>
          <div className="status-row" style={{ marginTop: "8px" }}>
            <span>{formatTime(position)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            className="range"
            type="range"
            min={0}
            max={Math.max(duration, 1)}
            value={position}
            onChange={(event) => setSeekValue(Number(event.target.value))}
            onMouseUp={handleSeekCommit}
            onTouchEnd={handleSeekCommit}
            disabled={!connected || duration === 0}
          />
        </div>

        <div className="control-row">
          <button className="control-btn" onClick={onPrevious} disabled={!connected}>
            <IconPrevious />
          </button>
          <button
            className="control-btn primary"
            onClick={isPlaying ? onPause : onPlay}
            disabled={!connected}
          >
            {isPlaying ? <IconPause /> : <IconPlay />}
          </button>
          <button className="control-btn" onClick={onNext} disabled={!connected}>
            <IconNext />
          </button>
        </div>

        <div style={{ width: "100%" }}>
          <div className="text-secondary" style={{ fontSize: "12px", marginBottom: "10px" }}>
            Volume
          </div>
          <input
            className="range"
            type="range"
            min={0}
            max={100}
            value={volumePercent}
            onChange={(event) => handleVolumeChange(Number(event.target.value))}
            disabled={!connected}
          />
        </div>

        <div className="helper-text">{statusLine}</div>
      </div>
    </Layout>
  );
}
