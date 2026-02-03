import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout } from "./Layout";
import type { ImageSet } from "../lib/types";

type ArtistAlbum = {
  id: string;
  title: string;
  image?: ImageSet;
  release_date_original?: string;
  hires: boolean;
};

type ArtistDetail = {
  id: number;
  name: string;
  picture?: string;
  albums_count?: number;
  biography?: { content?: string };
  albums?: { items: ArtistAlbum[] };
};

type ArtistProps = {
  connected: boolean;
  onGetArtist: (artistId: string) => Promise<ArtistDetail | null>;
  onPlayAlbum: (albumId: string) => Promise<void>;
};

export function Artist({ connected, onGetArtist, onPlayAlbum }: ArtistProps) {
  const { t } = useTranslation();
  const { artistId } = useParams<{ artistId: string }>();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artistId || !connected) {
      setLoading(false);
      return;
    }
    setLoading(true);
    onGetArtist(artistId).then((data) => {
      setArtist(data);
      setLoading(false);
    });
  }, [artistId, connected, onGetArtist]);

  const handleAlbumClick = async (albumId: string) => {
    navigate(`/album/${albumId}`);
  };

  const handlePlayAlbum = async (albumId: string) => {
    await onPlayAlbum(albumId);
    navigate("/controls");
  };

  const getAlbumImage = (album: ArtistAlbum): string | null => {
    if (!album.image) return null;
    return album.image.large || album.image.thumbnail || album.image.small || null;
  };

  if (loading) {
    return (
      <Layout isConnected={connected}>
        <div className="loading-container">
          <div className="loading-text">{t("artist.loading")}</div>
        </div>
      </Layout>
    );
  }

  if (!artist) {
    return (
      <Layout isConnected={connected}>
        <div className="card">
          <div className="section-subtitle">{t("artist.notFound")}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout isConnected={connected}>
      <div className="stack">
        <div className="artist-header">
          <div className="artist-picture">
            {artist.picture ? (
              <img src={artist.picture} alt={artist.name} />
            ) : (
              <div className="artist-picture-placeholder" />
            )}
          </div>
          <div className="artist-info">
            <h1 className="artist-name">{artist.name}</h1>
            {artist.albums_count && (
              <div className="artist-meta">
                {t("artist.albumCount", { count: artist.albums_count })}
              </div>
            )}
          </div>
        </div>

        {artist.biography?.content && (
          <div className="artist-bio">
            <p>{artist.biography.content.slice(0, 300)}...</p>
          </div>
        )}

        {artist.albums && artist.albums.items.length > 0 && (
          <>
            <h2 className="section-title">{t("artist.albums")}</h2>
            <div className="album-grid">
              {artist.albums.items.map((album) => (
                <div
                  className="album-card"
                  key={album.id}
                  onClick={() => handleAlbumClick(album.id)}
                >
                  <div className="album-card-cover">
                    {getAlbumImage(album) ? (
                      <img src={getAlbumImage(album)!} alt={album.title} />
                    ) : (
                      <div className="album-card-placeholder" />
                    )}
                    <button
                      className="album-card-play"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayAlbum(album.id);
                      }}
                      aria-label={t("album.play")}
                    >
                      ▶
                    </button>
                  </div>
                  <div className="album-card-title">
                    {album.title}
                    {album.hires && <span className="hires-badge-small">HR</span>}
                  </div>
                  {album.release_date_original && (
                    <div className="album-card-year">
                      {album.release_date_original.split("-")[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
