import type {
  MediaItem,
  MediaMovie,
  MediaPoster,
  MediaProvider,
  MediaSeries,
  MediaServerInfo,
} from '../media-provider.js';

import {
  jellyfinFetch,
} from './jellyfin-client.js';

export class JellyfinMediaProvider
implements MediaProvider {
  readonly name = 'jellyfin';

  async getSystemInfo(): Promise<MediaServerInfo> {
    const response =
      await jellyfinFetch(
        '/System/Info',
      );

    const data: unknown =
      await response.json();

    if (
      !data ||
      typeof data !== 'object'
    ) {
      throw new Error(
        'Jellyfin returned an invalid system information response.',
      );
    }

    const record =
      data as Record<string, unknown>;

    return {
      serverName:
        typeof record.ServerName === 'string'
          ? record.ServerName
          : undefined,

      version:
        typeof record.Version === 'string'
          ? record.Version
          : undefined,
    };
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