import type {
  RequestMediaType,
  RequestProvider,
  RequestProviderCapabilities,
  RequestSearchResult,
  RequestStatus,
  RequestSubmissionResult,
} from '../request-provider.js';

import { OmbiClient } from './ombi-client.js';
import type {
  OmbiMultiSearchResult,
  OmbiRequestResponse,
  OmbiSearchMovieResult,
  OmbiTvRequestPayload,
} from './ombi-types.js';

function parseYear(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const year = Number.parseInt(value.slice(0, 4), 10);
  return Number.isFinite(year) ? year : undefined;
}

function mapMovie(item: OmbiSearchMovieResult): RequestSearchResult | undefined {
  if (item.id === undefined || !item.title) return undefined;
  return {
    providerId: String(item.id),
    mediaType: 'movie',
    title: item.title,
    originalTitle: item.originalTitle,
    year: parseYear(item.releaseDate),
    overview: item.overview,
    posterUrl: item.posterPath,
    status: item.available ? 'available' : item.requested ? 'requested' : 'unavailable',
    requested: item.requested ?? false,
    available: item.available ?? false,
  };
}

function mapSeries(item: OmbiMultiSearchResult): RequestSearchResult | undefined {
  if (!item.id || !item.title || item.mediaType?.toLowerCase() !== 'tv') return undefined;
  const titleMatch = item.title.match(/^(.*?)(?:\s+\((\d{4})\))?$/);
  const title = titleMatch?.[1]?.trim() || item.title;
  const year = titleMatch?.[2] ? Number.parseInt(titleMatch[2], 10) : undefined;
  return {
    providerId: item.id,
    mediaType: 'series',
    title,
    originalTitle: undefined,
    year,
    overview: item.overview ?? undefined,
    posterUrl: item.poster ?? undefined,
    status: 'unavailable',
    requested: false,
    available: false,
  };
}

export interface OmbiRequestProviderOptions {
  autoApprove: boolean;
}

export class OmbiRequestProvider implements RequestProvider {
  readonly name = 'Ombi';

  constructor(
    private readonly client: OmbiClient,
    private readonly options: OmbiRequestProviderOptions,
  ) {}

  async healthCheck(): Promise<void> {
    await this.client.get<unknown>('/api/v1/Status');
  }

  async getCapabilities(): Promise<RequestProviderCapabilities> {
    return {
      movies: true,
      series: true,
      requestStatus: true,
      autoApproval: true,
    };
  }

  async search(
    query: string,
    mediaType: RequestMediaType,
  ): Promise<RequestSearchResult[]> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return [];

    if (mediaType === 'movie') {
      const results = await this.client.get<OmbiSearchMovieResult[]>(
        `/api/v1/Search/movie/${encodeURIComponent(normalizedQuery)}`,
      );
      return results.map(mapMovie).filter((item): item is RequestSearchResult => item !== undefined);
    }

    const results = await this.client.post<OmbiMultiSearchResult[]>(
      `/api/v2/Search/multi/${encodeURIComponent(normalizedQuery)}`,
      { movies: false, tvShows: true, music: false, people: false },
    );
    return results.map(mapSeries).filter((item): item is RequestSearchResult => item !== undefined);
  }

  async request(
    item: RequestSearchResult,
    options?: { autoApprove?: boolean; requester?: { source: 'discord'; id: string } },
  ): Promise<RequestSubmissionResult> {
    if (item.available) {
      return { success: false, providerRequestId: undefined, status: 'available', message: 'This media is already available.' };
    }
    if (item.requested) {
      return { success: false, providerRequestId: undefined, status: 'requested', message: 'This media has already been requested.' };
    }

    const autoApprove = options?.autoApprove ?? this.options.autoApprove;

    if (item.mediaType === 'movie') {
      const movieId = Number.parseInt(item.providerId, 10);
      if (!Number.isInteger(movieId)) throw new Error('Invalid Ombi movie identifier.');

      const response = await this.client.post<OmbiRequestResponse>(
        '/api/v1/Request/movie',
        { theMovieDbId: movieId },
      );
      const requestId = response.requestId;
      if (response.result !== true || response.isError === true || !requestId || requestId <= 0) {
        return { success: false, providerRequestId: requestId ? String(requestId) : undefined, status: 'unknown', message: response.errorMessage ?? response.message ?? 'Ombi did not create the request.' };
      }

      if (!autoApprove) {
        return { success: true, providerRequestId: String(requestId), status: 'pending', message: 'Request submitted to Ombi for approval.' };
      }

      const approval = await this.client.post<OmbiRequestResponse>(
        '/api/v1/Request/movie/approve',
        { id: requestId, is4K: false },
      );
      if (approval.result !== true || approval.isError === true) {
        return { success: true, providerRequestId: String(requestId), status: 'pending', message: approval.errorMessage ?? approval.message ?? 'The request was created, but automatic approval failed.' };
      }
      return { success: true, providerRequestId: String(requestId), status: 'approved', message: 'Request submitted and automatically approved.' };
    }

    const tvId = Number.parseInt(item.providerId, 10);
    if (!Number.isInteger(tvId)) throw new Error('Invalid Ombi TV identifier.');

    const payload: OmbiTvRequestPayload = {
      theMovieDbId: tvId,
      requestAll: true,
      firstSeason: false,
      latestSeason: false,
      seasons: [],
      languageCode: 'en',
    };
    const response = await this.client.post<OmbiRequestResponse>('/api/v2/Requests/tv', payload);
    const requestId = response.requestId;
    if (response.result !== true || response.isError === true || !requestId || requestId <= 0) {
      return { success: false, providerRequestId: requestId ? String(requestId) : undefined, status: 'unknown', message: response.errorMessage ?? response.message ?? 'Ombi did not create the TV request.' };
    }

    if (!autoApprove) {
      return { success: true, providerRequestId: String(requestId), status: 'pending', message: 'TV request submitted to Ombi for approval.' };
    }

    const approval = await this.client.post<OmbiRequestResponse>('/api/v1/Request/tv/approve', { id: requestId });
    if (approval.result !== true || approval.isError === true) {
      return { success: true, providerRequestId: String(requestId), status: 'pending', message: approval.errorMessage ?? approval.message ?? 'The TV request was created, but automatic approval failed.' };
    }
    return { success: true, providerRequestId: String(requestId), status: 'approved', message: 'TV request submitted and automatically approved.' };
  }

  async getRequestStatus(
    _providerId: string,
    _mediaType: RequestMediaType,
  ): Promise<RequestStatus> {
    return 'unknown';
  }
}
