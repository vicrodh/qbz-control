import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "./Layout";
import { IconNext, IconPause, IconPlay, IconPrevious, IconRepeat, IconRepeatOne, IconShuffle } from "./Icons";
import { clamp, formatTime } from "../lib/format";
import type { PlaybackState, QueueTrack, RepeatMode } from "../lib/types";

type ControlsProps = {
  playback: PlaybackState | null;
  track: QueueTrack | null;
  connected: boolean;
  statusLine: string;
  shuffle: boolean;
  repeat: RepeatMode;
  onPlay: () => Promise<void>;
  onPause: () => Promise<void>;
  onNext: () => Promise<void>;
  onPrevious: () => Promise<void>;
  onSeek: (position: number) => Promise<void>;
  onVolume: (volume: number) => Promise<void>;
  onShuffle: () => Promise<void>;
  onRepeat: () => Promise<void>;
};

export function Controls({
  playback,
  track,
  connected,
  statusLine,
  shuffle,
  repeat,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSeek,
  onVolume,
  onShuffle,
  onRepeat
}: ControlsProps) {
  const { t } = useTranslation();
  const [seekValue, setSeekValue] = useState<number | null>(null);
  const volumeTimeout = useRef<number | null>(null);

  const position = seekValue ?? playback?.position ?? 0;
  const duration = playback?.duration ?? 0;
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
          ) : (
            <img src="/qbz-logo.svg" alt="QBZ logo" />
          )}
        </div>

        <div style={{ width: "100%" }}>
          <div className="track-title">{track?.title || t('controls.notPlaying')}</div>
          <div className="track-subtitle">
            {track ? `${track.artist} — ${track.album}` : t('controls.notPlayingDesc')}
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
          <button
            className={`control-btn small ${shuffle ? 'active' : ''}`}
            onClick={onShuffle}
            disabled={!connected}
            aria-label={t('controls.shuffle')}
          >
            <IconShuffle size={18} />
          </button>
          <button
            className="control-btn"
            onClick={onPrevious}
            disabled={!connected}
            aria-label={t('controls.previous')}
          >
            <IconPrevious />
          </button>
          <button
            className="control-btn primary"
            onClick={isPlaying ? onPause : onPlay}
            disabled={!connected}
            aria-label={isPlaying ? t('controls.pause') : t('controls.play')}
          >
            {isPlaying ? <IconPause /> : <IconPlay />}
          </button>
          <button
            className="control-btn"
            onClick={onNext}
            disabled={!connected}
            aria-label={t('controls.next')}
          >
            <IconNext />
          </button>
          <button
            className={`control-btn small ${repeat !== 'Off' ? 'active' : ''}`}
            onClick={onRepeat}
            disabled={!connected}
            aria-label={t('controls.repeat')}
          >
            {repeat === 'One' ? <IconRepeatOne size={18} /> : <IconRepeat size={18} />}
          </button>
        </div>

        <div style={{ width: "100%" }}>
          <div className="text-secondary" style={{ fontSize: "12px", marginBottom: "10px" }}>
            {t('controls.volume')}
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
