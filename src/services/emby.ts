import 'dotenv/config';

const DEFAULT_TIMEOUT_MS = 5_000;

export interface EmbySystemInfo {
  ServerName: string | undefined;
  Version: string | undefined;
}

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