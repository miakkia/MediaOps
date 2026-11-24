import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isServiceUnavailable } from '../../src/request/request-tracker.js';

test('provider gateway errors are retryable for Emby and Jellyfin', () => {
  for (const provider of ['Emby', 'Jellyfin']) {
    for (const status of [502, 503, 504]) {
      assert.equal(isServiceUnavailable(new Error(`${provider} API request failed with HTTP ${status}.`)), true);
    }
    for (const status of [400, 401, 403, 404]) {
      assert.equal(isServiceUnavailable(new Error(`${provider} API request failed with HTTP ${status}.`)), false);
    }
  }
});

test('native fetch timeouts and network errors are retryable', () => {
  assert.equal(isServiceUnavailable(new DOMException('The operation was aborted due to timeout', 'TimeoutError')), true);
  assert.equal(isServiceUnavailable(new TypeError('fetch failed')), true);
  assert.equal(isServiceUnavailable(new Error('unrelated error')), false);
  assert.equal(isServiceUnavailable(null), false);
});
