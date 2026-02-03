import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "./Layout";
import { IconPlus } from "./Icons";
import type {
  QueueTrack,
  SearchAllResponse,
  SearchAlbum,
  SearchArtist,
  SearchTrack
} from "../lib/types";

type SearchTab = "tracks" | "albums" | "artists";

type SearchProps = {
  connected: boolean;
  onSearchAll: (query: string) => Promise<SearchAllResponse | null>;
  onAddToQueue: (track: QueueTrack) => Promise<void>;
  onPlayAlbum?: (albumId: string) => Promise<void>;
};

export function Search({ connected, onSearchAll, onAddToQueue, onPlayAlbum }: SearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("tracks");
  const [tracks, setTracks] = useState<SearchTrack[]>([]);
  const [albums, setAlbums] = useState<SearchAlbum[]>([]);
  const [artists, setArtists] = useState<SearchArtist[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed || !connected) {
      return;
    }
    setLoading(true);
    setHasSearched(true);
    const data = await onSearchAll(trimmed);
    if (data) {
      setTracks(data.tracks?.items?.slice(0, 12) || []);
      setAlbums(data.albums?.items?.slice(0, 12) || []);
      setArtists(data.artists?.items?.slice(0, 12) || []);
    } else {
      setTracks([]);
      setAlbums([]);
      setArtists([]);
    }
    setLoading(false);
  };

  const handleAddToQueue = async (track: SearchTrack) => {
    setAddingId(track.id);
    try {
      const artistName = track.performer?.name ||
        (typeof track.artist === "string" ? track.artist : track.artist?.name) ||
        "Unknown artist";
      const albumTitle = typeof track.album === "string"
        ? track.album
        : track.album?.title || "Unknown album";
      const artworkUrl = getTrackImage(track);

      const queueTrack: QueueTrack = {
        id: track.id,
        title: track.title,
        artist: artistName,
        album: albumTitle,
        duration_secs: track.duration,
        artwork_url: artworkUrl,
        streamable: true
      };

      await onAddToQueue(queueTrack);
    } finally {
      setAddingId(null);
    }
  };

  const handlePlayAlbum = async (album: SearchAlbum) => {
    if (onPlayAlbum) {
      await onPlayAlbum(album.id);
    }
  };

  const getResultCount = (tab: SearchTab): number => {
    switch (tab) {
      case "tracks": return tracks.length;
      case "albums": return albums.length;
      case "artists": return artists.length;
    }
  };

  const hasResults = tracks.length > 0 || albums.length > 0 || artists.length > 0;

  return (
    <Layout isConnected={connected}>
      <div className="stack">
        {!connected ? (
          <div className="card">
            <div className="section-subtitle">{t('pairing.title')}</div>
            <p className="text-secondary">{t('search.hint')}</p>
          </div>
        ) : null}

        <div className="field">
          <input
            type="search"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch();
              }
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button className="primary" disabled={!connected} onClick={handleSearch}>
            {loading ? t('search.searching') : t('search.title')}
          </button>
        </div>

        {hasSearched && hasResults && (
          <div className="search-tabs">
            <button
              className={`search-tab ${activeTab === "tracks" ? "active" : ""}`}
              onClick={() => setActiveTab("tracks")}
            >
              {t('search.tracks')} ({getResultCount("tracks")})
            </button>
            <button
              className={`search-tab ${activeTab === "albums" ? "active" : ""}`}
              onClick={() => setActiveTab("albums")}
            >
              {t('search.albums')} ({getResultCount("albums")})
            </button>
            <button
              className={`search-tab ${activeTab === "artists" ? "active" : ""}`}
              onClick={() => setActiveTab("artists")}
            >
              {t('search.artists')} ({getResultCount("artists")})
            </button>
          </div>
        )}

        {activeTab === "tracks" && (
          <div className="list">
            {tracks.map((track) => (
              <div className="list-item" key={track.id}>
                <div className="list-thumb">
                  {getTrackImage(track) ? (
                    <img src={getTrackImage(track)!} alt={track.title} />
                  ) : (
                    <div className="thumb-placeholder" />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="list-title">{track.title}</div>
                  <div className="list-subtitle">
                    {track.performer?.name ||
                      (typeof track.artist === "string" ? track.artist : track.artist?.name) ||
                      "Unknown artist"}
                  </div>
                </div>
                <button
                  className="add-btn"
                  onClick={() => handleAddToQueue(track)}
                  disabled={addingId === track.id}
                  aria-label={t("queue.addToQueue")}
                >
                  <IconPlus size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "albums" && (
          <div className="list">
            {albums.map((album) => (
              <div
                className="list-item clickable"
                key={album.id}
                onClick={() => handlePlayAlbum(album)}
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
              </div>
            ))}
          </div>
        )}

        {activeTab === "artists" && (
          <div className="list">
            {artists.map((artist) => (
              <div className="list-item" key={artist.id}>
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
                      {t('search.albumCount', { count: artist.albums_count })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasSearched && !hasResults && !loading ? (
          <div className="card">
            <div className="section-subtitle">{t('search.noResults')}</div>
            <p className="text-secondary">{t('search.noResultsDesc')}</p>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}

function getTrackImage(track: SearchTrack): string | null {
  if (track.album && typeof track.album === "object") {
    const image = track.album.image;
    return (
      image?.mega ||
      image?.extralarge ||
      image?.large ||
      image?.thumbnail ||
      image?.small ||
      null
    );
  }
  return null;
}

function getAlbumImage(album: SearchAlbum): string | null {
  const image = album.image;
  if (!image) return null;
  return (
    image.mega ||
    image.extralarge ||
    image.large ||
    image.thumbnail ||
    image.small ||
    null
  );
}
