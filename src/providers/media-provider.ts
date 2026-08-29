export type MediaType =
  | 'Movie'
  | 'Series';

export type SeriesLifecycleStatus =
  | 'continuing'
  | 'ended';

export interface MediaPoster {
  data: Uint8Array;
  contentType: string;
}

export interface MediaServerInfo {
  serverName: string | undefined;
  version: string | undefined;
}

export interface MediaItem {
  id: string;
  name: string;
  originalTitle: string | undefined;
  sortName: string | undefined;
  year: number | undefined;
  overview: string | undefined;
  type: MediaType | undefined;
  dateCreated: string | undefined;
  seriesStatus?: SeriesLifecycleStatus | undefined;
}

export type MediaMovie = MediaItem;
export type MediaSeries = MediaItem;

export interface MediaProvider {
  readonly name: string;

  getSystemInfo(): Promise<MediaServerInfo>;

  searchMovies(
    searchTerm: string,
  ): Promise<MediaMovie[]>;

  searchSeries(
    searchTerm: string,
  ): Promise<MediaSeries[]>;

  getLatestItems(): Promise<MediaItem[]>;

  getRandomMovie(): Promise<MediaMovie | undefined>;

  getMovieById(
    movieId: string,
  ): Promise<MediaMovie | undefined>;

  getPoster(
    itemId: string,
  ): Promise<MediaPoster | undefined>;
}
