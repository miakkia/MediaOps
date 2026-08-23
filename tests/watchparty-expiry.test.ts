import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getWatchPartyCloseWindowAt,
  getWatchPartyExpireAt,
} from '../src/watchparty/expiry.js';

test('expires 45 minutes after the Emby runtime', () => {
  const scheduledAt = '2026-08-23T01:30:00.000Z';
  const expireAt = getWatchPartyExpireAt(scheduledAt, 130);

  assert.equal(
    expireAt,
    new Date('2026-08-23T04:25:00.000Z').getTime(),
  );
});

test('close window opens at theoretical movie end', () => {
  const scheduledAt = '2026-08-23T01:30:00.000Z';
  const closeAt = getWatchPartyCloseWindowAt(scheduledAt, 130);

  assert.equal(
    closeAt,
    new Date('2026-08-23T03:40:00.000Z').getTime(),
  );
});

test('falls back to six hours when runtime is unavailable', () => {
  const scheduledAt = '2026-08-23T01:30:00.000Z';
  const expireAt = getWatchPartyExpireAt(scheduledAt, undefined);

  assert.equal(
    expireAt,
    new Date('2026-08-23T07:30:00.000Z').getTime(),
  );
});
