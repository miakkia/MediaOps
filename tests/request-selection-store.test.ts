import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';

import type {
  RequestSearchResult,
} from '../src/providers/request-provider.js';
import {
  clearRequestSelectionsForTests,
  consumeRequestSelection,
  getRequestSelection,
  storeRequestSelection,
} from '../src/request/request-selection-store.js';

function movie(): RequestSearchResult {
  return {
    providerId: '123',
    mediaType: 'movie',
    title: 'Test Movie',
    originalTitle: undefined,
    year: 2026,
    overview: 'Overview',
    posterUrl: undefined,
    status: 'unavailable',
    requested: false,
    available: false,
  };
}

afterEach(() => {
  clearRequestSelectionsForTests();
});

test('preserves full request selection context', () => {
  const token = storeRequestSelection('discord-user-1', movie());
  const selected = getRequestSelection(token, 'discord-user-1');

  assert.ok(selected);
  assert.equal(selected.title, 'Test Movie');
  assert.equal(selected.year, 2026);
  assert.equal(selected.providerId, '123');
});

test('selection token is bound to the Discord requester', () => {
  const token = storeRequestSelection('discord-user-1', movie());

  assert.equal(
    getRequestSelection(token, 'discord-user-2'),
    undefined,
  );

  assert.ok(
    getRequestSelection(token, 'discord-user-1'),
  );
});

test('consuming a selection makes it single-use', () => {
  const token = storeRequestSelection('discord-user-1', movie());

  const first = consumeRequestSelection(token, 'discord-user-1');
  const second = consumeRequestSelection(token, 'discord-user-1');

  assert.ok(first);
  assert.equal(second, undefined);
});

test('expired selections are rejected', async () => {
  const token = storeRequestSelection(
    'discord-user-1',
    movie(),
    1,
  );

  await new Promise(resolve => setTimeout(resolve, 5));

  assert.equal(
    getRequestSelection(token, 'discord-user-1'),
    undefined,
  );
});
