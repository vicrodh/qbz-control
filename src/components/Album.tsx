import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout } from "./Layout";
import { IconPlus, IconPlay } from "./Icons";
import type { QueueTrack, ImageSet } from "../lib/types";

type AlbumTrack = {
  id: number;
  title: string;
  duration: number;
  track_number: number;
  performer?: { id: number; name: string };
  hires: boolean;
  streamable: boolean;
};

type AlbumDetail = {
  id: string;
  title: string;
  artist: { id: number; name: string };
  image: ImageSet;
  tracks_count?: number;
  duration?: number;
  hires: boolean;
  release_date_original?: string;
  genre?: { name: string };
  tracks?: { items: AlbumTrack[] };
};

type AlbumProps = {
  connected: boolean;
  onGetAlbum: (albumId: string) => Promise<AlbumDetail | null>;
  onPlayAlbum: (albumId: string) => Promise<void>;
  onAddToQueue: (track: QueueTrack) => Promise<void>;
};

export function Album({ connected, onGetAlbum, onPlayAlbum, onAddToQueue }: AlbumProps) {
  const { t } = useTranslation();
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    if (!albumId || !connected) {
      setLoading(false);
      return;
    }
    setLoading(true);
    onGetAlbum(albumId).then((data) => {
      setAlbum(data);
      setLoading(false);
    });
  }, [albumId, connected, onGetAlbum]);

  const handlePlayAlbum = async () => {
    if (!albumId) return;
    await onPlayAlbum(albumId);
    navigate("/controls");
  };

  const handleAddTrack = async (track: AlbumTrack) => {
    if (!album) return;
    setAddingId(track.id);
    try {
      const artwork = album.image?.large || album.image?.small || undefined;
      const queueTrack: QueueTrack = {
        id: track.id,
        title: track.title,
        artist: track.performer?.name || album.artist.name,
        album: album.title,
        duration_secs: track.duration,
        artwork_url: artwork,
        streamable: track.streamable
      };
      await onAddToQueue(queueTrack);
    } finally {
      setAddingId(null);
    }
  };

  const formatDuration = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, "0")}`;
  };

  const getAlbumImage = (): string | null => {
    if (!album?.image) return null;
    return album.image.large || album.image.extralarge || album.image.small || null;
  };

  if (loading) {
    return (
      <Layout isConnected={connected}>
        <div className="loading-container">
          <div className="loading-text">{t("album.loading")}</div>
        </div>
      </Layout>
    );
  }

  if (!album) {
    return (
      <Layout isConnected={connected}>
        <div className="card">
          <div className="section-subtitle">{t("album.notFound")}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout isConnected={connected}>
      <div className="stack">
        <div className="album-header">
          <div className="album-cover">
            {getAlbumImage() ? (
              <img src={getAlbumImage()!} alt={album.title} />
            ) : (
              <div className="album-cover-placeholder" />
            )}
          </div>
          <div className="album-info">
            <h1 className="album-title">
              {album.title}
              {album.hires && <span className="hires-badge">Hi-Res</span>}
            </h1>
            <div className="album-artist">{album.artist.name}</div>
            {album.genre && <div className="album-meta">{album.genre.name}</div>}
            {album.release_date_original && (
              <div className="album-meta">{album.release_date_original.split("-")[0]}</div>
            )}
          </div>
        </div>

        <div className="album-actions">
          <button className="primary play-album-btn" onClick={handlePlayAlbum}>
            <IconPlay size={16} />
            {t("album.play")}
          </button>
        </div>

        <div className="track-list">
          {album.tracks?.items.map((track) => (
            <div className="track-item" key={track.id}>
              <span className="track-number">{track.track_number}</span>
              <div className="track-info">
                <div className="track-title">
                  {track.title}
                  {track.hires && <span className="hires-badge-small">HR</span>}
                </div>
                {track.performer && track.performer.name !== album.artist.name && (
                  <div className="track-artist">{track.performer.name}</div>
                )}
              </div>
              <span className="track-duration">{formatDuration(track.duration)}</span>
              <button
                className="add-btn"
                onClick={() => handleAddTrack(track)}
                disabled={addingId === track.id || !track.streamable}
                aria-label={t("queue.addToQueue")}
              >
                <IconPlus size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
