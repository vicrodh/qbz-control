import { useTranslation } from "react-i18next";
import { Layout } from "./Layout";
import type { QueueStateResponse, QueueTrack } from "../lib/types";

type QueueProps = {
  connected: boolean;
  queueState: QueueStateResponse | null;
  onPlayIndex: (index: number) => Promise<void>;
};

export function Queue({ connected, queueState, onPlayIndex }: QueueProps) {
  const { t } = useTranslation();

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${mins}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!connected) {
    return (
      <Layout isConnected={connected}>
        <div className="stack">
          <div className="card">
            <div className="section-subtitle">{t("pairing.title")}</div>
            <p className="text-secondary">{t("queue.emptyDesc")}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const isEmpty = !queueState || (
    !queueState.current_track &&
    queueState.upcoming.length === 0 &&
    queueState.history.length === 0
  );

  if (isEmpty) {
    return (
      <Layout isConnected={connected}>
        <div className="stack">
          <div className="card">
            <div className="section-subtitle">{t("queue.empty")}</div>
            <p className="text-secondary">{t("queue.emptyDesc")}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout isConnected={connected}>
      <div className="stack">
        {queueState.current_track && (
          <div className="queue-section">
            <div className="section-label">{t("queue.nowPlaying")}</div>
            <TrackItem
              track={queueState.current_track}
              isPlaying
              formatDuration={formatDuration}
            />
          </div>
        )}

        {queueState.upcoming.length > 0 && (
          <div className="queue-section">
            <div className="section-label">{t("queue.upNext")}</div>
            <div className="list">
              {queueState.upcoming.map((track, idx) => {
                const actualIndex = (queueState.current_index ?? -1) + 1 + idx;
                return (
                  <TrackItem
                    key={`${track.id}-${idx}`}
                    track={track}
                    formatDuration={formatDuration}
                    onClick={() => onPlayIndex(actualIndex)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {queueState.history.length > 0 && (
          <div className="queue-section">
            <div className="section-label">{t("queue.history")}</div>
            <div className="list queue-history">
              {queueState.history.map((track, idx) => (
                <TrackItem
                  key={`history-${track.id}-${idx}`}
                  track={track}
                  formatDuration={formatDuration}
                  dimmed
                />
              ))}
            </div>
          </div>
        )}

        <div className="queue-footer">
          <span className="text-secondary">
            {t("queue.trackCount", { count: queueState.total_tracks })}
          </span>
        </div>
      </div>
    </Layout>
  );
}

type TrackItemProps = {
  track: QueueTrack;
  isPlaying?: boolean;
  dimmed?: boolean;
  formatDuration: (secs: number) => string;
  onClick?: () => void;
};

function TrackItem({ track, isPlaying, dimmed, formatDuration, onClick }: TrackItemProps) {
  return (
    <div
      className={`list-item ${isPlaying ? "playing" : ""} ${dimmed ? "dimmed" : ""} ${onClick ? "clickable" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          onClick();
        }
      }}
    >
      <div className="list-thumb">
        {track.artwork_url ? (
          <img src={track.artwork_url} alt={track.title} />
        ) : (
          <div className="thumb-placeholder" />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="list-title">{track.title}</div>
        <div className="list-subtitle">{track.artist}</div>
      </div>
      <div className="list-duration">{formatDuration(track.duration_secs)}</div>
    </div>
  );
}
