import {
  getEmbyEventArtwork,
  getEmbyMovieById,
  getEmbyPoster,
  getEmbySystemInfo,
  getLatestEmbyItems,
  getRandomEmbyMovie,
  searchEmbyMovies,
  searchEmbySeries,
} from '../../services/emby.js';

import type {
  MediaItem,
  MediaMovie,
  MediaPoster,
  MediaProvider,
  MediaSeries,
  MediaServerInfo,
} from '../media-provider.js';

export class EmbyMediaProvider
implements MediaProvider {
  readonly name = 'emby';

  async getSystemInfo(): Promise<MediaServerInfo> {
    const info = await getEmbySystemInfo();
    return { serverName: info.ServerName, version: info.Version };
  }

  async searchMovies(searchTerm: string): Promise<MediaMovie[]> {
    return searchEmbyMovies(searchTerm);
  }

  async searchSeries(searchTerm: string): Promise<MediaSeries[]> {
    return searchEmbySeries(searchTerm);
  }

  async getLatestItems(): Promise<MediaItem[]> {
    return getLatestEmbyItems();
  }

  async getRandomMovie(): Promise<MediaMovie | undefined> {
    return getRandomEmbyMovie();
  }

  async getMovieById(movieId: string): Promise<MediaMovie | undefined> {
    return getEmbyMovieById(movieId);
  }

  async getPoster(itemId: string): Promise<MediaPoster | undefined> {
    return getEmbyPoster(itemId);
  }

  async getEventArtwork(itemId: string): Promise<MediaPoster | undefined> {
    return getEmbyEventArtwork(itemId);
  }
}
