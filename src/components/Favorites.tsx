import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout } from "./Layout";
import { IconPlus, IconPlay, IconPlayNext, IconHeart } from "./Icons";
import type {
  QueueTrack,
  FavoriteTrack,
  FavoriteAlbum,
  FavoriteArtist,
  FavoriteType
} from "../lib/types";

type FavoritesProps = {
  connected: boolean;
  onGetFavorites: (type: FavoriteType) => Promise<any>;
  onAddToQueue: (track: QueueTrack) => Promise<void>;
  onAddToQueueNext: (track: QueueTrack) => Promise<void>;
  onPlayTrack: (track: QueueTrack) => Promise<void>;
  onPlayAlbum: (albumId: string) => Promise<void>;
  onRemoveFavorite: (type: FavoriteType, itemId: string) => Promise<void>;
};

export function Favorites({
  connected,
  onGetFavorites,
  onAddToQueue,
  onAddToQueueNext,
  onPlayTrack,
  onPlayAlbum,
  onRemoveFavorite
}: FavoritesProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<FavoriteType>("albums");
  const [tracks, setTracks] = useState<FavoriteTrack[]>([]);
  const [albums, setAlbums] = useState<FavoriteAlbum[]>([]);
  const [artists, setArtists] = useState<FavoriteArtist[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | string | null>(null);

  const loadFavorites = useCallback(async (type: FavoriteType) => {
    if (!connected) return;
    setLoading(true);
    try {
      const data = await onGetFavorites(type);
      if (data?.items) {
        switch (type) {
          case "tracks":
            setTracks(data.items);
            break;
          case "albums":
            setAlbums(data.items);
            break;
          case "artists":
            setArtists(data.items);
            break;
        }
      }
    } finally {
      setLoading(false);
    }
  }, [connected, onGetFavorites]);

  useEffect(() => {
    loadFavorites(activeTab);
  }, [activeTab, loadFavorites]);

  const handleTabChange = (tab: FavoriteType) => {
    setActiveTab(tab);
  };

  const createQueueTrack = (track: FavoriteTrack): QueueTrack => {
    const artworkUrl = getTrackImage(track);
    return {
      id: track.id,
      title: track.title,
      artist: track.performer.name,
      album: track.album.title,
      duration_secs: track.duration,
      artwork_url: artworkUrl,
      streamable: track.streamable
    };
  };

  const handleAddToQueue = async (track: FavoriteTrack) => {
    setAddingId(track.id);
    try {
      await onAddToQueue(createQueueTrack(track));
    } finally {
      setAddingId(null);
    }
  };

  const handleAddToQueueNext = async (track: FavoriteTrack) => {
    setAddingId(track.id);
    try {
      await onAddToQueueNext(createQueueTrack(track));
    } finally {
      setAddingId(null);
    }
  };

  const handlePlayTrack = async (track: FavoriteTrack) => {
    setAddingId(track.id);
    try {
      await onPlayTrack(createQueueTrack(track));
      navigate("/controls");
    } finally {
      setAddingId(null);
    }
  };

  const handleAlbumClick = (album: FavoriteAlbum) => {
    navigate(`/album/${album.id}`);
  };

  const handlePlayAlbumClick = async (e: React.MouseEvent, album: FavoriteAlbum) => {
    e.stopPropagation();
    setAddingId(album.id);
    try {
      await onPlayAlbum(album.id);
      navigate("/controls");
    } finally {
      setAddingId(null);
    }
  };

  const handleArtistClick = (artist: FavoriteArtist) => {
    navigate(`/artist/${artist.id}`);
  };

  const handleRemoveFavorite = async (e: React.MouseEvent, type: FavoriteType, itemId: string | number) => {
    e.stopPropagation();
    await onRemoveFavorite(type, String(itemId));
    loadFavorites(type);
  };

  const getResultCount = (tab: FavoriteType): number => {
    switch (tab) {
      case "tracks": return tracks.length;
      case "albums": return albums.length;
      case "artists": return artists.length;
    }
  };

  return (
    <Layout isConnected={connected}>
      <div className="stack">
        {!connected ? (
          <div className="card">
            <div className="section-subtitle">{t("pairing.title")}</div>
            <p className="text-secondary">{t("favorites.hint")}</p>
          </div>
        ) : (
          <>
            <div className="search-tabs">
              <button
                className={`search-tab ${activeTab === "albums" ? "active" : ""}`}
                onClick={() => handleTabChange("albums")}
              >
                {t("favorites.albums")} ({getResultCount("albums")})
              </button>
              <button
                className={`search-tab ${activeTab === "tracks" ? "active" : ""}`}
                onClick={() => handleTabChange("tracks")}
              >
                {t("favorites.tracks")} ({getResultCount("tracks")})
              </button>
              <button
                className={`search-tab ${activeTab === "artists" ? "active" : ""}`}
                onClick={() => handleTabChange("artists")}
              >
                {t("favorites.artists")} ({getResultCount("artists")})
              </button>
            </div>

            {loading && (
              <div className="loading-container">
                <div className="loading-text">{t("favorites.loading")}</div>
              </div>
            )}

            {!loading && activeTab === "tracks" && (
              <div className="list">
                {tracks.length === 0 ? (
                  <div className="card">
                    <p className="text-secondary">{t("favorites.noTracks")}</p>
                  </div>
                ) : (
                  tracks.map((track) => (
                    <div className="list-item" key={track.id}>
                      <div className="list-thumb">
                        {getTrackImage(track) ? (
                          <img src={getTrackImage(track)!} alt={track.title} />
                        ) : (
                          <div className="thumb-placeholder" />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="list-title">
                          {track.title}
                          {track.hires && <span className="hires-badge-small">HR</span>}
                        </div>
                        <div className="list-subtitle">{track.performer.name}</div>
                      </div>
                      <button
                        className="fav-btn active"
                        onClick={(e) => handleRemoveFavorite(e, "tracks", track.id)}
                        aria-label={t("favorites.remove")}
                      >
                        <IconHeart size={18} filled />
                      </button>
                      <div className="track-actions">
                        <button
                          className="add-btn"
                          onClick={() => handlePlayTrack(track)}
                          disabled={addingId === track.id || !track.streamable}
                          aria-label={t("queue.play")}
                          title={t("queue.play")}
                        >
                          <IconPlay size={16} />
                        </button>
                        <button
                          className="add-btn"
                          onClick={() => handleAddToQueueNext(track)}
                          disabled={addingId === track.id || !track.streamable}
                          aria-label={t("queue.playNext")}
                          title={t("queue.playNext")}
                        >
                          <IconPlayNext size={16} />
                        </button>
                        <button
                          className="add-btn"
                          onClick={() => handleAddToQueue(track)}
                          disabled={addingId === track.id || !track.streamable}
                          aria-label={t("queue.addToQueue")}
                          title={t("queue.addToQueue")}
                        >
                          <IconPlus size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {!loading && activeTab === "albums" && (
              <div className="list">
                {albums.length === 0 ? (
                  <div className="card">
                    <p className="text-secondary">{t("favorites.noAlbums")}</p>
                  </div>
                ) : (
                  albums.map((album) => (
                    <div
                      className="list-item clickable"
                      key={album.id}
                      onClick={() => handleAlbumClick(album)}
                    >
                      <div className="list-thumb">
                        {getAlbumImage(album) ? (
                          <img src={getAlbumImage(album)!} alt={album.title} />
                        ) : (
                          <div className="thumb-placeholder" />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="list-title">
                          {album.title}
                          {album.hires && <span className="hires-badge">Hi-Res</span>}
                        </div>
                        <div className="list-subtitle">
                          {album.artist?.name || "Unknown artist"}
                        </div>
                      </div>
                      <button
                        className="fav-btn active"
                        onClick={(e) => handleRemoveFavorite(e, "albums", album.id)}
                        aria-label={t("favorites.remove")}
                      >
                        <IconHeart size={18} filled />
                      </button>
                      <button
                        className="add-btn"
                        onClick={(e) => handlePlayAlbumClick(e, album)}
                        disabled={addingId === album.id}
                        aria-label={t("album.play")}
                      >
                        <IconPlay size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {!loading && activeTab === "artists" && (
              <div className="list">
                {artists.length === 0 ? (
                  <div className="card">
                    <p className="text-secondary">{t("favorites.noArtists")}</p>
                  </div>
                ) : (
                  artists.map((artist) => (
                    <div
                      className="list-item clickable"
                      key={artist.id}
                      onClick={() => handleArtistClick(artist)}
                    >
                      <div className="list-thumb artist-thumb">
                        {artist.picture ? (
                          <img src={artist.picture} alt={artist.name} />
                        ) : (
                          <div className="thumb-placeholder" />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="list-title">{artist.name}</div>
                        {artist.albums_count && (
                          <div className="list-subtitle">
                            {t("search.albumCount", { count: artist.albums_count })}
                          </div>
                        )}
                      </div>
                      <button
                        className="fav-btn active"
                        onClick={(e) => handleRemoveFavorite(e, "artists", artist.id)}
                        aria-label={t("favorites.remove")}
                      >
                        <IconHeart size={18} filled />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

function getTrackImage(track: FavoriteTrack): string | null {
  const image = track.album?.image;
  if (!image) return null;
  return image.large || image.thumbnail || image.small || null;
}

function getAlbumImage(album: FavoriteAlbum): string | null {
  const image = album.image;
  if (!image) return null;
  return image.large || image.thumbnail || image.small || null;
}
