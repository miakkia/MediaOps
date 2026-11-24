import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isServiceUnavailable, startRequestTrackerLoop } from '../../src/request/request-tracker.js';

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


test('tracker backs off, caps retry delay, recovers and never schedules overlapping scans', async () => {
  const scheduled: Array<{ run: () => void; delay: number }> = [];
  let calls = 0;
  let release: (() => void) | undefined;
  const gate = new Promise<void>(resolve => { release = resolve; });
  startRequestTrackerLoop(async () => {
    calls++;
    if (calls === 1) await gate;
    if (calls <= 5 || calls === 7) throw new Error('Jellyfin API request failed with HTTP 503.');
  }, (run, delay) => { scheduled.push({ run, delay }); });
  const flush = () => new Promise<void>(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
  assert.equal(scheduled.length, 0);
  release?.();
  await flush();
  for (const expected of [5000, 15000, 30000, 60000, 60000, 300000, 5000]) {
    assert.equal(scheduled.length, 1);
    const next = scheduled.shift()!;
    assert.equal(next.delay, expected);
    next.run();
    await flush();
  }
  assert.equal(calls, 8);
  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0]?.delay, 300000);
});
