import assert from 'node:assert/strict';
import test from 'node:test';

import type { MediaProvider } from '../src/providers/media-provider.js';
import {
  isAvailableWithProvider,
  matchesTrackedRequest,
} from '../src/request/request-tracker.js';

const baseItem = {
  id: 'emby-1',
  originalTitle: undefined,
  sortName: undefined,
  overview: undefined,
  type: 'Series' as const,
  dateCreated: undefined,
};

test('matches tracked media by normalized title and year', () => {
  assert.equal(
    matchesTrackedRequest(
      {
        ...baseItem,
        name: 'Dead Like Me',
        year: 2003,
      },
      'Dead Like Me',
      2003,
    ),
    true,
  );
});

test('series availability is read from the media server provider', async () => {
  let seriesSearches = 0;
  const provider = {
    name: 'Fake',
    async getSystemInfo() { return { serverName: 'Fake', version: '1' }; },
    async searchMovies() { return []; },
    async searchSeries(searchTerm: string) {
      seriesSearches += 1;
      assert.equal(searchTerm, 'Dead Like Me');
      return [
        {
          ...baseItem,
          name: 'Dead Like Me',
          year: 2003,
        },
      ];
    },
    async getLatestItems() { return []; },
    async getRandomMovie() { return undefined; },
    async getMovieById() { return undefined; },
  } satisfies MediaProvider;

  const available = await isAvailableWithProvider(
    provider,
    'Dead Like Me',
    2003,
    'series',
  );

  assert.equal(available, true);
  assert.equal(seriesSearches, 1);
});

test('movie availability is read from the media server provider', async () => {
  const provider = {
    name: 'Fake',
    async getSystemInfo() { return { serverName: 'Fake', version: '1' }; },
    async searchMovies(searchTerm: string) {
      assert.equal(searchTerm, 'Test Movie');
      return [
        {
          id: 'emby-movie-1',
          name: 'Test Movie',
          originalTitle: undefined,
          sortName: undefined,
          year: 2026,
          overview: undefined,
          type: 'Movie' as const,
          dateCreated: undefined,
        },
      ];
    },
    async searchSeries() { return []; },
    async getLatestItems() { return []; },
    async getRandomMovie() { return undefined; },
    async getMovieById() { return undefined; },
  } satisfies MediaProvider;

  assert.equal(
    await isAvailableWithProvider(provider, 'Test Movie', 2026, 'movie'),
    true,
  );
});
