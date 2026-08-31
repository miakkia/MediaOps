const DEFAULT_TIMEOUT_MS = 10_000;

interface SeerrConfig {
  baseUrl: string;
  apiKey: string;
}

function getSeerrConfig(): SeerrConfig {
  const rawUrl =
    process.env.SEERR_URL?.trim();

  const apiKey =
    process.env.SEERR_API_KEY?.trim();

  if (
    !rawUrl ||
    !apiKey
  ) {
    throw new Error(
      'SEERR_URL and SEERR_API_KEY are required when REQUEST_PROVIDER=seerr.',
    );
  }

  let url: URL;

  try {
    url =
      new URL(
        rawUrl,
      );
  } catch {
    throw new Error(
      'SEERR_URL must be a valid URL.',
    );
  }

  if (
    ![
      'http:',
      'https:',
    ].includes(
      url.protocol,
    )
  ) {
    throw new Error(
      'SEERR_URL must use HTTP or HTTPS.',
    );
  }

  return {
    baseUrl:
      url
        .toString()
        .replace(
          /\/+$/,
          '',
        ),

    apiKey,
  };
}

export async function seerrFetch(
  path: string,
  options?: {
    method?: 'GET' | 'POST';
    body?: unknown;
    timeoutMs?: number;
  },
): Promise<Response> {
  const {
    baseUrl,
    apiKey,
  } = getSeerrConfig();

  if (
    !path.startsWith('/') ||
    path.startsWith('//')
  ) {
    throw new Error(
      'Invalid Seerr API path.',
    );
  }

  const method =
    options?.method ??
    'GET';

  const headers =
    new Headers();

  headers.set(
    'Accept',
    'application/json',
  );

  headers.set(
    'X-Api-Key',
    apiKey,
  );

  let body: string | undefined;

  if (
    options?.body !== undefined
  ) {
    headers.set(
      'Content-Type',
      'application/json',
    );

    body =
      JSON.stringify(
        options.body,
      );
  }

    try {
    const requestInit: RequestInit = {
      method,
      headers,

      redirect:
        'error',

      signal:
        AbortSignal.timeout(
          options?.timeoutMs ??
          DEFAULT_TIMEOUT_MS,
        ),
    };

    if (body !== undefined) {
      requestInit.body =
        body;
    }

    const response =
      await fetch(
        `${baseUrl}/api/v1${path}`,
        requestInit,
      );

    if (!response.ok) {
      throw new Error(
        `Seerr API request failed with HTTP ${response.status}.`,
      );
    }

    return response;
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'TimeoutError'
    ) {
      throw new Error(
        'Seerr API request timed out.',
      );
    }

    throw error;
  }
}