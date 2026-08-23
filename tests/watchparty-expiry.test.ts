import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getWatchPartyCloseWindowAt,
  getWatchPartyExpireAt,
  WATCHPARTY_ABSOLUTE_FAILSAFE_MINUTES,
} from '../src/watchparty/expiry.js';

test('absolute failsafe expires 4.5 hours after scheduled start', () => {
  const scheduledAt = '2026-08-23T01:30:00.000Z';
  const expireAt = getWatchPartyExpireAt(scheduledAt, 130);

  assert.equal(WATCHPARTY_ABSOLUTE_FAILSAFE_MINUTES, 270);
  assert.equal(
    expireAt,
    new Date('2026-08-23T06:00:00.000Z').getTime(),
  );
});

test('absolute failsafe does not depend on movie runtime', () => {
  const scheduledAt = '2026-08-23T01:30:00.000Z';

  assert.equal(
    getWatchPartyExpireAt(scheduledAt, 90),
    getWatchPartyExpireAt(scheduledAt, 240),
  );
  assert.equal(
    getWatchPartyExpireAt(scheduledAt, undefined),
    new Date('2026-08-23T06:00:00.000Z').getTime(),
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

test('close window remains unavailable when runtime is unknown', () => {
  assert.equal(
    getWatchPartyCloseWindowAt(
      '2026-08-23T01:30:00.000Z',
      undefined,
    ),
    undefined,
  );
});
