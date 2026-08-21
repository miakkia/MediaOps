import {
  RequestProviderError,
} from '../request-provider-error.js';

const DEFAULT_TIMEOUT_MS =
  10_000;

interface OmbiClientOptions {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
}

function normalizeBaseUrl(
  value: string,
): URL {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new RequestProviderError(
      'OMBI_URL is invalid.',
      'configuration',
    );
  }

  if (
    url.protocol !== 'http:' &&
    url.protocol !== 'https:'
  ) {
    throw new RequestProviderError(
      'OMBI_URL must use http or https.',
      'configuration',
    );
  }

  url.pathname =
    url.pathname.replace(/\/+$/, '');

  return url;
}

function mapStatusError(
  status: number,
): RequestProviderError {
  if (status === 401) {
    return new RequestProviderError(
      'Ombi authentication failed.',
      'authentication',
      status,
    );
  }

  if (status === 403) {
    return new RequestProviderError(
      'Ombi access is forbidden.',
      'forbidden',
      status,
    );
  }

  if (status === 404) {
    return new RequestProviderError(
      'Ombi resource was not found.',
      'not_found',
      status,
    );
  }

  if (status === 429) {
    return new RequestProviderError(
      'Ombi rate limit was reached.',
      'rate_limited',
      status,
    );
  }

  if (status >= 500) {
    return new RequestProviderError(
      'Ombi is unavailable.',
      'unavailable',
      status,
    );
  }

  return new RequestProviderError(
    `Ombi request failed with HTTP ${status}.`,
    'request_failed',
    status,
  );
}

export class OmbiClient {
  private readonly baseUrl:
    URL;

  private readonly apiKey:
    string;

  private readonly timeoutMs:
    number;

  constructor(
    options: OmbiClientOptions,
  ) {
    const apiKey =
      options.apiKey.trim();

    if (!apiKey) {
      throw new RequestProviderError(
        'OMBI_API_KEY is missing.',
        'configuration',
      );
    }

    this.baseUrl =
      normalizeBaseUrl(
        options.baseUrl,
      );

    this.apiKey =
      apiKey;

    this.timeoutMs =
      options.timeoutMs ??
      DEFAULT_TIMEOUT_MS;
  }

  async get<T>(
    path: string,
    options?: {
      userName?: string;
    },
  ): Promise<T> {
    return this.request<T>(
      'GET',
      path,
      undefined,
      options,
    );
  }

  async post<T>(
    path: string,
    body?: unknown,
    options?: {
      userName?: string;
    },
  ): Promise<T> {
    return this.request<T>(
      'POST',
      path,
      body,
      options,
    );
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    options?: {
      userName?: string;
    },
  ): Promise<T> {
    const url =
      new URL(
        path.replace(/^\/+/, ''),
        `${this.baseUrl.toString().replace(/\/?$/, '/')}`,
      );

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => {
          controller.abort();
        },
        this.timeoutMs,
      );

    try {
      const requestInit:
        RequestInit = {
          method,

          headers: {
            ApiKey:
              this.apiKey,

            Accept:
              'application/json',

            ...(options?.userName
              ? {
                  UserName:
                    options.userName,
                }
              : {}),

            ...(body !== undefined
              ? {
                  'Content-Type':
                    'application/json',
                }
              : {}),
          },

          signal:
            controller.signal,

          redirect:
            'error',
        };

      if (body !== undefined) {
        requestInit.body =
          JSON.stringify(body);
      }

      const response =
        await fetch(
          url,
          requestInit,
        );

      if (!response.ok) {
        throw mapStatusError(
          response.status,
        );
      }

      if (
        response.status === 204
      ) {
        return undefined as T;
      }

      const contentType =
        response.headers.get(
          'content-type',
        );

      if (
        !contentType ||
        !contentType.includes(
          'application/json',
        )
      ) {
        throw new RequestProviderError(
          'Ombi returned a non-JSON response.',
          'invalid_response',
          response.status,
        );
      }

      try {
        return await response.json() as T;
      } catch {
        throw new RequestProviderError(
          'Ombi returned invalid JSON.',
          'invalid_response',
          response.status,
        );
      }
    } catch (error) {
      if (
        error instanceof
        RequestProviderError
      ) {
        throw error;
      }

      if (
        error instanceof Error &&
        error.name ===
          'AbortError'
      ) {
        throw new RequestProviderError(
          'Ombi request timed out.',
          'timeout',
        );
      }

      throw new RequestProviderError(
        'Unable to reach Ombi.',
        'unavailable',
      );
    } finally {
      clearTimeout(
        timeout,
      );
    }
  }
}

export function createOmbiClientFromEnvironment():
  OmbiClient {
  const baseUrl =
    process.env.OMBI_URL
      ?.trim();

  const apiKey =
    process.env.OMBI_API_KEY
      ?.trim();

  if (!baseUrl) {
    throw new RequestProviderError(
      'OMBI_URL is missing.',
      'configuration',
    );
  }

  if (!apiKey) {
    throw new RequestProviderError(
      'OMBI_API_KEY is missing.',
      'configuration',
    );
  }

  return new OmbiClient({
    baseUrl,
    apiKey,
  });
}
