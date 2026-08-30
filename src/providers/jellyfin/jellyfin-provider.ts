import type {
  MediaItem,
  MediaMovie,
  MediaPoster,
  MediaProvider,
  MediaSeries,
  MediaServerInfo,
} from '../media-provider.js';

export class JellyfinMediaProvider
implements MediaProvider {
  readonly name = 'jellyfin';

  async getSystemInfo(): Promise<MediaServerInfo> {
    throw new Error(
      'Jellyfin provider is not implemented yet.',
    );
  }

  async searchMovies(
    _searchTerm: string,
  ): Promise<MediaMovie[]> {
    throw new Error(
      'Jellyfin provider is not implemented yet.',
    );
  }

  async searchSeries(
    _searchTerm: string,
  ): Promise<MediaSeries[]> {
    throw new Error(
      'Jellyfin provider is not implemented yet.',
    );
  }

  async getLatestItems(): Promise<MediaItem[]> {
    throw new Error(
      'Jellyfin provider is not implemented yet.',
    );
  }

  async getRandomMovie(): Promise<MediaMovie | undefined> {
    throw new Error(
      'Jellyfin provider is not implemented yet.',
    );
  }

  async getMovieById(
    _movieId: string,
  ): Promise<MediaMovie | undefined> {
    throw new Error(
      'Jellyfin provider is not implemented yet.',
    );
  }

  async getPoster(
    _itemId: string,
  ): Promise<MediaPoster | undefined> {
    throw new Error(
      'Jellyfin provider is not implemented yet.',
    );
  }

  async getEventArtwork(
    _itemId: string,
  ): Promise<MediaPoster | undefined> {
    throw new Error(
      'Jellyfin provider is not implemented yet.',
    );
  }
}