import 'dotenv/config';

const DEFAULT_TIMEOUT_MS = 5_000;
const PARTY_CODE_PATTERN = /^[A-Z0-9]{5}$/;

const rawWatchPartyUrl = process.env.WATCHPARTY_URL?.trim();
const rawWatchPartyInternalUrl =
  process.env.WATCHPARTY_INTERNAL_URL?.trim();

if (!rawWatchPartyUrl) {
  throw new Error('WATCHPARTY_URL is required.');
}

function parseWatchPartyUrl(
  value: string,
  name: string,
): URL {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`${name} must use HTTP or HTTPS.`);
  }

  return url;
}

const watchPartyUrl =
  parseWatchPartyUrl(
    rawWatchPartyUrl,
    'WATCHPARTY_URL',
  );

const watchPartyInternalUrl =
  rawWatchPartyInternalUrl
    ? parseWatchPartyUrl(
        rawWatchPartyInternalUrl,
        'WATCHPARTY_INTERNAL_URL',
      )
    : watchPartyUrl;

const baseUrl =
  watchPartyUrl.toString().replace(/\/+$/, '');
const internalBaseUrl =
  watchPartyInternalUrl.toString().replace(/\/+$/, '');

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

export interface CreatedWatchParty {
  partyCode: string;
  joinUrl: string;
  hostUsername: string;
}

export async function createWatchParty(): Promise<CreatedWatchParty> {
  const username =
    process.env.WATCHPARTY_EMBY_USER?.trim();
  const password =
    process.env.WATCHPARTY_EMBY_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'WATCHPARTY_EMBY_USER and WATCHPARTY_EMBY_PASSWORD are required to create a Watch Party.',
    );
  }

  let response: Response;

  try {
    response = await fetch(
      `${internalBaseUrl}/api/party/create`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: 'mediaops-discord-bot',
          display_name: 'MediaOps',
          username,
          password,
        }),
        redirect: 'error',
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      },
    );
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'TimeoutError'
    ) {
      throw new Error('Watch Party creation timed out.');
    }

    throw error;
  }

  if (!response.ok) {
    throw new Error(
      `Watch Party creation failed with HTTP ${response.status}.`,
    );
  }

  const data: unknown = await response.json();

  if (!data || typeof data !== 'object') {
    throw new Error('Watch Party returned an invalid create response.');
  }

  const record = data as Record<string, unknown>;
  const partyCode =
    typeof record.party_id === 'string'
      ? record.party_id.trim().toUpperCase()
      : '';
  const hostUsername =
    typeof record.host_username === 'string'
      ? record.host_username
      : '';
  const message =
    typeof record.message === 'string'
      ? record.message
      : undefined;

  if (
    !PARTY_CODE_PATTERN.test(partyCode) ||
    record.is_host !== true ||
    !hostUsername
  ) {
    throw new Error(
      message ||
        'Watch Party was created without an authenticated host.',
    );
  }

  return {
    partyCode,
    joinUrl: getWatchPartyJoinUrl(partyCode),
    hostUsername,
  };
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
