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
  OmbiRequestResponse,
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

interface OmbiRequestProviderOptions {
  autoApprove: boolean;
}

export class OmbiRequestProvider
  implements RequestProvider {
  readonly name =
    'Ombi';

  constructor(
    private readonly client:
      OmbiClient,

    private readonly options:
      OmbiRequestProviderOptions,
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
      autoApproval: true,
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
    item: RequestSearchResult,
    options?: {
      autoApprove?: boolean;
    },
  ): Promise<RequestSubmissionResult> {
    if (item.available) {
      return {
        success: false,
        providerRequestId:
          undefined,
        status:
          'available',
        message:
          'This media is already available.',
      };
    }

    if (item.requested) {
      return {
        success: false,
        providerRequestId:
          undefined,
        status:
          'requested',
        message:
          'This media has already been requested.',
      };
    }

    const autoApprove =
      options?.autoApprove ??
      this.options.autoApprove;

    void autoApprove;

    if (item.mediaType === 'movie') {
      const movieId =
        Number.parseInt(
          item.providerId,
          10,
        );

      if (
        !Number.isInteger(
          movieId,
        )
      ) {
        throw new Error(
          'Invalid Ombi movie identifier.',
        );
      }

      const response =
        await this.client.post<
          OmbiRequestResponse
        >(
          '/api/v1/Request/movie',
          {
            theMovieDbId:
              movieId,
          },
        );

      const success =
        response.result === true &&
        response.isError !== true;

      const requestId =
        response.requestId;

      if (
        !success ||
        requestId === undefined ||
        requestId <= 0
      ) {
        return {
          success: false,

          providerRequestId:
            requestId !== undefined &&
            requestId > 0
              ? String(
                  requestId,
                )
              : undefined,

          status:
            'unknown',

          message:
            response.errorMessage ??
            response.message ??
            'Ombi did not create the request.',
        };
      }

      if (!autoApprove) {
        return {
          success: true,

          providerRequestId:
            String(
              requestId,
            ),

          status:
            'pending',

          message:
            response.message ??
            'Request submitted to Ombi for approval.',
        };
      }

      const approval =
        await this.client.post<
          OmbiRequestResponse
        >(
          '/api/v1/Request/movie/approve',
          {
            id:
              requestId,

            is4K:
              false,
          },
        );

      const approved =
        approval.result === true &&
        approval.isError !== true;

      if (!approved) {
        return {
          success: true,

          providerRequestId:
            String(
              requestId,
            ),

          status:
            'pending',

          message:
            approval.errorMessage ??
            approval.message ??
            'The request was created, but automatic approval failed.',
        };
      }

      return {
        success: true,

        providerRequestId:
          String(
            requestId,
          ),

        status:
          'approved',

        message:
          approval.message ??
          'Request submitted and automatically approved.',
      };
    }

    throw new Error(
      'Ombi TV request submission is not implemented yet.',
    );
  }

  async getRequestStatus(
    _providerId: string,
    _mediaType: RequestMediaType,
  ): Promise<RequestStatus> {
    return 'unknown';
  }
}
