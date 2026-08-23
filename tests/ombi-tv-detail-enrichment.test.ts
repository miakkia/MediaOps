import assert from 'node:assert/strict';
import test from 'node:test';

import type { OmbiClient } from '../src/providers/ombi/ombi-client.js';
import { OmbiRequestProvider } from '../src/providers/ombi/ombi-request-provider.js';

function providerWith(detail: unknown, detailError = false) {
  const gets: string[] = [];
  const client = {
    async get<T>(path: string): Promise<T> {
      gets.push(path);
      if (detailError) throw new Error('detail unavailable');
      return detail as T;
    },
    async post<T>(path: string): Promise<T> {
      if (path.startsWith('/api/v2/Search/multi/')) {
        return [{
          id: '2566', mediaType: 'tv', title: 'Dead Like Me',
          poster: '/poster.jpg', overview: 'A grim reaper comedy-drama.',
        }] as T;
      }
      return undefined as T;
    },
  } as unknown as OmbiClient;
  return { provider: new OmbiRequestProvider(client, { autoApprove: false }), gets };
}

test('TV multi-search is enriched with Ombi detail year and availability', async () => {
  const { provider, gets } = providerWith({
    title: 'Dead Like Me', firstAired: '2003-06-27', theMovieDbId: '2566',
    theTvDbId: '72129', requested: false, requestId: 0,
    available: true, fullyAvailable: true, partlyAvailable: false,
  });
  const results = await provider.search('Dead Like Me', 'series');
  assert.equal(results.length, 1);
  assert.equal(results[0]?.providerId, '2566');
  assert.equal(results[0]?.year, 2003);
  assert.equal(results[0]?.available, true);
  assert.equal(results[0]?.requested, false);
  assert.equal(results[0]?.status, 'available');
  assert.deepEqual(gets, ['/api/v2/Search/tv/moviedb/2566']);
});

test('TV multi-search uses detailed requested state', async () => {
  const { provider } = providerWith({
    firstAired: '2024-01-01', requested: true, requestId: 99,
    available: false, fullyAvailable: false,
  });
  const results = await provider.search('Dead Like Me', 'series');
  assert.equal(results[0]?.requested, true);
  assert.equal(results[0]?.available, false);
  assert.equal(results[0]?.status, 'requested');
});

test('TV search degrades safely when Ombi detail lookup fails', async () => {
  const { provider } = providerWith(undefined, true);
  const results = await provider.search('Dead Like Me', 'series');
  assert.equal(results.length, 1);
  assert.equal(results[0]?.providerId, '2566');
  assert.equal(results[0]?.title, 'Dead Like Me');
  assert.equal(results[0]?.available, false);
  assert.equal(results[0]?.requested, false);
});
