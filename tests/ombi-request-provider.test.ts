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
      if (path.endsWith('/approve')) {
        return { result: true, requestId: 42 } as T;
      }
      return { result: true, requestId: 42 } as T;
    },
  } as unknown as OmbiClient;

  return { client, posts };
}

test('OMBI_AUTO_APPROVE=false creates request without approval call', async () => {
  const { client, posts } = createFakeClient();
  const provider = new OmbiRequestProvider(client, { autoApprove: false });

  const result = await provider.request(movie());

  assert.equal(result.success, true);
  assert.equal(result.status, 'pending');
  assert.deepEqual(posts, ['/api/v1/Request/movie']);
});

test('OMBI_AUTO_APPROVE=true creates request then approves it', async () => {
  const { client, posts } = createFakeClient();
  const provider = new OmbiRequestProvider(client, { autoApprove: true });

  const result = await provider.request(movie());

  assert.equal(result.success, true);
  assert.equal(result.status, 'approved');
  assert.deepEqual(posts, [
    '/api/v1/Request/movie',
    '/api/v1/Request/movie/approve',
  ]);
});

test('per-request false override never approves', async () => {
  const { client, posts } = createFakeClient();
  const provider = new OmbiRequestProvider(client, { autoApprove: true });

  const result = await provider.request(movie(), { autoApprove: false });

  assert.equal(result.status, 'pending');
  assert.deepEqual(posts, ['/api/v1/Request/movie']);
});

test('failed automatic approval leaves created request pending', async () => {
  const posts: string[] = [];
  const client = {
    async get<T>(): Promise<T> {
      return undefined as T;
    },
    async post<T>(path: string): Promise<T> {
      posts.push(path);
      if (path.endsWith('/approve')) {
        return { result: false, isError: true, errorMessage: 'Approval denied' } as T;
      }
      return { result: true, requestId: 42 } as T;
    },
  } as unknown as OmbiClient;

  const provider = new OmbiRequestProvider(client, { autoApprove: true });
  const result = await provider.request(movie());

  assert.equal(result.success, true);
  assert.equal(result.status, 'pending');
  assert.deepEqual(posts, [
    '/api/v1/Request/movie',
    '/api/v1/Request/movie/approve',
  ]);
});
