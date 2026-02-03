import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Layout } from "./Layout";
import { IconPlus } from "./Icons";
import type { QueueTrack, SearchResultsPage, SearchTrack } from "../lib/types";

type SearchProps = {
  connected: boolean;
  onSearch: (query: string) => Promise<SearchResultsPage<SearchTrack> | null>;
  onAddToQueue: (track: QueueTrack) => Promise<void>;
};

export function Search({ connected, onSearch, onAddToQueue }: SearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchTrack[]>([]);
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
    const data = await onSearch(trimmed);
    setResults(data?.items?.slice(0, 8) || []);
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

        <div className="list">
          {results.map((track) => (
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

        {hasSearched && results.length === 0 && !loading ? (
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
