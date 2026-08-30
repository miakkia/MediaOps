import 'dotenv/config';

import {
  randomInt,
} from 'node:crypto';

const DEFAULT_TIMEOUT_MS = 5_000;
const MAX_SEARCH_RESULTS = 5;
const MAX_LATEST_RESULTS = 5;
const MAX_SEARCH_LENGTH = 100;
const MAX_ITEM_ID_LENGTH = 128;
const MAX_POSTER_BYTES = 5 * 1024 * 1024;

export interface EmbySystemInfo {
  ServerName: string | undefined;
  Version: string | undefined;
}

export type EmbyMediaType =
  | 'Movie'
  | 'Series';

export type EmbySeriesStatus =
  | 'continuing'
  | 'ended';

export interface EmbyMediaPoster {
  data: Uint8Array;
  contentType: string;
}

export interface EmbyMediaItem {
  id: string;
  name: string;
  originalTitle: string | undefined;
  sortName: string | undefined;
  year: number | undefined;
  overview: string | undefined;
  type: EmbyMediaType | undefined;
  dateCreated: string | undefined;
  seriesStatus: EmbySeriesStatus | undefined;
}

export type EmbyMovie =
  EmbyMediaItem;

export type EmbySeries =
  EmbyMediaItem;

interface EmbyItemsQueryResult {
  items: EmbyMediaItem[];
  totalRecordCount:
    number | undefined;
}

const rawEmbyUrl =
  process.env.EMBY_URL?.trim();

const rawEmbyApiKey =
  process.env.EMBY_API_KEY?.trim();

if (
  !rawEmbyUrl ||
  !rawEmbyApiKey
) {
  throw new Error(
    'EMBY_URL and EMBY_API_KEY are required.',
  );
}

const embyApiKey: string =
  rawEmbyApiKey;

let embyUrl: URL;

try {
  embyUrl =
    new URL(
      rawEmbyUrl,
    );
} catch {
  throw new Error(
    'EMBY_URL must be a valid URL.',
  );
}

if (
  ![
    'http:',
    'https:',
  ].includes(
    embyUrl.protocol,
  )
) {
  throw new Error(
    'EMBY_URL must use HTTP or HTTPS.',
  );
}

const baseUrl =
  embyUrl
    .toString()
    .replace(
      /\/+$/,
      '',
    );

async function embyFetch(
  path: string,
  timeoutMs =
    DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  try {
    const response =
      await fetch(
        `${baseUrl}${path}`,
        {
          method: 'GET',

          headers: {
            Accept:
              'application/json',

            'X-Emby-Token':
              embyApiKey,
          },

          redirect:
            'error',

          signal:
            AbortSignal.timeout(
              timeoutMs,
            ),
        },
      );

    if (!response.ok) {
      throw new Error(
        `Emby API request failed with HTTP ${response.status}.`,
      );
    }

    return response;
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'TimeoutError'
    ) {
      throw new Error(
        'Emby API request timed out.',
      );
    }

    throw error;
  }
}

function mapSeriesStatus(
  value: unknown,
): EmbySeriesStatus | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized =
    value.trim().toLowerCase();

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

function parseEmbyMediaItem(
  value: unknown,
): EmbyMediaItem | undefined {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return undefined;
  }

  const item =
    value as Record<
      string,
      unknown
    >;

  if (
    typeof item.Id !== 'string' ||
    typeof item.Name !== 'string'
  ) {
    return undefined;
  }

  const type:
    EmbyMediaType | undefined =
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
      typeof item.OriginalTitle ===
      'string'
        ? item.OriginalTitle
        : undefined,

    sortName:
      typeof item.SortName ===
      'string'
        ? item.SortName
        : undefined,

    year:
      typeof item.ProductionYear ===
      'number'
        ? item.ProductionYear
        : undefined,

    overview:
      typeof item.Overview ===
      'string'
        ? item.Overview
        : undefined,

    type,

    dateCreated:
      typeof item.DateCreated ===
      'string'
        ? item.DateCreated
        : undefined,

    seriesStatus:
      type === 'Series'
        ? mapSeriesStatus(item.Status)
        : undefined,
  };
}

function parseEmbyItemsQueryResult(
  data: unknown,
  context: string,
): EmbyItemsQueryResult {
  if (
    !data ||
    typeof data !== 'object'
  ) {
    throw new Error(
      `Emby returned an invalid ${context} response.`,
    );
  }

  const record =
    data as Record<
      string,
      unknown
    >;

  if (
    !Array.isArray(
      record.Items,
    )
  ) {
    throw new Error(
      `Emby returned an invalid ${context} response.`,
    );
  }

  const items:
    EmbyMediaItem[] = [];

  for (
    const item of
    record.Items
  ) {
    const parsedItem =
      parseEmbyMediaItem(
        item,
      );

    if (parsedItem) {
      items.push(
        parsedItem,
      );
    }
  }

  const totalRecordCount =
    typeof record.TotalRecordCount ===
      'number' &&
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

function parseEmbyItemsResponse(
  data: unknown,
  context: string,
): EmbyMediaItem[] {
  return parseEmbyItemsQueryResult(
    data,
    context,
  ).items;
}

function normalizeSearchTerm(
  searchTerm: string,
  mediaLabel: string,
): string {
  const normalizedSearchTerm =
    searchTerm.trim();

  if (
    normalizedSearchTerm.length ===
      0 ||
    normalizedSearchTerm.length >
      MAX_SEARCH_LENGTH
  ) {
    throw new Error(
      `${mediaLabel} search must contain between 1 and ${MAX_SEARCH_LENGTH} characters.`,
    );
  }

  return normalizedSearchTerm;
}

function normalizeEmbyItemId(
  itemId: string,
): string {
  const normalizedItemId =
    itemId.trim();

  if (
    normalizedItemId.length === 0 ||
    normalizedItemId.length >
      MAX_ITEM_ID_LENGTH ||
    !/^[A-Za-z0-9_-]+$/.test(
      normalizedItemId,
    )
  ) {
    throw new Error(
      'Invalid Emby item ID.',
    );
  }

  return normalizedItemId;
}

async function searchEmbyItems(
  searchTerm: string,
  includeItemType:
    EmbyMediaType,
): Promise<
  EmbyMediaItem[]
> {
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
        'Overview,ProductionYear,DateCreated,OriginalTitle,SortName,Status',
    });

  const response =
    await embyFetch(
      `/Items?${params.toString()}`,
    );

  const data: unknown =
    await response.json();

  return parseEmbyItemsResponse(
    data,
    `${includeItemType.toLowerCase()} search`,
  );
}

export async function getEmbySystemInfo(): Promise<EmbySystemInfo> {
  const response =
    await embyFetch(
      '/System/Info',
    );

  const data: unknown =
    await response.json();

  if (
    !data ||
    typeof data !== 'object'
  ) {
    throw new Error(
      'Emby returned an invalid system information response.',
    );
  }

  const record =
    data as Record<
      string,
      unknown
    >;

  return {
    ServerName:
      typeof record.ServerName ===
      'string'
        ? record.ServerName
        : undefined,

    Version:
      typeof record.Version ===
      'string'
        ? record.Version
        : undefined,
  };
}

export async function searchEmbyMovies(
  searchTerm: string,
): Promise<EmbyMovie[]> {
  return searchEmbyItems(
    searchTerm,
    'Movie',
  );
}

export async function searchEmbySeries(
  searchTerm: string,
): Promise<EmbySeries[]> {
  return searchEmbyItems(
    searchTerm,
    'Series',
  );
}

export async function getEmbyMovieById(
  movieId: string,
): Promise<EmbyMovie | undefined> {
  const normalizedMovieId =
    normalizeEmbyItemId(
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
        'Overview,ProductionYear,DateCreated,OriginalTitle,SortName,Status',
    });

  const response =
    await embyFetch(
      `/Items?${params.toString()}`,
    );

  const data: unknown =
    await response.json();

  const items =
    parseEmbyItemsResponse(
      data,
      'movie lookup',
    );

  const movie =
    items[0];

  if (
    !movie ||
    movie.id !==
      normalizedMovieId ||
    movie.type !== 'Movie'
  ) {
    return undefined;
  }

  return movie;
}

export async function getLatestEmbyItems(): Promise<EmbyMediaItem[]> {
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
        'Overview,ProductionYear,DateCreated,OriginalTitle,SortName,Status',
    });

  const response =
    await embyFetch(
      `/Items?${params.toString()}`,
    );

  const data: unknown =
    await response.json();

  return parseEmbyItemsResponse(
    data,
    'latest items',
  );
}

export async function getRandomEmbyMovie(): Promise<
  EmbyMovie | undefined
> {
  const countParams =
    new URLSearchParams({
      IncludeItemTypes:
        'Movie',

      Recursive:
        'true',

      Limit:
        '1',

      Fields:
        'Overview,ProductionYear,DateCreated,OriginalTitle,SortName,Status',
    });

  const countResponse =
    await embyFetch(
      `/Items?${countParams.toString()}`,
    );

  const countData: unknown =
    await countResponse.json();

  const countResult =
    parseEmbyItemsQueryResult(
      countData,
      'movie count',
    );

  const totalMovies =
    countResult.totalRecordCount;

  if (
    totalMovies === undefined
  ) {
    throw new Error(
      'Emby movie count response did not contain a valid TotalRecordCount.',
    );
  }

  if (
    totalMovies === 0
  ) {
    return undefined;
  }

  const randomIndex =
    randomInt(
      totalMovies,
    );

  const movieParams =
    new URLSearchParams({
      IncludeItemTypes:
        'Movie',

      Recursive:
        'true',

      StartIndex:
        String(
          randomIndex,
        ),

      Limit:
        '1',

      Fields:
        'Overview,ProductionYear,DateCreated,OriginalTitle,SortName,Status',
    });

  const movieResponse =
    await embyFetch(
      `/Items?${movieParams.toString()}`,
    );

  const movieData: unknown =
    await movieResponse.json();

  const movieResult =
    parseEmbyItemsQueryResult(
      movieData,
      'random movie',
    );

  return movieResult.items[0];
}

export async function getEmbyPoster(
  itemId: string,
): Promise<EmbyMediaPoster | undefined> {
  const normalizedItemId =
    normalizeEmbyItemId(itemId);

  let response: Response;

  try {
    response = await embyFetch(
      `/Items/${encodeURIComponent(normalizedItemId)}/Images/Primary?maxWidth=342&quality=90`,
    );
  } catch (error) {
    console.warn(
      `Unable to fetch Emby poster for ${normalizedItemId}:`,
      error,
    );
    return undefined;
  }

  const contentType =
    response.headers.get('content-type')
      ?.split(';', 1)[0]
      ?.trim()
      .toLowerCase();

  if (!contentType?.startsWith('image/')) {
    return undefined;
  }

  const contentLength =
    Number.parseInt(
      response.headers.get('content-length') ?? '',
      10,
    );

  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_POSTER_BYTES
  ) {
    return undefined;
  }

  const buffer =
    await response.arrayBuffer();

  if (
    buffer.byteLength === 0 ||
    buffer.byteLength > MAX_POSTER_BYTES
  ) {
    return undefined;
  }

  return {
    data: new Uint8Array(buffer),
    contentType,
  };
}
