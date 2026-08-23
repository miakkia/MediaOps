import 'dotenv/config';

const DEFAULT_TIMEOUT_MS = 5_000;
const MAX_ITEM_ID_LENGTH = 128;

function normalizeEmbyItemId(itemId: string): string {
  const normalized = itemId.trim();

  if (
    normalized.length === 0 ||
    normalized.length > MAX_ITEM_ID_LENGTH ||
    !/^[A-Za-z0-9_-]+$/.test(normalized)
  ) {
    throw new Error('Invalid Emby item ID.');
  }

  return normalized;
}

export async function getEmbyMovieRuntimeMinutes(
  itemId: string,
): Promise<number | undefined> {
  const rawUrl = process.env.EMBY_URL?.trim();
  const apiKey = process.env.EMBY_API_KEY?.trim();

  if (!rawUrl || !apiKey) {
    throw new Error('EMBY_URL and EMBY_API_KEY are required.');
  }

  const baseUrl = new URL(rawUrl).toString().replace(/\/+$/, '');
  const normalizedId = normalizeEmbyItemId(itemId);
  const params = new URLSearchParams({
    Ids: normalizedId,
    IncludeItemTypes: 'Movie',
    Recursive: 'true',
    Limit: '1',
    Fields: 'RunTimeTicks',
  });

  const response = await fetch(`${baseUrl}/Items?${params.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-Emby-Token': apiKey,
    },
    redirect: 'error',
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Emby runtime lookup failed with HTTP ${response.status}.`);
  }

  const data: unknown = await response.json();

  if (!data || typeof data !== 'object') {
    return undefined;
  }

  const items = (data as Record<string, unknown>).Items;
  if (!Array.isArray(items) || items.length === 0) {
    return undefined;
  }

  const first = items[0];
  if (!first || typeof first !== 'object') {
    return undefined;
  }

  const ticks = (first as Record<string, unknown>).RunTimeTicks;
  if (typeof ticks !== 'number' || !Number.isFinite(ticks) || ticks <= 0) {
    return undefined;
  }

  // Emby ticks are 100 ns units: 10,000,000 ticks per second.
  return ticks / 10_000_000 / 60;
}
