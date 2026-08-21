export interface OmbiSearchMovieResult {
  id?: number;
  title?: string;
  originalTitle?: string;
  overview?: string;
  releaseDate?: string;
  posterPath?: string;
  requested?: boolean;
  available?: boolean;
}

export interface OmbiSearchTvResult {
  id?: number;
  name?: string;
  originalName?: string;
  overview?: string;
  firstAirDate?: string;
  posterPath?: string;
  requested?: boolean;
  available?: boolean;
}

export interface OmbiRequestResponse {
  result?: boolean;
  message?: string;
  requestId?: number;
}
