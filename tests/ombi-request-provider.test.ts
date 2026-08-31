import assert from 'node:assert/strict';
import test from 'node:test';

import type { OmbiClient } from '../src/providers/ombi/ombi-client.js';
import { OmbiRequestProvider } from '../src/providers/ombi/ombi-request-provider.js';
import type { RequestSearchResult } from '../src/providers/request-provider.js';

function movie(): RequestSearchResult {
  return {
    providerId: '123',
    mediaType: 'movie',
    title: 'Test Movie',
    originalTitle: undefined,
    year: 2026,
    overview: undefined,
    posterUrl: undefined,
    status: 'unavailable',
    requested: false,
    available: false,
  };
}

function createFakeClient() {
  const posts: string[] = [];
  const client = {
    async get<T>(): Promise<T> {
      return undefined as T;
    },
    async post<T>(path: string): Promise<T> {
      posts.push(path);
      return { result: true, requestId: 42 } as T;
    },
  } as unknown as OmbiClient;

  return { client, posts };
}

test('TV search maps first-air year from Ombi metadata', async () => {
  const client = {
    async get<T>(): Promise<T> {
      return undefined as T;
    },
    async post<T>(path: string): Promise<T> {
      if (path.startsWith('/api/v2/Search/multi/')) {
        return [
          {
            id: 'tmdb-1437',
            title: 'Dead Like Me',
            mediaType: 'tv',
            firstAirDate: '2003-06-27',
            poster: null,
            overview: 'A grim reaper comedy-drama.',
          },
        ] as T;
      }

      return undefined as T;
    },
  } as unknown as OmbiClient;

  const provider = new OmbiRequestProvider(client);
  const results = await provider.search('Dead Like Me', 'series');

  assert.equal(results.length, 1);
  assert.equal(results[0]?.title, 'Dead Like Me');
  assert.equal(results[0]?.year, 2003);
});

test('TV search falls back to a year embedded in the title', async () => {
  const client = {
    async get<T>(): Promise<T> {
      return undefined as T;
    },
    async post<T>(path: string): Promise<T> {
      if (path.startsWith('/api/v2/Search/multi/')) {
        return [
          {
            id: '42',
            title: 'Example Show (2019)',
            mediaType: 'tv',
          },
        ] as T;
      }

      return undefined as T;
    },
  } as unknown as OmbiClient;

  const provider = new OmbiRequestProvider(client);
  const results = await provider.search('Example Show', 'series');

  assert.equal(results[0]?.title, 'Example Show');
  assert.equal(results[0]?.year, 2019);
});

test('Ombi creates a movie request without forcing approval', async () => {
  const { client, posts } = createFakeClient();
  const provider = new OmbiRequestProvider(client);

  const result = await provider.request(movie());

  assert.equal(result.success, true);
  assert.equal(result.status, 'pending');
  assert.equal(result.providerRequestId, '42');
  assert.deepEqual(posts, ['/api/v1/Request/movie']);
});

test('Ombi reports approval as provider-owned capability', async () => {
  const { client } = createFakeClient();
  const provider = new OmbiRequestProvider(client);

  const capabilities = await provider.getCapabilities();

  assert.equal(capabilities.autoApproval, false);
  assert.equal(capabilities.requestStatus, false);
});

test('Discord requester is submitted to Ombi under the mapped Ombi username', async () => {
  const requestPosts: Array<{
    path: string;
    userName: string | undefined;
  }> = [];

  const client = {
    async get<T>(
      path: string,
    ): Promise<T> {
      if (path === '/api/v1/Identity/Users') {
        return [
          {
            id: 'ombi-user-1',
            userName: 'Miakia',
          },
        ] as T;
      }

      if (path.includes('/api/v1/Identity/notificationpreferences/')) {
        return [
          {
            userId: 'ombi-user-1',
            agent: 1,
            enabled: true,
            value: 'discord-user-123',
          },
        ] as T;
      }

      return undefined as T;
    },

    async post<T>(
      path: string,
      _body?: unknown,
      options?: { userName?: string },
    ): Promise<T> {
      requestPosts.push({
        path,
        userName: options?.userName,
      });

      return {
        result: true,
        requestId: 42,
      } as T;
    },
  } as unknown as OmbiClient;

  const provider = new OmbiRequestProvider(client);

  const result = await provider.request(
    movie(),
    {
      requester: {
        source: 'discord',
        id: 'discord-user-123',
      },
    },
  );

  assert.equal(result.status, 'pending');
  assert.deepEqual(requestPosts, [
    {
      path: '/api/v1/Request/movie',
      userName: 'Miakia',
    },
  ]);
});

test('unmapped Discord requester is rejected instead of falling back to API identity', async () => {
  const posts: string[] = [];
  const client = {
    async get<T>(path: string): Promise<T> {
      if (path === '/api/v1/Identity/Users') {
        return [] as T;
      }
      return [] as T;
    },
    async post<T>(path: string): Promise<T> {
      posts.push(path);
      return { result: true, requestId: 42 } as T;
    },
  } as unknown as OmbiClient;

  const provider = new OmbiRequestProvider(client);
  const result = await provider.request(movie(), {
    requester: {
      source: 'discord',
      id: 'unmapped-discord-user',
    },
  });

  assert.equal(result.success, false);
  assert.equal(result.providerRequestId, undefined);
  assert.match(result.message ?? '', /not mapped/i);
  assert.deepEqual(posts, []);
});
