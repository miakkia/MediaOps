import 'dotenv/config';

const DEFAULT_TIMEOUT_MS = 5_000;
const PARTY_CODE_PATTERN = /^[A-Z0-9]{5}$/;

const rawWatchPartyUrl = process.env.WATCHPARTY_URL?.trim();

if (!rawWatchPartyUrl) {
  throw new Error('WATCHPARTY_URL is required.');
}

let watchPartyUrl: URL;

try {
  watchPartyUrl = new URL(rawWatchPartyUrl);
} catch {
  throw new Error('WATCHPARTY_URL must be a valid URL.');
}

if (!['http:', 'https:'].includes(watchPartyUrl.protocol)) {
  throw new Error('WATCHPARTY_URL must use HTTP or HTTPS.');
}

const baseUrl = watchPartyUrl.toString().replace(/\/+$/, '');

function normalizePartyCode(partyCode: string): string {
  const normalizedPartyCode = partyCode.trim().toUpperCase();

  if (!PARTY_CODE_PATTERN.test(normalizedPartyCode)) {
    throw new Error('Invalid Watch Party code.');
  }

  return normalizedPartyCode;
}

async function watchPartyFetch(
  path: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      redirect: 'error',
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new Error(
        `Watch Party API request failed with HTTP ${response.status}.`,
      );
    }

    return response;
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'TimeoutError'
    ) {
      throw new Error('Watch Party API request timed out.');
    }

    throw error;
  }
}

export async function watchPartyExists(
  partyCode: string,
): Promise<boolean> {
  const normalizedPartyCode = normalizePartyCode(partyCode);

  const response = await watchPartyFetch(
    `/api/party/${encodeURIComponent(normalizedPartyCode)}/exists`,
  );

  const data: unknown = await response.json();

  if (!data || typeof data !== 'object') {
    throw new Error(
      'Watch Party returned an invalid party-exists response.',
    );
  }

  const record = data as Record<string, unknown>;

  if (typeof record.exists !== 'boolean') {
    throw new Error(
      'Watch Party returned an invalid party-exists response.',
    );
  }

  return record.exists;
}

export function getWatchPartyUrl(): string {
  return baseUrl;
}

export function getWatchPartyJoinUrl(
  partyCode: string,
): string {
  const normalizedPartyCode = normalizePartyCode(partyCode);

  const url = new URL(baseUrl);

  url.searchParams.set('party', normalizedPartyCode);

  return url.toString();
}