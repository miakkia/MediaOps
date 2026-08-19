import 'dotenv/config';

const DEFAULT_TIMEOUT_MS = 5_000;
const MAX_SEARCH_RESULTS = 5;
const MAX_LATEST_RESULTS = 5;
const MAX_SEARCH_LENGTH = 100;

export interface EmbySystemInfo {
  ServerName: string | undefined;
  Version: string | undefined;
}

export type EmbyMediaType = 'Movie' | 'Series';

export interface EmbyMediaItem {
  id: string;
  name: string;
  year: number | undefined;
  overview: string | undefined;
  type: EmbyMediaType | undefined;
  dateCreated: string | undefined;
}

export type EmbyMovie = EmbyMediaItem;
export type EmbySeries = EmbyMediaItem;

const rawEmbyUrl = process.env.EMBY_URL?.trim();
const rawEmbyApiKey = process.env.EMBY_API_KEY?.trim();

if (!rawEmbyUrl || !rawEmbyApiKey) {
  throw new Error('EMBY_URL and EMBY_API_KEY are required.');
}

const embyApiKey: string = rawEmbyApiKey;

let embyUrl: URL;

try {
  embyUrl = new URL(rawEmbyUrl);
} catch {
  throw new Error('EMBY_URL must be a valid URL.');
}

if (!['http:', 'https:'].includes(embyUrl.protocol)) {
  throw new Error('EMBY_URL must use HTTP or HTTPS.');
}

const baseUrl = embyUrl.toString().replace(/\/+$/, '');

async function embyFetch(
  path: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Emby-Token': embyApiKey,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

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
      throw new Error('Emby API request timed out.');
    }

    throw error;
  }
}

function parseEmbyMediaItem(
  value: unknown,
): EmbyMediaItem | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const item = value as Record<string, unknown>;

  if (
    typeof item.Id !== 'string' ||
    typeof item.Name !== 'string'
  ) {
    return undefined;
  }

  const type: EmbyMediaType | undefined =
    item.Type === 'Movie' || item.Type === 'Series'
      ? item.Type
      : undefined;

  return {
    id: item.Id,
    name: item.Name,
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
  };
}

function parseEmbyItemsResponse(
  data: unknown,
  context: string,
): EmbyMediaItem[] {
  if (!data || typeof data !== 'object') {
    throw new Error(
      `Emby returned an invalid ${context} response.`,
    );
  }

  const record = data as Record<string, unknown>;

  if (!Array.isArray(record.Items)) {
    throw new Error(
      `Emby returned an invalid ${context} response.`,
    );
  }

  const items: EmbyMediaItem[] = [];

  for (const item of record.Items) {
    const parsedItem = parseEmbyMediaItem(item);

    if (parsedItem) {
      items.push(parsedItem);
    }
  }

  return items;
}

function normalizeSearchTerm(
  searchTerm: string,
  mediaLabel: string,
): string {
  const normalizedSearchTerm = searchTerm.trim();

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

async function searchEmbyItems(
  searchTerm: string,
  includeItemType: EmbyMediaType,
): Promise<EmbyMediaItem[]> {
  const normalizedSearchTerm = normalizeSearchTerm(
    searchTerm,
    includeItemType,
  );

  const params = new URLSearchParams({
    SearchTerm: normalizedSearchTerm,
    IncludeItemTypes: includeItemType,
    Recursive: 'true',
    Limit: String(MAX_SEARCH_RESULTS),
    Fields: 'Overview,ProductionYear,DateCreated',
  });

  const response = await embyFetch(
    `/Items?${params.toString()}`,
  );

  const data: unknown = await response.json();

  return parseEmbyItemsResponse(
    data,
    `${includeItemType.toLowerCase()} search`,
  );
}

export async function getEmbySystemInfo(): Promise<EmbySystemInfo> {
  const response = await embyFetch('/System/Info');
  const data: unknown = await response.json();

  if (!data || typeof data !== 'object') {
    throw new Error(
      'Emby returned an invalid system information response.',
    );
  }

  const record = data as Record<string, unknown>;

  return {
    ServerName:
      typeof record.ServerName === 'string'
        ? record.ServerName
        : undefined,
    Version:
      typeof record.Version === 'string'
        ? record.Version
        : undefined,
  };
}

export async function searchEmbyMovies(
  searchTerm: string,
): Promise<EmbyMovie[]> {
  return searchEmbyItems(searchTerm, 'Movie');
}

export async function searchEmbySeries(
  searchTerm: string,
): Promise<EmbySeries[]> {
  return searchEmbyItems(searchTerm, 'Series');
}

export async function getLatestEmbyItems(): Promise<EmbyMediaItem[]> {
  const params = new URLSearchParams({
    IncludeItemTypes: 'Movie,Series',
    Recursive: 'true',
    SortBy: 'DateCreated',
    SortOrder: 'Descending',
    Limit: String(MAX_LATEST_RESULTS),
    Fields: 'Overview,ProductionYear,DateCreated',
  });

  const response = await embyFetch(
    `/Items?${params.toString()}`,
  );

  const data: unknown = await response.json();

  return parseEmbyItemsResponse(data, 'latest items');
}