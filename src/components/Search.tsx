import { useState } from "react";
import { Layout } from "./Layout";
import type { SearchResultsPage, SearchTrack } from "../lib/types";

type SearchProps = {
  connected: boolean;
  onSearch: (query: string) => Promise<SearchResultsPage<SearchTrack> | null>;
};

export function Search({ connected, onSearch }: SearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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

  return (
    <Layout isConnected={connected}>
      <div className="stack">
        {!connected ? (
          <div className="card">
            <div className="section-subtitle">Connect to QBZ</div>
            <p className="text-secondary">Pair with the desktop app to enable search.</p>
          </div>
        ) : null}

        <div className="field">
          <input
            type="search"
            placeholder="Search tracks"
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
            {loading ? "Searching..." : "Search"}
          </button>
          <button className="ghost" disabled>
            Tracks
          </button>
          <button className="ghost" disabled>
            Albums
          </button>
          <button className="ghost" disabled>
            Artists
          </button>
        </div>

        <div className="list">
          {results.map((track) => (
            <div className="list-item" key={track.id}>
              <div className="list-thumb">
                {getTrackImage(track) ? (
                  <img src={getTrackImage(track)!} alt={track.title} />
                ) : null}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="list-title">{track.title}</div>
                <div className="list-subtitle">
                  {track.performer?.name ||
                    (typeof track.artist === "string" ? track.artist : track.artist?.name) ||
                    "Unknown artist"}
                </div>
              </div>
              <button className="secondary" disabled>
                +
              </button>
            </div>
          ))}
        </div>

        {hasSearched && results.length === 0 && !loading ? (
          <div className="card">
            <div className="section-subtitle">No results</div>
            <p className="text-secondary">Try a different query.</p>
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
