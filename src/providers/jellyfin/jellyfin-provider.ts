import type {
  MediaItem,
  MediaMovie,
  MediaPoster,
  MediaProvider,
  MediaSeries,
  MediaServerInfo,
  MediaType,
  SeriesLifecycleStatus,
} from '../media-provider.js';

import {
  jellyfinFetch,
} from './jellyfin-client.js';

const MAX_SEARCH_LENGTH = 100;
const MAX_SEARCH_RESULTS = 5;
const MAX_LATEST_RESULTS = 10;
const MAX_ITEM_ID_LENGTH = 128;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface JellyfinItemsQueryResult {
  items: MediaItem[];
  totalRecordCount: number | undefined;
}

function mapSeriesStatus(
  value: unknown,
): SeriesLifecycleStatus | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized =
    value
      .trim()
      .toLowerCase();

  if (
    normalized === 'ended' ||
    normalized === 'cancelled' ||
    normalized === 'canceled'
  ) {
    return 'ended';
  }

  if (
    normalized === 'continuing' ||
    normalized === 'returning series' ||
    normalized === 'in production'
  ) {
    return 'continuing';
  }

  return undefined;
}

function parseJellyfinMediaItem(
  value: unknown,
): MediaItem | undefined {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return undefined;
  }

  const item =
    value as Record<string, unknown>;

  if (
    typeof item.Id !== 'string' ||
    typeof item.Name !== 'string'
  ) {
    return undefined;
  }

  const type: MediaType | undefined =
    item.Type === 'Movie' ||
    item.Type === 'Series'
      ? item.Type
      : undefined;

  return {
    id:
      item.Id,

    name:
      item.Name,

    originalTitle:
      typeof item.OriginalTitle === 'string'
        ? item.OriginalTitle
        : undefined,

    sortName:
      typeof item.SortName === 'string'
        ? item.SortName
        : undefined,

    year:
      typeof item.ProductionYear === 'number'
        ? item.ProductionYear
        : undefined,

    overview:
      typeof item.Overview === 'string'
        ? item.Overview
        : undefined,

    type,

    dateCreated:
      typeof item.DateCreated === 'string'
        ? item.DateCreated
        : undefined,

    seriesStatus:
      type === 'Series'
        ? mapSeriesStatus(
            item.Status,
          )
        : undefined,
  };
}

function parseJellyfinItemsQueryResult(
  data: unknown,
  context: string,
): JellyfinItemsQueryResult {
  if (
    !data ||
    typeof data !== 'object'
  ) {
    throw new Error(
      `Jellyfin returned an invalid ${context} response.`,
    );
  }

  const record =
    data as Record<string, unknown>;

  if (
    !Array.isArray(
      record.Items,
    )
  ) {
    throw new Error(
      `Jellyfin returned an invalid ${context} response.`,
    );
  }

  const items: MediaItem[] =
    [];

  for (
    const item
    of record.Items
  ) {
    const parsedItem =
      parseJellyfinMediaItem(
        item,
      );

    if (parsedItem) {
      items.push(
        parsedItem,
      );
    }
  }

  const totalRecordCount =
    typeof record.TotalRecordCount === 'number' &&
    Number.isSafeInteger(
      record.TotalRecordCount,
    ) &&
    record.TotalRecordCount >= 0
      ? record.TotalRecordCount
      : undefined;

  return {
    items,
    totalRecordCount,
  };
}

function normalizeSearchTerm(
  searchTerm: string,
  mediaLabel: string,
): string {
  const normalizedSearchTerm =
    searchTerm.trim();

  if (
    normalizedSearchTerm.length === 0 ||
    normalizedSearchTerm.length > MAX_SEARCH_LENGTH
  ) {
    throw new Error(
      `${mediaLabel} search must contain between 1 and ${MAX_SEARCH_LENGTH} characters.`,
    );
  }

  return normalizedSearchTerm;
}

function normalizeJellyfinItemId(
  itemId: string,
): string {
  const normalizedItemId =
    itemId.trim();

  if (
    normalizedItemId.length === 0 ||
    normalizedItemId.length > MAX_ITEM_ID_LENGTH ||
    !/^[A-Za-z0-9_-]+$/.test(
      normalizedItemId,
    )
  ) {
    throw new Error(
      'Invalid Jellyfin item ID.',
    );
  }

  return normalizedItemId;
}

async function searchJellyfinItems(
  searchTerm: string,
  includeItemType: MediaType,
): Promise<MediaItem[]> {
  const normalizedSearchTerm =
    normalizeSearchTerm(
      searchTerm,
      includeItemType,
    );

  const params =
    new URLSearchParams({
      SearchTerm:
        normalizedSearchTerm,

      IncludeItemTypes:
        includeItemType,

      Recursive:
        'true',

      Limit:
        String(
          MAX_SEARCH_RESULTS,
        ),

      Fields:
        'Overview,DateCreated,OriginalTitle,SortName',
    });

  const response =
    await jellyfinFetch(
      `/Items?${params.toString()}`,
    );

  const data: unknown =
    await response.json();

  return parseJellyfinItemsQueryResult(
    data,
    `${includeItemType.toLowerCase()} search`,
  ).items;
}

async function getJellyfinImage(
  itemId: string,
  imageType: 'Primary' | 'Banner' | 'Backdrop',
  options = '',
): Promise<MediaPoster | undefined> {
  const normalizedItemId =
    normalizeJellyfinItemId(
      itemId,
    );

  let response: Response;

  try {
    response =
      await jellyfinFetch(
        `/Items/${encodeURIComponent(normalizedItemId)}/Images/${imageType}${options}`,
      );
  } catch {
    return undefined;
  }

  const contentType =
    response.headers
      .get('content-type')
      ?.split(';', 1)[0]
      ?.trim()
      .toLowerCase();

  if (
    !contentType?.startsWith(
      'image/',
    )
  ) {
    return undefined;
  }

  const contentLength =
    Number.parseInt(
      response.headers.get('content-length') ?? '',
      10,
    );

  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_IMAGE_BYTES
  ) {
    return undefined;
  }

  const buffer =
    await response.arrayBuffer();

  if (
    buffer.byteLength === 0 ||
    buffer.byteLength > MAX_IMAGE_BYTES
  ) {
    return undefined;
  }

  return {
    data:
      new Uint8Array(
        buffer,
      ),
    contentType,
  };
}

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
    searchTerm: string,
  ): Promise<MediaMovie[]> {
    return searchJellyfinItems(
      searchTerm,
      'Movie',
    );
  }

  async searchSeries(
    searchTerm: string,
  ): Promise<MediaSeries[]> {
    return searchJellyfinItems(
      searchTerm,
      'Series',
    );
  }

  async getLatestItems(): Promise<MediaItem[]> {
    const params =
      new URLSearchParams({
        IncludeItemTypes:
          'Movie,Series',

        Recursive:
          'true',

        SortBy:
          'DateCreated',

        SortOrder:
          'Descending',

        Limit:
          String(
            MAX_LATEST_RESULTS,
          ),

        Fields:
          'Overview,DateCreated,OriginalTitle,SortName',
      });

    const response =
      await jellyfinFetch(
        `/Items?${params.toString()}`,
      );

    const data: unknown =
      await response.json();

    return parseJellyfinItemsQueryResult(
      data,
      'latest items',
    ).items;
  }

  async getRandomMovie(): Promise<MediaMovie | undefined> {
    const params =
      new URLSearchParams({
        IncludeItemTypes:
          'Movie',

        Recursive:
          'true',

        SortBy:
          'Random',

        Limit:
          '1',

        Fields:
          'Overview,DateCreated,OriginalTitle,SortName',
      });

    const response =
      await jellyfinFetch(
        `/Items?${params.toString()}`,
      );

    const data: unknown =
      await response.json();

    const result =
      parseJellyfinItemsQueryResult(
        data,
        'random movie',
      );

    const movie =
      result.items[0];

    if (
      !movie ||
      movie.type !== 'Movie'
    ) {
      return undefined;
    }

    return movie;
  }

  async getMovieById(
    movieId: string,
  ): Promise<MediaMovie | undefined> {
    const normalizedMovieId =
      normalizeJellyfinItemId(
        movieId,
      );

    const params =
      new URLSearchParams({
        Ids:
          normalizedMovieId,

        IncludeItemTypes:
          'Movie',

        Recursive:
          'true',

        Limit:
          '1',

        Fields:
          'Overview,DateCreated,OriginalTitle,SortName',
      });

    const response =
      await jellyfinFetch(
        `/Items?${params.toString()}`,
      );

    const data: unknown =
      await response.json();

    const result =
      parseJellyfinItemsQueryResult(
        data,
        'movie lookup',
      );

    const movie =
      result.items[0];

    if (
      !movie ||
      movie.id !== normalizedMovieId ||
      movie.type !== 'Movie'
    ) {
      return undefined;
    }

    return movie;
  }

  async getPoster(
    itemId: string,
  ): Promise<MediaPoster | undefined> {
    return getJellyfinImage(
      itemId,
      'Primary',
      '?maxWidth=342&quality=90',
    );
  }

  async getEventArtwork(
    itemId: string,
  ): Promise<MediaPoster | undefined> {
    const banner =
      await getJellyfinImage(
        itemId,
        'Banner',
      );

    if (banner) {
      return banner;
    }

    return getJellyfinImage(
      itemId,
      'Backdrop',
    );
  }
}
