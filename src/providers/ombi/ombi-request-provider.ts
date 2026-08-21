import type {
  RequestMediaType,
  RequestProvider,
  RequestProviderCapabilities,
  RequestSearchResult,
  RequestStatus,
  RequestSubmissionResult,
} from '../request-provider.js';

import {
  OmbiClient,
} from './ombi-client.js';

import type {
  OmbiSearchMovieResult,
  OmbiSearchTvResult,
} from './ombi-types.js';

function parseYear(
  value: string | undefined,
): number | undefined {
  if (!value) {
    return undefined;
  }

  const year =
    Number.parseInt(
      value.slice(0, 4),
      10,
    );

  return Number.isFinite(year)
    ? year
    : undefined;
}

function getStatus(
  requested: boolean | undefined,
  available: boolean | undefined,
): RequestStatus {
  if (available) {
    return 'available';
  }

  if (requested) {
    return 'requested';
  }

  return 'unavailable';
}

function mapMovie(
  item: OmbiSearchMovieResult,
): RequestSearchResult | undefined {
  if (
    item.id === undefined ||
    !item.title
  ) {
    return undefined;
  }

  return {
    providerId:
      String(item.id),

    mediaType:
      'movie',

    title:
      item.title,

    originalTitle:
      item.originalTitle,

    year:
      parseYear(
        item.releaseDate,
      ),

    overview:
      item.overview,

    posterUrl:
      item.posterPath,

    status:
      getStatus(
        item.requested,
        item.available,
      ),

    requested:
      item.requested ?? false,

    available:
      item.available ?? false,
  };
}

function mapSeries(
  item: OmbiSearchTvResult,
): RequestSearchResult | undefined {
  if (
    item.id === undefined ||
    !item.name
  ) {
    return undefined;
  }

  return {
    providerId:
      String(item.id),

    mediaType:
      'series',

    title:
      item.name,

    originalTitle:
      item.originalName,

    year:
      parseYear(
        item.firstAirDate,
      ),

    overview:
      item.overview,

    posterUrl:
      item.posterPath,

    status:
      getStatus(
        item.requested,
        item.available,
      ),

    requested:
      item.requested ?? false,

    available:
      item.available ?? false,
  };
}

export class OmbiRequestProvider
  implements RequestProvider {
  readonly name =
    'Ombi';

  constructor(
    private readonly client:
      OmbiClient,
  ) {}

  async healthCheck():
    Promise<void> {
    await this.client.get<unknown>(
      '/api/v1/Status',
    );
  }

  async getCapabilities():
    Promise<RequestProviderCapabilities> {
    return {
      movies: true,
      series: true,
      requestStatus: true,
      autoApproval: false,
    };
  }

  async search(
    query: string,
    mediaType: RequestMediaType,
  ): Promise<RequestSearchResult[]> {
    const normalizedQuery =
      query.trim();

    if (!normalizedQuery) {
      return [];
    }

    if (mediaType === 'movie') {
      const results =
        await this.client.get<
          OmbiSearchMovieResult[]
        >(
          `/api/v1/Search/movie/${encodeURIComponent(
            normalizedQuery,
          )}`,
        );

      return results
        .map(mapMovie)
        .filter(
          (
            item,
          ): item is RequestSearchResult =>
            item !== undefined,
        );
    }

    const results =
      await this.client.get<
        OmbiSearchTvResult[]
      >(
        `/api/v1/Search/tv/${encodeURIComponent(
          normalizedQuery,
        )}`,
      );

    return results
      .map(mapSeries)
      .filter(
        (
          item,
        ): item is RequestSearchResult =>
          item !== undefined,
      );
  }

  async request(
    _item: RequestSearchResult,
    _options?: {
      autoApprove?: boolean;
    },
  ): Promise<RequestSubmissionResult> {
    throw new Error(
      'Ombi request submission is not implemented yet.',
    );
  }

  async getRequestStatus(
    _providerId: string,
    _mediaType: RequestMediaType,
  ): Promise<RequestStatus> {
    return 'unknown';
  }
}
