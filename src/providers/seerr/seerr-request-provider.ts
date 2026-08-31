import type {
  RequestMediaType,
  RequestProvider,
  RequestProviderCapabilities,
  RequestSearchResult,
  RequestStatus,
  RequestSubmissionResult,
} from '../request-provider.js';

import {
  seerrFetch,
} from './seerr-client.js';

const MAX_SEARCH_LENGTH =
  100;

const MAX_SEARCH_RESULTS =
  5;

interface SeerrMediaInfo {
  status?: number;
}

interface SeerrSearchResult {
  id?: number;
  mediaType?: string;

  title?: string;
  originalTitle?: string;
  releaseDate?: string;

  name?: string;
  originalName?: string;
  firstAirDate?: string;

  overview?: string;
  posterPath?: string;

  mediaInfo?: SeerrMediaInfo;
}

interface SeerrSearchResponse {
  results?: SeerrSearchResult[];
}

interface SeerrRequestResponse {
  id?: number;
  status?: number;
}

function parseYear(
  value:
    string |
    undefined,
): number | undefined {
  if (!value) {
    return undefined;
  }

  const match =
    value.match(
      /\b(\d{4})\b/,
    );

  if (!match?.[1]) {
    return undefined;
  }

  const year =
    Number.parseInt(
      match[1],
      10,
    );

  return Number.isInteger(
    year,
  )
    ? year
    : undefined;
}

function normalizeQuery(
  query:
    string,
): string {
  const normalized =
    query.trim();

  if (!normalized) {
    throw new Error(
      'Seerr search query cannot be empty.',
    );
  }

  if (
    normalized.length >
    MAX_SEARCH_LENGTH
  ) {
    throw new Error(
      'Seerr search query is too long.',
    );
  }

  return normalized;
}

function parseProviderId(
  providerId:
    string,
): number {
  const normalized =
    providerId.trim();

  if (
    !/^\d+$/.test(
      normalized,
    )
  ) {
    throw new Error(
      'Invalid Seerr media identifier.',
    );
  }

  const id =
    Number.parseInt(
      normalized,
      10,
    );

  if (
    !Number.isSafeInteger(
      id,
    ) ||
    id <= 0
  ) {
    throw new Error(
      'Invalid Seerr media identifier.',
    );
  }

  return id;
}

function mediaStatusIsAvailable(
  status:
    number |
    undefined,
): boolean {
  return status === 5;
}

function mediaStatusIsRequested(
  status:
    number |
    undefined,
): boolean {
  return (
    status === 2 ||
    status === 3 ||
    status === 4
  );
}

function mapMediaStatus(
  status:
    number |
    undefined,
): RequestStatus {
  if (
    mediaStatusIsAvailable(
      status,
    )
  ) {
    return 'available';
  }

  if (
    mediaStatusIsRequested(
      status,
    )
  ) {
    return 'requested';
  }

  return 'unavailable';
}

function mapRequestStatus(
  status:
    number |
    undefined,
): RequestStatus {
  switch (status) {
    case 1:
      return 'pending';

    case 2:
      return 'approved';

    case 3:
      return 'unavailable';

    case 4:
      return 'unavailable';

    case 5:
      return 'available';

    default:
      return 'unknown';
  }
}

function mapSearchResult(
  item:
    SeerrSearchResult,
  mediaType:
    RequestMediaType,
): RequestSearchResult | undefined {
  if (
    !Number.isSafeInteger(
      item.id,
    ) ||
    (item.id ?? 0) <= 0
  ) {
    return undefined;
  }

  const itemType =
    item.mediaType
      ?.trim()
      .toLowerCase();

  if (
    mediaType === 'movie' &&
    itemType !== 'movie'
  ) {
    return undefined;
  }

  if (
    mediaType === 'series' &&
    itemType !== 'tv'
  ) {
    return undefined;
  }

  const title =
    mediaType === 'movie'
      ? item.title
      : item.name;

  if (!title?.trim()) {
    return undefined;
  }

  const mediaStatus =
    item.mediaInfo?.status;

  return {
    providerId:
      String(
        item.id,
      ),

    mediaType,

    title:
      title.trim(),

    originalTitle:
      mediaType === 'movie'
        ? item.originalTitle
        : item.originalName,

    year:
      parseYear(
        mediaType === 'movie'
          ? item.releaseDate
          : item.firstAirDate,
      ),

    overview:
      item.overview,

    posterUrl:
      item.posterPath,

    status:
      mapMediaStatus(
        mediaStatus,
      ),

    requested:
      mediaStatusIsRequested(
        mediaStatus,
      ),

    available:
      mediaStatusIsAvailable(
        mediaStatus,
      ),
  };
}

export class SeerrRequestProvider
implements RequestProvider {
  readonly name =
    'Seerr';

  async healthCheck():
  Promise<void> {
    await seerrFetch(
      '/status',
    );
  }

  async getCapabilities():
  Promise<RequestProviderCapabilities> {
    return {
      movies:
        true,

      series:
        true,

      requestStatus:
        true,

      autoApproval:
        false,
    };
  }

  async search(
    query:
      string,
    mediaType:
      RequestMediaType,
  ): Promise<RequestSearchResult[]> {
    const normalizedQuery =
      normalizeQuery(
        query,
      );

    const params =
      new URLSearchParams({
        query:
          normalizedQuery,

        page:
          '1',
      });

    const response =
      await seerrFetch(
        `/search?${params.toString()}`,
      );

    const payload =
      await response.json() as
        SeerrSearchResponse;

    if (
      !Array.isArray(
        payload.results,
      )
    ) {
      throw new Error(
        'Invalid Seerr search response.',
      );
    }

    return payload.results
      .map(
        item =>
          mapSearchResult(
            item,
            mediaType,
          ),
      )
      .filter(
        (
          item,
        ): item is RequestSearchResult =>
          item !== undefined,
      )
      .slice(
        0,
        MAX_SEARCH_RESULTS,
      );
  }

  async request(
    item:
      RequestSearchResult,
    _options?: {
      autoApprove?: boolean;
      requester?: {
        source: 'discord';
        id: string;
      };
    },
  ): Promise<RequestSubmissionResult> {
    if (
      item.available
    ) {
      return {
        success:
          false,

        providerRequestId:
          undefined,

        status:
          'available',

        message:
          'This media is already available.',
      };
    }

    if (
      item.requested
    ) {
      return {
        success:
          false,

        providerRequestId:
          undefined,

        status:
          'requested',

        message:
          'This media has already been requested.',
      };
    }

    const mediaId =
      parseProviderId(
        item.providerId,
      );

    const body =
      item.mediaType === 'movie'
        ? {
            mediaType:
              'movie',

            mediaId,
          }
        : {
            mediaType:
              'tv',

            mediaId,

            seasons:
              'all',
          };

    const response =
      await seerrFetch(
        '/request',
        {
          method:
            'POST',

          body,
        },
      );

    const payload =
      await response.json() as
        SeerrRequestResponse;

    if (
      !Number.isSafeInteger(
        payload.id,
      ) ||
      (payload.id ?? 0) <= 0
    ) {
      throw new Error(
        'Seerr returned an invalid request identifier.',
      );
    }

    const status =
      mapRequestStatus(
        payload.status,
      );

    return {
      success:
        true,

      providerRequestId:
        String(
          payload.id,
        ),

      status,

      message:
        status === 'approved'
          ? 'Request submitted and approved by Seerr.'
          : 'Request submitted to Seerr.',
    };
  }

  async getRequestStatus(
    _providerId:
      string,
    _mediaType:
      RequestMediaType,
  ): Promise<RequestStatus> {
    return 'unknown';
  }
}