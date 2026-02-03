import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "./Layout";
import {
  IconNext,
  IconPause,
  IconPlay,
  IconPrevious,
  IconRepeat,
  IconRepeatOne,
  IconShuffle,
  IconInfinity,
  IconVolume,
  IconVolumeMute,
  IconHeart
} from "./Icons";
import { clamp, formatTime } from "../lib/format";
import type { PlaybackState, QueueTrack, RepeatMode, AutoplayMode } from "../lib/types";

type ControlsProps = {
  playback: PlaybackState | null;
  track: QueueTrack | null;
  connected: boolean;
  statusLine: string;
  shuffle: boolean;
  repeat: RepeatMode;
  autoplay: AutoplayMode;
  onPlay: () => Promise<void>;
  onPause: () => Promise<void>;
  onNext: () => Promise<void>;
  onPrevious: () => Promise<void>;
  onSeek: (position: number) => Promise<void>;
  onVolume: (volume: number) => Promise<void>;
  onShuffle: () => Promise<void>;
  onRepeat: () => Promise<void>;
  onAutoplay: (mode: AutoplayMode) => Promise<void>;
  onToggleFavorite?: (trackId: number, isFavorite: boolean) => Promise<void>;
};

export function Controls({
  playback,
  track,
  connected,
  statusLine,
  shuffle,
  repeat,
  autoplay,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSeek,
  onVolume,
  onShuffle,
  onRepeat,
  onAutoplay,
  onToggleFavorite
}: ControlsProps) {
  const { t } = useTranslation();
  const [seekValue, setSeekValue] = useState<number | null>(null);
  const [showVolume, setShowVolume] = useState(false);
  const volumeTimeout = useRef<number | null>(null);

  const position = seekValue ?? playback?.position ?? 0;
  const duration = playback?.duration ?? 0;
  const volumePercent = useMemo(() => {
    if (!playback) return 100;
    return clamp(Math.round(playback.volume * 100), 0, 100);
  }, [playback]);

  const handleSeekChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSeekValue(Number(event.target.value));
  };

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
    }, 80);
  };

  const cycleAutoplay = async () => {
    const modes: AutoplayMode[] = ["continue", "infinite", "track_only"];
    const currentIndex = modes.indexOf(autoplay);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    await onAutoplay(nextMode);
  };

  const isPlaying = playback?.is_playing ?? false;
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <Layout isConnected={connected}>
      <div className="player-container">
        {/* Album Art */}
        <div className="player-art-wrapper">
          <div className="player-art">
            {track?.artwork_url ? (
              <img src={track.artwork_url} alt={track.title} />
            ) : (
              <div className="player-art-placeholder">
                <img src="/qbz-logo.svg" alt="QBZ" />
              </div>
            )}
          </div>
        </div>

        {/* Track Info */}
        <div className="player-info">
          <div className="player-track-title">{track?.title || t("controls.notPlaying")}</div>
          <div className="player-track-artist">
            {track ? track.artist : t("controls.notPlayingDesc")}
          </div>
          {track && (
            <div className="player-track-album">{track.album}</div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="player-progress">
          <div className="player-progress-bar">
            <div
              className="player-progress-fill"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              className="player-progress-input"
              min={0}
              max={Math.max(duration, 1)}
              value={position}
              onChange={handleSeekChange}
              onMouseUp={handleSeekCommit}
              onTouchEnd={handleSeekCommit}
              disabled={!connected || duration === 0}
            />
          </div>
          <div className="player-time">
            <span>{formatTime(position)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="player-controls">
          <button
            className={`player-btn secondary ${shuffle ? "active" : ""}`}
            onClick={onShuffle}
            disabled={!connected}
            aria-label={t("controls.shuffle")}
          >
            <IconShuffle size={20} />
          </button>

          <button
            className="player-btn"
            onClick={onPrevious}
            disabled={!connected}
            aria-label={t("controls.previous")}
          >
            <IconPrevious size={28} />
          </button>

          <button
            className="player-btn primary"
            onClick={isPlaying ? onPause : onPlay}
            disabled={!connected}
            aria-label={isPlaying ? t("controls.pause") : t("controls.play")}
          >
            {isPlaying ? <IconPause size={32} /> : <IconPlay size={32} />}
          </button>

          <button
            className="player-btn"
            onClick={onNext}
            disabled={!connected}
            aria-label={t("controls.next")}
          >
            <IconNext size={28} />
          </button>

          <button
            className={`player-btn secondary ${repeat !== "Off" ? "active" : ""}`}
            onClick={onRepeat}
            disabled={!connected}
            aria-label={t("controls.repeat")}
          >
            {repeat === "One" ? <IconRepeatOne size={20} /> : <IconRepeat size={20} />}
          </button>
        </div>

        {/* Secondary Controls */}
        <div className="player-secondary">
          <button
            className={`player-action ${autoplay === "infinite" ? "active" : ""}`}
            onClick={cycleAutoplay}
            disabled={!connected}
            title={t(`controls.autoplay.${autoplay}`)}
          >
            <IconInfinity size={18} />
            <span className="player-action-label">
              {autoplay === "infinite" ? t("controls.autoplayOn") : t("controls.autoplayOff")}
            </span>
          </button>

          {onToggleFavorite && track && (
            <button
              className="player-action"
              onClick={() => onToggleFavorite(track.id, false)}
              disabled={!connected}
            >
              <IconHeart size={18} />
            </button>
          )}

          <button
            className={`player-action ${showVolume ? "active" : ""}`}
            onClick={() => setShowVolume(!showVolume)}
            disabled={!connected}
          >
            {volumePercent === 0 ? (
              <IconVolumeMute size={18} />
            ) : (
              <IconVolume size={18} />
            )}
            <span className="player-action-label">{volumePercent}%</span>
          </button>
        </div>

        {/* Volume Slider (collapsible) */}
        {showVolume && (
          <div className="player-volume">
            <IconVolumeMute size={16} />
            <input
              type="range"
              className="player-volume-input"
              min={0}
              max={100}
              value={volumePercent}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              disabled={!connected}
            />
            <IconVolume size={16} />
          </div>
        )}

        {/* Status */}
        <div className="player-status">{statusLine}</div>
      </div>
    </Layout>
  );
}
