const DEFAULT_TIMEOUT_MS = 10_000;

interface JellyfinConfig {
  baseUrl: string;
  apiKey: string;
}

function getJellyfinConfig(): JellyfinConfig {
  const rawUrl =
    process.env.JELLYFIN_URL?.trim();

  const apiKey =
    process.env.JELLYFIN_API_KEY?.trim();

  if (
    !rawUrl ||
    !apiKey
  ) {
    throw new Error(
      'JELLYFIN_URL and JELLYFIN_API_KEY are required when MEDIA_PROVIDER=jellyfin.',
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
      'JELLYFIN_URL must be a valid URL.',
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
      'JELLYFIN_URL must use HTTP or HTTPS.',
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

export async function jellyfinFetch(
  path: string,
  timeoutMs =
    DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const {
    baseUrl,
    apiKey,
  } = getJellyfinConfig();

  if (
    !path.startsWith('/')
  ) {
    throw new Error(
      'Invalid Jellyfin API path.',
    );
  }

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
              apiKey,
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
        `Jellyfin API request failed with HTTP ${response.status}.`,
      );
    }

    return response;
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === 'TimeoutError'
    ) {
      throw new Error(
        'Jellyfin API request timed out.',
      );
    }

    throw error;
  }
}