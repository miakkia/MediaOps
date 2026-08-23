export interface OmbiSearchMovieResult {
  id?: number;
  title?: string;
  originalTitle?: string;
  overview?: string;
  releaseDate?: string;
  posterPath?: string;
  requested?: boolean;
  requestId?: number;
  available?: boolean;
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

export interface OmbiMultiSearchResult {
  id: string;
  title?: string;
  mediaType?: string;
  poster?: string | null;
  overview?: string | null;
}
