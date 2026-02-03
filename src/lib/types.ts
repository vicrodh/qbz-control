export type ApiConfig = {
  baseUrl: string;
  token: string;
};

export type PingResponse = {
  ok: boolean;
  name: string;
  version: string;
};

export type PlaybackState = {
  is_playing: boolean;
  position: number;
  duration: number;
  track_id: number;
  volume: number;
};

export type QueueTrack = {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration_secs: number;
  artwork_url?: string | null;
  is_local?: boolean;
  streamable?: boolean;
};

export type NowPlayingResponse = {
  playback: PlaybackState;
  track: QueueTrack | null;
};

export type SearchResultsPage<T> = {
  items: T[];
  total: number;
  offset: number;
  limit: number;
};

export type SearchTrack = {
  id: number;
  title: string;
  performer?: { name: string };
  artist?: string | { name: string };
  album?: { title: string; image?: ImageSet } | string;
  duration: number;
};

export type ImageSet = {
  small?: string | null;
  thumbnail?: string | null;
  large?: string | null;
  extralarge?: string | null;
  mega?: string | null;
  back?: string | null;
};

export type QueueAddResponse = {
  success: boolean;
  queueLength: number;
};

export type RepeatMode = 'Off' | 'All' | 'One';

export type QueueStateResponse = {
  current_track: QueueTrack | null;
  current_index: number | null;
  upcoming: QueueTrack[];
  history: QueueTrack[];
  shuffle: boolean;
  repeat: RepeatMode;
  total_tracks: number;
};

export type SearchArtist = {
  id: number;
  name: string;
  picture?: string | null;
  albums_count?: number;
};

export type SearchAlbum = {
  id: string;
  title: string;
  artist: { id: number; name: string };
  image?: ImageSet;
  tracks_count?: number;
  released_at?: number;
  genre?: { name: string };
  hires?: boolean;
};

export type SearchAllResponse = {
  albums: SearchResultsPage<SearchAlbum>;
  tracks: SearchResultsPage<SearchTrack>;
  artists: SearchResultsPage<SearchArtist>;
  playlists: SearchResultsPage<unknown>;
  most_popular?: unknown;
};

export type FavoriteTrack = {
  id: number;
  title: string;
  performer: { id: number; name: string };
  album: { id: string; title: string; image?: ImageSet };
  duration: number;
  hires?: boolean;
  streamable: boolean;
};

export type FavoriteAlbum = {
  id: string;
  title: string;
  artist: { id: number; name: string };
  image?: ImageSet;
  tracks_count?: number;
  hires?: boolean;
};

export type FavoriteArtist = {
  id: number;
  name: string;
  picture?: string;
  albums_count?: number;
};

export type FavoritesResponse = {
  items: FavoriteTrack[] | FavoriteAlbum[] | FavoriteArtist[];
  total?: number;
  limit?: number;
  offset?: number;
};

export type FavoriteType = 'albums' | 'tracks' | 'artists';
