export interface OmbiSearchMovieResult {
  id?: number;

  title?: string;
  originalTitle?: string;

  overview?: string;

  releaseDate?: string;
  posterPath?: string;

  approved?: boolean;
  denied?: boolean | null;
  deniedReason?: string | null;

  requested?: boolean;
  requestId?: number;

  available?: boolean;

  alreadyInCp?: boolean;

  embyUrl?: string | null;
  plexUrl?: string | null;
  jellyfinUrl?: string | null;

  quality?: string | null;

  theMovieDbId?: string | null;
  imdbId?: string | null;
  theTvDbId?: string | null;
}

export interface OmbiSearchTvResult {
  id?: number;

  title?: string;

  aliases?: string[] | null;

  seriesId?: number;

  firstAired?: string;

  overview?: string;

  posterPath?: string | null;
  backdropPath?: string | null;

  approved?: boolean;
  denied?: boolean | null;

  requested?: boolean;
  requestId?: number;

  available?: boolean;

  theTvDbId?: string | null;
  theMovieDbId?: string | null;

  embyUrl?: string | null;
  plexUrl?: string | null;
  jellyfinUrl?: string | null;

  quality?: string | null;
}

export interface OmbiRequestResponse {
  result?: boolean;

  message?: string | null;

  isError?: boolean;

  errorMessage?: string | null;
  errorCode?: string | null;

  requestId?: number;
}


export interface OmbiUser {
  id: string;
  userName: string;
  alias?: string | null;
}

export interface OmbiNotificationPreference {
  userId: string;
  agent: number;
  enabled: boolean;
  value?: string | null;
  id?: number;
}


export interface OmbiTvRequestPayload {
  theMovieDbId: number;

  requestAll: boolean;
  firstSeason: boolean;
  latestSeason: boolean;

  seasons: Array<{
    seasonNumber: number;
    episodes: Array<{
      episodeNumber: number;
    }>;
  }>;

  languageCode?: string;
}
